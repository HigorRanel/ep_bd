package com.barbearia.app.activities;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.barbearia.app.R;
import com.barbearia.app.api.ApiClient;
import com.barbearia.app.api.BarbeariaApi;
import com.barbearia.app.models.User;
import com.barbearia.app.models.responses.ApiResponse;
import com.barbearia.app.utils.SessionManager;
import com.barbearia.app.utils.Utils;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Activity para editar os dados do perfil do cliente.
 */
public class EditProfileActivity extends AppCompatActivity {

    private EditText editNome;
    private EditText editTelefone;
    private EditText editEndereco;
    private EditText editEmail;
    private Button btnSalvar;
    private ProgressBar progressBar;

    private BarbeariaApi api;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_edit_profile);

        api = ApiClient.getApiService(this);
        sessionManager = new SessionManager(this);

        initViews();
        preencherDados();
        setupListeners();

        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle(getString(R.string.edit_profile));
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }
    }

    private void initViews() {
        editNome = findViewById(R.id.edit_nome);
        editTelefone = findViewById(R.id.edit_telefone);
        editEndereco = findViewById(R.id.edit_endereco);
        editEmail = findViewById(R.id.edit_email);
        btnSalvar = findViewById(R.id.btn_salvar);
        progressBar = findViewById(R.id.progress_bar);
        progressBar.setVisibility(View.GONE);
    }

    private void preencherDados() {
        User user = sessionManager.getUser();
        if (user != null) {
            editNome.setText(user.getNome());
            editEmail.setText(user.getEmail());
            if (user.getTelefone() != null) editTelefone.setText(user.getTelefone());
            if (user.getEndereco() != null) editEndereco.setText(user.getEndereco());
        }
    }

    private void setupListeners() {
        btnSalvar.setOnClickListener(v -> salvarPerfil());
    }

    private void salvarPerfil() {
        String nome = editNome.getText().toString().trim();
        String email = editEmail.getText().toString().trim();
        String telefone = editTelefone.getText().toString().trim();
        String endereco = editEndereco.getText().toString().trim();

        // Validações
        if (nome.isEmpty()) {
            editNome.setError(getString(R.string.error_field_required));
            editNome.requestFocus();
            return;
        }
        if (email.isEmpty() || !Utils.isValidEmail(email)) {
            editEmail.setError(getString(R.string.error_invalid_email));
            editEmail.requestFocus();
            return;
        }
        if (!Utils.isNetworkAvailable(this)) {
            Toast.makeText(this, getString(R.string.error_network), Toast.LENGTH_SHORT).show();
            return;
        }

        setLoading(true);

        Map<String, String> dados = new HashMap<>();
        dados.put("nome_completo", nome);
        dados.put("email", email);
        if (!telefone.isEmpty()) dados.put("telefone", telefone);
        if (!endereco.isEmpty()) dados.put("endereco", endereco);

        Call<ApiResponse<Map<String, Object>>> call = api.atualizarMeusDados(dados);
        call.enqueue(new Callback<ApiResponse<Map<String, Object>>>() {
            @Override
            public void onResponse(Call<ApiResponse<Map<String, Object>>> call,
                                   Response<ApiResponse<Map<String, Object>>> response) {
                runOnUiThread(() -> {
                    setLoading(false);
                    if (response.isSuccessful()) {
                        // Atualizar dados locais
                        User user = sessionManager.getUser();
                        if (user != null) {
                            user.setNome(nome);
                            user.setEmail(email);
                            user.setTelefone(telefone);
                            user.setEndereco(endereco);
                            sessionManager.updateUser(user);
                        }
                        Toast.makeText(EditProfileActivity.this,
                                getString(R.string.success_profile_updated),
                                Toast.LENGTH_SHORT).show();
                        setResult(RESULT_OK);
                        finish();
                    } else {
                        Toast.makeText(EditProfileActivity.this,
                                getString(R.string.error_generic), Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onFailure(Call<ApiResponse<Map<String, Object>>> call, Throwable t) {
                runOnUiThread(() -> {
                    setLoading(false);
                    Toast.makeText(EditProfileActivity.this,
                            getString(R.string.error_network), Toast.LENGTH_SHORT).show();
                });
            }
        });
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        btnSalvar.setEnabled(!loading);
        editNome.setEnabled(!loading);
        editEmail.setEnabled(!loading);
        editTelefone.setEnabled(!loading);
        editEndereco.setEnabled(!loading);
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
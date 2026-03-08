package com.barbearia.app.activities;

import android.app.DatePickerDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.barbearia.app.R;
import com.barbearia.app.controllers.AuthController;
import com.barbearia.app.models.responses.AuthResponse;
import com.barbearia.app.utils.Utils;

import java.util.Calendar;

/**
 * Activity de cadastro de novo cliente
 */
public class RegisterActivity extends AppCompatActivity {
    
    private EditText editCpf;
    private EditText editNome;
    private EditText editEmail;
    private EditText editTelefone;
    private EditText editDataNascimento;
    private EditText editEndereco;
    private EditText editSenha;
    private EditText editConfirmarSenha;
    private Button btnRegister;
    private TextView txtLogin;
    private ProgressBar progressBar;
    
    private AuthController authController;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);
        
        authController = new AuthController(this);
        
        initViews();
        setupListeners();
    }
    
    private void initViews() {
        editCpf = findViewById(R.id.edit_cpf);
        editNome = findViewById(R.id.edit_nome);
        editEmail = findViewById(R.id.edit_email);
        editTelefone = findViewById(R.id.edit_telefone);
        editDataNascimento = findViewById(R.id.edit_data_nascimento);
        editEndereco = findViewById(R.id.edit_endereco);
        editSenha = findViewById(R.id.edit_senha);
        editConfirmarSenha = findViewById(R.id.edit_confirmar_senha);
        btnRegister = findViewById(R.id.btn_register);
        txtLogin = findViewById(R.id.txt_login);
        progressBar = findViewById(R.id.progress_bar);
        
        progressBar.setVisibility(View.GONE);
    }
    
    private void setupListeners() {
        btnRegister.setOnClickListener(v -> realizarCadastro());
        
        txtLogin.setOnClickListener(v -> {
            finish();
        });
        
        // DatePicker para data de nascimento
        editDataNascimento.setOnClickListener(v -> mostrarDatePicker());
        editDataNascimento.setFocusable(false);
    }
    
    private void mostrarDatePicker() {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR) - 18; // Sugerir 18 anos atrás
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        
        DatePickerDialog datePickerDialog = new DatePickerDialog(
                this,
                (view, selectedYear, selectedMonth, selectedDay) -> {
                    String data = String.format("%02d/%02d/%04d", selectedDay, selectedMonth + 1, selectedYear);
                    editDataNascimento.setText(data);
                },
                year, month, day
        );
        
        // Definir data máxima (hoje)
        datePickerDialog.getDatePicker().setMaxDate(System.currentTimeMillis());
        
        // Definir data mínima (120 anos atrás)
        calendar.add(Calendar.YEAR, -120);
        datePickerDialog.getDatePicker().setMinDate(calendar.getTimeInMillis());
        
        datePickerDialog.show();
    }
    
    private void realizarCadastro() {
        // Obter valores
        String cpf = editCpf.getText().toString().trim().replaceAll("[^0-9]", "");
        String nome = editNome.getText().toString().trim();
        String email = editEmail.getText().toString().trim();
        String telefone = editTelefone.getText().toString().trim();
        String dataNascimento = editDataNascimento.getText().toString().trim();
        String endereco = editEndereco.getText().toString().trim();
        String senha = editSenha.getText().toString();
        String confirmarSenha = editConfirmarSenha.getText().toString();
        
        // Validar
        if (!validarCampos(cpf, nome, email, dataNascimento, senha, confirmarSenha)) {
            return;
        }
        
        // Verificar conexão
        if (!Utils.isNetworkAvailable(this)) {
            Toast.makeText(this, getString(R.string.error_network), Toast.LENGTH_SHORT).show();
            return;
        }
        
        // Converter data para formato da API (yyyy-MM-dd)
        String dataNascimentoApi = Utils.convertDateToApi(dataNascimento);
        
        // Mostrar loading
        setLoading(true);
        
        // Registrar
        authController.registerCliente(
                cpf, nome, dataNascimentoApi, email, senha, telefone, endereco,
                new AuthController.AuthCallback() {
                    @Override
                    public void onSuccess(AuthResponse response) {
                        runOnUiThread(() -> {
                            setLoading(false);
                            Toast.makeText(RegisterActivity.this,
                                    getString(R.string.success_registration),
                                    Toast.LENGTH_SHORT).show();
                            navegarParaMain();
                        });
                    }
                    
                    @Override
                    public void onError(String errorMessage) {
                        runOnUiThread(() -> {
                            setLoading(false);
                            Toast.makeText(RegisterActivity.this,
                                    errorMessage != null ? errorMessage : getString(R.string.error_registration_failed),
                                    Toast.LENGTH_LONG).show();
                        });
                    }
                }
        );
    }
    
    private boolean validarCampos(String cpf, String nome, String email, 
                                  String dataNascimento, String senha, String confirmarSenha) {
        // Validar CPF
        if (cpf.isEmpty()) {
            editCpf.setError(getString(R.string.error_field_required));
            editCpf.requestFocus();
            return false;
        }
        
        if (!Utils.isValidCPF(cpf)) {
            editCpf.setError(getString(R.string.error_invalid_cpf));
            editCpf.requestFocus();
            return false;
        }
        
        // Validar nome
        if (nome.isEmpty()) {
            editNome.setError(getString(R.string.error_field_required));
            editNome.requestFocus();
            return false;
        }
        
        // Validar email
        if (email.isEmpty()) {
            editEmail.setError(getString(R.string.error_field_required));
            editEmail.requestFocus();
            return false;
        }
        
        if (!Utils.isValidEmail(email)) {
            editEmail.setError(getString(R.string.error_invalid_email));
            editEmail.requestFocus();
            return false;
        }
        
        // Validar data de nascimento
        if (dataNascimento.isEmpty()) {
            editDataNascimento.setError(getString(R.string.error_field_required));
            editDataNascimento.requestFocus();
            return false;
        }
        
        // Validar senha
        if (senha.isEmpty()) {
            editSenha.setError(getString(R.string.error_field_required));
            editSenha.requestFocus();
            return false;
        }
        
        if (senha.length() < 6) {
            editSenha.setError(getString(R.string.error_password_short));
            editSenha.requestFocus();
            return false;
        }
        
        // Validar confirmação de senha
        if (!senha.equals(confirmarSenha)) {
            editConfirmarSenha.setError(getString(R.string.error_password_mismatch));
            editConfirmarSenha.requestFocus();
            return false;
        }
        
        return true;
    }
    
    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        btnRegister.setEnabled(!loading);
        editCpf.setEnabled(!loading);
        editNome.setEnabled(!loading);
        editEmail.setEnabled(!loading);
        editTelefone.setEnabled(!loading);
        editDataNascimento.setEnabled(!loading);
        editEndereco.setEnabled(!loading);
        editSenha.setEnabled(!loading);
        editConfirmarSenha.setEnabled(!loading);
        txtLogin.setEnabled(!loading);
    }
    
    private void navegarParaMain() {
        Intent intent = new Intent(RegisterActivity.this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}

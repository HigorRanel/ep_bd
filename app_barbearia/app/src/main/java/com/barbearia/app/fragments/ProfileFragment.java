package com.barbearia.app.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;

import com.barbearia.app.R;
import com.barbearia.app.activities.EditProfileActivity;
import com.barbearia.app.activities.LoginActivity;
import com.barbearia.app.api.ApiClient;
import com.barbearia.app.api.BarbeariaApi;
import com.barbearia.app.controllers.AuthController;
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
 * Fragment de perfil do usuário.
 * Suporta editar perfil, alterar senha e logout.
 */
public class ProfileFragment extends Fragment {

    private static final int REQUEST_EDIT_PROFILE = 101;

    private TextView txtName, txtEmail, txtCpf, txtPhone;
    private Button btnEditProfile, btnChangePassword, btnLanguage, btnLogout;

    private SessionManager sessionManager;
    private AuthController authController;
    private BarbeariaApi api;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_profile, container, false);

        sessionManager = new SessionManager(requireContext());
        authController = new AuthController(requireContext());
        api = ApiClient.getApiService(requireContext());

        initViews(view);
        loadUserData();
        setupListeners();

        return view;
    }

    private void initViews(View view) {
        txtName           = view.findViewById(R.id.txt_name);
        txtEmail          = view.findViewById(R.id.txt_email);
        txtCpf            = view.findViewById(R.id.txt_cpf);
        txtPhone          = view.findViewById(R.id.txt_phone);
        btnEditProfile    = view.findViewById(R.id.btn_edit_profile);
        btnChangePassword = view.findViewById(R.id.btn_change_password);
        btnLanguage       = view.findViewById(R.id.btn_language);
        btnLogout         = view.findViewById(R.id.btn_logout);
    }

    private void loadUserData() {
        User user = sessionManager.getUser();
        if (user != null) {
            txtName.setText(user.getNome());
            txtEmail.setText(user.getEmail());
            txtCpf.setText(Utils.formatCPF(user.getCpf()));
            txtPhone.setText(user.getTelefone() != null && !user.getTelefone().isEmpty()
                    ? Utils.formatPhone(user.getTelefone())
                    : "—");
        }
    }

    private void setupListeners() {
        btnEditProfile.setOnClickListener(v -> {
            Intent intent = new Intent(requireContext(), EditProfileActivity.class);
            startActivityForResult(intent, REQUEST_EDIT_PROFILE);
        });

        btnChangePassword.setOnClickListener(v -> showChangePasswordDialog());

        btnLanguage.setOnClickListener(v -> showLanguageDialog());

        btnLogout.setOnClickListener(v -> showLogoutDialog());
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_EDIT_PROFILE && resultCode == android.app.Activity.RESULT_OK) {
            // Recarregar dados atualizados
            loadUserData();
        }
    }

    // ── Alterar Senha ──────────────────────────────────────────────────────

    private void showChangePasswordDialog() {
        View dialogView = LayoutInflater.from(requireContext())
                .inflate(R.layout.dialog_change_password, null);

        EditText editCurrentPass  = dialogView.findViewById(R.id.edit_current_password);
        EditText editNewPass      = dialogView.findViewById(R.id.edit_new_password);
        EditText editConfirmPass  = dialogView.findViewById(R.id.edit_confirm_password);

        AlertDialog dialog = new AlertDialog.Builder(requireContext())
                .setTitle(getString(R.string.change_password))
                .setView(dialogView)
                .setPositiveButton(getString(R.string.save_changes), null) // null para controle manual
                .setNegativeButton(getString(R.string.dialog_cancel), null)
                .create();

        dialog.setOnShowListener(d -> {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
                String senhaAtual   = editCurrentPass.getText().toString();
                String novaSenha    = editNewPass.getText().toString();
                String confirmaSenha = editConfirmPass.getText().toString();

                // Validações locais
                if (senhaAtual.isEmpty()) {
                    editCurrentPass.setError(getString(R.string.error_field_required));
                    return;
                }
                if (novaSenha.length() < 6) {
                    editNewPass.setError(getString(R.string.error_password_short));
                    return;
                }
                if (!novaSenha.equals(confirmaSenha)) {
                    editConfirmPass.setError(getString(R.string.error_password_mismatch));
                    return;
                }
                if (!Utils.isNetworkAvailable(requireContext())) {
                    Toast.makeText(requireContext(), getString(R.string.error_network),
                            Toast.LENGTH_SHORT).show();
                    return;
                }

                alterarSenha(senhaAtual, novaSenha, dialog);
            });
        });

        dialog.show();
    }

    private void alterarSenha(String senhaAtual, String novaSenha, AlertDialog dialog) {
        Map<String, String> dados = new HashMap<>();
        dados.put("senha_atual", senhaAtual);
        dados.put("nova_senha", novaSenha);

        Call<ApiResponse<Void>> call = api.alterarSenha(dados);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call,
                                   Response<ApiResponse<Void>> response) {
                if (getActivity() == null) return;
                requireActivity().runOnUiThread(() -> {
                    if (response.isSuccessful()) {
                        dialog.dismiss();
                        Toast.makeText(requireContext(),
                                getString(R.string.success_password_changed),
                                Toast.LENGTH_SHORT).show();
                        // Fazer logout para forçar novo login com nova senha
                        realizarLogout();
                    } else {
                        String msg = response.code() == 401
                                ? "Senha atual incorreta"
                                : getString(R.string.error_generic);
                        Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                if (getActivity() == null) return;
                requireActivity().runOnUiThread(() ->
                        Toast.makeText(requireContext(),
                                getString(R.string.error_network), Toast.LENGTH_SHORT).show());
            }
        });
    }

    // ── Idioma ─────────────────────────────────────────────────────────────

    private void showLanguageDialog() {
        String currentLang = sessionManager.getLanguage();
        int selectedIndex = currentLang.equals("pt") ? 0 : 1;

        String[] languages = {
                getString(R.string.portuguese),
                getString(R.string.english)
        };

        new AlertDialog.Builder(requireContext())
                .setTitle(getString(R.string.language))
                .setSingleChoiceItems(languages, selectedIndex, (dialog, which) -> {
                    String newLang = which == 0 ? "pt" : "en";
                    sessionManager.saveLanguage(newLang);
                    Toast.makeText(requireContext(),
                            "Idioma alterado. Reinicie o app para aplicar.",
                            Toast.LENGTH_LONG).show();
                    dialog.dismiss();
                })
                .show();
    }

    // ── Logout ─────────────────────────────────────────────────────────────

    private void showLogoutDialog() {
        new AlertDialog.Builder(requireContext())
                .setTitle(getString(R.string.dialog_confirm_title))
                .setMessage(getString(R.string.dialog_confirm_logout))
                .setPositiveButton(getString(R.string.dialog_yes),
                        (dialog, which) -> realizarLogout())
                .setNegativeButton(getString(R.string.dialog_no), null)
                .show();
    }

    private void realizarLogout() {
        authController.logout();
        Intent intent = new Intent(requireContext(), LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        if (getActivity() != null) getActivity().finish();
    }
}
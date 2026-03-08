package com.barbearia.app.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;

import com.barbearia.app.R;
import com.barbearia.app.activities.LoginActivity;
import com.barbearia.app.controllers.AuthController;
import com.barbearia.app.models.User;
import com.barbearia.app.utils.SessionManager;
import com.barbearia.app.utils.Utils;

/**
 * Fragment de perfil do usuário
 */
public class ProfileFragment extends Fragment {
    
    private TextView txtName;
    private TextView txtEmail;
    private TextView txtCpf;
    private TextView txtPhone;
    private Button btnEditProfile;
    private Button btnChangePassword;
    private Button btnLanguage;
    private Button btnLogout;
    
    private SessionManager sessionManager;
    private AuthController authController;
    
    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_profile, container, false);
        
        sessionManager = new SessionManager(requireContext());
        authController = new AuthController(requireContext());
        
        initViews(view);
        loadUserData();
        setupListeners();
        
        return view;
    }
    
    private void initViews(View view) {
        txtName = view.findViewById(R.id.txt_name);
        txtEmail = view.findViewById(R.id.txt_email);
        txtCpf = view.findViewById(R.id.txt_cpf);
        txtPhone = view.findViewById(R.id.txt_phone);
        btnEditProfile = view.findViewById(R.id.btn_edit_profile);
        btnChangePassword = view.findViewById(R.id.btn_change_password);
        btnLanguage = view.findViewById(R.id.btn_language);
        btnLogout = view.findViewById(R.id.btn_logout);
    }
    
    private void loadUserData() {
        User user = sessionManager.getUser();
        if (user != null) {
            txtName.setText(user.getNome());
            txtEmail.setText(user.getEmail());
            txtCpf.setText(Utils.formatCPF(user.getCpf()));
            
            if (user.getTelefone() != null && !user.getTelefone().isEmpty()) {
                txtPhone.setText(Utils.formatPhone(user.getTelefone()));
            } else {
                txtPhone.setText(getString(R.string.error_field_required));
            }
        }
    }
    
    private void setupListeners() {
        btnEditProfile.setOnClickListener(v -> {
            // TODO: Abrir tela de edição de perfil
            Toast.makeText(requireContext(), "Editar perfil", Toast.LENGTH_SHORT).show();
        });
        
        btnChangePassword.setOnClickListener(v -> {
            // TODO: Abrir tela de alteração de senha
            Toast.makeText(requireContext(), "Alterar senha", Toast.LENGTH_SHORT).show();
        });
        
        btnLanguage.setOnClickListener(v -> showLanguageDialog());
        
        btnLogout.setOnClickListener(v -> showLogoutDialog());
    }
    
    private void showLanguageDialog() {
        String currentLang = sessionManager.getLanguage();
        int selectedIndex = currentLang.equals("pt") ? 0 : 1;
        
        String[] languages = {
            getString(R.string.portuguese),
            getString(R.string.english)
        };
        
        AlertDialog.Builder builder = new AlertDialog.Builder(requireContext());
        builder.setTitle(getString(R.string.language));
        builder.setSingleChoiceItems(languages, selectedIndex, (dialog, which) -> {
            String newLang = which == 0 ? "pt" : "en";
            sessionManager.saveLanguage(newLang);
            
            Toast.makeText(requireContext(),
                    "Language changed. Please restart the app.",
                    Toast.LENGTH_LONG).show();
            
            dialog.dismiss();
        });
        builder.show();
    }
    
    private void showLogoutDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(requireContext());
        builder.setTitle(getString(R.string.dialog_confirm_title));
        builder.setMessage(getString(R.string.dialog_confirm_logout));
        builder.setPositiveButton(getString(R.string.dialog_yes), (dialog, which) -> {
            realizarLogout();
        });
        builder.setNegativeButton(getString(R.string.dialog_no), null);
        builder.show();
    }
    
    private void realizarLogout() {
        authController.logout();
        
        Intent intent = new Intent(requireContext(), LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        
        if (getActivity() != null) {
            getActivity().finish();
        }
    }
}

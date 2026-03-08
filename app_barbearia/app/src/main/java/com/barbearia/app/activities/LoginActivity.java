package com.barbearia.app.activities;

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
import com.barbearia.app.utils.SessionManager;
import com.barbearia.app.utils.Utils;

/**
 * Activity responsável pela tela de login
 * 
 * Funcionalidades:
 * - Login com email e senha
 * - Validação de campos
 * - Navegação para tela de cadastro
 * - Navegação para recuperação de senha
 * - Feedback visual com ProgressBar
 */
public class LoginActivity extends AppCompatActivity {
    
    // Componentes da UI
    private EditText editEmail;
    private EditText editPassword;
    private Button btnLogin;
    private TextView txtRegister;
    private TextView txtForgotPassword;
    private ProgressBar progressBar;
    
    // Controllers e Managers
    private AuthController authController;
    private SessionManager sessionManager;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        
        // Inicializar controllers
        authController = new AuthController(this);
        sessionManager = new SessionManager(this);
        
        // Verificar se já está logado
        if (sessionManager.isLoggedIn()) {
            navegarParaMain();
            return;
        }
        
        // Inicializar componentes
        initViews();
        
        // Configurar listeners
        setupListeners();
    }
    
    /**
     * Inicializa os componentes da UI
     */
    private void initViews() {
        editEmail = findViewById(R.id.edit_email);
        editPassword = findViewById(R.id.edit_password);
        btnLogin = findViewById(R.id.btn_login);
        txtRegister = findViewById(R.id.txt_register);
        txtForgotPassword = findViewById(R.id.txt_forgot_password);
        progressBar = findViewById(R.id.progress_bar);
        
        // Esconder progress bar inicialmente
        progressBar.setVisibility(View.GONE);
    }
    
    /**
     * Configura os listeners dos componentes
     */
    private void setupListeners() {
        btnLogin.setOnClickListener(v -> realizarLogin());
        
        txtRegister.setOnClickListener(v -> {
            Intent intent = new Intent(LoginActivity.this, RegisterActivity.class);
            startActivity(intent);
        });
        
        txtForgotPassword.setOnClickListener(v -> {
            // TODO: Implementar recuperação de senha
            Toast.makeText(this, getString(R.string.forgot_password), Toast.LENGTH_SHORT).show();
        });
    }
    
    /**
     * Realiza o login do usuário
     */
    private void realizarLogin() {
        // Obter valores dos campos
        String email = editEmail.getText().toString().trim();
        String password = editPassword.getText().toString().trim();
        
        // Validar campos
        if (!validarCampos(email, password)) {
            return;
        }
        
        // Verificar conexão
        if (!Utils.isNetworkAvailable(this)) {
            Toast.makeText(this, getString(R.string.error_network), Toast.LENGTH_SHORT).show();
            return;
        }
        
        // Mostrar loading
        setLoading(true);
        
        // Fazer login
        authController.login(email, password, new AuthController.AuthCallback() {
            @Override
            public void onSuccess(AuthResponse response) {
                runOnUiThread(() -> {
                    setLoading(false);
                    Toast.makeText(LoginActivity.this, 
                            getString(R.string.success_login), 
                            Toast.LENGTH_SHORT).show();
                    navegarParaMain();
                });
            }
            
            @Override
            public void onError(String errorMessage) {
                runOnUiThread(() -> {
                    setLoading(false);
                    Toast.makeText(LoginActivity.this, 
                            errorMessage != null ? errorMessage : getString(R.string.error_login_failed), 
                            Toast.LENGTH_LONG).show();
                });
            }
        });
    }
    
    /**
     * Valida os campos de entrada
     */
    private boolean validarCampos(String email, String password) {
        // Validar email vazio
        if (email.isEmpty()) {
            editEmail.setError(getString(R.string.error_field_required));
            editEmail.requestFocus();
            return false;
        }
        
        // Validar formato do email
        if (!Utils.isValidEmail(email)) {
            editEmail.setError(getString(R.string.error_invalid_email));
            editEmail.requestFocus();
            return false;
        }
        
        // Validar senha vazia
        if (password.isEmpty()) {
            editPassword.setError(getString(R.string.error_field_required));
            editPassword.requestFocus();
            return false;
        }
        
        // Validar tamanho mínimo da senha
        if (password.length() < 6) {
            editPassword.setError(getString(R.string.error_password_short));
            editPassword.requestFocus();
            return false;
        }
        
        return true;
    }
    
    /**
     * Controla o estado de loading da tela
     */
    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        btnLogin.setEnabled(!loading);
        editEmail.setEnabled(!loading);
        editPassword.setEnabled(!loading);
        txtRegister.setEnabled(!loading);
        txtForgotPassword.setEnabled(!loading);
    }
    
    /**
     * Navega para a tela principal
     */
    private void navegarParaMain() {
        Intent intent = new Intent(LoginActivity.this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}

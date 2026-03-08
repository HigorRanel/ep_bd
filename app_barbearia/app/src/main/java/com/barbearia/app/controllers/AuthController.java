package com.barbearia.app.controllers;

import android.content.Context;

import com.barbearia.app.api.ApiClient;
import com.barbearia.app.api.BarbeariaApi;
import com.barbearia.app.models.responses.ApiResponse;
import com.barbearia.app.models.responses.AuthResponse;
import com.barbearia.app.utils.SessionManager;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Controller responsável pela autenticação (Login e Registro)
 */
public class AuthController {
    
    private BarbeariaApi api;
    private SessionManager sessionManager;
    private Context context;
    
    public AuthController(Context context) {
        this.context = context;
        this.api = ApiClient.getApiService(context);
        this.sessionManager = new SessionManager(context);
    }
    
    /**
     * Interface para callback de autenticação
     */
    public interface AuthCallback {
        void onSuccess(AuthResponse response);
        void onError(String errorMessage);
    }
    
    /**
     * Realiza login do usuário
     */
    public void login(String email, String password, final AuthCallback callback) {
        Map<String, String> credentials = new HashMap<>();
        credentials.put("email", email);
        credentials.put("senha", password);
        
        Call<AuthResponse> call = api.login(credentials);
        call.enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    AuthResponse authResponse = response.body();
                    
                    if (authResponse.isSuccessful()) {
                        // Salvar sessão
                        sessionManager.saveSession(
                                authResponse.getToken(),
                                authResponse.getUser()
                        );
                        callback.onSuccess(authResponse);
                    } else {
                        callback.onError(authResponse.getError());
                    }
                } else {
                    callback.onError("Erro ao fazer login");
                }
            }
            
            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                callback.onError("Erro de conexão: " + t.getMessage());
            }
        });
    }
    
    /**
     * Registra um novo cliente
     */
    public void registerCliente(String cpf, String nomeCompleto, String dataNascimento,
                                String email, String senha, String telefone, String endereco,
                                final AuthCallback callback) {
        Map<String, String> userData = new HashMap<>();
        userData.put("cpf", cpf);
        userData.put("nome_completo", nomeCompleto);
        userData.put("data_nascimento", dataNascimento);
        userData.put("email", email);
        userData.put("senha", senha);
        
        if (telefone != null && !telefone.isEmpty()) {
            userData.put("telefone", telefone);
        }
        if (endereco != null && !endereco.isEmpty()) {
            userData.put("endereco", endereco);
        }
        
        Call<AuthResponse> call = api.registerCliente(userData);
        call.enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    AuthResponse authResponse = response.body();
                    
                    if (authResponse.isSuccessful()) {
                        // Salvar sessão
                        sessionManager.saveSession(
                                authResponse.getToken(),
                                authResponse.getUser()
                        );
                        callback.onSuccess(authResponse);
                    } else {
                        callback.onError(authResponse.getError());
                    }
                } else {
                    callback.onError("Erro ao cadastrar");
                }
            }
            
            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                callback.onError("Erro de conexão: " + t.getMessage());
            }
        });
    }
    
    /**
     * Faz logout do usuário
     */
    public void logout() {
        sessionManager.logout();
        ApiClient.clearInstance();
    }
    
    /**
     * Verifica se o usuário está logado
     */
    public boolean isLoggedIn() {
        return sessionManager.isLoggedIn();
    }
}

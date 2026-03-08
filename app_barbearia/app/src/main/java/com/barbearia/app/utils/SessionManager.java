package com.barbearia.app.utils;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.barbearia.app.models.User;
import com.google.gson.Gson;

import java.io.IOException;
import java.security.GeneralSecurityException;

/**
 * Gerenciador de sessão do usuário
 * Usa EncryptedSharedPreferences para armazenar dados de forma segura
 */
public class SessionManager {
    private static final String PREF_NAME = "BarbeariaSession";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER = "user";
    private static final String KEY_IS_LOGGED_IN = "is_logged_in";
    private static final String KEY_LANGUAGE = "language";
    
    private SharedPreferences preferences;
    private SharedPreferences.Editor editor;
    private Context context;
    private Gson gson;
    
    public SessionManager(Context context) {
        this.context = context;
        this.gson = new Gson();
        
        try {
            // Criar chave mestra para criptografia
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            
            // Criar SharedPreferences criptografado
            preferences = EncryptedSharedPreferences.create(
                    context,
                    PREF_NAME,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
            
            editor = preferences.edit();
            
        } catch (GeneralSecurityException | IOException e) {
            e.printStackTrace();
            // Fallback para SharedPreferences normal em caso de erro
            preferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            editor = preferences.edit();
        }
    }
    
    /**
     * Salva a sessão do usuário após login
     */
    public void saveSession(String token, User user) {
        editor.putString(KEY_TOKEN, token);
        editor.putString(KEY_USER, gson.toJson(user));
        editor.putBoolean(KEY_IS_LOGGED_IN, true);
        editor.apply();
    }
    
    /**
     * Verifica se o usuário está logado
     */
    public boolean isLoggedIn() {
        return preferences.getBoolean(KEY_IS_LOGGED_IN, false);
    }
    
    /**
     * Obtém o token de autenticação
     */
    public String getToken() {
        return preferences.getString(KEY_TOKEN, null);
    }
    
    /**
     * Obtém os dados do usuário logado
     */
    public User getUser() {
        String userJson = preferences.getString(KEY_USER, null);
        if (userJson != null) {
            return gson.fromJson(userJson, User.class);
        }
        return null;
    }
    
    /**
     * Atualiza os dados do usuário
     */
    public void updateUser(User user) {
        editor.putString(KEY_USER, gson.toJson(user));
        editor.apply();
    }
    
    /**
     * Faz logout, limpando todos os dados salvos
     */
    public void logout() {
        editor.clear();
        editor.apply();
    }
    
    /**
     * Salva o idioma preferido
     */
    public void saveLanguage(String languageCode) {
        editor.putString(KEY_LANGUAGE, languageCode);
        editor.apply();
    }
    
    /**
     * Obtém o idioma salvo
     */
    public String getLanguage() {
        return preferences.getString(KEY_LANGUAGE, "pt"); // Português como padrão
    }
}

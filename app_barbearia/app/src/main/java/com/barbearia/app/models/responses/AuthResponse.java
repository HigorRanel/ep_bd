package com.barbearia.app.models.responses;

import com.barbearia.app.models.User;
import com.google.gson.annotations.SerializedName;

/**
 * Resposta da API para autenticação (login/registro)
 */
public class AuthResponse {
    
    @SerializedName("token")
    private String token;
    
    @SerializedName("user")
    private User user;
    
    @SerializedName("message")
    private String message;
    
    @SerializedName("error")
    private String error;
    
    // Getters e Setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
    
    public boolean isSuccessful() {
        return error == null && token != null;
    }
}

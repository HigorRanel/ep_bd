package com.barbearia.app.models.responses;

import com.google.gson.annotations.SerializedName;

/**
 * Resposta genérica da API
 */
public class ApiResponse<T> {
    
    @SerializedName("message")
    private String message;
    
    @SerializedName("error")
    private String error;
    
    @SerializedName("data")
    private T data;
    
    // Getters e Setters
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
    
    public T getData() {
        return data;
    }
    
    public void setData(T data) {
        this.data = data;
    }
    
    public boolean isSuccessful() {
        return error == null;
    }
}

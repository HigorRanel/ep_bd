package com.barbearia.app.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

/**
 * Modelo que representa um barbeiro
 */
public class Barbeiro implements Serializable {
    
    @SerializedName("cpf")
    private String cpf;
    
    @SerializedName("nome_completo")
    private String nomeCompleto;
    
    @SerializedName("email")
    private String email;
    
    @SerializedName("telefone")
    private String telefone;
    
    @SerializedName("data_inicio")
    private String dataInicio;
    
    @SerializedName("is_chefe")
    private boolean isChefe;
    
    @SerializedName("media_avaliacoes")
    private Double mediaAvaliacoes;
    
    @SerializedName("total_avaliacoes")
    private Integer totalAvaliacoes;
    
    // Construtores
    public Barbeiro() {
    }
    
    // Getters e Setters
    public String getCpf() {
        return cpf;
    }
    
    public void setCpf(String cpf) {
        this.cpf = cpf;
    }
    
    public String getNomeCompleto() {
        return nomeCompleto;
    }
    
    public void setNomeCompleto(String nomeCompleto) {
        this.nomeCompleto = nomeCompleto;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getTelefone() {
        return telefone;
    }
    
    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }
    
    public String getDataInicio() {
        return dataInicio;
    }
    
    public void setDataInicio(String dataInicio) {
        this.dataInicio = dataInicio;
    }
    
    public boolean isChefe() {
        return isChefe;
    }
    
    public void setChefe(boolean chefe) {
        isChefe = chefe;
    }
    
    public Double getMediaAvaliacoes() {
        return mediaAvaliacoes;
    }
    
    public void setMediaAvaliacoes(Double mediaAvaliacoes) {
        this.mediaAvaliacoes = mediaAvaliacoes;
    }
    
    public Integer getTotalAvaliacoes() {
        return totalAvaliacoes;
    }
    
    public void setTotalAvaliacoes(Integer totalAvaliacoes) {
        this.totalAvaliacoes = totalAvaliacoes;
    }
    
    public String getMediaFormatada() {
        if (mediaAvaliacoes != null && mediaAvaliacoes > 0) {
            return String.format("%.1f", mediaAvaliacoes);
        }
        return "N/A";
    }
    
    @Override
    public String toString() {
        return nomeCompleto;
    }
}

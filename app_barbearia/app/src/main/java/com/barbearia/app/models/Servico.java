package com.barbearia.app.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;
import java.util.List;

/**
 * Modelo que representa um serviço oferecido pela barbearia
 */
public class Servico implements Serializable {
    
    @SerializedName("id_servico")
    private int idServico;
    
    @SerializedName("nome")
    private String nome;
    
    @SerializedName("preco")
    private double preco;
    
    @SerializedName("duracao_estimada_min")
    private int duracaoEstimadaMin;
    
    @SerializedName("descricao")
    private String descricao;
    
    @SerializedName("barbeiros")
    private List<String> barbeiros;
    
    // Construtores
    public Servico() {
    }
    
    public Servico(int idServico, String nome, double preco, int duracaoEstimadaMin) {
        this.idServico = idServico;
        this.nome = nome;
        this.preco = preco;
        this.duracaoEstimadaMin = duracaoEstimadaMin;
    }
    
    // Getters e Setters
    public int getIdServico() {
        return idServico;
    }
    
    public void setIdServico(int idServico) {
        this.idServico = idServico;
    }
    
    public String getNome() {
        return nome;
    }
    
    public void setNome(String nome) {
        this.nome = nome;
    }
    
    public double getPreco() {
        return preco;
    }
    
    public void setPreco(double preco) {
        this.preco = preco;
    }
    
    public int getDuracaoEstimadaMin() {
        return duracaoEstimadaMin;
    }
    
    public void setDuracaoEstimadaMin(int duracaoEstimadaMin) {
        this.duracaoEstimadaMin = duracaoEstimadaMin;
    }
    
    public String getDescricao() {
        return descricao;
    }
    
    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
    
    public List<String> getBarbeiros() {
        return barbeiros;
    }
    
    public void setBarbeiros(List<String> barbeiros) {
        this.barbeiros = barbeiros;
    }
    
    public String getPrecoFormatado() {
        return String.format("R$ %.2f", preco);
    }
    
    public String getDuracaoFormatada() {
        if (duracaoEstimadaMin < 60) {
            return duracaoEstimadaMin + " min";
        } else {
            int horas = duracaoEstimadaMin / 60;
            int minutos = duracaoEstimadaMin % 60;
            if (minutos == 0) {
                return horas + "h";
            }
            return horas + "h " + minutos + "min";
        }
    }
    
    @Override
    public String toString() {
        return nome;
    }
}

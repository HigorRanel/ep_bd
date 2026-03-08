package com.barbearia.app.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

/**
 * Modelo que representa um usuário do sistema
 */
public class User implements Serializable {
    
    @SerializedName("cpf")
    private String cpf;
    
    @SerializedName("nome")
    private String nome;
    
    @SerializedName("email")
    private String email;
    
    @SerializedName("tipo")
    private String tipo; // "cliente", "barbeiro", "barbeiro_chefe"
    
    @SerializedName("telefone")
    private String telefone;
    
    @SerializedName("data_nascimento")
    private String dataNascimento;
    
    @SerializedName("endereco")
    private String endereco;
    
    // Construtores
    public User() {
    }
    
    public User(String cpf, String nome, String email, String tipo) {
        this.cpf = cpf;
        this.nome = nome;
        this.email = email;
        this.tipo = tipo;
    }
    
    // Getters e Setters
    public String getCpf() {
        return cpf;
    }
    
    public void setCpf(String cpf) {
        this.cpf = cpf;
    }
    
    public String getNome() {
        return nome;
    }
    
    public void setNome(String nome) {
        this.nome = nome;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getTipo() {
        return tipo;
    }
    
    public void setTipo(String tipo) {
        this.tipo = tipo;
    }
    
    public String getTelefone() {
        return telefone;
    }
    
    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }
    
    public String getDataNascimento() {
        return dataNascimento;
    }
    
    public void setDataNascimento(String dataNascimento) {
        this.dataNascimento = dataNascimento;
    }
    
    public String getEndereco() {
        return endereco;
    }
    
    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }
    
    public boolean isCliente() {
        return "cliente".equals(tipo);
    }
    
    @Override
    public String toString() {
        return "User{" +
                "cpf='" + cpf + '\'' +
                ", nome='" + nome + '\'' +
                ", email='" + email + '\'' +
                ", tipo='" + tipo + '\'' +
                '}';
    }
}

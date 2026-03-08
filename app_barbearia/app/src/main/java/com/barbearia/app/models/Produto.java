package com.barbearia.app.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

/**
 * Modelo que representa um produto da barbearia
 */
public class Produto implements Serializable {
    
    @SerializedName("id_produto")
    private int idProduto;
    
    @SerializedName("nome_produto")
    private String nomeProduto;
    
    @SerializedName("descricao")
    private String descricao;
    
    @SerializedName("preco_compra")
    private double precoCompra;
    
    @SerializedName("preco_venda")
    private double precoVenda;
    
    @SerializedName("categoria")
    private String categoria;
    
    @SerializedName("quantidade_estoque")
    private int quantidadeEstoque;
    
    @SerializedName("minimo_estoque")
    private int minimoEstoque;
    
    @SerializedName("status")
    private String status; // "disponivel", "indisponivel"
    
    // Construtores
    public Produto() {
    }
    
    // Getters e Setters
    public int getIdProduto() {
        return idProduto;
    }
    
    public void setIdProduto(int idProduto) {
        this.idProduto = idProduto;
    }
    
    public String getNomeProduto() {
        return nomeProduto;
    }
    
    public void setNomeProduto(String nomeProduto) {
        this.nomeProduto = nomeProduto;
    }
    
    public String getDescricao() {
        return descricao;
    }
    
    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
    
    public double getPrecoCompra() {
        return precoCompra;
    }
    
    public void setPrecoCompra(double precoCompra) {
        this.precoCompra = precoCompra;
    }
    
    public double getPrecoVenda() {
        return precoVenda;
    }
    
    public void setPrecoVenda(double precoVenda) {
        this.precoVenda = precoVenda;
    }
    
    public String getCategoria() {
        return categoria;
    }
    
    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }
    
    public int getQuantidadeEstoque() {
        return quantidadeEstoque;
    }
    
    public void setQuantidadeEstoque(int quantidadeEstoque) {
        this.quantidadeEstoque = quantidadeEstoque;
    }
    
    public int getMinimoEstoque() {
        return minimoEstoque;
    }
    
    public void setMinimoEstoque(int minimoEstoque) {
        this.minimoEstoque = minimoEstoque;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getPrecoFormatado() {
        return String.format("R$ %.2f", precoVenda);
    }
    
    public boolean isDisponivel() {
        return "disponivel".equals(status) && quantidadeEstoque > 0;
    }
    
    @Override
    public String toString() {
        return nomeProduto;
    }
}

package com.barbearia.app.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

/**
 * Modelo que representa uma reserva de produto
 */
public class Reserva implements Serializable {
    
    @SerializedName("id_reserva")
    private int idReserva;
    
    @SerializedName("id_cliente")
    private String idCliente;
    
    @SerializedName("id_prod")
    private int idProduto;
    
    @SerializedName("data_reserva")
    private String dataReserva;
    
    @SerializedName("status")
    private String status; // "reservado", "comprado", "retirado", "cancelado", "pendente"
    
    @SerializedName("nome_produto")
    private String nomeProduto;
    
    @SerializedName("categoria")
    private String categoria;
    
    @SerializedName("preco_venda")
    private double precoVenda;
    
    // Construtores
    public Reserva() {
    }
    
    // Getters e Setters
    public int getIdReserva() {
        return idReserva;
    }
    
    public void setIdReserva(int idReserva) {
        this.idReserva = idReserva;
    }
    
    public String getIdCliente() {
        return idCliente;
    }
    
    public void setIdCliente(String idCliente) {
        this.idCliente = idCliente;
    }
    
    public int getIdProduto() {
        return idProduto;
    }
    
    public void setIdProduto(int idProduto) {
        this.idProduto = idProduto;
    }
    
    public String getDataReserva() {
        return dataReserva;
    }
    
    public void setDataReserva(String dataReserva) {
        this.dataReserva = dataReserva;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getNomeProduto() {
        return nomeProduto;
    }
    
    public void setNomeProduto(String nomeProduto) {
        this.nomeProduto = nomeProduto;
    }
    
    public String getCategoria() {
        return categoria;
    }
    
    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }
    
    public double getPrecoVenda() {
        return precoVenda;
    }
    
    public void setPrecoVenda(double precoVenda) {
        this.precoVenda = precoVenda;
    }
    
    public String getPrecoFormatado() {
        return String.format("R$ %.2f", precoVenda);
    }
    
    public boolean isReservado() {
        return "reservado".equals(status);
    }
    
    public boolean isComprado() {
        return "comprado".equals(status);
    }
    
    public boolean isCancelado() {
        return "cancelado".equals(status);
    }
    
    public boolean podeAtualizar() {
        return isReservado();
    }
}

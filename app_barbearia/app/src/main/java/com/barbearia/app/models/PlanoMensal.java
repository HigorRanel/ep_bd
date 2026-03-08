package com.barbearia.app.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;
import java.util.List;

/**
 * Modelo que representa um plano mensal
 */
public class PlanoMensal implements Serializable {
    
    @SerializedName("id_plano_mensal")
    private int idPlanoMensal;
    
    @SerializedName("id_barbeiro_chefe")
    private int idBarbeiroChefe;
    
    @SerializedName("criador_nome")
    private String criadorNome;
    
    @SerializedName("servicos")
    private List<ServicoPlano> servicos;
    
    @SerializedName("valor_sem_desconto")
    private double valorSemDesconto;
    
    @SerializedName("valor_com_desconto")
    private double valorComDesconto;
    
    @SerializedName("valor_desconto_total")
    private double valorDescontoTotal;
    
    @SerializedName("desconto_medio")
    private double descontoMedio;
    
    @SerializedName("data_inicio")
    private String dataInicio;
    
    @SerializedName("data_fim")
    private String dataFim;
    
    // Classe interna para representar serviço do plano
    public static class ServicoPlano implements Serializable {
        @SerializedName("id_servico")
        private int idServico;
        
        @SerializedName("nome")
        private String nome;
        
        @SerializedName("preco")
        private double preco;
        
        @SerializedName("quantidade")
        private int quantidade;
        
        @SerializedName("desconto")
        private double desconto;
        
        public int getIdServico() {
            return idServico;
        }
        
        public String getNome() {
            return nome;
        }
        
        public double getPreco() {
            return preco;
        }
        
        public int getQuantidade() {
            return quantidade;
        }
        
        public double getDesconto() {
            return desconto;
        }
        
        public String getDescontoFormatado() {
            return String.format("%.0f%% OFF", desconto);
        }
    }
    
    // Getters e Setters
    public int getIdPlanoMensal() {
        return idPlanoMensal;
    }
    
    public void setIdPlanoMensal(int idPlanoMensal) {
        this.idPlanoMensal = idPlanoMensal;
    }
    
    public int getIdBarbeiroChefe() {
        return idBarbeiroChefe;
    }
    
    public void setIdBarbeiroChefe(int idBarbeiroChefe) {
        this.idBarbeiroChefe = idBarbeiroChefe;
    }
    
    public String getCriadorNome() {
        return criadorNome;
    }
    
    public void setCriadorNome(String criadorNome) {
        this.criadorNome = criadorNome;
    }
    
    public List<ServicoPlano> getServicos() {
        return servicos;
    }
    
    public void setServicos(List<ServicoPlano> servicos) {
        this.servicos = servicos;
    }
    
    public double getValorSemDesconto() {
        return valorSemDesconto;
    }
    
    public void setValorSemDesconto(double valorSemDesconto) {
        this.valorSemDesconto = valorSemDesconto;
    }
    
    public double getValorComDesconto() {
        return valorComDesconto;
    }
    
    public void setValorComDesconto(double valorComDesconto) {
        this.valorComDesconto = valorComDesconto;
    }
    
    public double getValorDescontoTotal() {
        return valorDescontoTotal;
    }
    
    public void setValorDescontoTotal(double valorDescontoTotal) {
        this.valorDescontoTotal = valorDescontoTotal;
    }
    
    public double getDescontoMedio() {
        return descontoMedio;
    }
    
    public void setDescontoMedio(double descontoMedio) {
        this.descontoMedio = descontoMedio;
    }
    
    public String getDataInicio() {
        return dataInicio;
    }
    
    public void setDataInicio(String dataInicio) {
        this.dataInicio = dataInicio;
    }
    
    public String getDataFim() {
        return dataFim;
    }
    
    public void setDataFim(String dataFim) {
        this.dataFim = dataFim;
    }
    
    public String getValorFormatado() {
        return String.format("R$ %.2f", valorComDesconto);
    }
    
    public String getDescontoFormatado() {
        return String.format("%.0f%% OFF", descontoMedio);
    }
    
    public String getEconomiaFormatada() {
        return String.format("Economize R$ %.2f", valorDescontoTotal);
    }
}

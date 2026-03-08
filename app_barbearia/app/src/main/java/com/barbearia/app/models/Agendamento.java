package com.barbearia.app.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

/**
 * Modelo que representa um agendamento
 */
public class Agendamento implements Serializable {
    
    @SerializedName("id_agendamento")
    private int idAgendamento;
    
    @SerializedName("data_hora_agendamento")
    private String dataHoraAgendamento;
    
    @SerializedName("status")
    private String status; // "pendente", "confirmado", "concluido", "cancelado", "falta"
    
    @SerializedName("cpf_cliente")
    private String cpfCliente;
    
    @SerializedName("cpf_barbeiro")
    private String cpfBarbeiro;
    
    @SerializedName("id_servico")
    private int idServico;
    
    @SerializedName("servico_nome")
    private String servicoNome;
    
    @SerializedName("preco")
    private double preco;
    
    @SerializedName("duracao_estimada_min")
    private int duracaoEstimadaMin;
    
    @SerializedName("barbeiro_nome")
    private String barbeiroNome;
    
    @SerializedName("barbeiro_telefone")
    private String barbeiroTelefone;
    
    @SerializedName("tem_avaliacao")
    private boolean temAvaliacao;
    
    @SerializedName("avaliacao_nota")
    private Double avaliacaoNota;
    
    @SerializedName("avaliacao_comentario")
    private String avaliacaoComentario;
    
    // Construtores
    public Agendamento() {
    }
    
    // Getters e Setters
    public int getIdAgendamento() {
        return idAgendamento;
    }
    
    public void setIdAgendamento(int idAgendamento) {
        this.idAgendamento = idAgendamento;
    }
    
    public String getDataHoraAgendamento() {
        return dataHoraAgendamento;
    }
    
    public void setDataHoraAgendamento(String dataHoraAgendamento) {
        this.dataHoraAgendamento = dataHoraAgendamento;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getCpfCliente() {
        return cpfCliente;
    }
    
    public void setCpfCliente(String cpfCliente) {
        this.cpfCliente = cpfCliente;
    }
    
    public String getCpfBarbeiro() {
        return cpfBarbeiro;
    }
    
    public void setCpfBarbeiro(String cpfBarbeiro) {
        this.cpfBarbeiro = cpfBarbeiro;
    }
    
    public int getIdServico() {
        return idServico;
    }
    
    public void setIdServico(int idServico) {
        this.idServico = idServico;
    }
    
    public String getServicoNome() {
        return servicoNome;
    }
    
    public void setServicoNome(String servicoNome) {
        this.servicoNome = servicoNome;
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
    
    public String getBarbeiroNome() {
        return barbeiroNome;
    }
    
    public void setBarbeiroNome(String barbeiroNome) {
        this.barbeiroNome = barbeiroNome;
    }
    
    public String getBarbeiroTelefone() {
        return barbeiroTelefone;
    }
    
    public void setBarbeiroTelefone(String barbeiroTelefone) {
        this.barbeiroTelefone = barbeiroTelefone;
    }
    
    public boolean isTemAvaliacao() {
        return temAvaliacao;
    }
    
    public void setTemAvaliacao(boolean temAvaliacao) {
        this.temAvaliacao = temAvaliacao;
    }
    
    public Double getAvaliacaoNota() {
        return avaliacaoNota;
    }
    
    public void setAvaliacaoNota(Double avaliacaoNota) {
        this.avaliacaoNota = avaliacaoNota;
    }
    
    public String getAvaliacaoComentario() {
        return avaliacaoComentario;
    }
    
    public void setAvaliacaoComentario(String avaliacaoComentario) {
        this.avaliacaoComentario = avaliacaoComentario;
    }
    
    // Métodos auxiliares
    public boolean isPendente() {
        return "pendente".equals(status);
    }
    
    public boolean isConfirmado() {
        return "confirmado".equals(status);
    }
    
    public boolean isConcluido() {
        return "concluido".equals(status);
    }
    
    public boolean isCancelado() {
        return "cancelado".equals(status);
    }
    
    public boolean podeAvaliar() {
        return isConcluido() && !temAvaliacao;
    }
    
    public boolean podeCancelar() {
        return isPendente() || isConfirmado();
    }
}

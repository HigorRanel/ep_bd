package com.barbearia.app.api;

import com.barbearia.app.models.Agendamento;
import com.barbearia.app.models.Barbeiro;
import com.barbearia.app.models.PlanoMensal;
import com.barbearia.app.models.Produto;
import com.barbearia.app.models.Reserva;
import com.barbearia.app.models.Servico;
import com.barbearia.app.models.responses.ApiResponse;
import com.barbearia.app.models.responses.AuthResponse;

import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;

/**
 * Interface que define os endpoints da API da barbearia
 */
public interface BarbeariaApi {
    
    // ==================== AUTENTICAÇÃO ====================
    
    @POST("auth/login")
    Call<AuthResponse> login(@Body Map<String, String> credentials);
    
    @POST("auth/cadastrar-e-logar/cliente")
    Call<AuthResponse> registerCliente(@Body Map<String, String> userData);
    
    @POST("auth/alterar-senha")
    Call<ApiResponse<Void>> alterarSenha(@Body Map<String, String> senhaData);
    
    @POST("auth/recuperar-senha-email")
    Call<ApiResponse<Void>> recuperarSenha(@Body Map<String, String> emailData);
    
    // ==================== SERVIÇOS ====================
    
    @GET("servicos")
    Call<List<Servico>> getServicos();
    
    @GET("servicos/{id}")
    Call<Servico> getServico(@Path("id") int idServico);
    
    // ==================== BARBEIROS ====================
    
    @GET("barbeiros")
    Call<List<Barbeiro>> getBarbeiros();
    
    @GET("barbeiros/{cpf}")
    Call<Barbeiro> getBarbeiro(@Path("cpf") String cpf);
    
    // ==================== AGENDAMENTOS ====================
    
    @POST("agendamentos")
    Call<ApiResponse<Agendamento>> criarAgendamento(@Body Map<String, Object> agendamentoData);
    
    @GET("clientes/me/agendamentos-otimizado")
    Call<List<Agendamento>> getMeusAgendamentos();
    
    @GET("agendamentos/{id}")
    Call<Agendamento> getAgendamento(@Path("id") int idAgendamento);
    
    @PUT("agendamentos/{id}/cancelar")
    Call<ApiResponse<Void>> cancelarAgendamento(@Path("id") int idAgendamento);
    
    @POST("agendamentos/{id}/avaliar")
    Call<ApiResponse<Void>> avaliarAgendamento(
        @Path("id") int idAgendamento,
        @Body Map<String, Object> avaliacaoData
    );
    
    @GET("agendamentos/horarios-disponiveis")
    Call<Map<String, Object>> getHorariosDisponiveis(
        @Query("cpf_barbeiro") String cpfBarbeiro,
        @Query("data") String data,
        @Query("duracao_servico_min") int duracaoMin
    );
    
    // ==================== PRODUTOS ====================
    
    @GET("produtos")
    Call<List<Produto>> getProdutos();
    
    @GET("produtos/{id}")
    Call<Produto> getProduto(@Path("id") int idProduto);
    
    @POST("produtos/reservar")
    Call<ApiResponse<Reserva>> reservarProduto(@Body Map<String, Integer> produtoData);
    
    @GET("produtos/minhas-reservas")
    Call<List<Reserva>> getMinhasReservas();
    
    @PUT("reservas/{id}/status")
    Call<ApiResponse<Reserva>> atualizarStatusReserva(
        @Path("id") int idReserva,
        @Body Map<String, String> statusData
    );
    
    @DELETE("reservas/{id}")
    Call<ApiResponse<Void>> cancelarReserva(@Path("id") int idReserva);
    
    // ==================== PLANOS MENSAIS ====================
    
    @GET("planos")
    Call<List<PlanoMensal>> getPlanos();
    
    @GET("planos/{id}")
    Call<PlanoMensal> getPlano(@Path("id") int idPlano);
    
    @POST("planos/assinar")
    Call<ApiResponse<Void>> assinarPlano(@Body Map<String, Object> planoData);
    
    @GET("planos/minhas-assinaturas")
    Call<List<PlanoMensal>> getMinhasAssinaturas();
    
    @DELETE("planos/{id}/cancelar-assinatura")
    Call<ApiResponse<Void>> cancelarAssinatura(@Path("id") int idPlano);
    
    @GET("planos/{id}/valores")
    Call<Map<String, Double>> getValoresPlano(@Path("id") int idPlano);
    
    @GET("planos/{id}/uso")
    Call<Map<String, Object>> getUsoPlano(@Path("id") int idPlano);
    
    @GET("planos/pode-agendar/{id_servico}")
    Call<Map<String, Object>> podeAgendarComPlano(@Path("id_servico") int idServico);
    
    // ==================== CLIENTE ====================
    
    @GET("clientes/me")
    Call<ApiResponse<Map<String, Object>>> getMeusDados();
    
    @PUT("clientes/me")
    Call<ApiResponse<Map<String, Object>>> atualizarMeusDados(@Body Map<String, String> userData);
}

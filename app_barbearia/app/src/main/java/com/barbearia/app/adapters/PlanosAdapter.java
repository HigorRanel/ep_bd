package com.barbearia.app.adapters;

import android.app.DatePickerDialog;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.recyclerview.widget.RecyclerView;

import com.barbearia.app.R;
import com.barbearia.app.api.ApiClient;
import com.barbearia.app.api.BarbeariaApi;
import com.barbearia.app.models.PlanoMensal;
import com.barbearia.app.models.responses.ApiResponse;

import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Adapter para lista de planos mensais.
 * Implementa assinatura com seleção de data de início e cálculo automático do fim.
 */
public class PlanosAdapter extends RecyclerView.Adapter<PlanosAdapter.ViewHolder> {

    private final Context context;
    private final List<PlanoMensal> planos;
    private final BarbeariaApi api;

    public PlanosAdapter(Context context, List<PlanoMensal> planos) {
        this.context = context;
        this.planos = planos;
        this.api = ApiClient.getApiService(context);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_plano, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        PlanoMensal plano = planos.get(position);

        holder.txtPreco.setText(plano.getValorFormatado());
        holder.txtDesconto.setText(plano.getDescontoFormatado());
        holder.txtEconomia.setText(plano.getEconomiaFormatada());

        StringBuilder servicos = new StringBuilder();
        for (PlanoMensal.ServicoPlano s : plano.getServicos()) {
            servicos.append(s.getQuantidade()).append("x ").append(s.getNome())
                    .append(" (").append(s.getDescontoFormatado()).append(")\n");
        }
        holder.txtServicos.setText(servicos.toString().trim());

        holder.btnAssinar.setOnClickListener(v -> showSubscriptionDialog(plano, position));
    }

    @Override
    public int getItemCount() {
        return planos.size();
    }

    private void showSubscriptionDialog(PlanoMensal plano, int position) {
        View dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_subscribe_plan, null);

        TextView txtResumo = dialogView.findViewById(R.id.txt_plan_summary);
        Button btnDataInicio = dialogView.findViewById(R.id.btn_data_inicio);
        TextView txtDataFim = dialogView.findViewById(R.id.txt_data_fim_calculada);

        txtResumo.setText(plano.getValorFormatado() + " · " + plano.getDescontoFormatado()
                + " · Economize " + plano.getEconomiaFormatada());

        // Estado interno do dialog
        final String[] dataInicioSelecionada = {null};
        final String[] dataFimCalculada = {null};

        btnDataInicio.setOnClickListener(v -> {
            Calendar cal = Calendar.getInstance();
            new DatePickerDialog(context, (view, year, month, day) -> {
                dataInicioSelecionada[0] = String.format(Locale.getDefault(),
                        "%04d-%02d-%02d", year, month + 1, day);
                String dataInicioFormatada = String.format(Locale.getDefault(),
                        "%02d/%02d/%04d", day, month + 1, year);

                // Calcular data fim (30 dias depois)
                Calendar fim = Calendar.getInstance();
                fim.set(year, month, day);
                fim.add(Calendar.DAY_OF_MONTH, 30);
                dataFimCalculada[0] = String.format(Locale.getDefault(),
                        "%04d-%02d-%02d",
                        fim.get(Calendar.YEAR),
                        fim.get(Calendar.MONTH) + 1,
                        fim.get(Calendar.DAY_OF_MONTH));
                String dataFimFormatada = String.format(Locale.getDefault(),
                        "%02d/%02d/%04d",
                        fim.get(Calendar.DAY_OF_MONTH),
                        fim.get(Calendar.MONTH) + 1,
                        fim.get(Calendar.YEAR));

                btnDataInicio.setText(dataInicioFormatada);
                txtDataFim.setText("Válido até: " + dataFimFormatada);
            },
                    cal.get(Calendar.YEAR),
                    cal.get(Calendar.MONTH),
                    cal.get(Calendar.DAY_OF_MONTH)).show();
        });

        new AlertDialog.Builder(context)
                .setTitle(context.getString(R.string.subscribe_plan))
                .setView(dialogView)
                .setPositiveButton(context.getString(R.string.plan_subscribe_button), (dialog, which) -> {
                    if (dataInicioSelecionada[0] == null) {
                        Toast.makeText(context, "Selecione a data de início", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    assinarPlano(plano, dataInicioSelecionada[0], dataFimCalculada[0]);
                })
                .setNegativeButton(context.getString(R.string.dialog_cancel), null)
                .show();
    }

    private void assinarPlano(PlanoMensal plano, String dataInicio, String dataFim) {
        Map<String, Object> dados = new HashMap<>();
        dados.put("id_plano", plano.getIdPlanoMensal());
        dados.put("data_inicio", dataInicio);
        dados.put("data_fim", dataFim);

        Call<ApiResponse<Void>> call = api.assinarPlano(dados);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call,
                                   Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(context,
                            context.getString(R.string.success_plan_subscribed),
                            Toast.LENGTH_SHORT).show();
                } else {
                    String msg = context.getString(R.string.error_generic);
                    if (response.code() == 409) msg = "Você já possui uma assinatura ativa deste plano";
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Toast.makeText(context,
                        context.getString(R.string.error_network),
                        Toast.LENGTH_SHORT).show();
            }
        });
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView txtPreco, txtDesconto, txtEconomia, txtServicos;
        Button btnAssinar;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            txtPreco    = itemView.findViewById(R.id.txt_preco);
            txtDesconto = itemView.findViewById(R.id.txt_desconto);
            txtEconomia = itemView.findViewById(R.id.txt_economia);
            txtServicos = itemView.findViewById(R.id.txt_servicos);
            btnAssinar  = itemView.findViewById(R.id.btn_assinar);
        }
    }
}
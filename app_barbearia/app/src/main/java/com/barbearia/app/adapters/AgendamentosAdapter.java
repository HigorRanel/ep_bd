package com.barbearia.app.adapters;

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
import com.barbearia.app.models.Agendamento;
import com.barbearia.app.models.responses.ApiResponse;
import com.barbearia.app.utils.NotificationHelper;
import com.barbearia.app.utils.Utils;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Adapter para lista de agendamentos
 */
public class AgendamentosAdapter extends RecyclerView.Adapter<AgendamentosAdapter.ViewHolder> {
    
    private Context context;
    private List<Agendamento> agendamentos;
    private BarbeariaApi api;
    
    public AgendamentosAdapter(Context context, List<Agendamento> agendamentos) {
        this.context = context;
        this.agendamentos = agendamentos;
        this.api = ApiClient.getApiService(context);
    }
    
    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_agendamento, parent, false);
        return new ViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Agendamento agendamento = agendamentos.get(position);
        
        holder.txtServico.setText(agendamento.getServicoNome());
        holder.txtBarbeiro.setText(agendamento.getBarbeiroNome());
        holder.txtDataHora.setText(Utils.formatDateTimeBR(agendamento.getDataHoraAgendamento()));
        holder.txtPreco.setText(Utils.formatCurrency(agendamento.getPreco()));
        holder.txtStatus.setText(getStatusText(agendamento.getStatus()));
        
        // Configurar cor do status
        int statusColor = getStatusColor(agendamento.getStatus());
        holder.txtStatus.setTextColor(context.getResources().getColor(statusColor, null));
        
        // Configurar botões
        if (agendamento.podeCancelar()) {
            holder.btnCancel.setVisibility(View.VISIBLE);
            holder.btnCancel.setOnClickListener(v -> showCancelDialog(agendamento, position));
        } else {
            holder.btnCancel.setVisibility(View.GONE);
        }
        
        if (agendamento.podeAvaliar()) {
            holder.btnRate.setVisibility(View.VISIBLE);
            holder.btnRate.setOnClickListener(v -> {
                // TODO: Abrir dialog de avaliação
                Toast.makeText(context, "Avaliar atendimento", Toast.LENGTH_SHORT).show();
            });
        } else {
            holder.btnRate.setVisibility(View.GONE);
        }
    }
    
    @Override
    public int getItemCount() {
        return agendamentos.size();
    }
    
    private String getStatusText(String status) {
        switch (status) {
            case "pendente":
                return context.getString(R.string.status_pending);
            case "confirmado":
                return context.getString(R.string.status_confirmed);
            case "concluido":
                return context.getString(R.string.status_completed);
            case "cancelado":
                return context.getString(R.string.status_cancelled);
            case "falta":
                return context.getString(R.string.status_no_show);
            default:
                return status;
        }
    }
    
    private int getStatusColor(String status) {
        switch (status) {
            case "pendente":
                return android.R.color.holo_orange_dark;
            case "confirmado":
                return android.R.color.holo_blue_dark;
            case "concluido":
                return android.R.color.holo_green_dark;
            case "cancelado":
            case "falta":
                return android.R.color.holo_red_dark;
            default:
                return android.R.color.black;
        }
    }
    
    private void showCancelDialog(Agendamento agendamento, int position) {
        AlertDialog.Builder builder = new AlertDialog.Builder(context);
        builder.setTitle(context.getString(R.string.dialog_confirm_title));
        builder.setMessage(context.getString(R.string.dialog_confirm_cancel_appointment));
        builder.setPositiveButton(context.getString(R.string.dialog_yes), (dialog, which) -> {
            cancelarAgendamento(agendamento, position);
        });
        builder.setNegativeButton(context.getString(R.string.dialog_no), null);
        builder.show();
    }
    
    private void cancelarAgendamento(Agendamento agendamento, int position) {
        Call<ApiResponse<Void>> call = api.cancelarAgendamento(agendamento.getIdAgendamento());
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    // Cancelar notificação
                    NotificationHelper notificationHelper = new NotificationHelper(context);
                    notificationHelper.cancelAppointmentNotification(agendamento.getIdAgendamento());
                    
                    // Atualizar status
                    agendamento.setStatus("cancelado");
                    notifyItemChanged(position);
                    
                    Toast.makeText(context,
                            context.getString(R.string.success_appointment_cancelled),
                            Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(context,
                            context.getString(R.string.error_generic),
                            Toast.LENGTH_SHORT).show();
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
        TextView txtServico;
        TextView txtBarbeiro;
        TextView txtDataHora;
        TextView txtPreco;
        TextView txtStatus;
        Button btnCancel;
        Button btnRate;
        
        ViewHolder(@NonNull View itemView) {
            super(itemView);
            txtServico = itemView.findViewById(R.id.txt_servico);
            txtBarbeiro = itemView.findViewById(R.id.txt_barbeiro);
            txtDataHora = itemView.findViewById(R.id.txt_data_hora);
            txtPreco = itemView.findViewById(R.id.txt_preco);
            txtStatus = itemView.findViewById(R.id.txt_status);
            btnCancel = itemView.findViewById(R.id.btn_cancel);
            btnRate = itemView.findViewById(R.id.btn_rate);
        }
    }
}

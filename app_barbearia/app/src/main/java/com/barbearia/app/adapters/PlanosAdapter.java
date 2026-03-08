package com.barbearia.app.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.barbearia.app.R;
import com.barbearia.app.models.PlanoMensal;
import java.util.List;

public class PlanosAdapter extends RecyclerView.Adapter<PlanosAdapter.ViewHolder> {
    private Context context;
    private List<PlanoMensal> planos;
    
    public PlanosAdapter(Context context, List<PlanoMensal> planos) {
        this.context = context;
        this.planos = planos;
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
            servicos.append(s.getQuantidade()).append("x ").append(s.getNome()).append("\n");
        }
        holder.txtServicos.setText(servicos.toString().trim());
        
        holder.btnAssinar.setOnClickListener(v -> {
            Toast.makeText(context, "Assinar plano", Toast.LENGTH_SHORT).show();
        });
    }
    
    @Override
    public int getItemCount() {
        return planos.size();
    }
    
    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView txtPreco, txtDesconto, txtEconomia, txtServicos;
        Button btnAssinar;
        ViewHolder(@NonNull View itemView) {
            super(itemView);
            txtPreco = itemView.findViewById(R.id.txt_preco);
            txtDesconto = itemView.findViewById(R.id.txt_desconto);
            txtEconomia = itemView.findViewById(R.id.txt_economia);
            txtServicos = itemView.findViewById(R.id.txt_servicos);
            btnAssinar = itemView.findViewById(R.id.btn_assinar);
        }
    }
}

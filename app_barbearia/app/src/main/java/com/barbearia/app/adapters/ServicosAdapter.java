package com.barbearia.app.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.barbearia.app.R;
import com.barbearia.app.models.Servico;
import java.util.List;

public class ServicosAdapter extends RecyclerView.Adapter<ServicosAdapter.ViewHolder> {
    private Context context;
    private List<Servico> servicos;
    
    public ServicosAdapter(Context context, List<Servico> servicos) {
        this.context = context;
        this.servicos = servicos;
    }
    
    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_servico, parent, false);
        return new ViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Servico servico = servicos.get(position);
        holder.txtNome.setText(servico.getNome());
        holder.txtPreco.setText(servico.getPrecoFormatado());
        holder.txtDuracao.setText(servico.getDuracaoFormatada());
        if (servico.getDescricao() != null) {
            holder.txtDescricao.setText(servico.getDescricao());
            holder.txtDescricao.setVisibility(View.VISIBLE);
        } else {
            holder.txtDescricao.setVisibility(View.GONE);
        }
    }
    
    @Override
    public int getItemCount() {
        return servicos.size();
    }
    
    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView txtNome, txtPreco, txtDuracao, txtDescricao;
        ViewHolder(@NonNull View itemView) {
            super(itemView);
            txtNome = itemView.findViewById(R.id.txt_nome);
            txtPreco = itemView.findViewById(R.id.txt_preco);
            txtDuracao = itemView.findViewById(R.id.txt_duracao);
            txtDescricao = itemView.findViewById(R.id.txt_descricao);
        }
    }
}

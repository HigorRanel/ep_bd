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
import com.barbearia.app.models.Produto;
import java.util.List;

public class ProdutosAdapter extends RecyclerView.Adapter<ProdutosAdapter.ViewHolder> {
    private Context context;
    private List<Produto> produtos;
    
    public ProdutosAdapter(Context context, List<Produto> produtos) {
        this.context = context;
        this.produtos = produtos;
    }
    
    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_produto, parent, false);
        return new ViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Produto produto = produtos.get(position);
        holder.txtNome.setText(produto.getNomeProduto());
        holder.txtPreco.setText(produto.getPrecoFormatado());
        holder.txtCategoria.setText(produto.getCategoria());
        holder.txtEstoque.setText(String.valueOf(produto.getQuantidadeEstoque()));
        
        holder.btnReservar.setEnabled(produto.isDisponivel());
        holder.btnReservar.setOnClickListener(v -> {
            Toast.makeText(context, "Reservar: " + produto.getNomeProduto(), Toast.LENGTH_SHORT).show();
        });
    }
    
    @Override
    public int getItemCount() {
        return produtos.size();
    }
    
    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView txtNome, txtPreco, txtCategoria, txtEstoque;
        Button btnReservar;
        ViewHolder(@NonNull View itemView) {
            super(itemView);
            txtNome = itemView.findViewById(R.id.txt_nome);
            txtPreco = itemView.findViewById(R.id.txt_preco);
            txtCategoria = itemView.findViewById(R.id.txt_categoria);
            txtEstoque = itemView.findViewById(R.id.txt_estoque);
            btnReservar = itemView.findViewById(R.id.btn_reservar);
        }
    }
}

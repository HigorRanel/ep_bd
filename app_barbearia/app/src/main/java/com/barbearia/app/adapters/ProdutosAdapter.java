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
import com.barbearia.app.models.Produto;
import com.barbearia.app.models.Reserva;
import com.barbearia.app.models.responses.ApiResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Adapter para lista de produtos.
 * Corrigido: botão habilitado com base em estoque > 0, independente do campo "status".
 */
public class ProdutosAdapter extends RecyclerView.Adapter<ProdutosAdapter.ViewHolder> {

    private final Context context;
    private final List<Produto> produtos;
    private final BarbeariaApi api;

    public ProdutosAdapter(Context context, List<Produto> produtos) {
        this.context = context;
        this.produtos = produtos;
        this.api = ApiClient.getApiService(context);
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
        holder.txtEstoque.setText(context.getString(R.string.product_stock) +
                ": " + produto.getQuantidadeEstoque());

        // FIX: considera disponível se estoque > 0, independente do campo status
        // A API pode retornar status null, vazio, ou com valor diferente do esperado
        boolean disponivel = isDisponivel(produto);
        holder.btnReservar.setEnabled(disponivel);
        holder.btnReservar.setAlpha(disponivel ? 1f : 0.5f);
        holder.btnReservar.setText(disponivel
                ? context.getString(R.string.reserve_button)
                : context.getString(R.string.product_unavailable));

        holder.btnReservar.setOnClickListener(v -> showConfirmDialog(produto, position));
    }

    /**
     * Verifica disponibilidade de forma robusta:
     * - Aceita status "disponivel", "ativo", "active", null ou vazio (confia no estoque)
     * - Bloqueia apenas quando status é explicitamente "indisponivel" / "inativo"
     */
    private boolean isDisponivel(Produto produto) {
        if (produto.getQuantidadeEstoque() <= 0) return false;

        String status = produto.getStatus();
        if (status == null || status.isEmpty()) return true; // sem status → confia no estoque

        switch (status.toLowerCase().trim()) {
            case "indisponivel":
            case "inativo":
            case "inactive":
            case "unavailable":
                return false;
            default:
                return true; // "disponivel", "ativo", "active" ou qualquer outro valor
        }
    }

    @Override
    public int getItemCount() {
        return produtos.size();
    }

    private void showConfirmDialog(Produto produto, int position) {
        new AlertDialog.Builder(context)
                .setTitle(context.getString(R.string.reserve_product))
                .setMessage("Deseja reservar \"" + produto.getNomeProduto() + "\" por "
                        + produto.getPrecoFormatado() + "?")
                .setPositiveButton(context.getString(R.string.dialog_yes),
                        (dialog, which) -> reservarProduto(produto, position))
                .setNegativeButton(context.getString(R.string.dialog_no), null)
                .show();
    }

    private void reservarProduto(Produto produto, int position) {
        Map<String, Integer> dados = new HashMap<>();
        dados.put("id_produto", produto.getIdProduto());

        Call<ApiResponse<Reserva>> call = api.reservarProduto(dados);
        call.enqueue(new Callback<ApiResponse<Reserva>>() {
            @Override
            public void onResponse(Call<ApiResponse<Reserva>> call,
                                   Response<ApiResponse<Reserva>> response) {
                if (response.isSuccessful()) {
                    produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() - 1);
                    notifyItemChanged(position);
                    Toast.makeText(context,
                            context.getString(R.string.success_reservation_created),
                            Toast.LENGTH_SHORT).show();
                } else {
                    String msg = context.getString(R.string.error_generic);
                    if (response.code() == 400) {
                        msg = "Produto indisponível ou sem estoque";
                    } else if (response.code() == 409) {
                        msg = "Você já possui uma reserva deste produto";
                    }
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Reserva>> call, Throwable t) {
                Toast.makeText(context,
                        context.getString(R.string.error_network),
                        Toast.LENGTH_SHORT).show();
            }
        });
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView txtNome, txtPreco, txtCategoria, txtEstoque;
        Button btnReservar;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            txtNome      = itemView.findViewById(R.id.txt_nome);
            txtPreco     = itemView.findViewById(R.id.txt_preco);
            txtCategoria = itemView.findViewById(R.id.txt_categoria);
            txtEstoque   = itemView.findViewById(R.id.txt_estoque);
            btnReservar  = itemView.findViewById(R.id.btn_reservar);
        }
    }
}
package com.barbearia.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.barbearia.app.R;
import com.barbearia.app.adapters.ProdutosAdapter;
import com.barbearia.app.api.ApiClient;
import com.barbearia.app.api.BarbeariaApi;
import com.barbearia.app.models.Produto;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Fragment de produtos
 */
public class ProductsFragment extends Fragment {
    
    private RecyclerView recyclerView;
    private ProdutosAdapter adapter;
    private ProgressBar progressBar;
    private TextView txtEmpty;
    private SwipeRefreshLayout swipeRefresh;
    
    private BarbeariaApi api;
    private List<Produto> produtos;
    
    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_products, container, false);
        
        api = ApiClient.getApiService(requireContext());
        produtos = new ArrayList<>();
        
        initViews(view);
        setupRecyclerView();
        setupListeners();
        
        loadProdutos();
        
        return view;
    }
    
    private void initViews(View view) {
        recyclerView = view.findViewById(R.id.recycler_products);
        progressBar = view.findViewById(R.id.progress_bar);
        txtEmpty = view.findViewById(R.id.txt_empty);
        swipeRefresh = view.findViewById(R.id.swipe_refresh);
    }
    
    private void setupRecyclerView() {
        adapter = new ProdutosAdapter(requireContext(), produtos);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);
    }
    
    private void setupListeners() {
        swipeRefresh.setOnRefreshListener(() -> loadProdutos());
    }
    
    private void loadProdutos() {
        setLoading(true);
        
        Call<List<Produto>> call = api.getProdutos();
        call.enqueue(new Callback<List<Produto>>() {
            @Override
            public void onResponse(Call<List<Produto>> call, Response<List<Produto>> response) {
                if (getActivity() == null) return;
                
                requireActivity().runOnUiThread(() -> {
                    setLoading(false);
                    
                    if (response.isSuccessful() && response.body() != null) {
                        produtos.clear();
                        produtos.addAll(response.body());
                        adapter.notifyDataSetChanged();
                        
                        updateEmptyState();
                    } else {
                        Toast.makeText(requireContext(),
                                getString(R.string.error_generic),
                                Toast.LENGTH_SHORT).show();
                    }
                });
            }
            
            @Override
            public void onFailure(Call<List<Produto>> call, Throwable t) {
                if (getActivity() == null) return;
                
                requireActivity().runOnUiThread(() -> {
                    setLoading(false);
                    Toast.makeText(requireContext(),
                            getString(R.string.error_network),
                            Toast.LENGTH_SHORT).show();
                });
            }
        });
    }
    
    private void setLoading(boolean loading) {
        swipeRefresh.setRefreshing(loading);
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
    }
    
    private void updateEmptyState() {
        if (produtos.isEmpty()) {
            txtEmpty.setVisibility(View.VISIBLE);
            recyclerView.setVisibility(View.GONE);
        } else {
            txtEmpty.setVisibility(View.GONE);
            recyclerView.setVisibility(View.VISIBLE);
        }
    }
}

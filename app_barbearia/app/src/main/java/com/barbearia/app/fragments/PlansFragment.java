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
import com.barbearia.app.adapters.PlanosAdapter;
import com.barbearia.app.api.ApiClient;
import com.barbearia.app.api.BarbeariaApi;
import com.barbearia.app.models.PlanoMensal;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Fragment de planos mensais
 */
public class PlansFragment extends Fragment {
    
    private RecyclerView recyclerView;
    private PlanosAdapter adapter;
    private ProgressBar progressBar;
    private TextView txtEmpty;
    private SwipeRefreshLayout swipeRefresh;
    
    private BarbeariaApi api;
    private List<PlanoMensal> planos;
    
    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_plans, container, false);
        
        api = ApiClient.getApiService(requireContext());
        planos = new ArrayList<>();
        
        initViews(view);
        setupRecyclerView();
        setupListeners();
        
        loadPlanos();
        
        return view;
    }
    
    private void initViews(View view) {
        recyclerView = view.findViewById(R.id.recycler_plans);
        progressBar = view.findViewById(R.id.progress_bar);
        txtEmpty = view.findViewById(R.id.txt_empty);
        swipeRefresh = view.findViewById(R.id.swipe_refresh);
    }
    
    private void setupRecyclerView() {
        adapter = new PlanosAdapter(requireContext(), planos);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);
    }
    
    private void setupListeners() {
        swipeRefresh.setOnRefreshListener(() -> loadPlanos());
    }
    
    private void loadPlanos() {
        setLoading(true);
        
        Call<List<PlanoMensal>> call = api.getPlanos();
        call.enqueue(new Callback<List<PlanoMensal>>() {
            @Override
            public void onResponse(Call<List<PlanoMensal>> call, Response<List<PlanoMensal>> response) {
                if (getActivity() == null) return;
                
                requireActivity().runOnUiThread(() -> {
                    setLoading(false);
                    
                    if (response.isSuccessful() && response.body() != null) {
                        planos.clear();
                        planos.addAll(response.body());
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
            public void onFailure(Call<List<PlanoMensal>> call, Throwable t) {
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
        if (planos.isEmpty()) {
            txtEmpty.setVisibility(View.VISIBLE);
            recyclerView.setVisibility(View.GONE);
        } else {
            txtEmpty.setVisibility(View.GONE);
            recyclerView.setVisibility(View.VISIBLE);
        }
    }
}

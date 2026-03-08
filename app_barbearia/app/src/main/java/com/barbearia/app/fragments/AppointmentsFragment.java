package com.barbearia.app.fragments;

import android.content.Intent;
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
import com.barbearia.app.adapters.AgendamentosAdapter;
import com.barbearia.app.api.ApiClient;
import com.barbearia.app.api.BarbeariaApi;
import com.barbearia.app.models.Agendamento;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Fragment de agendamentos
 */
public class AppointmentsFragment extends Fragment {
    
    private RecyclerView recyclerView;
    private AgendamentosAdapter adapter;
    private ProgressBar progressBar;
    private TextView txtEmpty;
    private SwipeRefreshLayout swipeRefresh;
    private FloatingActionButton fabNew;
    
    private BarbeariaApi api;
    private List<Agendamento> agendamentos;
    
    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_appointments, container, false);
        
        api = ApiClient.getApiService(requireContext());
        agendamentos = new ArrayList<>();
        
        initViews(view);
        setupRecyclerView();
        setupListeners();
        
        loadAgendamentos();
        
        return view;
    }
    
    private void initViews(View view) {
        recyclerView = view.findViewById(R.id.recycler_appointments);
        progressBar = view.findViewById(R.id.progress_bar);
        txtEmpty = view.findViewById(R.id.txt_empty);
        swipeRefresh = view.findViewById(R.id.swipe_refresh);
        fabNew = view.findViewById(R.id.fab_new_appointment);
    }
    
    private void setupRecyclerView() {
        adapter = new AgendamentosAdapter(requireContext(), agendamentos);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);
    }
    
    private void setupListeners() {
        swipeRefresh.setOnRefreshListener(() -> loadAgendamentos());
        
        fabNew.setOnClickListener(v -> {
            // TODO: Abrir tela de novo agendamento
            Toast.makeText(requireContext(), "Novo agendamento", Toast.LENGTH_SHORT).show();
        });
    }
    
    private void loadAgendamentos() {
        setLoading(true);
        
        Call<List<Agendamento>> call = api.getMeusAgendamentos();
        call.enqueue(new Callback<List<Agendamento>>() {
            @Override
            public void onResponse(Call<List<Agendamento>> call, Response<List<Agendamento>> response) {
                if (getActivity() == null) return;
                
                requireActivity().runOnUiThread(() -> {
                    setLoading(false);
                    
                    if (response.isSuccessful() && response.body() != null) {
                        agendamentos.clear();
                        agendamentos.addAll(response.body());
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
            public void onFailure(Call<List<Agendamento>> call, Throwable t) {
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
        if (agendamentos.isEmpty()) {
            txtEmpty.setVisibility(View.VISIBLE);
            recyclerView.setVisibility(View.GONE);
        } else {
            txtEmpty.setVisibility(View.GONE);
            recyclerView.setVisibility(View.VISIBLE);
        }
    }
}

package com.barbearia.app.activities;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.barbearia.app.R;
import com.barbearia.app.api.ApiClient;
import com.barbearia.app.api.BarbeariaApi;
import com.barbearia.app.models.Agendamento;
import com.barbearia.app.models.Barbeiro;
import com.barbearia.app.models.Servico;
import com.barbearia.app.models.responses.ApiResponse;
import com.barbearia.app.utils.NotificationHelper;
import com.barbearia.app.utils.Utils;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Activity para criar um novo agendamento.
 * Fluxo: Selecionar serviço → Selecionar barbeiro → Selecionar data → Selecionar horário → Confirmar
 */
public class NewAppointmentActivity extends AppCompatActivity {

    private Spinner spinnerServico;
    private Spinner spinnerBarbeiro;
    private Button btnSelectDate;
    private RecyclerView recyclerHorarios;
    private Button btnAgendar;
    private ProgressBar progressBar;
    private TextView txtSelectedDate;
    private TextView txtPrecoEstimado;

    private BarbeariaApi api;

    private List<Servico> servicos = new ArrayList<>();
    private List<Barbeiro> barbeiros = new ArrayList<>();
    private List<String> horariosDisponiveis = new ArrayList<>();

    private Servico servicoSelecionado;
    private Barbeiro barbeiroSelecionado;
    private String dataSelecionada; // yyyy-MM-dd
    private String horarioSelecionado; // HH:mm

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_new_appointment);

        api = ApiClient.getApiService(this);

        initViews();
        setupListeners();
        loadServicos();
        loadBarbeiros();
    }

    private void initViews() {
        spinnerServico = findViewById(R.id.spinner_servico);
        spinnerBarbeiro = findViewById(R.id.spinner_barbeiro);
        btnSelectDate = findViewById(R.id.btn_select_date);
        recyclerHorarios = findViewById(R.id.recycler_horarios);
        btnAgendar = findViewById(R.id.btn_agendar);
        progressBar = findViewById(R.id.progress_bar);
        txtSelectedDate = findViewById(R.id.txt_selected_date);
        txtPrecoEstimado = findViewById(R.id.txt_preco_estimado);

        progressBar.setVisibility(View.GONE);
        btnAgendar.setEnabled(false);

        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle(getString(R.string.new_appointment));
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }
    }

    private void setupListeners() {
        spinnerServico.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position > 0 && position - 1 < servicos.size()) {
                    servicoSelecionado = servicos.get(position - 1);
                    txtPrecoEstimado.setText(servicoSelecionado.getPrecoFormatado() +
                            " · " + servicoSelecionado.getDuracaoFormatada());
                    resetHorarios();
                } else {
                    servicoSelecionado = null;
                    txtPrecoEstimado.setText("");
                    resetHorarios();
                }
                checkPodeAgendar();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        spinnerBarbeiro.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position > 0 && position - 1 < barbeiros.size()) {
                    barbeiroSelecionado = barbeiros.get(position - 1);
                } else {
                    barbeiroSelecionado = null;
                }
                resetHorarios();
                checkPodeAgendar();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        btnSelectDate.setOnClickListener(v -> mostrarDatePicker());

        btnAgendar.setOnClickListener(v -> criarAgendamento());
    }

    private void mostrarDatePicker() {
        Calendar calendar = Calendar.getInstance();

        DatePickerDialog dialog = new DatePickerDialog(
                this,
                (view, year, month, dayOfMonth) -> {
                    Calendar selected = Calendar.getInstance();
                    selected.set(year, month, dayOfMonth);

                    // Não permitir datas no passado
                    Calendar hoje = Calendar.getInstance();
                    hoje.set(Calendar.HOUR_OF_DAY, 0);
                    hoje.set(Calendar.MINUTE, 0);
                    hoje.set(Calendar.SECOND, 0);

                    if (selected.before(hoje)) {
                        Toast.makeText(this, "Selecione uma data futura", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    dataSelecionada = String.format(Locale.getDefault(), "%04d-%02d-%02d",
                            year, month + 1, dayOfMonth);
                    String dataFormatada = String.format(Locale.getDefault(), "%02d/%02d/%04d",
                            dayOfMonth, month + 1, year);
                    txtSelectedDate.setText(dataFormatada);
                    btnSelectDate.setText(dataFormatada);

                    loadHorariosDisponiveis();
                },
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
        );

        // Não permitir datas passadas
        dialog.getDatePicker().setMinDate(System.currentTimeMillis() - 1000);
        dialog.show();
    }

    private void loadServicos() {
        setLoading(true);
        Call<List<Servico>> call = api.getServicos();
        call.enqueue(new Callback<List<Servico>>() {
            @Override
            public void onResponse(Call<List<Servico>> call, Response<List<Servico>> response) {
                runOnUiThread(() -> {
                    setLoading(false);
                    if (response.isSuccessful() && response.body() != null) {
                        servicos.clear();
                        servicos.addAll(response.body());
                        popularSpinnerServicos();
                    }
                });
            }

            @Override
            public void onFailure(Call<List<Servico>> call, Throwable t) {
                runOnUiThread(() -> {
                    setLoading(false);
                    Toast.makeText(NewAppointmentActivity.this,
                            getString(R.string.error_network), Toast.LENGTH_SHORT).show();
                });
            }
        });
    }

    private void loadBarbeiros() {
        Call<List<Barbeiro>> call = api.getBarbeiros();
        call.enqueue(new Callback<List<Barbeiro>>() {
            @Override
            public void onResponse(Call<List<Barbeiro>> call, Response<List<Barbeiro>> response) {
                runOnUiThread(() -> {
                    if (response.isSuccessful() && response.body() != null) {
                        barbeiros.clear();
                        barbeiros.addAll(response.body());
                        popularSpinnerBarbeiros();
                    }
                });
            }

            @Override
            public void onFailure(Call<List<Barbeiro>> call, Throwable t) {
                runOnUiThread(() -> Toast.makeText(NewAppointmentActivity.this,
                        getString(R.string.error_network), Toast.LENGTH_SHORT).show());
            }
        });
    }

    private void loadHorariosDisponiveis() {
        if (barbeiroSelecionado == null || dataSelecionada == null || servicoSelecionado == null) return;

        setLoading(true);
        horariosDisponiveis.clear();

        Call<Map<String, Object>> call = api.getHorariosDisponiveis(
                barbeiroSelecionado.getCpf(),
                dataSelecionada,
                servicoSelecionado.getDuracaoEstimadaMin()
        );

        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                runOnUiThread(() -> {
                    setLoading(false);
                    if (response.isSuccessful() && response.body() != null) {
                        Object horariosObj = response.body().get("horarios_disponiveis");
                        if (horariosObj instanceof List) {
                            for (Object h : (List<?>) horariosObj) {
                                horariosDisponiveis.add(h.toString());
                            }
                        }
                        popularRecyclerHorarios();
                    } else {
                        Toast.makeText(NewAppointmentActivity.this,
                                "Nenhum horário disponível para esta data", Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                runOnUiThread(() -> {
                    setLoading(false);
                    Toast.makeText(NewAppointmentActivity.this,
                            getString(R.string.error_network), Toast.LENGTH_SHORT).show();
                });
            }
        });
    }

    private void popularSpinnerServicos() {
        List<String> nomes = new ArrayList<>();
        nomes.add(getString(R.string.select_service));
        for (Servico s : servicos) {
            nomes.add(s.getNome() + " — " + s.getPrecoFormatado());
        }
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, nomes);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerServico.setAdapter(adapter);
    }

    private void popularSpinnerBarbeiros() {
        List<String> nomes = new ArrayList<>();
        nomes.add(getString(R.string.select_barber));
        for (Barbeiro b : barbeiros) {
            nomes.add(b.getNomeCompleto());
        }
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, nomes);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerBarbeiro.setAdapter(adapter);
    }

    private void popularRecyclerHorarios() {
        HorariosAdapter adapter = new HorariosAdapter(horariosDisponiveis, horario -> {
            horarioSelecionado = horario;
            checkPodeAgendar();
        });
        recyclerHorarios.setLayoutManager(new GridLayoutManager(this, 3));
        recyclerHorarios.setAdapter(adapter);
    }

    private void resetHorarios() {
        horariosDisponiveis.clear();
        horarioSelecionado = null;
        if (recyclerHorarios.getAdapter() != null) {
            recyclerHorarios.setAdapter(null);
        }
        // Recarregar se tiver data selecionada
        if (dataSelecionada != null && barbeiroSelecionado != null && servicoSelecionado != null) {
            loadHorariosDisponiveis();
        }
    }

    private void checkPodeAgendar() {
        btnAgendar.setEnabled(
                servicoSelecionado != null &&
                        barbeiroSelecionado != null &&
                        dataSelecionada != null &&
                        horarioSelecionado != null
        );
    }

    private void criarAgendamento() {
        if (!Utils.isNetworkAvailable(this)) {
            Toast.makeText(this, getString(R.string.error_network), Toast.LENGTH_SHORT).show();
            return;
        }

        setLoading(true);
        btnAgendar.setEnabled(false);

        String dataHora = dataSelecionada + " " + horarioSelecionado + ":00";

        Map<String, Object> dados = new HashMap<>();
        dados.put("cpf_barbeiro", barbeiroSelecionado.getCpf());
        dados.put("id_servico", servicoSelecionado.getIdServico());
        dados.put("data_hora_agendamento", dataHora);

        Call<ApiResponse<Agendamento>> call = api.criarAgendamento(dados);
        call.enqueue(new Callback<ApiResponse<Agendamento>>() {
            @Override
            public void onResponse(Call<ApiResponse<Agendamento>> call,
                                   Response<ApiResponse<Agendamento>> response) {
                runOnUiThread(() -> {
                    setLoading(false);
                    if (response.isSuccessful() && response.body() != null
                            && response.body().isSuccessful()) {
                        Agendamento agendamento = response.body().getData();
                        if (agendamento != null) {
                            // Agendar notificação
                            new NotificationHelper(NewAppointmentActivity.this)
                                    .scheduleAppointmentNotification(agendamento);
                        }
                        Toast.makeText(NewAppointmentActivity.this,
                                getString(R.string.success_appointment_created),
                                Toast.LENGTH_SHORT).show();
                        setResult(RESULT_OK);
                        finish();
                    } else {
                        btnAgendar.setEnabled(true);
                        String erro = response.body() != null ? response.body().getMessage() : null;
                        Toast.makeText(NewAppointmentActivity.this,
                                erro != null ? erro : getString(R.string.error_generic),
                                Toast.LENGTH_LONG).show();
                    }
                });
            }

            @Override
            public void onFailure(Call<ApiResponse<Agendamento>> call, Throwable t) {
                runOnUiThread(() -> {
                    setLoading(false);
                    btnAgendar.setEnabled(true);
                    Toast.makeText(NewAppointmentActivity.this,
                            getString(R.string.error_network), Toast.LENGTH_SHORT).show();
                });
            }
        });
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }

    // ── Adapter interno para horários ──────────────────────────────────────

    public interface OnHorarioClickListener {
        void onClick(String horario);
    }

    public static class HorariosAdapter
            extends RecyclerView.Adapter<HorariosAdapter.ViewHolder> {

        private final List<String> horarios;
        private final OnHorarioClickListener listener;
        private int selectedPosition = -1;

        public HorariosAdapter(List<String> horarios, OnHorarioClickListener listener) {
            this.horarios = horarios;
            this.listener = listener;
        }

        @Override
        public ViewHolder onCreateViewHolder(android.view.ViewGroup parent, int viewType) {
            Button btn = new Button(parent.getContext());
            RecyclerView.LayoutParams params = new RecyclerView.LayoutParams(
                    RecyclerView.LayoutParams.MATCH_PARENT,
                    RecyclerView.LayoutParams.WRAP_CONTENT);
            params.setMargins(4, 4, 4, 4);
            btn.setLayoutParams(params);
            return new ViewHolder(btn);
        }

        @Override
        public void onBindViewHolder(ViewHolder holder, int position) {
            String horario = horarios.get(position);
            holder.button.setText(horario);
            holder.button.setSelected(position == selectedPosition);
            holder.button.setAlpha(position == selectedPosition ? 1f : 0.6f);
            holder.button.setOnClickListener(v -> {
                selectedPosition = holder.getAdapterPosition();
                notifyDataSetChanged();
                listener.onClick(horario);
            });
        }

        @Override
        public int getItemCount() { return horarios.size(); }

        static class ViewHolder extends RecyclerView.ViewHolder {
            Button button;
            ViewHolder(Button btn) {
                super(btn);
                this.button = btn;
            }
        }
    }
}
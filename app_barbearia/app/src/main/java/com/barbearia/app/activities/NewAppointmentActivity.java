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
import com.barbearia.app.models.User;
import com.barbearia.app.models.responses.ApiResponse;
import com.barbearia.app.utils.NotificationHelper;
import com.barbearia.app.utils.SessionManager;
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
 *
 * Fluxo corrigido:
 *  1. Selecionar barbeiro
 *  2. Selecionar serviço (filtrado pelos serviços do barbeiro escolhido)
 *  3. Selecionar data
 *  4. Selecionar horário disponível
 *  5. Confirmar → envia cpf_cliente junto com os demais dados
 */
public class NewAppointmentActivity extends AppCompatActivity {

    // ── Views ──────────────────────────────────────────────────────────────
    private Spinner spinnerBarbeiro;
    private Spinner spinnerServico;
    private Button btnSelectDate;
    private RecyclerView recyclerHorarios;
    private Button btnAgendar;
    private ProgressBar progressBar;
    private TextView txtSelectedDate;
    private TextView txtPrecoEstimado;

    // ── API / Session ──────────────────────────────────────────────────────
    private BarbeariaApi api;
    private SessionManager sessionManager;

    // ── Dados carregados ───────────────────────────────────────────────────
    /** Lista completa de barbeiros (carregada uma única vez) */
    private final List<Barbeiro> todosBarbeiros = new ArrayList<>();

    /** Todos os serviços da barbearia (carregados uma única vez) */
    private final List<Servico> todosServicos = new ArrayList<>();

    /** Serviços filtrados conforme o barbeiro selecionado */
    private final List<Servico> servicosFiltrados = new ArrayList<>();

    /** Horários disponíveis para a combinação barbeiro + serviço + data */
    private final List<String> horariosDisponiveis = new ArrayList<>();

    // ── Seleções do usuário ────────────────────────────────────────────────
    private Barbeiro barbeiroSelecionado;
    private Servico  servicoSelecionado;
    private String   dataSelecionada;   // yyyy-MM-dd
    private String   horarioSelecionado; // HH:mm

    // ── Flags de carregamento ──────────────────────────────────────────────
    private boolean barbeirosCarregados = false;
    private boolean servicosCarregados  = false;

    // ══════════════════════════════════════════════════════════════════════
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_new_appointment);

        api            = ApiClient.getApiService(this);
        sessionManager = new SessionManager(this);

        initViews();
        setupListeners();

        // Carrega barbeiros e todos os serviços em paralelo
        loadBarbeiros();
        loadTodosServicos();
    }

    // ── Inicialização ──────────────────────────────────────────────────────

    private void initViews() {
        spinnerBarbeiro  = findViewById(R.id.spinner_barbeiro);
        spinnerServico   = findViewById(R.id.spinner_servico);
        btnSelectDate    = findViewById(R.id.btn_select_date);
        recyclerHorarios = findViewById(R.id.recycler_horarios);
        btnAgendar       = findViewById(R.id.btn_agendar);
        progressBar      = findViewById(R.id.progress_bar);
        txtSelectedDate  = findViewById(R.id.txt_selected_date);
        txtPrecoEstimado = findViewById(R.id.txt_preco_estimado);

        progressBar.setVisibility(View.GONE);
        btnAgendar.setEnabled(false);

        // Desabilita serviço e data enquanto barbeiro não for escolhido
        spinnerServico.setEnabled(false);
        btnSelectDate.setEnabled(false);

        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle(getString(R.string.new_appointment));
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }
    }

    private void setupListeners() {

        // 1. Barbeiro selecionado → filtra serviços
        spinnerBarbeiro.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position > 0 && position - 1 < todosBarbeiros.size()) {
                    barbeiroSelecionado = todosBarbeiros.get(position - 1);
                    filtrarServicosDoBarbeiro();
                    spinnerServico.setEnabled(true);
                } else {
                    barbeiroSelecionado = null;
                    servicoSelecionado  = null;
                    spinnerServico.setEnabled(false);
                    btnSelectDate.setEnabled(false);
                    limparServicosSpinner();
                }
                resetHorarios();
                checkPodeAgendar();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        // 2. Serviço selecionado → habilita escolha de data
        spinnerServico.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position > 0 && position - 1 < servicosFiltrados.size()) {
                    servicoSelecionado = servicosFiltrados.get(position - 1);
                    txtPrecoEstimado.setText(servicoSelecionado.getPrecoFormatado()
                            + " · " + servicoSelecionado.getDuracaoFormatada());
                    btnSelectDate.setEnabled(true);
                } else {
                    servicoSelecionado = null;
                    txtPrecoEstimado.setText("");
                    btnSelectDate.setEnabled(false);
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

    // ── Carregamento de dados ──────────────────────────────────────────────

    private void loadBarbeiros() {
        setLoading(true);
        Call<List<Barbeiro>> call = api.getBarbeiros();
        call.enqueue(new Callback<List<Barbeiro>>() {
            @Override
            public void onResponse(Call<List<Barbeiro>> call, Response<List<Barbeiro>> response) {
                runOnUiThread(() -> {
                    barbeirosCarregados = true;
                    if (response.isSuccessful() && response.body() != null) {
                        todosBarbeiros.clear();
                        todosBarbeiros.addAll(response.body());
                        popularSpinnerBarbeiros();
                    } else {
                        Toast.makeText(NewAppointmentActivity.this,
                                getString(R.string.error_generic), Toast.LENGTH_SHORT).show();
                    }
                    atualizarLoading();
                });
            }

            @Override
            public void onFailure(Call<List<Barbeiro>> call, Throwable t) {
                runOnUiThread(() -> {
                    barbeirosCarregados = true;
                    atualizarLoading();
                    Toast.makeText(NewAppointmentActivity.this,
                            getString(R.string.error_network), Toast.LENGTH_SHORT).show();
                });
            }
        });
    }

    private void loadTodosServicos() {
        Call<List<Servico>> call = api.getServicos();
        call.enqueue(new Callback<List<Servico>>() {
            @Override
            public void onResponse(Call<List<Servico>> call, Response<List<Servico>> response) {
                runOnUiThread(() -> {
                    servicosCarregados = true;
                    if (response.isSuccessful() && response.body() != null) {
                        todosServicos.clear();
                        todosServicos.addAll(response.body());
                        // Se barbeiro já estiver selecionado quando os serviços chegarem, filtra
                        if (barbeiroSelecionado != null) filtrarServicosDoBarbeiro();
                    }
                    atualizarLoading();
                });
            }

            @Override
            public void onFailure(Call<List<Servico>> call, Throwable t) {
                runOnUiThread(() -> {
                    servicosCarregados = true;
                    atualizarLoading();
                    Toast.makeText(NewAppointmentActivity.this,
                            getString(R.string.error_network), Toast.LENGTH_SHORT).show();
                });
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
                        if (horariosDisponiveis.isEmpty()) {
                            Toast.makeText(NewAppointmentActivity.this,
                                    "Nenhum horário disponível para esta data", Toast.LENGTH_SHORT).show();
                        } else {
                            popularRecyclerHorarios();
                        }
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

    // ── Filtro de serviços por barbeiro ────────────────────────────────────

    /**
     * Filtra todosServicos mantendo apenas os que o barbeiro selecionado oferece.
     * A API retorna em Servico.getBarbeiros() uma lista de CPFs ou nomes dos barbeiros.
     * Se a lista de barbeiros do serviço estiver vazia/null, exibe o serviço para todos.
     */
    private void filtrarServicosDoBarbeiro() {
        servicosFiltrados.clear();
        servicoSelecionado = null;
        txtPrecoEstimado.setText("");

        if (barbeiroSelecionado == null) {
            limparServicosSpinner();
            return;
        }

        String cpfBarbeiro  = barbeiroSelecionado.getCpf();
        String nomeBarbeiro = barbeiroSelecionado.getNomeCompleto();

        for (Servico s : todosServicos) {
            List<String> barbeirosDoServico = s.getBarbeiros();
            if (barbeirosDoServico == null || barbeirosDoServico.isEmpty()) {
                // Sem restrição de barbeiro → disponível para todos
                servicosFiltrados.add(s);
            } else {
                // Verifica se o CPF ou nome do barbeiro está na lista
                for (String b : barbeirosDoServico) {
                    if (b != null && (b.equals(cpfBarbeiro) || b.equalsIgnoreCase(nomeBarbeiro))) {
                        servicosFiltrados.add(s);
                        break;
                    }
                }
            }
        }

        popularSpinnerServicos();
    }

    // ── Populadores de UI ──────────────────────────────────────────────────

    private void popularSpinnerBarbeiros() {
        List<String> nomes = new ArrayList<>();
        nomes.add(getString(R.string.select_barber));
        for (Barbeiro b : todosBarbeiros) {
            String label = b.getNomeCompleto();
            if (b.getMediaAvaliacoes() != null && b.getMediaAvaliacoes() > 0) {
                label += " ★" + b.getMediaFormatada();
            }
            nomes.add(label);
        }
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, nomes);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerBarbeiro.setAdapter(adapter);
    }

    private void popularSpinnerServicos() {
        List<String> nomes = new ArrayList<>();
        nomes.add(getString(R.string.select_service));
        for (Servico s : servicosFiltrados) {
            nomes.add(s.getNome() + " — " + s.getPrecoFormatado());
        }
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, nomes);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerServico.setAdapter(adapter);
    }

    private void limparServicosSpinner() {
        servicosFiltrados.clear();
        List<String> placeholder = new ArrayList<>();
        placeholder.add(getString(R.string.select_service));
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, placeholder);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerServico.setAdapter(adapter);
    }

    private void popularRecyclerHorarios() {
        HorariosAdapter adapter = new HorariosAdapter(horariosDisponiveis, horario -> {
            horarioSelecionado = horario;
            checkPodeAgendar();
        });
        recyclerHorarios.setLayoutManager(new GridLayoutManager(this, 3));
        recyclerHorarios.setAdapter(adapter);
    }

    // ── Date picker ────────────────────────────────────────────────────────

    private void mostrarDatePicker() {
        Calendar calendar = Calendar.getInstance();

        DatePickerDialog dialog = new DatePickerDialog(
                this,
                (view, year, month, dayOfMonth) -> {
                    Calendar selected = Calendar.getInstance();
                    selected.set(year, month, dayOfMonth);

                    Calendar hoje = Calendar.getInstance();
                    hoje.set(Calendar.HOUR_OF_DAY, 0);
                    hoje.set(Calendar.MINUTE, 0);
                    hoje.set(Calendar.SECOND, 0);
                    hoje.set(Calendar.MILLISECOND, 0);

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

                    horarioSelecionado = null;
                    loadHorariosDisponiveis();
                },
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
        );

        dialog.getDatePicker().setMinDate(System.currentTimeMillis() - 1000);
        dialog.show();
    }

    // ── Criação do agendamento ─────────────────────────────────────────────

    private void criarAgendamento() {
        if (!Utils.isNetworkAvailable(this)) {
            Toast.makeText(this, getString(R.string.error_network), Toast.LENGTH_SHORT).show();
            return;
        }

        // FIX: obtém cpf_cliente da sessão e inclui na requisição
        User usuarioLogado = sessionManager.getUser();
        if (usuarioLogado == null || usuarioLogado.getCpf() == null) {
            Toast.makeText(this, "Sessão inválida. Faça login novamente.", Toast.LENGTH_LONG).show();
            return;
        }

        setLoading(true);
        btnAgendar.setEnabled(false);

        String dataHora = dataSelecionada + " " + horarioSelecionado + ":00";

        Map<String, Object> dados = new HashMap<>();
        dados.put("cpf_cliente", usuarioLogado.getCpf());          // FIX: campo ausente adicionado
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

    // ── Helpers ────────────────────────────────────────────────────────────

    private void resetHorarios() {
        horariosDisponiveis.clear();
        horarioSelecionado = null;
        recyclerHorarios.setAdapter(null);
        dataSelecionada = null;
        txtSelectedDate.setText("");
        btnSelectDate.setText(getString(R.string.select_date));
        checkPodeAgendar();
    }

    private void checkPodeAgendar() {
        btnAgendar.setEnabled(
                barbeiroSelecionado != null &&
                        servicoSelecionado  != null &&
                        dataSelecionada     != null &&
                        horarioSelecionado  != null
        );
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
    }

    /** Esconde o loading global apenas quando ambas as chamadas paralelas terminarem */
    private void atualizarLoading() {
        if (barbeirosCarregados && servicosCarregados) {
            setLoading(false);
        }
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }

    // ── Adapter interno de horários ────────────────────────────────────────

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
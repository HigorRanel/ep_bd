package com.barbearia.app.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.barbearia.app.R;
import com.barbearia.app.fragments.AppointmentsFragment;
import com.barbearia.app.fragments.HomeFragment;
import com.barbearia.app.fragments.PlansFragment;
import com.barbearia.app.fragments.ProductsFragment;
import com.barbearia.app.fragments.ProfileFragment;
import com.barbearia.app.utils.SessionManager;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.navigation.NavigationBarView;

/**
 * Activity principal com navegação por fragments
 */
public class MainActivity extends AppCompatActivity {
    
    private BottomNavigationView bottomNavigationView;
    private SessionManager sessionManager;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        sessionManager = new SessionManager(this);
        
        // Verificar se está logado
        if (!sessionManager.isLoggedIn()) {
            navegarParaLogin();
            return;
        }
        
        initViews();
        setupNavigation();
        
        // Carregar fragment inicial
        if (savedInstanceState == null) {
            loadFragment(new HomeFragment());
        }
        
        // Verificar se deve abrir agendamentos (vindo de notificação)
        if (getIntent().getBooleanExtra("open_appointments", false)) {
            loadFragment(new AppointmentsFragment());
            bottomNavigationView.setSelectedItemId(R.id.nav_appointments);
        }
    }
    
    private void initViews() {
        bottomNavigationView = findViewById(R.id.bottom_navigation);
    }
    
    private void setupNavigation() {
        bottomNavigationView.setOnItemSelectedListener(new NavigationBarView.OnItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                Fragment selectedFragment = null;
                
                int itemId = item.getItemId();
                
                if (itemId == R.id.nav_home) {
                    selectedFragment = new HomeFragment();
                } else if (itemId == R.id.nav_appointments) {
                    selectedFragment = new AppointmentsFragment();
                } else if (itemId == R.id.nav_plans) {
                    selectedFragment = new PlansFragment();
                } else if (itemId == R.id.nav_products) {
                    selectedFragment = new ProductsFragment();
                } else if (itemId == R.id.nav_profile) {
                    selectedFragment = new ProfileFragment();
                }
                
                if (selectedFragment != null) {
                    loadFragment(selectedFragment);
                    return true;
                }
                
                return false;
            }
        });
    }
    
    private void loadFragment(Fragment fragment) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commit();
    }
    
    private void navegarParaLogin() {
        Intent intent = new Intent(MainActivity.this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
    
    @Override
    public void onBackPressed() {
        // Se estiver no Home, sair do app
        if (bottomNavigationView.getSelectedItemId() == R.id.nav_home) {
            super.onBackPressed();
        } else {
            // Caso contrário, voltar para o Home
            bottomNavigationView.setSelectedItemId(R.id.nav_home);
        }
    }
}

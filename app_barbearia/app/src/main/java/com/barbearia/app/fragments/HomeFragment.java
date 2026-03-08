package com.barbearia.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.barbearia.app.R;
import com.barbearia.app.models.User;
import com.barbearia.app.utils.SessionManager;

/**
 * Fragment da tela inicial (Home)
 */
public class HomeFragment extends Fragment {
    
    private TextView txtWelcome;
    private TextView txtUserName;
    private SessionManager sessionManager;
    
    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, 
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home, container, false);
        
        sessionManager = new SessionManager(requireContext());
        
        initViews(view);
        loadUserInfo();
        
        return view;
    }
    
    private void initViews(View view) {
        txtWelcome = view.findViewById(R.id.txt_welcome);
        txtUserName = view.findViewById(R.id.txt_user_name);
    }
    
    private void loadUserInfo() {
        User user = sessionManager.getUser();
        if (user != null) {
            String firstName = user.getNome().split(" ")[0];
            txtUserName.setText(firstName);
        }
    }
}

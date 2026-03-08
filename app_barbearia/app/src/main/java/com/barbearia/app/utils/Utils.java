package com.barbearia.app.utils;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.widget.Toast;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Classe com métodos utilitários gerais
 */
public class Utils {
    
    /**
     * Verifica se há conexão com a internet
     */
    public static boolean isNetworkAvailable(Context context) {
        ConnectivityManager connectivityManager = 
                (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        
        if (connectivityManager != null) {
            NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
            return activeNetworkInfo != null && activeNetworkInfo.isConnected();
        }
        return false;
    }
    
    /**
     * Mostra um Toast de forma simples
     */
    public static void showToast(Context context, String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }
    
    /**
     * Mostra um Toast longo
     */
    public static void showLongToast(Context context, String message) {
        Toast.makeText(context, message, Toast.LENGTH_LONG).show();
    }
    
    /**
     * Formata data no formato brasileiro (dd/MM/yyyy)
     */
    public static String formatDateBR(String date) {
        try {
            SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            SimpleDateFormat outputFormat = new SimpleDateFormat("dd/MM/yyyy", new Locale("pt", "BR"));
            
            Date d = inputFormat.parse(date);
            if (d != null) {
                return outputFormat.format(d);
            }
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return date;
    }
    
    /**
     * Formata data e hora no formato brasileiro (dd/MM/yyyy HH:mm)
     */
    public static String formatDateTimeBR(String dateTime) {
        try {
            SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            SimpleDateFormat outputFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm", new Locale("pt", "BR"));
            
            Date d = inputFormat.parse(dateTime);
            if (d != null) {
                return outputFormat.format(d);
            }
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return dateTime;
    }
    
    /**
     * Formata apenas a hora (HH:mm)
     */
    public static String formatTime(String dateTime) {
        try {
            SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            SimpleDateFormat outputFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());
            
            Date d = inputFormat.parse(dateTime);
            if (d != null) {
                return outputFormat.format(d);
            }
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return dateTime;
    }
    
    /**
     * Formata valor monetário em Real
     */
    public static String formatCurrency(double value) {
        return String.format(new Locale("pt", "BR"), "R$ %.2f", value);
    }
    
    /**
     * Valida CPF
     */
    public static boolean isValidCPF(String cpf) {
        cpf = cpf.replaceAll("[^0-9]", "");
        
        if (cpf.length() != 11) {
            return false;
        }
        
        // Verifica se todos os dígitos são iguais
        boolean allSame = true;
        for (int i = 1; i < cpf.length(); i++) {
            if (cpf.charAt(i) != cpf.charAt(0)) {
                allSame = false;
                break;
            }
        }
        if (allSame) {
            return false;
        }
        
        // Calcula o primeiro dígito verificador
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            sum += Character.getNumericValue(cpf.charAt(i)) * (10 - i);
        }
        int firstDigit = 11 - (sum % 11);
        if (firstDigit >= 10) {
            firstDigit = 0;
        }
        
        // Calcula o segundo dígito verificador
        sum = 0;
        for (int i = 0; i < 10; i++) {
            sum += Character.getNumericValue(cpf.charAt(i)) * (11 - i);
        }
        int secondDigit = 11 - (sum % 11);
        if (secondDigit >= 10) {
            secondDigit = 0;
        }
        
        // Verifica os dígitos
        return Character.getNumericValue(cpf.charAt(9)) == firstDigit &&
               Character.getNumericValue(cpf.charAt(10)) == secondDigit;
    }
    
    /**
     * Valida email
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }
        String emailPattern = "[a-zA-Z0-9._-]+@[a-z]+\\.+[a-z]+";
        return email.matches(emailPattern);
    }
    
    /**
     * Formata CPF (XXX.XXX.XXX-XX)
     */
    public static String formatCPF(String cpf) {
        cpf = cpf.replaceAll("[^0-9]", "");
        if (cpf.length() == 11) {
            return cpf.substring(0, 3) + "." +
                   cpf.substring(3, 6) + "." +
                   cpf.substring(6, 9) + "-" +
                   cpf.substring(9, 11);
        }
        return cpf;
    }
    
    /**
     * Formata telefone brasileiro ((XX) XXXXX-XXXX)
     */
    public static String formatPhone(String phone) {
        phone = phone.replaceAll("[^0-9]", "");
        if (phone.length() == 11) {
            return "(" + phone.substring(0, 2) + ") " +
                   phone.substring(2, 7) + "-" +
                   phone.substring(7, 11);
        } else if (phone.length() == 10) {
            return "(" + phone.substring(0, 2) + ") " +
                   phone.substring(2, 6) + "-" +
                   phone.substring(6, 10);
        }
        return phone;
    }
    
    /**
     * Converte data do formato brasileiro para o formato da API (yyyy-MM-dd)
     */
    public static String convertDateToApi(String dateBR) {
        try {
            SimpleDateFormat inputFormat = new SimpleDateFormat("dd/MM/yyyy", new Locale("pt", "BR"));
            SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            
            Date d = inputFormat.parse(dateBR);
            if (d != null) {
                return outputFormat.format(d);
            }
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return dateBR;
    }
}

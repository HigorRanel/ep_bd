package com.barbearia.app.config;

import android.content.Context;
import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;

/**
 * Classe responsável por carregar e gerenciar as configurações do aplicativo
 * a partir do arquivo .env
 */
public class AppConfig {
    private static AppConfig instance;
    private Dotenv dotenv;
    
    private AppConfig(Context context) {
        try {
            // Carrega o arquivo .env da pasta assets
            dotenv = Dotenv.configure()
                    .directory("/assets")
                    .ignoreIfMalformed()
                    .ignoreIfMissing()
                    .load();
        } catch (DotenvException e) {
            e.printStackTrace();
            // Usar valores padrão se o .env não for encontrado
        }
    }
    
    public static synchronized AppConfig getInstance(Context context) {
        if (instance == null) {
            instance = new AppConfig(context.getApplicationContext());
        }
        return instance;
    }
    
    // Configurações do Banco de Dados
    public String getDbUser() {
        return get("DB_USER", "postgres");
    }
    
    public String getDbPassword() {
        return get("DB_PASSWORD", "");
    }
    
    public String getDbHost() {
        return get("DB_HOST", "localhost");
    }
    
    public int getDbPort() {
        return Integer.parseInt(get("DB_PORT", "5432"));
    }
    
    public String getDbName() {
        return get("DB_NAME", "barbearia");
    }
    
    // Configurações da API
    public String getApiBaseUrl() {
        return get("API_BASE_URL", "http://10.0.2.2:5000/api/");
    }
    
    public int getApiConnectTimeout() {
        return Integer.parseInt(get("API_CONNECT_TIMEOUT", "30"));
    }
    
    public int getApiReadTimeout() {
        return Integer.parseInt(get("API_READ_TIMEOUT", "30"));
    }
    
    public int getApiWriteTimeout() {
        return Integer.parseInt(get("API_WRITE_TIMEOUT", "30"));
    }
    
    // Configurações de Notificação
    public String getNotificationChannelId() {
        return get("NOTIFICATION_CHANNEL_ID", "barbearia_notifications");
    }
    
    public int getNotificationAdvanceHours() {
        return Integer.parseInt(get("NOTIFICATION_ADVANCE_HOURS", "24"));
    }
    
    private String get(String key, String defaultValue) {
        if (dotenv != null) {
            return dotenv.get(key, defaultValue);
        }
        return defaultValue;
    }
}

package com.barbearia.app.api;

import android.content.Context;

import com.barbearia.app.config.AppConfig;
import com.barbearia.app.utils.SessionManager;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * Cliente Retrofit para comunicação com a API da barbearia
 */
public class ApiClient {
    private static Retrofit retrofit = null;
    private static BarbeariaApi apiService = null;
    
    /**
     * Obtém instância do serviço da API
     */
    public static BarbeariaApi getApiService(Context context) {
        if (apiService == null) {
            apiService = getClient(context).create(BarbeariaApi.class);
        }
        return apiService;
    }
    
    /**
     * Obtém cliente Retrofit configurado
     */
    private static Retrofit getClient(Context context) {
        if (retrofit == null) {
            AppConfig config = AppConfig.getInstance(context);
            
            // Configurar cliente OkHttp
            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(config.getApiConnectTimeout(), TimeUnit.SECONDS)
                    .readTimeout(config.getApiReadTimeout(), TimeUnit.SECONDS)
                    .writeTimeout(config.getApiWriteTimeout(), TimeUnit.SECONDS)
                    .addInterceptor(new AuthInterceptor(context))
                    .addInterceptor(getLoggingInterceptor())
                    .build();
            
            // Configurar Retrofit
            retrofit = new Retrofit.Builder()
                    .baseUrl(config.getApiBaseUrl())
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit;
    }
    
    /**
     * Interceptor para adicionar token de autenticação nas requisições
     */
    private static class AuthInterceptor implements Interceptor {
        private Context context;
        
        public AuthInterceptor(Context context) {
            this.context = context;
        }
        
        @Override
        public Response intercept(Chain chain) throws IOException {
            Request original = chain.request();
            
            // Obter token salvo
            SessionManager sessionManager = new SessionManager(context);
            String token = sessionManager.getToken();
            
            // Se houver token, adicionar no header
            if (token != null && !token.isEmpty()) {
                Request.Builder requestBuilder = original.newBuilder()
                        .header("Authorization", "Bearer " + token)
                        .method(original.method(), original.body());
                
                Request request = requestBuilder.build();
                return chain.proceed(request);
            }
            
            return chain.proceed(original);
        }
    }
    
    /**
     * Interceptor para logging das requisições (apenas em debug)
     */
    private static HttpLoggingInterceptor getLoggingInterceptor() {
        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);
        return logging;
    }
    
    /**
     * Limpa a instância do Retrofit (útil para logout)
     */
    public static void clearInstance() {
        retrofit = null;
        apiService = null;
    }
}

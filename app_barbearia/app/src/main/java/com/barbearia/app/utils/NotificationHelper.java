package com.barbearia.app.utils;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.barbearia.app.R;
import com.barbearia.app.config.AppConfig;
import com.barbearia.app.models.Agendamento;
import com.barbearia.app.receivers.NotificationReceiver;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * Helper para criar e agendar notificações de agendamentos
 */
public class NotificationHelper {
    
    private Context context;
    private NotificationManager notificationManager;
    private AppConfig config;
    
    public static final String CHANNEL_ID = "barbearia_notifications";
    private static final String CHANNEL_NAME = "Agendamentos";
    private static final String CHANNEL_DESC = "Notificações de agendamentos";
    
    public NotificationHelper(Context context) {
        this.context = context;
        this.config = AppConfig.getInstance(context);
        this.notificationManager = (NotificationManager) 
                context.getSystemService(Context.NOTIFICATION_SERVICE);
        
        createNotificationChannel();
    }
    
    /**
     * Cria o canal de notificação (necessário para Android 8.0+)
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription(CHANNEL_DESC);
            channel.enableVibration(true);
            channel.enableLights(true);
            
            notificationManager.createNotificationChannel(channel);
        }
    }
    
    /**
     * Agenda uma notificação para um agendamento
     * A notificação será exibida X horas antes do horário agendado
     */
    public void scheduleAppointmentNotification(Agendamento agendamento) {
        try {
            // Parsear data e hora do agendamento
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            Date appointmentDate = sdf.parse(agendamento.getDataHoraAgendamento());
            
            if (appointmentDate == null) return;
            
            // Calcular quando enviar a notificação (X horas antes)
            Calendar notificationTime = Calendar.getInstance();
            notificationTime.setTime(appointmentDate);
            notificationTime.add(Calendar.HOUR_OF_DAY, -config.getNotificationAdvanceHours());
            
            // Verificar se a notificação ainda é futura
            if (notificationTime.getTimeInMillis() <= System.currentTimeMillis()) {
                return; // Não agendar se já passou
            }
            
            // Criar intent para o receiver de notificação
            Intent intent = new Intent(context, NotificationReceiver.class);
            intent.putExtra("id_agendamento", agendamento.getIdAgendamento());
            intent.putExtra("servico_nome", agendamento.getServicoNome());
            intent.putExtra("barbeiro_nome", agendamento.getBarbeiroNome());
            intent.putExtra("data_hora", agendamento.getDataHoraAgendamento());
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    agendamento.getIdAgendamento(), // Request code único por agendamento
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            // Agendar notificação
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        notificationTime.getTimeInMillis(),
                        pendingIntent
                );
            }
            
        } catch (ParseException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Cancela uma notificação agendada
     */
    public void cancelAppointmentNotification(int idAgendamento) {
        Intent intent = new Intent(context, NotificationReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                idAgendamento,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            alarmManager.cancel(pendingIntent);
        }
    }
    
    /**
     * Mostra uma notificação imediata
     */
    public void showNotification(int id, String title, String message) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setVibrate(new long[]{0, 500, 250, 500});
        
        notificationManager.notify(id, builder.build());
    }
    
    /**
     * Formata data e hora para exibição na notificação
     */
    public static String formatDateTimeForNotification(String dateTime) {
        try {
            SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            SimpleDateFormat outputFormat = new SimpleDateFormat("dd/MM/yyyy 'às' HH:mm", new Locale("pt", "BR"));
            
            Date date = inputFormat.parse(dateTime);
            if (date != null) {
                return outputFormat.format(date);
            }
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return dateTime;
    }
}

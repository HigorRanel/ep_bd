package com.barbearia.app.receivers;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.app.NotificationCompat;

import com.barbearia.app.R;
import com.barbearia.app.activities.MainActivity;
import com.barbearia.app.utils.NotificationHelper;

/**
 * Receiver para exibir notificações de agendamentos
 */
public class NotificationReceiver extends BroadcastReceiver {
    
    @Override
    public void onReceive(Context context, Intent intent) {
        // Extrair dados do agendamento
        int idAgendamento = intent.getIntExtra("id_agendamento", 0);
        String servicoNome = intent.getStringExtra("servico_nome");
        String barbeiroNome = intent.getStringExtra("barbeiro_nome");
        String dataHora = intent.getStringExtra("data_hora");
        
        // Formatar data e hora
        String dataHoraFormatada = NotificationHelper.formatDateTimeForNotification(dataHora);
        
        // Criar título e mensagem da notificação
        String title = context.getString(R.string.notification_appointment_title);
        String message = context.getString(
                R.string.notification_appointment_message,
                servicoNome,
                barbeiroNome,
                dataHoraFormatada
        );
        
        // Criar intent para abrir o app quando clicar na notificação
        Intent activityIntent = new Intent(context, MainActivity.class);
        activityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        activityIntent.putExtra("open_appointments", true);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                idAgendamento,
                activityIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Criar notificação
        NotificationCompat.Builder builder = new NotificationCompat.Builder(
                context,
                NotificationHelper.CHANNEL_ID
        )
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setVibrate(new long[]{0, 500, 250, 500})
                .setContentIntent(pendingIntent);
        
        // Exibir notificação
        NotificationManager notificationManager = (NotificationManager) 
                context.getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (notificationManager != null) {
            notificationManager.notify(idAgendamento, builder.build());
        }
    }
}

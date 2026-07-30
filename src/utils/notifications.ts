import { LocalNotifications } from '@capacitor/local-notifications';

export const scheduleReminder = async (time: string, enabled: boolean) => {
  try {
    // 1. Cancel existing notifications
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

    if (!enabled) return;

    // 2. Request permission
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') {
      console.warn('Notifications permission not granted');
      return;
    }

    // 3. Parse time
    const [hours, minutes] = time.split(':').map(Number);

    // 4. Schedule daily notification
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Ei, psiu! 🤫",
          body: "Chegou do serviço? Não esquece de registrar a diária de hoje no ContaDia PRO! 💸",
          id: 1,
          schedule: {
            on: {
              hour: hours,
              minute: minutes
            },
            allowWhileIdle: true,
            repeats: true
          },
          sound: 'beep.wav',
          extra: null
        }
      ]
    });
    console.log(`Notification scheduled for ${time}`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

import { Platform } from "react-native";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';


// Notification identifiers for managing scheduled notifications
const DAILY_REMINDER_ID = 'daily-wellness-reminder';
const WEEKLY_REPORT_ID = 'weekly-wellness-report';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('myNotificationChannel', {
      name: 'A channel is needed for the permissions prompt to appear',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    try {
      const projectId = '59cbd475-fb93-4266-88af-48210b8b4a08'
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (e) {
      token = `${e}`;
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

interface PushNotificationPayload {
  expoPushToken: string;
  title: string;
  body: string;
}

export async function sendPushNotification({
  expoPushToken,
  title,
  body,
}: PushNotificationPayload) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}



export async function scheduleDailyReminder(enabled = true, hour = 10, minute = 0) {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);

    if (!enabled) {
      console.log('Daily reminders disabled');
      return;
    }

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const secondsUntilTrigger = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: "Don't forget to check in!",
        body: "Take a moment for your wellness today 💆♀️",
        sound: 'default',
        data: {
          type: 'daily_reminder',
          timestamp: Date.now()
        },
      },
      trigger: {
        seconds: secondsUntilTrigger,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });

    console.log(`Daily reminder scheduled for ${scheduledTime.toLocaleString()}`);
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    throw error;
  }
}


export async function scheduleWeeklyReport(enabled = true, weekday = 7, hour = 19, minute = 0) {
  try {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_REPORT_ID);

    if (!enabled) {
      console.log('Weekly reports disabled');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: WEEKLY_REPORT_ID,
      content: {
        title: "Your Weekly Wellness Report",
        body: "Tap to review how your week went 🧘♂️",
        sound: 'default',
        data: {
          type: 'weekly_report',
          timestamp: Date.now()
        },
      },
      trigger: {
        weekday,
        hour,
        minute,
        repeats: true,
      } as any,
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    console.log(`Weekly report scheduled for ${days[weekday - 1]} at ${hour}:${minute.toString().padStart(2, '0')}`);
  } catch (error) {
    console.error('Error scheduling weekly report:', error);
    throw error;
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_REPORT_ID);
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
    throw error;
  }
}

export async function getNotificationStatus() {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    const dailyEnabled = scheduledNotifications.some(n => n.identifier === DAILY_REMINDER_ID);
    const weeklyEnabled = scheduledNotifications.some(n => n.identifier === WEEKLY_REPORT_ID);

    return { dailyEnabled, weeklyEnabled };
  } catch (error) {
    console.error('Error getting notification status:', error);
    return { dailyEnabled: false, weeklyEnabled: false };
  }
}

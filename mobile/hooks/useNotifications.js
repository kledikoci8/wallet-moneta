import { useCallback, useEffect } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@wallet_push_token";

export function useNotifications() {
  useEffect(() => {
    (async () => {
      if (!Device.isDevice) return;
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } catch (_) {}
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Weekly summary",
            body: "Your weekly spending summary is ready — open FinBot to review",
          },
          trigger: { weekday: 1, hour: 9, minute: 0, repeats: true },
        });
      } catch (_) {}
    })();
  }, []);

  const scheduleLocalNotification = useCallback(async (title, body, trigger = null) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: trigger || null,
    });
  }, []);

  const scheduleWeeklySummary = useCallback(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Weekly summary",
        body: "Your weekly spending summary is ready — open FinBot to review",
      },
      trigger: {
        weekday: 1,
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  }, []);

  return { scheduleLocalNotification, scheduleWeeklySummary };
}

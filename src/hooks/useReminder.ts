import { useEffect } from "react";
import useCollectionContext from "contexts/Collection";
import { dateKey } from "utils/dates";
import { isDue } from "utils/srs";

const LAST_REMINDER_KEY = "memcard_last_reminder";

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

async function showNotification(title: string, body: string) {
  try {
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(title, { body, icon: "/logo192.png", tag: "memcard-reminder" });
    } else {
      new Notification(title, { body, icon: "/logo192.png", tag: "memcard-reminder" });
    }
  } catch (e) {}
}

/**
 * Study reminder. Browsers can't wake a closed page without a push server,
 * so this fires while MemCard is open (or installed and running in the background).
 */
export default function useReminder() {
  const { settings, collections, stats } = useCollectionContext();

  useEffect(() => {
    if (!settings.reminderEnabled || !notificationsSupported()) return;

    const check = () => {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (hhmm < (settings.reminderTime || "20:00")) return;

      const today = dateKey(now);
      try {
        if (localStorage.getItem(LAST_REMINDER_KEY) === today) return;
      } catch (e) {}

      const goal = settings.dailyGoal || 20;
      const reviewed = stats.reviewLog?.[today] || 0;
      if (reviewed >= goal) return;

      const due = collections.reduce((acc, c) => acc + c.words.filter((w) => isDue(w)).length, 0);
      showNotification(
        "Đến giờ ôn bài rồi! 🔥",
        due > 0
          ? `Bạn có ${due} thẻ đến hạn. Hôm nay đã ôn ${reviewed}/${goal} thẻ.`
          : `Hôm nay bạn mới ôn ${reviewed}/${goal} thẻ. Giữ chuỗi ngày học nhé!`
      );
      try {
        localStorage.setItem(LAST_REMINDER_KEY, today);
      } catch (e) {}
    };

    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [settings.reminderEnabled, settings.reminderTime, settings.dailyGoal, collections, stats.reviewLog]);
}

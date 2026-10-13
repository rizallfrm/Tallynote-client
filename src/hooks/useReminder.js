import { useEffect } from "react";
import api from "../api/axios";

export default function useReminder() {
  useEffect(() => {
    let settings = null;
    const load = () =>
      api
        .get("/settings")
        .then((r) => (settings = r.data))
        .catch(() => {});
    load();

    const tick = async () => {
      if (
        typeof Notification === "undefined" ||
        Notification.permission !== "granted"
      )
        return;
      if (!settings?.reminder_enabled || !settings.reminder_time) return;

      const now = new Date();
      const key = now.toLocaleDateString("en-CA");
      if (localStorage.getItem("reminder_last") === key) return;
      if (now.toTimeString().slice(0, 5) < settings.reminder_time.slice(0, 5))
        return;

      try {
        const { data } = await api.get("/summaries", {
          params: { range: "daily", date: key },
        });
        if (data.activities.length === 0)
          new Notification("Tallynote", {
            body: "Belum ada catatan hari ini. Yuk ceritakan harimu!",
            icon: "/logo.png",
          });
        localStorage.setItem("reminder_last", key);
      } catch {
        /* abaikan */
      }
    };

    const id = setInterval(tick, 60000);
    tick();
    window.addEventListener("settings-updated", load);
    return () => {
      clearInterval(id);
      window.removeEventListener("settings-updated", load);
    };
  }, []);
}

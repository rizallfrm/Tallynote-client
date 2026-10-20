import { useEffect, useState } from "react";
import { Bell, KeyRound, User } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { errMsg } from "../utils/format";
import { Link } from "react-router-dom";
import BackupCard from "../components/settings/BackupCard";
import NotificationCard from "../components/settings/NotificationCard";
import CollabNotificationCard from "../components/settings/CollabNotificationCard";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [s, setS] = useState(null);
  const [perm, setPerm] = useState(
    typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission,
  );

  useEffect(() => {
    api
      .get("/settings")
      .then(({ data }) =>
        setS({ ...data, reminder_time: data.reminder_time?.slice(0, 5) || "" }),
      );
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/auth/profile", { name });
      updateUser(data);
      toast.success("Profil diperbarui");
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put("/auth/password", pw);
      setPw({ current_password: "", new_password: "" });
      updateUser({ has_password: true });
      toast.success(
        user.has_password ? "Password diperbarui" : "Password dibuat",
      );
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const saveReminder = async (e) => {
    e.preventDefault();
    try {
      if (s.reminder_enabled && perm === "default")
        setPerm(await Notification.requestPermission());
      await api.put("/settings", {
        reminder_enabled: s.reminder_enabled,
        reminder_time: s.reminder_time,
        language: s.language,
      });
      window.dispatchEvent(new Event("settings-updated"));
      toast.success("Pengaturan disimpan");
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      {user.role === "admin" && (
        <Link to="/admin/categories" className="btn-ghost w-fit">
          Kelola kategori
        </Link>
      )}
      <h1 className="text-2xl font-semibold">Akun & Pengaturan</h1>

      <form onSubmit={saveProfile} className="card space-y-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <User size={18} /> Profil
        </h2>
        <div>
          <label className="label">Email</label>
          <input
            className="input bg-sand/50"
            value={user.email || ""}
            disabled
          />
        </div>
        <div>
          <label className="label">Nama</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button className="btn">Simpan profil</button>
      </form>
      <BackupCard />
      <NotificationCard />
      <CollabNotificationCard />
      <form onSubmit={savePassword} className="card space-y-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <KeyRound size={18} />{" "}
          {user.has_password ? "Ganti password" : "Buat password"}
        </h2>
        {user.has_password && (
          <input
            type="password"
            className="input"
            placeholder="Password saat ini"
            required
            value={pw.current_password}
            onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
          />
        )}
        <input
          type="password"
          className="input"
          placeholder="Password saat ini"
          required
          value={pw.current_password}
          onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
        />
        <input
          type="password"
          className="input"
          placeholder="Password baru (min. 6 karakter)"
          required
          minLength={6}
          value={pw.new_password}
          onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
        />
        <button className="btn">Ganti password</button>
      </form>

      {s && (
        <form onSubmit={saveReminder} className="card space-y-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Bell size={18} /> Pengingat harian
          </h2>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[rgb(139,154,110)]"
              checked={!!s.reminder_enabled}
              onChange={(e) =>
                setS({ ...s, reminder_enabled: e.target.checked })
              }
            />
            Aktifkan pengingat
          </label>
          <div>
            <label className="label">Jam pengingat</label>
            <input
              type="time"
              className="input"
              disabled={!s.reminder_enabled}
              value={s.reminder_time}
              onChange={(e) => setS({ ...s, reminder_time: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Bahasa</label>
            <select
              className="input"
              value={s.language}
              onChange={(e) => setS({ ...s, language: e.target.value })}
            >
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
          <p className="text-xs text-stone-500">
            {perm === "unsupported" &&
              "Browser ini tidak mendukung notifikasi. "}
            {perm === "denied" &&
              "Notifikasi diblokir di browser. Izinkan lewat pengaturan situs. "}
            Pengingat muncul saat aplikasi terbuka di browser dan hanya jika
            kamu belum mencatat apa pun hari itu.
          </p>
          <button className="btn">Simpan pengingat</button>
        </form>
      )}
    </div>
  );
}

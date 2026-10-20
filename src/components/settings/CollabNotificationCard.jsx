import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { errMsg } from "../../utils/format";

const ITEMS = [
  ["collab_notify_task", "Tugas baru atau perubahan tugas untukku"],
  ["collab_notify_deadline", "Pengingat deadline tugas"],
  ["collab_notify_meeting", "Undangan, perubahan, pembatalan, dan pengingat meeting"],
  ["collab_notify_update", "Pembaruan penting di ruang (anggota baru, tugas selesai)"],
];

export default function CollabNotificationCard() {
  const { user } = useAuth();
  const toast = useToast();
  const [s, setS] = useState(null);

  useEffect(() => { api.get("/settings").then((r) => setS(r.data)).catch(() => {}); }, []);

  const toggle = async (k, v) => {
    setS((p) => ({ ...p, [k]: v }));
    try { await api.put("/settings", { [k]: v }); }
    catch (e) { setS((p) => ({ ...p, [k]: !v })); toast.error(errMsg(e)); }
  };

  if (!s) return <div className="skeleton h-40" />;
  const ready = user.phone_verified && s.notify_whatsapp;

  return (
    <div className="card space-y-3">
      <h2 className="flex items-center gap-2 font-semibold"><Users size={18} /> Notifikasi Tallynote Together</h2>
      <p className={`rounded-lg px-3 py-2 text-xs ${ready ? "bg-primary-50 text-primary-800" : "bg-amber-50 text-amber-800"}`}>
        {ready
          ? "WhatsApp aktif. Pilih jenis pesan yang ingin kamu terima."
          : "Notifikasi WhatsApp dikirim hanya jika nomormu sudah terverifikasi dan WhatsApp diaktifkan di kartu “Pengingat deadline” di atas. Fitur kolaborasi tetap bisa dipakai tanpa itu."}
      </p>
      {ITEMS.map(([k, label]) => (
        <label key={k} className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(106,120,80)]" checked={s[k] !== false}
            onChange={(e) => toggle(k, e.target.checked)} />
          {label}
        </label>
      ))}
    </div>
  );
}
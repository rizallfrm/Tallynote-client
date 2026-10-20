import { useEffect, useState } from "react";
import {
  BadgeCheck, BellRing, Loader2, Mail, MessageCircle, Send, ShieldAlert,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { errMsg } from "../../utils/format";

export default function NotificationCard() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [s, setS] = useState(null);
  const [phone, setPhone] = useState(user.phone ? `+${user.phone}` : "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState("");

  useEffect(() => { api.get("/settings").then((r) => setS(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const savedPhone = user.phone ? `+${user.phone}` : "";
  const phoneChanged = phone.trim() !== savedPhone;

  // simpan nomor (dan nama tetap) lalu kembalikan user terbaru
  const savePhone = async () => {
    const { data } = await api.put("/auth/profile", { name: user.name, phone });
    updateUser(data);
    setPhone(data.phone ? `+${data.phone}` : "");
    return data;
  };

  const saveAll = async (e) => {
    e.preventDefault();
    setBusy("save");
    try {
      if (phoneChanged) { await savePhone(); setSent(false); setCode(""); }
      await api.put("/settings", { notify_email: s.notify_email, notify_whatsapp: s.notify_whatsapp });
      toast.success("Pengaturan pengingat disimpan");
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(""); }
  };

  const sendCode = async () => {
    setBusy("otp");
    try {
      if (phoneChanged) await savePhone(); // pastikan nomor terbaru tersimpan dulu
      const { data } = await api.post("/auth/phone/send");
      toast.success(data.message);
      setSent(true);
      setWait(60);
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(""); }
  };

  const verifyCode = async () => {
    setBusy("verify");
    try {
      const { data } = await api.post("/auth/phone/verify", { code });
      updateUser(data);
      setSent(false);
      setCode("");
      // otomatis aktifkan pengingat WhatsApp setelah terverifikasi
      await api.put("/settings", { notify_whatsapp: true });
      setS((p) => ({ ...p, notify_whatsapp: true }));
      toast.success("Nomor WhatsApp terverifikasi dan pengingat diaktifkan");
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(""); }
  };

  const test = async (channel) => {
    setBusy(channel);
    try { toast.success((await api.post("/notifications/test", { channel })).data.message); }
    catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(""); }
  };

  if (!s) return <div className="skeleton h-64" />;

  const verified = !!user.phone && user.phone_verified && !phoneChanged;
  const pending = !!user.phone && !user.phone_verified && !phoneChanged;

  return (
    <form onSubmit={saveAll} className="card space-y-4">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><BellRing size={18} /> Pengingat deadline</h2>
        <p className="mt-1 text-sm text-stone-600">
          Pesan dikirim otomatis 24 jam dan 2 jam sebelum deadline, serta saat deadline terlewat,
          selama aktivitas belum berstatus Selesai.
        </p>
      </div>

      {/* EMAIL */}
      <div className="rounded-xl border border-stone-200 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-0 flex-1 items-center gap-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[rgb(106,120,80)]" checked={!!s.notify_email}
              onChange={(e) => setS({ ...s, notify_email: e.target.checked })} />
            <Mail size={16} className="shrink-0" />
            <span className="truncate">Email <span className="text-stone-400">({user.email})</span></span>
          </label>
          <button type="button" className="chip text-xs" disabled={!!busy} onClick={() => test("email")}>
            <Send size={12} className="mr-1" /> {busy === "email" ? "Mengirim..." : "Kirim tes"}
          </button>
        </div>
      </div>

      {/* WHATSAPP */}
      <div className="space-y-3 rounded-xl border border-stone-200 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-1 items-center gap-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[rgb(106,120,80)]" checked={!!s.notify_whatsapp}
              onChange={(e) => setS({ ...s, notify_whatsapp: e.target.checked })} />
            <MessageCircle size={16} /> WhatsApp
            {verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                <BadgeCheck size={12} /> 
              </span>
            )}
            {pending && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <ShieldAlert size={12} /> Belum diverifikasi
              </span>
            )}
          </label>
          <button type="button" className="chip text-xs" disabled={!!busy || !verified} onClick={() => test("whatsapp")}
            title={verified ? "" : "Verifikasi nomor dulu"}>
            <Send size={12} className="mr-1" /> {busy === "whatsapp" ? "Mengirim..." : "Kirim tes"}
          </button>
        </div>

        <div>
          <label className="label">Nomor WhatsApp</label>
          <div className="flex gap-2">
            <input className="input" inputMode="tel" placeholder="081234567890" value={phone}
              onChange={(e) => setPhone(e.target.value)} />
            {(phoneChanged || !user.phone) && phone.trim() && (
              <button type="button" className="btn-ghost whitespace-nowrap" disabled={!!busy} onClick={sendCode}>
                {busy === "otp" ? <Loader2 size={16} className="animate-spin" /> : null}
                Simpan dan kirim kode
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Nomor Indonesia, otomatis diubah ke format 62. Mengganti nomor mewajibkan verifikasi ulang.
          </p>
        </div>

        {/* Langkah verifikasi */}
        {pending && (
          <div className="space-y-3 rounded-lg bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              Verifikasi nomor ini agar pengingat WhatsApp bisa dikirim. Kami mengirim kode 6 digit ke WhatsApp-mu.
            </p>
            {!sent ? (
              <button type="button" className="btn" disabled={!!busy} onClick={sendCode}>
                {busy === "otp" ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                Kirim kode ke WhatsApp
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input className="input !w-36 text-center text-lg tracking-[0.35em]" inputMode="numeric"
                    maxLength={6} placeholder="••••••" autoFocus value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                  <button type="button" className="btn" disabled={!!busy || code.length !== 6} onClick={verifyCode}>
                    {busy === "verify" ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                    Verifikasi
                  </button>
                  <button type="button" className="chip text-xs" disabled={!!busy || wait > 0} onClick={sendCode}>
                    {wait > 0 ? `Kirim ulang (${wait})` : "Kirim ulang"}
                  </button>
                </div>
                <p className="text-xs text-amber-800">Kode berlaku 10 menit. Cek WhatsApp pada nomor di atas.</p>
              </div>
            )}
          </div>
        )}

        {verified && !s.notify_whatsapp && (
          <p className="text-xs text-stone-500">Centang WhatsApp lalu simpan agar pengingat dikirim ke nomor ini.</p>
        )}
      </div>

      <button className="btn" disabled={!!busy}>
        {busy === "save" ? "Menyimpan..." : "Simpan pengaturan pengingat"}
      </button>
    </form>
  );
}
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { errMsg } from "../utils/format";
import { postLoginPath } from "../utils/together";

export default function VerifyEmail() {
  const { user, verifyEmail } = useAuth();
  const { state } = useLocation();
  const toast = useToast();
  const nav = useNavigate();
  const email = state?.email;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(60);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  if (user) return <Navigate to="/" replace />;
  if (!email) return <Navigate to="/login" replace />;
  if (user) return <Navigate to={postLoginPath()} replace />;

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await verifyEmail(email, code);
      toast.success("Email terverifikasi, selamat datang!");
      nav(postLoginPath(), { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await api.post("/auth/verify/resend", { email });
      toast.success("Kode baru dikirim");
      setWait(60);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={verify}
        className="card animate-fade-up w-full max-w-sm space-y-4 text-center"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
          <MailCheck />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Verifikasi email</h1>
          <p className="mt-1 text-sm text-stone-500">
            Kami mengirim kode 6 digit ke <b>{email}</b>. Cek juga folder spam.
          </p>
        </div>
        <input
          className="input text-center text-2xl tracking-[0.5em]"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
        <button className="btn w-full" disabled={busy || code.length !== 6}>
          {busy ? "Memeriksa..." : "Verifikasi dan masuk"}
        </button>
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="text-primary-700 underline disabled:text-stone-400 disabled:no-underline"
            disabled={wait > 0}
            onClick={resend}
          >
            {wait > 0 ? `Kirim ulang (${wait})` : "Kirim ulang kode"}
          </button>
          <button
            type="button"
            className="text-stone-500 underline"
            onClick={() => nav("/login")}
          >
            Kembali
          </button>
        </div>
      </form>
    </div>
  );
}

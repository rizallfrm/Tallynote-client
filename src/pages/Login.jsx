import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../components/layout/AutoSHell";
import GoogleButton from "../components/auth/GoogleButton";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../utils/format";
import { postLoginPath } from "../utils/together";

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (user) return <Navigate to="/" replace />;

  if (user) return <Navigate to={postLoginPath()} replace />;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.email, form.password);
    } catch (err) {
      if (err.response?.data?.code === "EMAIL_NOT_VERIFIED")
        nav("/verify-email", { state: { email: err.response.data.email } });
      else setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Selamat datang kembali"
      subtitle="Masuk untuk melanjutkan jurnalmu."
      footer={
        <>
          Belum punya akun?{" "}
          <Link
            to="/register"
            className="font-medium text-primary-700 underline"
          >
            Daftar
          </Link>
        </>
      }
    >
      <GoogleButton text="signin_with" />
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button className="btn w-full" disabled={busy}>
          {busy ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </AuthShell>
  );
}

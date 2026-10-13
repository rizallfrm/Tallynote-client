import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../components/layout/AutoSHell";
import GoogleButton from "../components/auth/GoogleButton";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../utils/format";

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await register(form);
      nav("/verify-email", { state: { email: r.email }, replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (k, label, type = "text", auto) => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        required
        autoComplete={auto}
        value={form[k]}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
      />
    </div>
  );

  return (
    <AuthShell
      title="Buat akun baru"
      subtitle="Mulai catat harimu, gratis."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link to="/login" className="font-medium text-primary-700 underline">
            Masuk
          </Link>
        </>
      }
    >
      <GoogleButton text="signup_with" />
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {field("name", "Nama", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field(
          "password",
          "Password (min. 6 karakter)",
          "password",
          "new-password",
        )}
        <button className="btn w-full" disabled={busy}>
          {busy ? "Mendaftar..." : "Daftar"}
        </button>
      </form>
    </AuthShell>
  );
}

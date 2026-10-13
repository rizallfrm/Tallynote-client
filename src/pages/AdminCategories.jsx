import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useActivity } from "../context/ActivityContext";
import { useToast } from "../context/ToastContext";
import { errMsg } from "../utils/format";

export default function AdminCategories() {
  const { user } = useAuth();
  const { fetchCategories } = useActivity();
  const toast = useToast();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });

  const load = useCallback(async () => {
    setList((await api.get("/categories", { params: { all: 1 } })).data);
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => { if (user.role === "admin") load(); }, [user.role, load]);

  if (user.role !== "admin") return <Navigate to="/" replace />;

  const run = async (fn, okMsg) => {
    try { await fn(); toast.success(okMsg); await load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">Kelola Kategori</h1>

      <form className="card flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => { await api.post("/categories", form); setForm({ name: "", description: "" }); }, "Kategori ditambahkan");
        }}>
        <input className="input flex-1" placeholder="Nama kategori" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input flex-1" placeholder="Deskripsi (opsional)" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn"><Plus size={16} /> Tambah</button>
      </form>

      <div className="space-y-2">
        {list.map((c) => (
          <div key={c.id} className="card flex items-center gap-3 !p-4">
            <div className="flex-1">
              <div className={`font-medium ${c.is_active ? "" : "text-stone-400 line-through"}`}>{c.name}</div>
              {c.description && <div className="text-xs text-stone-500">{c.description}</div>}
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-500">
              <input type="checkbox" className="accent-[rgb(139,154,110)]" checked={c.is_active}
                onChange={(e) => run(() => api.put(`/categories/${c.id}`, { name: c.name, description: c.description, is_active: e.target.checked }), "Status diperbarui")} />
              Aktif
            </label>
            <button className="btn-danger !px-2.5"
              onClick={() => confirm(`Hapus kategori "${c.name}"?`) && run(() => api.delete(`/categories/${c.id}`), "Kategori dihapus")}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-500">
        Kategori yang sudah dipakai aktivitas tidak bisa dihapus. Nonaktifkan saja agar tidak muncul di form.
      </p>
    </div>
  );
}
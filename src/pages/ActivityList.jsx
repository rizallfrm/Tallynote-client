import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useActivity } from "../context/ActivityContext";
import ActivityCard from "../components/activity/ActivityCard";
import CopyButton from "../components/common/CopyButton";
import { STATUS, activitiesToText, shiftDate, today } from "../utils/format";

import { useSearchParams } from "react-router-dom"; // tambahkan ke impor react-router-dom yang sudah ada
import { Star } from "lucide-react"; // tambahkan ke impor lucide-react
import api from "../api/axios";

const empty = {
  q: "",
  status: "",
  category_id: "",
  start: "",
  end: "",
  sort: "desc",
  tag: "",
  favorite: "",
};
export default function ActivityList() {
  const { activities, pagination, categories, fetchActivities } = useActivity();
  const [sp] = useSearchParams();
  const [f, setF] = useState({ ...empty, tag: sp.get("tag") || "" });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [tags, setTags] = useState([]);
  useEffect(() => {
    api
      .get("/tags")
      .then((r) => setTags(r.data))
      .catch(() => {});
  }, []);

  const [loading, setLoading] = useState(true);

  // debounce pencarian
  useEffect(() => {
    const id = setTimeout(() => {
      setF((p) => ({ ...p, q }));
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const params = { page, limit: 10, sort: f.sort };
    ["q", "status", "category_id", "start", "end"].forEach((k) => {
      if (f[k]) params[k] = f[k];
    });
    setLoading(true);
    fetchActivities(params).finally(() => setLoading(false));
  }, [f, page, fetchActivities]);

  const change = (patch) => {
    setF((p) => ({ ...p, ...patch }));
    setPage(1);
  };
  const filtered =
    f.q || f.status || f.category_id || f.start || f.end || f.tag || f.favorite;

  const reset = () => {
    setF(empty);
    setQ("");
    setPage(1);
  };

  const preset = (k) => {
    const t = today();
    if (k === "today") change({ start: t, end: t });
    if (k === "week") change({ start: shiftDate("daily", t, -6), end: t });
    if (k === "month") {
      const d = new Date();
      change({
        start: `${t.slice(0, 8)}01`,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString(
          "en-CA",
        ),
      });
    }
    if (k === "all") change({ start: "", end: "" });
  };

  const rangeActive = (k) => {
    const t = today();
    if (k === "today") return f.start === t && f.end === t;
    if (k === "week")
      return f.start === shiftDate("daily", t, -6) && f.end === t;
    if (k === "month")
      return (
        f.start === `${t.slice(0, 8)}01` &&
        !!f.end &&
        f.end.slice(0, 7) === t.slice(0, 7)
      );
    return !f.start && !f.end;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Riwayat Aktivitas</h1>
          <p className="text-sm text-stone-500">
            {pagination.total} aktivitas ditemukan
          </p>
        </div>
        <div className="flex gap-2">
          {activities.length > 0 && (
            <CopyButton
              text={() => activitiesToText(activities)}
              label="Salin halaman ini"
            />
          )}
          <Link to="/activities/new" className="btn hidden sm:inline-flex">
            <Plus size={18} /> Tambah
          </Link>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            className="input !pl-10"
            placeholder="Cari judul, cerita, uraian, pembelajaran, kendala..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`chip ${f.favorite ? "chip-active" : ""}`}
            onClick={() => change({ favorite: f.favorite ? "" : "1" })}
          >
            <Star size={13} className="mr-1" /> Favorit
          </button>
          {tags.slice(0, 12).map((t) => (
            <button
              key={t.id}
              className={`chip ${f.tag === t.name ? "chip-active" : ""}`}
              onClick={() => change({ tag: f.tag === t.name ? "" : t.name })}
            >
              #{t.name} <span className="ml-1 opacity-60">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["all", "Semua tanggal"],
            ["today", "Hari ini"],
            ["week", "7 hari"],
            ["month", "Bulan ini"],
          ].map(([k, label]) => (
            <button
              key={k}
              className={`chip ${rangeActive(k) ? "chip-active" : ""}`}
              onClick={() => preset(k)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <select
            className="input"
            value={f.category_id}
            onChange={(e) => change({ category_id: e.target.value })}
          >
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input"
            value={f.start}
            onChange={(e) => change({ start: e.target.value })}
            aria-label="Dari tanggal"
          />
          <input
            type="date"
            className="input"
            value={f.end}
            onChange={(e) => change({ end: e.target.value })}
            aria-label="Sampai tanggal"
          />
          <button
            className="btn-ghost"
            onClick={() => change({ sort: f.sort === "desc" ? "asc" : "desc" })}
          >
            <ArrowDownUp size={16} />{" "}
            {f.sort === "desc" ? "Terbaru dulu" : "Terlama dulu"}
          </button>
        </div>

        {filtered && (
          <button
            className="flex items-center gap-1 text-sm text-primary-dark underline"
            onClick={reset}
          >
            <X size={14} /> Reset filter
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="card py-10 text-center text-stone-500">
          {filtered
            ? "Tidak ada aktivitas yang cocok dengan filter."
            : "Belum ada aktivitas."}
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            className="btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-stone-500">
            Halaman {pagination.page} / {pagination.pages}
          </span>
          <button
            className="btn-ghost"
            disabled={page >= pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

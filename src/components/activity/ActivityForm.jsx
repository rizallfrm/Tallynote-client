import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BookmarkPlus,
  Loader2,
  PencilLine,
  Clock,
  Sparkles,
} from "lucide-react";
import api from "../../api/axios";
import { useActivity } from "../../context/ActivityContext";
import { useToast } from "../../context/ToastContext";
import TagInput from "./TagInput";
import VoiceButton from "./VoiceButton";
import {
  STATUS,
  errMsg,
  shiftDate,
  today,
  toLocalInput,
} from "../../utils/format";
import { useAuth } from "../../context/AuthContext";


const MIN = 100;
const HINTS = [
  ["Yang dikerjakan", "Hari ini saya mengerjakan "],
  ["Yang dipelajari", "Saya belajar bahwa "],
  ["Kendala", "Kendala yang saya hadapi: "],
];
const blank = {
  title: "",
  category_id: "",
  activity_date: today(),
  status: "in_progress",
  activity_input: "",
  description: "",
  learning: "",
  obstacle: "",
};

const Counter = ({ value, min }) => {
  const n = (value || "").trim().length;
  return (
    <span
      className={`text-xs ${!min || n >= min ? "text-stone-400" : "text-amber-600"}`}
    >
      {n}
      {min ? ` / min. ${min}` : ""} karakter
    </span>
  );
};

export default function ActivityForm({
  initial,
  onSubmit,
  onGenerate,
  busy,
  aiBusy,
  aiError,
  edit = false,
  submitLabel = "Simpan",
}) {
  const { user } = useAuth();

  const { categories } = useActivity();
  const toast = useToast();
  const [f, setF] = useState(() => ({
    ...blank,
    ...initial,
    tags: initial?.tags ?? initial?.Tags?.map((t) => t.name) ?? [],
    deadline_at: toLocalInput(initial?.deadline_at),
  }));
  const [mode, setMode] = useState("ai");
  const [generated, setGenerated] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [templates, setTemplates] = useState([]);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const append = (k) => (t) =>
    setF((p) => {
      const cur = p[k] || "";
      return { ...p, [k]: cur + (cur && !/\s$/.test(cur) ? " " : "") + t };
    });

  const loadTemplates = () =>
    api
      .get("/templates")
      .then((r) => setTemplates(r.data))
      .catch(() => {});
  useEffect(() => {
    if (!edit) loadTemplates();
  }, [edit]);

  useEffect(() => {
    setCooldown(aiError?.retryAfter || 0);
  }, [aiError]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const isAi = !edit && mode === "ai";
  const isManual = edit || mode === "manual";
  const storyOk = f.activity_input.trim().length >= 10;

  const addHint = (text) =>
    setF((p) => ({
      ...p,
      activity_input:
        p.activity_input + (p.activity_input ? "\n\n" : "") + text,
    }));

  const generate = async () => {
    const data = await onGenerate(f.activity_input);
    if (data) {
      setF((p) => ({ ...p, ...data }));
      setGenerated(true);
    }
  };

  const toManual = () => {
    setF((p) => ({ ...p, description: p.description || p.activity_input }));
    setMode("manual");
  };

  const applyTemplate = (t) =>
    setF((p) => ({
      ...p,
      title: t.title,
      category_id: t.category_id ? String(t.category_id) : p.category_id,
      activity_input: t.activity_input || p.activity_input,
      description:
        mode === "manual" ? t.activity_input || p.description : p.description,
    }));

  const saveTemplate = async () => {
    if (!f.title.trim())
      return toast.error("Isi judul dulu untuk dijadikan template");
    try {
      await api.post("/templates", {
        name: f.title.trim().slice(0, 100),
        title: f.title.trim(),
        category_id: f.category_id || null,
        activity_input: (isManual ? f.description : f.activity_input) || "",
      });
      toast.success("Template tersimpan");
      loadTemplates();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const setDeadline = (days, hour = 17) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    setF((p) => ({ ...p, deadline_at: toLocalInput(d.toISOString()) }));
  };

  const tab = (m, Icon, label) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
        mode === m
          ? "bg-primary-600 text-white"
          : "text-stone-600 hover:bg-stone-50"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f, { mode: edit ? "edit" : mode });
      }}
      className="card space-y-5"
    >
      {!edit && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-stone-500">Template:</span>
          {templates.map((t) => (
            <button
              type="button"
              key={t.id}
              className="chip text-xs"
              onClick={() => applyTemplate(t)}
            >
              {t.name}
            </button>
          ))}
          <Link to="/templates" className="text-xs text-primary-700 underline">
            {templates.length ? "Kelola" : "Buat template"}
          </Link>
        </div>
      )}

      <div>
        <label className="label">Judul aktivitas</label>
        <input
          className="input"
          value={f.title}
          onChange={set("title")}
          maxLength={200}
          required
          placeholder="Contoh: Belajar membuat REST API"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Kategori</label>
          <select
            className="input"
            value={f.category_id}
            onChange={set("category_id")}
            required
          >
            <option value="">Pilih kategori...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tanggal</label>
          <div className="flex gap-2">
            <input
              type="date"
              className="input"
              value={f.activity_date}
              onChange={set("activity_date")}
              required
            />
            <button
              type="button"
              className="chip whitespace-nowrap"
              onClick={() => setF((p) => ({ ...p, activity_date: today() }))}
            >
              Hari ini
            </button>
            <button
              type="button"
              className="chip whitespace-nowrap"
              onClick={() =>
                setF((p) => ({
                  ...p,
                  activity_date: shiftDate("daily", today(), -1),
                }))
              }
            >
              Kemarin
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="label">Status</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS).map(([k, v]) => (
            <button
              type="button"
              key={k}
              className={`chip ${f.status === k ? "chip-active" : ""}`}
              onClick={() => setF((p) => ({ ...p, status: k }))}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label flex items-center gap-1.5">
          <Clock size={14} /> Deadline{" "}
          <span className="text-stone-400">
            (opsional, pengingat dikirim otomatis)
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="datetime-local"
            className="input !w-auto"
            value={f.deadline_at}
            onChange={set("deadline_at")}
          />
          <button type="button" className="chip" onClick={() => setDeadline(0)}>
            Hari ini 17:00
          </button>
          <button type="button" className="chip" onClick={() => setDeadline(1)}>
            Besok 17:00
          </button>
          <button type="button" className="chip" onClick={() => setDeadline(7)}>
            +7 hari
          </button>
          {f.deadline_at && (
            <button
              type="button"
              className="chip"
              onClick={() => setF((p) => ({ ...p, deadline_at: "" }))}
            >
              Hapus
            </button>
          )}
          {f.deadline_at && !user?.phone_verified && (
            <p className="mt-2 text-xs text-stone-500">
              Pengingat dikirim ke email.{" "}
              <Link to="/settings" className="text-primary-700 underline">
                Tambahkan WhatsApp
              </Link>{" "}
              agar diingatkan juga lewat chat.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="label">
          Tag <span className="text-stone-400">(opsional, maks. 8)</span>
        </label>
        <TagInput
          value={f.tags}
          onChange={(tags) => setF((p) => ({ ...p, tags }))}
        />
      </div>

      {!edit && (
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-stone-200 bg-white p-1">
          {tab("ai", Sparkles, "Generate AI")}
          {tab("manual", PencilLine, "Isi Manual")}
        </div>
      )}

      {isAi && (
        <>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="label !mb-0">Ceritakan aktivitasmu</label>
              <div className="flex items-center gap-2">
                <VoiceButton onText={append("activity_input")} />
                <Counter value={f.activity_input} />
              </div>
            </div>
            <textarea
              className="input min-h-36"
              value={f.activity_input}
              onChange={set("activity_input")}
              placeholder="Tulis atau dikte, tidak perlu rapi. AI akan menyusun uraian, pembelajaran, dan kendala."
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {HINTS.map(([label, text]) => (
                <button
                  type="button"
                  key={label}
                  className="chip text-xs"
                  onClick={() => addHint(text)}
                >
                  + {label}
                </button>
              ))}
            </div>
          </div>

          {aiError && (
            <div className="animate-fade-up rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />{" "}
                {aiError.message}
              </p>
              <button
                type="button"
                className="btn-ghost mt-3 !py-1.5"
                onClick={toManual}
              >
                <PencilLine size={14} /> Lanjut isi manual (ceritamu dibawa)
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn-ghost"
            onClick={generate}
            disabled={!storyOk || aiBusy || cooldown > 0}
          >
            {aiBusy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {aiBusy
              ? "AI sedang menyusun..."
              : cooldown > 0
                ? `Coba lagi dalam ${cooldown} detik`
                : generated
                  ? "Generate ulang"
                  : "Generate dengan AI"}
          </button>
          {!storyOk && (
            <p className="-mt-3 text-xs text-stone-400">
              Tulis minimal 10 karakter untuk mengaktifkan Generate.
            </p>
          )}

          {generated && (
            <div className="animate-fade-up space-y-4 rounded-xl border border-primary-300 bg-primary-50 p-4">
              <p className="flex items-center gap-2 text-sm text-primary-800">
                <Sparkles size={16} /> Hasil AI. Periksa dan edit bila perlu.
                Bagian kendala berisi refleksi dari AI, sesuaikan jika tidak
                cocok dengan yang kamu alami.
              </p>
              {[
                ["description", "Uraian aktivitas"],
                ["learning", "Pembelajaran yang diperoleh"],
                ["obstacle", "Kendala yang dialami"],
              ].map(([k, label]) => (
                <div key={k}>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="label !mb-0">{label}</label>
                    <Counter value={f[k]} min={MIN} />
                  </div>
                  <textarea
                    className="input min-h-24"
                    value={f[k] || ""}
                    onChange={set(k)}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {isManual && (
        <div className="space-y-4">
          {!edit && (
            <p className="text-sm text-stone-500">
              Hanya <b>uraian aktivitas</b> yang wajib. Pembelajaran dan kendala
              boleh dikosongkan.
            </p>
          )}
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="label !mb-0">
                Uraian aktivitas <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <VoiceButton onText={append("description")} />
                <Counter value={f.description} />
              </div>
            </div>
            <textarea
              className="input min-h-28"
              value={f.description || ""}
              onChange={set("description")}
              required
              minLength={10}
              placeholder="Apa yang kamu kerjakan?"
            />
          </div>
          <div>
            <label className="label">
              Pembelajaran yang diperoleh{" "}
              <span className="text-stone-400">(opsional)</span>
            </label>
            <textarea
              className="input min-h-20"
              value={f.learning || ""}
              onChange={set("learning")}
            />
          </div>
          <div>
            <label className="label">
              Kendala yang dialami{" "}
              <span className="text-stone-400">(opsional)</span>
            </label>
            <textarea
              className="input min-h-20"
              value={f.obstacle || ""}
              onChange={set("obstacle")}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="btn"
          disabled={busy || aiBusy || (isAi && !generated)}
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {busy ? "Menyimpan..." : submitLabel}
        </button>
        {!edit && (
          <button type="button" className="chip" onClick={saveTemplate}>
            <BookmarkPlus size={14} className="mr-1" /> Simpan sebagai template
          </button>
        )}
      </div>
      {isAi && !generated && (
        <p className="-mt-3 text-xs text-stone-400">
          Tombol Simpan aktif setelah hasil AI muncul.
        </p>
      )}
    </form>
  );
}

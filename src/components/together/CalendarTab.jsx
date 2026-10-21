import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ChevronLeft, ChevronRight, ExternalLink, ListChecks, RefreshCw, Video,
} from "lucide-react";
import api from "../../api/axios";
import { PRIORITY, TSTATUS, hm } from "../../utils/together";
import { errMsg, formatDate } from "../../utils/format";

const WD = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const pad = (n) => String(n).padStart(2, "0");
const dayOf = (iso) => new Date(iso).toLocaleDateString("en-CA"); // tanggal lokal perangkat
const todayKey = () => new Date().toLocaleDateString("en-CA");

function TaskItem({ t, wid }) {
  return (
    <div className="card flex items-start gap-3">
      <span className="rounded-lg bg-amber-100 p-2 text-amber-700"><ListChecks size={16} /></span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className={`break-words font-medium ${t.status === "done" ? "line-through opacity-60" : ""}`}>{t.title}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY[t.priority]?.cls}`}>{PRIORITY[t.priority]?.label}</span>
          <span className="rounded-full bg-sand px-2 py-0.5">{TSTATUS[t.status]} · {t.progress}%</span>
          {t.deadline_at && <span className="text-stone-500">Deadline {hm(t.deadline_at)}</span>}
        </div>
        {t.description && <p className="line-clamp-2 text-sm text-stone-600">{t.description}</p>}
        <p className="text-xs text-stone-500">
          {t.assignees?.length ? t.assignees.map((a) => a.name).join(", ") : "Belum ada penanggung jawab"}
        </p>
      </div>
      <Link to={`/together/${wid}?tab=tasks`} className="btn-ghost !px-3 !py-1.5 text-sm">Buka</Link>
    </div>
  );
}

function MeetingItem({ m, wid }) {
  return (
    <div className="card flex items-start gap-3">
      <span className="rounded-lg bg-sky-100 p-2 text-sky-700"><Video size={16} /></span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="break-words font-medium">{m.title}</div>
        <div className="text-xs text-stone-500">{hm(m.starts_at)} - {hm(m.ends_at)}</div>
        {m.agenda && <p className="line-clamp-2 text-sm text-stone-600">{m.agenda}</p>}
      </div>
      <div className="flex flex-col gap-1">
        {m.meeting_url && (
          <a href={m.meeting_url} target="_blank" rel="noopener noreferrer" className="btn !px-3 !py-1.5 text-sm">
            <ExternalLink size={14} /> Gabung
          </a>
        )}
        <Link to={`/together/${wid}?tab=meetings`} className="btn-ghost !px-3 !py-1.5 text-sm">Detail</Link>
      </div>
    </div>
  );
}

export default function CalendarTab({ wid }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [data, setData] = useState({ tasks: [], meetings: [], undated: [] });
  const [sel, setSel] = useState(todayKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const { data } = await api.get(`/workspaces/${wid}/calendar`, {
        params: { start: cursor.toISOString(), end: end.toISOString() },
      });
      setData(data);
    } catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [wid, cursor]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // muat ulang otomatis saat tab browser kembali dibuka dan tiap 60 detik
  useEffect(() => {
    const refresh = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", refresh);
    const id = setInterval(refresh, 60000);
    return () => { document.removeEventListener("visibilitychange", refresh); clearInterval(id); };
  }, [load]);

  const byDay = useMemo(() => {
    const m = {};
    data.tasks.forEach((t) => ((m[dayOf(t.deadline_at)] ||= { t: [], m: [] }).t.push(t)));
    data.meetings.forEach((x) => ((m[dayOf(x.starts_at)] ||= { t: [], m: [] }).m.push(x)));
    return m;
  }, [data]);

  // semua kegiatan bulan ini, urut waktu
  const agenda = useMemo(
    () => [
      ...data.tasks.map((t) => ({ type: "task", at: t.deadline_at, key: `t${t.id}`, item: t })),
      ...data.meetings.map((m) => ({ type: "meeting", at: m.starts_at, key: `m${m.id}`, item: m })),
    ].sort((a, b) => new Date(a.at) - new Date(b.at)),
    [data]
  );

  const y = cursor.getFullYear(), mo = cursor.getMonth();
  const offset = (new Date(y, mo, 1).getDay() + 6) % 7; // Senin = 0
  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: new Date(y, mo + 1, 0).getDate() }, (_, i) => `${y}-${pad(mo + 1)}-${pad(i + 1)}`),
  ];
  const move = (d) => { setCursor(new Date(y, mo + d, 1)); setSel(""); };
  const day = byDay[sel] || { t: [], m: [] };

  return (
    <div className="space-y-5">
      {error && (
        <div className="card flex flex-wrap items-center gap-3 border-red-200 bg-red-50 text-sm text-red-700">
          <AlertTriangle size={18} /> <span className="flex-1">{error}</span>
          <button className="btn-ghost !py-1.5" onClick={() => { setLoading(true); load(); }}><RefreshCw size={14} /> Coba lagi</button>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[420px_1fr]">
        <div className="card min-w-0 !p-3 sm:!p-5">
          <div className="mb-3 flex items-center justify-between">
            <button className="btn-ghost !px-2" onClick={() => move(-1)} aria-label="Bulan sebelumnya"><ChevronLeft size={18} /></button>
            <span className="font-medium text-primary-800">
              {cursor.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </span>
            <button className="btn-ghost !px-2" onClick={() => move(1)} aria-label="Bulan berikutnya"><ChevronRight size={18} /></button>
          </div>
          <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-stone-400">
            {WD.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className={`grid grid-cols-7 gap-1 ${loading ? "opacity-50" : ""}`}>
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const x = byDay[d];
              const on = d === sel;
              return (
                <button key={d} onClick={() => setSel(on ? "" : d)}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition ${
                    on ? "bg-primary-600 text-white" : x ? "bg-primary-50 hover:bg-primary-100" : "hover:bg-stone-50"
                  } ${d === todayKey() && !on ? "ring-1 ring-primary-600" : ""}`}>
                  <span className={d === todayKey() ? "font-bold" : ""}>{Number(d.slice(8))}</span>
                  <span className="flex h-1.5 gap-0.5">
                    {x?.t.length > 0 && <i className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-amber-500"}`} />}
                    {x?.m.length > 0 && <i className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-sky-500"}`} />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-500" /> Deadline tugas</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-500" /> Meeting</span>
          </div>
          <p className="mt-2 text-xs text-stone-400">Klik tanggal untuk melihat detailnya. Klik lagi untuk melihat seluruh agenda bulan ini.</p>
        </div>

        <section className="min-w-0 space-y-3">
          {sel ? (
            <>
              <h2 className="font-semibold">{formatDate(sel)}</h2>
              {day.t.length + day.m.length === 0 && (
                <div className="card py-8 text-center text-sm text-stone-500">Tidak ada deadline atau meeting pada tanggal ini.</div>
              )}
              {day.m.map((m) => <MeetingItem key={m.id} m={m} wid={wid} />)}
              {day.t.map((t) => <TaskItem key={t.id} t={t} wid={wid} />)}
            </>
          ) : (
            <>
              <h2 className="font-semibold">Agenda {cursor.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</h2>
              {loading ? <div className="skeleton h-24" /> : agenda.length === 0 ? (
                <div className="card py-8 text-center text-sm text-stone-500">Belum ada deadline atau meeting bulan ini.</div>
              ) : (
                agenda.map((a) => (
                  <div key={a.key}>
                    <button className="mb-1 text-xs font-medium text-stone-500 hover:underline" onClick={() => setSel(dayOf(a.at))}>
                      {formatDate(dayOf(a.at))}
                    </button>
                    {a.type === "task" ? <TaskItem t={a.item} wid={wid} /> : <MeetingItem m={a.item} wid={wid} />}
                  </div>
                ))
              )}
            </>
          )}
        </section>
      </div>

      {data.undated.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Tugas tanpa deadline <span className="text-sm font-normal text-stone-500">({data.undated.length})</span></h2>
          <p className="text-xs text-stone-500">Tugas ini belum punya tanggal sehingga tidak tampil di kalender. Tambahkan deadline di tab Tugas.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {data.undated.map((t) => <TaskItem key={t.id} t={t} wid={wid} />)}
          </div>
        </section>
      )}
    </div>
  );
}
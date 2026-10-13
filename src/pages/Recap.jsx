import { useEffect, useMemo, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Lightbulb,
  Printer,
  Sparkles,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useActivity } from "../context/ActivityContext";
import { useToast } from "../context/ToastContext";

import RangeTabs from "../components/summary/RangeTabs";
import StatCard from "../components/summary/StatCard";
import TargetBar from "../components/summary/TargetBar";
import ActivityCard from "../components/activity/ActivityCard";
import CopyButton from "../components/common/CopyButton";
import PrintReport from "../components/report/PrintReport";
import ExportMenu from "../components/common/ExportMenu";
import WeeklyReflection from "../components/summary/WeeklyReflection";

import {
  activitiesToText,
  eachDay,
  errMsg,
  formatDate,
  periodLabel,
  shiftDate,
  today,
} from "../utils/format";

import { downloadCSV, downloadXLSX } from "../utils/export";

const LABEL = {
  daily: "harian",
  weekly: "mingguan",
  monthly: "bulanan",
};

export default function Recap() {
  const { user } = useAuth();

  const { recap, fetchRecap, generateAiSummary, aiLoading } = useActivity();

  const toast = useToast();

  const [range, setRange] = useState("daily");
  const [date, setDate] = useState(today());
  const [aiText, setAiText] = useState("");
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setAiText("");

    fetchRecap(range, date)
      .then((r) => {
        if (range === "daily") {
          setAiText(r.perDay?.[0]?.ai_summary || "");
        }
      })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, date, fetchRecap]);

  // Target hanya relevan untuk rekap mingguan.
  useEffect(() => {
    if (range !== "weekly") {
      setTargets([]);
      return;
    }

    api
      .get("/targets", { params: { date } })
      .then(({ data }) =>
        setTargets((data.items || []).filter((t) => t.is_active)),
      )
      .catch(() => setTargets([]));
  }, [range, date]);

  const acts = useMemo(() => recap?.activities || [], [recap]);

  const completed = acts.filter((a) => a.status === "completed").length;

  const reflections = acts.filter((a) => a.learning || a.obstacle).length;

  const rate = acts.length ? Math.round((completed / acts.length) * 100) : 0;

  const period = recap ? periodLabel(range, recap.start, recap.end) : "";

  const chartData = useMemo(() => {
    if (!recap || range === "daily") return [];

    return eachDay(recap.start, recap.end).map((d) => {
      const list = acts.filter((a) => a.activity_date === d);

      const label =
        range === "weekly"
          ? new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
              weekday: "short",
            })
          : String(Number(d.slice(8)));

      return {
        tanggal: label,
        Total: list.length,
        Selesai: list.filter((a) => a.status === "completed").length,
      };
    });
  }, [recap, acts, range]);

  const grouped = acts.reduce((m, a) => {
    (m[a.activity_date] ||= []).push(a);
    return m;
  }, {});

  const learnings = acts.filter((a) => a.learning);

  const obstacles = acts.filter(
    (a) => a.obstacle && !/tidak ada kendala/i.test(a.obstacle),
  );

  const makeAi = async () => {
    try {
      setAiText(await generateAiSummary(date, range));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const baseName = () => `jurnal-${range}-${recap.start}_${recap.end}`;

  const exportCsv = () => downloadCSV(acts, `${baseName()}.csv`);

  const exportXlsx = async () => {
    try {
      await downloadXLSX(acts, `${baseName()}.xlsx`, {
        title: `Laporan Jurnal Aktivitas ${LABEL[range]}`,
        name: user?.name || "",
        period,
        targets,
      });

      toast.success("File Excel dibuat");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat file Excel");
    }
  };

  const printPdf = () => {
    const old = document.title;
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");

    document.title = `Jurnal ${LABEL[range]} ${recap.start}`;
    root.classList.remove("dark");

    window.print();

    if (wasDark) root.classList.add("dark");
    document.title = old;
  };

  const copyRecap = () =>
    [
      `Rekap Jurnal ${LABEL[range]}`,
      `Periode: ${period}`,
      `Total ${acts.length} aktivitas, ${completed} selesai (${rate}%)`,
      aiText ? `\nRingkasan AI:\n${aiText}` : "",
      "\n========================================\n",
      activitiesToText(acts),
    ].join("\n");

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="page-title">Rekap Aktivitas</h1>
          <div className="flex flex-wrap gap-2">
            <CopyButton
              text={copyRecap}
              label="Salin rekap"
              className="btn-ghost"
            />
            <ExportMenu
              disabled={!acts.length}
              onExcel={exportXlsx}
              onCsv={exportCsv}
              onPdf={printPdf}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangeTabs value={range} onChange={setRange} />

          <div className="flex items-center gap-1">
            <button
              className="btn-ghost !px-2"
              onClick={() => setDate(shiftDate(range, date, -1))}
            >
              <ChevronLeft size={18} />
            </button>

            <input
              type="date"
              className="input !w-auto"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />

            <button
              className="btn-ghost !px-2"
              onClick={() => setDate(shiftDate(range, date, 1))}
            >
              <ChevronRight size={18} />
            </button>

            <button className="chip ml-1" onClick={() => setDate(today())}>
              Hari ini
            </button>
          </div>
        </div>

        {recap && <p className="font-medium text-primary-dark">{period}</p>}

        {/* Refleksi mingguan */}
        {range === "weekly" && (
          <WeeklyReflection date={date} disabled={!acts.length} />
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total aktivitas" value={acts.length} />

              <StatCard label="Selesai" value={completed} />

              <StatCard label="Tingkat selesai" value={`${rate}%`} />

              <StatCard label="Dengan refleksi" value={reflections} />
            </div>

            {targets.length > 0 && (
              <div className="card space-y-4">
                <h2 className="font-semibold">Target minggu ini</h2>

                {targets.map((t) => (
                  <TargetBar key={t.id} t={t} />
                ))}
              </div>
            )}

            <div className="card space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Sparkles size={18} className="text-primary-dark" />
                  Ringkasan AI {LABEL[range]}
                </h2>

                {acts.length > 0 && (
                  <button
                    className="btn-ghost !py-1 text-sm"
                    onClick={makeAi}
                    disabled={aiLoading}
                  >
                    {aiLoading
                      ? "Menyusun..."
                      : aiText
                        ? "Buat ulang"
                        : "Buat ringkasan"}
                  </button>
                )}
              </div>

              <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">
                {aiText ||
                  (acts.length
                    ? "Belum ada ringkasan. Klik tombol untuk membuatnya."
                    : "Belum ada aktivitas pada periode ini.")}
              </p>
            </div>

            {chartData.length > 0 && (
              <div className="card">
                <h2 className="mb-3 font-semibold">Aktivitas per hari</h2>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgb(234, 226, 214)"
                      />

                      <XAxis dataKey="tanggal" fontSize={12} />

                      <YAxis allowDecimals={false} fontSize={12} />

                      <Tooltip />
                      <Legend />

                      <Bar
                        dataKey="Total"
                        fill="rgb(234, 226, 214)"
                        stroke="rgb(139, 154, 110)"
                        radius={[6, 6, 0, 0]}
                      />

                      <Bar
                        dataKey="Selesai"
                        fill="rgb(139, 154, 110)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {(learnings.length > 0 || obstacles.length > 0) &&
              range !== "daily" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="card bg-primary/10">
                    <h2 className="mb-3 flex items-center gap-2 font-semibold">
                      <Lightbulb size={18} />
                      Pembelajaran ({learnings.length})
                    </h2>

                    <ul className="space-y-3 text-sm">
                      {learnings.map((a) => (
                        <li key={a.id}>
                          <div className="text-xs text-stone-500">
                            {formatDate(a.activity_date)} · {a.title}
                          </div>

                          <div>{a.learning}</div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="card bg-amber-50">
                    <h2 className="mb-3 flex items-center gap-2 font-semibold">
                      <AlertTriangle size={18} />
                      Kendala ({obstacles.length})
                    </h2>

                    {obstacles.length === 0 ? (
                      <p className="text-sm text-stone-500">
                        Tidak ada kendala berarti 🎉
                      </p>
                    ) : (
                      <ul className="space-y-3 text-sm">
                        {obstacles.map((a) => (
                          <li key={a.id}>
                            <div className="text-xs text-stone-500">
                              {formatDate(a.activity_date)} · {a.title}
                            </div>

                            <div>{a.obstacle}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

            <section className="space-y-5">
              {Object.keys(grouped).length === 0 && (
                <div className="card py-10 text-center text-stone-500">
                  Tidak ada aktivitas pada periode ini.
                </div>
              )}

              {Object.entries(grouped).map(([d, list]) => (
                <div key={d}>
                  {range !== "daily" && (
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-stone-500">
                        {formatDate(d)}
                      </h3>

                      <CopyButton
                        text={() => activitiesToText(list)}
                        label="Salin hari ini"
                        className="chip text-xs"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    {list.map((a) => (
                      <ActivityCard key={a.id} activity={a} showDate={false} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>

      {/* Hanya tampil saat dicetak */}
      <PrintReport
        user={user}
        range={range}
        recap={recap}
        aiText={aiText}
        targets={targets}
      />
    </>
  );
}

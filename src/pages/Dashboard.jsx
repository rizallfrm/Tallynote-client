import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  Flame,
  ListChecks,
  Plus,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../context/AuthContext";
import { useActivity } from "../context/ActivityContext";
import StatCard from "../components/summary/StatCard";
import Heatmap from "../components/summary/HeatMap";
import ActivityCard from "../components/activity/ActivityCard";
import { formatDate, greeting, today } from "../utils/format";
import api from "../api/axios";
import TargetBar from "../components/summary/TargetBar";
import PlanWidget from "../components/activity/PlanWidget";
import UpcomingDeadlines from "../components/activity/UpcomingDeadlines";
import GettingStarted from "../components/common/GettingStarted";

const COLORS = [
  "#8B9A6E",
  "#C9B79C",
  "#B5C29A",
  "#6A7850",
  "#D9CDB8",
  "#A8956F",
];

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, recap, fetchStats, fetchRecap } = useActivity();
  const [targets, setTargets] = useState(null);

  useEffect(() => {
    api
      .get("/targets", { params: { date: today() } })
      .then(({ data }) => setTargets(data.items.filter((t) => t.is_active)))
      .catch(() => setTargets([]));
  }, []);

  useEffect(() => {
    fetchStats().catch(() => {});
    fetchRecap("daily", today()).catch(() => {});
  }, [fetchStats, fetchRecap]);

  const t = recap?.range === "daily" && recap.start === today() ? recap : null;
  const todayCount = t?.activities.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="animate-fade-up rounded-3xl bg-linear-to-br from-primary to-primary-dark p-6 text-white shadow-md sm:p-8">
        <p className="text-sm text-white/80">{formatDate(today())}</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {greeting()}, {user?.name?.split(" ")[0] || "Teman"} 👋{" "}
        </h1>
        <p className="mt-2 max-w-lg text-white/85">
          {!stats
            ? "Memuat ringkasanmu..."
            : todayCount > 0
              ? `Hebat! Hari ini kamu sudah mencatat ${todayCount} aktivitas.`
              : stats.streak > 0
                ? `Streak ${stats.streak} harinya sedang berjalan. Catat satu aktivitas hari ini untuk menjaganya.`
                : "Belum ada catatan hari ini. Mulai dengan satu cerita singkat."}
        </p>
        <Link
          to="/activities/new"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-medium text-primary-dark transition hover:bg-cream"
        >
          <Plus size={18} /> Catat aktivitas
        </Link>
      </div>
      {stats?.total === 0 && <GettingStarted />}
      <UpcomingDeadlines />
      <PlanWidget onDone={() => fetchRecap("daily", today())} />{/* Stats */}
      {!stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Flame}
            label="Streak"
            value={`${stats.streak}`}
            hint={`Terpanjang ${stats.longestStreak} hari`}
          />
          <StatCard
            icon={ListChecks}
            label="Total aktivitas"
            value={stats.total}
            hint={`${stats.month.total} bulan ini`}
          />
          <StatCard
            icon={CheckCircle2}
            label="Selesai bulan ini"
            value={`${stats.month.rate}%`}
            hint={`${stats.month.completed} dari ${stats.month.total}`}
          />
          <StatCard
            icon={CalendarCheck}
            label="Hari aktif minggu ini"
            value={`${stats.activeDaysThisWeek}/7`}
          />
        </div>
      )}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Target minggu ini</h2>
          <Link to="/targets" className="text-sm text-primary-dark underline">
            Kelola
          </Link>
        </div>
        {targets === null ? (
          <div className="skeleton h-12" />
        ) : targets.length === 0 ? (
          <p className="text-sm text-stone-500">
            Belum ada target.{" "}
            <Link to="/targets" className="text-primary-dark underline">
              Atur target mingguan
            </Link>
          </p>
        ) : (
          targets.map((t) => <TargetBar key={t.id} t={t} />)
        )}
      </div>
      {/* Heatmap + kategori */}
      {stats && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <h2 className="mb-3 font-semibold">
              Konsistensi 12 minggu terakhir
            </h2>
            <Heatmap data={stats.heatmap} today={stats.today} />
          </div>
          <div className="card">
            <h2 className="mb-1 font-semibold">Kategori (30 hari)</h2>
            {stats.categories.length === 0 ? (
              <p className="py-10 text-center text-sm text-stone-400">
                Belum ada data
              </p>
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categories}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {stats.categories.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-1 text-sm">
                  {stats.categories.map((c, i) => (
                    <li key={c.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-stone-500">{c.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
      {/* Hari ini */}
      <section>
        <h2 className="mb-3 font-semibold">Aktivitas hari ini</h2>
        {!t ? (
          <div className="skeleton h-24" />
        ) : t.activities.length === 0 ? (
          <div className="card text-center text-stone-500">
            Belum ada aktivitas hari ini.{" "}
            <Link to="/activities/new" className="text-primary-dark underline">
              Catat sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {t.activities.map((a) => (
              <ActivityCard key={a.id} activity={a} showDate={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

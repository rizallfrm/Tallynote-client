import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, CalendarDays, Home, ListChecks, LogOut, Settings, Tags, Target } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const links = [
    { to: "/", label: "Beranda", icon: Home, end: true },
    { to: "/calendar", label: "Kalender", icon: CalendarDays },
    { to: "/activities", label: "Riwayat", icon: ListChecks },
    { to: "/recap", label: "Rekap", icon: BarChart3 },
    { to: "/targets", label: "Target", icon: Target },
    ...(user?.role === "admin" ? [{ to: "/admin/categories", label: "Kategori", icon: Tags }] : []),
    { to: "/settings", label: "Akun", icon: Settings },
  ];

  const desktopCls = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
      isActive ? "bg-primary text-white" : "text-stone-600 hover:bg-sand"
    }`;
  const mobileCls = ({ isActive }) =>
    `flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
      isActive ? "text-primary-dark" : "text-stone-400"
    }`;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-sand bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary-dark">
            <span className="rounded-lg bg-primary p-1.5 text-white"><BookOpen size={18} /></span>
            <span className="hidden md:inline">Jurnal Harian</span>
          </div>
          <nav className="hidden gap-1 sm:flex">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={desktopCls}>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary-dark">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <button className="btn-ghost !px-3 !py-1.5" title="Keluar"
              onClick={() => { logout(); nav("/login"); }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto border-t border-sand bg-cream/95 backdrop-blur sm:hidden">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={mobileCls}>
            <Icon size={20} /> {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3, CalendarDays, Home, LayoutTemplate, ListChecks, LogOut, Menu, PanelLeftClose,
  PanelLeftOpen, Plus, Search, Settings, Sparkles, Tags, Target, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";
import Logo from "../common/Logo";
import ThemeToggle from "../common/ThemeToggle";

const GROUPS = (admin) => [
  {
    label: "Utama",
    items: [
      { to: "/", label: "Beranda", icon: Home, end: true },
      { to: "/calendar", label: "Kalender", icon: CalendarDays },
      { to: "/activities", label: "Riwayat", icon: ListChecks },
    ],
  },
  {
    label: "Analisis",
    items: [
      { to: "/recap", label: "Rekap", icon: BarChart3 },
      { to: "/targets", label: "Target", icon: Target },
      { to: "/ask", label: "Tanya AI", icon: Sparkles },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { to: "/templates", label: "Template", icon: LayoutTemplate },
      ...(admin ? [{ to: "/admin/categories", label: "Kategori", icon: Tags }] : []),
      { to: "/settings", label: "Akun", icon: Settings },
    ],
  },
];

const openPalette = () => window.dispatchEvent(new Event("open-palette"));

function Item({ to, label, icon: Icon, end, compact }) {
  return (
    <NavLink
      to={to} end={end} aria-label={label} title={compact ? label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl py-2.5 text-sm transition ${
          compact ? "justify-center px-0" : "px-3"
        } ${isActive ? "bg-primary-100 font-medium text-primary-900" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"}`
      }
    >
      <Icon size={18} className="shrink-0" />
      {!compact && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function Panel({ compact, onToggle, onClose, mobile }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const groups = GROUPS(user?.role === "admin");

  return (
    <div className="flex h-full flex-col">
      {/* kepala */}
      <div className={`flex items-center gap-2 pb-3 pt-5 ${compact ? "justify-center px-2" : "justify-between px-4"}`}>
        {compact ? <Logo variant="icon" className="h-9" /> : <Logo className="h-9" />}
        {mobile ? (
          <button className="btn-ghost !p-2" onClick={onClose} aria-label="Tutup menu"><X size={18} /></button>
        ) : (
          !compact && (
            <button className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100" onClick={onToggle}
              aria-label="Ciutkan sidebar" title="Ciutkan sidebar"><PanelLeftClose size={18} /></button>
          )
        )}
      </div>

      {compact && !mobile && (
        <button className="mx-auto mb-2 rounded-lg p-2 text-stone-500 transition hover:bg-stone-100" onClick={onToggle}
          aria-label="Lebarkan sidebar" title="Lebarkan sidebar"><PanelLeftOpen size={18} /></button>
      )}

      {/* aksi utama */}
      <div className={compact ? "px-3" : "px-4"}>
        <NavLink to="/activities/new" title={compact ? "Catat aktivitas" : undefined} aria-label="Catat aktivitas"
          className={`btn w-full ${compact ? "!px-0" : ""}`}>
          <Plus size={16} /> {!compact && "Catat aktivitas"}
        </NavLink>
        <button onClick={openPalette} aria-label="Cari" title={compact ? "Cari (Ctrl K)" : undefined}
          className={`mt-2 flex w-full items-center rounded-xl border border-stone-200 py-2 text-sm text-stone-400 transition hover:bg-stone-50 ${
            compact ? "justify-center" : "gap-2 px-3"}`}>
          <Search size={15} />
          {!compact && <>Cari... <kbd className="ml-auto rounded bg-stone-100 px-1.5 text-xs">Ctrl K</kbd></>}
        </button>
      </div>

      {/* menu */}
      <nav className={`mt-3 flex-1 space-y-4 overflow-y-auto pb-3 ${compact ? "px-2" : "px-3"}`} aria-label="Menu utama">
        {groups.map((g) => (
          <div key={g.label} className="space-y-1">
            {compact ? (
              <div className="mx-3 border-t border-sand first:hidden" />
            ) : (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{g.label}</p>
            )}
            {g.items.map((it) => <Item key={it.to} {...it} compact={compact} />)}
          </div>
        ))}
      </nav>

      {/* profil */}
      <div className={`m-3 rounded-xl border border-sand bg-cream/60 p-2.5 ${compact ? "flex flex-col items-center gap-2" : "flex items-center gap-3"}`}>
        <Avatar user={user} size={compact ? 32 : 36} />
        {!compact && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.name}</div>
            <div className="truncate text-xs text-stone-500">{user?.email}</div>
          </div>
        )}
        <div className={compact ? "flex flex-col gap-1" : "flex items-center"}>
          <ThemeToggle className="rounded-lg p-2 text-stone-500 transition hover:bg-white" />
          <button className="rounded-lg p-2 text-stone-500 transition hover:bg-white hover:text-red-600"
            title="Keluar" aria-label="Keluar" onClick={() => { logout(); nav("/login"); }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle, drawerOpen, onCloseDrawer }) {
  // kunci scroll halaman dan tutup dengan Escape saat drawer terbuka
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && onCloseDrawer();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [drawerOpen, onCloseDrawer]);

  return (
    <>
      {/* desktop */}
      <aside className={`no-print fixed inset-y-0 left-0 z-30 hidden border-r border-sand bg-white transition-[width] duration-200 lg:block ${
        collapsed ? "w-[72px]" : "w-64"}`}>
        <Panel compact={collapsed} onToggle={onToggle} />
      </aside>

      {/* mobile dan tablet: drawer */}
      <div className={`no-print fixed inset-0 z-40 lg:hidden ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
        <div className={`absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onCloseDrawer} />
        <aside className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-200 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Panel mobile onClose={onCloseDrawer} />
        </aside>
      </div>
    </>
  );
}

const BOTTOM = [
  { to: "/", label: "Beranda", icon: Home, end: true },
  { to: "/calendar", label: "Kalender", icon: CalendarDays },
  { to: "/activities", label: "Riwayat", icon: ListChecks },
  { to: "/recap", label: "Rekap", icon: BarChart3 },
];

export function BottomNav({ onMenu }) {
  const cls = (active) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${active ? "text-primary-700" : "text-stone-400"}`;
  return (
    <nav aria-label="Navigasi bawah"
      className="no-print fixed inset-x-0 bottom-0 z-20 flex border-t border-sand bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {BOTTOM.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => cls(isActive)}>
          <Icon size={20} /> {label}
        </NavLink>
      ))}
      <button className={cls(false)} onClick={onMenu} aria-label="Buka menu lengkap">
        <Menu size={20} /> Menu
      </button>
    </nav>
  );
}
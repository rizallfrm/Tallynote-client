import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import Sidebar, { BottomNav } from "./Sidebar";
import Logo from "../common/Logo";
import Avatar from "../common/Avatar";
import ThemeToggle from "../common/ThemeToggle";
import CommandPalette from "../common/CommandPalette";
import { useAuth } from "../../context/AuthContext";
import useReminder from "../../hooks/useReminder";

const GO = { h: "/", k: "/calendar", a: "/activities", r: "/recap", t: "/targets", m: "/templates", i: "/ask" };
const readCollapsed = () => { try { return localStorage.getItem("sidebar_collapsed") === "1"; } catch { return false; } };

export default function AppLayout() {
  useReminder();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [palette, setPalette] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawer, setDrawer] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      try { localStorage.setItem("sidebar_collapsed", c ? "0" : "1"); } catch { /* abaikan */ }
      return !c;
    });
  }, []);
  const closeDrawer = useCallback(() => setDrawer(false), []);

  useEffect(() => { setDrawer(false); }, [pathname]); // tutup drawer setelah pindah halaman

  useEffect(() => {
    let g = false, timer;
    const onKey = (e) => {
      const t = e.target;
      const typing = t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((o) => !o); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); toggle(); return; } // Ctrl+B ciutkan sidebar
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (g) { g = false; clearTimeout(timer); if (GO[e.key]) nav(GO[e.key]); return; }
      if (e.key === "/") { e.preventDefault(); setPalette(true); }
      else if (e.key === "n") nav("/activities/new");
      else if (e.key === "g") { g = true; timer = setTimeout(() => (g = false), 1200); }
    };
    const open = () => setPalette(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", open);
      clearTimeout(timer);
    };
  }, [nav, toggle]);

  return (
    <div className={`app-shell min-h-screen transition-[padding] duration-200 ${collapsed ? "lg:pl-[72px]" : "lg:pl-64"}`}>
      <Sidebar collapsed={collapsed} onToggle={toggle} drawerOpen={drawer} onCloseDrawer={closeDrawer} />

      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-sand bg-cream/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <Logo className="h-8" />
        <div className="flex items-center gap-2">
          <button className="btn-ghost !p-2" aria-label="Cari" onClick={() => setPalette(true)}><Search size={16} /></button>
          <ThemeToggle />
          <Link to="/settings" aria-label="Akun"><Avatar user={user} size={32} /></Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12 lg:pt-8">
        <Outlet />
      </main>

      <BottomNav onMenu={() => setDrawer(true)} />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />

      {pathname !== "/activities/new" && (
        <Link to="/activities/new" aria-label="Tambah aktivitas"
          className="no-print fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition hover:bg-primary-700 lg:hidden">
          <Plus size={26} />
        </Link>
      )}
    </div>
  );
}
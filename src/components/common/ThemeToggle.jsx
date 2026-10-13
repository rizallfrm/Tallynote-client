import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const subscribe = (cb) => {
  const o = new MutationObserver(cb);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => o.disconnect();
};
const isDark = () => document.documentElement.classList.contains("dark");

export default function ThemeToggle({ className = "btn-ghost !p-2" }) {
  const dark = useSyncExternalStore(subscribe, isDark);
  const toggle = () => {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  return (
    <button onClick={toggle} className={className} title={dark ? "Mode terang" : "Mode gelap"} aria-label="Ganti tema">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
import { Sparkles, TrendingUp, CalendarCheck } from "lucide-react";
import Logo from "../common/Logo";
const APP_NAME = "Tallynote";

export default function AuthShell({ title, subtitle, children, footer }) {
  const points = [
    [Sparkles, "AI menyusun uraian, pembelajaran, dan kendala"],
    [CalendarCheck, "Rekap harian, mingguan, dan bulanan"],
    [TrendingUp, "Pantau streak dan konsistensimu"],
  ];
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-linear-to-br from-primary to-primary-dark p-12 text-white lg:flex">
        <div className="w-fit rounded-2xl bg-white px-5 py-4 shadow-sm">
          <Logo size="auth" />
        </div>
        <div>
          <h2 className="text-4xl font-semibold leading-tight">
            Catat sedikit,
            <br />
            pahami lebih banyak.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Ceritakan harimu dengan bebas. Sisanya biar AI yang merapikan.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map(([Icon, t]) => (
              <li
                key={t}
                className="flex items-center gap-3 text-sm text-white/90"
              >
                <span className="rounded-lg bg-white/15 p-2">
                  <Icon size={16} />
                </span>{" "}
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/60">
          © {new Date().getFullYear()} {APP_NAME}
        </p>{" "}
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="animate-fade-up w-full max-w-sm">
          <div className="mb-20 flex justify-center lg:hidden">
            <Logo size="auth" />
          </div>{" "}
          <h1 className="text-2xl font-semibold text-primary-dark">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-stone-500">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-stone-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { CalendarClock, PenLine, Sparkles } from "lucide-react";

const STEPS = [
  [PenLine, "Catat aktivitas", "Ceritakan harimu, atau isi manual. Hanya uraian yang wajib.", "/activities/new", "Mulai mencatat"],
  [Sparkles, "Biarkan AI merapikan", "AI menyusun uraian, pembelajaran, dan kendala. Kamu bisa mengeditnya.", "/activities/new", "Coba Generate AI"],
  [CalendarClock, "Pasang deadline", "Dapat pengingat otomatis lewat email atau WhatsApp saat mendekati deadline.", "/settings", "Atur pengingat"],
];

export default function GettingStarted() {
  return (
    <section className="card space-y-4" aria-labelledby="gs-title">
      <div>
        <h2 id="gs-title" className="font-semibold">Mulai dalam 3 langkah</h2>
        <p className="text-sm text-stone-500">Panduan ini hilang otomatis setelah kamu punya aktivitas pertama.</p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map(([Icon, title, desc, to, cta], i) => (
          <li key={title} className="flex flex-col gap-2 rounded-xl border border-sand bg-cream/50 p-4">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs text-white">{i + 1}</span>
              <Icon size={16} className="text-primary-700" /> {title}
            </span>
            <p className="flex-1 text-sm text-stone-600">{desc}</p>
            <Link to={to} className="text-sm font-medium text-primary-700 underline">{cta}</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
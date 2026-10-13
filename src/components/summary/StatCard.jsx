export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="card animate-fade-up">
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-500">{label}</span>
        {Icon && (
          <span className="rounded-xl bg-primary-100 p-2 text-primary-700"><Icon size={16} /></span>
        )}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-stone-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-stone-400">{hint}</div>}
    </div>
  );
}
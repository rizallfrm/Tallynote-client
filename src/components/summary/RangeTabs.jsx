const RANGES = [["daily", "Harian"], ["weekly", "Mingguan"], ["monthly", "Bulanan"]];

export default function RangeTabs({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl bg-sand/60 p-1" role="tablist">
      {RANGES.map(([k, label]) => (
        <button
          key={k}
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            value === k ? "bg-white text-primary-800 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
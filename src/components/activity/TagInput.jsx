import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../../api/axios";

const clean = (s) => s.replace(/^#+/, "").trim().toLowerCase().replace(/\s+/g, "-").slice(0, 30);

export default function TagInput({ value, onChange, max = 8 }) {
  const [text, setText] = useState("");
  const [known, setKnown] = useState([]);

  useEffect(() => {
    api.get("/tags").then((r) => setKnown(r.data.map((t) => t.name))).catch(() => {});
  }, []);

  const add = (raw) => {
    const t = clean(raw);
    if (t && !value.includes(t) && value.length < max) onChange([...value, t]);
    setText("");
  };

  return (
    <div>
      <div className="input flex flex-wrap items-center gap-1.5 !py-2">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
            #{t}
            <button type="button" aria-label={`Hapus ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          list="known-tags"
          className="min-w-24 flex-1 bg-transparent text-sm outline-none"
          value={text}
          placeholder={value.length ? "" : "Ketik tag lalu tekan Enter"}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => text && add(text)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); }
            else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
          }}
        />
      </div>
      <datalist id="known-tags">
        {known.filter((k) => !value.includes(k)).map((k) => <option key={k} value={k} />)}
      </datalist>
    </div>
  );
}
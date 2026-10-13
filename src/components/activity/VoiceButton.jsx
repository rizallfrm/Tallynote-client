import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function VoiceButton({ onText, lang = "id-ID" }) {
  const toast = useToast();
  const [on, setOn] = useState(false);
  const rec = useRef(null);

  useEffect(() => () => rec.current?.stop(), []);
  if (!SR) return null; // Firefox belum mendukung

  const start = () => {
    const r = new SR();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal) t += e.results[i][0].transcript;
      if (t.trim()) onText(t.trim());
    };
    r.onerror = (e) => {
      setOn(false);
      if (e.error === "not-allowed") toast.error("Izin mikrofon ditolak. Izinkan lewat pengaturan situs.");
      else if (!["no-speech", "aborted"].includes(e.error)) toast.error(`Input suara gagal (${e.error})`);
    };
    r.onend = () => setOn(false);
    r.start();
    rec.current = r;
    setOn(true);
  };

  return (
    <button type="button" onClick={on ? () => rec.current?.stop() : start}
      className={on ? "btn-destructive !px-3 !py-1 text-xs" : "chip text-xs"}>
      {on ? <Square size={12} /> : <Mic size={12} />} {on ? "Berhenti" : "Dikte"}
    </button>
  );
}

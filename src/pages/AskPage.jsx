import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import api from "../api/axios";
import PageHeader from "../components/common/PageHeader";
import { errMsg } from "../utils/format";

const IDEAS = [
  "Apa kendala utama yang paling sering saya alami?",
  "Apa saja yang sudah saya pelajari minggu ini?",
  "Kapan terakhir kali saya mengerjakan hal tentang belajar?",
  "Aktivitas apa yang belum saya selesaikan?",
];

export default function AskPage() {
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async (text) => {
    const question = (text ?? q).trim();
    if (question.length < 3 || busy) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setQ("");
    setBusy(true);
    try {
      const { data } = await api.post("/ask", { question }, { timeout: 30000 });
      setMsgs((m) => [...m, { role: "ai", text: data.answer, used: data.used }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "err", text: errMsg(e) }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageHeader title="Tanya Jurnalmu"
        subtitle="AI menjawab dari catatanmu sendiri, bukan dari internet." />

      {msgs.length === 0 && (
        <div className="card space-y-3">
          <p className="text-sm text-stone-600">Coba salah satu pertanyaan ini:</p>
          <div className="flex flex-wrap gap-2">
            {IDEAS.map((i) => <button key={i} className="chip text-left" onClick={() => send(i)}>{i}</button>)}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`animate-fade-up flex ${m.role === "user" ? "justify-end" : ""}`}>
            <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user" ? "bg-primary-600 text-white"
              : m.role === "err" ? "border border-red-200 bg-red-50 text-red-600"
              : "border border-sand bg-white"}`}>
              {m.text}
              {m.role === "ai" && m.used > 0 && (
                <div className="mt-2 text-xs text-stone-400">Berdasarkan {m.used} catatan terkait</div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Loader2 size={16} className="animate-spin" /> AI membaca jurnalmu...
          </div>
        )}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="sticky bottom-20 flex gap-2 lg:bottom-4">
        <input className="input shadow-sm" value={q} maxLength={300} onChange={(e) => setQ(e.target.value)}
          placeholder="Tanyakan sesuatu tentang jurnalmu..." />
        <button className="btn" disabled={busy || q.trim().length < 3} aria-label="Kirim"><Send size={16} /></button>
      </form>
      <p className="flex items-center gap-1 text-xs text-stone-400">
        <Sparkles size={12} /> Jawaban AI bisa keliru. Cek tanggal rujukannya di Riwayat bila penting.
      </p>
    </div>
  );
}
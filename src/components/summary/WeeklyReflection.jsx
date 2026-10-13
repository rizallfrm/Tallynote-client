import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import api from "../../api/axios";
import CopyButton from "../common/CopyButton";
import { useToast } from "../../context/ToastContext";
import { errMsg } from "../../utils/format";

const LABEL = /^(Yang berjalan baik|Yang perlu diperbaiki|Fokus minggu depan)\s*:\s*/i;

export default function WeeklyReflection({ date, disabled }) {
  const toast = useToast();
  const [r, setR] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setR(null);
    api.get("/reflections", { params: { date } }).then((x) => setR(x.data)).catch(() => {});
  }, [date]);

  const generate = async () => {
    setBusy(true);
    try { setR((await api.post("/reflections/generate", { date }, { timeout: 30000 })).data); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="card space-y-3 bg-primary-50">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex flex-1 items-center gap-2 font-semibold">
          <Sparkles size={18} className="text-primary-700" /> Refleksi mingguan
        </h2>
        {r?.content && <CopyButton text={r.content} iconOnly className="btn-ghost !p-2" />}
        <button className="btn-ghost !py-1.5 text-sm" onClick={generate} disabled={busy || disabled}>
          {busy ? "Menyusun..." : r?.content ? "Buat ulang" : "Buat refleksi"}
        </button>
      </div>
      {r?.content ? (
        <div className="space-y-2">
          {r.content.split("\n").filter((l) => l.trim()).map((l, i) => {
            const m = l.match(LABEL);
            return (
              <p key={i} className="text-sm leading-relaxed text-stone-700">
                {m && <b className="block text-primary-800">{m[1]}</b>}
                {m ? l.replace(LABEL, "") : l}
              </p>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-stone-500">
          {disabled ? "Belum ada aktivitas pada minggu ini." : "Belum ada refleksi untuk minggu ini. Klik tombol untuk membuatnya."}
        </p>
      )}
    </div>
  );
}
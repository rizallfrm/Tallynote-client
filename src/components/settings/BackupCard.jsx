import { useRef, useState } from "react";
import { DatabaseBackup, Download, Upload } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import { errMsg, today } from "../../utils/format";

export default function BackupCard() {
  const toast = useToast();
  const file = useRef(null);
  const [busy, setBusy] = useState(false);

  const exportJson = async () => {
    setBusy(true);
    try {
      const { data } = await api.get("/backup", { timeout: 60000 });
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = `jurnal-backup-${today()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${data.activities.length} aktivitas diekspor`);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const importJson = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const data = JSON.parse(await f.text());
      if (!confirm(`Impor ${data.activities?.length ?? 0} aktivitas? Data yang sudah ada (tanggal dan judul sama) akan dilewati.`)) return;
      const { data: r } = await api.post("/backup/import", data, { timeout: 120000 });
      toast.success(`Ditambahkan ${r.added}, dilewati ${r.skipped}, template baru ${r.templates}`);
    } catch (err) {
      toast.error(err instanceof SyntaxError ? "File bukan JSON yang valid" : errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="card space-y-3">
      <h2 className="flex items-center gap-2 font-semibold"><DatabaseBackup size={18} /> Backup data</h2>
      <p className="text-sm text-stone-600">
        Unduh semua aktivitas dan template sebagai file JSON, atau pulihkan dari file backup sebelumnya.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={exportJson} disabled={busy}><Download size={16} /> Unduh backup</button>
        <button className="btn-ghost" onClick={() => file.current?.click()} disabled={busy}>
          <Upload size={16} /> Impor dari file
        </button>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
      </div>
    </div>
  );
}
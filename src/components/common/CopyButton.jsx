import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { copyText } from "../../utils/format";

export default function CopyButton({ text, label = "Salin", iconOnly = false, className = "btn-ghost" }) {
  const toast = useToast();
  const [done, setDone] = useState(false);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const value = typeof text === "function" ? text() : text;
    const ok = await copyText(value);
    if (ok) {
      setDone(true);
      toast.success("Teks disalin ke clipboard");
      setTimeout(() => setDone(false), 1600);
    } else {
      toast.error("Gagal menyalin teks");
    }
  };

  return (
    <button type="button" onClick={onClick} className={className} title="Salin teks" aria-label="Salin teks">
      {done ? <Check size={16} /> : <Copy size={16} />}
      {!iconOnly && (done ? "Tersalin" : label)}
    </button>
  );
}
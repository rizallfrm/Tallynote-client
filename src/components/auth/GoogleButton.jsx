import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { errMsg } from "../../utils/format";

export default function GoogleButton({ text = "continue_with" }) {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();

  // tombol disembunyikan jika Client ID belum diisi
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  const width = Math.min(360, window.innerWidth - 48);

  return (
    <>
      <div className="flex justify-center">
        <GoogleLogin
          width={width}
          text={text}
          theme="outline"
          size="large"
          shape="rectangular"
          logo_alignment="center"
          onSuccess={async (res) => {
            try { await loginWithGoogle(res.credential); }
            catch (e) { toast.error(errMsg(e)); }
          }}
          onError={() => toast.error("Login Google dibatalkan atau gagal")}
        />
      </div>
      <div className="my-5 flex items-center gap-3 text-xs text-stone-400">
        <span className="h-px flex-1 bg-sand" /> atau dengan email <span className="h-px flex-1 bg-sand" />
      </div>
    </>
  );
}
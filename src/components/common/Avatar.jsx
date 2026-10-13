import { useState } from "react";

export default function Avatar({ user, size = 36 }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };

  if (user?.avatar_url && !broken)
    return (
      <img
        src={user.avatar_url}
        alt=""
        style={style}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="rounded-full object-cover"
      />
    );

  return (
    <div style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-800">
      {user?.name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}
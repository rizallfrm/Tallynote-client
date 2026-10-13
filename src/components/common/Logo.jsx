export const APP_NAME = "Tallynote";
const SIZES = {
  sidebar: "h-12 max-w-[170px]",
  collapsed: "h-10 w-10",
  mobile: "h-9 max-w-[140px]",
  auth: "h-16 max-w-[220px]",
  print: "h-12 max-w-[180px]",
  none: "",
};

export default function Logo({ size = "sidebar", variant = "full", white = false, className = "" }) {
  const src = variant === "icon" ? "/logo.png" : white ? "/logo-white.png" : "/logo-icon.png";
  return (
    <img
      src={src}
      alt={APP_NAME}
      draggable={false}
      className={`block w-auto select-none object-contain object-left ${SIZES[size] ?? ""} ${className}`}
    />
  );
}

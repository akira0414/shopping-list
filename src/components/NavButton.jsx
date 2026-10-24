// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.
import { React } from "./../vendor/runtime.js";

export function NavButton({
  active: active,
  icon: icon,
  label: label,
  onClick: onClick,
  theme: theme,
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active ? "" : "text-gray-400"}`}
      style={{ color: active ? theme.primary : void 0 }}
    >
      {
        <div
          className={`mb-1 ${active ? "scale-110" : "scale-100"} transition-transform`}
        >
          {icon}
        </div>
      }
      {
        <span
          className={`text-[10px] font-bold ${active ? "opacity-100" : "opacity-60"}`}
        >
          {label}
        </span>
      }
    </button>
  );
}

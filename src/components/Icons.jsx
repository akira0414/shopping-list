import { React } from "../vendor/runtime.js";
export function BoothAddIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10V7l2-4h13l2 4v3M3 7h17M4 10v10h10M8 20v-6h5v6M3 10c1.5 2 4 2 5 0 1.5 2 4 2 5 0 1.5 2 4 2 7 0M18 15v6m-3-3h6" />
    </svg>
  );
}
export function ProductAddIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 21H4L3 7h17l-.4 5M8 8V6a4 4 0 0 1 8 0v2M18 15v6m-3-3h6" />
    </svg>
  );
}
export function ImageUploadIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="6" width="24" height="21" rx="4" />
      <circle cx="11" cy="13" r="2" />
      <path d="m5 23 7-6 5 4 5-7 5 8M24 3v7m-3-4 3-3 3 3" />
    </svg>
  );
}

export function EditProductIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15Z" />
      <path d="M13 20h7" />
    </svg>
  );
}
export function FoldAllIcon({ expanded }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {expanded ? (
        <path d="m7 8 5-5 5 5M7 16l5 5 5-5M5 12h14" />
      ) : (
        <path d="m7 3 5 5 5-5M7 21l5-5 5 5M5 12h14" />
      )}
    </svg>
  );
}

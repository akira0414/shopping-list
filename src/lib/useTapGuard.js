import { React } from "../vendor/runtime.js";
export function useTapGuard(onTap, dragState) {
  const start = React.useRef(null);
  return {
    onPointerDown: (e) => {
      start.current = {
        x: e.clientX,
        y: e.clientY,
        scroll: window.scrollY,
        moved: false,
      };
    },
    onPointerMove: (e) => {
      const p = start.current;
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) p.moved = true;
    },
    onPointerCancel: () => {
      if (start.current) start.current.moved = true;
    },
    onClick: (e) => {
      const p = start.current;
      if (
        dragState?.current?.active ||
        Date.now() < (dragState?.current?.suppressUntil || 0)
      )
        return;
      if (
        e.detail !== 0 &&
        p &&
        (p.moved || Math.abs(window.scrollY - p.scroll) > 1)
      )
        return;
      onTap();
    },
  };
}

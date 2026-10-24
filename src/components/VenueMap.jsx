// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.
import {
  motion,
  CloseIcon,
  React,
  AnimatePresence,
} from "./../vendor/runtime.js";
import { createId } from "./../lib/createId.js";

export function VenueMap({
  imageUrl: imageUrl,
  eventId: eventId,
  markers: markers,
  onAddMarker: onAddMarker,
  onRemoveMarker: onRemoveMarker,
  onClose: onClose,
  theme: theme,
}) {
  const [m, p] = React.useState(null),
    [y, x] = React.useState(""),
    [b, S] = React.useState(""),
    [M, j] = React.useState(1),
    [U, V] = React.useState({ x: 0, y: 0 }),
    _ = React.useRef(null),
    L = React.useRef(new Map()),
    H = React.useRef(null),
    G = React.useRef(null),
    Z = React.useRef(!1),
    st = (X) => {
      if (Z.current) {
        Z.current = !1;
        return;
      }
      const ct = X.currentTarget.getBoundingClientRect(),
        xt = ((X.clientX - ct.left) / ct.width) * 100,
        jt = ((X.clientY - ct.top) / ct.height) * 100;
      p({ x: xt, y: jt });
    },
    $ = (X) => Math.min(4, Math.max(1, X)),
    W = (X) => {
      if (
        !(X.pointerType === "mouse" && X.button !== 0) &&
        (X.currentTarget.setPointerCapture(X.pointerId),
        L.current.set(X.pointerId, { x: X.clientX, y: X.clientY }),
        (Z.current = !1),
        L.current.size === 1 &&
          ((H.current = { x: X.clientX, y: X.clientY, panX: U.x, panY: U.y }),
          (G.current = null)),
        L.current.size === 2)
      ) {
        const ct = Array.from(L.current.values()),
          xt = Math.hypot(ct[0].x - ct[1].x, ct[0].y - ct[1].y);
        ((G.current = { distance: xt, scale: M }), (H.current = null), p(null));
      }
    },
    it = (X) => {
      if (L.current.has(X.pointerId)) {
        if (
          (L.current.set(X.pointerId, { x: X.clientX, y: X.clientY }),
          L.current.size === 1 && H.current && M > 1)
        ) {
          const ct = X.clientX - H.current.x,
            xt = X.clientY - H.current.y;
          ((Math.abs(ct) > 6 || Math.abs(xt) > 6) && (Z.current = !0),
            V({ x: H.current.panX + ct, y: H.current.panY + xt }));
          return;
        }
        if (L.current.size === 2 && G.current) {
          const ct = Array.from(L.current.values()),
            xt = Math.hypot(ct[0].x - ct[1].x, ct[0].y - ct[1].y),
            jt = $((G.current.scale * xt) / G.current.distance);
          (Math.abs(jt - M) > 0.01 && (Z.current = !0), j(jt));
        }
      }
    },
    Q = (X) => {
      (L.current.has(X.pointerId) && L.current.delete(X.pointerId),
        L.current.size < 2 && (G.current = null),
        L.current.size === 0 && (H.current = null));
    },
    K = async () => {
      m &&
        y &&
        (await onAddMarker({
          id: createId(),
          eventId: eventId,
          boothNumber: y,
          x: m.x,
          y: m.y,
          url: b || void 0,
        })) &&
        (p(null), x(""), S(""));
    };
  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {
        <header className="p-6 flex justify-between items-center text-white shrink-0">
          {<h3 className="font-black">{"場地地圖 (手機可雙指縮放)"}</h3>}
          {
            <div className="flex items-center gap-4">
              {m && (
                <button
                  onClick={() => p(null)}
                  className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full"
                >
                  {"取消新增"}
                </button>
              )}
              {
                <button
                  onClick={onClose}
                  aria-label="關閉場地地圖"
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {<CloseIcon />}
                </button>
              }
            </div>
          }
        </header>
      }
      {
        <div className="flex-grow relative overflow-hidden flex items-center justify-center bg-gray-900 select-none">
          {
            <div
              ref={_}
              className="relative cursor-crosshair max-w-full max-h-full touch-none"
              onClick={st}
              onPointerDown={W}
              onPointerMove={it}
              onPointerUp={Q}
              onPointerCancel={Q}
              onPointerLeave={Q}
              style={{
                transform: `translate(${U.x}px, ${U.y}px) scale(${M})`,
                transformOrigin: "center center",
                touchAction: "none",
              }}
            >
              {
                <img
                  src={imageUrl}
                  alt="Map"
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              }
              {markers.map((X) => (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute w-8 h-8 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-[10px] font-black text-white cursor-pointer z-10"
                  style={{
                    left: `${X.x}%`,
                    top: `${X.y}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: theme.primary,
                  }}
                  onClick={(ct) => {
                    (ct.stopPropagation(),
                      confirm(`刪除標記 ${X.boothNumber}?`) &&
                        onRemoveMarker(X.id));
                  }}
                  key={X.id}
                >
                  {X.boothNumber}
                </motion.div>
              ))}
              {m && (
                <div
                  className="absolute w-8 h-8 bg-white border-2 rounded-full animate-pulse z-20"
                  style={{
                    left: `${m.x}%`,
                    top: `${m.y}%`,
                    transform: "translate(-50%, -50%)",
                    borderColor: theme.primary,
                  }}
                />
              )}
            </div>
          }
          {
            <div className="absolute right-4 top-4 z-40 flex flex-col gap-2">
              {
                <button
                  onClick={() => j((X) => $(X + 0.25))}
                  aria-label="放大地圖"
                  className="w-11 h-11 rounded-full bg-white/90 text-gray-900 font-black shadow-lg"
                >
                  {"+"}
                </button>
              }
              {
                <button
                  onClick={() => {
                    (j(1), V({ x: 0, y: 0 }));
                  }}
                  className="w-11 h-11 rounded-full bg-white/90 text-gray-900 text-xs font-black shadow-lg"
                >
                  {"重設"}
                </button>
              }
              {
                <button
                  onClick={() => j((X) => $(X - 0.25))}
                  aria-label="縮小地圖"
                  className="w-11 h-11 rounded-full bg-white/90 text-gray-900 font-black shadow-lg"
                >
                  {"-"}
                </button>
              }
            </div>
          }
          {
            <AnimatePresence>
              {m && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white p-6 rounded-[30px] shadow-2xl flex flex-col gap-4 w-72 z-50"
                >
                  {<h4 className="font-black text-center">{"新增攤位標記"}</h4>}
                  {
                    <input
                      autoFocus={!0}
                      type="text"
                      placeholder="攤位號碼 (如: A01)"
                      className="bg-gray-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:ring-2 transition-all"
                      style={{ "--tw-ring-color": theme.primary }}
                      value={y}
                      onChange={(X) => x(X.target.value)}
                      onKeyDown={(X) => X.key === "Enter" && K()}
                    />
                  }
                  {
                    <input
                      type="text"
                      placeholder="網址 (選填)"
                      className="bg-gray-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:ring-2 transition-all"
                      style={{ "--tw-ring-color": theme.primary }}
                      value={b}
                      onChange={(X) => S(X.target.value)}
                      onKeyDown={(X) => X.key === "Enter" && K()}
                    />
                  }
                  {
                    <div className="flex gap-2">
                      {
                        <button
                          onClick={() => p(null)}
                          className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-400"
                        >
                          {"取消"}
                        </button>
                      }
                      {
                        <button
                          onClick={K}
                          className="flex-1 py-3 text-white rounded-xl font-bold shadow-lg"
                          style={{
                            backgroundColor: theme.primary,
                            color: theme.onPrimary || "#fff",
                          }}
                        >
                          {"新增"}
                        </button>
                      }
                    </div>
                  }
                </motion.div>
              )}
            </AnimatePresence>
          }
        </div>
      }
    </div>
  );
}

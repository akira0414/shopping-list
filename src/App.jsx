import {
  React,
  CalendarIcon,
  SettingsIcon,
  ShoppingCartIcon,
  TagIcon,
} from "./vendor/runtime.js";
import { THEMES } from "./config/themes.js";
import { loadData, saveData } from "./lib/storage.js";
import { APP_NAME, reorderByIds, parseBackup, UNASSIGNED } from "./lib/data.js";
import { exportBackup } from "./lib/backup.js";
import { createId } from "./lib/createId.js";
import { EventsPage } from "./components/EventsPage.jsx";
import { ShoppingListPage } from "./components/ShoppingListPage.jsx";
import { CategoriesPage } from "./components/CategoriesPage.jsx";
import { SettingsPage } from "./components/SettingsPage.jsx";
import { EventEditor } from "./components/EventEditor.jsx";
import { BoothEditor } from "./components/BoothEditor.jsx";
import { ProductEditor } from "./components/ProductEditor.jsx";
import { CategoryEditor } from "./components/CategoryEditor.jsx";
import { BudgetEditor } from "./components/BudgetEditor.jsx";
import { ThemeSelector } from "./components/ThemeSelector.jsx";
import { ImagePreview } from "./components/ImagePreview.jsx";
import { VenueMap } from "./components/VenueMap.jsx";
import { Modal } from "./components/Forms.jsx";

export function App() {
  const [data, setData] = React.useState(null),
    current = React.useRef(null);
  const [loadError, setLoadError] = React.useState(""),
    [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false),
    lock = React.useRef(false);
  const [tab, setTab] = React.useState("events"),
    [editor, setEditor] = React.useState(null);
  const [toast, setToast] = React.useState(null),
    timer = React.useRef(null);
  const [preview, setPreview] = React.useState(null),
    [mapOpen, setMapOpen] = React.useState(false);
  const [restoring, setRestoring] = React.useState(null),
    [exporting, setExporting] = React.useState(false);
  const alive = React.useRef(true);
  async function initialize() {
    setLoadError("");
    try {
      const loaded = await loadData();
      if (alive.current) {
        current.current = loaded;
        setData(loaded);
      }
    } catch (e) {
      if (alive.current)
        setLoadError(`無法載入資料：${e.message}。原資料未清除。`);
    }
  }
  React.useEffect(() => {
    alive.current = true;
    initialize();
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);
  function notify(message, undo = null) {
    clearTimeout(timer.current);
    setToast({ message, undo });
    timer.current = setTimeout(() => setToast(null), undo ? 5000 : 3500);
  }
  async function commit(update, message = "") {
    if (lock.current || !current.current) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await saveData(update(current.current));
      current.current = next;
      setData(next);
      if (message) notify(message);
      return true;
    } catch (e) {
      setError(`未能儲存：${e.message}。資料未變更，請重試。`);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function saveAndClose(update, message) {
    if (await commit(update, message)) setEditor(null);
  }
  function newProduct(boothId = null) {
    setEditor({
      type: "product",
      mode: "new",
      item: {
        id: createId(),
        eventId: current.current.currentEventId,
        categoryId: null,
        name: "",
        boothId,
        favorite: false,
        price: 0,
        status: "pending",
        createdAt: Date.now(),
      },
    });
  }
  function newBooth() {
    setEditor({
      type: "booth",
      mode: "new",
      item: {
        id: createId(),
        eventId: current.current.currentEventId,
        name: "",
        number: "",
        imageUrl: "",
        linkLabel: "",
        url: "",
        notes: "",
      },
    });
  }
  async function changeStatus(id, next) {
    const item = current.current.items.find((i) => i.id === id);
    if (!item || item.status === next) return;
    const previous = item.status;
    if (
      await commit((d) => ({
        ...d,
        items: d.items.map((i) => (i.id === id ? { ...i, status: next } : i)),
      }))
    ) {
      const labels = {
        pending: "已改為未購",
        purchased: "已標記購入",
        soldOut: "已標註完售",
      };
      notify(labels[next], async () => {
        const latest = current.current.items.find((i) => i.id === id);
        if (!latest || latest.status !== next) {
          notify("商品已變更，無法復原");
          return;
        }
        await commit(
          (d) => ({
            ...d,
            items: d.items.map((i) =>
              i.id === id ? { ...i, status: previous } : i,
            ),
          }),
          "已復原購買狀態",
        );
      });
    }
  }
  function togglePurchased(id) {
    const item = current.current.items.find((i) => i.id === id);
    if (!item) return;
    if (item.status === "soldOut") {
      notify("完售商品可用「取消完售」或編輯畫面變更狀態");
      return;
    }
    return changeStatus(
      id,
      item.status === "purchased" ? "pending" : "purchased",
    );
  }
  function toggleSoldOut(id) {
    const item = current.current.items.find((i) => i.id === id);
    if (item)
      return changeStatus(
        id,
        item.status === "soldOut" ? "pending" : "soldOut",
      );
  }
  function toggleFavorite(id) {
    return commit((d) => ({
      ...d,
      items: d.items.map((i) =>
        i.id === id ? { ...i, favorite: !i.favorite } : i,
      ),
    }));
  }
  function deleteBooth(id) {
    const count = current.current.items.filter((i) => i.boothId === id).length;
    if (
      !confirm(
        `確定刪除此攤位？${count} 項商品會移至「未指定攤位」，不會刪除商品。`,
      )
    )
      return;
    return saveAndClose((d) => {
      const booth = d.booths.find((b) => b.id === id);
      const items = d.items.map((i) =>
        i.boothId === id ? { ...i, boothId: null } : i,
      );
      const order = (d.boothOrder[booth.eventId] || []).filter(
        (value) => value !== id,
      );
      if (count && !order.includes(UNASSIGNED)) order.push(UNASSIGNED);
      return {
        ...d,
        booths: d.booths.filter((b) => b.id !== id),
        items,
        boothOrder: { ...d.boothOrder, [booth.eventId]: order },
        events: d.events.map((e) => ({
          ...e,
          ...(e.markers
            ? {
                markers: e.markers.map((m) =>
                  m.boothId === id ? { ...m, boothId: null } : m,
                ),
              }
            : {}),
        })),
      };
    }, "攤位已刪除，商品已保留");
  }
  async function selectBackup(file) {
    if (!file) return;
    setError("");
    try {
      setRestoring(parseBackup(await file.text()));
    } catch (e) {
      setError(`無法還原：${e.message}。目前資料未變更。`);
    }
  }
  if (!data)
    return (
      <main className="startup">
        <h1>{APP_NAME}</h1>
        {loadError ? (
          <>
            <p role="alert">{loadError}</p>
            <button className="primary-button" onClick={initialize}>
              重新載入
            </button>
          </>
        ) : (
          <p role="status">正在載入及檢查資料…</p>
        )}
      </main>
    );
  const theme = THEMES.find((t) => t.id === data.themeId) || THEMES[0];
  const event = data.events.find((e) => e.id === data.currentEventId);
  const items = data.items.filter((i) => i.eventId === event?.id);
  const booths = data.booths.filter((booth) => booth.eventId === event?.id);
  const spent = items
    .filter((i) => i.status === "purchased")
    .reduce((n, i) => n + i.price, 0);
  const common = {
    busy,
    onClose: () => {
      setEditor(null);
      setError("");
    },
  };
  return (
    <div
      className="app-shell"
      data-theme={theme.id}
      style={{
        "--app-primary": theme.primary,
        "--app-secondary": theme.secondary,
        "--app-on-primary": theme.onPrimary || "#fff",
        "--app-accent-text": theme.text || theme.primary,
        "--app-background": theme.background,
        "--app-surface": theme.surface || "#fff",
        "--app-surface-raised": theme.surfaceRaised || "#f3f4f6",
        "--app-border": theme.border || "#eee",
        "--app-foreground": theme.foreground || "#444",
        "--app-muted": theme.muted || "#7b8190",
        "--app-error": theme.error || "#b91c1c",
        "--app-error-background": theme.errorBackground || "#fff1f2",
        "--app-selection-outline":
          theme.colorScheme === "dark" ? theme.secondary : "#333",
        background: theme.background,
      }}
    >
      <main className="app-main" aria-busy={busy}>
        {tab === "events" && (
          <EventsPage
            events={data.events}
            currentEventId={data.currentEventId}
            theme={theme}
            onSelect={async (id) => {
              if (await commit((d) => ({ ...d, currentEventId: id })))
                setTab("items");
            }}
            onAdd={() =>
              setEditor({
                type: "event",
                item: {
                  id: "",
                  name: "",
                  date: "",
                  location: "",
                  budget: data.defaultBudget,
                },
              })
            }
            onEdit={(item) => setEditor({ type: "event", item })}
          />
        )}
        {tab === "items" && (
          <ShoppingListPage
            key={event?.id || "empty"}
            currentEvent={event}
            items={items}
            booths={booths}
            onAddBooth={newBooth}
            onEditBooth={(item) =>
              setEditor({ type: "booth", mode: "edit", item })
            }
            onToggleFavorite={toggleFavorite}
            onToggleSoldOut={toggleSoldOut}
            categories={data.categories}
            spent={spent}
            theme={theme}
            busy={busy}
            boothOrder={data.boothOrder[event?.id] || []}
            onNavigateToEvents={() => setTab("events")}
            onAdd={newProduct}
            onEdit={(item) =>
              setEditor({ type: "product", mode: "edit", item })
            }
            onToggleStatus={togglePurchased}
            onOpenMap={() => setMapOpen(true)}
            onPreviewImage={setPreview}
            onReorderItems={async (ordered, booth) =>
              commit(
                (d) => ({
                  ...d,
                  items: reorderByIds(
                    d.items,
                    ordered,
                    (i) =>
                      i.eventId === event.id &&
                      (i.boothId || UNASSIGNED) === booth,
                  ),
                }),
                "商品排序已儲存",
              )
            }
            onReorderBooths={async (order) =>
              commit((d) => {
                const actual = new Set(
                  d.booths
                    .filter((b) => b.eventId === event.id)
                    .map((b) => b.id),
                );
                if (
                  d.items.some(
                    (i) => i.eventId === event.id && i.boothId === null,
                  )
                )
                  actual.add(UNASSIGNED);
                if (
                  order.length !== actual.size ||
                  new Set(order).size !== actual.size ||
                  order.some((b) => !actual.has(b))
                )
                  throw new Error("攤位已變更，請重試");
                return {
                  ...d,
                  boothOrder: { ...d.boothOrder, [event.id]: order },
                };
              }, "攤位排序已儲存")
            }
          />
        )}
        {tab === "categories" && (
          <CategoriesPage
            categories={data.categories}
            theme={theme}
            onAdd={() => setEditor({ type: "category" })}
            onEdit={(item) => setEditor({ type: "category", item })}
            onDelete={(id) => {
              const count = data.items.filter(
                (i) => i.categoryId === id,
              ).length;
              if (
                confirm(
                  `刪除此共用分類？將影響 ${count} 項商品，商品會改為「未分類」，不會刪除。`,
                )
              )
                commit(
                  (d) => ({
                    ...d,
                    categories: d.categories.filter((c) => c.id !== id),
                    items: d.items.map((i) =>
                      i.categoryId === id ? { ...i, categoryId: null } : i,
                    ),
                  }),
                  "分類已刪除，商品已保留",
                );
            }}
          />
        )}
        {tab === "settings" && (
          <SettingsPage
            theme={theme}
            defaultBudget={data.defaultBudget}
            onOpenThemeSelector={() => setEditor({ type: "theme" })}
            onOpenBudgetModal={() => setEditor({ type: "budget" })}
            exporting={exporting}
            onExport={async () => {
              setExporting(true);
              setError("");
              try {
                await exportBackup(current.current);
              } catch (e) {
                setError(`備份匯出失敗：${e.message}`);
              } finally {
                setExporting(false);
              }
            }}
            onImport={selectBackup}
          />
        )}
      </main>
      <nav className="bottom-nav" aria-label="主要導覽">
        {[
          ["events", "場次", CalendarIcon],
          ["items", "清單", ShoppingCartIcon],
          ["categories", "分類", TagIcon],
          ["settings", "設定", SettingsIcon],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            disabled={busy}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
            style={{
              color: tab === id ? theme.text || theme.primary : undefined,
            }}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {editor?.type === "event" && (
        <EventEditor
          key={editor.item.id || "new"}
          {...common}
          event={editor.item}
          onSave={(item) =>
            saveAndClose(
              (d) => ({
                ...d,
                events: d.events.some((e) => e.id === item.id)
                  ? d.events.map((e) => (e.id === item.id ? item : e))
                  : [...d.events, item],
                currentEventId: d.currentEventId || item.id,
              }),
              "場次已儲存",
            )
          }
          onDelete={(id) =>
            saveAndClose((d) => {
              const events = d.events.filter((e) => e.id !== id),
                boothOrder = { ...d.boothOrder };
              delete boothOrder[id];
              return {
                ...d,
                events,
                boothOrder,
                booths: d.booths.filter((booth) => booth.eventId !== id),
                items: d.items.filter((i) => i.eventId !== id),
                currentEventId:
                  d.currentEventId === id
                    ? events[0]?.id || ""
                    : d.currentEventId,
              };
            }, "場次及其商品已刪除")
          }
        />
      )}
      {editor?.type === "booth" && (
        <BoothEditor
          key={editor.item.id}
          {...common}
          booth={editor.item}
          booths={data.booths}
          mode={editor.mode}
          onDelete={deleteBooth}
          onSave={(booth) =>
            saveAndClose(
              (d) => ({
                ...d,
                booths: d.booths.some((b) => b.id === booth.id)
                  ? d.booths.map((b) => (b.id === booth.id ? booth : b))
                  : [...d.booths, booth],
                events: d.events.map((e) => ({
                  ...e,
                  ...(e.markers
                    ? {
                        markers: e.markers.map((m) =>
                          m.boothId === booth.id
                            ? { ...m, boothNumber: booth.number || booth.name }
                            : m,
                        ),
                      }
                    : {}),
                })),
                boothOrder: {
                  ...d.boothOrder,
                  [booth.eventId]: [
                    ...new Set([
                      ...(d.boothOrder[booth.eventId] || []),
                      booth.id,
                    ]),
                  ],
                },
              }),
              "攤位已儲存",
            )
          }
        />
      )}
      {editor?.type === "product" && (
        <ProductEditor
          key={editor.item.id}
          {...common}
          item={editor.item}
          mode={editor.mode}
          categories={data.categories}
          booths={booths}
          onSave={(item) =>
            saveAndClose(
              (d) => ({
                ...d,
                items:
                  editor.mode === "edit"
                    ? d.items.map((i) => (i.id === item.id ? item : i))
                    : [...d.items, item],
              }),
              "商品已儲存",
            )
          }
          onDelete={(id) =>
            saveAndClose(
              (d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }),
              "商品已刪除",
            )
          }
        />
      )}
      {editor?.type === "category" && (
        <CategoryEditor
          {...common}
          category={editor.item}
          onSave={(item) =>
            saveAndClose(
              (d) => ({
                ...d,
                categories: editor.item
                  ? d.categories.map((c) => (c.id === item.id ? item : c))
                  : [...d.categories, item],
              }),
              editor.item ? "分類已更新" : "分類已新增",
            )
          }
        />
      )}
      {editor?.type === "budget" && (
        <BudgetEditor
          {...common}
          currentBudget={data.defaultBudget}
          onSave={(budget) =>
            saveAndClose(
              (d) => ({ ...d, defaultBudget: budget }),
              "預設預算已儲存",
            )
          }
        />
      )}
      {editor?.type === "theme" && (
        <ThemeSelector
          currentThemeId={data.themeId}
          onClose={common.onClose}
          onSelect={(id) =>
            saveAndClose((d) => ({ ...d, themeId: id }), "主題已套用")
          }
        />
      )}
      {preview && (
        <ImagePreview imageUrl={preview} onClose={() => setPreview(null)} />
      )}
      {mapOpen && event?.mapImageUrl && (
        <VenueMap
          theme={theme}
          imageUrl={event.mapImageUrl}
          eventId={event.id}
          markers={event.markers || []}
          onClose={() => setMapOpen(false)}
          onAddMarker={(marker) =>
            commit(
              (d) => ({
                ...d,
                events: d.events.map((e) =>
                  e.id === event.id
                    ? { ...e, markers: [...(e.markers || []), marker] }
                    : e,
                ),
              }),
              "標記已儲存",
            )
          }
          onRemoveMarker={(id) =>
            commit(
              (d) => ({
                ...d,
                events: d.events.map((e) =>
                  e.id === event.id
                    ? {
                        ...e,
                        markers: (e.markers || []).filter((m) => m.id !== id),
                      }
                    : e,
                ),
              }),
              "標記已刪除",
            )
          }
        />
      )}
      {restoring && (
        <Modal
          title="確認還原備份"
          busy={busy}
          onClose={() => setRestoring(null)}
        >
          <p>
            備份時間：{new Date(restoring.exportedAt).toLocaleString("zh-TW")}
          </p>
          <p className="restore-summary">
            {restoring.data.events.length} 場次・{restoring.data.items.length}{" "}
            商品・{restoring.data.booths.length} 攤位・
            {restoring.data.categories.length} 分類
          </p>
          <p>將取代目前所有清單、照片及設定，建議先匯出目前資料。</p>
          <div className="form-actions">
            <button
              disabled={busy}
              className="secondary-button"
              onClick={() => setRestoring(null)}
            >
              取消
            </button>
            <button
              disabled={busy}
              className="primary-button"
              onClick={async () => {
                if (await commit(() => restoring.data, "備份已還原")) {
                  setRestoring(null);
                  setEditor(null);
                  setPreview(null);
                  setMapOpen(false);
                  setTab("events");
                }
              }}
            >
              確認取代全部資料
            </button>
          </div>
        </Modal>
      )}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button aria-label="關閉錯誤提示" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {toast && (
        <div className="app-toast" role="status">
          <span>{toast.message}</span>
          {toast.undo && (
            <button disabled={busy} onClick={toast.undo}>
              復原
            </button>
          )}
        </div>
      )}
      {busy && (
        <div className="saving-shield" role="status" aria-live="polite">
          正在儲存…
        </div>
      )}
    </div>
  );
}

import {
  React,
  MapIcon,
  ReorderGroup,
  ExternalLinkIcon,
} from "../vendor/runtime.js";
import { BoothGroup } from "./BoothGroup.jsx";
import { UNASSIGNED } from "../lib/data.js";
import { BoothAddIcon, ProductAddIcon, FoldAllIcon } from "./Icons.jsx";
const boothName = (item) => item.boothId || UNASSIGNED;
export function ShoppingListPage({
  currentEvent,
  items,
  booths,
  categories,
  onAddBooth,
  onEditBooth,
  onToggleFavorite,
  onToggleSoldOut,
  onToggleStatus,
  onEdit,
  onAdd,
  onOpenMap,
  spent,
  boothOrder,
  onReorderBooths,
  onReorderItems,
  theme,
  onNavigateToEvents,
  onPreviewImage,
  busy,
}) {
  const [query, setQuery] = React.useState(""),
    [category, setCategory] = React.useState(""),
    [status, setStatus] = React.useState("all"),
    [sorting, setSorting] = React.useState(false),
    [collapsed, setCollapsed] = React.useState({});
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [draftItems, setDraftItems] = React.useState(items),
    [draftBooths, setDraftBooths] = React.useState(boothOrder);
  const itemRef = React.useRef(draftItems),
    itemBasis = React.useRef(items),
    boothRef = React.useRef(draftBooths),
    dragState = React.useRef({ active: null, suppressUntil: 0 });
  React.useEffect(() => {
    itemBasis.current = items;
    setDraftItems(items);
    itemRef.current = items;
  }, [items]);
  React.useEffect(() => {
    setDraftBooths(boothOrder);
    boothRef.current = boothOrder;
  }, [boothOrder]);
  React.useEffect(() => {
    if (
      category &&
      category !== "uncategorized" &&
      !categories.some((c) => c.id === category)
    )
      setCategory("");
  }, [categories, category]);
  const filtered =
    !!query.trim() || !!category || status !== "all" || favoritesOnly;
  const canSort = sorting && !filtered && !busy;
  React.useEffect(() => {
    if (filtered) setSorting(false);
  }, [filtered]);
  React.useEffect(() => {
    const reset = (event) => {
      if (event.type === "pointercancel" || event.type === "blur")
        dragState.current.cancelled = true;
      if (dragState.current.active) {
        dragState.current.active = null;
        dragState.current.suppressUntil = Date.now() + 450;
      }
    };
    window.addEventListener("pointerup", reset);
    window.addEventListener("pointercancel", reset, true);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("pointerup", reset);
      window.removeEventListener("pointercancel", reset, true);
      window.removeEventListener("blur", reset);
    };
  }, []);
  const boothLookup = new Map(booths.map((booth) => [booth.id, booth]));
  boothLookup.set(UNASSIGNED, {
    id: UNASSIGNED,
    name: "未指定攤位",
    number: "",
    virtual: true,
  });
  const search = query.trim().toLocaleLowerCase();
  const matchesBooth = (booth) =>
    `${booth.name} ${booth.number}`.toLocaleLowerCase().includes(search);
  const renderedItems = itemBasis.current === items ? draftItems : items;
  const visible = renderedItems.filter((item) => {
    const booth = boothLookup.get(boothName(item));
    return (
      (!search ||
        `${item.name} ${booth?.name || ""} ${booth?.number || ""}`
          .toLocaleLowerCase()
          .includes(search)) &&
      (!category ||
        (category === "uncategorized"
          ? !item.categoryId
          : item.categoryId === category)) &&
      (status === "all" || item.status === status) &&
      (!favoritesOnly || item.favorite)
    );
  });
  const groups = new Map();
  for (const booth of booths)
    if (
      !filtered ||
      (!category && status === "all" && !favoritesOnly && matchesBooth(booth))
    )
      groups.set(booth.id, []);
  visible.forEach((item) => {
    const id = boothName(item);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(item);
  });
  const order = [...new Set([...draftBooths, ...groups.keys()])].filter((id) =>
    groups.has(id),
  );
  const allCollapsed = order.length > 0 && order.every((id) => collapsed[id]);
  function toggleAllGroups() {
    setCollapsed(
      Object.fromEntries(
        [...booths.map((booth) => booth.id), UNASSIGNED].map((id) => [
          id,
          !allCollapsed,
        ]),
      ),
    );
  }
  function changeBooths(next) {
    if (!canSort) return;
    boothRef.current = next;
    setDraftBooths(next);
  }
  function changeItems(next, boothId) {
    if (!canSort) return;
    let index = 0;
    const updated = itemRef.current.map((i) =>
      boothName(i) === boothId ? next[index++] : i,
    );
    if (updated.some((i) => !i)) return;
    itemRef.current = updated;
    setDraftItems(updated);
  }
  async function saveItems(booth) {
    if (dragState.current.cancelled) {
      itemRef.current = items;
      setDraftItems(items);
      return;
    }
    const saved = await onReorderItems(
      itemRef.current.filter((i) => boothName(i) === booth),
      booth,
    );
    if (!saved) {
      itemRef.current = items;
      setDraftItems(items);
    }
  }
  async function saveBooths() {
    if (dragState.current.cancelled) {
      boothRef.current = boothOrder;
      setDraftBooths(boothOrder);
      return;
    }
    const saved = await onReorderBooths(
      boothRef.current.length ? boothRef.current : order,
    );
    if (!saved) {
      boothRef.current = boothOrder;
      setDraftBooths(boothOrder);
    }
  }
  if (!currentEvent)
    return (
      <section className="empty-state">
        <h2>尚未建立場次</h2>
        <p>先新增活動，再準備你的購物清單。</p>
        <button className="primary-button" onClick={onNavigateToEvents}>
          前往場次設定
        </button>
      </section>
    );
  const remaining = currentEvent.budget - spent;
  return (
    <section className="shopping-page">
      <header className="shopping-heading">
        <div>
          <p className="eyebrow">場次資訊</p>
          <h1>{currentEvent.name}</h1>
          {currentEvent.eventUrl && (
            <a
              className="event-site-link"
              href={currentEvent.eventUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon />
              活動網站
            </a>
          )}
        </div>
        <div className="inline-actions">
          {currentEvent.mapImageUrl && (
            <button
              className="icon-button white-button"
              aria-label="開啟場地地圖"
              onClick={onOpenMap}
            >
              <MapIcon />
            </button>
          )}
          <button
            className="icon-button header-add-button"
            aria-label="新增攤位"
            title="新增攤位"
            onClick={onAddBooth}
          >
            <BoothAddIcon />
          </button>
          <button
            className="icon-button header-add-button is-primary"
            aria-label="新增商品"
            title="新增商品"
            onClick={() => onAdd()}
          >
            <ProductAddIcon />
          </button>
        </div>
      </header>
      <div className="budget-grid">
        <div className="budget-card">
          <p className="eyebrow">總支出</p>
          <strong className={remaining < 0 ? "over-budget" : ""}>
            ${spent.toLocaleString()}
          </strong>
          <span className="muted">
            {" "}
            / ${currentEvent.budget.toLocaleString()}
          </span>
          <div className="budget-track">
            <div
              style={{
                width: `${Math.max(0, Math.min(100, (spent / (currentEvent.budget || 1)) * 100))}%`,
                background:
                  remaining < 0 ? theme.error || "#dc2626" : theme.primary,
              }}
            />
          </div>
        </div>
        <div className="remaining-card" style={{ background: theme.primary }}>
          <p>剩餘預算</p>
          <strong>${remaining.toLocaleString()}</strong>
          <small>{remaining < 0 ? "已超出預算" : "依全部已購商品計算"}</small>
        </div>
      </div>
      <div className="filter-panel">
        <label className="search-field">
          <span className="sr-only">搜尋商品或攤位</span>
          <input
            type="search"
            placeholder="搜尋商品、攤位名稱或號碼"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="filter-row">
          <label>
            <span className="sr-only">分類篩選</span>
            <select
              aria-label="分類篩選"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">全部分類</option>
              <option value="uncategorized">未分類</option>
              {categories.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">購買狀態篩選</span>
            <select
              aria-label="購買狀態篩選"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">全部狀態</option>
              <option value="pending">未購</option>
              <option value="purchased">已購</option>
              <option value="soldOut">完售</option>
            </select>
          </label>
        </div>
        <div className="filter-summary">
          <span>
            符合 {visible.length} / {items.length} 項商品
          </span>
          <button
            className={`text-button favorite-filter ${favoritesOnly ? "is-active" : ""}`}
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          >
            ★ 只看星號
          </button>
          {filtered && (
            <button
              className="text-button"
              onClick={() => {
                setQuery("");
                setCategory("");
                setStatus("all");
                setFavoritesOnly(false);
              }}
            >
              清除條件
            </button>
          )}
          <button
            className="text-button"
            disabled={filtered || busy || (!items.length && !booths.length)}
            aria-pressed={canSort}
            onClick={() => setSorting(!sorting)}
          >
            {canSort ? "結束排序" : "排序"}
          </button>
        </div>
        {filtered && (
          <p className="muted sorting-hint">清除搜尋與篩選條件後才能排序。</p>
        )}
        {canSort && (
          <p className="muted sorting-hint">
            僅拖曳把手可排序，其他區域仍可上下滑動。
          </p>
        )}
      </div>
      <div className="list-view-actions">
        <button
          className="text-button collapse-all-button"
          onClick={toggleAllGroups}
          disabled={!order.length || busy || canSort}
          aria-label={allCollapsed ? "全部展開" : "全部收合"}
        >
          <FoldAllIcon expanded={allCollapsed} />
          {allCollapsed ? "全部展開" : "全部收合"}
        </button>
      </div>
      {!order.length ? (
        <div className="empty-state">
          <h2>{filtered ? "沒有符合條件的商品" : "目前尚無攤位與商品"}</h2>
          <p>
            {filtered
              ? "試著調整搜尋或篩選條件。"
              : "使用右上角的攤位或商品按鈕新增項目。"}
          </p>
        </div>
      ) : (
        <ReorderGroup
          axis="y"
          values={order}
          onReorder={changeBooths}
          className="booth-list"
        >
          {order.map((boothId) => (
            <BoothGroup
              key={boothId}
              booth={boothLookup.get(boothId)}
              boothItems={groups.get(boothId)}
              categories={categories}
              expanded={!collapsed[boothId]}
              onToggle={() =>
                setCollapsed({ ...collapsed, [boothId]: !collapsed[boothId] })
              }
              onChangeItems={(next) => changeItems(next, boothId)}
              onSaveItems={() => saveItems(boothId)}
              onSaveBooths={saveBooths}
              onEdit={onEdit}
              onAddProduct={() =>
                onAdd(boothId === UNASSIGNED ? null : boothId)
              }
              onEditBooth={() => onEditBooth(boothLookup.get(boothId))}
              onToggleFavorite={onToggleFavorite}
              onToggleSoldOut={onToggleSoldOut}
              onToggleStatus={onToggleStatus}
              theme={theme}
              sorting={canSort}
              dragState={dragState}
              onPreviewImage={onPreviewImage}
            />
          ))}
        </ReorderGroup>
      )}
    </section>
  );
}

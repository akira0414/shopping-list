import {
  React,
  ReorderItem,
  useDragControls,
  LayoutGridIcon,
  ExternalLinkIcon,
} from "../vendor/runtime.js";
import { validWebUrl } from "../lib/data.js";
import { EditProductIcon } from "./Icons.jsx";
import { useTapGuard } from "../lib/useTapGuard.js";
export function ProductCard({
  item,
  category,
  theme,
  sorting,
  dragState,
  onToggleStatus,
  onToggleFavorite,
  onToggleSoldOut,
  onEdit,
  onPreviewImage,
  onDragEnd,
}) {
  const controls = useDragControls();
  const tap = useTapGuard(() => {
    if (!sorting) onToggleStatus(item.id);
  }, dragState);
  const favoriteTap = useTapGuard(() => {
    if (!sorting) onToggleFavorite(item.id);
  }, dragState);
  const soldOutTap = useTapGuard(() => {
    if (!sorting) onToggleSoldOut(item.id);
  }, dragState);
  const status = { pending: "未購", purchased: "已購", soldOut: "完售" }[
    item.status
  ];
  return (
    <ReorderItem
      value={item}
      dragListener={false}
      dragControls={controls}
      layout="position"
      className="product-card"
      data-item-id={item.id}
      style={{ touchAction: "pan-y" }}
      onDragStart={() => {
        dragState.current.active = `item:${item.id}`;
      }}
      onDragEnd={() => {
        dragState.current.active = null;
        dragState.current.suppressUntil = Date.now() + 450;
        onDragEnd();
      }}
    >
      <div
        className="product-stripe"
        style={{ backgroundColor: category?.color || "#9CA3AF" }}
        aria-hidden="true"
      />
      {sorting && (
        <button
          className="drag-handle"
          aria-label={`拖曳商品 ${item.name}`}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (!dragState.current.active) {
              dragState.current.cancelled = false;
              dragState.current.active = `item:${item.id}`;
              controls.start(e);
            }
          }}
          onPointerCancel={() => {
            dragState.current.active = null;
          }}
        >
          <LayoutGridIcon />
        </button>
      )}
      {item.imageUrl && (
        <button
          className="product-thumb"
          aria-label={`預覽圖片 ${item.name}`}
          disabled={sorting}
          onClick={() => onPreviewImage(item.imageUrl)}
        >
          <img src={item.imageUrl} alt={item.name} loading="lazy" />
        </button>
      )}
      <div className="product-body">
        <div className="product-title-row">
          <button
            type="button"
            className={`product-content ${item.status === "purchased" ? "is-purchased" : ""}`}
            disabled={sorting}
            aria-label={`${item.name}，${status}，點擊切換購買狀態`}
            {...tap}
          >
            <span className="product-name">{item.name}</span>
            <span className="product-meta">
              <strong className="product-price">
                ${item.price.toLocaleString()}
              </strong>
              <span className="product-category">
                {category?.name || "未分類"}
              </span>
              <span className={`status-tag status-${item.status}`}>
                {status}
              </span>
            </span>
          </button>
          <button
            className={`favorite-button ${item.favorite ? "is-favorite" : ""}`}
            aria-label={`${item.favorite ? "取消" : "加入"}星號 ${item.name}`}
            aria-pressed={item.favorite}
            disabled={sorting}
            {...favoriteTap}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill={item.favorite ? "currentColor" : "none"}
              stroke={item.favorite ? "#F8D985" : "#9CA3AF"}
              strokeWidth="1.8"
              strokeLinejoin="round"
            >
              <path d="m12 3 2.78 5.63L21 9.54l-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.93 1.06-6.2L3 9.54l6.22-.91Z" />
            </svg>
          </button>
          <button
            className="icon-button product-edit"
            aria-label={`編輯商品 ${item.name}`}
            disabled={sorting}
            onClick={() => onEdit(item)}
          >
            <EditProductIcon />
          </button>
        </div>
        <div className="item-actions">
          <button
            className={`sold-out-button ${item.status === "soldOut" ? "is-active" : ""}`}
            aria-label={`${item.status === "soldOut" ? "取消完售" : "標註完售"} ${item.name}`}
            aria-pressed={item.status === "soldOut"}
            disabled={sorting}
            {...soldOutTap}
          >
            {item.status === "soldOut" ? "取消完售" : "完售"}
          </button>
          {item.url?.trim() && validWebUrl(item.url) && (
            <a
              className="icon-button product-link"
              href={item.url.trim()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`開啟連結 ${item.name}`}
              onClick={(e) => {
                e.stopPropagation();
                if (sorting) e.preventDefault();
              }}
            >
              <ExternalLinkIcon />
            </a>
          )}
        </div>
      </div>
    </ReorderItem>
  );
}

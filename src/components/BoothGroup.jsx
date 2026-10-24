import {
  React,
  ReorderItem,
  ReorderGroup,
  useDragControls,
  LayoutGridIcon,
  PlusIcon,
  ChevronRightIcon,
  SettingsIcon,
  ExternalLinkIcon,
} from "../vendor/runtime.js";
import { ProductCard } from "./ProductCard.jsx";
import { useTapGuard } from "../lib/useTapGuard.js";
export function BoothGroup({
  booth,
  boothItems,
  categories,
  expanded,
  onToggle,
  onChangeItems,
  onSaveItems,
  onEdit,
  onAddProduct,
  onEditBooth,
  onToggleStatus,
  onToggleFavorite,
  onToggleSoldOut,
  theme,
  sorting,
  dragState,
  onSaveBooths,
  onPreviewImage,
}) {
  const controls = useDragControls();
  const label =
    booth.name +
    (booth.number && booth.number !== booth.name ? `（${booth.number}）` : "");
  const tap = useTapGuard(() => {
    if (!sorting) onToggle();
  }, dragState);
  return (
    <ReorderItem
      value={booth.id}
      dragListener={false}
      dragControls={controls}
      layout="position"
      className="booth-group"
      data-booth-id={booth.id}
      style={{ touchAction: "pan-y" }}
      onDragStart={() => {
        dragState.current.active = `booth:${booth.id}`;
      }}
      onDragEnd={() => {
        dragState.current.active = null;
        dragState.current.suppressUntil = Date.now() + 450;
        onSaveBooths();
      }}
    >
      <div className="booth-heading">
        {sorting && (
          <button
            className="drag-handle"
            aria-label={`拖曳攤位 ${label}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.pointerType === "mouse" && e.button !== 0) return;
              if (!dragState.current.active) {
                dragState.current.cancelled = false;
                dragState.current.active = `booth:${booth.id}`;
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
        {booth.imageUrl && (
          <button
            className="booth-photo"
            aria-label={`預覽攤位圖 ${label}`}
            disabled={sorting}
            onClick={() => onPreviewImage(booth.imageUrl)}
          >
            <img src={booth.imageUrl} alt={booth.name} loading="lazy" />
          </button>
        )}
        <button
          className="booth-toggle"
          aria-label={`展開或收合攤位 ${label}`}
          aria-expanded={expanded}
          {...tap}
        >
          {!booth.imageUrl && (
            <span
              className="booth-avatar"
              style={{ background: theme.primary }}
            >
              {(booth.number || booth.name).substring(0, 2)}
            </span>
          )}
          <span className="booth-title">
            <strong>{booth.name}</strong>
            <small>
              {booth.number && <span>{booth.number} · </span>}
              {
                boothItems.filter((item) => item.status === "purchased").length
              }{" "}
              / {boothItems.length} 已購入
            </small>
          </span>
          <ChevronRightIcon
            style={{ transform: expanded ? "rotate(90deg)" : undefined }}
          />
        </button>
        {!sorting && (
          <div className="booth-controls">
            {!booth.virtual && (
              <button
                className="icon-button"
                aria-label={`編輯攤位 ${label}`}
                onClick={onEditBooth}
              >
                <SettingsIcon />
              </button>
            )}
            <button
              className="icon-button"
              aria-label={`在 ${label} 新增商品`}
              onClick={onAddProduct}
            >
              <PlusIcon />
            </button>
          </div>
        )}
      </div>
      {expanded && (
        <>
          {(booth.notes || booth.url) && (
            <div className="booth-details">
              {booth.notes && <p>{booth.notes}</p>}
              {booth.url && (
                <a href={booth.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon />
                  {booth.linkLabel || "外部連結"}
                </a>
              )}
            </div>
          )}
          {boothItems.length ? (
            <ReorderGroup
              axis="y"
              values={boothItems}
              onReorder={onChangeItems}
              className="product-list"
            >
              {boothItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  category={categories.find((c) => c.id === item.categoryId)}
                  theme={theme}
                  sorting={sorting}
                  dragState={dragState}
                  onEdit={onEdit}
                  onToggleStatus={onToggleStatus}
                  onToggleFavorite={onToggleFavorite}
                  onToggleSoldOut={onToggleSoldOut}
                  onPreviewImage={onPreviewImage}
                  onDragEnd={onSaveItems}
                />
              ))}
            </ReorderGroup>
          ) : (
            <div className="booth-empty">
              <p>此攤位尚無商品</p>
              {!sorting && (
                <button className="text-button" onClick={onAddProduct}>
                  新增第一項商品
                </button>
              )}
            </div>
          )}
        </>
      )}
    </ReorderItem>
  );
}

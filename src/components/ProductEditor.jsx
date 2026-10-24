import { React } from "../vendor/runtime.js";
import { ImageUploadIcon } from "./Icons.jsx";
import { Modal, Field, Actions, useDirtyValue } from "./Forms.jsx";
import { validMoney, validWebUrl } from "../lib/data.js";
import { prepareImage } from "../lib/images.js";
export function ProductEditor({
  item,
  categories,
  booths,
  mode,
  onClose,
  onSave,
  onDelete,
  busy,
}) {
  const [form, setForm] = React.useState({
    ...item,
    price: String(item.price),
    imageUrl: item.imageUrl || "",
    url: item.url || "",
  });
  const [processing, setProcessing] = React.useState(false),
    [imageError, setImageError] = React.useState(""),
    [imageUrlOpen, setImageUrlOpen] = React.useState(false),
    [touched, setTouched] = React.useState(false);
  const generation = React.useRef(0);
  React.useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const update = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const errors = {
    name: !form.name.trim() ? "請填寫商品名稱" : "",
    price: !validMoney(form.price) ? "請輸入有效的非負價格" : "",
    url: validWebUrl(form.url) ? "" : "請輸入 http:// 或 https:// 網址",
  };
  async function selectImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const token = ++generation.current;
    setProcessing(true);
    setImageError("");
    try {
      const imageUrl = await prepareImage(file);
      if (generation.current === token)
        setForm((prev) => ({ ...prev, imageUrl }));
    } catch (error) {
      if (generation.current === token) setImageError(error.message);
    } finally {
      if (generation.current === token) setProcessing(false);
    }
  }
  const dirty = useDirtyValue(form);
  return (
    <Modal
      dirty={dirty}
      title={mode === "new" ? "新增商品" : "編輯商品"}
      busy={busy || processing}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setTouched(true);
          if (processing || Object.values(errors).some(Boolean)) return;
          await onSave({
            ...form,
            name: form.name.trim(),
            url: form.url.trim(),
            boothId: form.boothId || null,
            price: Number(form.price),
            categoryId: form.categoryId || null,
          });
        }}
      >
        <div className="image-editor">
          <label
            className={`product-image-picker ${processing ? "is-processing" : ""}`}
          >
            <input
              type="file"
              aria-label="選擇手機照片"
              accept="image/jpeg,image/png,image/webp"
              onChange={selectImage}
              disabled={busy || processing}
            />
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="商品圖片預覽"
                onError={() =>
                  setImageError("圖片無法顯示，請更換圖片或檢查網址")
                }
              />
            ) : (
              <ImageUploadIcon />
            )}
            <strong>
              {processing
                ? "正在處理圖片…"
                : form.imageUrl
                  ? "點此更換商品圖片"
                  : "點此上傳商品圖片"}
            </strong>
            <span>從相簿或檔案選擇 · JPEG、PNG、WebP</span>
          </label>
          <div className="inline-actions">
            <button
              type="button"
              className="text-button"
              disabled={processing}
              onClick={() => setImageUrlOpen(!imageUrlOpen)}
            >
              貼上圖片網址
            </button>
            {form.imageUrl && (
              <button
                type="button"
                className="text-button"
                disabled={processing || busy}
                onClick={() => {
                  setForm({ ...form, imageUrl: "" });
                  setImageError("");
                }}
              >
                移除圖片
              </button>
            )}
          </div>
          {imageUrlOpen && (
            <Field label="圖片網址">
              <input
                name="imageUrl"
                value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                placeholder="https://..."
                disabled={processing}
                onChange={(e) => {
                  update(e);
                  setImageError("");
                }}
              />
            </Field>
          )}
          {processing && <p role="status">正在縮圖與壓縮，請稍候…</p>}
          {imageError && (
            <p role="alert" className="field-error">
              {imageError}
            </p>
          )}
        </div>
        <Field label="商品名稱" error={touched && errors.name}>
          <input
            name="name"
            value={form.name}
            onChange={update}
            placeholder="例如：新刊 A"
          />
        </Field>
        <Field label="所屬攤位">
          <select name="boothId" value={form.boothId || ""} onChange={update}>
            <option value="">未指定攤位</option>
            {booths.map((booth) => (
              <option key={booth.id} value={booth.id}>
                {booth.name}
                {booth.number ? `（${booth.number}）` : ""}
              </option>
            ))}
          </select>
        </Field>
        {!booths.length && (
          <p className="muted">
            目前沒有攤位，可先儲存商品，再從右上角新增攤位。
          </p>
        )}
        <Field label="價格" error={touched && errors.price}>
          <input
            name="price"
            type="number"
            min="0"
            step="any"
            value={form.price}
            onChange={update}
          />
        </Field>
        <Field label="分類">
          <select
            name="categoryId"
            value={form.categoryId || ""}
            onChange={update}
          >
            <option value="">未分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="購買狀態">
          <select name="status" value={form.status} onChange={update}>
            <option value="pending">未購</option>
            <option value="purchased">已購</option>
            <option value="soldOut">完售</option>
          </select>
        </Field>
        <Field label="外部連結 (URL)" error={touched && errors.url}>
          <input
            name="url"
            value={form.url}
            onChange={update}
            placeholder="https://..."
          />
        </Field>
        {mode === "edit" && (
          <button
            type="button"
            disabled={busy || processing}
            className="danger-button"
            onClick={() => {
              if (confirm(`確定刪除「${item.name}」？`)) onDelete(item.id);
            }}
          >
            刪除商品
          </button>
        )}
        <Actions
          busy={busy || processing}
          disabled={processing}
          onClose={onClose}
          label="儲存商品"
        />
      </form>
    </Modal>
  );
}

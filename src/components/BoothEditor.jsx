import { React } from "../vendor/runtime.js";
import { Modal, Field, Actions, useDirtyValue } from "./Forms.jsx";
import { prepareImage } from "../lib/images.js";
import { normalizeBoothNumber, validWebUrl } from "../lib/data.js";
export function BoothEditor({
  booth,
  booths,
  onSave,
  onDelete,
  onClose,
  busy,
  mode,
}) {
  const [form, setForm] = React.useState({ ...booth });
  const [touched, setTouched] = React.useState(false),
    [processing, setProcessing] = React.useState(false),
    [imageError, setImageError] = React.useState(""),
    [showImageUrl, setShowImageUrl] = React.useState(false);
  const generation = React.useRef(0);
  React.useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const change = (e) =>
    setForm((previous) => ({ ...previous, [e.target.name]: e.target.value }));
  const errors = {
    name: form.name.trim() ? "" : "請填寫攤位名稱",
    number:
      form.number.trim() &&
      booths.some(
        (other) =>
          other.id !== form.id &&
          other.eventId === form.eventId &&
          normalizeBoothNumber(other.number) ===
            normalizeBoothNumber(form.number),
      )
        ? "同一場次已有此攤位號碼"
        : "",
    url: form.url.trim()
      ? !validWebUrl(form.url)
        ? "請輸入 http:// 或 https:// 網址"
        : ""
      : form.linkLabel.trim()
        ? "填寫連結名稱後，請補上網址"
        : "",
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
        setForm((previous) => ({ ...previous, imageUrl }));
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
      title={mode === "new" ? "新增攤位" : "編輯攤位"}
      onClose={onClose}
      busy={busy || processing}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!processing && !Object.values(errors).some(Boolean))
            onSave({
              ...form,
              name: form.name.trim(),
              number: normalizeBoothNumber(form.number),
              linkLabel: form.linkLabel.trim(),
              url: form.url.trim(),
              notes: form.notes.trim(),
            });
        }}
      >
        <div className="image-editor">
          {form.imageUrl ? (
            <img
              src={form.imageUrl}
              alt="攤位圖片預覽"
              onError={() =>
                setImageError("圖片無法顯示，請更換圖片或檢查網址")
              }
            />
          ) : (
            <div className="image-placeholder">攤位圖（選填）</div>
          )}
          <label className="secondary-button file-button">
            {processing ? "圖片處理中…" : "上傳攤位圖"}
            <input
              type="file"
              aria-label="上傳攤位圖"
              accept="image/jpeg,image/png,image/webp"
              onChange={selectImage}
              disabled={busy || processing}
            />
          </label>
          <div className="inline-actions">
            <button
              type="button"
              className="text-button"
              disabled={processing}
              onClick={() => setShowImageUrl(!showImageUrl)}
            >
              使用圖片網址
            </button>
            {form.imageUrl && (
              <button
                type="button"
                className="text-button"
                disabled={busy || processing}
                onClick={() => {
                  setForm({ ...form, imageUrl: "" });
                  setImageError("");
                }}
              >
                移除攤位圖
              </button>
            )}
          </div>
          {showImageUrl && (
            <Field label="攤位圖片網址">
              <input
                name="imageUrl"
                placeholder="https://..."
                value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                onChange={(e) => {
                  change(e);
                  setImageError("");
                }}
              />
            </Field>
          )}
          {processing && <p role="status">正在縮圖與壓縮，請稍候…</p>}
          {imageError && (
            <p className="field-error" role="alert">
              {imageError}
            </p>
          )}
        </div>
        <Field label="攤位名稱" error={touched && errors.name}>
          <input
            name="name"
            placeholder="例如：晴空創作社"
            value={form.name}
            onChange={change}
          />
        </Field>
        <Field label="攤位號碼（選填）" error={touched && errors.number}>
          <input
            name="number"
            placeholder="例如：A01"
            value={form.number}
            onChange={change}
          />
        </Field>
        <Field label="連結名稱（選填）">
          <input
            name="linkLabel"
            placeholder="例如：攤位社群、通販頁"
            value={form.linkLabel}
            onChange={change}
          />
        </Field>
        <Field label="外部連結 (URL)" error={touched && errors.url}>
          <input
            name="url"
            type="url"
            placeholder="https://..."
            value={form.url}
            onChange={change}
          />
        </Field>
        <Field label="備註（選填）">
          <textarea
            name="notes"
            rows={4}
            placeholder="例如：預購取貨、攤位開放時間"
            value={form.notes}
            onChange={change}
          />
        </Field>
        {mode === "edit" && (
          <button
            type="button"
            className="danger-button"
            disabled={busy || processing}
            onClick={() => onDelete(booth.id)}
          >
            刪除攤位
          </button>
        )}
        <Actions onClose={onClose} busy={busy || processing} label="儲存攤位" />
      </form>
    </Modal>
  );
}

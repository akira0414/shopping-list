import { React } from "../vendor/runtime.js";
import { createId } from "../lib/createId.js";
import { validMoney, validWebUrl } from "../lib/data.js";
import { Modal, Field, Actions, useDirtyValue } from "./Forms.jsx";
export function EventEditor({ event, onClose, onSave, onDelete, busy }) {
  const [form, setForm] = React.useState({
    ...event,
    budget: String(event.budget),
    mapImageUrl: event.mapImageUrl || "",
    eventUrl: event.eventUrl || "",
  });
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const errors = {
    name: !form.name.trim() ? "請填寫場次名稱" : "",
    budget: !validMoney(form.budget) ? "請輸入有效的非負預算" : "",
    eventUrl: validWebUrl(form.eventUrl)
      ? ""
      : "請輸入 http:// 或 https:// 活動網址",
  };
  const [touched, setTouched] = React.useState(false);
  const dirty = useDirtyValue(form);
  return (
    <Modal
      dirty={dirty}
      title={event.id ? "編輯場次" : "新增場次"}
      busy={busy}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setTouched(true);
          if (Object.values(errors).some(Boolean)) return;
          await onSave({
            ...form,
            id: event.id || createId(),
            name: form.name.trim(),
            budget: Number(form.budget),
            eventUrl: form.eventUrl.trim(),
          });
        }}
        noValidate
      >
        <Field label="場次名稱" error={touched && errors.name}>
          <input
            autoFocus
            name="name"
            value={form.name}
            onChange={update}
            placeholder="例如：CWT-66"
          />
        </Field>
        <Field label="日期">
          <input type="date" name="date" value={form.date} onChange={update} />
        </Field>
        <Field label="地點">
          <input
            name="location"
            value={form.location}
            onChange={update}
            placeholder="例如：台大體育館"
          />
        </Field>
        <Field label="活動網址（選填）" error={touched && errors.eventUrl}>
          <input
            type="url"
            name="eventUrl"
            value={form.eventUrl}
            onChange={update}
            placeholder="https://活動官方網站"
          />
        </Field>
        <Field label="預算" error={touched && errors.budget}>
          <input
            type="number"
            min="0"
            step="any"
            name="budget"
            value={form.budget}
            onChange={update}
          />
        </Field>
        <Field label="地圖圖片網址 (URL)">
          <input
            name="mapImageUrl"
            value={form.mapImageUrl}
            onChange={update}
            placeholder="https://..."
          />
        </Field>
        {event.id && (
          <button
            className="danger-button"
            type="button"
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "確定刪除此場次及其全部商品、地圖標記與排序？所有場次共用的分類會保留。",
                )
              )
                onDelete(event.id);
            }}
          >
            刪除場次
          </button>
        )}
        <Actions busy={busy} onClose={onClose} label="儲存場次" />
      </form>
    </Modal>
  );
}

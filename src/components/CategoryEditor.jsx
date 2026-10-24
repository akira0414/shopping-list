import { React } from "../vendor/runtime.js";
import { CATEGORY_COLORS } from "../config/themes.js";
import { createId } from "../lib/createId.js";
import { Modal, Field, Actions, useDirtyValue } from "./Forms.jsx";
export function CategoryEditor({ category, onClose, onSave, busy }) {
  const [name, setName] = React.useState(category?.name || ""),
    [color, setColor] = React.useState(category?.color || CATEGORY_COLORS[0]),
    [touched, setTouched] = React.useState(false);
  const dirty = useDirtyValue({ name, color });
  return (
    <Modal
      dirty={dirty}
      title={category ? "編輯分類" : "新增分類"}
      busy={busy}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (name.trim())
            onSave({
              ...category,
              id: category?.id || createId(),
              name: name.trim(),
              color,
            });
        }}
      >
        <Field
          label="分類名稱"
          error={touched && !name.trim() ? "請填寫分類名稱" : ""}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="分類名稱"
          />
        </Field>
        <div className="color-options">
          {CATEGORY_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              aria-label={`分類顏色 ${c}`}
              aria-pressed={color === c}
              style={{
                background: c,
                outline:
                  color === c
                    ? "3px solid var(--app-selection-outline, #333)"
                    : "none",
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <Actions onClose={onClose} busy={busy} label="儲存分類" />
      </form>
    </Modal>
  );
}

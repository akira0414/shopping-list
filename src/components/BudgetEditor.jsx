import { React } from "../vendor/runtime.js";
import { validMoney } from "../lib/data.js";
import { Modal, Field, Actions, useDirtyValue } from "./Forms.jsx";
export function BudgetEditor({ currentBudget, onSave, onClose, busy }) {
  const [budget, setBudget] = React.useState(String(currentBudget)),
    [touched, setTouched] = React.useState(false);
  const dirty = useDirtyValue(budget);
  return (
    <Modal dirty={dirty} title="設定預設預算" onClose={onClose} busy={busy}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (validMoney(budget)) onSave(Number(budget));
        }}
      >
        <p className="muted">此金額只作為新場次的初始預算。</p>
        <Field
          label="預設預算"
          error={touched && !validMoney(budget) ? "請輸入有效的非負預算" : ""}
        >
          <input
            type="number"
            min="0"
            step="any"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </Field>
        <Actions onClose={onClose} busy={busy} label="儲存變更" />
      </form>
    </Modal>
  );
}

import { React, CloseIcon } from "../vendor/runtime.js";
import { useDialogFocus } from "../lib/useDialogFocus.js";
const DismissContext = React.createContext(null);
export function useDirtyValue(value) {
  const initial = React.useRef(JSON.stringify(value));
  return initial.current !== JSON.stringify(value);
}
export function Modal({
  title,
  onClose,
  children,
  busy = false,
  dirty = false,
}) {
  const ref = React.useRef(null),
    overlay = React.useRef(null);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const continueRef = React.useRef(null),
    previousField = React.useRef(null);
  const requestClose = () => {
    if (busy || confirmDiscard) return;
    if (dirty) {
      previousField.current = document.activeElement;
      setConfirmDiscard(true);
    } else onClose();
  };
  const continueEditing = () => setConfirmDiscard(false);
  React.useEffect(() => {
    if (confirmDiscard) continueRef.current?.focus();
    else if (previousField.current?.isConnected) {
      previousField.current.focus({ preventScroll: true });
      previousField.current = null;
    }
  }, [confirmDiscard]);
  useDialogFocus(ref, overlay, () => {
    if (busy) return;
    if (confirmDiscard) continueEditing();
    else requestClose();
  });
  return (
    <div
      ref={overlay}
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <section
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-label={confirmDiscard ? "尚有未儲存的變更" : title}
        tabIndex={-1}
        ref={ref}
      >
        {confirmDiscard && (
          <div className="discard-confirmation">
            <h2>尚有未儲存的變更</h2>
            <p>離開將捨棄這次尚未儲存的內容。</p>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                ref={continueRef}
                onClick={continueEditing}
              >
                繼續編輯
              </button>
              <button type="button" className="danger-button" onClick={onClose}>
                捨棄變更
              </button>
            </div>
          </div>
        )}
        <div hidden={confirmDiscard}>
          <header className="modal-heading">
            <h2>{title}</h2>
            <button
              type="button"
              className="icon-button"
              aria-label="關閉視窗"
              disabled={busy}
              onClick={requestClose}
            >
              <CloseIcon />
            </button>
          </header>
          <DismissContext.Provider value={requestClose}>
            {children}
          </DismissContext.Provider>
        </div>
      </section>
    </div>
  );
}
export function Field({ label, error, children }) {
  const generatedId = React.useId();
  const id = children.props.id || generatedId;
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {React.cloneElement(children, {
        id,
        "aria-invalid": !!error,
        "aria-describedby": error ? `${id}-error` : undefined,
      })}
      {error && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
export function Actions({ busy, onClose, label = "儲存", disabled = false }) {
  const dismiss = React.useContext(DismissContext);
  return (
    <footer className="form-actions">
      <button
        type="button"
        className="secondary-button"
        onClick={dismiss || onClose}
        disabled={busy}
      >
        取消
      </button>
      <button
        type="submit"
        className="primary-button"
        disabled={busy || disabled}
      >
        {busy ? "儲存中…" : label}
      </button>
    </footer>
  );
}

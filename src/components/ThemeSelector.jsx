import { React } from "../vendor/runtime.js";
import { THEMES } from "../config/themes.js";
import { Modal } from "./Forms.jsx";
export function ThemeSelector({ currentThemeId, onSelect, onClose }) {
  return (
    <Modal title="選擇顏色主題" onClose={onClose}>
      <div className="theme-options">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            aria-pressed={currentThemeId === theme.id}
            className="theme-option"
            style={{
              borderColor:
                currentThemeId === theme.id ? theme.primary : undefined,
            }}
            onClick={() => onSelect(theme.id)}
          >
            <span className="theme-swatches">
              {[theme.primary, theme.secondary, theme.background].map(
                (color) => (
                  <span key={color} style={{ backgroundColor: color }} />
                ),
              )}
            </span>
            <span>{theme.name}</span>
          </button>
        ))}
      </div>
      <p className="muted">選擇主題後立即套用，資料儲存後保留。</p>
    </Modal>
  );
}

import {
  React,
  SettingsIcon,
  WalletIcon,
  ChevronRightIcon,
} from "../vendor/runtime.js";
import { getAppInfo } from "../lib/appInfo.js";
import { APP_NAME } from "../lib/data.js";
export function SettingsPage({
  theme,
  defaultBudget,
  onOpenThemeSelector,
  onOpenBudgetModal,
  onExport,
  onImport,
  exporting,
}) {
  const [appInfo, setAppInfo] = React.useState(null);
  const [versionError, setVersionError] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    getAppInfo()
      .then((info) => {
        if (active) setAppInfo(info);
      })
      .catch(() => {
        if (active) setVersionError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="settings-page">
      <h1>設定</h1>
      <div className="settings-card">
        <button onClick={onOpenBudgetModal}>
          <WalletIcon />
          <span>
            預設預算金額<small>新場次的初始預算</small>
          </span>
          <strong style={{ color: theme.text || theme.primary }}>
            ${defaultBudget.toLocaleString()}
          </strong>
          <ChevronRightIcon />
        </button>
        <button onClick={onOpenThemeSelector}>
          <SettingsIcon />
          <span>
            顏色主題<small>{theme.name}</small>
          </span>
          <ChevronRightIcon />
        </button>
      </div>
      <div className="settings-card backup-card">
        <h2>備份與還原</h2>
        <p className="muted">
          包含所有場次、商品、上傳照片及設定。網址圖片不會轉存離線圖片。
        </p>
        <button
          className="primary-button"
          disabled={exporting}
          onClick={onExport}
        >
          {exporting ? "正在匯出…" : "匯出完整備份"}
        </button>
        <label className="secondary-button file-button">
          選擇備份還原
          <input
            type="file"
            aria-label="選擇備份還原"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              onImport(file);
            }}
          />
        </label>
        <small>還原前會顯示摘要並確認；還原將取代全部資料。</small>
      </div>
      <div className="settings-card about-card">
        <h2>{APP_NAME}</h2>
        <p className="app-version" aria-live="polite">
          {appInfo
            ? `版本 ${appInfo.version}（${appInfo.platform === "web" ? "網頁版" : `建置 ${appInfo.build}`}）`
            : versionError
              ? "無法取得版本資訊，請重新開啟設定頁"
              : "正在讀取版本資訊…"}
        </p>
        <p className="muted">單機使用・資料保存在此裝置</p>
      </div>
    </section>
  );
}

# 1.3.0 驗證紀錄

驗證日期：2026-10-24。測試資料均為合成資料；瀏覽器測試使用獨立環境，Android 使用唯讀模式啟動的 Pixel 9a / Android 16 模擬器，沒有操作原手機資料。

## 已通過

| 範圍 | 結果與證據 |
|---|---|
| 資料單元測試 | 5 組通過；包含完整備份往返、不完整／重複排序拒絕、錯誤備份、舊關聯修復及資料驗證。`unit-results.txt` |
| 開發版瀏覽器流程 | 12 組通過。100 筆商品、搜尋／篩選交集、預算、購買與復原、五種主題色條、照片、失敗重試、分類刪除、備份及切換場次。`e2e-log.txt` |
| 正式建置瀏覽器流程 | 同一套 12 組流程對 Vite preview 正式產物執行通過，無未捕捉例外。`production-e2e-log.txt`、`browser-results.json` |
| 失敗與手勢測試 | 5 組通過。損壞 localStorage 不覆寫空資料、搬移失敗重試、IndexedDB transaction abort 保留舊資料、JPEG/WebP/透明 PNG、排序模式捲動／邊緣自動捲動／取消恢復。`resilience-results.json` |
| Android 編譯 | `:app:assembleDebug` 成功。版本 1.3.0 / code 2、套件 ID 未變。`android-build-log.txt` |
| Android 圖示測試 | 3 項通過：一般／圓形 adaptive icon 均有 monochrome；彩色與單色輪廓一致；圖案完整落在安全圓內；套件名稱符合。`android-icon-tests.xml` |
| Android 原生照片 | 從系統照片選擇器選擇 7,211,468 bytes 直向 PNG，縮為 960×1600，保存後重新開啟仍顯示。`android-photo-saved.png` |
| Android 備份還原 | 系統分享視窗成功開啟；快取 JSON 含完整資料與上傳照片；透過 DocumentsUI → Downloads 選取檔案，摘要確認後還原資料逐欄一致，照片仍能顯示。`android-share.png`、`android-restore-confirm.png`、`android-photo-restored.png` |
| Android 桌面圖示 | Pixel Launcher 實際顯示「場購清單」與購物袋勾選圖案。啟用主題圖示後，淺色與深色模式有不同系統著色。`android-themed-light.png`、`android-themed-dark.png` |

## 重要測試發現與修正

- 原 APK 解包資源帶有 `-v4` 目錄，與原始 Android 資源重複；已移到 `recovery/original-res/` 保留，修復資源合併錯誤。
- Android 的 `drawable-v24` 預設圖示會覆蓋新 foreground；已同步替換，並以 instrumentation 比對 foreground 與 monochrome 輪廓。
- 圖示首次安全區域測試發現邊角過近，已等比縮至 88%，再次測試通過。
- 初次照片測試時，關閉偵錯連線干擾原生選擇器回傳；調整為同次連線完成選取後，原生大照片保存與重開測試通過。測試工具不再對原生 WebView 發送 Browser.close。

## 尚未實測的範圍

- 其他品牌實體手機、Android 7～15、不同版本 WebView 與第三方啟動器。
- 更換不同桌布／系統色盤後的完整圖示矩陣；目前已驗證同一色盤下淺深色自動上色，以及安全區域適合不同遮罩。
- 使用原簽章覆蓋安裝原 APK；沒有原私有金鑰，交付的是測試簽章 APK。
- Android 系統分享的所有外部接收 App；實測確認系統分享視窗及其完整備份檔案，沒有向任何外部對象傳送資料。

已使用 Android `apksigner verify --print-certs` 比對原／新 APK：兩者皆為 Android Debug 憑證，但 SHA-256 指紋不同，不能直接覆蓋安裝。

- 原 APK：`eecfacb8b41c561cf55aa7ed077808fc29cb8b5c1f92ad55ccb391a1f47e7482`
- 新 APK：`4d1a0cdddee0d06bb42139331a93d9720d06f20c55ca7ddf63ac3ec033327158`

## 手動重測原生流程

1. 在可拋棄的模擬器安裝 debug APK，新增場次與商品。
2. 透過「選擇手機照片」選擇大於 2 MB 的 JPEG／PNG／WebP，確認預覽、儲存與重開後縮圖。
3. 設定 → 匯出完整備份，確認系統分享視窗；取消不得改變資料。
4. 將備份另存到可選擇的位置，設定 → 選擇備份還原，選檔後先確認摘要，再測試取消與確認取代。
5. 把 App 放到桌面，啟動器開啟主題圖示，切換淺深色並觀察系統上色。檢查主題未開啟時的彩色圖示。

`recovery/verification.json` 為首次 APK 還原的歷史基準；本目錄才是 1.3.0 的驗證紀錄。

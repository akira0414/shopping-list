# shopping-list · 場購清單

由 `doujin-shopping-list.apk` 還原並改善的個人單機購物清單。使用 React、Vite、Capacitor 8，套件 ID 保持 `com.doujin.shoppinglist`。

## 啟動與建置

需要 Node.js 22.12 以上（建議 24 LTS）。在專案目錄執行：

```powershell
npm install
npm run dev
```

開啟終端機顯示的網址，通常為 `http://127.0.0.1:5173/`。修改原始碼會自動更新預覽。

```powershell
npm run build
npm run preview
```

`dist/` 是完整網頁產物，包含本機字型、圖示與授權檔；必須透過 HTTP 伺服器開啟，不能直接雙擊 HTML。網站資料依網址來源分開保存，`localhost` 與 `127.0.0.1` 不共用資料。

## 這一版的功能

- 「只看星號」一般與選取狀態文字均為 `#B58900`，選取時深棕底 `#4A3B24`、金色框 `#F8D985`。商品實心星星仍為 `#F8D985`，空心為灰框。
- 全部收合／展開使用向量圖示，對齊文字；商品編輯改用鉛筆，與星星同列對齊。

- 場次新增／編輯可填活動網址（http／https），場次卡片及清單可開啟活動網站，備份一併保留。
- 清單可全部收合／展開；商品名稱、價格、分類及狀態分層顯示，星號放在名稱旁。
- 商品選圖改為整塊可點選的上傳區，顯示格式提示及換圖預覽。

- 全站隱藏捲軸，保留滑動、滾輪及鍵盤捲動；場次卡片的設定按鈕改成透明無陰影。
- 右上角分別提供「新增攤位」與「新增商品」圖示按鈕。攤位可先建立為空攤位，包含圖片、名稱、號碼、連結名稱、外部 URL 及備註。
- 商品以固定攤位 ID 關聯，改名稱或號碼不會拆散商品；同場次的非空攤位號碼不可重複（不區分大小寫及全形／半形）。
- 每項商品可切換灰框空心／實心 `#F8D985` 星星，並使用「只看星號」篩選；星號不影響購買狀態或預算。
- 清單可直接標註／取消完售，支援五秒復原。取消完售回到未購，復原則回到該次操作前的狀態。
- 新增「暖陽黃」，排列在賽博龐克前；主色 `#F2C14E`、輔色 `#F8D985`、背景 `#FFF8E7`，按鈕與強調文字採深色。
- 攤位刪除先確認影響數量，保留商品與星號並移到「未指定攤位」；刪除場次則刪除該場次的攤位與商品。
- 資料／備份格式升為 2，支援舊 localStorage、1.3 IndexedDB 及格式 1 備份；舊版 App 無法匯入新版格式 2 備份。
- IndexedDB 搬移成功時，同一交易保留 `pre-v2` 原始快照；搬移失敗時不覆寫原資料。以下既有功能繼續保留。

- IndexedDB 交易儲存，首次自動搬移舊 localStorage，保留舊資料；失敗不顯示假成功。
- 完整 JSON 備份及確認後取代式還原，包含照片、場次、商品、共用分類、排序、地圖標記及設定。
- 商品／攤位搜尋、分類與未購／已購／完售篩選；預算統計不隨篩選改變。
- 點商品文字切換未購／已購，五秒內可復原；完售可經專用按鈕或編輯修改。
- 搜尋／篩選時禁止排序；排序模式僅把手可拖曳，保留上下捲動，防止滑動誤改購買狀態。
- 手機 JPEG、PNG、WebP 選圖，最長邊縮至 1600 像素；PNG 保留透明度，JPEG／WebP 以 JPEG 重新壓縮。HEIC 需先轉換。保留原圖直到新圖成功處理。
- 商品左側色條使用分類色，未分類為灰色；已購與完售以內容／標籤區分。商品及攤位圖片採 contain 完整顯示。
- 名稱與金額驗證、刪除確認、分類解除關聯及下拉箭頭間距。
- 名稱「場購清單」、購物袋勾選圖示，以及 Android 13+ 主題圖示。

外部圖片與地圖網址仍需連線，備份會保留網址，不會自動下載成離線圖片。手機 App 與電腦瀏覽器不會自動同步；透過匯出與還原搬移資料。帳號、雲端同步、商品數量及路線規劃不在此版範圍。

## 修改位置

| 修改內容 | 位置 |
|---|---|
| 資料狀態、交易後更新、購買復原、場次／分類操作 | `src/App.jsx` |
| 搜尋、篩選、拖曳排序 | `src/components/ShoppingListPage.jsx`、`BoothGroup.jsx`、`ProductCard.jsx` |
| 攤位、商品、場次、分類、預算表單 | `src/components/*Editor.jsx`、`Forms.jsx` |
| 設定、備份操作 | `src/components/SettingsPage.jsx` |
| 資料驗證、備份格式、排序保護 | `src/lib/data.js` |
| IndexedDB 與舊資料搬移 | `src/lib/storage.js` |
| 圖片處理、原生／網頁備份匯出 | `src/lib/images.js`、`backup.js` |
| 地圖及圖片預覽 | `src/components/VenueMap.jsx`、`ImagePreview.jsx` |
| 配色與外觀 | `src/config/themes.js`、`src/styles.css` |
| 網頁圖示原稿 | `assets/icon.svg`、`public/icon.svg` |
| 原生圖示 | `android/app/src/main/res/drawable/ic_launcher_*.xml`、`drawable-v24/ic_launcher_foreground.xml`、`mipmap-anydpi-v26/`、`mipmap-anydpi-v33/` |
| App 名稱與版本 | `capacitor.config.json`、`src/lib/data.js`、`android/app/src/main/res/values/strings.xml`、`android/app/build.gradle` |

CSS 前半保留 APK 已編譯樣式，後半為本次可編輯樣式；沒有 Tailwind 建置流程，新工具類別不會自動生成。新增樣式請寫一般 CSS。

`src/vendor/runtime.js` 保留 APK 原有 React、動畫與圖示程式及其授權註記。不要再混入第二份 React；新增依賴 React 的 UI 套件前應先遷移共用 runtime。部分尚未改寫的區域變數仍是壓縮名稱。

## 字型與圖示

全站使用 [justfont「jf open 粉圓」2.1](https://github.com/justfont/open-huninn-font)，字型與 OFL 授權存於 `public/fonts/`，可隨網頁及 APK 離線使用。

啟動圖示為「購物袋＋勾選」，彩色版為預設藍色與白色圖案。Android 13+ 提供 monochrome 圖層，顏色由支援主題圖示的啟動器依使用者桌布／色盤決定；需在啟動器啟用主題圖示。App 內的六種主題不會直接改變桌面圖示顏色。

## Android

需要 Android Studio、SDK 36 及 JDK 21 以上（可用 Android Studio 內建 JDK）。

```powershell
npm run android:sync
npm run android:open
```

或在已設定 JAVA_HOME、ANDROID_HOME 的終端機：

```powershell
cd android
.\gradlew.bat :app:assembleDebug
.\gradlew.bat :app:connectedDebugAndroidTest
```

自行編譯後，APK 位於 `android/app/build/outputs/apk/debug/app-debug.apk`。原始碼 versionName 為 1.5.0、versionCode 為 4，最低 Android 7.0、目標 SDK 36。已完成一般 debug 與並存預覽版編譯、簽章及資源比對；最新交付為 preview.3。尚未執行 Android 裝置測試，也未啟動模擬器。原生匯出使用 Filesystem 快取搭配系統分享；還原使用系統檔案選擇器。

**不要自行啟動 Pixel_9a 或執行 Android 測試；需要時先詢問使用者。** 原生 WebView 捲軸已在 MainActivity 原始碼關閉，但這項原生變更尚未經編譯／實機驗證。系統相簿及檔案選擇器的外觀由 Android 控制。

原 APK 私有簽章金鑰無法還原。已比對簽章憑證：交付 APK 與原 APK 的簽章不同，無法直接覆蓋原安裝。請保留原 App 與清單，先確認舊資料備份方式，再處理手機安裝；不要為安裝測試版而直接解除安裝有資料的舊版。這份專案不包含原手機上的私人資料。

## 測試

開啟開發伺服器，並安裝 Microsoft Edge 後執行：

```powershell
npm test
npm run test:e2e
npm run test:resilience
```

本版只執行小量資料的檢查：資料／備份格式、獨立攤位、星號與完售、暖陽黃、捲軸隱藏、失敗重試及搬移交易；不進行壓力測試。瀏覽器使用一個獨立視窗，不操作你的預覽頁資料。`test:e2e` 會先建置、使用臨時靜態伺服器，測試完成自動關閉。`test:resilience` 需要開發伺服器提供模組。

先前 1.3.0 的測試腳本保留在 `recovery/v1-e2e.cjs`、`recovery/v1-resilience.cjs`；僅適用舊版且包含較多資料，未在本次執行。高負載測試需先詢問使用者。

Android 模擬器開啟 debug APK 後，可執行 `npm run test:android` 檢查 WebView 與本機字型。它需要 ADB 與可拋棄的模擬器；可透過 `ADB`、`ANDROID_HOME`、`ANDROID_SERIAL` 指定環境。

本次結果見 `verification/v1.5/README.md`；先前 CPU 觀察保留於 `verification/v1.4/README.md`。`verification/README.md` 為 1.3.0 的歷史驗證，不能視為新版 Android 已通過。

## 保留的還原資料

`recovery/original-app.js`、`original-capacitor.config.json` 保留原 APK 程式及設定；`recovery/original-res/` 保留解包資源，避免編譯時與 Android 原始資源重複。原始 TypeScript、註解、Git 歷史、原 Android 原始碼與簽章金鑰無法完整找回。

來源 APK SHA-256：`F5B370A06D98950656D3C9559BB2B53411BC0296E189DC1E70F7BF3569CEF9E6`。

## 與原版並存的預覽版

Android 提供獨立 `preview` 建置類型，套件名稱 `com.doujin.shoppinglist.preview`，桌面名稱「場購清單」，可與原版並存。使用相同的本機 debug 簽章更新預覽版；資料與原版分開，不會自動讀取或同步原版資料。

在 Android 目錄執行 `./gradlew.bat :app:assemblePreview`，產物位於 `app/build/outputs/apk/preview/app-preview.apk`。目前版本為 `1.5.0-preview.5`（versionCode 8），包含星號篩選配色、收合／展開向量圖示及商品鉛筆按鈕對齊修改。原本正式套件 ID 與 debug 建置維持不變。

預覽版 preview.3 將「只看星號」一般與選取狀態文字改為 #B58900；可覆蓋 preview.1／preview.2 並保留預覽版資料。

### 從這份 ZIP 重建預覽版

1. 解壓後進入 `doujin-shopping-list`，執行 `npm ci`。
2. 執行 `npm run android:sync`，更新網頁與 Android 資源。
3. 設定 JDK 21 以上與 Android SDK（例如 JAVA_HOME、ANDROID_HOME），進入 `android`。
4. 執行 `./gradlew.bat :app:assemblePreview --no-daemon --max-workers=2`，不需要模擬器。
5. APK 位於 `app/build/outputs/apk/preview/app-preview.apk`；本次已驗證的 APK 另附於專案根目錄 `delivery/`。

ZIP 不包含 node_modules、Gradle 快取、build 目錄、電腦路徑設定、簽章私鑰與個人資料。另一部電腦的 debug 簽章可能不同，不能直接覆蓋目前已安裝的預覽版；若要持續覆蓋更新，需沿用目前本機的 debug 簽章，私鑰不隨 ZIP 分發。

### 下載與手機安裝

交付使用英文檔名 `shopping-list-preview-1.5.0-5.apk`。如應用程式內無法載入 APK，請下載 `shopping-list-preview-1.5.0-5-apk.zip`，解壓後將 APK 傳至手機，再用「我的檔案」開啟安裝。APK 是安裝檔，不是可預覽文件。必要時僅對你使用的檔案來源允許「安裝未知應用程式」。

安裝後名稱為「場購清單」，套件名稱 `com.doujin.shoppinglist.preview`，與原版 `com.doujin.shoppinglist` 分開。可更新 preview.1／preview.2，資料由 Android 保留；不需移除原版。初次安裝預覽版為獨立空清單；舊版若支援備份，可自行匯出後還原。請勿為了安裝預覽版而移除原版資料。

### preview.3 名稱與圖示

桌面與活動標題統一為「場購清單」。獨立套件名稱仍為 `com.doujin.shoppinglist.preview`，可與原版並存並覆蓋先前預覽版，資料仍各自獨立。preview.3 使用 versionCode 6。

購物袋勾選圖案以中心縮放從 0.88 調整為 0.72（相較前版縮小約 18%），增加四周留白；已同步 adaptive foreground、monochrome、舊版一般／圓形 PNG、網頁 SVG 與啟動畫面引用圖示。圖示預覽位於 `assets/icon-preview.png`，Android 桌面裁切與實機顯示尚待驗證。

## 賽博龐克：深夜霓虹（網頁更新）

保留主題 ID `cyberpunk`，舊資料選擇此主題後會自動使用新配色，不需要搬移資料。其餘五種主題沿用原樣。

| 用途 | 色碼 |
|---|---|
| 頁面背景 | #0D1020 |
| 卡片、彈窗、導覽列 | #171C30 |
| 輸入欄位、次層區塊 | #202740 |
| 邊框、分隔線 | #35405C |
| 主色／輔色 | #B39DFF／#67DDE5 |
| 主要／次要文字 | #EEF1FF／#ABB5D1 |
| 主色按鈕文字 | #141128 |
| 錯誤文字／底色 | #FF9BAA／#392333 |

新配色套用場次、清單、攤位、商品、分類、設定、預算與備份確認視窗。已購商品保留刪除線，以次要文字取代整段半透明，保持可讀性；停用此主題原本的場次標記閃爍。圖示與輸入焦點仍清楚顯示，沒有新增發光動畫。

分類色、未分類灰色、灰框空心星星及 #F8D985 實心星星維持不變。「只看星號」文字維持 #B58900，選取底色 #4A3B24、邊框 #F8D985；此固定組合文字對比約 3.37:1，未達一般小字 4.5:1，按使用者要求保留。

驗證：先啟動網頁，再執行 `node tests/cyberpunk.cjs`。使用獨立瀏覽器、三筆商品與兩個場次，測試資料不影響使用者預覽清單。紀錄與手機尺寸截圖見 `verification/cyberpunk/`。

深夜霓虹、分類點選編輯及移除主題勾選圖示已整合進 preview.4 APK 與專案 ZIP；已完成 Android 同步及編譯，未啟動模擬器或執行高負載測試。

## 最新交付：1.5.0-preview.4（versionCode 7）

- 分類管理可點選分類名稱、色塊或鉛筆區編輯名稱與顏色，保留分類 ID 與既有商品關聯；取消不改資料，重新開啟可保留變更。
- 賽博龐克改為完整深夜霓虹配色，包含卡片、導覽列、表單、預算、狀態及備份確認視窗；其他五種主題維持原樣。
- 主題選單移除圓形勾選圖示，保留選取外框與 aria-pressed 狀態。
- 保留「場購清單」桌面名稱、0.72 圖示縮放及獨立套件 `com.doujin.shoppinglist.preview`。可直接更新同簽章的 preview.1／preview.2／preview.3 並保留預覽版資料，與原版並存。

最新版檔名：`shopping-list-preview-1.5.0-5.apk`；若無法直接下載，使用 `shopping-list-preview-1.5.0-5-apk.zip` 解壓安裝。完整專案為 `shopping-list-1.5.0-preview.5-project.zip`，內附 `delivery/` APK 與中文安裝說明。原 APK 還原資源仍保留。

已重跑小量分類編輯與 9 組主題瀏覽器檢查、完成網頁建置與 Android 同步／編譯，並比對 APK 封裝資源與簽章。未啟動模擬器、未執行裝置操作或高負載測試。#B58900 星號篩選選取狀態對比 3.37:1 的既有例外依使用者要求保留。

## 網頁後續修正：介面檢查前五項

- 場次、商品、攤位、分類與預算表單偵測未儲存變更；按取消、關閉、Escape 或點遮罩時，提供「繼續編輯／捨棄變更」。繼續編輯保留欄位、圖片及錯誤內容；未修改則直接關閉。只有儲存交易成功才關閉，不會因儲存失敗丟掉表單。
- 商品外部連結統一驗證為完整 http:// 或 https:// 網址，名稱／價格驗證維持不變；儲存前去除網址前後空白。既有無效網址仍保留在資料與編輯畫面供修正，但清單不再顯示指向 # 的無效連結。
- 長場次標題預留設定按鈕空間，長地點文字可斷行；320／390 像素寬度無標題重疊或水平溢出。
- 圖片預覽加入對話框語意、背景 inert 與捲動鎖定、Tab／Shift+Tab 焦點循環、Escape 關閉及關閉後焦點還原。一般表單共用同一焦點管理。
- 商品星號、編輯、完售、外部連結，以及攤位控制按鈕點擊範圍至少 44×44，保留圖示大小與星號／鉛筆同列對齊。

小量檢查：`node tests/ui-fixes.cjs`，報告與截圖位於 `verification/ui-fixes/`。本節修正已打包於 preview.5 APK／ZIP；已完成網頁建置與 Android 同步、編譯、簽章及封裝驗證。未啟動模擬器或高負載測試。

待實機驗證：Android 返回鍵、手機鍵盤遮擋、系統選圖及分享。不把瀏覽器檢查視為上述 Android 操作已驗證。場次卡片鍵盤進入與關於頁完整建置版本資訊仍是後續項目，本次僅修前五項。

## 最新交付：1.5.0-preview.5（versionCode 8）

整合介面檢查前五項：未儲存提醒、商品網址驗證、長場次標題避開設定按鈕、圖片預覽焦點與捲動管理，以及至少 44×44 清單點擊範圍。保留 preview.4 的分類編輯、深夜霓虹與移除主題勾選圖示，以及縮小留白圖示。

桌面名稱仍為「場購清單」，套件仍為 `com.doujin.shoppinglist.preview`。可直接更新同簽章的既有預覽版並保留資料；原版 App 保持並存，資料不自動互通。不要先解除安裝有資料的 App。

APK：`shopping-list-preview-1.5.0-5.apk`；下載失敗可改用 `shopping-list-preview-1.5.0-5-apk.zip`，解壓後傳到手機安裝。完整專案：`shopping-list-1.5.0-preview.5-project.zip`，內附 `delivery/` APK 及中文安裝說明。ZIP 排除依賴快取、建置暫存、私人簽章金鑰與本機路徑設定，原 APK 還原資源保留。

已使用前一輪通過的 14 組手機尺寸檢查、9 組主題檢查、分類編輯檢查與 10 項資料單元測試結果，並完成這次建置與封裝檢查；未重跑無變更的功能測試。Android 返回鍵、手機鍵盤遮擋、系統選圖與分享仍待實機驗證；未啟動模擬器或執行裝置／高負載測試。

## GitHub 原始碼版本

儲存庫： https://github.com/akira0414/shopping-list

此儲存庫提供目前完整可編輯的網頁與 Android 原始碼、中文指南、字型授權、原 APK 還原資源及驗證紀錄。APK／ZIP 交付檔、本機依賴與快取、電腦 SDK 路徑、簽章私鑰及個人備份不納入 Git。本文提到的 delivery APK 為本機交付 ZIP 的附檔，GitHub 原始碼下載後請依建置步驟產生 APK。

目前並存建置為 `1.5.0-preview.5`（versionCode 8），名稱「場購清單」，套件 `com.doujin.shoppinglist.preview`。重建預覽版不需要啟動模擬器；若使用不同電腦的 debug 金鑰，簽章會不同，不能直接覆蓋現有預覽版。原始碼不包含私人簽章金鑰。

# 場購清單

個人單機使用的同人場購物清單，支援場次、攤位、商品、分類、購買狀態與備份還原。

## 下載

目前版本：**1.5.0-preview.6**（versionCode 9），支援 Android 7.0 以上。

| 檔案 | 下載 |
|---|---|
| Android APK | [下載安裝檔](https://github.com/akira0414/shopping-list/releases/download/v1.5.0-preview.6/shopping-list-preview-1.5.0-6.apk) |
| APK 壓縮包 | [下載並解壓安裝](https://github.com/akira0414/shopping-list/releases/download/v1.5.0-preview.6/shopping-list-preview-1.5.0-6-apk.zip) |
| 完整專案 ZIP | [下載原始碼與中文說明](https://github.com/akira0414/shopping-list/releases/download/v1.5.0-preview.6/shopping-list-1.5.0-preview.6-project.zip) |

[查看版本說明與檔案校驗碼](https://github.com/akira0414/shopping-list/releases/tag/v1.5.0-preview.6)

## 手機安裝

1. 在 Android 手機下載 APK；若下載失敗，改下載 APK 壓縮包並解壓。
2. 使用「我的檔案」開啟 APK，依系統提示允許該來源安裝應用程式。
3. 安裝後開啟「場購清單」。

預覽版套件為 `com.doujin.shoppinglist.preview`，可與原版並存，資料各自獨立。同簽章的舊預覽版可直接更新並保留資料，**不需先解除安裝**。更新前可至設定匯出備份。

## 主要功能

- 場次與活動網址、攤位資料、商品圖片及外部連結。
- 共用分類與顏色編輯、搜尋、狀態與星號篩選。
- 購買／完售狀態、五秒復原、攤位與商品排序、全部收合／展開。
- IndexedDB 本機保存、完整 JSON 備份與取代式還原。
- 六種主題，包含深夜霓虹；使用粉圓字型。
- 未儲存提醒、網址驗證、圖片預覽及手機按鈕點擊範圍改善。

## 開發

需要 Node.js 22.12 以上，建議使用 Node.js 24。

```powershell
npm ci
npm run dev
```

網頁建置：`npm run build`。資料依瀏覽器來源分開保存，請固定使用同一個網址。

## Android 建置

需要 JDK 21 以上及 Android SDK 36，並設定 `JAVA_HOME`、`ANDROID_HOME`。

```powershell
npm run android:sync
cd android
.\gradlew.bat :app:assemblePreview --no-daemon --max-workers=2
```

APK 位於 `android/app/build/outputs/apk/preview/app-preview.apk`。建置不需要啟動模擬器。自行編譯若使用不同的簽章金鑰，無法直接覆蓋已安裝的預覽版。

## 驗證與資源

已完成瀏覽器檢查、網頁建置、Android 編譯及 APK 簽章／封裝驗證。Android 返回鍵、手機鍵盤遮擋、系統選圖與分享仍待實機驗證；紀錄位於 `verification/`。

字型採用 [jf open 粉圓](https://github.com/justfont/open-huninn-font)，授權位於 `public/fonts/`；原 APK 還原資源保留於 `recovery/`。儲存庫不包含私人簽章金鑰、個人備份或建置快取。

## 本版更新

- 場次「進入清單」支援 Tab、Enter 與空白鍵；設定及活動網址可分開操作。
- 關於頁：網頁顯示「版本 1.5.0（網頁版）」；Android 由已安裝套件讀取完整版本與建置編號，例如「版本 1.5.0-preview.6（建置 9）」。

已整合至 preview.6，保留前版全部功能。鍵盤瀏覽器檢查、版本資訊單元測試與 Android 編譯已通過；原生版本資訊顯示仍待實機驗證，未啟動模擬器。

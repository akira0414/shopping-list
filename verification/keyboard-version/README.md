# 場次鍵盤與版本資訊修正

已通過 4 組獨立瀏覽器檢查：Tab／Shift+Tab 焦點順序、Enter／Space 進入清單、設定／活動連結獨立操作且卡片點擊仍可用、關於頁明確顯示網頁版本。沒有巢狀互動元素或重複卡片 Tab 停駐。

已通過 3 項版本資訊單元測試：網頁無虛構建置編號；Android 回傳完整後綴與 build；原生讀取失敗或資訊缺漏顯示錯誤，不誤用網頁版號。

網頁建置與 :app:compilePreviewJavaWithJavac 通過。原生 AppInfoPlugin 從目前安裝套件的 PackageInfo 取得版本資訊，不硬編碼預覽版號。

本次已整合至 preview.6 APK／專案 ZIP 並發布 GitHub Release。未啟動模擬器或執行裝置測試；原生橋接實際顯示仍待裝置驗證。

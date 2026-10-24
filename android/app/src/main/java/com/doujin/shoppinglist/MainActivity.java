package com.doujin.shoppinglist;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppInfoPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() != null) {
            WebView webView = getBridge().getWebView();
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
        }
    }
}

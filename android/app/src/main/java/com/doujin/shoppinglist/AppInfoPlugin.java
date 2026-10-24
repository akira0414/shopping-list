package com.doujin.shoppinglist;

import android.content.pm.PackageInfo;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppInfo")
public class AppInfoPlugin extends Plugin {
    @PluginMethod
    public void getInfo(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            long code = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? info.getLongVersionCode() : info.versionCode;
            JSObject result = new JSObject();
            result.put("version", info.versionName);
            result.put("build", Long.toString(code));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("無法取得版本資訊", error);
        }
    }
}

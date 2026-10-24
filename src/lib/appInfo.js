import { Capacitor, registerPlugin } from "@capacitor/core";
import { APP_VERSION } from "./data.js";
const NativeAppInfo = registerPlugin("AppInfo");
// Android reports its installed package, so preview and regular builds cannot drift.
export async function getAppInfo({
  native = Capacitor.isNativePlatform(),
  getNativeInfo = () => NativeAppInfo.getInfo(),
} = {}) {
  if (!native) return { version: APP_VERSION, build: null, platform: "web" };
  const info = await getNativeInfo();
  if (
    typeof info.version !== "string" ||
    !info.version.trim() ||
    !/^\d+$/.test(String(info.build))
  )
    throw new Error("無法取得完整版本資訊");
  return {
    version: info.version,
    build: String(info.build),
    platform: "android",
  };
}

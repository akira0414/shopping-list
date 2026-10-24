// Smoke check only. Run against a disposable emulator with this debug APK installed.
const { chromium, expect } = require("playwright/test");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const adb =
  process.env.ADB ||
  path.join(
    process.env.ANDROID_HOME ||
      path.join(process.env.LOCALAPPDATA, "Android", "Sdk"),
    "platform-tools",
    "adb.exe",
  );
const serial = process.env.ANDROID_SERIAL || "emulator-5554";
if (!serial.startsWith("emulator-"))
  throw Error("Use a disposable emulator for this test");
const run = (...args) =>
  execFileSync(adb, ["-s", serial, ...args], {
    timeout: 20000,
    maxBuffer: 64 * 1024 * 1024,
  });
(async () => {
  const pid = run("shell", "pidof", "com.doujin.shoppinglist")
    .toString()
    .trim();
  if (!pid) throw Error("Start the debug APK on the emulator first");
  run("forward", "tcp:9223", `localabstract:webview_devtools_remote_${pid}`);
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9223", {
    noDefaults: true,
  });
  const page = browser.contexts()[0].pages()[0];
  assert.equal(await page.title(), "場購清單");
  await expect(page.locator(".app-shell")).toBeVisible();
  const fonts = await page.evaluate(async () => {
    await document.fonts.load('16px "jf open huninn"', "場購清單");
    return document.fonts.check('16px "jf open huninn"', "場購清單");
  });
  assert.ok(fonts);
  fs.mkdirSync("verification", { recursive: true });
  fs.writeFileSync(
    "verification/android-smoke.png",
    run("exec-out", "screencap", "-p"),
  );
  console.log(
    "PASS: Android WebView launches with app name and local Huninn font",
  );
  // Do not issue Browser.close against a native WebView; detach by ending the process.
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

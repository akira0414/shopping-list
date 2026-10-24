import test from "node:test";
import assert from "node:assert/strict";
import { getAppInfo } from "../src/lib/appInfo.js";
test("web version is explicitly web and never pretends to be an APK build", async () => {
  assert.deepEqual(await getAppInfo({ native: false }), {
    version: "1.5.0",
    build: null,
    platform: "web",
  });
});
test("Android version comes from the installed package including suffix and build", async () => {
  assert.deepEqual(
    await getAppInfo({
      native: true,
      getNativeInfo: async () => ({ version: "1.5.0-preview.5", build: "8" }),
    }),
    { version: "1.5.0-preview.5", build: "8", platform: "android" },
  );
  assert.equal(
    (
      await getAppInfo({
        native: true,
        getNativeInfo: async () => ({ version: "1.5.0", build: 4 }),
      })
    ).build,
    "4",
  );
});
test("native error or incomplete response cannot fall back to a misleading web version", async () => {
  await assert.rejects(
    getAppInfo({
      native: true,
      getNativeInfo: async () => {
        throw new Error("bridge unavailable");
      },
    }),
  );
  await assert.rejects(
    getAppInfo({
      native: true,
      getNativeInfo: async () => ({ version: "1.5.0" }),
    }),
  );
});

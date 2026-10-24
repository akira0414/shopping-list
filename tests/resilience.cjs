// Small migration/transaction checks only; no stress fixtures or Android testing.
const { chromium, expect } = require("playwright/test");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const fixture = require("./fixtures-v1.cjs");
(async () => {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--disable-gpu", "--renderer-process-limit=1"],
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = [];
  let success = false;
  try {
    await page.goto(process.env.TEST_URL || "http://127.0.0.1:5173");
    await expect(page.getByText("場次空間", { exact: true })).toBeVisible();
    await page.evaluate(
      (data) =>
        new Promise((resolve, reject) => {
          const request = indexedDB.open("doujin-shopping-list", 1);
          request.onsuccess = () => {
            const db = request.result,
              tx = db.transaction("state", "readwrite");
            tx.objectStore("state").put(data, "current");
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onabort = () => reject(tx.error);
          };
        }),
      fixture,
    );
    await page.addInitScript(() => {
      window.savedPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) {
        if (args[1] === "current" && args[0]?.schemaVersion === 2)
          throw new DOMException(
            "migration storage full",
            "QuotaExceededError",
          );
        return window.savedPut.apply(this, args);
      };
    });
    await page.reload();
    await expect(page.getByRole("alert")).toContainText("原資料未清除");
    async function records() {
      return page.evaluate(
        () =>
          new Promise((resolve) => {
            const q = indexedDB.open("doujin-shopping-list");
            q.onsuccess = () => {
              const db = q.result,
                tx = db.transaction("state"),
                current = tx.objectStore("state").get("current"),
                old = tx.objectStore("state").get("pre-v2");
              tx.oncomplete = () => {
                db.close();
                resolve({ current: current.result, old: old.result });
              };
            };
          }),
      );
    }
    let value = await records();
    assert.deepEqual(value.current, fixture);
    assert.equal(value.old, undefined);
    results.push(
      "failed v1 IndexedDB migration leaves current unchanged and does not partially commit snapshot",
    );
    await page.evaluate(() => (IDBObjectStore.prototype.put = window.savedPut));
    await page.getByRole("button", { name: "重新載入", exact: true }).click();
    await expect(page.getByText("場次空間", { exact: true })).toBeVisible();
    value = await records();
    assert.equal(value.current.schemaVersion, 2);
    assert.deepEqual(value.old, fixture);
    assert.equal(value.current.items.length, 3);
    results.push(
      "retry atomically stores v2 state and retains original v1 snapshot",
    );
    const checked = await page.evaluate(async () => {
      const { parseBackup, createBackup } = await import("/src/lib/data.js");
      const { loadData } = await import("/src/lib/storage.js");
      const data = await loadData();
      let invalid = false;
      try {
        parseBackup(
          JSON.stringify({
            ...createBackup(data),
            data: { ...data, booths: [] },
          }),
        );
      } catch {
        invalid = true;
      }
      return invalid;
    });
    assert.ok(checked);
    assert.deepEqual((await records()).current, value.current);
    results.push(
      "invalid booth backup is rejected without changing saved data",
    );
    success = true;
  } finally {
    fs.mkdirSync("verification/v1.5", { recursive: true });
    fs.writeFileSync(
      "verification/v1.5/migration-results.json",
      JSON.stringify({ passed: success, results }, null, 2),
    );
    console.log(JSON.stringify({ passed: success, results }, null, 2));
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

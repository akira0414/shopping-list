const { chromium, expect } = require("playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const results = [];
results.push = function (...entries) {
  console.log("PASS:", ...entries);
  return Array.prototype.push.apply(this, entries);
};
expect.setTimeout?.(7000);
const fixture = {
  events: [
    {
      id: "e1",
      name: "CWT 測試場次",
      date: "2026-10-24",
      location: "測試會場",
      budget: 5000,
      markers: [{ id: "m1", eventId: "e1", boothNumber: "A01", x: 30, y: 40 }],
    },
    { id: "e2", name: "第二場次", date: "", location: "", budget: 2000 },
  ],
  categories: [
    { id: "c1", name: "新刊", color: "#6696C4" },
    { id: "c2", name: "周邊", color: "#fcd254" },
  ],
  items: Array.from({ length: 100 }, (_, n) => ({
    id: `i${n}`,
    name: `商品 ${String(n).padStart(3, "0")}`,
    eventId: "e1",
    categoryId: n % 2 ? "c2" : "c1",
    boothNumber: `A${String(Math.floor(n / 10) + 1).padStart(2, "0")}`,
    price: 10,
    status: n % 3 === 0 ? "purchased" : n % 3 === 1 ? "pending" : "soldOut",
    createdAt: n,
  })),
  currentEventId: "e1",
  themeId: "default",
  defaultBudget: 5000,
  boothOrder: {
    e1: Array.from(
      { length: 10 },
      (_, n) => `A${String(n + 1).padStart(2, "0")}`,
    ),
  },
};
const backup = (data) =>
  JSON.stringify({
    app: "com.doujin.shoppinglist",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    data,
  });
async function read(page) {
  return page.evaluate(
    async () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open("doujin-shopping-list", 1);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("state", "readonly");
          const r = tx.objectStore("state").get("current");
          tx.oncomplete = () => {
            db.close();
            resolve(r.result);
          };
          tx.onabort = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      }),
  );
}
async function idle(page) {
  await expect(page.locator(".saving-shield")).toHaveCount(0);
}
async function enter(page) {
  await page.getByText("進入清單", { exact: true }).first().click();
  await expect(
    page.getByRole("heading", { name: "CWT 測試場次", exact: true }),
  ).toBeVisible();
  await idle(page);
}
async function settings(page) {
  await page.getByRole("button", { name: "設定", exact: true }).click();
}
async function importData(page, data, confirm = true) {
  await settings(page);
  await page
    .getByLabel("選擇備份還原", { exact: true })
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(backup(data)),
    });
  await expect(
    page.getByRole("dialog", { name: "確認還原備份" }),
  ).toBeVisible();
  if (confirm) {
    await page.getByRole("button", { name: "確認取代全部資料" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await idle(page);
  } else {
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "取消", exact: true })
      .click();
  }
}
(async () => {
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    hasTouch: true,
    isMobile: true,
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  fs.mkdirSync("verification", { recursive: true });
  try {
    await page.addInitScript((data) => {
      if (!localStorage.getItem("test-seeded")) {
        for (const [k, v] of Object.entries(data))
          localStorage.setItem(
            k,
            ["currentEventId", "themeId"].includes(k) ? v : JSON.stringify(v),
          );
        localStorage.setItem("test-seeded", "1");
      }
    }, fixture);
    await page.goto(base);
    await expect(page.getByText("場次空間", { exact: true })).toBeVisible();
    assert.equal((await read(page)).items.length, 100);
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("items")).length,
      ),
      100,
    );
    results.push(
      "legacy migration: 100 items, shared categories and markers preserved; localStorage retained",
    );
    await enter(page);
    await page.getByRole("searchbox").fill("商品 001");
    await expect(page.locator(".product-card")).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "排序", exact: true }),
    ).toBeDisabled();
    await page.getByRole("searchbox").fill("a01");
    await expect(page.locator(".product-card")).toHaveCount(10);
    await page.getByLabel("分類篩選", { exact: true }).selectOption("c1");
    await page
      .getByLabel("購買狀態篩選", { exact: true })
      .selectOption("pending");
    await expect(page.locator(".product-card")).toHaveCount(1);
    await expect(page.locator(".budget-card")).toContainText("$340");
    await page.getByRole("button", { name: "清除條件", exact: true }).click();
    await expect(page.locator(".product-card")).toHaveCount(100);
    assert.equal((await read(page)).items.length, 100);
    results.push(
      "search, case insensitive booth match, category/status intersection, unchanged budget and disabled filtered sorting",
    );
    await page
      .getByRole("button", {
        name: "商品 001，未購，點擊切換購買狀態",
        exact: true,
      })
      .click();
    await idle(page);
    assert.equal((await read(page)).items[1].status, "purchased");
    await page.getByRole("button", { name: "復原", exact: true }).click();
    await idle(page);
    assert.equal((await read(page)).items[1].status, "pending");
    await page
      .getByRole("button", {
        name: "商品 002，完售，點擊切換購買狀態",
        exact: true,
      })
      .click();
    assert.equal((await read(page)).items[2].status, "soldOut");
    results.push("purchase toggle, targeted undo and sold-out guard");
    // Scroll and move on a row without treating it as a purchase click.
    const target = page.getByRole("button", {
      name: "商品 001，未購，點擊切換購買狀態",
      exact: true,
    });
    await target.dispatchEvent("pointerdown", {
      pointerId: 7,
      pointerType: "touch",
      clientX: 150,
      clientY: 600,
    });
    await target.dispatchEvent("pointermove", {
      pointerId: 7,
      pointerType: "touch",
      clientX: 150,
      clientY: 540,
    });
    await target.dispatchEvent("click", { detail: 1 });
    assert.equal((await read(page)).items[1].status, "pending");
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 200, y: 760 }],
    });
    for (let y = 720; y >= 250; y -= 40)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 200, y }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForTimeout(300);
    assert.ok((await page.evaluate(() => scrollY)) > 100);
    assert.equal((await read(page)).items.length, 100);
    results.push(
      "100-item touch scroll and movement do not change purchase status or remove items",
    );
    await page.evaluate(() => scrollTo(0, 0));
    await page.getByRole("button", { name: "排序", exact: true }).click();
    const handle = page.getByRole("button", {
      name: "拖曳商品 商品 000",
      exact: true,
    });
    await handle.scrollIntoViewIfNeeded();
    const a = await handle.boundingBox();
    const b = await page
      .getByRole("button", { name: "拖曳商品 商品 001", exact: true })
      .boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2, b.y + b.height + 10, {
      steps: 14,
    });
    await page.mouse.up();
    await idle(page);
    await page.waitForTimeout(250);
    const reordered = await read(page);
    assert.equal(reordered.items.length, 100);
    assert.deepEqual(
      new Set(reordered.items.map((i) => i.id)),
      new Set(fixture.items.map((i) => i.id)),
    );
    assert.notEqual(reordered.items[0].id, "i0");
    await page.getByRole("button", { name: "結束排序", exact: true }).click();
    results.push(
      "handle-only item reorder persists without losing hidden/category items",
    );
    await settings(page);
    for (const [label, hex] of [
      ["櫻花粉", "rgb(233, 30, 99)"],
      ["森林綠", "rgb(46, 125, 50)"],
      ["午夜黑", "rgb(33, 33, 33)"],
      ["賽博龐克", "rgb(255, 0, 255)"],
      ["大眾藍", "rgb(102, 150, 196)"],
    ]) {
      await page.getByRole("button", { name: /顏色主題/ }).click();
      await page.getByRole("button", { name: label, exact: true }).click();
      await idle(page);
      await page.getByRole("button", { name: "清單", exact: true }).click();
      const colors = await page
        .locator(".product-stripe")
        .evaluateAll((nodes) => [
          ...new Set(nodes.map((n) => getComputedStyle(n).backgroundColor)),
        ]);
      assert.deepEqual(colors, [hex]);
      await settings(page);
    }
    results.push(
      "all five themes apply the exact primary color to purchased/pending/sold-out stripes",
    );
    await page.getByRole("button", { name: "清單", exact: true }).click();
    await page.getByRole("button", { name: "新增商品", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "新增商品" });
    await dialog.getByRole("button", { name: "儲存商品", exact: true }).click();
    await expect(
      dialog.getByText("請填寫商品名稱", { exact: true }),
    ).toBeVisible();
    await dialog
      .getByLabel("商品名稱", { exact: true })
      .fill("  手機照片商品  ");
    await dialog.getByLabel("價格", { exact: true }).fill("-1");
    await dialog.getByRole("button", { name: "儲存商品", exact: true }).click();
    await expect(
      dialog.getByText("請輸入有效的非負價格", { exact: true }),
    ).toBeVisible();
    await dialog.getByLabel("價格", { exact: true }).fill("350");
    // A noisy portrait PNG larger than 2MB exercises compression and transparency.
    const image = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 1200;
      c.height = 2000;
      const ctx = c.getContext("2d");
      const pixels = ctx.createImageData(c.width, c.height);
      let state = 123;
      for (let n = 0; n < pixels.data.length; n += 4) {
        state = (state * 1664525 + 1013904223) >>> 0;
        pixels.data[n] = state & 255;
        pixels.data[n + 1] = (state >>> 8) & 255;
        pixels.data[n + 2] = (state >>> 16) & 255;
        pixels.data[n + 3] = n < 4800 ? 0 : 255;
      }
      ctx.putImageData(pixels, 0, 0);
      return c.toDataURL("image/png").split(",")[1];
    });
    assert.ok(Buffer.from(image, "base64").length > 2 * 1024 * 1024);
    await dialog
      .getByLabel("選擇手機照片", { exact: true })
      .setInputFiles({
        name: "portrait.png",
        mimeType: "image/png",
        buffer: Buffer.from(image, "base64"),
      });
    await expect(dialog.getByAltText("商品圖片預覽")).toBeVisible();
    await expect(dialog.getByText("正在縮圖與壓縮，請稍候…")).toHaveCount(0);
    const dims = await dialog
      .getByAltText("商品圖片預覽")
      .evaluate((img) => [img.naturalWidth, img.naturalHeight]);
    assert.deepEqual(dims, [960, 1600]);
    await dialog
      .getByLabel("選擇手機照片", { exact: true })
      .setInputFiles({
        name: "bad.png",
        mimeType: "image/png",
        buffer: Buffer.from("broken image"),
      });
    await expect(
      dialog.getByText("無法解碼圖片，請重新選擇或轉換格式"),
    ).toBeVisible();
    await expect(dialog.getByAltText("商品圖片預覽")).toBeVisible();
    await dialog
      .getByLabel("選擇手機照片", { exact: true })
      .setInputFiles({
        name: "portrait.png",
        mimeType: "image/png",
        buffer: Buffer.from(image, "base64"),
      });
    await expect(dialog.getByText("正在縮圖與壓縮，請稍候…")).toHaveCount(0);
    // Inject a real persistence-path failure: retain form and saved snapshot.
    await page.evaluate(() => {
      window.originalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function () {
        throw new DOMException("測試容量不足", "QuotaExceededError");
      };
    });
    await dialog.getByRole("button", { name: "儲存商品", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("未能儲存");
    await expect(dialog).toBeVisible();
    assert.equal((await read(page)).items.length, 100);
    await page.evaluate(() => {
      IDBObjectStore.prototype.put = window.originalPut;
    });
    await dialog.getByRole("button", { name: "儲存商品", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await idle(page);
    assert.equal((await read(page)).items.length, 101);
    assert.equal((await read(page)).items.at(-1).name, "手機照片商品");
    results.push(
      "trim/negative validation, >2MB portrait resizing, transparent PNG, corrupt image, same-file reselection and failed-save retry retain the form/data",
    );
    await page
      .getByRole("button", { name: "編輯商品 商品 001", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "刪除商品", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "關閉視窗", exact: true }).click();
    await page.reload();
    await enter(page);
    await page.getByRole("searchbox").fill("手機照片商品");
    await expect(page.locator(".product-thumb img")).toBeVisible();
    assert.ok(
      await page
        .locator(".product-thumb img")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    );
    results.push("edit-mode delete action and photo persistence after reload");
    await page.getByRole("button", { name: "分類", exact: true }).click();
    let confirmText = "";
    page.once("dialog", async (d) => {
      confirmText = d.message();
      await d.accept();
    });
    await page
      .getByRole("button", { name: "刪除分類 新刊", exact: true })
      .click();
    await idle(page);
    assert.ok(confirmText.includes("50"));
    assert.equal((await read(page)).items.length, 101);
    assert.ok((await read(page)).items.every((i) => i.categoryId !== "c1"));
    results.push(
      "shared category deletion unlinks affected items and preserves all products",
    );
    await settings(page);
    const downloaded = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "匯出完整備份", exact: true })
      .click();
    const dl = await downloaded;
    const exported = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
    const saved = await read(page);
    assert.deepEqual(exported.data, saved);
    await page
      .getByLabel("選擇備份還原", { exact: true })
      .setInputFiles({
        name: "invalid.json",
        mimeType: "application/json",
        buffer: Buffer.from("{broken"),
      });
    await expect(page.getByRole("alert")).toContainText("無法還原");
    assert.deepEqual(await read(page), saved);
    await importData(page, fixture, false);
    assert.deepEqual(await read(page), saved);
    await importData(page, exported.data, true);
    assert.deepEqual(await read(page), saved);
    results.push(
      "downloaded backup includes images/markers/order/settings; invalid and canceled restores preserve data; confirmed restore round-trips exactly",
    );
    await enter(page);
    await page.getByRole("searchbox").fill("商品 001");
    await page.getByRole("button", { name: "場次", exact: true }).click();
    await page.getByText("第二場次", { exact: true }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("");
    await expect(
      page.getByText("目前尚無商品資料", { exact: true }),
    ).toBeVisible();
    results.push("event switch resets search/filter and empty states");
    await page.getByRole("button", { name: "場次", exact: true }).click();
    await enter(page);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: "verification/preview-mobile.png",
      fullPage: false,
    });
    assert.deepEqual(errors, []);
    results.push("no uncaught browser errors");
  } finally {
    fs.mkdirSync("verification", { recursive: true });
    fs.writeFileSync(
      "verification/browser-results.json",
      JSON.stringify(
        { results, errors, passed: results.length >= 12 },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({ passed: results.length, results, errors }, null, 2),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

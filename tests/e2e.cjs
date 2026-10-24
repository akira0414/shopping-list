// Short feature checks: one browser/page, three legacy products, no load tests.
const { chromium, expect } = require("playwright/test");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const fixture = require("./fixtures-v1.cjs");
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const results = [];
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=",
  "base64",
);
async function read(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const q = indexedDB.open("doujin-shopping-list", 1);
        q.onsuccess = () => {
          const db = q.result,
            tx = db.transaction("state"),
            r = tx.objectStore("state").get("current");
          tx.oncomplete = () => {
            db.close();
            resolve(r.result);
          };
          tx.onabort = () => reject(tx.error);
        };
        q.onerror = () => reject(q.error);
      }),
  );
}
async function idle(page) {
  await expect(page.locator(".saving-shield")).toHaveCount(0);
}
async function enter(page) {
  await page.getByText("進入清單", { exact: true }).first().click();
  await expect(
    page.getByRole("button", { name: "新增商品", exact: true }),
  ).toBeVisible();
  await idle(page);
}
async function add(page, type) { await page.getByRole('button', { name: type, exact: true }).click(); }
function pass(message) {
  results.push(message);
  console.log("PASS:", message);
}
(async () => {
  fs.mkdirSync("verification/v1.5", { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    headless: true,
    args: ["--disable-gpu", "--renderer-process-limit=1"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let success = false;
  try {
    await page.addInitScript((data) => {
      if (!localStorage.getItem("test-seeded")) {
        for (const [k, v] of Object.entries(data))
          localStorage.setItem(
            k,
            ["themeId", "currentEventId"].includes(k) ? v : JSON.stringify(v),
          );
        localStorage.setItem("test-seeded", "true");
      }
    }, fixture);
    await page.goto(base);
    await expect(page.getByText("場次空間", { exact: true })).toBeVisible();
    const initial = await read(page);
    assert.equal(initial.schemaVersion, 2);
    assert.equal(initial.booths.length, 1);
    assert.equal(initial.items.length, 3);
    assert.ok(initial.items.every((i) => i.favorite === false));
    assert.equal(initial.events[0].markers[0].boothId, initial.booths[0].id);
    pass(
      "v1 localStorage migrates to stable booths and default empty stars without losing markers/items",
    );
    const eventSettings = page.getByRole("button", {
      name: "編輯場次 CWT 測試場次",
      exact: true,
    });
    await eventSettings.hover();
    const style = await eventSettings.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      shadow: getComputedStyle(el).boxShadow,
    }));
    assert.equal(style.background, "rgba(0, 0, 0, 0)");
    assert.equal(style.shadow, "none");
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollbarWidth,
      ),
      "none",
    );
    pass(
      "event setting icon stays transparent with no shadow; scrollbar hidden globally",
    );
    await eventSettings.click();
    const activityEditor = page.getByRole('dialog', {name:'編輯場次', exact:true});
    await activityEditor.getByLabel('活動網址（選填）', {exact:true}).fill('javascript:alert(1)');
    await activityEditor.getByRole('button', {name:'儲存場次',exact:true}).click();
    await expect(activityEditor.getByText('請輸入 http:// 或 https:// 活動網址')).toBeVisible();
    await activityEditor.getByLabel('活動網址（選填）', {exact:true}).fill('https://example.com/events/cwt');
    await activityEditor.getByRole('button', {name:'儲存場次',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await idle(page);
    await expect(page.getByRole('link', {name:'活動網站 CWT 測試場次',exact:true})).toHaveAttribute('href','https://example.com/events/cwt');
    assert.equal((await read(page)).events[0].eventUrl,'https://example.com/events/cwt');
    pass('event URL validates safe protocols, saves and appears on event card');
    await enter(page);
    await expect(page.locator('.shopping-heading button')).toHaveCount(2);
    await expect(page.locator('.shopping-heading').getByRole('link',{name:'活動網站',exact:true})).toHaveAttribute('href','https://example.com/events/cwt');
    await expect(page.locator(".product-card")).toHaveCount(3);
    await page.getByRole('button',{name:'全部收合',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(0);
    assert.ok((await page.locator('.booth-toggle').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-expanded')))).every(value=>value==='false'));
    await page.getByRole('button',{name:'全部展開',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(3);
    pass('two direct icon actions and collapse/expand all groups retain products');
    await add(page, "新增攤位");
    const editor = page.getByRole("dialog", { name: "新增攤位", exact: true });
    await editor.getByRole("button", { name: "儲存攤位", exact: true }).click();
    await expect(
      editor.getByText("請填寫攤位名稱", { exact: true }),
    ).toBeVisible();
    await editor.getByLabel("攤位名稱", { exact: true }).fill("晴空創作社");
    await editor
      .getByLabel("攤位號碼（選填）", { exact: true })
      .fill(" ａ０１ ");
    await editor.getByRole("button", { name: "儲存攤位", exact: true }).click();
    await expect(editor.getByText("同一場次已有此攤位號碼")).toBeVisible();
    await editor.getByLabel("攤位號碼（選填）", { exact: true }).fill("B02");
    await editor
      .getByLabel("連結名稱（選填）", { exact: true })
      .fill("攤位社群");
    await editor.getByRole("button", { name: "儲存攤位", exact: true }).click();
    await expect(editor.getByText("填寫連結名稱後，請補上網址")).toBeVisible();
    await editor
      .getByLabel("外部連結 (URL)", { exact: true })
      .fill("https://example.com/booth");
    await editor
      .getByLabel("備註（選填）", { exact: true })
      .fill("預購取貨\n下午兩點開放");
    await editor
      .getByLabel("上傳攤位圖", { exact: true })
      .setInputFiles({ name: "booth.png", mimeType: "image/png", buffer: PNG });
    await expect(editor.getByAltText("攤位圖片預覽")).toBeVisible();
    assert.equal(
      await editor.evaluate((el) => getComputedStyle(el).scrollbarWidth),
      "none",
    );
    await editor.getByRole("button", { name: "儲存攤位", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await idle(page);
    const booth = (await read(page)).booths.find(
      (b) => b.name === "晴空創作社",
    );
    assert.ok(booth.imageUrl.startsWith("data:image/png"));
    await expect(
      page.getByText("此攤位尚無商品", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "攤位社群", exact: true }),
    ).toHaveAttribute("href", "https://example.com/booth");
    pass(
      "direct add action, empty booth, normalized duplicate validation, photo, linked label and multi-line notes",
    );
    await page
      .getByRole("button", {
        name: "在 晴空創作社（B02） 新增商品",
        exact: true,
      })
      .click();
    const productEditor = page.getByRole("dialog", {
      name: "新增商品",
      exact: true,
    });
    await expect(
      productEditor.getByLabel("所屬攤位", { exact: true }),
    ).toHaveValue(booth.id);
    await expect(productEditor.locator('.product-image-picker')).toContainText('點此上傳商品圖片');
    await productEditor.getByLabel('選擇手機照片',{exact:true}).setInputFiles({name:'product.png',mimeType:'image/png',buffer:PNG});
    await expect(productEditor.getByAltText('商品圖片預覽')).toBeVisible();
    await expect(productEditor.locator('.product-image-picker')).toContainText('點此更換商品圖片');
    await productEditor
      .getByLabel("商品名稱", { exact: true })
      .fill("星號商品");
    await productEditor.getByLabel("價格", { exact: true }).fill("350");
    await productEditor
      .getByRole("button", { name: "儲存商品", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await idle(page);
    const starIcon=page.getByRole('button',{name:'加入星號 星號商品',exact:true}).locator('svg');
    await expect(starIcon).toHaveCSS('stroke','rgb(156, 163, 175)');await expect(starIcon).toHaveCSS('fill','none');
    await expect(page.locator('.product-thumb img')).toHaveCSS('object-fit','contain');
    await page
      .getByRole("button", { name: "加入星號 星號商品", exact: true })
      .click();
    await idle(page);
    await expect(
      page.getByRole("button", { name: "取消星號 星號商品", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    assert.ok(
      (await read(page)).items.find((i) => i.name === "星號商品").favorite,
    );
    await expect(page.getByRole('button',{name:'取消星號 星號商品',exact:true}).locator('svg')).toHaveCSS('fill','rgb(248, 217, 133)');
    await page.getByRole("button", { name: "★ 只看星號", exact: true }).click();
    await expect(page.locator(".product-card")).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "排序", exact: true }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "清除條件", exact: true }).click();
    await page
      .getByRole("button", { name: "標註完售 星號商品", exact: true })
      .click();
    await idle(page);
    assert.equal(
      (await read(page)).items.find((i) => i.name === "星號商品").status,
      "soldOut",
    );
    await expect(page.locator(".budget-card")).toContainText("$100");
    await page.getByRole("button", { name: "復原", exact: true }).click();
    await idle(page);
    assert.equal(
      (await read(page)).items.find((i) => i.name === "星號商品").status,
      "pending",
    );
    await page
      .getByRole("button", { name: "標註完售 星號商品", exact: true })
      .click();
    await idle(page);
    await page
      .getByRole("button", { name: "取消完售 星號商品", exact: true })
      .click();
    await idle(page);
    pass(
      "product belongs to fixed booth; yellow star is independent; favorite filtering and quick sold-out/undo preserve budget",
    );
    await page
      .getByRole("button", { name: "編輯攤位 晴空創作社（B02）", exact: true })
      .click();
    const edit = page.getByRole("dialog", { name: "編輯攤位", exact: true });
    await edit.getByLabel("攤位名稱", { exact: true }).fill("晴空新名稱");
    await edit.getByLabel("攤位號碼（選填）", { exact: true }).fill("Z99");
    await edit.getByRole("button", { name: "儲存攤位", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await idle(page);
    assert.equal(
      (await read(page)).items.find((i) => i.name === "星號商品").boothId,
      booth.id,
    );
    await page.getByRole("searchbox").fill("晴空新名稱");
    await expect(page.locator(".product-card")).toHaveCount(1);
    await page.getByRole("button", { name: "清除條件", exact: true }).click();
    pass(
      "renaming booth and number preserves IDs and products; booth name is searchable",
    );
    await page.getByRole("button", { name: "設定", exact: true }).click();
    await page.getByRole("button", { name: /顏色主題/ }).click();
    const themes = page.getByRole("dialog", {
      name: "選擇顏色主題",
      exact: true,
    });
    const names = await themes.locator(".theme-option").allTextContents();
    assert.equal(
      names.findIndex((n) => n.includes("暖陽黃")) + 1,
      names.findIndex((n) => n.includes("賽博龐克")),
    );
    await themes.getByRole("button", { name: "暖陽黃", exact: true }).click();
    await idle(page);
    await page.getByRole("button", { name: "清單", exact: true }).click();
    const stripeColors=await page.locator('.product-stripe').evaluateAll(nodes=>[...new Set(nodes.map(n=>getComputedStyle(n).backgroundColor))].sort());
    assert.deepEqual(stripeColors,['rgb(102, 150, 196)','rgb(156, 163, 175)'].sort());
    assert.equal(
      await page
        .locator(".header-add-button.is-primary")
        .first()
        .evaluate((el) => getComputedStyle(el).color),
      "rgb(71, 52, 11)",
    );
    pass(
      "sunshine keeps dark button text; product stripes use category color and uncategorized gray",
    );
    await page.reload();
    await enter(page);
    assert.equal((await read(page)).themeId, "sunshine");
    assert.ok(
      (await read(page)).items.find((i) => i.name === "星號商品").favorite,
    );
    pass("booth data, star and sunshine theme survive reload");
    await page.screenshot({path:'verification/v1.5/preview-list.png',fullPage:true,style:'.app-toast { visibility:hidden; }'});
    await page.getByRole("button", { name: "設定", exact: true }).click();
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "匯出完整備份", exact: true })
      .click();
    const download = await downloadPromise;
    const exported = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
    assert.equal(exported.formatVersion, 2);
    assert.equal(exported.data.events[0].eventUrl,'https://example.com/events/cwt');
    assert.equal(
      exported.data.booths.find((b) => b.id === booth.id).notes,
      "預購取貨\n下午兩點開放",
    );
    assert.ok(exported.data.items.find((i) => i.name === "星號商品").favorite);
    await page
      .getByLabel("選擇備份還原", { exact: true })
      .setInputFiles({
        name: "backup.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(exported)),
      });
    await expect(
      page.getByRole("dialog", { name: "確認還原備份" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "確認取代全部資料", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await idle(page);
    assert.deepEqual(await read(page), exported.data);
    pass(
      "v2 backup/restore contains booth photo, link, notes, stars, IDs and theme",
    );
    await enter(page);
    await page
      .getByRole("button", { name: "編輯攤位 晴空新名稱（Z99）", exact: true })
      .click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "刪除攤位", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await idle(page);
    const remaining = await read(page);
    assert.equal(remaining.items.length, 4);
    const moved = remaining.items.find((i) => i.name === "星號商品");
    assert.equal(moved.boothId, null);
    assert.ok(moved.favorite);
    assert.ok(!remaining.booths.some((b) => b.id === booth.id));
    pass(
      "deleting booth retains all products and their stars under unassigned",
    );
    await add(page, "新增商品");
    await expect(
      page
        .getByRole("dialog", { name: "新增商品" })
        .getByLabel("所屬攤位", { exact: true }),
    ).toHaveValue("");
    await page.getByRole("button", { name: "關閉視窗", exact: true }).click();
    await page.evaluate(() => scrollTo(0, 200));
    assert.ok((await page.evaluate(() => scrollY)) > 0);
    await page.evaluate(() => scrollTo(0, 0));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: "verification/v1.5/preview-mobile.png" });
    assert.deepEqual(errors, []);
    pass(
      "direct product action creates unassigned products; hidden scrollbars retain scrolling; no browser errors",
    );
    success = true;
  } finally {
    fs.writeFileSync(
      "verification/v1.5/browser-results.json",
      JSON.stringify({ passed: success, results, errors }, null, 2),
    );
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

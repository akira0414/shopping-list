const { chromium, expect } = require("playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const fixture = structuredClone(require("./fixtures-v1.cjs"));
fixture.events[0].name = "台灣同人誌販售會第六十八屆台北冬季特別場次";
fixture.events[0].location = "台北市信義區信義路五段五號世界貿易中心展覽一館";
fixture.categories[0].name = "原創插畫與角色設定集";
fixture.items[0].name = "冬日特別版原創插畫合集含透明明信片組與限定特典";
fixture.items[0].imageUrl =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#6696c4"/></svg>',
  );
const dir = "verification/ui-fixes";
fs.mkdirSync(dir, { recursive: true });
const results = [];
const errors = [];
const pass = (s) => {
  results.push(s);
  console.log("PASS: " + s);
};
async function discard(p) {
  await p.getByRole("button", { name: "捨棄變更", exact: true }).click();
  await expect(p.getByRole("dialog")).toHaveCount(0);
}
async function close(p) {
  await p.getByRole("button", { name: "關閉視窗", exact: true }).click();
}
async function preserved(p, field, value) {
  await field.fill(value);
  await p.keyboard.press("Escape");
  await expect(
    p.getByRole("dialog", { name: "尚有未儲存的變更" }),
  ).toBeVisible();
  await p.getByRole("button", { name: "繼續編輯", exact: true }).click();
  await expect(field).toHaveValue(value);
  await p.getByRole("button", { name: "取消", exact: true }).click();
  await discard(p);
}
(async () => {
  const b = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--disable-gpu", "--renderer-process-limit=1"],
  });
  let ok = false;
  try {
    for (const width of [320, 390]) {
      const ctx = await b.newContext({
        viewport: { width, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const p = await ctx.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      await p.addInitScript((data) => {
        if (!localStorage.getItem("ui-seeded")) {
          for (const [k, v] of Object.entries(data))
            localStorage.setItem(
              k,
              ["themeId", "currentEventId"].includes(k) ? v : JSON.stringify(v),
            );
          localStorage.setItem("ui-seeded", "1");
        }
      }, fixture);
      await p.goto("http://127.0.0.1:5173");
      await p.locator("h3").first().waitFor();
      await p.evaluate(() => document.fonts.ready);
      await expect(p.locator(".event-card").first()).toHaveCSS("opacity", "1");
      assert.equal(
        await p.evaluate(() => {
          const range = document.createRange();
          range.selectNodeContents(document.querySelector("h3"));
          const s = document
            .querySelector(".event-settings-button")
            .getBoundingClientRect();
          return [...range.getClientRects()].some(
            (t) =>
              t.right > s.left &&
              t.left < s.right &&
              t.top < s.bottom &&
              t.bottom > s.top,
          );
        }),
        false,
      );
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      pass(
        width +
          "px: long event title no longer overlaps settings; no page overflow",
      );
      await p.screenshot({ path: dir + "/events-" + width + ".png" });
      await p.getByRole("button", { name: "新增場次", exact: true }).click();
      await close(p);
      await expect(p.getByRole("dialog")).toHaveCount(0);
      await p
        .getByRole("button", { name: /編輯場次/ })
        .first()
        .click();
      await preserved(
        p,
        p.getByLabel("場次名稱", { exact: true }),
        "未儲存場次",
      );
      pass(
        width +
          "px: clean close immediate; event edit discard confirmation keeps content when continuing",
      );
      await p.getByText("進入清單", { exact: true }).first().click();
      await p.getByRole("button", { name: "新增商品", exact: true }).click();
      await p.getByLabel("商品名稱", { exact: true }).fill("未儲存商品");
      await p.locator(".modal-backdrop").click({ position: { x: 2, y: 2 } });
      await expect(
        p.getByRole("dialog", { name: "尚有未儲存的變更" }),
      ).toBeVisible();
      await p.keyboard.press("Escape");
      await expect(p.getByLabel("商品名稱", { exact: true })).toHaveValue(
        "未儲存商品",
      );
      await close(p);
      await discard(p);
      pass(
        width +
          "px: backdrop/close/Escape share guard; Escape from confirmation resumes editing",
      );
      await p
        .getByRole("button", { name: "編輯商品 預定周邊", exact: true })
        .click();
      for (const url of [
        "example.com",
        "javascript:alert(1)",
        "https:example.com",
      ]) {
        await p.getByLabel("外部連結 (URL)", { exact: true }).fill(url);
        await p.getByRole("button", { name: "儲存商品", exact: true }).click();
        await expect(
          p.getByText("請輸入 http:// 或 https:// 網址", { exact: true }),
        ).toBeVisible();
        await expect(p.getByRole("dialog", { name: "編輯商品" })).toBeVisible();
      }
      await p
        .getByLabel("外部連結 (URL)", { exact: true })
        .fill("  https://example.com/product  ");
      const beforeFailure = await p.evaluate(async () => {
        const { loadData } = await import("/src/lib/storage.js");
        return loadData();
      });
      await p.evaluate(() => {
        const put = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function (...args) {
          if (args[1] === "current") {
            IDBObjectStore.prototype.put = put;
            throw new DOMException("test storage full", "QuotaExceededError");
          }
          return put.apply(this, args);
        };
      });
      await p.getByRole("button", { name: "儲存商品", exact: true }).click();
      await expect(p.getByRole("dialog", { name: "編輯商品" })).toBeVisible();
      await expect(p.getByLabel("外部連結 (URL)", { exact: true })).toHaveValue(
        "  https://example.com/product  ",
      );
      assert.deepEqual(
        await p.evaluate(async () => {
          const { loadData } = await import("/src/lib/storage.js");
          return loadData();
        }),
        beforeFailure,
      );
      await p.keyboard.press("Escape");
      await p.getByRole("button", { name: "繼續編輯", exact: true }).click();
      await p.getByRole("button", { name: "儲存商品", exact: true }).click();
      await expect(p.getByRole("dialog")).toHaveCount(0);
      await expect(
        p.getByRole("link", { name: "開啟連結 預定周邊" }),
      ).toHaveAttribute("href", "https://example.com/product");
      pass(
        width +
          "px: invalid URLs blocked with field error; failed save preserves form/data and guard; retry trims HTTPS into working href",
      );
      const thumb = p.getByRole("button", { name: /預覽圖片/ }).first();
      await thumb.click();
      await expect(p.getByRole("dialog", { name: "圖片預覽" })).toBeVisible();
      assert.equal(
        await p.evaluate(() => document.body.style.overflow),
        "hidden",
      );
      await p.keyboard.press("Tab");
      await expect(
        p.getByRole("button", { name: "關閉圖片預覽" }),
      ).toBeFocused();
      await p.keyboard.press("Tab");
      await expect(
        p.getByRole("button", { name: "關閉圖片預覽" }),
      ).toBeFocused();
      await p.keyboard.press("Shift+Tab");
      await expect(
        p.getByRole("button", { name: "關閉圖片預覽" }),
      ).toBeFocused();
      await p.keyboard.press("Escape");
      await expect(p.getByRole("dialog")).toHaveCount(0);
      await expect(thumb).toBeFocused();
      assert.equal(await p.evaluate(() => document.body.style.overflow), "");
      assert.equal(
        await p.locator(".app-main").evaluate((el) => el.inert),
        false,
      );
      pass(
        width +
          "px: image preview locks background, traps forward/reverse Tab, Escape closes and restores focus/scroll",
      );
      const undersized = await p
        .locator(".product-card button,.product-card a,.booth-controls button")
        .evaluateAll((nodes) =>
          nodes
            .filter((n) => {
              const r = n.getBoundingClientRect();
              return r.width < 44 || r.height < 44;
            })
            .map((n) => n.getAttribute("aria-label")),
        );
      assert.deepEqual(undersized, []);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      const positions = await p
        .locator(".product-card")
        .first()
        .evaluate((el) => {
          const a = el
              .querySelector(".favorite-button")
              .getBoundingClientRect(),
            b = el.querySelector(".product-edit").getBoundingClientRect();
          return Math.abs(a.y - b.y);
        });
      assert.ok(positions < 1);
      await p.screenshot({
        path: dir + "/list-" + width + ".png",
        fullPage: true,
      });
      pass(
        width +
          "px: product/booth actions >=44x44, star/edit aligned, long name/photo/category fit",
      );
      await p.getByRole("button", { name: "新增攤位", exact: true }).click();
      await preserved(
        p,
        p.getByLabel("攤位名稱", { exact: true }),
        "未儲存攤位",
      );
      await p.getByRole("button", { name: "分類", exact: true }).click();
      await p
        .getByRole("button", { name: /編輯分類/ })
        .first()
        .click();
      await preserved(
        p,
        p.getByLabel("分類名稱", { exact: true }),
        "未儲存分類",
      );
      await p.getByRole("button", { name: "設定", exact: true }).click();
      await p.getByRole("button", { name: /預設預算金額/ }).click();
      await preserved(p, p.getByLabel("預設預算", { exact: true }), "123");
      pass(
        width +
          "px: booth/category/budget changes all use the same discard guard",
      );
      await ctx.close();
    }
    assert.deepEqual(errors, []);
    ok = true;
  } finally {
    fs.writeFileSync(
      dir + "/browser-results.json",
      JSON.stringify(
        {
          passed: ok,
          results,
          errors,
          emulatorStarted: false,
          deviceVerification: "pending",
          stressTests: false,
        },
        null,
        2,
      ),
    );
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

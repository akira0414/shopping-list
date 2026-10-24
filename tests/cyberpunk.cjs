// Small isolated fixture: three products, one browser, no emulator/load test.
const { chromium, expect } = require("playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const fixture = structuredClone(require("./fixtures-v1.cjs"));
fixture.themeId = "cyberpunk";
fixture.items[1].status = "soldOut";
fixture.events[0].budget = 50;
const dir = "verification/cyberpunk";
fs.mkdirSync(dir, { recursive: true });
const results = [];
const errors = [];
function pass(s) {
  results.push(s);
  console.log("PASS: " + s);
}
async function color(locator, prop, expected) {
  await expect(locator.first()).toHaveCSS(prop, expected);
}
async function close(p) {
  await p.getByRole("button", { name: "關閉視窗", exact: true }).click();
}
function luminance(hex) {
  const v = hex
    .match(/[0-9a-f]{2}/gi)
    .map((s) => parseInt(s, 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722;
}
function ratio(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
(async () => {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--disable-gpu", "--renderer-process-limit=1"],
  });
  let ok = false;
  try {
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript((data) => {
      if (!localStorage.getItem("neon-seeded")) {
        for (const [k, v] of Object.entries(data))
          localStorage.setItem(
            k,
            ["themeId", "currentEventId"].includes(k) ? v : JSON.stringify(v),
          );
        localStorage.setItem("neon-seeded", "1");
      }
    }, fixture);
    await p.goto(process.env.TEST_URL || "http://127.0.0.1:5173");
    await expect(p.getByText("場次空間", { exact: true })).toBeVisible();
    await color(p.locator(".app-shell"), "background-color", "rgb(13, 16, 32)");
    await color(p.locator("h1"), "color", "rgb(238, 241, 255)");
    await color(p.locator(".bg-white"), "background-color", "rgb(23, 28, 48)");
    await color(
      p.locator(".bottom-nav"),
      "background-color",
      "rgb(23, 28, 48)",
    );
    await color(p.locator(".animate-pulse"), "animation-name", "none");
    await p.screenshot({ path: dir + "/events.png", fullPage: true });
    pass(
      "Existing cyberpunk ID loads new dark palette; events and nav dark; no pulse",
    );
    await p.getByRole("button", { name: "新增場次", exact: true }).click();
    await color(p.locator(".app-modal"), "background-color", "rgb(23, 28, 48)");
    await color(
      p.getByLabel("場次名稱", { exact: true }),
      "background-color",
      "rgb(32, 39, 64)",
    );
    await color(p.locator(".primary-button"), "color", "rgb(20, 17, 40)");
    await p.getByLabel("場次名稱", { exact: true }).focus();
    await color(
      p.getByLabel("場次名稱", { exact: true }),
      "outline-color",
      "rgb(179, 157, 255)",
    );
    await close(p);
    await p.getByRole("button", { name: "編輯場次 CWT 測試場次" }).click();
    await expect(p.getByRole("dialog", { name: "編輯場次" })).toBeVisible();
    await close(p);
    pass(
      "New/edit event forms use dark surfaces, readable inputs and purple/dark primary button",
    );
    await p.getByText("進入清單", { exact: true }).first().click();
    await color(
      p.locator(".budget-card"),
      "background-color",
      "rgb(23, 28, 48)",
    );
    await color(p.locator(".over-budget"), "color", "rgb(255, 155, 170)");
    await color(
      p.locator(".booth-heading"),
      "background-color",
      "rgb(23, 28, 48)",
    );
    await color(
      p.locator(".product-card"),
      "background-color",
      "rgb(23, 28, 48)",
    );
    await color(p.locator(".status-soldOut"), "color", "rgb(255, 155, 170)");
    await color(p.locator(".status-purchased"), "color", "rgb(103, 221, 229)");
    await color(
      p.locator('[data-item-id="i0"] .product-stripe'),
      "background-color",
      "rgb(102, 150, 196)",
    );
    await color(
      p.locator('[data-item-id="i1"] .product-stripe'),
      "background-color",
      "rgb(156, 163, 175)",
    );
    await color(p.locator(".product-content.is-purchased"), "opacity", "1");
    await expect(p.locator(".is-purchased .product-name")).toHaveCSS(
      "text-decoration-line",
      "line-through",
    );
    await color(p.locator(".favorite-filter"), "color", "rgb(181, 137, 0)");
    await p.locator(".favorite-filter").click();
    await color(
      p.locator(".favorite-filter"),
      "background-color",
      "rgb(74, 59, 36)",
    );
    await expect(
      p.getByText("沒有符合條件的商品", { exact: true }),
    ).toBeVisible();
    await p.locator(".favorite-filter").click();
    await p.getByLabel("搜尋商品或攤位", { exact: true }).fill("預定");
    await expect(p.locator(".product-card")).toHaveCount(1);
    await p.getByLabel("搜尋商品或攤位", { exact: true }).fill("");
    await p.screenshot({ path: dir + "/shopping.png", fullPage: true });
    pass(
      "Three statuses, over-budget, category stripes, fixed star-filter colors and search/empty state preserved",
    );
    await p.getByRole("button", { name: "新增商品", exact: true }).click();
    await color(
      p.locator(".product-image-picker"),
      "background-color",
      "rgb(32, 39, 64)",
    );
    await color(
      p.getByLabel("購買狀態", { exact: true }),
      "color",
      "rgb(238, 241, 255)",
    );
    await p.getByRole("button", { name: "儲存商品", exact: true }).click();
    await color(p.locator(".field-error"), "color", "rgb(255, 155, 170)");
    await p.screenshot({ path: dir + "/product-form.png", fullPage: true });
    await close(p);
    await p
      .getByRole("button", { name: "編輯商品 已購新刊", exact: true })
      .click();
    await color(
      p.locator(".danger-button"),
      "background-color",
      "rgb(57, 35, 51)",
    );
    await close(p);
    await p.getByRole("button", { name: "新增攤位", exact: true }).click();
    await color(
      p.getByLabel("備註（選填）", { exact: true }),
      "background-color",
      "rgb(32, 39, 64)",
    );
    await close(p);
    await p
      .getByRole("button", { name: /編輯攤位/ })
      .first()
      .click();
    await expect(p.getByRole("dialog", { name: "編輯攤位" })).toBeVisible();
    await close(p);
    pass(
      "Product add/edit, validation, upload area, native select and booth add/edit forms dark",
    );
    await p.getByRole("button", { name: "分類", exact: true }).click();
    await color(
      p.locator(".category-management-row"),
      "background-color",
      "rgb(23, 28, 48)",
    );
    await p.getByRole("button", { name: "編輯分類 新刊", exact: true }).click();
    await color(
      p.getByLabel("分類名稱", { exact: true }),
      "color",
      "rgb(238, 241, 255)",
    );
    await color(
      p.locator('.color-options button[aria-pressed="true"]'),
      "outline-color",
      "rgb(103, 221, 229)",
    );
    await close(p);
    await p.getByRole("button", { name: "新增分類", exact: true }).click();
    await expect(p.getByRole("dialog", { name: "新增分類" })).toBeVisible();
    await close(p);
    pass(
      "Category edit/add retain readable colors and clear selected swatch ring",
    );
    await p.getByRole("button", { name: "設定", exact: true }).click();
    await color(
      p.locator(".settings-card"),
      "background-color",
      "rgb(23, 28, 48)",
    );
    await p.getByRole("button", { name: /預設預算金額/ }).click();
    await color(
      p.getByLabel("預設預算", { exact: true }),
      "background-color",
      "rgb(32, 39, 64)",
    );
    await close(p);
    await p.getByRole("button", { name: /顏色主題/ }).click();
    await color(
      p.locator(".theme-option"),
      "background-color",
      "rgb(23, 28, 48)",
    );
    await p.screenshot({ path: dir + "/theme-picker.png", fullPage: true });
    await close(p);
    const backup = await p.evaluate(async () => {
      const { loadData } = await import("/src/lib/storage.js");
      const { createBackup } = await import("/src/lib/data.js");
      return createBackup(await loadData());
    });
    await p
      .getByLabel("選擇備份還原", { exact: true })
      .setInputFiles({
        name: "neon.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(backup)),
      });
    await expect(p.getByRole("dialog", { name: "確認還原備份" })).toBeVisible();
    await color(p.locator(".restore-summary"), "color", "rgb(238, 241, 255)");
    await p.getByRole("button", { name: "取消", exact: true }).click();
    pass(
      "Settings, budget, theme selector and backup confirmation use complete dark palette; cancel safe",
    );
    for (const [name, bg] of [
      ["大眾藍", "rgb(238, 235, 240)"],
      ["櫻花粉", "rgb(255, 240, 245)"],
      ["森林綠", "rgb(241, 248, 233)"],
      ["午夜黑", "rgb(245, 245, 245)"],
      ["暖陽黃", "rgb(255, 248, 231)"],
    ]) {
      await p.getByRole("button", { name: /顏色主題/ }).click();
      await p.getByRole("button", { name, exact: true }).click();
      await expect(p.getByRole("dialog")).toHaveCount(0);
      await color(p.locator(".app-shell"), "background-color", bg);
      await color(
        p.locator(".settings-card"),
        "background-color",
        "rgb(255, 255, 255)",
      );
    }
    await p.getByRole("button", { name: /顏色主題/ }).click();
    await p.getByRole("button", { name: "賽博龐克", exact: true }).click();
    await expect(p.getByRole("dialog")).toHaveCount(0);
    await expect(p.locator(".app-shell")).toHaveAttribute("data-theme", "cyberpunk");
    await p.reload();
    await color(p.locator(".app-shell"), "background-color", "rgb(13, 16, 32)");
    await p.getByRole("button", { name: "設定", exact: true }).click();
    await color(
      p.locator(".settings-card"),
      "background-color",
      "rgb(23, 28, 48)",
    );
    await p.screenshot({ path: dir + "/settings.png", fullPage: true });
    pass(
      "All five existing themes retain light cards/backgrounds; cyberpunk persists after reload",
    );
    await p.getByRole("button", { name: "場次", exact: true }).click();
    await p.getByText("進入清單", { exact: true }).nth(1).click();
    await expect(
      p.getByText("目前尚無攤位與商品", { exact: true }),
    ).toBeVisible();
    await color(p.locator(".empty-state"), "color", "rgb(171, 181, 209)");
    pass(
      "Empty event uses readable dark empty state; keyboard input focus uses purple outline",
    );
    const contrasts = [];
    for (const bg of ["#0D1020", "#171C30", "#202740"])
      for (const fg of [
        "#EEF1FF",
        "#ABB5D1",
        "#B39DFF",
        "#67DDE5",
        "#FF9BAA",
      ]) {
        const value = ratio(fg, bg);
        assert.ok(value >= 4.5, fg + " on " + bg);
        contrasts.push({
          foreground: fg,
          background: bg,
          ratio: +value.toFixed(2),
          passes: true,
        });
      }
    assert.ok(ratio("#141128", "#B39DFF") >= 4.5);
    for (const bg of ["#0D1020", "#171C30", "#202740"])
      assert.ok(ratio("#B39DFF", bg) >= 3);
    const exception = {
      foreground: "#B58900",
      background: "#4A3B24",
      ratio: +ratio("#B58900", "#4A3B24").toFixed(2),
      minimum: 4.5,
      keptByUserRequest: true,
    };
    fs.writeFileSync(
      dir + "/contrast.json",
      JSON.stringify(
        { pairs: contrasts, starFilterSelectedException: exception },
        null,
        2,
      ),
    );
    pass(
      "All theme text pairs >=4.5:1; focus/icons >=3:1; fixed selected star-filter exception recorded",
    );
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
          stressTests: false,
        },
        null,
        2,
      ),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

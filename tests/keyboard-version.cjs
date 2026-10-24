const { chromium, expect } = require("playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const data = structuredClone(require("./fixtures-v1.cjs"));
data.events[0].eventUrl = "https://example.com/event";
(async () => {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--disable-gpu", "--renderer-process-limit=1"],
  });
  const results = [];
  let passed = false;
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await p.addInitScript((d) => {
      for (const [k, v] of Object.entries(d))
        localStorage.setItem(
          k,
          ["themeId", "currentEventId"].includes(k) ? v : JSON.stringify(v),
        );
    }, data);
    await p.goto("http://127.0.0.1:5173");
    const enter = p.getByRole("button", {
      name: "進入清單 CWT 測試場次",
      exact: true,
    });
    await enter.waitFor();
    assert.equal(await p.locator("button button,button a,a button").count(), 0);
    assert.equal(await p.locator('.event-card[tabindex="0"]').count(), 0);
    await enter.focus();
    await p.keyboard.press("Tab");
    await expect(
      p.getByRole("button", { name: "編輯場次 CWT 測試場次", exact: true }),
    ).toBeFocused();
    await p.keyboard.press("Shift+Tab");
    await expect(enter).toBeFocused();
    await p.keyboard.press("Enter");
    await expect(p.locator(".shopping-page")).toBeVisible();
    results.push(
      "Native enter button supports Tab/Shift+Tab and Enter without nested controls or duplicate card focus",
    );
    await p.getByRole("button", { name: "場次", exact: true }).focus();
    await p.keyboard.press("Space");
    await enter.focus();
    await p.keyboard.press("Space");
    await expect(p.locator(".shopping-page")).toBeVisible();
    results.push("Space also activates the native enter button");
    await p.getByRole("button", { name: "場次", exact: true }).click();
    await p
      .getByRole("button", { name: "編輯場次 CWT 測試場次", exact: true })
      .focus();
    await p.keyboard.press("Enter");
    await expect(p.getByRole("dialog", { name: "編輯場次" })).toBeVisible();
    await expect(p.locator(".shopping-page")).toHaveCount(0);
    await p.keyboard.press("Escape");
    const link = p.getByRole("link", { name: "活動網站 CWT 測試場次" });
    await link.evaluate((el) =>
      el.addEventListener("click", (e) => e.preventDefault(), { once: true }),
    );
    await link.focus();
    await p.keyboard.press("Enter");
    await expect(p.locator(".shopping-page")).toHaveCount(0);
    await p
      .locator(".event-card")
      .first()
      .click({ position: { x: 20, y: 60 } });
    await expect(p.locator(".shopping-page")).toBeVisible();
    results.push(
      "Settings and activity link keyboard actions stay independent; clicking card background still enters list",
    );
    await p.getByRole("button", { name: "設定", exact: true }).click();
    await expect(p.locator(".app-version")).toHaveText("版本 1.5.0（網頁版）");
    results.push("About page explicitly labels the web version");
    passed = true;
    console.log(JSON.stringify({ passed, results }, null, 2));
  } finally {
    fs.mkdirSync("verification/keyboard-version", { recursive: true });
    fs.writeFileSync(
      "verification/keyboard-version/browser-results.json",
      JSON.stringify(
        {
          passed,
          results,
          emulatorStarted: false,
          nativeDeviceVerification: "pending",
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

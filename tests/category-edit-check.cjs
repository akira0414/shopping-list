const { chromium, expect } = require("playwright/test");
const assert = require("node:assert/strict");
const fixture = require("./fixtures-v1.cjs");
async function read(p) {
  return p.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const q = indexedDB.open("doujin-shopping-list", 1);
        q.onsuccess = () => {
          const db = q.result;
          const tx = db.transaction("state");
          const r = tx.objectStore("state").get("current");
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
(async () => {
  const b = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--disable-gpu", "--renderer-process-limit=1"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.addInitScript((data) => {
      if (!localStorage.getItem("category-test-seeded")) {
        for (const [k, v] of Object.entries(data))
          localStorage.setItem(
            k,
            ["themeId", "currentEventId"].includes(k) ? v : JSON.stringify(v),
          );
        localStorage.setItem("category-test-seeded", "true");
      }
    }, fixture);
    await p.goto("http://127.0.0.1:5173");
    await p.getByRole("button", { name: "分類", exact: true }).click();
    await p.getByRole("button", { name: "編輯分類 新刊", exact: true }).click();
    await expect(p.getByRole("dialog", { name: "編輯分類" })).toBeVisible();
    await expect(p.getByLabel("分類名稱", { exact: true })).toHaveValue("新刊");
    await p.getByLabel("分類名稱", { exact: true }).fill("   ");
    await p.getByRole("button", { name: "儲存分類", exact: true }).click();
    await expect(p.getByText("請填寫分類名稱", { exact: true })).toBeVisible();
    await p.getByLabel("分類名稱", { exact: true }).fill("  改名新刊  ");
    const colors = p.locator(".color-options button");
    const color = await colors.nth(1).getAttribute("aria-label");
    await colors.nth(1).click();
    await p.getByRole("button", { name: "儲存分類", exact: true }).click();
    await expect(p.getByRole("dialog")).toHaveCount(0);
    let d = await read(p);
    assert.equal(d.categories.length, 1);
    assert.equal(d.categories[0].id, "c1");
    assert.equal(d.categories[0].name, "改名新刊");
    assert.equal(d.categories[0].color, color.replace("分類顏色 ", ""));
    assert.equal(d.items[0].categoryId, "c1");
    await p.reload();
    await p.getByRole("button", { name: "分類", exact: true }).click();
    await p
      .getByRole("button", { name: "編輯分類 改名新刊", exact: true })
      .click();
    await p.getByLabel("分類名稱", { exact: true }).fill("取消變更");
    await p.getByRole("button", { name: "取消", exact: true }).click();
    await expect(
      p.getByRole("dialog", { name: "尚有未儲存的變更" }),
    ).toBeVisible();
    await p.getByRole("button", { name: "捨棄變更", exact: true }).click();
    assert.equal((await read(p)).categories[0].name, "改名新刊");
    await p.getByRole("button", { name: "新增分類", exact: true }).click();
    await expect(p.getByRole("dialog", { name: "新增分類" })).toBeVisible();
    await expect(p.getByLabel("分類名稱", { exact: true })).toHaveValue("");
    console.log(
      "PASS: edit prefills name/color; empty rejected; trimmed save keeps category ID and item links; reload persists; cancel and add reset verified",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

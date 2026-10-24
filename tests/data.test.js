import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyData,
  validateData,
  reorderByIds,
  createBackup,
  parseBackup,
  validMoney,
  validWebUrl,
  migrateData,
  UNASSIGNED,
} from "../src/lib/data.js";
function legacyFixture() {
  return {
    ...emptyData(),
    schemaVersion: 1,
    currentEventId: "event",
    events: [
      {
        id: "event",
        name: "CWT",
        budget: 5000,
        date: "",
        location: "",
        markers: [
          { id: "mark", eventId: "event", boothNumber: "A01", x: 25, y: 50 },
        ],
      },
    ],
    categories: [{ id: "cat", name: "新刊", color: "#6696C4" }],
    items: [
      {
        id: "one",
        name: "商品一",
        eventId: "event",
        categoryId: "cat",
        boothNumber: "A01",
        price: 350,
        status: "pending",
        imageUrl: "data:image/png;base64,YQ==",
      },
      {
        id: "two",
        name: "商品二",
        eventId: "event",
        categoryId: null,
        boothNumber: "A01",
        price: 200,
        status: "purchased",
      },
      {
        id: "three",
        name: "商品三",
        eventId: "event",
        categoryId: null,
        boothNumber: "B02",
        price: 0,
        status: "soldOut",
      },
    ],
    boothOrder: { event: ["A01", "B02"] },
  };
}
function fixture() {
  return migrateData(legacyFixture());
}
test("optional event URL validates, trims and survives backup without requiring old records to have it", () => {
  const data = fixture();
  assert.equal(validateData(data).events[0].eventUrl, undefined);
  for (const value of [
    "javascript:alert(1)",
    "file:///tmp/test",
    "not a url",
    "example.com",
    "http:example.com",
  ]) {
    data.events[0].eventUrl = value;
    assert.throws(() => validateData(data));
    assert.equal(validWebUrl(value), false);
  }
  data.events[0].eventUrl = "  https://example.com/event  ";
  assert.equal(
    validateData(data).events[0].eventUrl,
    "https://example.com/event",
  );
  assert.equal(
    parseBackup(JSON.stringify(createBackup(data))).data.events[0].eventUrl,
    "https://example.com/event",
  );
  data.events[0].eventUrl = "";
  assert.equal(validateData(data).events[0].eventUrl, "");
});
test("backup round-trip preserves images, markers, order and settings", () => {
  const data = fixture();
  assert.deepEqual(parseBackup(JSON.stringify(createBackup(data))).data, data);
});
test("partial, duplicate or foreign reorder cannot delete hidden items", () => {
  const data = fixture(),
    eligible = (i) => i.boothId === data.items[0].boothId;
  assert.throws(() => reorderByIds(data.items, [data.items[0]], eligible));
  assert.throws(() =>
    reorderByIds(data.items, [data.items[0], data.items[0]], eligible),
  );
  const ordered = reorderByIds(
    data.items,
    [data.items[1], data.items[0]],
    eligible,
  );
  assert.deepEqual(
    ordered.map((i) => i.id),
    ["two", "one", "three"],
  );
  assert.deepEqual(
    [...ordered].sort((a, b) => a.id.localeCompare(b.id)),
    [...data.items].sort((a, b) => a.id.localeCompare(b.id)),
  );
});
test("reject unsupported, malformed and unrelated backups", () => {
  assert.throws(() => parseBackup("bad"));
  assert.throws(() => parseBackup("{}"));
  assert.throws(() =>
    parseBackup(
      JSON.stringify({ ...createBackup(fixture()), formatVersion: 99 }),
    ),
  );
  const bad = fixture();
  bad.items[0].eventId = "absent";
  assert.throws(() => validateData(bad));
  const duplicate = fixture();
  duplicate.items.push(duplicate.items[0]);
  assert.throws(() => validateData(duplicate));
});
test("legacy repair preserves records and resolves stale category/current event", () => {
  const data = legacyFixture();
  data.items[0].categoryId = "deleted";
  data.currentEventId = "deleted";
  const repaired = migrateData(data);
  assert.equal(repaired.items.length, 3);
  assert.equal(repaired.items[0].categoryId, null);
  assert.equal(repaired.currentEventId, "event");
  assert.equal(data.items[0].categoryId, "deleted");
});
test("reject invalid names, money, statuses, markers and order", () => {
  for (const mutate of [
    (d) => (d.items[0].name = "   "),
    (d) => (d.items[0].price = -1),
    (d) => (d.events[0].budget = NaN),
    (d) => (d.items[0].status = "other"),
    (d) => (d.events[0].markers[0].x = 101),
    (d) => d.boothOrder.event.push("A01"),
  ]) {
    const data = fixture();
    mutate(data);
    assert.throws(() => validateData(data));
  }
  for (const value of ["", " ", "-1", "NaN", "Infinity"])
    assert.equal(validMoney(value), false);
  for (const value of ["0", "500", "10.5"])
    assert.equal(validMoney(value), true);
});

test("v1 migration creates stable event-scoped booths, preserves order/photos/markers and defaults stars", () => {
  const old = legacyFixture();
  const data = migrateData(old);
  assert.equal(data.schemaVersion, 2);
  assert.equal(data.booths.length, 2);
  assert.equal(data.items[0].boothId, data.items[1].boothId);
  assert.equal(data.events[0].markers[0].boothId, data.items[0].boothId);
  assert.ok(
    data.items.every(
      (item) => item.favorite === false && !("boothNumber" in item),
    ),
  );
  assert.equal(data.items[0].imageUrl, old.items[0].imageUrl);
  assert.deepEqual(
    data.boothOrder.event,
    data.booths.map((b) => b.id),
  );
  assert.deepEqual(migrateData(old), data);
  assert.equal(old.items[0].boothNumber, "A01");
  const parsed = parseBackup(
    JSON.stringify({
      app: "com.doujin.shoppinglist",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      data: old,
    }),
  );
  assert.deepEqual(parsed.data, data);
});
test("blank old booth numbers remain unassigned and empty booths round-trip", () => {
  const old = legacyFixture();
  old.items[0].boothNumber = "";
  const data = migrateData(old);
  assert.equal(data.items[0].boothId, null);
  assert.ok(data.boothOrder.event.includes(UNASSIGNED));
  data.booths.push({
    id: "empty",
    eventId: "event",
    name: "空攤位",
    number: "",
    imageUrl: "",
    linkLabel: "",
    url: "",
    notes: "之後新增商品",
  });
  data.boothOrder.event.push("empty");
  assert.deepEqual(parseBackup(JSON.stringify(createBackup(data))).data, data);
});
test("booth edits retain product IDs and stars; duplicates and cross-event links reject", () => {
  const data = fixture();
  data.items[0].favorite = true;
  data.booths[0].name = "新攤名";
  data.booths[0].number = "Z99";
  const checked = validateData(data);
  assert.equal(checked.items[0].boothId, data.items[0].boothId);
  assert.ok(checked.items[0].favorite);
  const duplicate = fixture();
  duplicate.booths[1].number = " a01 ";
  assert.throws(() => validateData(duplicate));
  const bad = fixture();
  bad.booths[0].eventId = "absent";
  assert.throws(() => validateData(bad));
  const wrong = fixture();
  wrong.items[0].favorite = "yes";
  assert.throws(() => validateData(wrong));
});
test("six themes validate, sunshine is before cyberpunk, and linked booth URL is safe", async () => {
  const { THEMES } = await import("../src/config/themes.js");
  assert.equal(
    THEMES.findIndex((t) => t.id === "sunshine") + 1,
    THEMES.findIndex((t) => t.id === "cyberpunk"),
  );
  for (const theme of THEMES) {
    const data = fixture();
    data.themeId = theme.id;
    assert.equal(validateData(data).themeId, theme.id);
  }
  const data = fixture();
  data.booths[0].linkLabel = "社群";
  assert.throws(() => validateData(data));
  data.booths[0].url = "javascript:alert(1)";
  assert.throws(() => validateData(data));
  data.booths[0].url = "https://example.com/";
  assert.equal(validateData(data).booths[0].linkLabel, "社群");
});

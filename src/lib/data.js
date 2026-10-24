import { THEMES } from "../config/themes.js";
export const APP_NAME = "場購清單";
export const APP_VERSION = "1.5.0";
export const DATA_VERSION = 2;
export const UNASSIGNED = "__unassigned__";
export const normalizeBoothNumber = (value) =>
  value.trim().normalize("NFKC").toLocaleUpperCase();
export const DB_NAME = "doujin-shopping-list";
export const emptyData = () => ({
  schemaVersion: DATA_VERSION,
  events: [],
  booths: [],
  categories: [],
  items: [],
  currentEventId: "",
  themeId: "default",
  defaultBudget: 5000,
  boothOrder: {},
});
export const validMoney = (value) =>
  String(value).trim() !== "" &&
  Number.isFinite(Number(value)) &&
  Number(value) >= 0;
export const validWebUrl = (value) => {
  if (typeof value !== "string") return false;
  if (!value.trim()) return true;
  if (!/^https?:\/\//i.test(value.trim())) return false;
  try {
    return ["http:", "https:"].includes(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
};
const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const requireValue = (ok, text) => {
  if (!ok) throw new Error(text);
};
const text = (v) => typeof v === "string";
const name = (v) => text(v) && !!v.trim();
function validateLegacyData(raw, { legacy = false } = {}) {
  requireValue(object(raw), "資料格式不正確");
  const data = structuredClone(raw);
  for (const key of ["events", "categories", "items"]) {
    requireValue(Array.isArray(data[key]), `${key} 必須為清單`);
    const ids = new Set();
    for (const row of data[key]) {
      requireValue(
        object(row) && name(row.id) && !ids.has(row.id) && name(row.name),
        `${key} 包含無效或重複的項目`,
      );
      ids.add(row.id);
      row.name = row.name.trim();
    }
  }
  const events = new Set(data.events.map((e) => e.id));
  const categories = new Set(data.categories.map((c) => c.id));
  for (const e of data.events) {
    requireValue(
      typeof e.budget === "number" && validMoney(e.budget),
      "場次預算不正確",
    );
    requireValue(text(e.date) && text(e.location), "場次資訊不正確");
    requireValue(
      e.eventUrl == null || validWebUrl(e.eventUrl),
      "活動網址需以 http:// 或 https:// 開頭",
    );
    if (e.eventUrl != null) e.eventUrl = e.eventUrl.trim();
    requireValue(
      e.mapImageUrl == null || text(e.mapImageUrl),
      "地圖網址不正確",
    );
    const markerIds = new Set();
    requireValue(
      e.markers == null || Array.isArray(e.markers),
      "地圖標記不正確",
    );
    for (const m of e.markers || []) {
      requireValue(
        object(m) &&
          name(m.id) &&
          !markerIds.has(m.id) &&
          m.eventId === e.id &&
          name(m.boothNumber) &&
          Number.isFinite(m.x) &&
          m.x >= 0 &&
          m.x <= 100 &&
          Number.isFinite(m.y) &&
          m.y >= 0 &&
          m.y <= 100 &&
          (m.url == null || text(m.url)),
        "地圖標記不正確",
      );
      markerIds.add(m.id);
    }
  }
  for (const c of data.categories)
    requireValue(
      text(c.color) && /^#[0-9a-f]{6}$/i.test(c.color),
      "分類顏色不正確",
    );
  for (const i of data.items) {
    requireValue(
      events.has(i.eventId) &&
        typeof i.price === "number" &&
        validMoney(i.price) &&
        text(i.boothNumber),
      "商品價格或場次關聯不正確",
    );
    requireValue(
      ["pending", "purchased", "soldOut"].includes(i.status),
      "商品狀態不正確",
    );
    requireValue(
      (i.url == null || text(i.url)) &&
        (i.imageUrl == null || text(i.imageUrl)),
      "商品圖片或連結不正確",
    );
    if (legacy && i.categoryId && !categories.has(i.categoryId))
      i.categoryId = null;
    requireValue(
      i.categoryId == null || categories.has(i.categoryId),
      "商品分類關聯不正確",
    );
  }
  requireValue(
    text(data.currentEventId) &&
      text(data.themeId) &&
      typeof data.defaultBudget === "number" &&
      validMoney(data.defaultBudget),
    "設定資料不正確",
  );
  requireValue(
    THEMES.map((theme) => theme.id).includes(data.themeId),
    "主題不正確",
  );
  if (legacy && !events.has(data.currentEventId))
    data.currentEventId = data.events[0]?.id || "";
  requireValue(
    data.currentEventId === "" || events.has(data.currentEventId),
    "目前場次不存在",
  );
  requireValue(object(data.boothOrder), "攤位排序不正確");
  for (const [eventId, order] of Object.entries(data.boothOrder))
    requireValue(
      events.has(eventId) &&
        Array.isArray(order) &&
        order.every(text) &&
        new Set(order).size === order.length,
      "攤位排序不正確",
    );
  return data;
}
export function migrateData(raw) {
  requireValue(object(raw), "資料格式不正確");
  if (raw.schemaVersion === DATA_VERSION) return validateData(raw);
  requireValue(
    raw.schemaVersion == null || raw.schemaVersion === 1,
    "不支援此資料版本",
  );
  const old = validateLegacyData(raw, { legacy: true });
  const booths = [],
    lookup = new Map();
  const keyFor = (eventId, number) =>
    `${encodeURIComponent(eventId)}|${encodeURIComponent(normalizeBoothNumber(number))}`;
  const items = old.items.map((item) => {
    const { boothNumber, ...rest } = item;
    let boothId = null;
    if (boothNumber.trim()) {
      const key = keyFor(item.eventId, boothNumber);
      if (!lookup.has(key)) {
        const booth = {
          id: `legacy-booth:${key}`,
          eventId: item.eventId,
          name: boothNumber.trim(),
          number: normalizeBoothNumber(boothNumber),
          imageUrl: "",
          linkLabel: "",
          url: "",
          notes: "",
        };
        booths.push(booth);
        lookup.set(key, booth.id);
      }
      boothId = lookup.get(key);
    }
    return { ...rest, boothId, favorite: false };
  });
  const boothOrder = {};
  const events = old.events.map((event) => {
    const order = (old.boothOrder[event.id] || [])
      .map((number) =>
        number === "未分類攤位"
          ? UNASSIGNED
          : lookup.get(keyFor(event.id, number)),
      )
      .filter(Boolean);
    order.push(
      ...booths.filter((b) => b.eventId === event.id).map((b) => b.id),
    );
    if (items.some((i) => i.eventId === event.id && i.boothId === null))
      order.push(UNASSIGNED);
    boothOrder[event.id] = [...new Set(order)];
    return {
      ...event,
      ...(event.markers
        ? {
            markers: event.markers.map((marker) => ({
              ...marker,
              boothId: lookup.get(keyFor(event.id, marker.boothNumber)) || null,
            })),
          }
        : {}),
    };
  });
  return validateData({
    ...old,
    schemaVersion: DATA_VERSION,
    events,
    booths,
    items,
    boothOrder,
  });
}
export function validateData(raw) {
  requireValue(
    object(raw) &&
      raw.schemaVersion === DATA_VERSION &&
      Array.isArray(raw.booths) &&
      Array.isArray(raw.items),
    "資料版本或攤位資料不正確",
  );
  const data = structuredClone(raw);
  const boothIds = new Map(),
    numbers = new Set();
  for (const booth of data.booths) {
    requireValue(
      object(booth) &&
        name(booth.id) &&
        booth.id !== UNASSIGNED &&
        !boothIds.has(booth.id) &&
        name(booth.name) &&
        text(booth.eventId),
      "攤位包含無效或重複的項目",
    );
    for (const field of ["number", "imageUrl", "linkLabel", "url", "notes"])
      requireValue(text(booth[field]), "攤位欄位不正確");
    booth.name = booth.name.trim();
    booth.number = normalizeBoothNumber(booth.number);
    booth.linkLabel = booth.linkLabel.trim();
    booth.url = booth.url.trim();
    requireValue(!booth.linkLabel || !!booth.url, "填寫連結名稱後，請補上網址");
    if (booth.url) {
      let url;
      try {
        url = new URL(booth.url);
      } catch {}
      requireValue(
        url && ["http:", "https:"].includes(url.protocol),
        "攤位網址需以 http:// 或 https:// 開頭",
      );
    }
    if (booth.number) {
      const key = JSON.stringify([booth.eventId, booth.number]);
      requireValue(!numbers.has(key), "同一場次的攤位號碼不可重複");
      numbers.add(key);
    }
    boothIds.set(booth.id, booth);
  }
  for (const item of data.items) {
    requireValue(
      object(item) &&
        (item.boothId === null || boothIds.has(item.boothId)) &&
        typeof item.favorite === "boolean",
      "商品攤位或星號資料不正確",
    );
    if (item.boothId !== null)
      requireValue(
        boothIds.get(item.boothId).eventId === item.eventId,
        "商品不可關聯其他場次的攤位",
      );
    delete item.boothNumber;
  }
  // Reuse the existing event, category, marker and monetary checks without duplicating them.
  const checked = validateLegacyData({
    ...data,
    items: data.items.map((item) => ({
      ...item,
      boothNumber: item.boothId ? boothIds.get(item.boothId).number : "",
    })),
  });
  const eventIds = new Set(checked.events.map((event) => event.id));
  for (const booth of data.booths)
    requireValue(eventIds.has(booth.eventId), "攤位所屬場次不存在");
  for (const [eventId, order] of Object.entries(data.boothOrder))
    for (const id of order)
      requireValue(
        id === UNASSIGNED || boothIds.get(id)?.eventId === eventId,
        "攤位排序包含不存在的攤位",
      );
  for (const event of data.events)
    for (const marker of event.markers || [])
      requireValue(
        marker.boothId == null ||
          boothIds.get(marker.boothId)?.eventId === event.id,
        "地圖標記的攤位關聯不正確",
      );
  return {
    ...checked,
    booths: data.booths,
    items: checked.items.map(({ boothNumber, ...item }) => item),
  };
}
export function reorderByIds(all, ordered, eligible) {
  const ids = ordered.map((i) => i.id);
  const allowed = all.filter(eligible);
  if (
    ids.length !== allowed.length ||
    new Set(ids).size !== ids.length ||
    allowed.some((i) => !ids.includes(i.id))
  )
    throw new Error("排序資料已變更，請重試");
  const lookup = new Map(all.map((i) => [i.id, i]));
  let index = 0;
  return all.map((i) => (eligible(i) ? lookup.get(ids[index++]) : i));
}
export function createBackup(data) {
  return {
    app: "com.doujin.shoppinglist",
    formatVersion: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    data: validateData(data),
  };
}
export function parseBackup(content) {
  let backup;
  try {
    backup = JSON.parse(content);
  } catch {
    throw new Error("不是有效的 JSON 備份檔");
  }
  requireValue(
    object(backup) && backup.app === "com.doujin.shoppinglist",
    "不是場購清單的備份檔",
  );
  requireValue(
    [1, DATA_VERSION].includes(backup.formatVersion),
    "不支援此備份版本，請使用相容的 App",
  );
  requireValue(
    text(backup.exportedAt) && Number.isFinite(Date.parse(backup.exportedAt)),
    "備份時間不正確",
  );
  if (backup.formatVersion === 1)
    requireValue(
      backup.data?.schemaVersion == null || backup.data.schemaVersion === 1,
      "備份版本與資料不一致",
    );
  return {
    ...backup,
    data:
      backup.formatVersion === 1
        ? migrateData(backup.data)
        : validateData(backup.data),
  };
}

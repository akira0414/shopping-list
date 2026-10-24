import {
  DB_NAME,
  emptyData,
  validateData,
  migrateData,
  DATA_VERSION,
} from "./data.js";
let database;
let initialization;
function openDatabase() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("state");
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          database = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        database = null;
        reject(request.error);
      };
      request.onblocked = () => {
        database = null;
        reject(new Error("資料庫被其他視窗占用，請關閉其他視窗後重試"));
      };
    });
  return database;
}
async function readState() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readonly");
    const request = tx.objectStore("state").get("current");
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error || new Error("讀取失敗"));
    tx.onerror = () => {};
  });
}
export async function saveData(data, { legacySnapshot } = {}) {
  const checked = validateData(data);
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.oncomplete = resolve;
    tx.onabort = () =>
      reject(tx.error || new Error("儲存失敗，請檢查可用空間"));
    tx.onerror = () => {};
    try {
      if (legacySnapshot) tx.objectStore("state").put(legacySnapshot, "pre-v2");
      tx.objectStore("state").put(checked, "current");
    } catch (error) {
      tx.abort();
      reject(error);
    }
  });
  return checked;
}
async function initializeData() {
  const current = await readState();
  if (current !== undefined) {
    if (current.schemaVersion === DATA_VERSION) return validateData(current);
    return saveData(migrateData(current), { legacySnapshot: current });
  }
  const legacy = emptyData();
  delete legacy.schemaVersion;
  delete legacy.booths;
  for (const key of Object.keys(legacy)) {
    const value = localStorage.getItem(key);
    if (value === null) continue;
    if (["currentEventId", "themeId"].includes(key)) legacy[key] = value;
    else {
      try {
        legacy[key] = JSON.parse(value);
      } catch {
        throw new Error(`舊資料 ${key} 無法讀取，原資料已保留`);
      }
    }
  }
  return saveData(migrateData(legacy));
}
export async function loadData() {
  // React StrictMode can request initial loading twice; migrate only once.
  if (!initialization)
    initialization = initializeData().finally(() => {
      initialization = null;
    });
  return initialization;
}

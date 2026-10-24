// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.
import { EMPTY_ITEMS } from "./../config/defaults.js";

export function normalizeItems(a) {
  return Array.isArray(a) ? a : EMPTY_ITEMS;
}

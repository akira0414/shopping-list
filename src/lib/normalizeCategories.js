// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.
import { EMPTY_CATEGORIES } from "./../config/defaults.js";

export function normalizeCategories(a) {
  return Array.isArray(a) ? a : EMPTY_CATEGORIES;
}

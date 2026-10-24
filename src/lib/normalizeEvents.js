// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.
import { EMPTY_EVENTS } from "./../config/defaults.js";

export function normalizeEvents(a) {
  return Array.isArray(a) ? a : EMPTY_EVENTS;
}

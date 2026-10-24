// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.

export function createId() {
  return typeof crypto < "u" && typeof crypto.randomUUID == "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

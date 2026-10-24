// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.

export function readJson(a, l) {
  const s = localStorage.getItem(a);
  if (!s) return l;
  try {
    return JSON.parse(s);
  } catch {
    return l;
  }
}

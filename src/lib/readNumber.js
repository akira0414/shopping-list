// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.

export function readNumber(a, l) {
  const s = localStorage.getItem(a);
  if (s === null) return l;
  const o = Number(s);
  return Number.isFinite(o) ? o : l;
}

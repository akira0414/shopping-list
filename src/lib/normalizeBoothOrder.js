// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.

export function normalizeBoothOrder(a) {
  if (!a || typeof a != "object") return {};
  const l = {};
  for (const [s, o] of Object.entries(a))
    l[s] = Array.isArray(o) ? o.filter((c) => typeof c == "string") : [];
  return l;
}

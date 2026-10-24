// Recovered from doujin-shopping-list.apk; original local names may be abbreviated.

export function readString(a, l = "") {
  return localStorage.getItem(a) ?? l;
}

// Search tolerant to typos (home page): every word of the query must start a word of the text, or
// be within a small edit distance of one (1 for 5–7 letters, 2 from 8). Accents and case ignored.

export const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/œ/g, "oe").replace(/æ/g, "ae").toLowerCase();

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export function fuzzyMatch(text: string, query: string): boolean {
  const words = fold(text).split(/[^a-z0-9]+/).filter(Boolean);
  const terms = fold(query).split(/[^a-z0-9]+/).filter(Boolean);
  if (terms.length === 0) return true;
  return terms.every((t) => {
    const tolerance = t.length >= 8 ? 2 : t.length >= 5 ? 1 : 0;
    return words.some((w) => w.startsWith(t) || (tolerance > 0 && Math.abs(w.length - t.length) <= tolerance && distance(w, t) <= tolerance));
  });
}

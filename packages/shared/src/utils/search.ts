// Fuzzy search utility
export function fuzzyMatch(query: string, target: string): boolean {
  query = query.toLowerCase();
  target = target.toLowerCase();

  let queryIndex = 0;
  for (let i = 0; i < target.length && queryIndex < query.length; i++) {
    if (target[i] === query[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === query.length;
}

export function rankSearchResults<T extends { stop_name: string }>(
  query: string,
  items: T[]
): T[] {
  const q = query.toLowerCase();

  return items
    .map(item => ({
      item,
      score: item.stop_name.toLowerCase().startsWith(q) ? 2 :
             item.stop_name.toLowerCase().includes(q) ? 1 : 0
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

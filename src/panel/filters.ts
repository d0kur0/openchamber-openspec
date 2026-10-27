import type { BoardCard } from "./board-view.js";
import type { Sort } from "./preferences.js";
export type Filters = { query: string; stage: string; attention: boolean; sort: Sort };
export function selectCards(cards: BoardCard[], filters: Filters): BoardCard[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return cards
    .filter(
      (card) =>
        (filters.stage === "all" || card.change.stage === filters.stage) &&
        (!filters.attention || card.stale || card.unavailable) &&
        `${card.change.id} ${card.change.goal ?? ""} ${card.change.affectedAreas.join(" ")}`
          .toLocaleLowerCase()
          .includes(query),
    )
    .sort((a, b) => {
      const ca = a.change,
        cb = b.change;
      const ratio = (c: typeof ca) => (c.totalTasks ? c.completedTasks / c.totalTasks : 0);
      const result =
        filters.sort === "progress"
          ? ratio(cb) - ratio(ca)
          : filters.sort === "remaining"
            ? cb.totalTasks - cb.completedTasks - (ca.totalTasks - ca.completedTasks)
            : (ca.goal || ca.id).localeCompare(cb.goal || cb.id, undefined, { numeric: true });
      return result || ca.id.localeCompare(cb.id);
    });
}

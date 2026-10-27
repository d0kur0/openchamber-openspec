export function normalizeJiraBase(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}
export function jiraKeys(text: string): string[] {
  return [
    ...new Set(
      Array.from(
        text.matchAll(/(?<![\p{L}\p{N}_])[A-Z][A-Z0-9_]*-\d+(?![\p{L}\p{N}_])/gu),
        (m) => m[0],
      ),
    ),
  ];
}
export function jiraUrl(base: string, key: string): string | null {
  const safe = normalizeJiraBase(base);
  return safe && jiraKeys(key).includes(key) ? `${safe}/browse/${encodeURIComponent(key)}` : null;
}
const headings: Record<string, string> = {
  why: "Зачем",
  "what changes": "Что меняем",
  impact: "Что затрагиваем",
  compatibility: "Совместимость",
  modifiability: "Изменяемость",
  modifyability: "Изменяемость",
  purpose: "Назначение",
  requirements: "Требования",
  capabilities: "Возможности",
  "new capabilities": "Новые возможности",
  "modified capabilities": "Изменяемые возможности",
  context: "Контекст",
  "goals / non-goals": "Цели и границы",
  goals: "Цели",
  "non-goals": "Вне задачи",
  decisions: "Решения",
  "risks / trade-offs": "Риски и компромиссы",
  "migration plan": "План перехода",
  "open questions": "Открытые вопросы",
  "added requirements": "Новые требования",
  "modified requirements": "Изменённые требования",
  "removed requirements": "Удалённые требования",
  "renamed requirements": "Переименованные требования",
};
export function russianHeading(text: string): string {
  return (
    headings[text.trim().toLowerCase()] ??
    text.replace(/^(Requirement|Scenario):\s*/i, (_, type: string) =>
      type.toLowerCase() === "requirement" ? "Требование: " : "Сценарий: ",
    )
  );
}
export function russianMarker(text: string): string {
  return (
    (
      {
        WHEN: "КОГДА",
        THEN: "ТО",
        GIVEN: "ДАНО",
        AND: "И",
        SHALL: "ДОЛЖЕН",
        MUST: "ОБЯЗАН",
        SHOULD: "СЛЕДУЕТ",
        MAY: "МОЖЕТ",
      } as Record<string, string>
    )[text] ?? text
  );
}

import assert from "node:assert/strict";
import test from "node:test";
import { selectCards, preferences, restorePreferences, t } from "../build/studio-model.mjs";
const card = (id, goal, stage, done, total, extra = {}) => ({
  change: {
    id,
    goal,
    stage,
    completedTasks: done,
    totalTasks: total,
    affectedAreas: ["reports"],
  },
  stale: false,
  unavailable: false,
  ...extra,
});
const cards = [
  card("sample-101", "Планирование отчёта", "planning", 0, 0),
  card("sample-202", "Готовность сервиса", "progress", 1, 4, { stale: true }),
  card("sample-303", "Отчёт о продажах", "complete", 4, 4),
];
const filters = { query: "", stage: "all", attention: false, sort: "name" };
test("filters combine stage, case-insensitive Cyrillic, id and affected areas without mutating input", () => {
  assert.deepEqual(
    selectCards(cards, { ...filters, query: "ПЛАНИРОВАНИЕ" }).map((c) => c.change.id),
    ["sample-101"],
  );
  assert.equal(selectCards(cards, { ...filters, query: "REPORTS" }).length, 3);
  assert.equal(selectCards(cards, { ...filters, query: "202", stage: "complete" }).length, 0);
  assert.deepEqual(
    selectCards(cards, { ...filters, stage: "progress", attention: true }).map((c) => c.change.id),
    ["sample-202"],
  );
  assert.equal(cards[0].change.id, "sample-101");
});
test("sorts by completion and remaining work with deterministic zero-task handling", () => {
  assert.deepEqual(
    selectCards(cards, { ...filters, sort: "progress" }).map((c) => c.change.id),
    ["sample-303", "sample-202", "sample-101"],
  );
  assert.equal(selectCards(cards, { ...filters, sort: "remaining" })[0].change.id, "sample-202");
});
test("Russian is default, English is selectable, persisted values are validated", () => {
  restorePreferences({
    locale: "ru",
    view: "list",
    sort: "remaining",
    stage: "progress",
    attention: true,
  });
  assert.equal(t("Tasks"), "Задачи");
  assert.equal(preferences.view, "list");
  restorePreferences({ locale: "en", view: "board" });
  assert.equal(t("Tasks"), "Tasks");
  assert.equal(t("apply"), "Implement");
  restorePreferences({
    locale: "broken",
    view: "oops",
    sort: "oops",
    stage: "oops",
    attention: "yes",
  });
  assert.equal(t("Tasks"), "Задачи");
  assert.equal(preferences.view, "board");
  assert.equal(preferences.stage, "all");
  assert.equal(preferences.attention, false);
});

test("Jira URLs validate the base, preserve context paths and require complete keys", async () => {
  const { normalizeJiraBase, jiraKeys, jiraUrl, russianHeading } =
    await import("../build/studio-model.mjs");
  assert.equal(normalizeJiraBase("javascript:alert(1)"), null);
  assert.equal(normalizeJiraBase("https://user:pass@example.com"), null);
  assert.equal(normalizeJiraBase("https://example.com?q=1"), null);
  assert.equal(
    jiraUrl("https://example.com/jira/", "DEMO-42"),
    "https://example.com/jira/browse/DEMO-42",
  );
  assert.equal(jiraUrl("", "DEMO-42"), null);
  assert.deepEqual(jiraKeys("DEMO-42 и DEMO-42; TEST-7. foo-DEMO-4x"), ["DEMO-42", "TEST-7"]);
  assert.equal(russianHeading("Why"), "Зачем");
  assert.equal(russianHeading("Scenario: Проверка"), "Сценарий: Проверка");
  assert.equal(russianHeading("Неизвестный раздел"), "Неизвестный раздел");
});

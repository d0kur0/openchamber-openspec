import { normalizeJiraBase } from "./presentation.js";
export type Locale = "ru" | "en";
export type View = "board" | "list";
export type Sort = "name" | "progress" | "remaining";
export const preferences = {
  locale: "ru" as Locale,
  view: "board" as View,
  sort: "name" as Sort,
  stage: "all",
  attention: false,
  jiraBase: "",
};
let persist = () => {};
export function onPersist(save: () => void) {
  persist = save;
}
export function savePreferences() {
  persist();
}
export function restorePreferences(value: unknown) {
  if (!value || typeof value !== "object") return;
  const p = value as Record<string, unknown>;
  preferences.jiraBase = normalizeJiraBase(p.jiraBase) ?? "";
  preferences.locale = p.locale === "en" ? "en" : "ru";
  preferences.stage = ["all", "planning", "ready", "progress", "complete"].includes(String(p.stage))
    ? String(p.stage)
    : "all";
  preferences.attention = p.attention === true;
  preferences.view = p.view === "list" ? "list" : "board";
  preferences.sort = p.sort === "progress" || p.sort === "remaining" ? p.sort : "name";
}

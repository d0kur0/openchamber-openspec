import { normalizeJiraBase } from "./panel/presentation.js";
import { connectHost } from "@openchamber/sdk";
import { applyHostReady } from "@openchamber/sdk/ui";
import { mountController } from "./panel/controller.js";
import {
  preferences,
  restorePreferences,
  onPersist,
  savePreferences,
} from "./panel/preferences.js";
import { t } from "./panel/i18n.js";
const root = document.querySelector<HTMLElement>("#root");
if (!root) throw new Error("Panel root is missing");
const host = connectHost();
const bar = document.createElement("header");
bar.className = "studio-header";
const brand = document.createElement("div");
brand.className = "studio-brand";
brand.innerHTML =
  '<span class="studio-logo" aria-hidden="true">S</span><div><strong>OpenSpec Studio</strong><span class="studio-subtitle"></span></div>';
const language = document.createElement("select");
language.className = "language-select";
language.add(new Option("Русский", "ru"));
language.add(new Option("English", "en"));
language.value = preferences.locale;
const status = document.createElement("span");
status.className = "preference-status";
status.setAttribute("role", "status");
const body = document.createElement("div");
body.className = "studio-body";
bar.append(brand, status, language);
const settings = document.createElement("details");
settings.className = "studio-settings";
const summary = document.createElement("summary");
const jiraLabel = document.createElement("label");
const jiraInput = document.createElement("input");
jiraInput.type = "url";
jiraInput.placeholder = "https://jira.example.com";
const jiraSave = document.createElement("button");
jiraSave.type = "button";
const jiraStatus = document.createElement("span");
jiraStatus.setAttribute("role", "status");
jiraLabel.append(jiraInput);
settings.append(summary, jiraLabel, jiraSave, jiraStatus);
root.append(bar, settings, body);
jiraSave.onclick = () => {
  const base = normalizeJiraBase(jiraInput.value);
  if (base === null) {
    jiraStatus.textContent =
      preferences.locale === "ru"
        ? "Укажите HTTP(S)-адрес без пароля, параметров и якоря"
        : "Enter an HTTP(S) URL without credentials, query or fragment";
    return;
  }
  preferences.jiraBase = base;
  remount();
  savePreferences();
  jiraStatus.textContent = preferences.locale === "ru" ? "Сохранено" : "Saved";
};
let unmount = mountController(host, body),
  disposed = false,
  loaded = false,
  touched = false;
function labels() {
  summary.textContent = preferences.locale === "ru" ? "Настройки ссылок" : "Link settings";
  jiraInput.setAttribute(
    "aria-label",
    preferences.locale === "ru" ? "Адрес Jira" : "Jira base URL",
  );
  jiraInput.value = preferences.jiraBase;
  jiraSave.textContent = preferences.locale === "ru" ? "Сохранить" : "Save";
  language.value = preferences.locale;
  language.setAttribute("aria-label", t("Interface language"));
  brand.querySelector(".studio-subtitle")!.textContent = t("Read-only planning view");
  document.documentElement.lang = preferences.locale;
}
function remount() {
  unmount();
  body.replaceChildren();
  unmount = mountController(host, body);
  labels();
}
let saving: Promise<unknown> = Promise.resolve();
onPersist(() => {
  touched = true;
  const snapshot = { ...preferences };
  void (saving = saving
    .catch(() => {})
    .then(() => host.storage.set("studio-preferences", snapshot)))
    .then(() => {
      status.textContent = "";
    })
    .catch(() => {
      status.textContent =
        preferences.locale === "ru"
          ? "Не удалось сохранить настройку"
          : "Could not save preference";
    });
});
language.onchange = () => {
  touched = true;
  preferences.locale = language.value === "en" ? "en" : "ru";
  remount();
  savePreferences();
};
labels();
const offTheme = host.onReady((ready) => {
  applyHostReady(ready, document.documentElement);
  document.documentElement.classList.add("oc-themed");
  root.style.visibility = "visible";
  if (!loaded) {
    loaded = true;
    void host.storage
      .get("studio-preferences")
      .then((value) => {
        if (disposed || touched || !value) return;
        restorePreferences(value);
        remount();
      })
      .catch(() => {});
  }
});
window.addEventListener(
  "pagehide",
  () => {
    disposed = true;
    offTheme();
    unmount();
    host.dispose();
  },
  { once: true },
);

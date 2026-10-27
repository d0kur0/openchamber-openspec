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
const footer = document.createElement("footer");
footer.className = "studio-footer";
const projectContext = document.createElement("span");
projectContext.className = "studio-project";
const settingsButton = document.createElement("button");
settingsButton.type = "button";
settingsButton.className = "settings-trigger";
settingsButton.innerHTML =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 3-.7 2.4-2 .9L4 5.7 2.5 8.3l1.7 1.8-.2 2.2L2.5 14 4 16.6l2.3-.5 1.8 1.2L9 20h3l.8-2.7 1.9-1.2 2.3.5 1.5-2.6-1.7-1.7.1-2.2 1.6-1.8L17 5.7l-2.3.6-2-.9L12 3Z"/><circle cx="10.5" cy="11.5" r="3"/></svg>';
footer.append(projectContext, settingsButton);
const settings = document.createElement("dialog");
settings.className = "studio-settings";
const settingsTitle = document.createElement("h2");
settingsTitle.id = "studio-settings-title";
settings.setAttribute("aria-labelledby", settingsTitle.id);
const projectLabel = document.createElement("p");
const projectPath = document.createElement("code");
projectPath.className = "settings-project-path";
const projectHint = document.createElement("p");
projectHint.className = "settings-hint";
const jiraLabel = document.createElement("label");
const jiraCaption = document.createElement("span");
const jiraInput = document.createElement("input");
jiraInput.type = "url";
jiraInput.placeholder = "https://jira.example.com";
const jiraSave = document.createElement("button");
jiraSave.type = "button";
const closeSettings = document.createElement("button");
closeSettings.type = "button";
const jiraStatus = document.createElement("span");
jiraStatus.setAttribute("role", "status");
const settingsActions = document.createElement("div");
settingsActions.className = "create-actions";
settingsActions.append(closeSettings, jiraSave);
jiraLabel.append(jiraCaption, jiraInput);
settings.append(
  settingsTitle,
  projectLabel,
  projectPath,
  projectHint,
  jiraLabel,
  jiraStatus,
  settingsActions,
);
root.append(bar, body, footer, settings);
let currentDirectory: string | null = null;
function contextLabels() {
  const name = currentDirectory?.split(/[\\/]/).filter(Boolean).at(-1);
  projectContext.textContent =
    preferences.locale === "ru"
      ? `Проект: ${name ?? "не выбран"}`
      : `Project: ${name ?? "not selected"}`;
  projectContext.title = currentDirectory ?? "";
  projectPath.textContent =
    currentDirectory ?? (preferences.locale === "ru" ? "Проект не выбран" : "No project selected");
}
settingsButton.onclick = () => {
  jiraInput.value = preferences.jiraBase;
  jiraStatus.textContent = "";
  settings.showModal();
  jiraInput.focus();
};
closeSettings.onclick = () => settings.close();
settings.addEventListener("click", (event) => {
  if (event.target === settings) {
    const rect = settings.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      settings.close();
  }
});
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
  settings.close();
};
let unmount = mountController(host, body),
  disposed = false,
  loaded = false,
  touched = false;
function labels() {
  settingsTitle.textContent = preferences.locale === "ru" ? "Настройки" : "Settings";
  settingsButton.setAttribute("aria-label", settingsTitle.textContent);
  settingsButton.title = settingsTitle.textContent;
  jiraCaption.textContent = preferences.locale === "ru" ? "Адрес Jira" : "Jira base URL";
  projectLabel.textContent =
    preferences.locale === "ru" ? "Текущий проект OpenChamber" : "Current OpenChamber project";
  projectHint.textContent =
    preferences.locale === "ru"
      ? "Доска следует за проектом текущего чата. Для смены откройте другой проект или чат в OpenChamber. Показываем его каталог openspec; в проекте без OpenSpec доска будет пустой."
      : "The board follows the current chat’s project. Open another project or chat in OpenChamber to switch. It reads that project’s openspec folder; projects without OpenSpec have an empty board.";
  closeSettings.textContent = preferences.locale === "ru" ? "Отмена" : "Cancel";
  contextLabels();
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
  currentDirectory = ready.directory;
  contextLabels();
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
const offProject = host.onDirectory((directory) => {
  currentDirectory = directory;
  contextLabels();
});
window.addEventListener(
  "pagehide",
  () => {
    disposed = true;
    offTheme();
    offProject();
    unmount();
    host.dispose();
  },
  { once: true },
);

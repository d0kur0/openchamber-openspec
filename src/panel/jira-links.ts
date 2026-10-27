import { preferences } from "./preferences.js";
import { jiraKeys, jiraUrl } from "./presentation.js";
export function jiraLinks(text: string, open: (url: string) => void): HTMLElement {
  const row = document.createElement("span");
  row.className = "jira-links";
  for (const key of jiraKeys(text)) {
    const url = jiraUrl(preferences.jiraBase, key);
    if (!url) continue;
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = key;
    link.title = url;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      open(url);
    });
    row.append(link);
  }
  row.hidden = !row.childNodes.length;
  return row;
}

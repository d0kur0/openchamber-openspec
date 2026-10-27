import { preferences } from "./preferences.js";
import { jiraUrl, russianHeading, russianMarker } from "./presentation.js";
import { Marked } from "marked";
import DOMPurify from "dompurify";

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );

export function documentFormat(selector: string): "markdown" | "text" {
  return /\.(md|markdown)$/i.test(selector) ? "markdown" : "text";
}

export function renderDocument(source: string): DocumentFragment {
  const parser = new Marked({
    gfm: true,
    renderer: {
      code({ text }) {
        return `<pre><code>${escape(text)}</code></pre>`;
      },
      html: ({ text }) => escape(text),
      image: ({ text }) => escape(text || "Image"),
      link({ href, tokens }) {
        const label = this.parser.parseInline(tokens);
        if (!/^https?:\/\//i.test(href) && !href.startsWith("#")) return label;
        return `<a href="${escape(href)}">${label}</a>`;
      },
    },
  });
  const fragment = DOMPurify.sanitize(parser.parse(source, { async: false }), {
    RETURN_DOM_FRAGMENT: true,
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "strong",
      "em",
      "del",
      "blockquote",
      "ol",
      "ul",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "pre",
      "code",
      "a",
      "input",
    ],
    ALLOWED_ATTR: ["href", "type", "disabled", "checked", "start"],
    ALLOW_DATA_ATTR: false,
  });
  const used = new Set<string>();
  for (const heading of fragment.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
    const base =
      heading
        .textContent!.toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/\s+/g, "-") || "heading";
    let id = base;
    for (let i = 1; used.has(id); i++) id = `${base}-${i}`;
    used.add(id);
    heading.id = `document-${id}`;
  }
  if (preferences.locale === "ru") {
    for (const heading of fragment.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
      const original = heading.textContent ?? "";
      const translated = russianHeading(original);
      if (translated !== original) {
        heading.textContent = translated;
        heading.setAttribute("title", original);
      }
    }
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (!node.parentElement?.closest("pre,code,a,h1,h2,h3,h4,h5,h6"))
        node.data = node.data.replace(/\b(SHALL|MUST|SHOULD|MAY)\b/g, russianMarker);
    }
    for (const strong of fragment.querySelectorAll("strong")) {
      if (!strong.closest("pre,code,a"))
        strong.textContent = russianMarker(strong.textContent ?? "");
    }
  }
  if (preferences.jiraBase) {
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (!node.parentElement?.closest("a,pre,code")) nodes.push(node);
    }
    for (const node of nodes) {
      const text = node.data;
      const matches = [
        ...text.matchAll(/(?<![\p{L}\p{N}_])[A-Z][A-Z0-9_]*-\d+(?![\p{L}\p{N}_])/gu),
      ];
      if (!matches.length) continue;
      const replacement = document.createDocumentFragment();
      let offset = 0;
      for (const match of matches) {
        const url = jiraUrl(preferences.jiraBase, match[0]);
        if (!url) continue;
        replacement.append(text.slice(offset, match.index));
        const link = document.createElement("a");
        link.href = url;
        link.textContent = match[0];
        replacement.append(link);
        offset = match.index! + match[0].length;
      }
      replacement.append(text.slice(offset));
      node.replaceWith(replacement);
    }
  }
  for (const link of fragment.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    link.dataset.documentHref = link.getAttribute("href")!;
    // Native alternate-link actions must not bypass the SDK or navigate the iframe.
    link.setAttribute("href", "#");
  }
  for (const input of fragment.querySelectorAll("input")) {
    if (input.type !== "checkbox") input.remove();
    else {
      input.disabled = true;
      input.setAttribute("aria-label", input.parentElement?.textContent?.trim() || "Document task");
    }
  }
  for (const table of fragment.querySelectorAll("table")) {
    const wrapper = document.createElement("div");
    wrapper.className = "document-table";
    table.replaceWith(wrapper);
    wrapper.append(table);
  }
  return fragment;
}

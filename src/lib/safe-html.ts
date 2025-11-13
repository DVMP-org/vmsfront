"use client";

const BLOCKED_TAGS = ["script", "style", "iframe", "object", "embed", "link", "meta"];
const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
]);
const SAFE_URL_PROTOCOL = /^(https?:|mailto:|tel:|#|\/)/i;
const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;

const TAG_SPECIFIC_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
};

const GLOBAL_ALLOWED_ATTRS = new Set(["data-placeholder"]);

const decodeHtmlEntities = (input: string) => {
  if (typeof window === "undefined") return input;
  const textarea = window.document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
};

export const sanitizeHtml = (input: string) => {
  if (!input) return "";
  if (typeof window === "undefined") {
    return input;
  }

  const container = window.document.createElement("div");
  container.innerHTML = input;

  container.querySelectorAll(BLOCKED_TAGS.join(",")).forEach((node) => node.remove());

  const elements = container.querySelectorAll("*");
  elements.forEach((element) => {
    const tagName = element.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      const fragment = window.document.createDocumentFragment();
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
      element.replaceWith(fragment);
      return;
    }

    Array.from(element.attributes).forEach((attr) => {
      const attrName = attr.name.toLowerCase();
      if (attrName.startsWith("on") || attrName === "style") {
        element.removeAttribute(attr.name);
        return;
      }
      if (!GLOBAL_ALLOWED_ATTRS.has(attrName)) {
        const allowedAttrs = TAG_SPECIFIC_ATTRS[tagName];
        if (!allowedAttrs || !allowedAttrs.has(attrName)) {
          element.removeAttribute(attr.name);
          return;
        }
      }
      if (attrName === "href") {
        const value = element.getAttribute(attr.name) ?? "";
        if (!SAFE_URL_PROTOCOL.test(value)) {
          element.removeAttribute(attr.name);
        } else if (!value.startsWith("#")) {
          element.setAttribute("target", "_blank");
          element.setAttribute("rel", "noopener noreferrer");
        }
      }
    });
  });

  return container.innerHTML;
};

export const stripHtml = (input: string) => {
  if (!input) return "";
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
};

export const convertPlainTextToHtml = (input: string) => {
  if (!input) return "";
  const escaped = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
  return `<p>${escaped}</p>`;
};

export const toRenderableHtml = (input: string) => {
  if (!input) return "";
  const safeHtml = sanitizeHtml(input);
  if (!HTML_TAG_REGEX.test(safeHtml)) {
    return convertPlainTextToHtml(safeHtml);
  }
  return safeHtml;
};

export const hasMeaningfulContent = (input: string) => {
  if (!input) return false;
  const plainText = stripHtml(input).replace(/&nbsp;/gi, " ").trim();
  return plainText.length > 0;
};

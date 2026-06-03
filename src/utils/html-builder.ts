import type { VisualSystem } from "../data/layout-recipes.js";

export interface PageCopy {
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  caption?: string;
}

export interface PagePlan {
  index: number;
  type: string;
  layout: string;
  layoutName?: string;
  role: string;
}

/**
 * Apply the theme attribute to the <html> tag in the seed template.
 */
export function applyTheme(html: string, system: VisualSystem, theme: string): string {
  const attrMap: Record<VisualSystem, string> = {
    editorial: "data-theme",
    swiss: "data-accent",
    neochinese: "data-neo-theme",
  };
  const attr = attrMap[system];
  return html.replace(
    new RegExp(`<html([^>]*)\\s${attr}="[^"]*"`),
    `<html$1 ${attr}="${theme}"`
  );
}

/**
 * Replace <!-- POSTERS_HERE --> with generated section HTML.
 */
export function injectSections(html: string, sections: string[]): string {
  return html.replace("<!-- POSTERS_HERE -->", sections.join("\n"));
}

/**
 * Build a <section class="poster xhs"> for one page.
 */
export function buildSection(
  system: VisualSystem,
  plan: PagePlan,
  copy: PageCopy,
  imageDataUri?: string
): string {
  const id = `xhs-${String(plan.index + 1).padStart(2, "0")}`;
  const layout = plan.layout;
  const inner = buildLayoutInner(system, layout, copy, imageDataUri);
  const extras = system === "editorial"
    ? `    <canvas class="mag-bg" data-bg="ink-flow"></canvas>\n    <div class="grain"></div>\n`
    : system === "neochinese"
    ? `    <div class="paper-grain"></div>\n`
    : "";

  return `  <section class="poster xhs" id="${id}" data-layout="${layout}">
${extras}    <div class="content stack gap-4">
${inner}
    </div>
  </section>`;
}

/**
 * Build the inner HTML for a specific layout recipe.
 */
function buildLayoutInner(
  system: VisualSystem,
  layout: string,
  copy: PageCopy,
  imageDataUri?: string
): string {
  // Dispatch to system-specific builders
  if (system === "editorial") return buildEditorialLayout(layout, copy, imageDataUri);
  if (system === "swiss") return buildSwissLayout(layout, copy, imageDataUri);
  if (system === "neochinese") return buildNeochineseLayout(layout, copy, imageDataUri);
  return buildGenericLayout(copy);
}

// ── Editorial layouts ──

function buildEditorialLayout(layout: string, copy: PageCopy, imageDataUri?: string): string {
  switch (layout) {
    case "M01":
      return buildM01(copy, imageDataUri);
    case "M07":
      return buildM07(copy);
    case "M03":
      return buildM03(copy);
    case "M05":
      return buildM05(copy);
    default:
      return buildGenericLayout(copy);
  }
}

function buildM01(copy: PageCopy, imageDataUri?: string): string {
  const img = imageDataUri
    ? `\n        <figure class="frame-img r-16x10">\n          <img src="${imageDataUri}" alt="${esc(copy.title)}">\n        </figure>`
    : "";
  return `      <div class="issue-row">
        <span>Vol. 01</span><span class="dot"></span><span>2026.06</span>
      </div>
      <div class="stack gap-2">
        <p class="kicker">封面 · Cover</p>
        <h1 class="h-display">${esc(copy.title)}</h1>
        ${copy.subtitle ? `<p class="h-sub">${esc(copy.subtitle)}</p>` : ""}
      </div>${img}
      ${copy.body ? `<p class="lead">${esc(copy.body)}</p>` : ""}
      <div class="issue-strip">
        <span>Issue · Magazine</span>
        <span>—</span>
        <span>by 归藏</span>
      </div>`;
}

function buildM07(copy: PageCopy): string {
  const items = copy.bullets?.length
    ? copy.bullets.map((b, i) => `        <div class="ledger-row"><span class="ledger-nb">${i + 1}</span><span class="ledger-title">${esc(b)}</span></div>`).join("\n")
    : "";
  return `      <h1 class="h-xl">${esc(copy.title)}</h1>
      <div class="ledger">
${items}
      </div>
      ${copy.body ? `<p class="lead">${esc(copy.body)}</p>` : ""}`;
}

function buildM03(copy: PageCopy): string {
  const paragraphs = copy.body
    ? copy.body.split(/\n+/).map(p => `      <p class="body-text">${esc(p)}</p>`).join("\n")
    : "";
  return `      <h1 class="h-xl">${esc(copy.title)}</h1>
${paragraphs}`;
}

function buildM05(copy: PageCopy): string {
  const items = copy.bullets?.length
    ? copy.bullets.map((b, i) => `      <div class="ledger-row"><span class="ledger-nb">${i + 1}</span><span class="ledger-title">${esc(b)}</span></div>`).join("\n")
    : "";
  return `      <h1 class="h-xl">${esc(copy.title)}</h1>
${items}`;
}

// ── Swiss layouts ──

function buildSwissLayout(layout: string, copy: PageCopy, imageDataUri?: string): string {
  switch (layout) {
    case "S01":
      return buildS01(copy);
    case "S07":
      return buildS07(copy);
    case "S10":
      return buildS10(copy);
    default:
      return buildGenericLayout(copy);
  }
}

function buildS01(copy: PageCopy): string {
  return `      <div class="chrome-min">
        <span>Vol. 01 · Swiss</span>
        <span>2026.06</span>
      </div>
      <div class="stack gap-7">
        <p class="t-cat">封面 · Cover</p>
        <h1 class="h-hero">${esc(copy.title)}</h1>
        ${copy.subtitle ? `<p class="lead">${esc(copy.subtitle)}</p>` : ""}
      </div>
      <div class="grow"></div>
      <hr class="hr-accent">
      <p class="lead">${esc(copy.body ?? "")}</p>
      <div class="row gap-6">
        <p class="t-meta">Issue 01</p>
        <p class="t-meta">/ 归藏</p>
      </div>`;
}

function buildS07(copy: PageCopy): string {
  const rows = copy.bullets?.length
    ? copy.bullets.map((b, i) => `        <div class="ledger-row"><span class="ledger-nb">${i + 1}</span><span class="ledger-title">${esc(b)}</span></div>`).join("\n")
    : "";
  return `      <h1 class="h-xl">${esc(copy.title)}</h1>
      <div class="ledger">
${rows}
      </div>`;
}

function buildS10(copy: PageCopy): string {
  const bars = copy.bullets?.length
    ? copy.bullets.map((b, i) => {
        const pct = Math.max(20, 100 - i * 15);
        return `        <div class="bar-row"><span class="row-lbl">${esc(b)}</span><div class="row-track"><div class="row-fill" style="width:${pct}%"></div></div><span class="row-val">${pct}%</span></div>`;
      }).join("\n")
    : "";
  return `      <p class="t-cat">${esc(copy.subtitle ?? "")}</p>
      <h1 class="h-xl">${esc(copy.title)}</h1>
      <div class="h-bar-chart">
${bars}
      </div>`;
}

// ── Neo-Chinese layouts ──

function buildNeochineseLayout(layout: string, copy: PageCopy, imageDataUri?: string): string {
  switch (layout) {
    case "C01":
      return buildC01(copy);
    case "C02":
      return buildC02(copy);
    case "C05":
      return buildC05(copy);
    default:
      return buildGenericLayout(copy);
  }
}

function buildC01(copy: PageCopy): string {
  return `      <div class="row gap-4" style="align-items:center;">
        <div class="stack gap-2" style="flex:1;">
          <h1 class="h-scroll">${esc(copy.title)}</h1>
          <p class="colophon">${esc(copy.subtitle ?? "")}</p>
        </div>
        <div class="seal seal-lg"><span>归藏</span></div>
      </div>`;
}

function buildC02(copy: PageCopy): string {
  const paragraphs = copy.body
    ? copy.body.split(/\n+/).map(p => `      <p class="body-nc">${esc(p)}</p>`).join("\n")
    : "";
  return `      <h1 class="h-scroll">${esc(copy.title)}</h1>
${paragraphs}
      <p class="colophon">${esc(copy.caption ?? "")}</p>`;
}

function buildC05(copy: PageCopy): string {
  const verses = copy.body
    ? copy.body.split(/\n+/).map(l => `        <p>${esc(l)}</p>`).join("\n")
    : copy.title;
  return `      <p class="label-nc">${esc(copy.subtitle ?? "")}</p>
      <div class="h-verse">
${verses}
      </div>
      <p class="cinnabar">${esc(copy.caption ?? "")}</p>`;
}

// ── Generic fallback ──

function buildGenericLayout(copy: PageCopy): string {
  const body = copy.body
    ? `\n      <p class="body-text">${esc(copy.body)}</p>`
    : "";
  return `      <h1 class="h-xl">${esc(copy.title)}</h1>${body}`;
}

/** Escape HTML special characters */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

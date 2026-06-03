export type VisualSystem = "editorial" | "swiss" | "neochinese";
export type PageType = "cover" | "content" | "summary";

export interface LayoutRecipe {
  id: string;
  name: string;
  system: VisualSystem;
  type: PageType;
  minDensity: string;
  hardLimits: string;
  description: string;
}

export const LAYOUT_RECIPES: LayoutRecipe[] = [
  { id: "M01", name: "Magazine Issue Cover", system: "editorial", type: "cover", minDensity: "title + 3 short paragraphs OR title + 2 paragraphs + numbered footer list", hardLimits: "none", description: "Best for Rednote page 1, portrait social cards, or article-card covers." },
  { id: "M02", name: "Field Note Photo", system: "editorial", type: "content", minDensity: "large documentary photo + narrow caption column or bottom caption band + one short takeaway", hardLimits: "none", description: "Best for outdoor, object, hardware, or real-world observation." },
  { id: "M03", name: "Editorial Essay Split", system: "editorial", type: "content", minDensity: "title + 3 short paragraphs OR title + 2 paragraphs + numbered footer list", hardLimits: "none", description: "Best for explaining one idea with nuance." },
  { id: "M04", name: "Pull Quote / Thesis", system: "editorial", type: "summary", minDensity: "hero statement + source/context row + date-stamp kicker + hairline rule", hardLimits: "none", description: "Best for a core sentence or conclusion." },
  { id: "M05", name: "Checklist / Buying Guide", system: "editorial", type: "content", minDensity: "header title + 4-6 rows with number, item, consequence", hardLimits: "none", description: "Best for Rednote practical content." },
  { id: "M06", name: "Evidence Wall", system: "editorial", type: "content", minDensity: "2x2 or 3-column image grid + short captions + headline", hardLimits: "none", description: "Best for multiple screenshots, references, or small images." },
  { id: "M07", name: "Closing Note", system: "editorial", type: "summary", minDensity: "title + ≥4 ledger items with sub-lines + closing block", hardLimits: "3 short ledger lines on 3:4 is a failure mode", description: "Best for final page." },
  { id: "M08", name: "Tall Ledger", system: "editorial", type: "content", minDensity: "header title + 4-6 full-width rows", hardLimits: "none", description: "Best for lists, roles, pros/cons, gear items." },
  { id: "M09", name: "Atmospheric Thesis", system: "editorial", type: "summary", minDensity: "WebGL background + large thesis + 1-2 supporting notes + metadata", hardLimits: "none", description: "Best for sparse but important points." },
  { id: "M10", name: "Evidence Feature", system: "editorial", type: "content", minDensity: "large screenshot 45-65% canvas + headline + bottom caption band", hardLimits: "none", description: "Best for supplied screenshots/photos." },
  { id: "M11", name: "Marginalia Essay", system: "editorial", type: "content", minDensity: "wide title + main column 2-3 paragraphs + marginal column", hardLimits: "none", description: "Best for nuanced explanation with moderate text." },
  { id: "M12", name: "Section Divider", system: "editorial", type: "summary", minDensity: "WebGL background + kicker + h-display title + subtitle", hardLimits: "none", description: "Best for mid-carousel breath between dense pages." },
  { id: "M13", name: "Hero Question", system: "editorial", type: "summary", minDensity: "WebGL background + kicker + big serif question + prompt + metadata", hardLimits: "ink-flow WebGL background must be visible", description: "Best for the last page or a sharp pivot mid-set." },
  { id: "M14", name: "Vertical Pipeline", system: "editorial", type: "content", minDensity: "kicker + h-xl title + 3-5 pipeline steps", hardLimits: "3-5 steps; 6+ split or switch to M05", description: "Best for explaining a 3-5 step workflow." },
  { id: "M15", name: "Before / After", system: "editorial", type: "content", minDensity: "kicker + h-xl title + two beforeafter blocks", hardLimits: "none", description: "Best for old way vs new way comparisons." },
  { id: "M16", name: "Image-Led Cover", system: "editorial", type: "cover", minDensity: "photo fills canvas + short title rides on top", hardLimits: "photo must pass quiet-zone and light tests; never run two M16 in a row", description: "Best for lifestyle, image-heavy content with excellent photos." },
  { id: "M17", name: "Timeline / Chronology", system: "editorial", type: "content", minDensity: "title + 5 nodes with desc lines", hardLimits: "max 8 nodes on 3:4; 9+ split into two pages", description: "Best for travel itineraries, product evolution, or historical narratives." },
  { id: "M18", name: "Q&A / Interview", system: "editorial", type: "content", minDensity: "title + 3 Q&A pairs with ≥2-line answers", hardLimits: "max 5 Q&A pairs on 3:4", description: "Best for interview excerpts or dialogue-heavy content." },
  { id: "M19", name: "Tutorial + Screenshot", system: "editorial", type: "content", minDensity: "title + 3 steps with screenshots", hardLimits: "max 5 steps on 3:4", description: "Best for step-by-step tutorials or how-to guides." },
  { id: "S01", name: "Accent Cover", system: "swiss", type: "cover", minDensity: "full accent or off-white background + big light-weight title + abstract block", hardLimits: "none", description: "Best for Rednote cover." },
  { id: "S02", name: "Two Signals / Comparison", system: "swiss", type: "content", minDensity: "page title + two large rectangular modules", hardLimits: "none", description: "Best for explaining two sources, options, or directions." },
  { id: "S03", name: "Data Layer / File Card", system: "swiss", type: "content", minDensity: "large file-type block + 3-4 properties", hardLimits: "none", description: "Best for Markdown or database information." },
  { id: "S04", name: "Interface / Browser Mock", system: "swiss", type: "content", minDensity: "browser window frame + hero block + 2-3 modules", hardLimits: "none", description: "Best for UI or output layers." },
  { id: "S05", name: "Trap / Warning Rows", system: "swiss", type: "content", minDensity: "big warning title + three horizontal rows", hardLimits: "none", description: "Best for anti-patterns or 'do not do this' pages." },
  { id: "S06", name: "Pipeline / Architecture", system: "swiss", type: "content", minDensity: "three rows/columns with labels + one consequence", hardLimits: "none", description: "Best for workflows or layered systems." },
  { id: "S07", name: "Takeaway Ledger", system: "swiss", type: "summary", minDensity: "big thesis title + three ledger rows", hardLimits: "none", description: "Best for final pages." },
  { id: "S08", name: "Image Hero", system: "swiss", type: "cover", minDensity: "image hero block + title + 3 quantified stats", hardLimits: "none", description: "Best for WeChat 21:9 or Rednote cover with strong photo." },
  { id: "S09", name: "KPI Tower", system: "swiss", type: "content", minDensity: "kicker + h-xl title + 4 columns with bar towers", hardLimits: "max 4 columns", description: "Best for product update pages or dashboards." },
  { id: "S10", name: "H-Bar Chart", system: "swiss", type: "content", minDensity: "kicker + h-xl title + 5-10 rows with bars", hardLimits: "max 10 rows on 3:4", description: "Best for rankings or comparisons." },
  { id: "S11", name: "Stacked Ledger", system: "swiss", type: "content", minDensity: "kicker + h-xl title + 4-6 ledger rows", hardLimits: "max 6 rows on 3:4", description: "Best for shopping lists or expense rollups." },
  { id: "S12", name: "Matrix + Hero Stat", system: "swiss", type: "content", minDensity: "kicker + h-xl title + 8-12 matrix cells + hero stat", hardLimits: "8 cells on 3:4 (2x4); max one accent cell", description: "Best for capability matrices or agent inventories." },
  { id: "S13", name: "Rating / Score Card", system: "swiss", type: "summary", minDensity: "kicker + title + overall score + 3 sub-scores + summary note", hardLimits: "max 5 sub-scores on 3:4", description: "Best for product reviews or service ratings." },
  { id: "S14", name: "Conversation / AI Chat", system: "swiss", type: "content", minDensity: "title + 5 alternating messages + bottom stats", hardLimits: "max 6 messages on 3:4", description: "Best for chat highlights or conversation excerpts." },
  { id: "S15", name: "Price / Feature Comparison", system: "swiss", type: "content", minDensity: "title + 5-6 comparison rows + verdict line", hardLimits: "max 4 columns (products) on 3:4", description: "Best for product comparisons or feature matrices." },
  { id: "C01", name: "Scroll-Title Cover", system: "neochinese", type: "cover", minDensity: "title + colophon + seal", hardLimits: "title max 4 Chinese characters in vertical mode", description: "Best for Rednote cover page 1 or neo-Chinese carousel opener." },
  { id: "C02", name: "Colophon Essay", system: "neochinese", type: "content", minDensity: "title + 2 paragraphs + colophon", hardLimits: "none", description: "Best for editorial essays or personal reflections." },
  { id: "C03", name: "Cinnabar Annotation", system: "neochinese", type: "content", minDensity: "2 paragraphs + 2 cinnabar annotations", hardLimits: "none", description: "Best for commentary or critiques." },
  { id: "C04", name: "Artifact Catalogue", system: "neochinese", type: "content", minDensity: "photo + 3 catalog entries", hardLimits: "none", description: "Best for object studies or antique appreciation." },
  { id: "C05", name: "Solar Term / Poem Card", system: "neochinese", type: "summary", minDensity: "3-4 verse lines + season marker + attribution", hardLimits: "none", description: "Best for seasonal content or classical poetry." },
  { id: "C06", name: "Juxtaposition Scroll", system: "neochinese", type: "content", minDensity: "2 images + 2 captions", hardLimits: "none", description: "Best for ancient/modern or before/after comparisons." },
  { id: "C07", name: "Checklist / Inventory", system: "neochinese", type: "content", minDensity: "title + 5 checklist items", hardLimits: "none", description: "Best for reading lists or gear checklists." },
  { id: "C08", name: "Seal Matrix", system: "neochinese", type: "content", minDensity: "title + 6 chop cells (2x3 grid)", hardLimits: "none", description: "Best for multi-topic overviews or category tags." },
  { id: "C09", name: "Epistolary / Letter", system: "neochinese", type: "content", minDensity: "vertical text flowing right to left + date + signature", hardLimits: "max 4 vertical columns on 3:4", description: "Best for personal notes or letters." },
  { id: "C10", name: "Album Leaf", system: "neochinese", type: "content", minDensity: "4 images in 2x2 grid + captions", hardLimits: "none", description: "Best for multi-image narratives." },
  { id: "C11", name: "Fan Composition", system: "neochinese", type: "content", minDensity: "center verse + cinnabar attribution", hardLimits: "content must stay within 80% inner zone of fan frame", description: "Best for circular layouts or single-focus poetry." },
  { id: "C12", name: "Stele Rubbing", system: "neochinese", type: "summary", minDensity: "title + 2 supporting lines + colophon", hardLimits: "none", description: "Best for bold statements or declarations." },
];

export function getRecipes(system?: VisualSystem, type?: PageType): LayoutRecipe[] {
  return LAYOUT_RECIPES.filter((r) => {
    if (system && r.system !== system) return false;
    if (type && r.type !== type) return false;
    return true;
  });
}

export function getRecipe(id: string): LayoutRecipe | undefined {
  return LAYOUT_RECIPES.find((r) => r.id === id);
}
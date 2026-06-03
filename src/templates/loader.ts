import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { VisualSystem } from "../data/layout-recipes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

export async function loadTemplate(system: VisualSystem): Promise<string> {
  const filenames: Record<VisualSystem, string> = {
    editorial: "template-editorial-card.html",
    swiss: "template-swiss-card.html",
    neochinese: "template-neochinese-card.html",
  };
  const path = join(PROJECT_ROOT, "assets", filenames[system]);
  return readFile(path, "utf-8");
}
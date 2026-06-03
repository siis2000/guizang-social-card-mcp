import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getRecipes, type VisualSystem, type PageType } from "../data/layout-recipes.js";
import { getThemes, getDefaultTheme } from "../data/theme-presets.js";
import { matchCategory, getLayoutsForCategory } from "../data/category-routes.js";

/** Default layouts per system when category doesn't match */
const SYSTEM_DEFAULTS: Record<VisualSystem, Record<PageType, string[]>> = {
  editorial: {
    cover: ["M01", "M16"],
    content: ["M03", "M05", "M07", "M08", "M10", "M14", "M17", "M19"],
    summary: ["M04", "M07", "M09", "M12", "M13"],
  },
  swiss: {
    cover: ["S01", "S08"],
    content: ["S02", "S03", "S04", "S05", "S06", "S09", "S10", "S11", "S12", "S14", "S15"],
    summary: ["S07", "S13"],
  },
  neochinese: {
    cover: ["C01"],
    content: ["C02", "C03", "C04", "C06", "C07", "C08", "C09", "C10", "C11"],
    summary: ["C05", "C12"],
  },
};

function pickLayout(pool: string[], used: Set<string>): string {
  const available = pool.filter((id) => !used.has(id));
  if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return available[Math.floor(Math.random() * available.length)];
}

export function registerPlanCard(server: McpServer) {
  server.tool(
    "plan_card",
    "Plan the card structure: choose visual system, theme, and layout recipes for each page based on the user's prompt.",
    {
      prompt: z.string().describe("User's original prompt describing the card content and topic"),
      style: z.enum(["editorial", "swiss", "neochinese"]).describe("Visual system to use"),
      pageCount: z.number().min(3).max(9).default(5).describe("Number of pages (3-9, default 5)"),
    },
    async ({ prompt, style, pageCount }) => {
      const category = matchCategory(prompt);
      const theme = getDefaultTheme(style);

      const getPool = (type: PageType): string[] => {
        const catLayouts = getLayoutsForCategory(category, style, type);
        return catLayouts.length > 0 ? catLayouts : SYSTEM_DEFAULTS[style][type];
      };

      const coverPool = getPool("cover");
      const contentPool = getPool("content");
      const summaryPool = getPool("summary");

      const usedLayouts = new Set<string>();
      const pages = [];

      for (let i = 0; i < pageCount; i++) {
        let type: PageType;
        let pool: string[];
        let role: string;

        if (i === 0) {
          type = "cover";
          pool = coverPool;
          role = "封面";
        } else if (i === pageCount - 1) {
          type = "summary";
          pool = summaryPool;
          role = "总结";
        } else {
          type = "content";
          pool = contentPool;
          role = `内容页 ${i}`;
        }

        const layout = pickLayout(pool, usedLayouts);
        usedLayouts.add(layout);

        const recipe = getRecipes(style, type).find((r) => r.id === layout);
        const layoutName = recipe?.name ?? layout;

        pages.push({ index: i, type, layout, layoutName, role });
      }

      const themeNames = getThemes(style).map((t) => t.id).join(", ");
      const rationale = [
        `品类识别: "${category.name}" (匹配关键词: ${category.keywords.filter((k) => prompt.includes(k)).join(", ") || "通用"})`,
        `视觉系统: ${style}，主题: ${theme.id} (${theme.name})`,
        `可选主题: ${themeNames}`,
        `版式规划: 封面用 ${pages[0].layout}，内容页交替使用 ${pages.slice(1, -1).map((p) => p.layout).join("/")}, 结尾用 ${pages[pages.length - 1].layout}`,
        category.pitfalls ? `注意: ${category.pitfalls}` : "",
      ].filter(Boolean).join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ style, theme: theme.id, pages, rationale }, null, 2),
          },
        ],
      };
    }
  );
}
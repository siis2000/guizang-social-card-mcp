import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadTemplate } from "../templates/loader.js";
import { applyTheme, injectSections, buildSection, type PagePlan, type PageCopy } from "../utils/html-builder.js";
import { encodeImageToBase64 } from "../utils/image-encoder.js";
import type { VisualSystem } from "../data/layout-recipes.js";

interface PlanData {
  style: VisualSystem;
  theme: string;
  pages: PagePlan[];
}

interface TextData {
  pages: PageCopy[];
  meta: { issueLabel: string; footerNote: string };
}

interface ImageCandidate {
  source: string;
  url: string;
  thumbUrl?: string;
  author?: string;
  license?: string;
}

interface ImagePageResult {
  pageIndex: number;
  candidates: ImageCandidate[];
}

interface ImagesData {
  pages?: ImagePageResult[];
}

export function registerComposeCard(server: McpServer) {
  server.tool(
    "compose_card",
    "Compose the final single-file HTML with embedded Base64 images using the selected template, theme, copy, and images.",
    {
      plan: z.string().describe("JSON string of the plan output from plan_card"),
      text: z.string().describe("JSON string of the text/copy output from generate_card"),
      images: z.string().describe("JSON string of the images output from generate_card"),
      theme: z.string().describe("Theme token name (e.g. ink-classic, ikb, vermilion-ink)"),
      imageSelections: z.string().optional().describe("JSON object mapping pageIndex to candidate index for image selection"),
    },
    async ({ plan, text, images, theme, imageSelections }) => {
      // 1. Parse inputs
      let planData: PlanData;
      let textData: TextData;
      let imagesData: ImagesData;
      let selections: Record<string, number> = {};

      try {
        planData = JSON.parse(plan);
      } catch {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Invalid plan JSON" }) }] };
      }
      try {
        textData = JSON.parse(text);
      } catch {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Invalid text JSON" }) }] };
      }
      try {
        imagesData = JSON.parse(images);
      } catch {
        imagesData = {};
      }
      if (imageSelections) {
        try {
          selections = JSON.parse(imageSelections);
        } catch {
          selections = {};
        }
      }

      const system = planData.style;
      const pages = planData.pages;

      // 2. Load seed template
      let templateHtml: string;
      try {
        templateHtml = await loadTemplate(system);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Failed to load template: ${msg}` }) }] };
      }

      // 3. Apply theme
      templateHtml = applyTheme(templateHtml, system, theme);

      // 4. Resolve images — download and encode selected candidates as Base64
      const imageMap = new Map<number, string>(); // pageIndex -> data URI
      const imagePages = imagesData.pages ?? [];

      const encodeTasks = pages.map(async (page) => {
        const imgPage = imagePages.find((ip) => ip.pageIndex === page.index);
        if (!imgPage || imgPage.candidates.length === 0) return;

        // Pick candidate: use selection if provided, else first candidate
        const idx = selections[String(page.index)] ?? 0;
        const candidate = imgPage.candidates[Math.min(idx, imgPage.candidates.length - 1)];
        if (!candidate?.url) return;

        try {
          const dataUri = await Promise.race([
            encodeImageToBase64(candidate.url),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Image fetch timeout")), 10_000)
            ),
          ]);
          imageMap.set(page.index, dataUri);
        } catch {
          // Image fetch failed, skip embedding
        }
      });

      await Promise.allSettled(encodeTasks);

      // 5. Build sections
      const sections = pages.map((page) => {
        const copy = textData.pages[page.index] ?? { title: page.layoutName ?? page.layout };
        const imgUri = imageMap.get(page.index);
        return buildSection(system, page, copy, imgUri);
      });

      // 6. Inject sections into template
      const finalHtml = injectSections(templateHtml, sections);

      // 7. Estimate size
      const sizeBytes = Buffer.byteLength(finalHtml, "utf-8");
      const estimatedSize = sizeBytes > 1_000_000
        ? `~${(sizeBytes / 1_000_000).toFixed(1)}MB`
        : `~${(sizeBytes / 1_000).toFixed(0)}KB`;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              html: finalHtml,
              posterCount: pages.length,
              board: "xhs",
              estimatedSize,
            }),
          },
        ],
      };
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { chatCompletion } from "../services/modelscope-llm.js";
import { generateImage } from "../services/modelscope-t2i.js";
import { searchWebImages } from "../services/web-image-search.js";
import { buildSystemPrompt } from "../utils/prompt-builder.js";
import type { VisualSystem } from "../data/layout-recipes.js";

interface PlanPage {
  index: number;
  type: string;
  layout: string;
  layoutName?: string;
  role: string;
}

interface PlanData {
  style: VisualSystem;
  theme: string;
  pages: PlanPage[];
}

export function registerGenerateCard(server: McpServer) {
  server.tool(
    "generate_card",
    "Generate copy and image candidates for each page using ModelScope LLM, text-to-image, and web image search.",
    {
      plan: z.string().describe("JSON string of the plan output from plan_card"),
      prompt: z.string().describe("User's original prompt"),
      modelscopeKey: z.string().describe("User's ModelScope Access Token"),
      llmModel: z.string().default("Qwen/Qwen3.5-35B-A3B").describe("LLM model ID on ModelScope"),
      t2iModel: z.string().default("Tongyi-MAI/Z-Image-Turbo").describe("Text-to-image model ID on ModelScope"),
    },
    async ({ plan, prompt, modelscopeKey, llmModel, t2iModel }) => {
      let planData: PlanData;
      try {
        planData = JSON.parse(plan);
      } catch {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Invalid plan JSON" }) }] };
      }

      const systemPrompt = buildSystemPrompt(planData.style);
      const layoutDesc = planData.pages
        .map((p) => `Page ${p.index}: ${p.type} / ${p.layout} (${p.layoutName ?? p.role})`)
        .join("\n");

      const userMessage = `用户提示词：${prompt}\n\n版式规划：\n${layoutDesc}\n\n请为以上 ${planData.pages.length} 页生成文案。`;

      let copyResult: { pages: Array<{ title: string; subtitle?: string; body?: string; bullets?: string[]; caption?: string; imagePrompt?: string; }>; meta: { issueLabel: string; footerNote: string } };

      try {
        const llmRes = await chatCompletion(modelscopeKey, [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ], llmModel);

        let text = llmRes.text.trim();
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
        copyResult = JSON.parse(text);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: `LLM generation failed: ${msg}` }) }] };
      }

      const imagePromises = planData.pages.map(async (page, i) => {
        const pageCopy = copyResult.pages[i];
        const imgPrompt = pageCopy?.imagePrompt ?? "";
        const candidates: Array<{ source: "modelscope" | "unsplash" | "pexels" | "flickr-cc"; url: string; thumbUrl?: string; author?: string; license?: string; }> = [];

        if (imgPrompt) {
          try {
            const t2iResult = await generateImage(modelscopeKey, imgPrompt, t2iModel);
            candidates.push({ source: "modelscope", url: t2iResult.url, license: "AI Generated" });
          } catch { /* T2I failed */ }
        }

        const searchKeyword = imgPrompt || prompt;
        try {
          const webImages = await searchWebImages(searchKeyword, 3);
          candidates.push(...webImages);
        } catch { /* web search failed */ }

        return { pageIndex: i, candidates };
      });

      const imageResults = await Promise.allSettled(imagePromises);
      const images = imageResults
        .filter((r): r is PromiseFulfilledResult<{ pageIndex: number; candidates: Array<{ source: "modelscope" | "unsplash" | "pexels" | "flickr-cc"; url: string; thumbUrl?: string; author?: string; license?: string; }> }> => r.status === "fulfilled")
        .map((r) => r.value);

      return {
        content: [{ type: "text" as const, text: JSON.stringify({ pages: copyResult.pages, meta: copyResult.meta, images }, null, 2) }],
      };
    }
  );
}
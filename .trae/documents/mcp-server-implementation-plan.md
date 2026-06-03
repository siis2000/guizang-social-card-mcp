# 实施计划：Guizang Social Card MCP 服务

> 将 guizang-social-card-skill 改造为魔搭社区托管的 MCP 服务
> 基于 v0.14+ 版本（含新中式系统、6 新版式、渲染管线优化、图片智能处理、中文排版硬化）

---

## 一、当前状态分析

### 项目规模（更新后）

| 维度 | 数量 |
|------|------|
| 视觉系统 | 3 个（Editorial / Swiss / **Neo-Chinese**） |
| 主题色 | 15 套（6 Editorial + 4 Swiss + **5 Neo-Chinese**） |
| 版式骨架 | **46 个**（M01-M19 + S01-S15 + **C01-C12**） |
| 种子模板 | **3 份**（Editorial / Swiss / **Neo-Chinese**） |
| 平台画板 | 小红书 3:4 / 1:1，微信 21:9 + 1:1 |
| 校验规则 | **8 条**（R1-R8，新增 R8 CJK-Latin 间距） |
| 新增脚本 | `scripts/render.mjs`（并行渲染）、`scripts/image-utils.py`（图片智能处理） |

### 关键新增文件

| 文件 | 作用 |
|------|------|
| `assets/template-neochinese-card.html` | 新中式种子模板（5 主题 × 3 画板） |
| `scripts/render.mjs` | Playwright 并行渲染器（`--parallel` / `--board` / `--device-scale`） |
| `scripts/image-utils.py` | 图片智能处理（主色提取 / object-position / CSS tint） |

### 现有依赖

- `playwright ^1.60.0`（仅用于校验器和渲染脚本）
- 无 TypeScript / 无 MCP SDK / 无 HTTP 框架

---

## 二、目标

将项目改造为 **MCP 远程服务**，部署到魔搭社区 MCP 广场，让任何 MCP 客户端（Claude Desktop / Cursor / Codex / 魔搭实验场）能通过工具调用生成社交卡片。

### 核心约束（用户已确认）

| 维度 | 决定 |
|------|------|
| MCP 工具粒度 | **3 个工具**：`plan_card` / `generate_card` / `compose_card` |
| 鉴权 | **用户自带 Key**（`MODELSCOPE_ACCESS_TOKEN`） |
| 文字模型 | 魔搭 OpenAI 兼容 API（默认 `Qwen/Qwen3.5-35B-A3B`） |
| 文生图模型 | `Tongyi-MAI/Z-Image-Turbo`（异步轮询，60s 超时） |
| 图源策略 | **A — WebFetch 解析搜索页**（Unsplash / Pexels / Flickr CC，免 key） |
| 支持画板 | **小红书 3:4**（1080×1440） |
| 输出格式 | **完整单文件 HTML**（含 Base64 内嵌图片） |
| 部署 | TypeScript + MCP SDK stdio → FC 自动包装 SSE → 魔搭托管 |
| 传输 | Streamable HTTP（FC 自动支持） |

---

## 三、3 个 MCP 工具设计

### 工具 1: `plan_card` — 规划卡片结构

**输入**：
```typescript
{
  prompt: string;              // 用户原始提示词
  style: "editorial" | "swiss" | "neochinese";  // 视觉系统
  pageCount?: number;          // 默认 5，范围 3-9
}
```

**输出**：
```typescript
{
  style: string;               // 选定的视觉系统
  theme: string;               // 主题 token 名（如 "ink-classic" / "ikb" / "vermilion-ink"）
  pages: Array<{
    index: number;
    type: "cover" | "content" | "summary";
    layout: string;            // 版式 ID（如 "M01" / "S10" / "C05"）
    role: string;              // 角色描述
  }>;
  rationale: string;           // 规划理由
}
```

**逻辑**：
- 不调 LLM，纯规则引擎
- 基于 `references/category-cookbook.md` 路由品类
- 基于 `references/layout-recipes.md` 选版式（46 个版式的元数据转成 TS 常量）
- 封面 → 内容页 → 结尾页的顺序编排

### 工具 2: `generate_card` — 生成文案 + 图片候选

**输入**：
```typescript
{
  plan: object;                // 来自 plan_card 的输出
  prompt: string;              // 用户原始提示词
  modelscopeKey: string;       // 用户的魔搭 Access Token
  llmModel?: string;           // 默认 "Qwen/Qwen3.5-35B-A3B"
  t2iModel?: string;           // 默认 "Tongyi-MAI/Z-Image-Turbo"
}
```

**输出**：
```typescript
{
  pages: Array<{
    index: number;
    title: string;
    subtitle?: string;
    body?: string;
    bullets?: string[];
    caption?: string;
    imagePrompt?: string;      // 给文生图用的提示词
  }>;
  meta: {
    issueLabel: string;
    footerNote: string;
  };
  images: Array<{
    pageIndex: number;
    candidates: Array<{
      source: "modelscope" | "unsplash" | "pexels" | "flickr-cc";
      url: string;
      thumbUrl?: string;
      author?: string;
      license?: string;
    }>;
  }>;
}
```

**逻辑**：
1. 调魔搭 LLM API（OpenAI 兼容），system prompt 注入排版规则（来自 `components.md` 的硬上限表 + 中文标题字数带）
2. 调魔搭文生图 API（异步轮询模式，`X-ModelScope-Async-Mode: true`，最多轮询 12 次 × 5s = 60s）
3. 并行 WebFetch 搜索 Unsplash / Pexels / Flickr CC 页面，解析 `<img>` 标签提取图片 URL
4. 合并 AI 生图 + 网络图源，返回候选列表

### 工具 3: `compose_card` — 套模板生成 HTML

**输入**：
```typescript
{
  plan: object;                // 来自 plan_card
  text: object;                // 来自 generate_card 的文案部分
  images: object;              // 来自 generate_card 的图片部分（含用户选择）
  theme: string;               // 主题 token
  imageSelections?: Record<number, number>;  // pageIndex → candidate index
}
```

**输出**：
```typescript
{
  html: string;                // 完整单文件 HTML（含 Base64 内嵌图片）
  posterCount: number;
  board: string;               // "xhs"
  estimatedSize: string;       // 如 "~85KB"
}
```

**逻辑**：
1. 根据视觉系统选择种子模板（3 选 1）
2. 设置主题 token（`data-theme` / `data-accent` / `data-neo-theme`）
3. 替换 `<!-- POSTERS_HERE -->` 为每页的 section HTML
4. 下载选定的图片，转为 Base64 嵌入 `<img src="data:...">`
5. 返回完整 HTML 字符串

---

## 四、项目结构（新增/修改）

```
guizang-social-card-skill/
├── src/                              ← 新增
│   ├── server.ts                     # MCP server 入口（stdio）
│   ├── tools/
│   │   ├── plan-card.ts              # 工具 1
│   │   ├── generate-card.ts          # 工具 2
│   │   └── compose-card.ts           # 工具 3
│   ├── services/
│   │   ├── modelscope-llm.ts         # 魔搭 LLM API 客户端
│   │   ├── modelscope-t2i.ts         # 魔搭文生图 API（异步轮询）
│   │   └── web-image-search.ts       # WebFetch 图源搜索（Unsplash/Pexels/Flickr）
│   ├── templates/
│   │   ├── editorial.ts              # Editorial 种子模板字符串 + 主题 token
│   │   ├── swiss.ts                  # Swiss 种子模板字符串 + accent token
│   │   └── neochinese.ts             # Neo-Chinese 种子模板字符串 + neo-theme token
│   ├── data/
│   │   ├── layout-recipes.ts         # 46 个版式元数据（ID/名称/类型/最小密度）
│   │   ├── theme-presets.ts          # 15 套主题色 token 映射
│   │   └── category-routes.ts        # 品类路由表（来自 category-cookbook.md）
│   └── utils/
│       ├── html-builder.ts           # 模板替换 + 占位符填充
│       ├── image-encoder.ts          # URL → Base64 编码
│       └── prompt-builder.ts         # LLM system prompt 构建
│
├── dist/                             ← 新增（编译产物）
├── package.json                      ← 修改
├── tsconfig.json                     ← 新增
├── mcp.json                          ← 新增（魔搭托管元数据）
│
│   ── 以下保留不动 ──
├── assets/                           # 种子模板仍保留（作为参考和本地 skill 用途）
├── references/                       # 知识库保留
├── scripts/                          # render.mjs + image-utils.py 保留
├── validate-social-deck.mjs          # 保留
├── SKILL.md                          # 保留（原 skill 工作流并存）
├── HANDOFF.md / PRODUCT.md           # 保留
└── CODE_WIKI.md                      # 保留
```

---

## 五、依赖与配置

### package.json 变更

```json
{
  "name": "guizang-social-card-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "guizang-social-card-mcp": "./dist/server.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsc --watch",
    "validate": "node validate-social-deck.mjs",
    "render": "node scripts/render.mjs"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.23.0",
    "undici": "^6.21.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0"
  }
}
```

**注意**：`playwright` 从 dependencies 移到可选依赖（MCP 服务不需要 Playwright，客户端自渲时才需要）。

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

### mcp.json（魔搭托管元数据）

```json
{
  "name": "guizang-social-card",
  "version": "0.1.0",
  "description": "Generate Guizang-style social card HTML from prompts. Supports Editorial, Swiss, and Neo-Chinese visual systems with 46 layout recipes.",
  "transport": "stdio",
  "runtime": "nodejs20",
  "entry": "dist/server.js",
  "install": "npm install && npm run build",
  "env": [
    {
      "name": "MODELSCOPE_API_KEY",
      "description": "Your ModelScope Access Token for LLM and text-to-image APIs",
      "required": true
    }
  ],
  "tools": ["plan_card", "generate_card", "compose_card"]
}
```

---

## 六、实施步骤（7 个 Phase）

### Phase 1: 项目脚手架
1. 创建 `tsconfig.json`
2. 更新 `package.json`（加 MCP SDK / zod / undici 依赖，加 bin/scripts）
3. 创建 `src/server.ts`（stdio 启动 + 注册 3 个空工具 stub）
4. 运行 `npm install && npm run build`
5. 用 `npx @modelcontextprotocol/inspector node dist/server.js` 验证基本结构

**验证**：Inspector 能列出 3 个工具，调用返回 stub 响应。

### Phase 2: 数据层 — 版式/主题/品类元数据
6. 创建 `src/data/layout-recipes.ts`：46 个版式的 ID / 名称 / 所属系统 / 类型（cover/content/summary）/ 最小密度
7. 创建 `src/data/theme-presets.ts`：15 套主题的 token 名 / CSS 变量 / 所属系统
8. 创建 `src/data/category-routes.ts`：11 个品类的版式路由表

**验证**：TypeScript 编译通过，数据可被工具引用。

### Phase 3: 工具 1 — plan_card
9. 实现 `src/tools/plan-card.ts`：规则引擎选版式
   - 输入 prompt → 简单关键词匹配品类（旅行/职场/游戏/...）
   - 品类 → 版式路由 → 选择 cover + content + summary 版式组合
   - 选择主题（基于风格 + 品类推荐）
10. 注册到 server

**验证**：调用 `plan_card({ prompt: "做一套小红书旅行图文", style: "editorial" })` 返回合理的版式规划。

### Phase 4: 工具 2 — generate_card
11. 实现 `src/services/modelscope-llm.ts`：魔搭 OpenAI 兼容 API 客户端
    - `POST https://api-inference.modelscope.cn/v1/chat/completions`
    - system prompt 注入排版规则（标题字数带、字号硬上限、最小可读尺寸）
12. 实现 `src/services/modelscope-t2i.ts`：魔搭文生图异步客户端
    - `POST https://api-inference.modelscope.cn/v1/images/generations`（`X-ModelScope-Async-Mode: true`）
    - `GET https://api-inference.modelscope.cn/v1/tasks/{task_id}`（轮询，5s 间隔，最多 12 次）
13. 实现 `src/services/web-image-search.ts`：WebFetch 图源搜索
    - `fetch("https://unsplash.com/s/photos/<keyword>")` → 解析 HTML 提取 `<img src="...">`
    - `fetch("https://www.pexels.com/search/<keyword>/")` → 同上
    - `fetch("https://www.flickr.com/search/?text=<keyword>&license=2,3,4,5,6,9")` → 同上
    - 返回缩略图 URL 列表（原图 URL 需要二次解析或 URL 模式推断）
14. 实现 `src/tools/generate-card.ts`：编排 LLM + 文生图 + 图源搜索
    - LLM 生成文案（一次返回所有页）
    - 文生图生成封面/氛围图（异步轮询）
    - WebFetch 搜索补充图源
    - 合并返回
15. 注册到 server

**验证**：调用 `generate_card({ plan, prompt, modelscopeKey })` 返回文案 + 图片候选。

### Phase 5: 工具 3 — compose_card
16. 把 3 个种子模板转为 `src/templates/editorial.ts` / `swiss.ts` / `neochinese.ts`（export 字符串常量）
17. 实现 `src/utils/html-builder.ts`：
    - 选择种子模板 → 设置主题 token → 替换 `<!-- POSTERS_HERE -->`
    - 为每个 page 生成 section HTML（基于版式 skeleton）
18. 实现 `src/utils/image-encoder.ts`：URL → Base64（用 undici fetch 下载图片）
19. 实现 `src/tools/compose-card.ts`：编排模板 + 文案 + 图片
20. 注册到 server

**验证**：调用 `compose_card({ plan, text, images, theme })` 返回完整 HTML，浏览器打开可渲染。

### Phase 6: 端到端测试
21. 用 MCP Inspector 完整走通 3 个工具的调用链
22. 测试 3 种视觉系统各一个场景：
    - Editorial + Ink Classic + 旅行
    - Swiss + IKB + AI 工具
    - Neo-Chinese + vermilion-ink + 文化
23. 验证 HTML 输出可用 Playwright 渲染为 1080×1440 PNG
24. 修复发现的问题

### Phase 7: 部署准备
25. 创建 `mcp.json`
26. 更新 `README.md`（增加 MCP 服务版说明，保留原 Skill 说明）
27. 确认 `npm run build` 产出干净的 `dist/`
28. 本地用 `npx @modelcontextprotocol/inspector` 最终验证
29. 推送到 GitHub
30. 在 https://modelscope.cn/mcp 提交服务元数据

---

## 七、关键实现细节

### 7.1 魔搭 API 调用

**LLM（OpenAI 兼容）**：
```
POST https://api-inference.modelscope.cn/v1/chat/completions
Authorization: Bearer <MODELSCOPE_ACCESS_TOKEN>
Content-Type: application/json

{
  "model": "Qwen/Qwen3.5-35B-A3B",
  "messages": [
    { "role": "system", "content": "<排版规则 system prompt>" },
    { "role": "user", "content": "<用户提示词 + 版式规划>" }
  ],
  "stream": false
}
```

**文生图（异步）**：
```
# 第 1 步：创建任务
POST https://api-inference.modelscope.cn/v1/images/generations
Authorization: Bearer <MODELSCOPE_ACCESS_TOKEN>
X-ModelScope-Async-Mode: true
Content-Type: application/json

{
  "model": "Tongyi-MAI/Z-Image-Turbo",
  "prompt": "<英文提示词>",
  "size": "1024x1024"
}

# 返回：{ "task_id": "xxx" }

# 第 2 步：轮询状态
GET https://api-inference.modelscope.cn/v1/tasks/<task_id>
Authorization: Bearer <MODELSCOPE_ACCESS_TOKEN>
X-ModelScope-Task-Type: image_generation

# 返回：{ "task_status": "SUCCEED", "output_images": ["https://..."] }
```

### 7.2 WebFetch 图源搜索

**Unsplash**：
- URL：`https://unsplash.com/s/photos/<keyword>`
- 解析：搜索 `<img src="https://images.unsplash.com/photo-..."` 提取 URL
- 原图转换：缩略图 URL 加 `?w=1080` 参数

**Pexels**：
- URL：`https://www.pexels.com/search/<keyword>/`
- 解析：搜索 `<img src="https://images.pexels.com/photos/..."` 提取 URL

**Flickr CC**：
- URL：`https://www.flickr.com/search/?text=<keyword>&license=2,3,4,5,6,9`
- 解析：搜索 `<img src="https://live.staticflickr.com/..."` 提取 URL

**降级策略**：任一源失败不阻塞，继续尝试下一个。3 个源都失败时返回空候选列表（compose_card 可生成纯文字版）。

### 7.3 种子模板处理

3 个种子模板（editorial / swiss / neochinese）以 **字符串常量** 形式嵌入 TypeScript：

```typescript
// src/templates/editorial.ts
export const EDITORIAL_TEMPLATE = `<!doctype html>
<html lang="zh-CN" data-theme="ink-classic">
...
<!-- POSTERS_HERE -->
...
</html>`;

export const EDITORIAL_THEMES = {
  "ink-classic": { /* CSS 变量 */ },
  "indigo-porcelain": { /* ... */ },
  // ...
};
```

### 7.4 版式 section HTML 生成

每个版式的 HTML skeleton 来自 `references/layout-recipes.md`，转成函数：

```typescript
// src/utils/html-builder.ts
export function buildSection(
  layout: string,      // "M01" / "S10" / "C05"
  board: string,       // "xhs"
  content: PageContent,
  images: ImageData[]
): string { ... }
```

46 个版式的 HTML skeleton 数据量较大（约 3000-5000 行），需要从 layout-recipes.md 逐个提取。

### 7.5 图片 Base64 编码

```typescript
// src/utils/image-encoder.ts
import { fetch } from "undici";

export async function encodeImageToBase64(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "guizang-social-card-mcp/0.1.0" }
  });
  const buf = await res.arrayBuffer();
  const mime = res.headers["content-type"] || "image/jpeg";
  return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
}
```

---

## 八、风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| WebFetch 被反爬 | 3 个源并行搜索 + 降级策略；设置合理 User-Agent；缓存搜索结果 |
| 魔搭文生图 60s 超时 | 轮询间隔 5s × 12 次 = 60s；超时返回错误让 LLM 重试 |
| HTML 响应过大（>200KB） | Base64 图片压缩为 JPEG quality=80；限制每页最多 2 张图 |
| 种子模板更新不同步 | 模板从 assets/*.html 自动读取/转换，不手写 |
| FC 冷启动慢 | 首次调用可能 2-5s；后续请求复用实例 |
| 46 个版式 HTML skeleton 工作量大 | Phase 5 优先实现最常用的 10 个版式，其余返回"暂不支持" |

---

## 九、与原 Skill 的兼容性

- **保留**：`assets/*.html`、`references/*.md`、`validate-social-deck.mjs`、`scripts/*`、`SKILL.md`
- **新增**：`src/` 全部代码、`dist/` 编译产物、`mcp.json`、`tsconfig.json`
- **修改**：`package.json`（加依赖和脚本）、`README.md`（加 MCP 服务说明）
- **不删除**：任何现有文件

原 Skill 的"手工 Agent 工作流"和"MCP 服务"并存——用户可继续按 SKILL.md 在 Claude Code 里手工作业，也可用 MCP 服务自动化。

---

## 十、假设与决策

1. **假设**：魔搭 FC 支持 Node.js 20 + ESM + undici（需验证）
2. **假设**：WebFetch 搜索页在 FC 环境下不被墙（阿里云 IP 段通常可访问 Unsplash/Pexels）
3. **决策**：MCP 服务只输出小红书 3:4 画板（用户确认），1:1 和 21:9 暂不支持
4. **决策**：图片用 Base64 内嵌 HTML（用户确认），不依赖外部 CDN
5. **决策**：图源策略 A（WebFetch 免 key），不使用 Unsplash/Pexels 官方 API
6. **决策**：46 个版式先实现高频 10 个，其余后续迭代补充
7. **决策**：validator 不集成进 MCP 服务（客户端拿到 HTML 后可自行运行）

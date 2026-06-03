# Social Card Skill — Code Wiki

> 结构化技术文档，涵盖项目架构、模块职责、关键类/函数、依赖关系与运行方式。
> 版本：v0.14 · 最后更新：2026-05-28

---

## 1. 项目概述

**Social Card Skill** 是一个面向 Claude Code / Codex 等 AI Agent 环境的"技能包"（Skill），用于将文章、文案、截图、产品笔记、字幕或照片自动生成为高质量社交图文卡片。

### 1.1 核心能力

| 能力 | 说明 |
|------|------|
| 双视觉系统 | Editorial Magazine（电子杂志风）+ Swiss International（瑞士国际主义风） |
| 多平台输出 | 小红书 3:4（1080×1440）、公众号 21:9（2100×900）+ 1:1（1080×1080） |
| 版式骨架 | 28 个预定义版式（Editorial M01-M16 + Swiss S01-S12） |
| 主题预设 | 10 套色板（Editorial 6 套 + Swiss 4 套锚点色） |
| 图源工作流 | Unsplash → Pexels → Flickr CC → Wallhaven → 直接搜索 |
| 质量校验 | Playwright 驱动的 7 条自动校验规则 |
| 渲染管线 | 单文件 HTML + Playwright 截图 → PNG 输出 |

### 1.2 设计哲学

- **克制优于喊话** — 信息流里克制色板反而最显眼
- **结构优于装饰** — 字号 + 字体对比 + 网格留白撑起信息层级
- **版式优于自由** — 28 个版式骨架先选后改，不发明不存在的页面
- **越大越细** — 大字号必须配轻字重（Swiss/Editorial 共同原则）

---

## 2. 项目架构

### 2.1 目录结构

```
social-card-skill/
├── SKILL.md                          # 7 步工作流入口（Agent 调用主文件）
├── HANDOFF.md                        # 交接文档：事实 + 版本历史
├── PRODUCT.md                        # 产品文档：思考 + 决策 + Roadmap
├── README.md / README.en.md          # 中英双语项目介绍
├── validate-social-deck.mjs          # Playwright 版式校验脚本（Node/ESM）
├── package.json                      # 仅依赖 playwright
├── .gitignore                        # 忽略 local-tests/ 与 node_modules/
│
├── assets/                           # 核心资产
│   ├── template-editorial-card.html  # Editorial 种子模板（6 主题 / 3 画板）
│   ├── template-swiss-card.html      # Swiss 种子模板（4 accent / 3 画板）
│   ├── magazine-bg-webgl.js          # WebGL 墨流背景（含 2D fallback）
│   └── screenshot-backgrounds/       # 9 张 WebP 截图舞台底图
│       ├── style-a/                  #   Editorial 5 张
│       └── style-b/                  #   Swiss 4 张
│
├── references/                       # 子规范文档（按需读取）
│   ├── platform-specs.md             # 平台 × 分辨率 × 命名规范
│   ├── style-system.md               # 两种风格的硬规则与反模式
│   ├── theme-presets.md              # 10 套色票详解
│   ├── layout-recipes.md             # 28 个版式骨架（M01-M16 + S01-S12）
│   ├── components.md                 # 字体 / 卡片 / 间距 / 图标 / 标题字数表
│   ├── background-systems.md         # 墨流 / 网格 / 纸纹层
│   ├── portrait-fill.md              # 3:4 板的留白对策
│   ├── content-planning.md           # 钩子 / 拆页 / 文案压缩
│   ├── image-overlay.md              # 满铺图遮罩 + 人脸避让规则
│   ├── screenshot-treatment.md       # 截图处理工具类
│   ├── map-component.md              # MapLibre / OSM 地图组件
│   ├── title-shortener.md            # 公众号 1:1 短标题策略
│   ├── category-cookbook.md          # 小红书 11 个品类路由表
│   ├── production-workflow.md        # Playwright 渲染管线
│   └── qa-checklist.md               # 交付前质量检查清单
│
└── agents/
    └── openai.yaml                   # 子代理配置（备用）
```

### 2.2 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│  Agent 调用层                                                │
│  ├── SKILL.md（7 步工作流：Intake → Extract → Style →       │
│  │   Plan → Seed → Build → Image → Deliver）                │
│  └── references/*.md（按需读取的子规范）                      │
├─────────────────────────────────────────────────────────────┤
│  模板与资产层                                                │
│  ├── assets/template-editorial-card.html（杂志风种子）       │
│  ├── assets/template-swiss-card.html（瑞士风种子）           │
│  ├── assets/magazine-bg-webgl.js（动态背景）                 │
│  └── assets/screenshot-backgrounds/*.webp（材质底图）        │
├─────────────────────────────────────────────────────────────┤
│  渲染与校验层                                                │
│  ├── Playwright 截图（HTML → PNG）                           │
│  └── validate-social-deck.mjs（R1-R7 自动校验）              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 主要模块职责

### 3.1 SKILL.md — 工作流编排器

**职责**：定义 Agent 执行图文生成的完整 7 步工作流，是 Agent 调用本 Skill 的入口文件。

| 步骤 | 名称 | 职责 |
|------|------|------|
| Step 1 | Intake | 收集目标平台、内容素材、用户图片、风格偏好 |
| Step 2 | Extract The Story | 将源内容转化为页面规划（封面钩子 + 每页一个观点） |
| Step 3 | Choose Style Mode | 选择 Editorial 或 Swiss 视觉系统 + 主题色 |
| Step 4 | Plan Pages | 根据内容结构选择版式骨架（M01-M16 / S01-S12） |
| Step 4.5 | Copy The Seed Template | 拷贝种子模板到任务目录 |
| Step 5 | Build And Render | 替换 `<!-- POSTERS_HERE -->` 占位符，渲染 PNG |
| Step 6 | Image And Screenshot Handling | 处理用户图 / 网络取图 / AI 生图，文字压图规则 |
| Step 7 | Deliver | 先展示给用户看，按需运行 validator |

### 3.2 种子模板（assets/）

#### template-editorial-card.html

**职责**：Editorial Magazine × E-ink 风格的单文件 HTML 种子模板。

**关键特性**：
- 6 套主题色通过 `<html data-theme="...">` 切换
- 3 种画板尺寸：`.poster.xhs` (1080×1440)、`.poster.square` (1080×1080)、`.poster.wide` (2100×900)
- 字体栈：Noto Serif SC（标题）、Playfair Display（英文衬线）、Noto Sans SC（正文）、IBM Plex Mono（标签）
- 背景层系统：paper-wash + grain + 可选 WebGL canvas
- Midnight Ink 暗色主题的特殊覆盖（grain 翻转为 screen-mode、paper-wash 改为金辉 vignette）

#### template-swiss-card.html

**职责**：Swiss International 风格的单文件 HTML 种子模板。

**关键特性**：
- 4 套锚点色通过 `<html data-accent="...">` 切换
- 同样 3 种画板尺寸
- 字体栈：Inter / Helvetica Neue + Noto Sans SC + IBM Plex Mono
- 装饰层：dot-mat / ring-mat / cross-mat（可选网格/点阵/十字纹理）
- 严格的 "the larger, the lighter" 字重规则

#### magazine-bg-webgl.js

**职责**：可复用的 WebGL 墨流背景，用于 Editorial 封面的氛围层。

**关键函数**：

| 函数 | 签名 | 说明 |
|------|------|------|
| `rgb` | `rgb(input, fallback)` | 将 [0-255] RGB 数组归一化为 [0-1] |
| `fallback2d` | `fallback2d(canvas, opts)` | WebGL 不可用时降级为 2D Canvas 渲染 |
| `mount` | `mount(canvas, options)` | 主入口：初始化 WebGL 上下文、编译着色器、启动渲染循环 |

**着色器架构**：
- Vertex Shader：简单全屏 quad（`attribute vec2 aPos`）
- Fragment Shader：基于 FBM（分形布朗运动）的墨流噪声算法
- Uniforms：`uRes`（分辨率）、`uTime`（时间）、`uInk`/`uPaper`/`uAccent`（三色）、`uStrength`（强度）

### 3.3 validate-social-deck.mjs — 质量校验器

**职责**：基于 Playwright 真实 DOM 渲染的自动化校验脚本，检测版式违规。

**入口**：
```bash
node validate-social-deck.mjs <task-dir|index.html> [--style=swiss|editorial]
```

**7 条校验规则**：

| 规则 | 名称 | 检测内容 | 严重级别 |
|------|------|----------|----------|
| R1 | Overflow | `scrollHeight > clientHeight`（内容溢出画板） | FAIL |
| R2 | Footer Collision | `.foot` 为 `position:absolute` 且上方内容侵入其区域 | FAIL |
| R3 | Swiss Bold Display | Swiss 模式下 display 标题字重 ≥600（违反"越大越细"） | FAIL |
| R4 | Min Readable Font | body/lead/caption 低于移动端可读下限 | WARN |
| R5 | 4-Band Density | 3:4 画板内容覆盖率 <75% 或相邻两带均欠填 | WARN |
| R6 | H-XL Hard Cap | 标题行数/字数超出画板硬上限 | WARN |
| R7 | Figure Margin Drift | 浏览器默认 `<figure>` margin 导致媒体错位 | WARN |

**关键数据结构**：

```javascript
const MIN_FONT = {
  body: 22, lead: 26, caption: 18, meta: 18,
  cellTitle: 20, numAnnotation: 20
};

const HXL_CAPS = {
  xhs:    { maxLines: 2, maxChars: 8 },
  square: { maxLines: 2, maxChars: 7 },
  wide:   { maxLines: 1, maxChars: 14 }
};
```

**风格自动检测逻辑**：
1. 检查 `<html data-theme>` → editorial
2. 检查 `<html data-accent>` → swiss
3. Fallback：扫描 `.h-display/.h-xl/.h-hero` 的 `font-family`，含 serif token → editorial，否则 swiss

### 3.4 references/ — 规范文档集

| 文件 | 职责 | 被谁引用 |
|------|------|----------|
| `platform-specs.md` | 定义各平台输出尺寸、安全区、命名规范 | SKILL.md Step 1/5 |
| `style-system.md` | 两种视觉系统的硬规则、反模式、身份测试 | SKILL.md Step 3 |
| `theme-presets.md` | 10 套色票的精确 CSS token | 种子模板、SKILL.md Step 3 |
| `layout-recipes.md` | 28 个版式骨架的结构、HTML skeleton、最小密度要求 | SKILL.md Step 4 |
| `components.md` | 字体栈、字号表、字重映射、中文标题字数带、间距 token | 种子模板、validator |
| `background-systems.md` | WebGL/墨流/网格/纸纹层的构建规则 | SKILL.md Step 5 |
| `image-overlay.md` | 文字压图四步法（选图→无遮罩→局部 tint→缩略图测试） | SKILL.md Step 6 |
| `screenshot-treatment.md` | `.frame-shot`/`.device-browser`/`.device-phone` 工具类 | SKILL.md Step 6 |
| `map-component.md` | MapLibre + OSM 地图组件规范 | SKILL.md Step 5 |
| `category-cookbook.md` | 11 个小红书品类的版式路由与陷阱 | SKILL.md Step 1 |
| `content-planning.md` | 封面钩子、拆页策略、文案压缩 | SKILL.md Step 2 |
| `title-shortener.md` | 21:9 长标题 → 1:1 短标题的 5 步提取法 | SKILL.md Step 2 |
| `production-workflow.md` | 任务目录结构、HTML/CSS 渲染模式 | SKILL.md Step 5 |
| `qa-checklist.md` | 交付前人工检查清单 | SKILL.md Step 7 |

---

## 4. 关键类与数据结构

### 4.1 画板类（CSS）

```css
.poster          /* 基础画板：relative, overflow:hidden, isolation:isolate */
.poster.xhs      /* 小红书 3:4  → 1080×1440 */
.poster.square   /* 方封面 1:1  → 1080×1080 */
.poster.wide     /* 公众号 21:9 → 2100×900 */
```

### 4.2 Editorial 排版角色类

| 类名 | 尺寸(3:4) | 字重 | 字距 | 字族 | 用途 |
|------|-----------|------|------|------|------|
| `.h-display` | 124px | 500 | +.04em | serif-zh | 封面大标题 |
| `.h-xl` | 88px | 500 | +.03em | serif-zh | 章节标题 |
| `.h-md` | 56px | 500 | +.02em | serif-zh | 中标题 |
| `.h-sub` | 36px | 400 it | normal | serif-en | 副标题 |
| `.pullquote` | 64px | 500 it | normal | serif-zh | 引语 |
| `.lead` | 28px | 400 | normal | **serif-zh** | 导语 |
| `.body` | 24px | 400 | normal | **serif-zh** | 正文 |
| `.kicker` | 21px | 500 | +.22em | mono | 顶部标签 |
| `.meta`/`.label` | 18px | 500 | +.20em | mono | 元数据/标签 |

### 4.3 Swiss 排版角色类

| 类名 | 尺寸(3:4) | 字重 | 字族 | 用途 |
|------|-----------|------|------|------|
| `.h-hero` | 240px | 200 | sans | 封面巨标题 |
| `.h-statement` | 180px | 200 | sans | 宣言式标题 |
| `.h-xl` | 120px | 300 | sans | 章节标题 |
| `.h-md` | 56px | 400 | sans | 中标题 |
| `.num-mega` | 200px | 200 | sans | 巨型数字 |
| `.num-xl` | 144px | 200 | sans | 大数字 |
| `.lead` | 30px | 400 | sans-zh | 导语 |
| `.body` | 26px | 400 | sans-zh | 正文 |
| `.t-cat` | 22px | 600 | sans | 分类标签 |
| `.t-meta` | 20px | 500 | mono | 元数据 |
| `.swiss-img-caption` | 18px | 500 | mono | 图片说明 |

### 4.4 主题 Token 结构

**Editorial**（以 `data-theme` 驱动）：
```css
--paper          /* 背景纸色 */
--paper-2        /* 次要纸色 */
--ink            /* 主文字色 */
--muted          /* 次要文字色 */
--line           /* 分割线色 */
--accent         /* 强调色 */
--accent-soft    /* 柔和强调色 */
--ink-rgb        /* RGB 格式 ink（用于 rgba()） */
--paper-rgb      /* RGB 格式 paper */
--accent-rgb     /* RGB 格式 accent */
```

**Swiss**（以 `data-accent` 驱动）：
```css
--paper          /* 背景色（统一 #fafaf8） */
--ink            /* 主文字色（统一 #0a0a0a） */
--grey-1/2/3     /* 三级灰阶 */
--accent         /* 锚点强调色（4 套之一） */
--accent-on      /* 锚点色上的文字色 */
```

### 4.5 间距 Token

```css
--sp-3:  8px;   --sp-4:  12px;  --sp-5:  16px;
--sp-6:  24px;  --sp-7:  32px;  --sp-8:  40px;
--sp-9:  48px;  --sp-10: 64px;  --sp-11: 80px;
--sp-12: 96px;  --sp-13: 160px;
```

---

## 5. 依赖关系

### 5.1 运行时依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `playwright` | `^1.60.0` | 浏览器自动化：渲染 HTML → 截图 PNG、validator DOM 测量 |

### 5.2 外部服务依赖

| 服务 | 用途 | 是否必需 |
|------|------|----------|
| Google Fonts API | 加载 Noto Serif SC / Noto Sans SC / Playfair Display / Inter / IBM Plex Mono | 是（在线字体） |
| unpkg.com (Lucide) | Swiss 模板加载 Lucide 图标库 | 是（Swiss 模式） |
| Unsplash / Pexels / Flickr CC / Wallhaven | 网络图源（用户无图时） | 否（按需） |
| Mapbox Static Images API / OSM | 地图组件瓦片 | 否（按需） |

### 5.3 模块依赖图

```
SKILL.md
  ├── references/platform-specs.md
  ├── references/style-system.md
  ├── references/theme-presets.md
  ├── references/layout-recipes.md
  ├── references/components.md
  ├── references/background-systems.md
  ├── references/image-overlay.md
  ├── references/screenshot-treatment.md
  ├── references/map-component.md
  ├── references/category-cookbook.md
  ├── references/content-planning.md
  ├── references/title-shortener.md
  ├── references/production-workflow.md
  └── references/qa-checklist.md

assets/template-editorial-card.html
  ├── Google Fonts (Noto Serif SC, Playfair Display, Noto Sans SC, Inter, IBM Plex Mono)
  └── assets/magazine-bg-webgl.js (可选)

assets/template-swiss-card.html
  ├── Google Fonts (Inter, Noto Sans SC, IBM Plex Mono)
  └── unpkg.com/lucide (图标)

validate-social-deck.mjs
  └── playwright (chromium)
```

---

## 6. 项目运行方式

### 6.1 安装

```bash
# 方式一：一行命令（推荐）
npx skills add https://github.com/op7418/social-card-skill --skill social-card-skill

# 方式二：手动克隆
git clone https://github.com/op7418/social-card-skill.git ~/.claude/skills/social-card-skill

# 安装依赖
cd ~/.claude/skills/social-card-skill
npm install
```

### 6.2 典型工作流（Agent 驱动）

```text
用户: "帮我基于这篇文章做一套瑞士风小红书图文，5 张，IKB 蓝。"
  ↓
Agent 读取 SKILL.md → 执行 7 步工作流
  ↓
Step 1: Intake → 确认平台(小红书)、风格(Swiss)、内容(文章)、图片(无→三选一)
  ↓
Step 2: Extract → 提取核心观点，规划 5 页结构
  ↓
Step 3: Style → 选定 Swiss + IKB 蓝
  ↓
Step 4: Plan → 选择版式骨架（如 S01 封面 + S07 要点 + S10 图表 + S11 清单 + S12 矩阵）
  ↓
Step 4.5: Seed → 拷贝 assets/template-swiss-card.html → task-dir/index.html
  ↓
Step 5: Build → 替换 <!-- POSTERS_HERE -->，填入每页 HTML
  ↓
Step 6: Image → 取图/生图，处理文字压图
  ↓
Step 7: Deliver → Playwright 渲染 PNG → 展示给用户 → 按需运行 validator
```

### 6.3 手动渲染（独立使用）

```bash
# 创建任务目录
mkdir social-card-example && cd social-card-example

# 拷贝种子模板
cp ~/.claude/skills/social-card-skill/assets/template-swiss-card.html index.html

# 编辑 index.html，替换 <!-- POSTERS_HERE --> 为实际内容

# 渲染（需要 render.mjs，由 Agent 或用户自行提供）
node render.mjs

# 输出在 output/ 目录
ls output/
```

### 6.4 运行校验器

```bash
# 校验整个任务目录
node validate-social-deck.mjs social-card-example/

# 或校验单个 HTML
node validate-social-deck.mjs social-card-example/index.html

# 显式指定风格
node validate-social-deck.mjs social-card-example/ --style=swiss

# 通过 npm script
npm run validate -- social-card-example/
```

### 6.5 校验器输出示例

```
==== validate-social-deck ====
target:   social-card-example/index.html
style:    swiss
sections: 5  ·  3 clean  ·  0 fails  ·  2 warns
rules:    R4=1  R5=1

[PASS]  xhs-01 · xhs
[PASS]  xhs-02 · xhs
[WARN]  xhs-03 · xhs
  WARN · R4  lead "这是导语文字..." at 24px < 26px floor
         fix: cut copy instead of shrinking type (components.md Minimum Readable Sizes)
  WARN · R5  density 68% (bands 78% / 82% / 45% / 68%)
         fix: expand copy or switch recipe — see qa-checklist.md 4-band density
[PASS]  xhs-04 · xhs
[PASS]  xhs-05 · xhs

Legend: R1 overflow · R2 footer collision · R3 swiss bold display · R4 min font
        · R5 4-band density · R6 h-xl cap · R7 figure margin drift
Exit code 1 only on FAIL. Warnings are advisory.
```

---

## 7. 版本历史（关键里程碑）

| 版本 | 日期 | 主题 |
|------|------|------|
| v0.14 | 2026-05-28 | 截图美化素材从 PPT skill 迁移（9 张 WebP 背景 + `.bg-asset-*` 规则） |
| v0.13 | 2026-05-27 | Git 初始化 + 仓库瘦身（`local-tests/` 移入 `.gitignore`） |
| v0.12 | 2026-05-27 | Editorial 美学回退 + Midnight Ink 暗色主题 + 图片裁切策略 + 交付流程调整 |
| v0.11 | 2026-05-27 | Validator 上线（R1-R6）+ Editorial 冒烟测试 |
| v0.10 | 2026-05-26 | 内容密度硬规则 + 风格-内容类型解绑 + 全版式 showcase（28 张） |
| v0.9 | 2026-05-26 | M16 Image-Led Cover 杂志化重写 + image-overlay 规则硬化 |
| v0.8 | 2026-05-26 | M16 满图封面 recipe 新增 |
| v0.7 | 2026-05-26 | 图源扩展（Pexels + Flickr CC） |
| v0.6 | 2026-05-26 | 冒烟测试 + Swiss 种子模板硬化 |
| v0.5 | 2026-05-26 | image-overlay 规则上线 |
| v0.4 | 2026-05-26 | 种子模板系统建立 + 9 个新版式补全 |
| v0.3- | 更早 | 初始体系建立 |

---

## 8. 已知限制与风险

| 限制 | 说明 |
|------|------|
| 校验器按需运行 | 默认不自动跑 validator，需用户明确要求才执行 |
| 无跨平台一次出包 | 同一文章出小红书 + 公众号需开两个任务文件夹 |
| 品类能力圈未硬编码 | `category-cookbook.md` 写明了不接的品类，但需执行者主动告知用户 |
| 图片来源签名用户决定 | `SOURCES.md` 总会写，但是否在图上加标注由用户回答 |
| 无动效 | 所有输出为静态 PNG，WebGL 仅用于一次性渲染纹理 |
| 在线字体依赖 | 种子模板依赖 Google Fonts CDN，离线环境需自行托管字体 |

---

## 9. 贡献指南

改动优先级：

1. 改种子模板时，同步更新 `references/components.md` 对照表
2. 新增版式时，在 `references/layout-recipes.md` 加完整 recipe
3. 新增主题色时，同步更新种子模板的 `[data-theme="..."]` 块 + `references/theme-presets.md`
4. 新增 Swiss 规则时，同步更新 `validate-social-deck.mjs`
5. 踩坑记录写到 `references/qa-checklist.md`
6. 测试与 demo 放在 `local-tests/` 下，不污染 skill 根目录

---

## 10. 许可证

**AGPL-3.0** © 2026 [op7418](https://github.com/op7418)

- 必须署名
- 衍生品必须开源
- 网络服务也要开源
- 不允许闭源、专有化、仅付费分发

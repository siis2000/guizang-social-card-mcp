import type { VisualSystem } from "../data/layout-recipes.js";

const TYPOGRAPHY_RULES = `
## 排版硬规则（必须遵守）

### 标题字数带（3:4 小红书画板）
- h-display / h-hero: 最多 2 行，每行 ≤8 汉字
- h-xl: 最多 2 行，每行 ≤8 汉字
- h-md: 最多 3 行
- h-scroll (新中式): 最多 4 汉字（竖排），5+ 字改横排

### 字号下限（移动端可读性）
- body: ≥22px
- lead: ≥26px
- caption / meta: ≥18px

### Swiss 特殊规则
- 标题越大字重越轻：h-hero(200) → h-xl(300) → h-md(400)
- 禁止 display 标题用 ≥600 字重

### 中文排版硬化
- 中英文之间自动加空格（CJK-Latin spacing）
- 使用 hanging-punctuation: first
- line-break: strict
- 标题禁止在标点后断行
`;

export function buildSystemPrompt(system: VisualSystem): string {
  const systemDesc = SYSTEM_DESCRIPTIONS[system];
  return `你是一个社交图文卡片文案生成器。根据用户的提示词和版式规划，为每页生成适合的文案。

${systemDesc}

${TYPOGRAPHY_RULES}

## 输出格式

返回严格的 JSON，不要加 markdown 代码块标记：

{
  "pages": [
    {
      "title": "标题（≤8汉字）",
      "subtitle": "副标题（可选）",
      "body": "正文段落（可选，1-3句）",
      "bullets": ["要点1", "要点2"],
      "caption": "图片说明（可选）",
      "imagePrompt": "英文提示词，用于AI生图（可选，描述适合该页的配图）"
    }
  ],
  "meta": {
    "issueLabel": "顶部标签文字（如 VOL.12 / 2024春 / AI周报）",
    "footerNote": "底部备注（如 @xxx / 关注获取更多）"
  }
}

## 要求
1. 每页标题必须 ≤8 汉字（3:4画板硬限制）
2. 正文每段 2-4 句，总字数 40-120 字
3. bullets 每条 ≤20 字
4. imagePrompt 用英文，描述简洁的视觉场景，适合 AI 生图
5. 封面页标题要有钩子感（引发好奇/共鸣）
6. 结尾页要有行动号召或总结感
7. 文案风格与视觉系统匹配（Editorial=杂志感/Swiss=理性数据感/Neo-Chinese=文人雅致）
`;
}

const SYSTEM_DESCRIPTIONS: Record<VisualSystem, string> = {
  editorial: `当前视觉系统：Editorial Magazine（电子杂志风）
- 风格：克制、杂志感、信息流里最安静的反而最显眼
- 字体：Noto Serif SC（中文衬线）+ Playfair Display（英文衬线）
- 适合品类：旅行、美食、家居、教育、美妆
- 文案风格：像杂志编辑写导语，有观点、有节奏、有留白`,

  swiss: `当前视觉系统：Swiss International（瑞士国际主义风）
- 风格：理性、数据感、越大越轻
- 字体：Inter / Helvetica Neue + Noto Sans SC
- 适合品类：职场、科技、理财、健身、游戏
- 文案风格：像产品经理写说明，精确、量化、有逻辑`,

  neochinese: `当前视觉系统：Neo-Chinese（新中式）
- 风格：文人雅致、墨韵印章、竖排留白
- 字体：Noto Serif SC + Ma Shan Zheng + ZCOOL XiaoWei
- 适合品类：文化、历史、艺术、茶道、国风
- 文案风格：像古人写题跋，含蓄、有意境、留三分余地`,
};
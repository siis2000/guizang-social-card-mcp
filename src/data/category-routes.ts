import type { VisualSystem, PageType } from "./layout-recipes.js";

export interface CategoryRoute {
  id: string;
  name: string;
  keywords: string[];
  recommendedStyle: VisualSystem;
  coverLayouts: string[];
  contentLayouts: string[];
  summaryLayouts: string[];
  pitfalls: string;
}

export const CATEGORY_ROUTES: CategoryRoute[] = [
  {
    id: "travel",
    name: "旅行",
    keywords: ["旅行", "旅游", "出行", "攻略", "行程", "打卡", "景点", "城市", "海外", "自驾"],
    recommendedStyle: "editorial",
    coverLayouts: ["M01", "M16"],
    contentLayouts: ["M02", "M10", "M17"],
    summaryLayouts: ["M07", "M04"],
    pitfalls: "旅行品类强依赖图片，纯文字版效果差。封面必须有图。",
  },
  {
    id: "career",
    name: "职场",
    keywords: ["职场", "工作", "简历", "面试", "晋升", "管理", "团队", "效率", "办公"],
    recommendedStyle: "swiss",
    coverLayouts: ["S01"],
    contentLayouts: ["S06", "S10", "S14"],
    summaryLayouts: ["S07", "S13"],
    pitfalls: "职场内容偏理性，避免过度装饰。Swiss 的数据感更合适。",
  },
  {
    id: "gaming",
    name: "游戏",
    keywords: ["游戏", "手游", "主机", "PC", "Steam", "攻略", "评测", "角色", "装备"],
    recommendedStyle: "swiss",
    coverLayouts: ["S01", "S08"],
    contentLayouts: ["S04", "S12", "S15"],
    summaryLayouts: ["S07", "S13"],
    pitfalls: "游戏截图多，注意截图处理规范。避免模糊缩略图。",
  },
  {
    id: "food",
    name: "美食",
    keywords: ["美食", "食谱", "餐厅", "烘焙", "料理", "食材", "做饭", "探店"],
    recommendedStyle: "editorial",
    coverLayouts: ["M01", "M16"],
    contentLayouts: ["M02", "M05", "M19"],
    summaryLayouts: ["M07", "M04"],
    pitfalls: "美食图是灵魂，封面必须有大图。避免纯文字食谱。",
  },
  {
    id: "fitness",
    name: "健身",
    keywords: ["健身", "运动", "减脂", "增肌", "瑜伽", "跑步", "训练", "饮食"],
    recommendedStyle: "swiss",
    coverLayouts: ["S01", "S08"],
    contentLayouts: ["S06", "S09", "S11"],
    summaryLayouts: ["S07", "S13"],
    pitfalls: "健身数据感强，Swiss KPI/图表类版式更合适。",
  },
  {
    id: "beauty",
    name: "美妆",
    keywords: ["美妆", "护肤", "彩妆", "口红", "粉底", "面膜", "测评", "种草"],
    recommendedStyle: "editorial",
    coverLayouts: ["M01", "M16"],
    contentLayouts: ["M05", "M10", "M15"],
    summaryLayouts: ["M07", "M04"],
    pitfalls: "美妆强依赖产品图和对比图，M15 Before/After 非常适合。",
  },
  {
    id: "tech",
    name: "科技",
    keywords: ["科技", "AI", "编程", "产品", "工具", "软件", "硬件", "评测", "数码"],
    recommendedStyle: "swiss",
    coverLayouts: ["S01"],
    contentLayouts: ["S03", "S04", "S06", "S12"],
    summaryLayouts: ["S07", "S13"],
    pitfalls: "科技内容偏理性，Swiss 数据/架构类版式更合适。避免花哨装饰。",
  },
  {
    id: "culture",
    name: "文化",
    keywords: ["文化", "历史", "艺术", "书法", "国画", "古风", "诗词", "茶道", "国风"],
    recommendedStyle: "neochinese",
    coverLayouts: ["C01"],
    contentLayouts: ["C02", "C03", "C04", "C07"],
    summaryLayouts: ["C05", "C12"],
    pitfalls: "文化品类是新中式系统的主场。避免用 Swiss 做国风内容。",
  },
  {
    id: "education",
    name: "教育",
    keywords: ["教育", "学习", "考试", "考研", "英语", "方法", "笔记", "知识"],
    recommendedStyle: "editorial",
    coverLayouts: ["M01"],
    contentLayouts: ["M03", "M08", "M14", "M18"],
    summaryLayouts: ["M07", "M04"],
    pitfalls: "教育内容文字多，注意中文排版硬化规则。避免字号过小。",
  },
  {
    id: "home",
    name: "家居",
    keywords: ["家居", "装修", "设计", "收纳", "改造", "软装", "宜家", "日式"],
    recommendedStyle: "editorial",
    coverLayouts: ["M01", "M16"],
    contentLayouts: ["M02", "M06", "M10"],
    summaryLayouts: ["M07", "M04"],
    pitfalls: "家居强依赖实景图，M06 Evidence Wall 适合多图展示。",
  },
  {
    id: "finance",
    name: "理财",
    keywords: ["理财", "投资", "基金", "股票", "保险", "存款", "财务", "收入"],
    recommendedStyle: "swiss",
    coverLayouts: ["S01"],
    contentLayouts: ["S09", "S10", "S11"],
    summaryLayouts: ["S07", "S13"],
    pitfalls: "理财数据密集，Swiss 图表类版式最合适。避免花哨装饰。",
  },
];

/** Match a category by prompt keywords */
export function matchCategory(prompt: string): CategoryRoute {
  const lower = prompt.toLowerCase();
  let bestMatch: CategoryRoute = CATEGORY_ROUTES[0]; // default to travel
  let bestScore = 0;

  for (const cat of CATEGORY_ROUTES) {
    const score = cat.keywords.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = cat;
    }
  }

  return bestMatch;
}

/** Get layouts for a category, system, and page type */
export function getLayoutsForCategory(
  category: CategoryRoute,
  system: VisualSystem,
  type: PageType
): string[] {
  // If the recommended style matches the requested system, use category layouts
  if (category.recommendedStyle === system) {
    switch (type) {
      case "cover": return category.coverLayouts;
      case "content": return category.contentLayouts;
      case "summary": return category.summaryLayouts;
    }
  }
  // Otherwise return empty — the plan_card tool will fall back to system defaults
  return [];
}

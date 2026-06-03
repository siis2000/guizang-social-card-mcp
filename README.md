# Social Card Skill · 小红书图文 / 公众号封面对

![GitHub stars](https://img.shields.io/github/stars/op7418/guizang-social-card-skill?style=flat-square)
![License](https://img.shields.io/github/license/op7418/guizang-social-card-skill?style=flat-square)
![Skill](https://img.shields.io/badge/Skill-Agent-111111?style=flat-square)
![Social Cards](https://img.shields.io/badge/Social-Cards-FF4D6D?style=flat-square)
![MCP Server](https://img.shields.io/badge/MCP-Server-7C3AED?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude%20Code-Supported-6B5B95?style=flat-square)
![Codex](https://img.shields.io/badge/Codex-Supported-222222?style=flat-square)
![ModelScope](https://img.shields.io/badge/ModelScope-API-6240FF?style=flat-square)

[English README](./README.en.md)

一个适配 Claude Code / Codex 等 Agent 环境的图文卡片技能 + **MCP 服务**,用于从文章、文案、截图、产品笔记、字幕或照片生成**小红书 / Rednote 图文组图**与**公众号 21:9 + 1:1 封面对**。

内置三套视觉系统,共用一份图文工作流:

- **电子杂志风(Editorial)**。像 *Monocle* / *Kinfolk* / *Cereal* 那样克制的版面,适合叙事、生活方式、旅行、阅读、影视、个人观察。
- **瑞士国际主义(Swiss)**。网格、单一锚点色、直角发丝线、极致字号对比,适合产品测评、数据、方法论、教程、AI 工具。
- **新中式(Neo-Chinese)**。水墨留白、竖向排印、基底肌理,融合中式美学与现代网格,适合文化、茶事、民艺、建筑设计、东方哲思。

> 这个 Skill 是 [ppt-skill](https://github.com/op7418/guizang-ppt-skill) 的姊妹项目,共享美学语言但独立维护。PPT 解决"横向翻页演讲",这里解决"静态信息流图文"。

## MCP 服务

本项目提供标准 MCP 服务,可部署到魔塔社区 MCP 广场或本地运行。

### 工具列表

| 工具 | 说明 |
|------|------|
| `plan_card` | 根据提示词分析品类 → 选择视觉系统/主题 → 规划多页版式编排,返回完整 Plan JSON |
| `generate_card` | 接收 Plan,调用魔塔 LLM 生成文案 + 魔塔文生图 + WebFetch 搜索免 Key 图源,返回图文素材 |
| `compose_card` | 接收图文素材,套种子模板生成完整 HTML,图片内嵌为 Base64,输出单文件 HTML |

### 本地运行

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 启动 MCP 服务 (stdio)
node dist/server.js
```

### 部署到魔塔社区

1. 在 Gitee/GitHub 创建仓库并推送代码
2. 访问 [魔塔 MCP 广场](https://modelscope.cn/mcp) → "创建 MCP 服务"
3. 填写仓库地址,运行时选择 Node.js 20
4. 配置环境变量: `MODELSCOPE_API_KEY` (填写你的魔塔 API Key)
5. 提交审核,上线后即可被 MCP 客户端调用

## License

AGPL-3.0 © 2026 [op7418](https://github.com/op7418)

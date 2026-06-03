# Guizang Social Card MCP

**服务介绍**：基于提示词生成小红书风格社交媒体卡片的 MCP 服务。支持三套视觉系统（Editorial 杂志风、Swiss 瑞士风、Neo-Chinese 新中式），46 种版式骨架，15 套主题色。文字由魔塔 LLM 生成，图片支持 AI 生图与网络免 Key 图源搜索，最终输出 3:4 尺寸的单文件 HTML 卡片。

## 服务配置

```json
{
  "mcpServers": {
    "guizang-social-card": {
      "command": "npx",
      "args": ["guizang-social-card-mcp"],
      "env": {
        "MODELSCOPE_API_KEY": "${MODELSCOPE_API_KEY}"
      }
    }
  }
}
```

## 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `MODELSCOPE_API_KEY` | 是 | 魔塔 API Key，用于 LLM 文案生成和文生图 |

## 工具列表

| 工具 | 说明 |
|------|------|
| `plan_card` | 根据提示词分析品类，选择视觉系统/主题，规划多页版式编排 |
| `generate_card` | 调用魔塔 LLM 生成文案 + 文生图 + 网络图源搜索 |
| `compose_card` | 套模板合成完整 HTML 卡片，图片内嵌为 Base64 |

## 本地运行

```bash
npm install
npm run build
node dist/server.js
```

## 部署到魔塔社区

1. 访问 [魔塔 MCP 广场](https://modelscope.cn/mcp)
2. 创建 MCP 服务，填写本仓库地址
3. 配置环境变量 `MODELSCOPE_API_KEY`
4. 提交审核

## License

AGPL-3.0

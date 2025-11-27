# 智思体（ZhiSiTi）项目说明

该项目提供一个基于 React + TypeScript + Vite 的前端聊天应用（webapp）以及一个 Node/Express 的后端代理服务。前端用于展示对话、管理会话与文件选择；后端作为代理转发到上游 AI 服务（如 Dify Service API），并统一处理鉴权与接口兼容。

## 目录结构

- `webapp/` 前端与后端代码根目录
  - `src/` 前端源代码（React）
    - `App.tsx` 主界面与聊天逻辑（消息列表、输入框、会话侧栏、上传入口等）
    - `App.css` 样式（布局、消息气泡、输入框样式等）
    - `api.ts` 前端 API 封装（会话、消息、流式聊天、重命名等）
    - `components/ConversationSidebar.tsx` 会话侧栏组件（会话选择、更多菜单等）
  - `server/index.js` 后端代理（Express），转发 `/api/*` 到上游服务
  - `vite.config.ts` Vite 开发代理配置（`/api` → `http://localhost:3000`）
  - `package.json` 前后端依赖与脚本

## 启动与运行

1. 安装依赖：
   - 进入 `webapp` 目录：`cd webapp`
   - 安装：`npm install`

2. 启动后端代理（默认端口 `3000`）：
   - `npm run server`

3. 启动前端开发服务器（默认端口 `5175` 或 `5173`）：
   - 新开终端仍在 `webapp` 目录：`npm run dev`
   - 预览地址：`http://localhost:5175/`（IDE 环境可能显示为 `5173`）

> 提示：开发环境下，Vite 已将 `/api` 路径代理到后端 `http://localhost:3000`，无需在前端手动变更 API 基址。

## 环境变量

后端代理会从多级位置加载 `.env`，支持以下变量：

- `DIFY_BASE_URL` 上游 AI 服务基础 URL（默认 `http://localhost/v1`）
- `DIFY_API_KEY_JIAOWU`、`DIFY_API_KEY_TUIJIAN`、`DIFY_API_KEY_WENXIAN`、`DIFY_API_KEY_ZHUJIAO` 各智能体的 API Key。

前端通过 `VITE_SERVER_BASE` 控制访问的后端地址（默认 `http://localhost:3000`）。

## 主要功能

- 会话管理：列表展示、置顶、重命名、删除。
- 消息展示：支持 Markdown 与代码高亮，滚动吸底。
- 聊天输入：多行 `textarea`，快捷键 `Enter` 发送、`Shift+Enter` 换行。
- 文件选择：点击回形针选择本地文件（示例中仅在界面内提示文件名，可扩展为真实上传）。

## 后端接口概览（代理层）

后端以 `/api/:agent/*` 形式代理到上游服务：

- `GET /api/agents` 返回可用智能体列表（包含是否配置了 Key）。
- `GET /api/:agent/conversations?user=xxx` 获取会话列表。
- `GET /api/:agent/messages?conversation_id=xxx&user=xxx` 获取会话消息。
- `POST /api/:agent/chat-messages` 发送消息，默认流式（SSE）返回，异常时自动降级。
- `DELETE /api/:agent/conversations/:conversation_id?user=xxx` 删除会话。
- `POST /api/:agent/conversations/:conversation_id/name` 重命名或触发自动生成标题。
- `GET /api/:agent/parameters` 获取 Agent 参数配置。
- `GET /api/:agent/messages/:message_id/suggested?user=xxx` 获取建议回复（如有）。

接口细节参考 `webapp/server/index.js` 与 `API.md`。

## 前端调用要点

封装于 `src/api.ts`：

- `fetchAgents()`、`fetchConversations()`、`fetchMessages()` 基础数据拉取。
- `streamChat(agentId, body, onEvent)` 流式聊天；`onEvent` 将收到 `{ event, answer, conversation_id, message_id, error }`。
- `deleteConversation()`、`renameConversation()` 会话操作。
- `fetchParameters()` 拉取参数；`getOrCreateUserId()` 本地生成并持久化用户标识。

## UI 定制与近期变更

- 回形针按钮：透明背景、深灰描边，点击触发隐藏的 `file input`。
- 输入框占位文案：由“输入消息…(Shift+Enter 换行)”改为“尽管问...”。
- 输入区文本背景：`textarea` / `input` 使用透明背景；整体外框仍为浅色卡片（可按需调整 `composer-box` 背景）。
- 会话更多菜单：点击后不再立即关闭，支持内联重命名（输入框 + 保存/取消）。
- 消息区底部留白已收紧，与输入框间距更近（`messages` 与 `composer` 的 padding 调整）。

## 生产部署建议

- 将后端代理部署在受控环境，确保 API-Key 安全，不在前端暴露。
- 配置反向代理统一域名，例如：`/api` 由前端网关转发到后端服务。
- 对静态资源与 `BASE_URL` 做好子路径部署适配（`App.tsx` 已基于 `BASE_URL` 构造 `LOGO_URL`）。

## 常见问题

- 图标样式未生效：检查是否有全局主题覆盖，必要时使用 `!important` 或在 SVG 上直接固定 `stroke` 颜色。
- SSE 流式异常：代理会自动降级到阻塞模式并将错误以事件形式返回，前端需处理 `error` 与 `event: end`。
- 端口差异：IDE 可能显示为 `5173`，Vite 实际端口以终端输出为准（通常 `5173/5175`）。

---

如需将文件选择接入真实上传（`POST /files/upload`）并在 `streamChat` 的 `inputs.files` 传入返回的 `upload_file_id`，可在后端增加一个上传代理并在前端补充上传逻辑，我可以继续为你实现。


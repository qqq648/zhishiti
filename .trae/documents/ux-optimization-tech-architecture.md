## 1.Architecture design

```mermaid
graph TD
  "用户浏览器" --> "React 前端应用"
  "React 前端应用" --> "Supabase SDK"
  "Supabase SDK" --> "Supabase Service"

  subgraph "Frontend Layer"
    "React 前端应用"
  end

  subgraph "Service Layer (Provided by Supabase)"
    "Supabase Service"
  end
```

## 2.Technology Description
- Frontend: React@18 + vite + tailwindcss@3 (或保留现有 CSS)
- Initialization Tool: vite-init
- Backend: None（当前优化集中于前端交互与样式，无需新增后端）

## 3.Route definitions
| Route | Purpose |
|-------|---------|
| / | 聊天页：对话历史、消息列表、输入栏与等待动画、代码块显示 |

## 4.API definitions
（无新增后端服务，本次改动不涉及 API 变更）

## 5.Server architecture diagram
（无后端服务，略）

## 6.Data model
（不涉及数据库结构变更，略）
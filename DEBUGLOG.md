# 开发日志

## 2026-07-22

### Bug 修复

1. **后端未启动导致全部文章 404**
   - 原因：后端 Express 服务器未运行，Vite 代理 `/api` → `localhost:3001` 失败
   - 修复：启动后端 + 修正 `the-first.md` 的 `draft: "false"`（字符串 → 布尔值）

2. **文章详情页显示 HTML 源码**
   - 原因：后端用 `marked(content)` 预渲染 HTML，但前端 `ReactMarkdown` 期望 Markdown 文本
   - 修复：后端返回原始 Markdown，由前端 ReactMarkdown 渲染（保留代码高亮等自定义样式）

---

### 文章分类系统

#### 后端
- **新建** `server/content/categories.json`：分类定义（技术 / 随记），含 slug、name、description
- **新建** `server/routes/categories.js`：分类 CRUD API（GET 公开，POST/PUT/DELETE 需鉴权）
- **修改** `server/index.js`：挂载 `/api/categories` 路由
- **修改** `server/routes/posts.js`：
  - 所有端点返回 `category` 字段
  - GET 列表支持 `?category=tech` 查询筛选
  - `yamlify()` 过滤 null/undefined 值
  - POST/PUT 支持写入 category

#### 前端
- **重写** `src/lib/api.js`：新增 `fetchCategories`、`createCategory`、`updateCategory`、`deleteCategory`、共享 `authedFetch`
- **新建** `src/components/CategoryBar.jsx`：首页横排分类筛选 pill（移动端）
- **新建** `src/components/CategoryNav.jsx`：右侧垂直分类导航面板（桌面端，含文章计数 + sticky）
- **修改** `src/components/PostCard.jsx`：分类 badge（accent 实色 + 图标）
- **修改** `src/components/PostDetail.jsx`：分类 badge（header 中显示）
- **修改** `src/components/Editor.jsx`：分类下拉选择框
- **修改** `src/components/Admin.jsx`：分类管理面板（新增/编辑/删除 + 内联编辑）

#### 文章迁移
- 6 篇文章全部添加 `category` frontmatter（tech × 3 / notes × 3）

---

### 首页布局重构

- **修改** `src/pages/Home.jsx`：
  - 全宽布局，左右双栏：左侧主内容 + 右侧分类导航
  - 桌面端 `lg:flex-row lg:items-stretch`，移动端退化为单列
  - 经多轮调整：`px-8` 左右对称间距、去除 `max-w` 限制
- **修改** `src/components/Hero.jsx`：精简尺寸（text-2xl），适配左侧预留区
- **修改** `src/components/PostList.jsx`：
  - 卡片单列排列（去掉 `sm:grid-cols-2`）
  - 支持 `category` prop 进行后端筛选
  - 空状态区分"无文章"与"该分类下暂无文章"
- **修改** `src/components/PostCard.jsx`：
  - 统一卡片高度（`h-full`）
  - 描述文本 `line-clamp-2` 截断
  - 布局重构：日期 → 分类 → 标题 → 描述 → 标签 → 阅读按钮

---

### 主题与视觉

#### 暗色模式锁定
- 删除 `ThemeToggle.jsx` 导入和使用，导航栏移除切换按钮
- `index.html` 硬编码 `class="dark"`，永久暗色模式

#### 背景图片
- 使用 `body::before` 伪元素设置全屏固定背景图
- 叠加 `linear-gradient(rgba(0,0,0,0.25))` 暗度控制
- 先后测试 `overall.png` / `overall2.png` / `overall3.png` / `overall4.png`
- 所有图片存放于 `pictures/` 并复制到 `public/` 供 Vite 访问

#### 毛玻璃卡片探索
- **关键发现**：`backdrop-blur` 让背景色透明度变化完全不可见
  - 无论 background 是 `rgba(24,24,27,0.06)` 还是 `0.3`，加上 blur 后视觉一样
  - 去掉 blur 后透明度变化立刻可见
- **当前方案**：`background: rgba(24,24,27,0.3)` + 噪点纹理 + 微光边框，无 blur
- CSS `.glass` 工具类：`::before` SVG feTurbulence 噪点 + `::after` 方向光
- 卡片阴影：teal 环境光 `box-shadow` + `border-white/[0.06]`
- hover 增强：上浮 `-translate-y-1.5` + 外发光增强

---

### 项目结构变更

```
新增文件：
  server/content/categories.json
  server/routes/categories.js
  src/components/CategoryBar.jsx
  src/components/CategoryNav.jsx
  public/overall.png / overall2.png / overall3.png / overall4.png

移除引用：
  src/components/ThemeToggle.jsx (不再使用)

主要修改：
  server/index.js, server/routes/posts.js
  src/lib/api.js, src/pages/Home.jsx, src/index.css
  src/components/PostCard.jsx, PostList.jsx, PostDetail.jsx
  src/components/Hero.jsx, Nav.jsx, Admin.jsx, Editor.jsx
  server/content/posts/*.md (6 篇)
```

---

## 2026-07-19

### 项目概述

基于 Vite + React 前端 + Node.js Express 后端，构建了一个现代化的个人技术博客。

**设计系统：**
- 设计方向：编辑风格 / 极简 / 暗色默认
- 设计变量：VARIANCE 6 / MOTION 4 / DENSITY 3
- 字体：Geist Sans + Geist Mono（自托管）
- 图标：Phosphor Icons (Light weight)
- 配色：冷色调现代风 — Teal 强调色 (#2dd4bf) + Zinc 中性色
- 动画：Motion (whileInView scroll reveal) + prefers-reduced-motion 尊重

---

### 项目结构

```
blog_theme_react/
├── index.html
├── package.json              # React 19, Motion, Phosphor, Tailwind v4
├── vite.config.js            # Vite + @tailwindcss/vite + API 代理
├── public/favicon.svg
├── src/
│   ├── main.jsx              # 入口 (AuthProvider)
│   ├── App.jsx               # 路由: /, /post/:slug, /about, /admin, /admin/new, /admin/edit/:slug
│   ├── index.css             # Tailwind v4 + 设计 tokens (暗/亮双模式)
│   ├── context/
│   │   └── AuthContext.jsx   # 管理员登录状态 (JWT token)
│   ├── lib/
│   │   └── api.js            # API 客户端 (fetchPosts, fetchPost)
│   ├── components/
│   │   ├── Nav.jsx           # 浮动玻璃药丸导航 + 主题切换 + 管理入口
│   │   ├── Hero.jsx          # 编辑风格首屏 (Motion 入场动画)
│   │   ├── PostList.jsx      # 文章网格 (加载/空/错误三态)
│   │   ├── PostCard.jsx      # 文章卡片 (hover 微交互)
│   │   ├── PostDetail.jsx    # Markdown 渲染 + Prism 代码高亮
│   │   ├── ThemeToggle.jsx   # 暗/亮模式切换
│   │   ├── Skeleton.jsx      # 加载骨架屏
│   │   ├── Footer.jsx        # 极简页脚
│   │   ├── Admin.jsx         # 管理面板 (登录表单 + 文章列表管理)
│   │   └── Editor.jsx        # Markdown 编辑器 + 实时预览
│   └── pages/
│       ├── Home.jsx
│       ├── Post.jsx
│       └── About.jsx
└── server/
    ├── package.json          # Express + gray-matter + marked + JWT
    ├── .env                  # ADMIN_PASSWORD / JWT_SECRET
    ├── index.js              # Express 服务器 (端口 3001)
    ├── routes/
    │   └── posts.js          # RESTful API (CRUD + 鉴权)
    └── content/posts/        # Markdown 文章存储
        ├── hello-world.md
        ├── vite-react-setup.md
        ├── node-api-design.md
        ├── tailwind-v4-migration.md
        └── 创刊词.md
```

---

### 后端 API

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | /api/admin/login | 无 | 密码登录，返回 JWT token |
| GET | /api/posts | 无 | 已发布文章列表 |
| GET | /api/posts/admin | Bearer | 全部文章列表（含草稿） |
| GET | /api/posts/:slug | 无 | 单篇文章（渲染后 HTML） |
| GET | /api/posts/raw/:slug | Bearer | 单篇文章原始 Markdown（用于编辑） |
| POST | /api/posts | Bearer | 创建文章 |
| PUT | /api/posts/:slug | Bearer | 更新文章 |
| DELETE | /api/posts/:slug | Bearer | 删除文章 |
| GET | /api/health | 无 | 健康检查 |

---

### 管理面板

- 访问 `/admin` 进入登录页
- 默认密码：`admin123`（在 `server/.env` 修改）
- 功能：新建 / 编辑 / 删除 / 草稿管理 / 发布
- 鉴权：JWT token，7 天有效，存储在 localStorage
- 访客看不到管理入口

---

### Bug 修复记录

1. **草稿无法发布**
   - 原因：YAML 序列化时 `draft: false` 被写成 `draft: "false"`（带引号字符串），gray-matter 解析为 truthy
   - 修复：新增 `yamlify()` 函数，布尔值和数字不加引号

2. **中文标题文章无法再次编辑**
   - 原因：`safeSlug` 正则 `/[^a-zA-Z0-9_-]/g` 删除了所有中文字符，导致文件名查找失败
   - 修复：改为只过滤路径穿越字符 `..` `/` `\`

3. **中文标题文章预览乱码**
   - 原因：slug 包含非 ASCII 字符，直接拼入 URL 时 fetch 编码行为不一致
   - 修复：所有 URL 构造处添加 `encodeURIComponent(slug)`

---

### 设计预检清单 (Taste Skill Pre-Flight)

- [x] Design Read: personal tech blog, editorial minimal, dark default
- [x] 无 Inter 字体 → Geist
- [x] 无 AI 紫色 → Teal #2dd4bf
- [x] 无 em-dash
- [x] 暗/亮双模式
- [x] reduced-motion 尊重
- [x] 加载/空/错误三态覆盖
- [x] 组件交互态 (hover/active/focus)
- [x] min-h-[100dvh] 非 h-screen
- [x] Phosphor 图标库，无 emoji 图标
- [x] 响应式 (1-col mobile, 2-col desktop)

---

### 启动命令

```bash
# 后端
cd blog_theme_react/server
npm run dev

# 前端
cd blog_theme_react
npm run dev
```

前端：http://localhost:5173 | 后端：http://localhost:3001

---

### 待优化

- JS bundle 较大 (1.2MB)，主要来自 react-syntax-highlighter，后续可用动态 import 拆分
- 可添加 RSS 订阅生成
- 可添加文章搜索功能
- 可添加评论系统

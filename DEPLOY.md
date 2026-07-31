# 🚀 超详细部署指南（附图说明）

**目标**：把你的博客上线，免费，不要信用卡。
**准备**：一台能上网的电脑，一个邮箱。

---

## 第一步：注册 GitHub 账号

> GitHub 是用来存代码的地方。Cloudflare 和 Render 会从这里自动拉代码部署。

1. 打开浏览器，访问 **[github.com/signup](https://github.com/signup)**
2. 页面中间有一个表单：

   ```
   Email:     [  输入你的邮箱  ]
   Password:  [  设一个密码    ]
   Username:  [  起个英文用户名  ]
   ```

3. 填完点 **Continue**
4. 可能会让你做一个验证（点图片、输验证码），跟着做
5. GitHub 会发一封验证邮件到你填的邮箱
6. 打开邮箱 → 找到 GitHub 的邮件 → 点里面的 **Verify email address**
7. 验证完就注册好了

---

## 第二步：注册 Cloudflare 账号

1. 打开 **[dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)**
2. 页面显示：

   ```
   Email:        [  输入邮箱  ]
   Password:     [  设密码    ]
   ```

3. 填完点 **Sign Up**
4. Cloudflare 发验证邮件 → 去邮箱点确认
5. 确认完就注册好了

---

## 第三步：注册 Render 账号

1. 打开 **[dashboard.render.com](https://dashboard.render.com/register)**
2. 点 **Sign up with GitHub**（用 GitHub 账号登录最方便）
3. 跳转到 GitHub 授权页面 → 点 **Authorize Render**
4. 授权完自动回到 Render，注册完毕

---

## 第四步：创建 GitHub 仓库

1. 打开 **[github.com/new](https://github.com/new)**
2. 你会看到一个表单：

   ```
   Repository name:  [  blog-theme  ]
                      ↑ 填这个名字

   Description:      [  留空  ]

   Public / Private:  选 Public（免费）

   下面的选项全部不要勾选！
   □ Add a README file        ← 不勾
   □ Add .gitignore           ← 不勾
   □ Choose a license          ← 不勾
   ```

3. 点绿色按钮 **Create repository**
4. 页面跳转后，你会看到一段黑色背景的代码。**不要关掉这个页面。**

---

## 第五步：把代码推送到 GitHub

1. 打开终端（Win + R → 输入 `cmd` 回车）

2. 进入项目目录：
   ```
   cd d:\Progs\vibe_coding\blog_theme_react
   ```

3. 逐行执行以下命令（每行打完按回车）：

   ```
   git init
   ```
   这行初始化 Git。会显示：`Initialized empty Git repository`

   ```
   git add .
   ```
   这行把所有文件加入暂存区。等几秒，光标回到输入状态就行。

   ```
   git commit -m "first commit"
   ```
   这行创建一次提交。会显示一堆文件名。

   ```
   git branch -M main
   ```
   这行把分支改名 main。无输出就是正常。

   ```
   git remote add origin https://github.com/你的用户名/blog-theme.git
   ```
   ⚠️ **换成你自己的地址**！去第四步那个 GitHub 页面，复制页面顶部那个 `https://github.com/...` 开头的链接。

   ```
   git push -u origin main
   ```
   这行上传代码。第一次可能会弹窗口让你登录 GitHub，输入用户名密码就行。

4. 上传完刷新 GitHub 页面，你应该看到项目文件全部出现在网页上了。

---

## 第六步：部署后端到 Render

> 后端就是 `server/` 目录，跑 Express API。部署到 Render 后，你的 admin 面板才能用。

1. 打开 **[dashboard.render.com](https://dashboard.render.com)**
2. 你应该已经用 GitHub 登录了。看到 Dashboard 页面。
3. 点右上角紫色按钮 **New +** → 选 **Web Service**
4. 页面列出你的 GitHub 仓库 → 找到 `blog-theme` → 点右边的 **Connect**
5. 现在进入配置页，从上往下填：

   **Name**（随便填）：
   ```
   blog-theme-api
   ```

   **Root Directory**（重要！）：
   ```
   server
   ```
   这告诉 Render 只构建 `server/` 文件夹，不是整个项目。

   **Runtime**：
   ```
   Node
   ```
   下拉选单选 Node 就行。

   **Build Command**：
   ```
   npm install
   ```

   **Start Command**：
   ```
   node index.js
   ```

   **Instance Type**：
   ```
   选 Free（$0/month）
   ```

6. 往下翻到 **Environment Variables**，点 **Add Environment Variable** 两次：

   **第一个：**
   ```
   Key:   ADMIN_PASSWORD
   Value: 你的管理员密码（自己随便设，比如 wonder123）
   ```

   **第二个：**
   ```
   Key:   JWT_SECRET
   Value: 随便打一串乱码（比如 qF9xK3mW7pR2vL8n）
   ```

7. 再往下翻，点最底部的紫色按钮 **Create Web Service**

8. 页面跳转到一个黑色终端窗口，显示部署日志：
   ```
   ==> Building...
   ==> npm install
   ...
   ==> Uploading...
   ==> Starting service with 'node index.js'
   ==> Your service is live 🎉
   ```

9. 等 1-2 分钟。当看到 `Your service is live` 时，**看页面最顶部**，有一个蓝色链接：
   ```
   https://blog-theme-api.onrender.com
   ```
   📝 **把这个链接复制保存！**

---

## 第七步：部署前端到 Cloudflare Pages

1. 打开 **[dash.cloudflare.com](https://dash.cloudflare.com)**
2. 登录后看左侧菜单栏 → 点 **Workers & Pages**
3. 页面中间会看到 **Pages** 标签 → 点蓝色按钮 **Create**
4. 选 **Pages**（不是 Workers）
5. 点 **Connect to Git**
6. 点 **Connect GitHub** → 授权弹窗 → 选你的 `blog-theme` 仓库 → 点 **Install & Authorize**
7. 回到 Cloudflare，看到 `blog-theme` 仓库 → 点 **Begin setup**
8. 配置页：

   ```
   Project name:        blog-theme（默认不用改）

   Production branch:   main（默认不用改）

   Build settings → Framework preset: 留空不选

   Build command:
   npm install && npm run build
   ↑ 输入这一行

   Build output directory:
   dist
   ↑ 输入 dist
   ```

9. 往下翻到 **Environment variables** → 点 **Add variable**：

   ```
   Variable name:   VITE_API_BASE
   Value:           https://blog-theme-api.onrender.com/api
                    ↑ 用你自己第六步保存的那个链接，后面加上 /api
   ```

10. 点最底部 **Save and Deploy**

11. 等待 2-3 分钟，看构建日志：
    ```
    ⚡ Building...
    Installing dependencies... npm install
    Building... npm run build
    ✨ Success!
    ```

12. 构建成功后，跳到一个成功页面，显示：
    ```
    🎉 Your site is live!
    https://blog-theme-xxxx.pages.dev
    ```
    📝 **这就是你博客的地址！**

---

## 第八步：验证博客是否正常运行

浏览器打开你的博客地址：

| 检查项 | 地址 | 应该看到 |
|--------|------|----------|
| 首页 | `https://blog-theme-xxxx.pages.dev` | 你的博客首页，背景图 + 文章列表 |
| 管理面板 | `https://blog-theme-xxxx.pages.dev/admin` | 密码输入框 |
| 友链 | `https://blog-theme-xxxx.pages.dev/links` | 友链页面 |
| 后端测试 | `https://blog-theme-api.onrender.com/api/health` | `{"status":"ok"}` |

在管理面板输入你在第六步设置的 `ADMIN_PASSWORD`，登录进去：
- 点 **新建** 写文章
- 往下翻到 **友链管理** 加友链
- 分类管理在友链上面

---

## 第九步（强烈建议）：防止 Render 休眠

Render 免费版 15 分钟没人访问就会休眠，下次打开要等半分钟。用 UptimeRobot 每隔 5 分钟偷偷访问一下，它就不会睡着了。

1. 打开 **[uptimerobot.com](https://uptimerobot.com)** → 点 **Start monitoring for free**
2. 注册账号 → 登录
3. 点左上角 **+ Create Monitor**
4. 配置：

   ```
   Monitor Type:    HTTP(s)
   Friendly Name:    blog-api
   URL:              https://blog-theme-api.onrender.com/api/health
   Monitoring Interval:  5 minutes
   ```

5. 点 **Create monitor**

搞定。以后 Render 永远不会休眠了。

---

## 💡 以后更新网站

`git push` 三连就完事：

```
git add .
git commit -m "改了什么"
git push
```

- Cloudflare Pages 看到 push → 自动重新构建前端
- Render 看到 push → 自动重新部署后端

---

## 🔧 本地开发

改了代码先在本地看效果，没问题再 push：

```bash
# 终端 1：启动后端
cd server
npm install
npm run dev
# 后端运行在 http://localhost:3001

# 终端 2：启动前端
npm run dev
# 前端运行在 http://localhost:5173
```

浏览器打开 `http://localhost:5173/admin`，跟线上一样的管理面板。

---

## 📊 常见问题

**Q：首页加载出来了但看不到文章？**
A：去 `https://blog-theme-api.onrender.com/api/health` 看看能不能访问。如果 Render 的页面显示 "Suspended"，说明它休眠了，等 30 秒刷新就好。做完第九步就不会有这个问题。

**Q：登录 admin 失败？**
A：检查第六步的 `ADMIN_PASSWORD` 环境变量设置对没。去 Render → Dashboard → blog-theme-api → Environment 确认。

**Q：改了代码但网站没变化？**
A：是不是忘了 `git push`？或者等 2 分钟让 Cloudflare 构建完。

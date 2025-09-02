# Airdrop API Server

基于 Koa.js 的 Token 管理 API 服务器，支持本地开发和 Vercel 部署。

## 功能特性

- 🚀 创建 Token (`POST /auth`)
- 📋 获取所有 Token (`GET /auth`)
- 👥 添加账户到 Token (`POST /auth/:token/account`)
- 🔒 账户重复检测
- ⚡ 支持 Vercel 无服务器部署

## API 端点

### 1. 获取所有 Token
```bash
GET /auth
```

### 2. 创建新 Token
```bash
POST /auth
Content-Type: application/json

{
  "acounts": ["user1", "user2"]  # 可选
}
```

### 3. 向 Token 添加账户
```bash
POST /auth/:token/account
Content-Type: application/json

{
  "account": "new_user"
}
```

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 服务器将在 http://localhost:3000 启动

## 部署到 Vercel

### 准备工作

1. 确保你有 Vercel 账户
2. 安装 Vercel CLI：
```bash
npm install -g vercel
```

### 部署步骤

1. **登录 Vercel**：
```bash
vercel login
```

2. **初始化项目**：
```bash
vercel
```

3. **配置项目**：
   - 项目名称：输入你的项目名称
   - 设置目录：选择当前目录 (`./`)
   - 是否覆盖设置：选择 `Y`

4. **自动部署**：
   - Vercel 会自动检测到 `vercel.json` 配置
   - 自动安装依赖并部署

5. **后续部署**：
```bash
vercel --prod  # 部署到生产环境
```

### 环境差异

- **本地环境**：使用文件系统存储 (`db/auth.json`)
- **Vercel 环境**：使用内存存储（重启后数据丢失）

### 生产环境建议

对于生产环境，建议集成外部数据库：
- MongoDB Atlas
- PostgreSQL (如 Supabase)
- Redis
- Firebase Firestore

## 技术栈

- **框架**：Koa.js
- **路由**：@koa/router
- **Body 解析**：koa-bodyparser
- **UUID 生成**：uuid
- **部署平台**：Vercel

## 项目结构

```
├── app.js              # 主应用文件
├── db/
│   └── auth.json       # 数据存储文件（仅本地）
├── package.json        # 项目配置
├── vercel.json         # Vercel 部署配置
└── README.md          # 项目说明
```

## 注意事项

⚠️ **重要**：Vercel 部署使用内存存储，服务重启后数据会丢失。生产环境请使用外部数据库。

## License

ISC
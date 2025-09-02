# Vercel 部署指南

## 🚀 快速部署步骤

### 1. 准备工作

确保你的项目包含以下文件：
- ✅ `package.json` - 项目配置
- ✅ `vercel.json` - Vercel 配置
- ✅ `app.js` - 主应用文件
- ✅ `.vercelignore` - 忽略文件配置

### 2. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 3. 登录 Vercel

```bash
vercel login
```

### 4. 部署项目

在项目根目录运行：

```bash
vercel
```

首次部署时会询问：
- **项目名称**: 输入你想要的项目名称
- **目录设置**: 选择当前目录 `./`
- **构建设置**: 使用检测到的设置
- **部署**: 确认部署

### 5. 生产部署

```bash
vercel --prod
```

## 🔧 配置说明

### vercel.json 配置

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 环境变量

项目会根据 `NODE_ENV` 自动切换存储方式：
- **开发环境** (`NODE_ENV !== 'production'`): 使用文件存储
- **生产环境** (`NODE_ENV === 'production'`): 使用内存存储

## 📋 部署后测试

你的应用已成功部署到：
**`https://airdrop-blush-five.vercel.app`**

### 测试 API 端点：

#### 1. 获取所有 Token
```bash
curl https://airdrop-blush-five.vercel.app/auth
```

#### 2. 创建新 Token
```bash
curl -X POST https://airdrop-blush-five.vercel.app/auth \
  -H "Content-Type: application/json" \
  -d '{"acounts": ["test_user"]}'
```

#### 3. 添加账户到 Token
```bash
# 先获取一个 token，然后使用它
curl -X POST https://airdrop-blush-five.vercel.app/auth/sk-11478501-b0c8-4c0e-8e0c-f176c7778b70/account \
  -H "Content-Type: application/json" \
  -d '{"account": "new_account"}'
```

### 完整测试流程示例：

```bash
# 1. 查看现有 tokens
curl https://airdrop-blush-five.vercel.app/auth | jq .

# 2. 创建新 token
TOKEN_RESPONSE=$(curl -s -X POST https://airdrop-blush-five.vercel.app/auth \
  -H "Content-Type: application/json" \
  -d '{"acounts": ["demo_user"]}')

# 3. 提取 token
TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.token')

# 4. 向 token 添加账户
curl -X POST https://airdrop-blush-five.vercel.app/auth/$TOKEN/account \
  -H "Content-Type: application/json" \
  -d '{"account": "additional_user"}' | jq .

# 5. 验证最终结果
curl https://airdrop-blush-five.vercel.app/auth | jq .
```

## ⚠️ 重要注意事项

### 数据持久化问题

**当前实现使用内存存储**，这意味着：
- ✅ 快速部署和响应
- ❌ 服务重启后数据丢失
- ❌ 多个实例之间数据不同步

### 生产环境建议

对于需要数据持久化的生产环境，建议集成外部数据库：

1. **MongoDB Atlas** (推荐)
2. **Supabase PostgreSQL**
3. **PlanetScale MySQL**
4. **Redis Cloud**
5. **Firebase Firestore**

### 环境变量配置

在 Vercel 控制台中设置环境变量：
1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加所需的数据库连接信息

## 🛠️ 故障排除

### 部署失败

1. 检查 `package.json` 中的依赖
2. 确保 Node.js 版本兼容 (>=18.0.0)
3. 检查 `vercel.json` 语法

### API 不工作

1. 检查路由配置
2. 查看 Vercel 函数日志
3. 确认环境变量设置

### 数据丢失

这是预期行为（内存存储），需要集成外部数据库解决。

## 📚 相关资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Koa.js 文档](https://koajs.com/)
- [Node.js 无服务器函数](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
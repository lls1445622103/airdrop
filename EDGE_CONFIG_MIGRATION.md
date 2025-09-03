# Edge Config 迁移说明

## 修改概述

已将项目从使用纯文件系统/内存存储迁移至支持 Vercel Edge Config 的混合存储模式。

## 主要修改

### 1. 存储层修改 (`utils/storage.js`)

**新增功能：**
- 支持 Edge Config 读取初始数据
- 智能环境检测（本地开发 vs 生产环境）
- 多层次回退机制

**存储策略：**
- **本地开发环境**：使用文件存储 (`db/auth.json`)
- **Vercel 生产环境**：
  - 读取：优先从 Edge Config 获取 `auth_tokens` 配置项
  - 写入：使用内存存储（Edge Config 运行时只读）
  - 回退：Edge Config 失败时回退到内存存储

### 2. API 路由修改 (`routes/auth.js`)

**所有路由都已更新为异步操作：**
- `GET /auth` - 获取所有 token 数据
- `POST /auth` - 创建新的 token
- `POST /auth/:token/account` - 添加账户
- `POST /auth/:token/verify` - 验证账户
- `DELETE /auth/:token` - 删除 token
- `DELETE /auth/:token/account` - 删除账户

**关键变更：**
- 将 `readData()` 和 `writeData()` 改为异步调用
- 添加 `await` 关键字
- 保持原有的错误处理逻辑

## Edge Config 配置

### 在 Vercel 中设置 Edge Config

1. 在 Vercel 仪表板中创建 Edge Config
2. 添加配置项：
   ```json
   {
     "auth_tokens": [
       {
         "token": "sk-example-token",
         "created_at": 1735574400,
         "updated_at": 1735574400,
         "acounts": ["user1", "user2"]
       }
     ]
   }
   ```
3. 将 Edge Config 连接到项目

### 环境变量

确保在 Vercel 项目中设置了以下环境变量：
- `NODE_ENV=production`
- `EDGE_CONFIG` - 由 Vercel 自动设置

## 使用方式

### 本地开发
```bash
npm run dev
```
- 使用 `db/auth.json` 文件存储
- 支持完整的读写操作

### 生产部署
```bash
vercel --prod
```
- 从 Edge Config 读取初始数据
- 运行时修改存储在内存中
- 服务重启后恢复到 Edge Config 的初始状态

## 注意事项

1. **Edge Config 限制**：
   - 运行时只读，无法动态修改
   - 适合存储初始化数据和配置

2. **数据持久性**：
   - 生产环境中的运行时数据修改在服务重启后会丢失
   - 如需持久化，建议连接外部数据库

3. **回退机制**：
   - Edge Config 失败时自动回退到内存存储
   - 确保服务的可用性

## 测试验证

本地测试：
```bash
cd /Users/lixiaoming/Desktop/self/airdrop
node -e "const { readData } = require('./utils/storage'); (async () => { const data = await readData(); console.log('Items:', data.length); })();"
```

API 测试：
```bash
# 获取所有 tokens
curl http://localhost:3000/auth

# 创建新 token
curl -X POST http://localhost:3000/auth -H "Content-Type: application/json" -d '{}'
```
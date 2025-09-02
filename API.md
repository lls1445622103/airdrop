# Airdrop API 文档

**基础 URL**: `https://airdrop-blush-five.vercel.app`

## 📚 API 端点概览

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/auth` | 获取所有 Token |
| POST | `/auth` | 创建新 Token |
| POST | `/auth/:token/account` | 向 Token 添加账户 |

---

## 🔍 详细 API 文档

### 1. 获取所有 Token

**端点**: `GET /auth`

#### 请求示例
```http
GET https://airdrop-blush-five.vercel.app/auth
```

#### 响应示例
```json
[
  {
    "token": "sk-dac23f3b-9792-4736-a784-e736656270b6",
    "created_at": 1756825498,
    "updated_at": 1756825498,
    "acounts": ["user1", "user2"]
  },
  {
    "token": "sk-61db4ac2-5f33-4167-b64f-86b283d6f929",
    "created_at": 1756825515,
    "updated_at": 1756825515,
    "acounts": []
  }
]
```

#### 状态码
- `200 OK`: 成功返回数据
- `500 Internal Server Error`: 服务器内部错误

---

### 2. 创建新 Token

**端点**: `POST /auth`

#### 请求示例
```http
POST https://airdrop-blush-five.vercel.app/auth
Content-Type: application/json

{
  "acounts": ["user1", "user2"]
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Token created successfully",
  "data": {
    "token": "sk-11478501-b0c8-4c0e-8e0c-f176c7778b70",
    "created_at": 1756828261,
    "updated_at": 1756828261,
    "acounts": ["user1", "user2"]
  },
  "total": 3
}
```

#### 状态码
- `201 Created`: 成功创建 Token
- `409 Conflict`: Token 冲突（极少情况）
- `500 Internal Server Error`: 服务器内部错误

---

### 3. 向 Token 添加账户

**端点**: `POST /auth/:token/account`

#### 路径参数
- `token`: 要添加账户的目标 Token

#### 请求示例
```http
POST https://airdrop-blush-five.vercel.app/auth/sk-11478501-b0c8-4c0e-8e0c-f176c7778b70/account
Content-Type: application/json

{
  "account": "new_user"
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Account added successfully",
  "data": {
    "token": "sk-11478501-b0c8-4c0e-8e0c-f176c7778b70",
    "account_added": "new_user",
    "acounts": ["user1", "user2", "new_user"],
    "updated_at": 1756828269
  }
}
```

#### 状态码
- `200 OK`: 成功添加账户
- `400 Bad Request`: 请求参数无效
- `404 Not Found`: Token 不存在
- `409 Conflict`: 账户已存在
- `500 Internal Server Error`: 服务器内部错误

---

## 💻 代码示例

### JavaScript (fetch)

```javascript
const API_BASE = 'https://airdrop-blush-five.vercel.app';

// 获取所有 Token
async function getAllTokens() {
  const response = await fetch(`${API_BASE}/auth`);
  return await response.json();
}

// 创建新 Token
async function createToken(acounts = []) {
  const response = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ acounts })
  });
  return await response.json();
}

// 添加账户到 Token
async function addAccountToToken(token, account) {
  const response = await fetch(`${API_BASE}/auth/${token}/account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ account })
  });
  return await response.json();
}

// 使用示例
async function example() {
  try {
    // 1. 创建新 token
    const newToken = await createToken(['demo_user']);
    console.log('新 Token:', newToken.data.token);
    
    // 2. 添加账户
    const result = await addAccountToToken(newToken.data.token, 'extra_user');
    console.log('添加结果:', result);
    
    // 3. 查看所有 tokens
    const allTokens = await getAllTokens();
    console.log('所有 Tokens:', allTokens);
  } catch (error) {
    console.error('错误:', error);
  }
}
```

### Python (requests)

```python
import requests
import json

API_BASE = 'https://airdrop-blush-five.vercel.app'

# 获取所有 Token
def get_all_tokens():
    response = requests.get(f'{API_BASE}/auth')
    return response.json()

# 创建新 Token
def create_token(acounts=None):
    if acounts is None:
        acounts = []
    
    response = requests.post(
        f'{API_BASE}/auth',
        headers={'Content-Type': 'application/json'},
        json={'acounts': acounts}
    )
    return response.json()

# 添加账户到 Token
def add_account_to_token(token, account):
    response = requests.post(
        f'{API_BASE}/auth/{token}/account',
        headers={'Content-Type': 'application/json'},
        json={'account': account}
    )
    return response.json()

# 使用示例
def example():
    try:
        # 1. 创建新 token
        new_token = create_token(['demo_user'])
        print(f"新 Token: {new_token['data']['token']}")
        
        # 2. 添加账户
        result = add_account_to_token(new_token['data']['token'], 'extra_user')
        print(f"添加结果: {result}")
        
        # 3. 查看所有 tokens
        all_tokens = get_all_tokens()
        print(f"所有 Tokens: {json.dumps(all_tokens, indent=2)}")
        
    except Exception as error:
        print(f"错误: {error}")

if __name__ == "__main__":
    example()
```

---

## 🧪 完整测试流程

### 使用终端工具进行测试

```bash
#!/bin/bash

BASE_URL="https://airdrop-blush-five.vercel.app"

echo "=== 1. 查看现有 Tokens ==="
curl -s $BASE_URL/auth | jq .

echo -e "\n=== 2. 创建新 Token ==="
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/auth \
  -H "Content-Type: application/json" \
  -d '{"acounts": ["demo_user"]}')

echo $TOKEN_RESPONSE | jq .

# 提取新创建的 token
TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.token')
echo "新创建的 Token: $TOKEN"

echo -e "\n=== 3. 向 Token 添加账户 ==="
curl -s -X POST $BASE_URL/auth/$TOKEN/account \
  -H "Content-Type: application/json" \
  -d '{"account": "additional_user"}' | jq .

echo -e "\n=== 4. 测试重复添加（应该失败）==="
curl -s -X POST $BASE_URL/auth/$TOKEN/account \
  -H "Content-Type: application/json" \
  -d '{"account": "additional_user"}' | jq .

echo -e "\n=== 5. 查看最终结果 ==="
curl -s $BASE_URL/auth | jq .
```

### Postman / Insomnia 测试

**1. 获取所有 Token**
```
Method: GET
URL: https://airdrop-blush-five.vercel.app/auth
```

**2. 创建新 Token**
```
Method: POST
URL: https://airdrop-blush-five.vercel.app/auth
Headers: Content-Type: application/json
Body: {"acounts": ["test_user"]}
```

**3. 添加账户到 Token**
```
Method: POST
URL: https://airdrop-blush-five.vercel.app/auth/{token}/account
Headers: Content-Type: application/json
Body: {"account": "new_user"}
```

---

## 🔧 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": "错误类型",
  "message": "详细错误信息"
}
```

### 常见错误

| 状态码 | 错误类型 | 描述 | 解决方案 |
|--------|----------|------|----------|
| 400 | Bad Request | 请求参数无效 | 检查请求体格式和必填字段 |
| 404 | Not Found | 资源不存在 | 确认 Token 是否正确 |
| 409 | Conflict | 资源冲突 | 账户已存在或 Token 重复 |
| 500 | Internal Server Error | 服务器错误 | 稍后重试或联系管理员 |

---

## 📝 数据模型

### Token 对象
```typescript
interface Token {
  token: string;           // sk-{uuid} 格式的唯一标识符
  created_at: number;      // Unix 时间戳
  updated_at: number;      // Unix 时间戳
  acounts: string[];       // 账户名称数组
}
```

### 响应对象
```typescript
interface ApiResponse<T> {
  success: boolean;        // 操作是否成功
  message: string;         // 响应消息
  data?: T;               // 返回的数据（可选）
  total?: number;         // 总数（可选）
  error?: string;         // 错误类型（失败时）
}
```

---

## ⚠️ 重要说明

1. **数据持久化**: 当前使用内存存储，服务重启后数据会丢失
2. **Token 格式**: 自动生成 `sk-{uuid}` 格式的唯一标识符
3. **时间戳**: 使用 Unix 时间戳（秒）
4. **账户名**: 支持任意字符串，自动去除首尾空格
5. **大小写敏感**: 账户名区分大小写

---

*文档最后更新时间: 2025-01-03*
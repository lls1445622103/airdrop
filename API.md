# Airdrop API 文档

**基础 URL**: `https://airdrop-blush-five.vercel.app`

## 📚 API 端点概览

| 方法   | 端点                   | 描述              |
| ------ | ---------------------- | ----------------- |
| GET    | `/auth`                | 获取所有 Token    |
| POST   | `/auth`                | 创建新 Token      |
| POST   | `/auth/:token/account` | 向 Token 添加账户 |
| POST   | `/auth/:token/verify`  | 验证账户是否存在  |
| PUT    | `/auth/:token`         | 编辑指定 Token    |
| DELETE | `/auth/:token`         | 删除指定 Token    |
| DELETE | `/auth/:token/account` | 删除指定账户      |

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
    "name": "活动A",
    "desc": "这是活动A的描述",
    "endTime": 1757000000,
    "endTimeHistory": [1756900000],
    "acountsMax": 100,
    "acounts": ["user1", "user2"]
  },
  {
    "token": "sk-61db4ac2-5f33-4167-b64f-86b283d6f929",
    "created_at": 1756825515,
    "updated_at": 1756825515,
    "name": "",
    "desc": "",
    "endTime": null,
    "endTimeHistory": [],
    "acountsMax": 100,
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
  "name": "活动A",
  "desc": "演示用活动",
  "endTime": 1760629155,
  "endTimeHistory": [],
  "acountsMax": 100,
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
    "name": "活动A",
    "desc": "演示用活动",
    "endTime": 1757000000,
    "endTimeHistory": [],
    "acountsMax": 100,
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

### 4. 验证账户是否存在

**端点**: `POST /auth/:token/verify`

#### 路径参数

- `token`: 要验证的目标 Token

#### 请求示例

```http
POST https://airdrop-blush-five.vercel.app/auth/sk-11478501-b0c8-4c0e-8e0c-f176c7778b70/verify
Content-Type: application/json

{
  "account": "user1"
}
```

#### 响应示例

**账户存在时**:

```json
{
  "success": true,
  "message": "Verification completed",
  "data": {
    "token": "sk-11478501-b0c8-4c0e-8e0c-f176c7778b70",
    "account": "user1",
    "exists": true,
    "total_accounts": 3
  }
}
```

**账户不存在时**:

```json
{
  "success": true,
  "message": "Verification completed",
  "data": {
    "token": "sk-11478501-b0c8-4c0e-8e0c-f176c7778b70",
    "account": "nonexistent_user",
    "exists": false,
    "total_accounts": 3
  }
}
```

#### 状态码

- `200 OK`: 验证完成（无论账户是否存在）
- `400 Bad Request`: 请求参数无效
- `404 Not Found`: Token 不存在
- `500 Internal Server Error`: 服务器内部错误

---

### 5. 删除 Token

**端点**: `DELETE /auth/:token`

#### 路径参数

- `token`: 要删除的目标 Token

#### 请求示例

```http
DELETE https://airdrop-blush-five.vercel.app/auth/sk-11478501-b0c8-4c0e-8e0c-f176c7778b70
```

#### 响应示例

```json
{
  "success": true,
  "message": "Token deleted successfully",
  "data": {
    "deleted_token": "sk-11478501-b0c8-4c0e-8e0c-f176c7778b70",
    "deleted_accounts": ["user1", "user2", "new_user"],
    "remaining_tokens": 2
  }
}
```

#### 状态码

- `200 OK`: 成功删除 Token
- `404 Not Found`: Token 不存在
- `500 Internal Server Error`: 服务器内部错误

---

### 6. 删除账户

**端点**: `DELETE /auth/:token/account`

#### 路径参数

- `token`: 目标 Token

#### 请求示例

```http
DELETE https://airdrop-blush-five.vercel.app/auth/sk-11478501-b0c8-4c0e-8e0c-f176c7778b70/account
Content-Type: application/json

{
  "account": "user1"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": {
    "token": "sk-11478501-b0c8-4c0e-8e0c-f176c7778b70",
    "deleted_account": "user1",
    "remaining_acounts": ["user2", "new_user"],
    "total_accounts": 2,
    "updated_at": 1756828500
  }
}
```

#### 状态码

- `200 OK`: 成功删除账户
- `400 Bad Request`: 请求参数无效
- `404 Not Found`: Token 或账户不存在
- `500 Internal Server Error`: 服务器内部错误

---

### 7. 编辑 Token

**端点**: `PUT /auth/:token`

#### 路径参数

- `token`: 目标 Token

#### 请求体（可任意组合提供下列字段）

```json
{
  "name": "新的活动名称",
  "desc": "新的活动描述",
  "endTime": 1757100000,
  "acountsMax": 150
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "Token updated successfully",
  "data": {
    "token": "sk-11478501-b0c8-4c0e-8e0c-f176c7778b70",
    "created_at": 1756828261,
    "updated_at": 1756920000,
    "name": "新的活动名称",
    "desc": "新的活动描述",
    "endTime": 1757100000,
    "endTimeHistory": [1757000000],
    "acountsMax": 150,
    "acounts": ["user1", "user2"]
  }
}
```

#### 状态码

- `200 OK`: 成功更新
- `400 Bad Request`: 字段格式无效（如 `acountsMax` 非正整数）或无可更新字段
- `404 Not Found`: Token 不存在
- `422 Unprocessable Entity`: `acountsMax` 小于当前账户数量

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
      'Content-Type': 'application/json'
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
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ account })
  });
  return await response.json();
}

// 验证账户是否存在
async function verifyAccountInToken(token, account) {
  const response = await fetch(`${API_BASE}/auth/${token}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ account })
  });
  return await response.json();
}

// 删除 Token
async function deleteToken(token) {
  const response = await fetch(`${API_BASE}/auth/${token}`, {
    method: 'DELETE'
  });
  return await response.json();
}

// 删除账户
async function deleteAccountFromToken(token, account) {
  const response = await fetch(`${API_BASE}/auth/${token}/account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ account })
  });
  return await response.json();
}

// 编辑 Token（更新 name/desc/endTime/acountsMax）
async function updateToken(token, payload) {
  const response = await fetch(`${API_BASE}/auth/${token}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
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

    // 3. 验证账户是否存在
    const verification = await verifyAccountInToken(newToken.data.token, 'demo_user');
    console.log('验证结果:', verification.data.exists); // true

    // 4. 验证不存在的账户
    const verification2 = await verifyAccountInToken(newToken.data.token, 'nonexistent');
    console.log('不存在的账户:', verification2.data.exists); // false

    // 5. 查看所有 tokens
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

# 验证账户是否存在
def verify_account_in_token(token, account):
    response = requests.post(
        f'{API_BASE}/auth/{token}/verify',
        headers={'Content-Type': 'application/json'},
        json={'account': account}
    )
    return response.json()

# 删除 Token
def delete_token(token):
    response = requests.delete(f'{API_BASE}/auth/{token}')
    return response.json()

# 删除账户
def delete_account_from_token(token, account):
    response = requests.delete(
        f'{API_BASE}/auth/{token}/account',
        headers={'Content-Type': 'application/json'},
        json={'account': account}
    )
    return response.json()

# 编辑 Token（更新 name/desc/endTime/acountsMax）
def update_token(token, payload):
    response = requests.put(
        f'{API_BASE}/auth/{token}',
        headers={'Content-Type': 'application/json'},
        json=payload
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

        # 3. 验证账户是否存在
        verification = verify_account_in_token(new_token['data']['token'], 'demo_user')
        print(f"验证结果: {verification['data']['exists']}")  # True

        # 4. 验证不存在的账户
        verification2 = verify_account_in_token(new_token['data']['token'], 'nonexistent')
        print(f"不存在的账户: {verification2['data']['exists']}")  # False

        # 5. 查看所有 tokens
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

**4. 验证账户是否存在**

```
Method: POST
URL: https://airdrop-blush-five.vercel.app/auth/{token}/verify
Headers: Content-Type: application/json
Body: {"account": "user1"}
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

| 状态码 | 错误类型              | 描述         | 解决方案                 |
| ------ | --------------------- | ------------ | ------------------------ |
| 400    | Bad Request           | 请求参数无效 | 检查请求体格式和必填字段 |
| 404    | Not Found             | 资源不存在   | 确认 Token 是否正确      |
| 409    | Conflict              | 资源冲突     | 账户已存在或 Token 重复  |
| 500    | Internal Server Error | 服务器错误   | 稍后重试或联系管理员     |

---

## 📝 数据模型

### Token 对象

```typescript
interface Token {
  token: string; // sk-{uuid} 格式唯一标识符
  created_at: number; // 创建时间（秒）
  updated_at: number; // 最近更新时间（秒）
  name: string; // 名称
  desc: string; // 描述
  endTime: number | null; // 截止时间（秒）
  endTimeHistory: number[]; // 历史截止时间列表（秒）
  acountsMax: number; // 账号最大限制
  acounts: string[]; // 账户名称数组
}
```

### 响应对象

```typescript
interface ApiResponse<T> {
  success: boolean; // 操作是否成功
  message: string; // 响应消息
  data?: T; // 返回的数据（可选）
  total?: number; // 总数（可选）
  error?: string; // 错误类型（失败时）
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

_文档最后更新时间: 2025-09-12_

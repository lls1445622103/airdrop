const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 常量定义
const MAX_ACCOUNTS_PER_TOKEN = 100;

const app = new Koa();
const router = new Router();

// 添加 body parser 中间件
app.use(bodyParser());

// 内存存储 (用于 Vercel 部署)
let memoryStorage = [
  {
    "token": "sk-dac23f3b-9792-4736-a784-e736656270b6",
    "created_at": 1756825498,
    "updated_at": 1756825498,
    "acounts": [
      "user1",
      "user2"
    ]
  },
  {
    "token": "sk-61db4ac2-5f33-4167-b64f-86b283d6f929",
    "created_at": 1756825515,
    "updated_at": 1756825515,
    "acounts": []
  }
];

// 判断是否使用文件存储或内存存储
const useFileStorage = process.env.NODE_ENV !== 'production';

// 数据操作函数
function readData() {
  if (useFileStorage) {
    try {
      const authDataPath = path.join(__dirname, 'db', 'auth.json');
      const fileContent = fs.readFileSync(authDataPath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      return [];
    }
  } else {
    return [...memoryStorage]; // 返回副本
  }
}

function writeData(data) {
  if (useFileStorage) {
    const authDataPath = path.join(__dirname, 'db', 'auth.json');
    fs.writeFileSync(authDataPath, JSON.stringify(data, null, 2), 'utf8');
  } else {
    memoryStorage = [...data]; // 更新内存存储
  }
}



router.get('/auth', async (ctx) => {
  try {
    // 读取数据
    const authData = readData();
    
    // 设置响应头为 JSON
    ctx.type = 'application/json';
    // 返回 JSON 数据
    ctx.body = authData;
  } catch (error) {
    console.error('Error reading auth data:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
});

// POST /auth - 创建新的 token 数据
router.post('/auth', async (ctx) => {
  try {
    // 读取现有数据数组
    let existingDataArray = readData();
    // 确保是数组格式
    if (!Array.isArray(existingDataArray)) {
      existingDataArray = [];
    }
    
    // 生成新的数据
    const currentTime = Math.floor(Date.now() / 1000); // Unix 时间戳
    const newToken = `sk-${uuidv4()}`;
    
    // 检查 token 是否已存在（虽然 UUID 冲突概率极低）
    const tokenExists = existingDataArray.some(item => item.token === newToken);
    if (tokenExists) {
      ctx.status = 409;
      ctx.body = { 
        success: false,
        error: 'Token conflict',
        message: 'Generated token already exists' 
      };
      return;
    }
    
    // 创建新的数据对象
    const newData = {
      token: newToken,
      created_at: currentTime,
      updated_at: currentTime,
      acounts: ctx.request.body?.acounts || []
    };
    
    // 添加到数组中
    existingDataArray.push(newData);
    
    // 写入数据
    writeData(existingDataArray);
    
    // 返回创建的数据
    ctx.status = 201;
    ctx.type = 'application/json';
    ctx.body = {
      success: true,
      message: 'Token created successfully',
      data: newData,
      total: existingDataArray.length
    };
    
  } catch (error) {
    console.error('Error creating auth token:', error);
    ctx.status = 500;
    ctx.body = { 
      success: false,
      error: 'Internal server error',
      message: error.message 
    };
  }
});

// POST /auth/:token/account - 向指定 token 的 acounts 数组添加账户
router.post('/auth/:token/account', async (ctx) => {
  try {
    const { token } = ctx.params;
    const { account } = ctx.request.body;
    
    // 验证请求参数
    if (!account || typeof account !== 'string' || account.trim() === '') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Bad Request',
        message: 'Account parameter is required and must be a non-empty string'
      };
      return;
    }
    
    // 读取现有数据
    let existingDataArray = readData();
    if (!Array.isArray(existingDataArray)) {
      existingDataArray = [];
    }
    
    // 查找指定的 token
    const tokenIndex = existingDataArray.findIndex(item => item.token === token);
    if (tokenIndex === -1) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: 'Not Found',
        message: 'Token not found'
      };
      return;
    }
    
    const tokenData = existingDataArray[tokenIndex];
    
    // 检查 account 是否已存在
    if (tokenData.acounts && tokenData.acounts.includes(account.trim())) {
      ctx.status = 409;
      ctx.body = {
        success: false,
        error: 'Conflict',
        message: 'Account already exists in the list'
      };
      return;
    }
    
    // 检查账户数量限制
    const currentAccountCount = tokenData.acounts ? tokenData.acounts.length : 0;
    if (currentAccountCount >= MAX_ACCOUNTS_PER_TOKEN) {
      ctx.status = 422;
      ctx.body = {
        success: false,
        error: 'Unprocessable Entity',
        message: `Maximum number of accounts (${MAX_ACCOUNTS_PER_TOKEN}) reached for this token`
      };
      return;
    }
    
    // 添加 account 到数组
    if (!tokenData.acounts) {
      tokenData.acounts = [];
    }
    tokenData.acounts.push(account.trim());
    
    // 更新时间戳
    tokenData.updated_at = Math.floor(Date.now() / 1000);
    
    // 更新数组中的数据
    existingDataArray[tokenIndex] = tokenData;
    
    // 写入数据
    writeData(existingDataArray);
    
    // 返回成功响应
    ctx.status = 200;
    ctx.type = 'application/json';
    ctx.body = {
      success: true,
      message: 'Account added successfully',
      data: {
        token: tokenData.token,
        account_added: account.trim(),
        acounts: tokenData.acounts,
        updated_at: tokenData.updated_at
      }
    };
    
  } catch (error) {
    console.error('Error adding account:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error',
      message: error.message
    };
  }
});

// POST /auth/:token/verify - 验证指定 token 中是否存在某个账户
router.post('/auth/:token/verify', async (ctx) => {
  try {
    const { token } = ctx.params;
    const { account } = ctx.request.body;
    
    // 验证请求参数
    if (!account || typeof account !== 'string' || account.trim() === '') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Bad Request',
        message: 'Account parameter is required and must be a non-empty string'
      };
      return;
    }
    
    // 读取现有数据
    let existingDataArray = readData();
    if (!Array.isArray(existingDataArray)) {
      existingDataArray = [];
    }
    
    // 查找指定的 token
    const tokenData = existingDataArray.find(item => item.token === token);
    if (!tokenData) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: 'Not Found',
        message: 'Token not found',
        exists: false
      };
      return;
    }
    
    // 检查 account 是否存在
    const accountExists = tokenData.acounts && tokenData.acounts.includes(account.trim());
    
    // 返回验证结果
    ctx.status = 200;
    ctx.type = 'application/json';
    ctx.body = {
      success: true,
      message: 'Verification completed',
      data: {
        token: tokenData.token,
        account: account.trim(),
        exists: accountExists,
        total_accounts: tokenData.acounts ? tokenData.acounts.length : 0
      }
    };
    
  } catch (error) {
    console.error('Error verifying account:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error',
      message: error.message,
      exists: false
    };
  }
});

// DELETE /auth/:token - 删除指定的 token
router.delete('/auth/:token', async (ctx) => {
  try {
    const { token } = ctx.params;
    
    // 读取现有数据
    let existingDataArray = readData();
    if (!Array.isArray(existingDataArray)) {
      existingDataArray = [];
    }
    
    // 查找指定的 token
    const tokenIndex = existingDataArray.findIndex(item => item.token === token);
    if (tokenIndex === -1) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: 'Not Found',
        message: 'Token not found'
      };
      return;
    }
    
    // 获取要删除的 token 数据
    const deletedTokenData = existingDataArray[tokenIndex];
    
    // 从数组中删除
    existingDataArray.splice(tokenIndex, 1);
    
    // 写入数据
    writeData(existingDataArray);
    
    // 返回成功响应
    ctx.status = 200;
    ctx.type = 'application/json';
    ctx.body = {
      success: true,
      message: 'Token deleted successfully',
      data: {
        deleted_token: deletedTokenData.token,
        deleted_accounts: deletedTokenData.acounts || [],
        remaining_tokens: existingDataArray.length
      }
    };
    
  } catch (error) {
    console.error('Error deleting token:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error',
      message: error.message
    };
  }
});

// DELETE /auth/:token/account - 删除指定 token 中的特定账户
router.delete('/auth/:token/account', async (ctx) => {
  try {
    const { token } = ctx.params;
    const { account } = ctx.request.body;
    
    // 验证请求参数
    if (!account || typeof account !== 'string' || account.trim() === '') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Bad Request',
        message: 'Account parameter is required and must be a non-empty string'
      };
      return;
    }
    
    // 读取现有数据
    let existingDataArray = readData();
    if (!Array.isArray(existingDataArray)) {
      existingDataArray = [];
    }
    
    // 查找指定的 token
    const tokenIndex = existingDataArray.findIndex(item => item.token === token);
    if (tokenIndex === -1) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: 'Not Found',
        message: 'Token not found'
      };
      return;
    }
    
    const tokenData = existingDataArray[tokenIndex];
    
    // 检查 account 是否存在
    if (!tokenData.acounts || !tokenData.acounts.includes(account.trim())) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: 'Not Found',
        message: 'Account not found in the token'
      };
      return;
    }
    
    // 从数组中删除账户
    const accountIndex = tokenData.acounts.indexOf(account.trim());
    tokenData.acounts.splice(accountIndex, 1);
    
    // 更新时间戳
    tokenData.updated_at = Math.floor(Date.now() / 1000);
    
    // 更新数组中的数据
    existingDataArray[tokenIndex] = tokenData;
    
    // 写入数据
    writeData(existingDataArray);
    
    // 返回成功响应
    ctx.status = 200;
    ctx.type = 'application/json';
    ctx.body = {
      success: true,
      message: 'Account deleted successfully',
      data: {
        token: tokenData.token,
        deleted_account: account.trim(),
        remaining_acounts: tokenData.acounts,
        total_accounts: tokenData.acounts.length,
        updated_at: tokenData.updated_at
      }
    };
    
  } catch (error) {
    console.error('Error deleting account:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error',
      message: error.message
    };
  }
});


// 使用路由中间件
app.use(router.routes());
app.use(router.allowedMethods());

// 检查是否在 Vercel 环境中
if (process.env.NODE_ENV !== 'production') {
  console.log('Server is running on port 3000');
  app.listen(3000);
}

// 导出应用实例供 Vercel 使用
module.exports = app;
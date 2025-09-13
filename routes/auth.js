const Router = require('@koa/router');
const { v4: uuidv4 } = require('uuid');
const { MAX_ACCOUNTS_PER_TOKEN, readData, writeData } = require('../utils/storage');

const router = new Router();

// GET /auth - 获取所有 token 数据
router.get('/auth', async (ctx) => {
  try {
    // 读取数据
    let authData = await readData();
    if (!Array.isArray(authData)) {
      authData = [];
    }

    // 查询参数：名称与是否截止
    const { name, ended } = ctx.query || {};

    let result = authData;

    // 按名称模糊匹配（不区分大小写）
    if (typeof name === 'string' && name.trim() !== '') {
      const nameLower = name.trim().toLowerCase();
      result = result.filter(item => typeof item.name === 'string' && item.name.toLowerCase().includes(nameLower));
    }

    // 按是否截止筛选：
    // ended=true  -> endTime 存在且 <= 当前时间
    // ended=false -> endTime 不存在 或 > 当前时间
    if (typeof ended !== 'undefined') {
      const normalized = String(ended).toLowerCase();
      const wantEnded = normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y' || normalized === 'on';
      const now = Math.floor(Date.now() / 1000);
      result = result.filter(item => {
        const hasEndTime = typeof item.endTime === 'number';
        const isEnded = hasEndTime && item.endTime <= now;
        return wantEnded ? isEnded : !isEnded;
      });
    }

    // 设置响应头为 JSON
    ctx.type = 'application/json';
    // 返回 JSON 数据
    ctx.body = result;
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
    let existingDataArray = await readData();
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
      // 新增字段并设置默认值
      name: typeof ctx.request.body?.name === 'string' ? ctx.request.body.name : '',
      desc: typeof ctx.request.body?.desc === 'string' ? ctx.request.body.desc : '',
      endTime: typeof ctx.request.body?.endTime === 'number' ? ctx.request.body.endTime : null,
      endTimeHistory: Array.isArray(ctx.request.body?.endTimeHistory) ? ctx.request.body.endTimeHistory : [],
      acountsMax: Number.isInteger(ctx.request.body?.acountsMax) && ctx.request.body.acountsMax > 0 ? ctx.request.body.acountsMax : MAX_ACCOUNTS_PER_TOKEN,
      acounts:  []
    };
    
    // 添加到数组中
    existingDataArray.push(newData);
    
    // 写入数据
    await writeData(existingDataArray);
    
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
    let existingDataArray = await readData();
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
    
    // 检查账户数量限制（优先使用 token 自身 acountsMax，默认回退到全局上限）
    const currentAccountCount = tokenData.acounts ? tokenData.acounts.length : 0;
    const accountsLimit = Number.isInteger(tokenData.acountsMax) && tokenData.acountsMax > 0 ? tokenData.acountsMax : MAX_ACCOUNTS_PER_TOKEN;
    if (currentAccountCount >= accountsLimit) {
      ctx.status = 422;
      ctx.body = {
        success: false,
        error: 'Unprocessable Entity',
        message: `Maximum number of accounts (${accountsLimit}) reached for this token`
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
    await writeData(existingDataArray);
    
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
    let existingDataArray = await readData();
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
    let existingDataArray = await readData();
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
    await writeData(existingDataArray);
    
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
    let existingDataArray = await readData();
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
    await writeData(existingDataArray);
    
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

module.exports = router;

// PUT /auth/:token - 编辑 token 的可变字段（name、desc、endTime、acountsMax）并维护 endTimeHistory
router.put('/auth/:token', async (ctx) => {
  try {
    const { token } = ctx.params;
    const { name, desc, endTime, acountsMax } = ctx.request.body || {};

    // 读取现有数据
    let existingDataArray = await readData();
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

    // 准备更新对象，仅更新允许的字段
    let updated = false;

    if (typeof name === 'string') {
      tokenData.name = name;
      updated = true;
    }

    if (typeof desc === 'string') {
      tokenData.desc = desc;
      updated = true;
    }

    if (typeof endTime === 'number') {
      // 维护 endTimeHistory：当 endTime 变化时，记录旧值
      if (!Array.isArray(tokenData.endTimeHistory)) {
        tokenData.endTimeHistory = [];
      }
      if (typeof tokenData.endTime === 'number' && tokenData.endTime !== endTime) {
        tokenData.endTimeHistory.push(tokenData.endTime);
      }
      tokenData.endTime = endTime;
      updated = true;
    }

    if (acountsMax !== undefined) {
      // 校验 acountsMax：必须是正整数，且不能小于当前账户数量
      const currentCount = Array.isArray(tokenData.acounts) ? tokenData.acounts.length : 0;
      if (!Number.isInteger(acountsMax) || acountsMax <= 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: 'Bad Request',
          message: 'acountsMax must be a positive integer'
        };
        return;
      }
      if (acountsMax < currentCount) {
        ctx.status = 422;
        ctx.body = {
          success: false,
          error: 'Unprocessable Entity',
          message: `acountsMax (${acountsMax}) cannot be less than current accounts count (${currentCount})`
        };
        return;
      }
      tokenData.acountsMax = acountsMax;
      updated = true;
    }

    if (!updated) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Bad Request',
        message: 'No valid fields provided to update'
      };
      return;
    }

    // 更新时间戳
    tokenData.updated_at = Math.floor(Date.now() / 1000);

    // 保存
    existingDataArray[tokenIndex] = tokenData;
    await writeData(existingDataArray);

    ctx.status = 200;
    ctx.type = 'application/json';
    ctx.body = {
      success: true,
      message: 'Token updated successfully',
      data: tokenData
    };
  } catch (error) {
    console.error('Error updating token:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error',
      message: error.message
    };
  }
});
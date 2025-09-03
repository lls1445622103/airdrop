const Router = require('@koa/router');
const { get } = require('@vercel/edge-config');

const router = new Router();

// GET /welcome - 演示 Edge Config 使用
router.get('/welcome', async (ctx) => {
  try {
    // 设置响应头为 JSON
    ctx.type = 'application/json';
    
    // 检查是否在 Vercel 生产环境中
    if (process.env.NODE_ENV === 'production' && process.env.EDGE_CONFIG) {
      // 在 Vercel 环境中，从 Edge Config 获取配置数据
      const greeting = await get('greeting');
      
      if (greeting) {
        ctx.body = {
          success: true,
          message: 'Edge Config data retrieved successfully',
          data: {
            greeting: greeting,
            timestamp: Math.floor(Date.now() / 1000),
            source: 'Edge Config'
          }
        };
      } else {
        ctx.body = {
          success: true,
          message: 'No greeting found in Edge Config',
          data: {
            greeting: 'Hello from Vercel Edge Config!', // 默认值
            timestamp: Math.floor(Date.now() / 1000),
            source: 'Edge Config (default)'
          }
        };
      }
    } else {
      // 在本地开发环境中，使用模拟数据
      ctx.body = {
        success: true,
        message: 'Local development mode - using mock data',
        data: {
          greeting: 'Hello from local development!',
          timestamp: Math.floor(Date.now() / 1000),
          source: 'Local mock data'
        }
      };
    }
  } catch (error) {
    console.error('Error accessing Edge Config:', error);
    ctx.body = {
      success: false,
      error: 'Edge Config error',
      message: 'Failed to access Edge Config, using fallback',
      data: {
        greeting: 'Hello from fallback!',
        timestamp: Math.floor(Date.now() / 1000),
        source: 'Fallback'
      }
    };
  }
});

// GET /config - 获取多个 Edge Config 配置项
router.get('/config', async (ctx) => {
  try {
    ctx.type = 'application/json';
    
    // 检查是否在 Vercel 生产环境中
    if (process.env.NODE_ENV === 'production' && process.env.EDGE_CONFIG) {
      // 在 Vercel 环境中，从 Edge Config 获取多个配置项
      const [greeting, maxUsers, enableFeatures] = await Promise.all([
        get('greeting'),
        get('max_users'),
        get('enable_features')
      ]);
      
      ctx.body = {
        success: true,
        message: 'Edge Config data retrieved successfully',
        data: {
          greeting: greeting || 'Hello World!',
          max_users: maxUsers || 100,
          enable_features: enableFeatures || {},
          timestamp: Math.floor(Date.now() / 1000),
          source: 'Edge Config'
        }
      };
    } else {
      // 在本地开发环境中，使用模拟配置数据
      ctx.body = {
        success: true,
        message: 'Local development mode - using mock configuration',
        data: {
          greeting: 'Hello from local config!',
          max_users: 50,
          enable_features: {
            beta_feature: true,
            new_ui: false,
            analytics: true
          },
          timestamp: Math.floor(Date.now() / 1000),
          source: 'Local mock config'
        }
      };
    }
  } catch (error) {
    console.error('Error accessing Edge Config:', error);
    ctx.body = {
      success: false,
      error: 'Edge Config error',
      message: 'Failed to access Edge Config, using fallback configuration',
      data: {
        greeting: 'Hello from fallback!',
        max_users: 100,
        enable_features: {},
        timestamp: Math.floor(Date.now() / 1000),
        source: 'Fallback config'
      }
    };
  }
});

module.exports = router;
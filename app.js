const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

// 导入路由模块
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');

const app = new Koa();

// 添加 body parser 中间件
app.use(bodyParser());

// 使用路由中间件
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());
app.use(configRoutes.routes());
app.use(configRoutes.allowedMethods());

// 检查是否在 Vercel 环境中
if (process.env.NODE_ENV !== 'production') {
  console.log('http://localhost:3000');
  app.listen(3000);
}

// 导出应用实例供 Vercel 使用
module.exports = app;
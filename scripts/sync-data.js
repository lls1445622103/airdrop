#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * 从生产环境 API 获取数据并同步到本地 db/auth.json
 */
async function syncDataFromProduction() {
  const apiUrl = 'https://airdrop-blush-five.vercel.app/auth';
  const dbPath = path.join(__dirname, '..', 'db', 'auth.json');
  
  console.log('🔄 正在从生产环境同步数据...');
  console.log(`📡 API URL: ${apiUrl}`);
  
  try {
    // 获取生产环境数据
    const data = await fetchDataFromAPI(apiUrl);
    
    if (!Array.isArray(data)) {
      throw new Error('API 返回的数据格式不正确，期望一个数组');
    }
    
    // 确保 db 目录存在
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`📁 已创建目录: ${dbDir}`);
    }
    
    // 备份现有文件（如果存在）
    if (fs.existsSync(dbPath)) {
      const backupPath = `${dbPath}.backup.${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`💾 已备份现有文件到: ${backupPath}`);
    }
    
    // 写入新数据
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log('✅ 数据同步成功！');
    console.log(`📊 同步了 ${data.length} 个 token`);
    console.log(`📝 已更新文件: ${dbPath}`);
    
    // 显示同步的数据摘要
    if (data.length > 0) {
      console.log('\n📋 数据摘要:');
      data.forEach((item, index) => {
        const accountCount = item.acounts ? item.acounts.length : 0;
        console.log(`  ${index + 1}. Token: ${item.token.substring(0, 20)}... (${accountCount} 个账户)`);
      });
    }
    
  } catch (error) {
    console.error('❌ 数据同步失败:', error.message);
    process.exit(1);
  }
}

/**
 * 从 API 获取数据
 */
function fetchDataFromAPI(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      // 检查状态码
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      // 接收数据
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      // 数据接收完成
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (parseError) {
          reject(new Error(`JSON 解析失败: ${parseError.message}`));
        }
      });
    });
    
    // 处理请求错误
    request.on('error', (error) => {
      reject(new Error(`网络请求失败: ${error.message}`));
    });
    
    // 设置超时
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('请求超时 (10秒)'));
    });
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  syncDataFromProduction();
}

module.exports = { syncDataFromProduction };
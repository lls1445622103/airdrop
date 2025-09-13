const fs = require('fs');
const path = require('path');
const { get } = require('@vercel/edge-config');
//导入json 文件
const authData = require('../db/auth.json');

// 常量定义
const MAX_ACCOUNTS_PER_TOKEN = 100;

// 内存存储 (用于 Vercel 部署)
let memoryStorage = [
  ...authData
];


// 判断是否使用文件存储或内存存储
const useFileStorage = process.env.NODE_ENV !== 'production';

// 数据操作函数
function readData() {
  if (useFileStorage) {
    try {
      const authDataPath = path.join(__dirname, '..', 'db', 'auth.json');
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
    const authDataPath = path.join(__dirname, '..', 'db', 'auth.json');
    fs.writeFileSync(authDataPath, JSON.stringify(data, null, 2), 'utf8');
  } else {
    memoryStorage = [...data]; // 更新内存存储
  }
}

module.exports = {
  MAX_ACCOUNTS_PER_TOKEN,
  readData,
  writeData
};
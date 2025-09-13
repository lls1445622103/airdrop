const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 远端数据源（引用自: http://60.205.90.179:3000/auth）
const REMOTE_URL = 'http://60.205.90.179:3000/auth';

function formatTimestamp(date) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const MM = String(date.getMinutes()).padStart(2, '0');
  const SS = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${HH}${MM}${SS}`;
}

async function backupAndUpdateJson() {
  const projectRoot = path.resolve(__dirname, '..');
  const dbDir = path.join(projectRoot, 'db');
  const authJsonPath = path.join(dbDir, 'auth.json');

  // 读取原始数据（若不存在则为空数组）
  let originalContent = '[]';
  try {
    originalContent = fs.readFileSync(authJsonPath, 'utf8');
  } catch (e) {
    console.warn(`Warning: cannot read original auth.json, using []: ${e.message}`);
  }

  // 备份：文件名 + 年月日时分秒（同目录下）
  const ts = formatTimestamp(new Date());
  const backupPath = path.join(dbDir, `auth-${ts}.json`);
  try {
    fs.writeFileSync(backupPath, originalContent, 'utf8');
    console.log(`Backup created: ${backupPath}`);
  } catch (e) {
    console.error(`Failed to create backup: ${e.message}`);
    // 备份失败不阻塞后续步骤，但给出提示
  }

  // 从远端获取并替换本地 JSON
  try {
    const res = await fetch(REMOTE_URL, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Remote data is not an array');
    }
    fs.writeFileSync(authJsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`auth.json updated from remote: ${REMOTE_URL}`);
  } catch (e) {
    console.error(`Failed to update auth.json from remote (${REMOTE_URL}): ${e.message}`);
    console.error('Proceeding with existing local auth.json.');
  }

  return projectRoot;
}

async function main() {
  const projectRoot = await backupAndUpdateJson();

  // 与原先一致的打包命令与排除规则
  const zipCmd = `cd "${projectRoot}" && \
zip -r "airdrop-server.zip" . -x "node_modules/*" "*/node_modules/*" ".git/*" "*/.git/*" "*/*/.git/*" "package-lock.json" "airdrop-server.zip" "*.md" "*/*.md" "*/*/*.md" "*.zip" "*/*.zip" "*/*/*.zip"`;

  exec(zipCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });
}

main().catch((e) => {
  console.error(`Deploy script failed: ${e.message}`);
  process.exit(1);
});
const { exec } = require('child_process');

exec('cd "/Users/lixiaoming/Documents/Airdrop Project/airdrop-server" && \
zip -r "airdrop-server.zip" . -x "node_modules/*" "*/node_modules/*" "package-lock.json" "airdrop-server.zip" "*.md" "*/*.md" "*/*/*.md" "*.zip" "*/*.zip" "*/*/*.zip"', (error, stdout, stderr) => {
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
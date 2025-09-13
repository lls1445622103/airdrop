#!/usr/bin/env bash
set -euo pipefail

# ===== 可配置项 =====
APP_DIR="/opt/airdrop-server"
REPO_URL="https://github.com/lls1445622103/airdrop.git"
APP_PORT="3000"
RUN_USER="${SUDO_USER:-$USER}"            # 当前 sudo 的用户，无需手填
NODE_ENV_FOR_PERSISTENCE="development"    # development=写 db/auth.json；production=内存存储
ENABLE_NGINX="true"                       # true=用 Nginx 反代 80 -> 127.0.0.1:3000
OPEN_PORT_3000="false"                    # 若不装 Nginx 或需直连 3000，则设为 true

# ===== 基础依赖 =====
echo "[1/8] 更新系统并安装基础工具..."
sudo dnf -y update
sudo dnf -y install git curl gcc gcc-c++ make policycoreutils-python-utils || true

# ===== 安装 Node.js 20（NodeSource）=====
echo "[2/8] 安装 Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf -y install nodejs

# ===== 安装 PM2 =====
echo "[3/8] 安装 PM2..."
sudo npm i -g pm2

# ===== 拉取代码 =====
echo "[4/8] 拉取代码到 ${APP_DIR}..."
sudo mkdir -p "${APP_DIR}"
sudo chown -R "${RUN_USER}:${RUN_USER}" "${APP_DIR}"
cd "${APP_DIR}"
if [ ! -d .git ]; then
  git clone "${REPO_URL}" .
else
  git pull --rebase
fi

echo "[5/8] 安装依赖..."
if [ -f package-lock.json ]; then
  npm ci || npm install
else
  npm install
fi

# ===== 数据持久化文件 =====
echo "[6/8] 准备 db/auth.json 持久化文件..."
mkdir -p db
[ -f db/auth.json ] || echo "[]" > db/auth.json

# ===== 使用 PM2 启动 =====
echo "[7/8] 使用 PM2 启动..."
export PORT="${APP_PORT}"
export NODE_ENV="${NODE_ENV_FOR_PERSISTENCE}"  # development => 文件存储；production => 内存存储
pm2 start server.js --name airdrop-server --time || pm2 restart airdrop-server
pm2 save
pm2 startup systemd -u "${RUN_USER}" --hp "$(eval echo ~${RUN_USER})" >/dev/null || true

# ===== 防火墙（firewalld）=====
echo "[防火墙] 开放必要端口..."
sudo dnf -y install firewalld || true
sudo systemctl enable --now firewalld || true

if [ "${ENABLE_NGINX}" = "true" ]; then
  sudo firewall-cmd --permanent --add-service=http || true   # 80
  sudo firewall-cmd --permanent --add-service=https || true  # 443（未用证书也可放行，备选）
else
  if [ "${OPEN_PORT_3000}" = "true" ]; then
    sudo firewall-cmd --permanent --add-port=${APP_PORT}/tcp || true
  fi
fi
sudo firewall-cmd --reload || true

# ===== Nginx 反向代理（可选）=====
if [ "${ENABLE_NGINX}" = "true" ]; then
  echo "[8/8] 安装并配置 Nginx 反代到 127.0.0.1:${APP_PORT}..."
  sudo dnf -y install nginx
  sudo systemctl enable --now nginx

  NGINX_CONF="/etc/nginx/conf.d/airdrop-server.conf"
  sudo bash -c "cat > ${NGINX_CONF}" <<EOF
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

  # SELinux：允许 Nginx 发起到本机端口的网络连接（Enforcing 时需要）
  if command -v setsebool >/dev/null 2>&1; then
    sudo setsebool -P httpd_can_network_connect 1 || true
  fi

  sudo nginx -t
  sudo systemctl reload nginx
fi

echo "完成。"
echo "PM2 状态： pm2 status"
echo "查看日志： pm2 logs airdrop-server"
if [ "${ENABLE_NGINX}" = "true" ]; then
  echo "访问地址（无域名）： http://<你的服务器IP>/auth"
else
  if [ "${OPEN_PORT_3000}" = "true" ]; then
    echo "访问地址： http://<你的服务器IP>:${APP_PORT}/auth"
  else
    echo "（未开放 3000 端口且未启用 Nginx，外网不可直接访问）"
  fi
fi


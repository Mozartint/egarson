#!/bin/bash
# =============================================================
# E Garson - VPS Kurulum Scripti
# Ubuntu 22.04 / 24.04 için
# Kullanım: chmod +x deploy.sh && sudo ./deploy.sh
# =============================================================

set -e

DOMAIN=""
APP_DIR="/opt/egarson"
BACKEND_PORT=8001
MONGO_DB="egarson_db"
JWT_SECRET=$(openssl rand -hex 32)

echo "============================================"
echo "  E Garson VPS Kurulum Scripti"
echo "============================================"
echo ""

# Domain sor
read -p "Domain adresinizi girin (örn: egarson.com veya IP adresiniz): " DOMAIN
if [ -z "$DOMAIN" ]; then
  echo "Domain boş olamaz!"
  exit 1
fi

echo ""
echo "[1/8] Sistem güncelleniyor..."
apt-get update -qq
apt-get upgrade -y -qq

echo "[2/8] Gerekli paketler kuruluyor..."
apt-get install -y -qq curl wget git nginx certbot python3-certbot-nginx \
  python3 python3-pip python3-venv nodejs npm mongodb-org || true

# MongoDB kurulumu (eğer yukarıda kurulamadıysa)
if ! command -v mongod &> /dev/null; then
  echo "  MongoDB kuruluyor..."
  curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt-get update -qq
  apt-get install -y -qq mongodb-org
fi

# Node.js 20 LTS kur
if ! node --version | grep -q "v20\|v22"; then
  echo "  Node.js 20 LTS kuruluyor..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

echo "[3/8] MongoDB başlatılıyor..."
systemctl enable mongod
systemctl start mongod
sleep 2

echo "[4/8] Uygulama dosyaları kopyalanıyor..."
mkdir -p $APP_DIR
cp -r . $APP_DIR/
cd $APP_DIR

echo "[5/8] Backend (Python) kuruluyor..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q

# Minimal production requirements (gereksiz dev paketler hariç)
pip install -q \
  fastapi==0.110.1 \
  uvicorn==0.25.0 \
  motor==3.3.1 \
  pymongo==4.5.0 \
  python-dotenv==1.2.1 \
  pydantic==2.12.5 \
  passlib[bcrypt]==1.7.4 \
  python-jose[cryptography]==3.5.0 \
  python-multipart==0.0.22 \
  bcrypt==4.1.3 \
  qrcode==8.2 \
  email-validator==2.3.0 \
  stripe==14.3.0

# Backend .env oluştur
cat > $APP_DIR/backend/.env << ENVEOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="${MONGO_DB}"
CORS_ORIGINS="https://${DOMAIN},http://${DOMAIN}"
JWT_SECRET_KEY="${JWT_SECRET}"
FRONTEND_URL="https://${DOMAIN}"
ENVEOF

deactivate

echo "[6/8] Frontend (React) build ediliyor..."
cd $APP_DIR/frontend

# Frontend .env ayarla
cat > .env << ENVEOF
REACT_APP_BACKEND_URL=https://${DOMAIN}
ENABLE_HEALTH_CHECK=false
ENVEOF

npm install --legacy-peer-deps
npm run build
echo "  Frontend build tamamlandı!"

echo "[7/8] Systemd servisleri oluşturuluyor..."

# Backend service
cat > /etc/systemd/system/egarson-backend.service << SERVICEEOF
[Unit]
Description=E Garson Backend API
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=${APP_DIR}/backend
Environment="PATH=${APP_DIR}/backend/venv/bin"
ExecStart=${APP_DIR}/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port ${BACKEND_PORT} --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable egarson-backend
systemctl start egarson-backend

echo "[8/8] Nginx yapılandırılıyor..."
cat > /etc/nginx/sites-available/egarson << NGINXEOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Frontend (React build)
    root ${APP_DIR}/frontend/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        client_max_body_size 20M;
    }

    # WebSocket desteği (Socket.IO için)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Gzip sıkıştırma
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
NGINXEOF

ln -sf /etc/nginx/sites-available/egarson /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# HTTPS için SSL sertifikası al
echo ""
read -p "SSL sertifikası (Let's Encrypt) kurmak ister misiniz? (e/h): " SSL_ANSWER
if [ "$SSL_ANSWER" = "e" ]; then
  read -p "SSL için e-posta adresiniz: " SSL_EMAIL
  certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $SSL_EMAIL
  echo "SSL kuruldu!"
fi

# Admin kullanıcısı oluştur
echo ""
echo "Admin kullanıcısı oluşturuluyor..."
cd $APP_DIR/backend
source venv/bin/activate
python3 seed_admin.py 2>/dev/null || echo "  (seed_admin.py mevcut değil, atlandı)"
deactivate

echo ""
echo "============================================"
echo "  KURULUM TAMAMLANDI!"
echo "============================================"
echo ""
echo "  URL        : https://${DOMAIN}"
echo "  Backend API: https://${DOMAIN}/api"
echo "  JWT Secret : ${JWT_SECRET}"
echo ""
echo "  Servis durumları:"
systemctl is-active egarson-backend && echo "  ✓ Backend: Çalışıyor" || echo "  ✗ Backend: Hata!"
systemctl is-active mongod && echo "  ✓ MongoDB: Çalışıyor" || echo "  ✗ MongoDB: Hata!"
systemctl is-active nginx && echo "  ✓ Nginx:   Çalışıyor" || echo "  ✗ Nginx:   Hata!"
echo ""
echo "  Log görmek için:"
echo "  journalctl -u egarson-backend -f"
echo ""

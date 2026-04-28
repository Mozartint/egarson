# E Garson - VPS Kurulum Rehberi

Dijital restoran yönetim sistemi. FastAPI backend, React frontend, MongoDB veritabanı.

---

## Yöntem 1: Otomatik Kurulum Scripti (Önerilen)

Ubuntu 22.04 / 24.04 VPS için:

```bash
# Dosyaları VPS'e kopyala
scp -r egarson-clean/ root@VPS_IP:/opt/egarson-clean/

# VPS'e bağlan
ssh root@VPS_IP

# Scripte izin ver ve çalıştır
cd /opt/egarson-clean
chmod +x deploy.sh
sudo ./deploy.sh
```

Script otomatik olarak şunları yapar:
- MongoDB, Nginx, Python, Node.js kurar
- Backend'i virtualenv ile ayağa kaldırır
- Frontend'i build edip Nginx'e bağlar
- Systemd servisi oluşturur (restart koruması)
- Opsiyonel SSL sertifikası alır

---

## Yöntem 2: Docker Compose

Docker kurulu bir VPS'te:

```bash
# .env dosyasını düzenle
cp backend/.env.example backend/.env
nano backend/.env  # JWT_SECRET_KEY ve DOMAIN'i değiştir

# Çalıştır
DOMAIN=egarson.com JWT_SECRET_KEY=supersecretkey docker-compose up -d
```

---

## Manuel Kurulum

### Gereksinimler
- Ubuntu 22.04+ VPS
- MongoDB 7.0
- Python 3.11+
- Node.js 20 LTS
- Nginx

### Backend

```bash
cd backend

# .env düzenle
cp .env.example .env
nano .env

# Virtualenv ve bağımlılıklar
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn motor pymongo python-dotenv pydantic \
    "passlib[bcrypt]" "python-jose[cryptography]" python-multipart \
    bcrypt qrcode email-validator stripe

# Çalıştır
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend

```bash
cd frontend

# .env düzenle
cp .env.example .env
nano .env  # REACT_APP_BACKEND_URL=https://yourdomain.com

# Bağımlılıklar ve build
npm install --legacy-peer-deps
npm run build

# build/ klasörü Nginx'e tanımlanacak
```

### Nginx Yapılandırması

`/etc/nginx/sites-available/egarson` dosyası:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /opt/egarson/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 20M;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/egarson /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# SSL (opsiyonel)
certbot --nginx -d yourdomain.com
```

---

## Ortam Değişkenleri

### Backend (.env)

| Değişken | Açıklama | Örnek |
|---|---|---|
| `MONGO_URL` | MongoDB bağlantı adresi | `mongodb://localhost:27017` |
| `DB_NAME` | Veritabanı adı | `egarson_db` |
| `JWT_SECRET_KEY` | JWT imzalama anahtarı | Rastgele 64 karakter |
| `CORS_ORIGINS` | İzin verilen originler | `https://yourdomain.com` |
| `FRONTEND_URL` | Frontend adresi | `https://yourdomain.com` |

### Frontend (.env)

| Değişken | Açıklama | Örnek |
|---|---|---|
| `REACT_APP_BACKEND_URL` | Backend API adresi | `https://yourdomain.com` |

---

## Servis Yönetimi

```bash
# Durum kontrolü
systemctl status egarson-backend
systemctl status mongod
systemctl status nginx

# Loglar
journalctl -u egarson-backend -f

# Yeniden başlat
systemctl restart egarson-backend

# Güncelleme (yeni kod deploy)
cd /opt/egarson
git pull  # veya scp ile yeni dosyaları kopyala
systemctl restart egarson-backend
cd frontend && npm run build  # frontend değiştiyse
```

---

## Güvenlik Notları

1. **JWT_SECRET_KEY'i mutlaka değiştirin**: `openssl rand -hex 32`
2. **CORS_ORIGINS'i daraltın**: Sadece kendi domaininizi ekleyin
3. **MongoDB'yi güvenlik duvarına alın**: Dışarıdan erişimi kapatın
4. **UFW firewall aktif edin**:
   ```bash
   ufw allow ssh
   ufw allow 80
   ufw allow 443
   ufw enable
   ```

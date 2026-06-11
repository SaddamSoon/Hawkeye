# 🦅 HawkEye — Web Pentest Suite

> Free, open-source web-based pentesting tool. Alternatif Burp Suite yang bisa diakses dari browser, dengan passive scanner bawaan.

![HawkEye](https://img.shields.io/badge/HawkEye-v1.0.0-f97316?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## ✨ Fitur

| Fitur | Deskripsi |
|---|---|
| **HTTP History** | Catat & inspect semua request/response |
| **Repeater** | Kirim ulang & modifikasi request manual |
| **Fuzzer/Intruder** | Otomasi payload fuzzing multi-thread |
| **Passive Scanner** | Auto-detect missing headers, error disclosure, info leakage |
| **Decoder** | Base64, URL, HTML, Hex encode/decode + payload quickref |
| **Dashboard** | Statistik real-time via WebSocket |
| **Live WebSocket** | Update UI real-time tanpa refresh |

---

## 🚀 Cara Install & Jalankan

### Opsi 1: Local (Paling Mudah)

**Prerequisites:** Python 3.11+, Node.js 18+

```bash
# 1. Clone repo
git clone https://github.com/KAMU/hawkeye.git
cd hawkeye

# 2. Install Python dependencies
cd backend
pip install -r requirements.txt

# 3. Build frontend (sudah include di repo, tapi kalau mau rebuild)
cd ..
npm install
npm run build

# 4. Jalankan
cd backend
python main.py
```

Buka browser: **http://localhost:8000**

---

### Opsi 2: Docker (Recommended untuk Production)

```bash
# Build & run
docker-compose up -d

# Cek logs
docker-compose logs -f

# Stop
docker-compose down
```

Buka browser: **http://localhost:8000**

---

### Opsi 3: Deploy ke VPS (Railway / Render / DigitalOcean)

#### Deploy ke Railway (GRATIS):
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

#### Deploy ke Render (GRATIS):
1. Push ke GitHub
2. Buka https://render.com → New Web Service
3. Connect repo
4. Build Command: `pip install -r backend/requirements.txt`
5. Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Deploy ke VPS (Ubuntu):
```bash
# Install dependencies
sudo apt update
sudo apt install python3-pip python3-venv nginx -y

# Setup app
cd /opt
git clone https://github.com/KAMU/hawkeye.git
cd hawkeye/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Buat systemd service
sudo cat > /etc/systemd/system/hawkeye.service << 'EOF'
[Unit]
Description=HawkEye Pentest Suite
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/hawkeye/backend
Environment="PATH=/opt/hawkeye/backend/venv/bin"
ExecStart=/opt/hawkeye/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable hawkeye
sudo systemctl start hawkeye

# Setup Nginx reverse proxy
sudo cat > /etc/nginx/sites-available/hawkeye << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/hawkeye /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Optional: SSL dengan Certbot
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 📡 Cara Capture Traffic

### Metode 1: Gunakan Repeater/Fuzzer Langsung
Paling mudah — langsung input URL di tab **Repeater** atau **Fuzzer**.

### Metode 2: Python Logger Script
```python
import requests, time

HAWKEYE = "http://localhost:8000"

def log_and_request(method, url, headers={}, body=None):
    start = time.time()
    resp = requests.request(method, url, headers=headers, data=body, verify=False)
    elapsed = int((time.time() - start) * 1000)
    
    requests.post(f"{HAWKEYE}/api/history/add", json={
        "method": method,
        "url": url,
        "request_headers": dict(resp.request.headers),
        "request_body": body,
        "response_status": resp.status_code,
        "response_headers": dict(resp.headers),
        "response_body": resp.text[:50000],
        "response_time_ms": elapsed
    })
    return resp

# Contoh
r = log_and_request("GET", "https://target.com/api/user/1")
print(r.status_code, r.json())
```

### Metode 3: Integrasikan dengan Burp Suite
Gunakan Burp sebagai upstream proxy dan arahkan logger ke HawkEye untuk passive analysis tambahan.

---

## 🔌 API Reference

| Endpoint | Method | Deskripsi |
|---|---|---|
| `GET /api/history` | GET | List semua request history |
| `POST /api/history/add` | POST | Tambah request ke history |
| `GET /api/history/{id}` | GET | Detail request |
| `DELETE /api/history` | DELETE | Clear semua history |
| `POST /api/repeater/send` | POST | Kirim HTTP request |
| `POST /api/fuzzer/run` | POST | Start fuzzing task |
| `GET /api/scan/results` | GET | List scan findings |
| `GET /api/decoder/encode` | GET | Encode text |
| `GET /api/decoder/decode` | GET | Decode text |
| `GET /api/stats` | GET | Statistik dashboard |
| `WS /ws` | WebSocket | Real-time updates |

---

## ⚠️ Legal Disclaimer

> Tool ini dibuat untuk **authorized security testing** saja.  
> Selalu pastikan kamu memiliki izin sebelum melakukan testing.  
> Gunakan dengan bertanggung jawab sesuai bug bounty program scope.

---

## 🤝 Kontribusi

Pull request welcome! Area yang butuh bantuan:
- [ ] JWT decoder & analyzer
- [ ] IDOR auto-detector
- [ ] Active scanner (SQLi, XSS detection)
- [ ] Report generator (PDF/HTML)
- [ ] Browser extension untuk intercept otomatis

---

## 📝 License

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan.

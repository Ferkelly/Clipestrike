# Deploy ClipStrike — VPS Hostinger

## 1. Acessar a VPS via SSH

No terminal (ou PuTTY no Windows):
```bash
ssh root@SEU_IP_DA_VPS
```

---

## 2. Instalar o ambiente

Suba o script e execute:
```bash
# Opção A: copiar e colar o conteúdo de scripts/setup-vps.sh e executar
# Opção B: clonar o projeto e rodar o script
chmod +x setup-vps.sh
bash setup-vps.sh
```

---

## 3. Clonar o projeto

```bash
# Na VPS
git clone https://github.com/SEU_USUARIO/ClipStrike.git
cd ClipStrike/youtube-clipper-backend
npm install
```

> Se ainda não tem o projeto no GitHub, transfira via SCP:
> ```powershell
> # No seu Windows (PowerShell)
> scp -r "C:\Users\domde\Downloads\ClipStrike\youtube-clipper-backend" root@SEU_IP:/root/clipstrike
> ```

---

## 4. Configurar variáveis de ambiente

```bash
cd /root/clipstrike/youtube-clipper-backend   # ou caminho do seu deploy
cp .env.example .env
nano .env   # preencher as chaves
```

Preencha:
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://SEU_DOMINIO.com

SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://SEU_DOMINIO.com/api/auth/google/callback

YOUTUBE_API_KEY=...
OPENROUTER_API_KEY=...
HUGGINGFACE_API_KEY=...   # opcional se Whisper local estiver instalado
```

---

## 5. Iniciar com PM2 (fica rodando 24/7)

```bash
cd /root/clipstrike/youtube-clipper-backend

# Iniciar
pm2 start server.js --name clipstrike-backend

# Ver logs em tempo real
pm2 logs clipstrike-backend

# Reiniciar automaticamente após reboot da VPS
pm2 startup
pm2 save
```

---

## 6. Testar

```bash
curl http://localhost:5000/health
# Deve retornar: {"status":"OK","timestamp":"..."}
```

---

## 7. Configurar Nginx como proxy reverso (opcional mas recomendado)

```bash
apt install nginx -y

nano /etc/nginx/sites-available/clipstrike
```

Cole:
```nginx
server {
    listen 80;
    server_name SEU_DOMINIO.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/clipstrike /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Comandos PM2 úteis

```bash
pm2 list                        # Ver status
pm2 logs clipstrike-backend     # Ver logs
pm2 restart clipstrike-backend  # Reiniciar
pm2 stop clipstrike-backend     # Parar
```

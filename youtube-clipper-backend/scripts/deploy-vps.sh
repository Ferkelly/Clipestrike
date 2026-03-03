#!/bin/bash
# ============================================================
# ClipStrike — Deploy/Update Script para VPS
# Execute: bash scripts/deploy-vps.sh
# ============================================================

set -e

BACKEND_DIR="/root/youtube-clipper-backend"
NGINX_CONF="$BACKEND_DIR/nginx_clipstrike.conf"
NGINX_SITE="/etc/nginx/sites-available/clipstrike"
NGINX_ENABLED="/etc/nginx/sites-enabled/clipstrike"
APP_NAME="clipstrike-backend"

echo "🚀 ClipStrike — Deploy na VPS"
echo "================================"

# ─── 1. Pull do código atualizado ────────────────────────────
echo ""
echo "📥 Puxando código mais recente..."
cd $BACKEND_DIR
git pull origin main

# ─── 2. Instalar dependências ────────────────────────────────
echo ""
echo "📦 Instalando dependências npm..."
npm install --production

# ─── 3. Configurar Nginx ─────────────────────────────────────
echo ""
echo "⚙️  Configurando Nginx..."

# Verifica se o repo tem o nginx_clipstrike.conf
CONF_FILE="$BACKEND_DIR/../nginx_clipstrike.conf"
if [ ! -f "$CONF_FILE" ]; then
    CONF_FILE="$BACKEND_DIR/nginx_clipstrike.conf"
fi

# Cria config do Nginx a partir do template
if [ -f "$CONF_FILE" ]; then
    sudo cp "$CONF_FILE" "$NGINX_SITE"
    echo "   Config copiada de: $CONF_FILE"
else
    echo "   Criando config Nginx manualmente..."
    sudo tee "$NGINX_SITE" > /dev/null <<'NGINX'
server {
    listen 80;
    server_name api.clipstrike.tech;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
fi

# Ativa o site
sudo ln -sf "$NGINX_SITE" "$NGINX_ENABLED"

# Validar e recarregar Nginx
echo "   Validando config Nginx..."
sudo nginx -t
sudo systemctl reload nginx
echo "   ✅ Nginx configurado e recarregado"

# ─── 4. Configurar SSL (se não existir) ──────────────────────
echo ""
CERT_PATH="/etc/letsencrypt/live/api.clipstrike.tech"
if [ ! -d "$CERT_PATH" ]; then
    echo "🔒 Configurando SSL com Certbot..."
    sudo certbot --nginx -d api.clipstrike.tech --non-interactive --agree-tos --email admin@clipstrike.tech
    echo "   ✅ SSL configurado"
else
    echo "🔒 SSL já configurado ($(ls $CERT_PATH))"
fi

# ─── 5. Reiniciar (ou iniciar) o backend com PM2 ────────────
echo ""
echo "⚙️  Gerenciando processo PM2..."

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    echo "   Reiniciando processo existente..."
    pm2 restart "$APP_NAME"
else
    echo "   Criando novo processo PM2..."
    cd $BACKEND_DIR
    pm2 start server.js --name "$APP_NAME"
fi

pm2 save
echo "   ✅ PM2 process '$APP_NAME' rodando"

# ─── 6. Verificar saúde ──────────────────────────────────────
echo ""
echo "🏥 Verificando saúde do backend..."
sleep 3

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Backend respondendo localmente (200 OK)"
else
    echo "   ⚠️  Backend retornou HTTP $HTTP_STATUS"
    echo "   Veja os logs: pm2 logs $APP_NAME --lines 30"
fi

echo ""
echo "================================"
echo "✅ Deploy concluído!"
echo ""
echo "Teste final:"
echo "  curl https://api.clipstrike.tech/api/health"
echo ""
pm2 status

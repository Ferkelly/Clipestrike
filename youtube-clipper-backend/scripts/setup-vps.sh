#!/bin/bash
# ============================================================
# ClipStrike — Deploy Script para VPS Hostinger (Ubuntu)
# Execute como root ou com sudo
# ============================================================

set -e  # Para em caso de erro

echo "🚀 Iniciando deploy ClipStrike..."

# ─── 1. Atualizar sistema ─────────────────────────────────
echo "📦 Atualizando pacotes..."
apt update && apt upgrade -y

# ─── 2. Instalar Node.js 20 LTS ──────────────────────────
echo "📦 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# ─── 3. Instalar Python + pip ────────────────────────────
echo "📦 Instalando Python..."
apt install -y python3 python3-pip

# ─── 4. Instalar FFmpeg ──────────────────────────────────
echo "🎬 Instalando FFmpeg..."
apt install -y ffmpeg

# ─── 5. Instalar yt-dlp ──────────────────────────────────
echo "📥 Instalando yt-dlp..."
pip3 install yt-dlp

# ─── 6. Instalar Whisper (transcrição local gratuita) ────
echo "🎙️  Instalando Whisper..."
pip3 install openai-whisper

# ─── 7. Instalar PM2 (gerenciador de processos) ──────────
echo "⚙️  Instalando PM2..."
npm install -g pm2

# ─── 8. Verificar versões ────────────────────────────────
echo ""
echo "✅ Versões instaladas:"
node --version
npm --version
ffmpeg -version | head -1
yt-dlp --version
python3 -c "import whisper; print('Whisper: OK')"
pm2 --version

echo ""
echo "✅ Ambiente pronto! Agora siga os próximos passos em DEPLOY.md"

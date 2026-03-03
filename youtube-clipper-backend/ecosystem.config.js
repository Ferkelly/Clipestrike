module.exports = {
    apps: [{
        name: "clipstrike",
        script: "server.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "600M",   // Elevado para 600MB devido ao processamento de vídeo
        restart_delay: 3000,      // aguarda 3s antes de reiniciar
        max_restarts: 10,        // máximo 10 restarts em sequência
        min_uptime: "10s",     // considera "estável" após 10s rodando
        env: {
            NODE_ENV: "production",
        },
        // Log de erros em arquivo
        error_file: "./logs/error.log",
        out_file: "./logs/out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
    }]
};

// ============================================================
// jobs/monitorCron.js
// Agenda o monitoramento automático de canais.
// Sem dependência externa — usa setInterval nativo do Node.js.
// ============================================================

const channelMonitorService = require("../services/channelMonitorService");

// Intervalo em minutos (configurável via .env)
const INTERVAL_MINUTES = parseInt(process.env.MONITOR_INTERVAL_MINUTES || "360", 10);
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

let cronHandle = null;
let isRunning = false;

// ── Executa com proteção contra execuções sobrepostas ─────────────────────
async function safeRun() {
    if (isRunning) {
        console.log("[Cron] ⏳ Monitor ainda em execução, pulando este ciclo...");
        return;
    }
    isRunning = true;
    try {
        await channelMonitorService.runChannelMonitor();
    } catch (error) {
        console.error("[Cron] ❌ Erro durante a execução do monitor:", error);
    } finally {
        isRunning = false;
    }
}

// ── Inicia o cron ─────────────────────────────────────────────────────────
function startMonitorCron() {
    if (cronHandle) {
        console.log("[Cron] ⚠️  Cron já está rodando, ignorando startMonitorCron()");
        return;
    }

    console.log(`[Cron] 🟢 Monitor iniciado — verificando a cada ${INTERVAL_MINUTES} minuto(s)`);

    // Primeira execução imediata ao subir o servidor
    safeRun();

    // Execuções periódicas
    cronHandle = setInterval(safeRun, INTERVAL_MS);
}

// ── Para o cron (útil para graceful shutdown) ─────────────────────────────
function stopMonitorCron() {
    if (cronHandle) {
        clearInterval(cronHandle);
        cronHandle = null;
        console.log("[Cron] 🔴 Monitor parado");
    }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────
// Nota: Em ambientes como Docker/Linux, SIGTERM é o padrão para parada
process.on("SIGTERM", () => { stopMonitorCron(); process.exit(0); });
process.on("SIGINT", () => { stopMonitorCron(); process.exit(0); });

module.exports = { startMonitorCron, stopMonitorCron };

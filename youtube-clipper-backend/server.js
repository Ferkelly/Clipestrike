require('dotenv').config();

// Evita que erros não tratados derrubem o servidor
process.on("uncaughtException", (err) => {
    console.error("[FATAL] uncaughtException:", err.message, err.stack);
});

process.on("unhandledRejection", (reason) => {
    console.error("[FATAL] unhandledRejection:", reason);
});

const { httpServer } = require('./src/app');

const { startMonitorCron } = require('./src/jobs/monitorCron');
const { startWebhookRenewalCron } = require('./src/jobs/renewalCron');

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);

    // Re-inscreve todos os canais nos webhooks do YouTube
    const { resubscribeAllChannels } = require('./src/services/webhookService');
    resubscribeAllChannels().catch(console.error);

    // Inicia o monitoramento automático de canais (Fallback)
    startMonitorCron();

    // Inicia a renovação automática de webhooks
    startWebhookRenewalCron();
});

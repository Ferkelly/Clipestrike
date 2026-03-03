const { renewAllSubscriptions } = require('../services/webhookService');

// Renovar a cada 8 dias (webhooks expiram em ~10 dias)
const RENEWAL_INTERVAL_MS = 8 * 24 * 60 * 60 * 1000;

function startWebhookRenewalCron() {
    console.log("[WebhookRenewal] ⏰ Cron de renovação iniciado (a cada 8 dias)");

    // Executar imediatamente ao subir (garante renovação após restart se necessário)
    // Nota: Pode ser otimizado para checar a data no banco e só rodar se necessário,
    // mas a renovação é idempotente, então não tem problema rodar no restart.
    renewAllSubscriptions().catch(err => {
        console.error("[WebhookRenewal] Erro na renovação inicial:", err.message);
    });

    // Agendar para cada 8 dias
    setInterval(() => {
        console.log("[WebhookRenewal] 🔄 Iniciando renovação agendada...");
        renewAllSubscriptions().catch(err => {
            console.error("[WebhookRenewal] Erro na renovação agendada:", err.message);
        });
    }, RENEWAL_INTERVAL_MS);
}

module.exports = { startWebhookRenewalCron };

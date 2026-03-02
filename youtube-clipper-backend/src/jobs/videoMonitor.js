const cron = require('node-cron');
const channelMonitorService = require('../services/channelMonitorService');

class VideoMonitor {
    constructor() {
        this.isRunning = false;
    }

    start() {
        // Verificar a cada 5 minutos (expansível conforme necessidade)
        cron.schedule('*/5 * * * *', () => {
            this.runCycle();
        });

        console.log('Monitor de vídeos (Channel Monitor) iniciado');
        // Rodar imediatamente ao iniciar
        this.runCycle();
    }

    async runCycle() {
        if (this.isRunning) return;
        this.isRunning = true;
        try {
            await channelMonitorService.runChannelMonitor();
        } catch (error) {
            console.error('Erro no ciclo do monitor:', error);
        } finally {
            this.isRunning = false;
        }
    }
}

module.exports = new VideoMonitor();

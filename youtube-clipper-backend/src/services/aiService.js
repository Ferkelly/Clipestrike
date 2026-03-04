const axios = require('axios');

class AIService {
    constructor() {
        // Usar Hugging Face (gratuito) ou implementação local
        this.hfApiKey = process.env.HUGGINGFACE_API_KEY;
        this.baseUrl = 'https://api-inference.huggingface.co/models';
    }

    // Analisar transcrição para momentos virais
    async analyzeTranscription(transcription) {
        const prompt = `
    Analise esta transcrição de vídeo e identifique os 3 melhores momentos para clips curtos (15-60 segundos).
    Para cada momento, forneça:
    1. Timestamp aproximado (início e fim)
    2. Score viral (0-100)
    3. Título cativante
    4. Hook (primeiros 3 segundos)
    5. Por que é viral
    
    Transcrição:
    ${transcription}
    
    Responda em JSON:
    {
      "clips": [
        {
          "start": "00:01:23",
          "end": "00:01:45",
          "viral_score": 85,
          "title": "...",
          "hook": "...",
          "reason": "..."
        }
      ]
    }
    `;

        try {
            // Usar modelo gratuito da Hugging Face ou OpenRouter (gratuito tier)
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: 'meta-llama/llama-3.1-8b-instruct:free',
                    messages: [{ role: 'user', content: prompt }]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const content = response.data.choices[0].message.content;
            return JSON.parse(content);
        } catch (error) {
            console.error('Erro na análise AI:', error);
            // Fallback: retornar análise básica
            return this.fallbackAnalysis(transcription);
        }
    }

    // Análise simples sem AI (fallback gratuito)
    fallbackAnalysis(transcription) {
        const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const clips = [];

        // Detectar padrões de viralidade simples
        const viralPatterns = [
            /secret|segredo|nunca|ninguém|impossível|incrível|chocante/i,
            /dinheiro|milionário|rico|ganhar|faturar/i,
            /erro|errado|falha|problema|crise/i,
            /descobri|revelado|exposed|verdade/i
        ];

        sentences.forEach((sentence, index) => {
            let score = 50;
            viralPatterns.forEach(pattern => {
                if (pattern.test(sentence)) score += 15;
            });

            if (score > 70) {
                clips.push({
                    start: `00:0${index}:00`,
                    end: `00:0${index + 1}:00`,
                    viral_score: Math.min(score, 95),
                    title: sentence.substring(0, 50) + '...',
                    hook: sentence.split(' ').slice(0, 5).join(' '),
                    reason: 'Palavras de alta conversão detectadas'
                });
            }
        });

        return { clips: clips.slice(0, 3) };
    }

    // Transcrever áudio — Whisper local (gratuito, offline) ou Hugging Face API (fallback)
    async transcribeAudio(audioPath) {
        try {
            const data = await this.transcribeWithWords(audioPath);
            return data.text;
        } catch (err) {
            console.log('Transcription failed, falling back to basic...');
            return 'Could not transcribe.';
        }
    }

    // Transcrever com palavras e timestamps (usando script Python)
    async transcribeWithWords(audioPath) {
        const { exec } = require('child_process');
        const util = require('util');
        const path = require('path');
        const execPromise = util.promisify(exec);

        const scriptPath = path.join(__dirname, '../../scripts/transcribe_with_words.py');

        try {
            console.log(`[AI] Transcribing with word-level timing: ${audioPath}`);
            const { stdout } = await execPromise(`python3 "${scriptPath}" "${audioPath}"`, {
                timeout: 30 * 60 * 1000 // 30 minutos
            });
            const data = JSON.parse(stdout);
            if (data.error) throw new Error(data.error);
            return data;
        } catch (error) {
            console.error('[AI] transcribeWithWords error:', error.message);
            throw error;
        }
    }

    // Calcular enquadramento inteligente
    async getSmartFraming(videoPath) {
        const { exec } = require('child_process');
        const util = require('util');
        const path = require('path');
        const execPromise = util.promisify(exec);

        const scriptPath = path.join(__dirname, '../../scripts/smart_framing.py');

        try {
            console.log(`[AI] Calculating smart framing for: ${videoPath}`);
            const { stdout } = await execPromise(`python3 "${scriptPath}" "${videoPath}"`, {
                timeout: 30 * 60 * 1000 // 30 minutos
            });
            const data = JSON.parse(stdout);
            if (data.error) throw new Error(data.error);
            return data;
        } catch (error) {
            console.warn('[AI] smart_framing failed, using center:', error.message);
            return { x_offset_pct: 0.5 };
        }
    }

    // Análise de sentimento/engajamento
    async analyzeEngagement(comments) {
        // Analisar comentários para entender o que funcionou
        const prompt = `Analise estes comentários e diga o sentimento geral (positivo/negativo/neutro) e temas principais:\n${comments.join('\n')}`;

        // Implementação similar à analyzeTranscription
        return { sentiment: 'positivo', themes: ['educativo', 'inspirador'] };
    }
}

module.exports = new AIService();

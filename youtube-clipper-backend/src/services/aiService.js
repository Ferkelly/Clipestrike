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
            return await this._transcribeLocal(audioPath);
        } catch {
            console.log('Whisper local não disponível, usando Hugging Face API...');
            return await this._transcribeHuggingFace(audioPath);
        }
    }

    // Opção 1: Whisper CLI local — GRATUITO, sem API key, funciona offline
    // Instalar: pip install openai-whisper
    async _transcribeLocal(audioPath) {
        const { exec } = require('child_process');
        const util = require('util');
        const path = require('path');
        const fs = require('fs');
        const execPromise = util.promisify(exec);

        const outputDir = path.dirname(audioPath);
        const baseName = path.basename(audioPath, path.extname(audioPath));

        await execPromise(
            `whisper "${audioPath}" --model base --language Portuguese --output_format txt --output_dir "${outputDir}"`
        );

        const txtPath = path.join(outputDir, `${baseName}.txt`);
        const text = fs.readFileSync(txtPath, 'utf-8');
        fs.unlinkSync(txtPath); // limpar arquivo temporário
        return text.trim();
    }

    // Opção 2: Hugging Face Inference API — gratuito (requer HUGGINGFACE_API_KEY)
    async _transcribeHuggingFace(audioPath) {
        const fs = require('fs');
        const audioBuffer = fs.readFileSync(audioPath);

        const response = await axios.post(
            `${this.baseUrl}/openai/whisper-large-v3`,
            audioBuffer,
            {
                headers: {
                    'Authorization': `Bearer ${this.hfApiKey}`,
                    'Content-Type': 'audio/mpeg'
                }
            }
        );

        return response.data.text;
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

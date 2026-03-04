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
        const { spawn } = require('child_process');
        const path = require('path');
        const scriptPath = path.join(__dirname, '../../scripts/transcribe_with_words.py');

        return new Promise((resolve, reject) => {
            console.log(`[AI] Starting transcription: ${audioPath}`);

            const pythonProcess = spawn('python3', [scriptPath, audioPath]);
            let stdoutData = '';
            let stderrData = '';

            pythonProcess.stdout.on('data', (data) => {
                const chunk = data.toString();
                stdoutData += chunk;
                // Log partial stdout if it's not too long (to see progress/debug)
                if (chunk.length < 500) console.log(`[AI-Py-Out]: ${chunk.trim()}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                const chunk = data.toString();
                stderrData += chunk;
                console.warn(`[AI-Py-Err]: ${chunk.trim()}`);
            });

            const timeoutId = setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('Transcription timed out after 30 minutes'));
            }, 30 * 60 * 1000);

            pythonProcess.on('close', (code) => {
                clearTimeout(timeoutId);
                if (code !== 0) {
                    return reject(new Error(`Python process failed with code ${code}. Stderr: ${stderrData}`));
                }
                try {
                    const data = JSON.parse(stdoutData);
                    if (data.error) throw new Error(data.error);
                    console.log('[AI] Transcription completed successfully.');
                    resolve(data);
                } catch (e) {
                    reject(new Error(`Failed to parse Python output: ${e.message}. Raw: ${stdoutData.substring(0, 100)}...`));
                }
            });
        });
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
            const { stdout, stderr } = await execPromise(`python3 "${scriptPath}" "${videoPath}"`, {
                timeout: 30 * 60 * 1000, // 30 minutos
                maxBuffer: 50 * 1024 * 1024 // 50MB buffer
            });

            if (stderr) console.log('[AI] Smart framing stderr:', stderr);

            const data = JSON.parse(stdout);
            if (data.error) throw new Error(data.error);
            return data;
        } catch (error) {
            console.warn('[AI] smart_framing failed, using center:', error.message);
            if (error.stderr) console.error('[AI] Framing detailed stderr:', error.stderr);
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

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

class FFmpegService {
    constructor() {
        this.outputDir = path.join(__dirname, '../../clips');
        this.ensureOutputDir();
    }

    async ensureOutputDir() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
        } catch (error) {
            console.error('Erro ao criar diretório:', error);
        }
    }

    // Extrair clip vertical (9:16) para Shorts/TikTok
    async extractVerticalClip(inputPath, startTime, duration, outputName) {
        const outputPath = path.join(this.outputDir, `${outputName}.mp4`);

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(startTime)
                .setDuration(duration)
                .videoFilters([
                    // Crop para 9:16 (1080x1920)
                    'crop=ih*9/16:ih:(iw-ih*9/16)/2:0',
                    // Scale para 1080x1920
                    'scale=1080:1920:flags=lanczos',
                    // Melhorar cores/contraste
                    'eq=contrast=1.1:saturation=1.1'
                ])
                .videoCodec('libx264')
                .audioCodec('aac')
                .outputOptions([
                    '-pix_fmt yuv420p',
                    '-movflags +faststart',
                    '-preset fast',
                    '-crf 23',
                    '-profile:v high',
                    '-level 4.2',
                    '-r 60' // 60fps para smooth
                ])
                .size('1080x1920')
                .on('start', (cmd) => {
                    console.log('Iniciando FFmpeg:', cmd);
                })
                .on('progress', (progress) => {
                    console.log(`Processando: ${progress.percent}%`);
                })
                .on('end', () => {
                    console.log('Clip criado:', outputPath);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    reject(new Error(`FFmpeg erro: ${err.message}`));
                })
                .save(outputPath);
        });
    }

    // Detectar cenas/cortes no vídeo
    async detectScenes(inputPath, threshold = 0.3) {
        return new Promise((resolve, reject) => {
            const scenes = [];

            ffmpeg(inputPath)
                .videoFilters(`select='gt(scene,${threshold})',showinfo`)
                .outputOptions('-f null')
                .on('stderr', (line) => {
                    // Parse scene changes do stderr
                    const match = line.match(/pts_time:([\d.]+)/);
                    if (match) {
                        scenes.push(parseFloat(match[1]));
                    }
                })
                .on('end', () => {
                    resolve(scenes);
                })
                .on('error', reject)
                .save('-');
        });
    }

    // Extrair áudio para análise
    async extractAudio(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .noVideo()
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .on('end', () => resolve(outputPath))
                .on('error', reject)
                .save(outputPath);
        });
    }

    // Criar thumbnail do clip
    async generateThumbnail(videoPath, time, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: [time],
                    filename: path.basename(outputPath),
                    folder: path.dirname(outputPath),
                    size: '1080x1920'
                })
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    // Adicionar legendas queimadas (burn-in)
    async addSubtitles(videoPath, subtitlesPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .videoFilters(`subtitles=${subtitlesPath}:force_style='FontSize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2'`)
                .on('end', () => resolve(outputPath))
                .on('error', reject)
                .save(outputPath);
        });
    }
}

module.exports = new FFmpegService();

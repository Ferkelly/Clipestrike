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
    async extractVerticalClip(inputPath, startTime, duration, outputName, options = {}) {
        const { xOffset = 0.5, subtitlesPath = null, onProgress = null } = options;
        const outputPath = path.join(this.outputDir, `${outputName}.mp4`);

        return new Promise((resolve, reject) => {
            const filters = [
                `crop=ih*9/16:ih:min(max(0,iw*${xOffset}-ih*9/32),iw-ih*9/16):0`,
                'scale=1080:1920:flags=lanczos',
                'eq=contrast=1.1:saturation=1.2'
            ];

            if (subtitlesPath) {
                const escapedPath = subtitlesPath.replace(/\\/g, '/').replace(/:/g, '\\:');
                filters.push(`subtitles='${escapedPath}'`);
            }

            let command = ffmpeg(inputPath)
                .setStartTime(startTime)
                .setDuration(duration)
                .videoFilters(filters)
                .videoCodec('libx264')
                .audioCodec('aac')
                .outputOptions([
                    '-pix_fmt yuv420p',
                    '-movflags +faststart',
                    '-preset ultrafast',
                    '-crf 23',
                    '-profile:v high',
                    '-level 4.2',
                    '-r 30'
                ]);

            if (onProgress) {
                command.on('progress', (progress) => {
                    const percent = Math.min(99, Math.max(0, progress.percent || 0));
                    onProgress(percent);
                });
            }

            command
                .on('start', (cmd) => {
                    console.log('Iniciando FFmpeg:', cmd);
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
    async extractAudio(inputPath, outputPath, onProgress = null) {
        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath)
                .noVideo()
                .audioCodec('libmp3lame')
                .audioBitrate('128k');

            if (onProgress) {
                command.on('progress', (progress) => {
                    onProgress(progress.percent || 0);
                });
            }

            command
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
    async addSubtitles(videoPath, subtitlesPath, outputPath, onProgress = null) {
        return new Promise((resolve, reject) => {
            let command = ffmpeg(videoPath)
                .videoFilters(`subtitles=${subtitlesPath}:force_style='FontSize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2'`);

            if (onProgress) {
                command.on('progress', (progress) => {
                    onProgress(progress.percent || 0);
                });
            }

            command
                .on('end', () => resolve(outputPath))
                .on('error', reject)
                .save(outputPath);
        });
    }
}

module.exports = new FFmpegService();

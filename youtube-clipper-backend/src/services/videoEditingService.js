const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

/**
 * CORTAR SILÊNCIO
 */
async function cutSilence(inputPath, options = {}) {
    if (process.env.ENABLE_SILENCE_CUT !== 'true' && !options.edit_silence_cut) return inputPath;
    if (options.edit_silence_cut === false) return inputPath;

    const outputPath = inputPath.replace('.mp4', '_nosilence.mp4');
    logger.info(`[Edit] ✂️ Cortando silêncios: ${path.basename(inputPath)}`);

    try {
        // auto-editor remove automaticamente partes silenciosas
        // --margin 0.2s mantém 0.2s antes e depois de cada fala
        // --silent-threshold 0.04 = 4% do volume máximo é considerado silêncio
        await execAsync(
            `auto-editor "${inputPath}" ` +
            `--margin 0.2sec ` +
            `--silent-threshold 0.04 ` +
            `--export ffmpeg ` +
            `-o "${outputPath}" ` +
            `--no-open`
        );

        if (fs.existsSync(outputPath)) {
            logger.info("[Edit] ✅ Silêncios removidos");
            return outputPath;
        }
    } catch (err) {
        logger.error(`[Edit] ⚠️ auto-editor falhou, usando original: ${err.message}`);
    }

    return inputPath;
}

/**
 * ZOOM DINÂMICO
 */
async function addDynamicZoom(inputPath, durationSeconds, options = {}) {
    if (process.env.ENABLE_ZOOM !== 'true' && !options.edit_zoom) return inputPath;
    if (options.edit_zoom === false) return inputPath;

    const outputPath = inputPath.replace('.mp4', '_zoom.mp4');
    logger.info(`[Edit] 🔍 Adicionando zoom dinâmico: ${path.basename(inputPath)}`);

    try {
        const zoomFilter = [
            `scale=iw*1.05:ih*1.05,`,
            `zoompan=`,
            `z='if(lte(mod(on,90),45),1.05-0.001*mod(on,45),1.0+0.001*mod(on,45))':`,
            `x='iw/2-(iw/zoom/2)':`,
            `y='ih/2-(ih/zoom/2)':`,
            `d=1:`,
            `s=720x1280:`,
            `fps=30`
        ].join("");

        await execAsync(
            `ffmpeg -i "${inputPath}" ` +
            `-vf "${zoomFilter}" ` +
            `-c:v libx264 -preset fast -crf 23 ` +
            `-c:a copy ` +
            `-y "${outputPath}"`
        );

        if (fs.existsSync(outputPath)) {
            logger.info("[Edit] ✅ Zoom dinâmico aplicado");
            return outputPath;
        }
    } catch (err) {
        logger.error(`[Edit] ⚠️ Zoom falhou, usando original: ${err.message}`);
    }

    return inputPath;
}

/**
 * Extrai palavra-chave para B-Roll
 */
function extractKeyword(text) {
    const stopwords = new Set([
        "que", "de", "da", "do", "em", "para", "com", "uma", "um", "por", "mais",
        "como", "mas", "não", "isso", "este", "essa", "ele", "ela", "ser", "ter",
        "seu", "sua", "isso", "aqui", "então", "também", "quando", "onde", "está",
        "the", "and", "for", "with", "this", "that"
    ]);

    const words = text.toLowerCase()
        .replace(/[^a-záéíóúâêîôûãõç\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopwords.has(w));

    return words.sort((a, b) => b.length - a.length)[0] || "business";
}

/**
 * Baixa vídeo do Pexels
 */
async function downloadPexelsVideo(keyword, duration, outputPath) {
    try {
        const apiKey = process.env.PEXELS_API_KEY;
        if (!apiKey) {
            logger.warn("[BRoll] PEXELS_API_KEY não configurada");
            return false;
        }

        const res = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(keyword)}&orientation=portrait&size=medium&per_page=5`,
            { headers: { Authorization: apiKey } }
        );
        const data = await res.json();

        if (!data.videos || !data.videos.length) return false;

        const suitable = data.videos
            .filter((v) => v.duration >= duration - 2)
            .sort((a, b) =>
                Math.abs(a.duration - duration) - Math.abs(b.duration - duration)
            )[0] || data.videos[0];

        const videoFile = suitable.video_files
            .filter((f) => f.width >= 720)
            .sort((a, b) => b.width - a.width)[0]
            || suitable.video_files[0];

        if (!videoFile || !videoFile.link) return false;

        const videoRes = await fetch(videoFile.link);
        const buffer = await videoRes.buffer();
        fs.writeFileSync(outputPath, buffer);
        return true;

    } catch (err) {
        logger.error(`[BRoll] Erro ao baixar "${keyword}": ${err.message}`);
        return false;
    }
}

/**
 * B-ROLL AUTOMÁTICO
 */
async function addBRoll(inputPath, transcriptionSegments, options = {}) {
    if (process.env.ENABLE_BROLL !== "true" && !options.edit_broll) return inputPath;
    if (options.edit_broll === false) return inputPath;
    if (!transcriptionSegments || !transcriptionSegments.length) return inputPath;

    logger.info(`[Edit] 🎬 Adicionando b-roll: ${path.basename(inputPath)}`);

    try {
        const totalDuration = transcriptionSegments[transcriptionSegments.length - 1].end || 30;
        const midSegments = transcriptionSegments.filter(s =>
            s.start > totalDuration * 0.2 &&
            s.end < totalDuration * 0.8 &&
            (s.end - s.start) >= 2
        );

        if (!midSegments.length) return inputPath;

        const chosen = midSegments
            .sort(() => Math.random() - 0.5)
            .slice(0, 2);

        const brollFiles = [];
        const tempFiles = [];

        for (const seg of chosen) {
            const keyword = extractKeyword(seg.text);
            const duration = seg.end - seg.start;
            const tmpPath = path.join('/tmp', `broll_${Date.now()}_${keyword}.mp4`);

            logger.info(`[BRoll] Buscando "${keyword}" para ${duration.toFixed(1)}s...`);
            const success = await downloadPexelsVideo(keyword, duration, tmpPath);

            if (success) {
                brollFiles.push({ path: tmpPath, start: seg.start, end: seg.end });
                tempFiles.push(tmpPath);
                logger.info(`[BRoll] ✅ "${keyword}" baixado`);
            }
        }

        if (!brollFiles.length) return inputPath;

        const outputPath = inputPath.replace(".mp4", "_broll.mp4");
        const trimmedBrolls = [];

        for (let i = 0; i < brollFiles.length; i++) {
            const br = brollFiles[i];
            const duration = br.end - br.start;
            const trimmedPath = path.join('/tmp', `broll_trim_${i}_${Date.now()}.mp4`);

            await execAsync(
                `ffmpeg -i "${br.path}" ` +
                `-t ${duration} ` +
                `-vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" ` +
                `-c:v libx264 -preset fast -an ` +
                `-y "${trimmedPath}"`
            );
            trimmedBrolls.push(trimmedPath);
            tempFiles.push(trimmedPath);
        }

        let filterStr = `[0:v]`;
        const inputs = trimmedBrolls.map((p) => `-i "${p}"`).join(" ");

        for (let i = 0; i < brollFiles.length; i++) {
            const br = brollFiles[i];
            const currentLabel = i === 0 ? "[0:v]" : `[ov${i - 1}]`;
            const outLabel = i === brollFiles.length - 1 ? "[vfinal]" : `[ov${i}]`;
            filterStr = `${currentLabel}[${i + 1}:v]overlay=0:0:enable='between(t,${br.start},${br.end})'${outLabel}`;
        }

        await execAsync(
            `ffmpeg -i "${inputPath}" ${inputs} ` +
            `-filter_complex "${filterStr}" ` +
            `-map "[vfinal]" -map 0:a ` +
            `-c:v libx264 -preset fast -crf 23 ` +
            `-c:a copy ` +
            `-y "${outputPath}"`
        );

        // Limpar temporários
        tempFiles.forEach(f => { try { fs.unlinkSync(f); } catch (_) { } });

        if (fs.existsSync(outputPath)) {
            logger.info(`[Edit] ✅ B-roll adicionado em ${brollFiles.length} momento(s)`);
            return outputPath;
        }

    } catch (err) {
        logger.error(`[Edit] ⚠️ B-roll falhou, usando original: ${err.message}`);
    }

    return inputPath;
}

/**
 * APLICAR TODAS AS EDIÇÕES
 */
async function applyAdvancedEditing(inputPath, duration, transcription, options = {}) {
    let currentPath = inputPath;
    const filesToCleanup = [];

    try {
        // 1. Cortar silêncio
        const noSilencePath = await cutSilence(currentPath, options);
        if (noSilencePath !== currentPath) filesToCleanup.push(noSilencePath);
        currentPath = noSilencePath;

        // 2. Zoom dinâmico
        const zoomPath = await addDynamicZoom(currentPath, duration, options);
        if (zoomPath !== currentPath) filesToCleanup.push(zoomPath);
        currentPath = zoomPath;

        // 3. B-roll
        if (transcription && transcription.length) {
            const brollPath = await addBRoll(currentPath, transcription, options);
            if (brollPath !== currentPath) filesToCleanup.push(brollPath);
            currentPath = brollPath;
        }

        // Retornar o caminho final. O chamador cuidará da limpeza final.
        return {
            path: currentPath,
            tempFiles: filesToCleanup.filter(f => f !== currentPath)
        };

    } catch (err) {
        logger.error(`[Edit] Erro geral nas edições avançadas: ${err.message}`);
        return { path: inputPath, tempFiles: filesToCleanup };
    }
}

module.exports = {
    cutSilence,
    addDynamicZoom,
    addBRoll,
    applyAdvancedEditing
};

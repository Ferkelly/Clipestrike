const fs = require('fs');
const path = require('path');

class SubtitleGenerator {
    /**
     * Gera um arquivo .ass (Advanced Substation Alpha) estilo Hormozi
     * @param {Array} words - Array de objetos {word, start, end}
     * @param {string} outputPath - Caminho para salvar o arquivo .ass
     */
    static generateAss(words, outputPath) {
        const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hormozi,Arial,85,&H00FFFFFF,&H0000FFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,3,2,10,10,200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

        const events = words.map(w => {
            const start = this.formatTime(w.start);
            const end = this.formatTime(w.end);
            // Estilo Hormozi: Todo em maiúsculas, cor amarela para destaque
            const text = `{\\an2}{\\pos(540,1600)}{\\b1}{\\c&H00FFFF&}${w.word.toUpperCase()}`;
            return `Dialogue: 0,${start},${end},Hormozi,,0,0,0,,${text}`;
        }).join('\n');

        fs.writeFileSync(outputPath, header + events, 'utf-8');
        return outputPath;
    }

    static formatTime(seconds) {
        const date = new Date(seconds * 1000);
        const hh = String(date.getUTCHours()).padStart(1, '0');
        const mm = String(date.getUTCMinutes()).padStart(2, '0');
        const ss = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = String(date.getUTCMilliseconds()).substring(0, 2).padStart(2, '0');
        return `${hh}:${mm}:${ss}.${ms}`;
    }
}

module.exports = SubtitleGenerator;

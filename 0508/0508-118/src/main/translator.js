const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const MAX_RETRY = 3;
const RETRY_DELAY = 2000;
const BAIDU_API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

function parseSrt(content) {
    const blocks = [];
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (!line) {
            i++;
            continue;
        }

        const indexMatch = line.match(/^(\d+)$/);
        if (indexMatch) {
            const index = parseInt(indexMatch[1]);
            i++;

            if (i >= lines.length) break;
            const timeLine = lines[i].trim();
            const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
            if (!timeMatch) {
                i++;
                continue;
            }

            i++;
            const startTime = timeMatch[1];
            const endTime = timeMatch[2];
            const texts = [];

            while (i < lines.length && lines[i].trim() !== '') {
                texts.push(lines[i]);
                i++;
            }

            blocks.push({
                index,
                startTime,
                endTime,
                originalText: texts.join('\n')
            });
        } else {
            i++;
        }
    }

    return blocks;
}

function buildSrt(blocks) {
    const lines = [];
    for (const block of blocks) {
        lines.push(block.index.toString());
        lines.push(`${block.startTime} --> ${block.endTime}`);
        lines.push(block.translatedText || block.originalText);
        lines.push('');
    }
    return lines.join('\n');
}

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

async function translateSingleLine(line, sourceLang, targetLang, appId, appKey, retryCount = 0) {
    const salt = Date.now().toString();
    const sign = md5(appId + line + salt + appKey);

    try {
        const response = await axios.post(
            BAIDU_API_URL,
            new URLSearchParams({
                q: line,
                from: sourceLang,
                to: targetLang,
                appid: appId,
                salt: salt,
                sign: sign
            }),
            {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const data = response.data;

        if (data.error_code) {
            throw new Error(`百度翻译API错误: ${data.error_code} - ${data.error_msg}`);
        }

        if (data.trans_result && data.trans_result.length > 0) {
            return data.trans_result[0].dst;
        }

        throw new Error('翻译结果为空');
    } catch (err) {
        if (retryCount < MAX_RETRY) {
            await sleep(RETRY_DELAY * (retryCount + 1));
            return translateSingleLine(line, sourceLang, targetLang, appId, appKey, retryCount + 1);
        }
        throw err;
    }
}

async function translateText(text, sourceLang, targetLang, appId, appKey) {
    const originalLines = text.split('\n');
    const translatedLines = [];

    for (const line of originalLines) {
        if (line.trim() === '') {
            translatedLines.push(line);
            continue;
        }

        try {
            const translated = await translateSingleLine(line, sourceLang, targetLang, appId, appKey);
            translatedLines.push(translated);
        } catch (err) {
            translatedLines.push(line);
        }
    }

    return translatedLines.join('\n');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitWhilePaused(controller) {
    while (controller.isPaused && !controller.isCancelled) {
        await sleep(100);
    }
}

async function translateSrtFile(files, sourceLang, targetLang, appId, appKey, controller, onProgress) {
    const results = [];
    let totalFiles = files.length;
    let completedFiles = 0;
    let totalSubtitles = 0;
    let completedSubtitles = 0;

    for (const file of files) {
        if (controller.isCancelled) {
            break;
        }

        await waitWhilePaused(controller);

        try {
            const content = fs.readFileSync(file.path, 'utf8');
            const blocks = parseSrt(content);
            totalSubtitles += blocks.length;

            onProgress({
                type: 'file-start',
                file: file.name,
                completedFiles,
                totalFiles,
                completedSubtitles,
                totalSubtitles
            });

            let fileSuccess = true;
            const translatedBlocks = [];

            for (let i = 0; i < blocks.length; i++) {
                if (controller.isCancelled) {
                    break;
                }

                await waitWhilePaused(controller);

                const block = blocks[i];
                try {
                    const translatedText = await translateText(
                        block.originalText,
                        sourceLang,
                        targetLang,
                        appId,
                        appKey
                    );

                    translatedBlocks.push({
                        ...block,
                        translatedText
                    });

                    completedSubtitles++;

                    onProgress({
                        type: 'subtitle-progress',
                        file: file.name,
                        subtitleIndex: i + 1,
                        totalSubtitlesInFile: blocks.length,
                        completedFiles,
                        totalFiles,
                        completedSubtitles,
                        totalSubtitles
                    });
                } catch (err) {
                    fileSuccess = false;
                    translatedBlocks.push({
                        ...block,
                        translatedText: block.originalText
                    });
                    completedSubtitles++;
                }
            }

            if (!controller.isCancelled) {
                const outputPath = generateOutputPath(file.path, targetLang);
                const outputContent = buildSrt(translatedBlocks);
                fs.writeFileSync(outputPath, outputContent, 'utf8');

                completedFiles++;

                results.push({
                    file: file.name,
                    outputPath,
                    success: fileSuccess,
                    total: blocks.length
                });

                onProgress({
                    type: 'file-complete',
                    file: file.name,
                    outputPath,
                    success: fileSuccess,
                    completedFiles,
                    totalFiles,
                    completedSubtitles,
                    totalSubtitles
                });
            }
        } catch (err) {
            results.push({
                file: file.name,
                success: false,
                error: err.message
            });

            onProgress({
                type: 'file-error',
                file: file.name,
                error: err.message,
                completedFiles,
                totalFiles
            });
        }
    }

    onProgress({
        type: 'complete',
        completedFiles,
        totalFiles,
        completedSubtitles,
        totalSubtitles
    });

    return results;
}

function generateOutputPath(inputPath, targetLang) {
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const name = path.basename(inputPath, ext);
    return path.join(dir, `${name}_${targetLang}${ext}`);
}

module.exports = {
    translateSrtFile,
    parseSrt,
    buildSrt
};

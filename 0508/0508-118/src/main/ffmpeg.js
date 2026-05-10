const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function findFfmpeg() {
    const possiblePaths = [
        'ffmpeg',
        'ffmpeg.exe',
        path.join(process.cwd(), 'ffmpeg', 'ffmpeg.exe'),
        path.join(process.cwd(), 'ffmpeg', 'bin', 'ffmpeg.exe'),
        'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\ffmpeg\\bin\\ffmpeg.exe'
    ];

    for (const ffmpegPath of possiblePaths) {
        try {
            if (fs.existsSync(ffmpegPath) || ffmpegPath === 'ffmpeg' || ffmpegPath === 'ffmpeg.exe') {
                return ffmpegPath;
            }
        } catch (e) {
            continue;
        }
    }

    return null;
}

function checkFfmpegAvailable() {
    return new Promise((resolve) => {
        const ffmpegPath = findFfmpeg();
        if (!ffmpegPath) {
            resolve({ available: false, message: '未找到FFmpeg，请确保FFmpeg已安装并在PATH中' });
            return;
        }

        const proc = spawn(ffmpegPath, ['-version'], { windowsHide: true });
        
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0 || (stdout.includes('ffmpeg') && code !== null)) {
                resolve({ available: true, path: ffmpegPath, version: stdout.split('\n')[0] });
            } else {
                resolve({ available: false, message: 'FFmpeg执行失败，请确保已正确安装' });
            }
        });

        proc.on('error', () => {
            resolve({ available: false, message: '无法执行FFmpeg，请确保已安装并在PATH中' });
        });
    });
}

function escapePathForFfmpeg(filePath) {
    return filePath.replace(/\\/g, '/').replace(/:/g, '\\:');
}

function burnSubtitles(inputVideo, inputSrt, outputVideo, options = {}, onProgress, controller) {
    return new Promise((resolve, reject) => {
        const ffmpegPath = findFfmpeg();
        if (!ffmpegPath) {
            reject(new Error('未找到FFmpeg'));
            return;
        }

        const fontSize = options.fontSize || 24;
        const fontName = options.fontName || 'Arial';
        const primaryColor = options.primaryColor || '&H00FFFFFF';
        const outlineColor = options.outlineColor || '&H00000000';
        const outline = options.outline || 2;
        const crf = options.crf || 23;
        const preset = options.preset || 'medium';

        const escapedSrtPath = escapePathForFfmpeg(inputSrt);
        
        const subtitleFilter = `subtitles='${escapedSrtPath}':force_style='FontName=${fontName},FontSize=${fontSize},PrimaryColour=${primaryColor},OutlineColour=${outlineColor},Outline=${outline}'`;

        const args = [
            '-i', inputVideo,
            '-vf', subtitleFilter,
            '-c:v', 'libx264',
            '-preset', preset,
            '-crf', crf.toString(),
            '-c:a', 'copy',
            '-y',
            outputVideo
        ];

        const proc = spawn(ffmpegPath, args, { windowsHide: true });

        let stderrOutput = '';
        let duration = null;

        proc.stderr.on('data', (data) => {
            const output = data.toString();
            stderrOutput += output;

            if (!duration) {
                const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
                if (durationMatch) {
                    const hours = parseInt(durationMatch[1]);
                    const minutes = parseInt(durationMatch[2]);
                    const seconds = parseInt(durationMatch[3]);
                    const milliseconds = parseInt(durationMatch[4]);
                    duration = hours * 3600 + minutes * 60 + seconds + milliseconds / 100;
                }
            }

            const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
            if (timeMatch && duration && onProgress) {
                const hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const seconds = parseInt(timeMatch[3]);
                const milliseconds = parseInt(timeMatch[4]);
                const currentTime = hours * 3600 + minutes * 60 + seconds + milliseconds / 100;
                const progress = Math.min((currentTime / duration) * 100, 100);
                onProgress({ type: 'progress', progress: Math.round(progress) });
            }
        });

        proc.on('close', (code) => {
            if (controller && controller.isCancelled) {
                reject(new Error('已取消'));
                return;
            }

            if (code === 0) {
                resolve({ success: true, outputPath: outputVideo });
            } else {
                reject(new Error(`FFmpeg执行失败 (退出码: ${code})`));
            }
        });

        proc.on('error', (err) => {
            reject(new Error(`FFmpeg启动失败: ${err.message}`));
        });

        if (controller) {
            controller.cancel = () => {
                controller.isCancelled = true;
                proc.kill();
            };
        }
    });
}

function findMatchingVideo(srtPath, videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm']) {
    const dir = path.dirname(srtPath);
    const srtBaseName = path.basename(srtPath, '.srt');
    
    let baseName = srtBaseName;
    const langSuffixMatch = srtBaseName.match(/^(.+)_[a-z]{2,3}$/i);
    if (langSuffixMatch) {
        baseName = langSuffixMatch[1];
    }

    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (videoExtensions.includes(ext)) {
            const fileBaseName = path.basename(file, ext);
            if (fileBaseName === baseName || fileBaseName === srtBaseName) {
                return path.join(dir, file);
            }
        }
    }

    return null;
}

function scanVideoFiles(folderPath) {
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v'];
    const files = [];

    function scanDir(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scanDir(fullPath);
            } else if (item.isFile()) {
                const ext = path.extname(item.name).toLowerCase();
                if (videoExtensions.includes(ext)) {
                    files.push({
                        name: item.name,
                        path: fullPath,
                        size: fs.statSync(fullPath).size
                    });
                }
            }
        }
    }

    scanDir(folderPath);
    return files;
}

function generateOutputVideoPath(inputVideo, suffix = '_subbed') {
    const dir = path.dirname(inputVideo);
    const ext = path.extname(inputVideo);
    const name = path.basename(inputVideo, ext);
    return path.join(dir, `${name}${suffix}${ext}`);
}

module.exports = {
    checkFfmpegAvailable,
    burnSubtitles,
    findMatchingVideo,
    scanVideoFiles,
    generateOutputVideoPath
};

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { translateSrtFile } = require('./translator');
const {
    checkFfmpegAvailable,
    burnSubtitles,
    scanVideoFiles,
    findMatchingVideo,
    generateOutputVideoPath
} = require('./ffmpeg');

let mainWindow;
let translationController = {
    isPaused: false,
    isCancelled: false
};

let burnController = {
    isCancelled: false
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('scan-srt-files', async (event, folderPath) => {
    return new Promise((resolve, reject) => {
        try {
            const files = [];
            function scanDir(dir) {
                const items = fs.readdirSync(dir, { withFileTypes: true });
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    if (item.isDirectory()) {
                        scanDir(fullPath);
                    } else if (item.isFile() && item.name.toLowerCase().endsWith('.srt')) {
                        files.push({
                            name: item.name,
                            path: fullPath,
                            size: fs.statSync(fullPath).size
                        });
                    }
                }
            }
            scanDir(folderPath);
            resolve(files);
        } catch (err) {
            reject(err);
        }
    });
});

ipcMain.handle('start-translation', async (event, config) => {
    translationController.isPaused = false;
    translationController.isCancelled = false;

    const onProgress = (progress) => {
        mainWindow.webContents.send('translation-progress', progress);
    };

    try {
        const result = await translateSrtFile(
            config.files,
            config.sourceLang,
            config.targetLang,
            config.appId,
            config.appKey,
            translationController,
            onProgress
        );
        return { success: true, result };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('pause-translation', () => {
    translationController.isPaused = true;
    return true;
});

ipcMain.handle('resume-translation', () => {
    translationController.isPaused = false;
    return true;
});

ipcMain.handle('cancel-translation', () => {
    translationController.isCancelled = true;
    translationController.isPaused = false;
    return true;
});

ipcMain.handle('check-ffmpeg', async () => {
    return await checkFfmpegAvailable();
});

ipcMain.handle('scan-video-files', async (event, folderPath) => {
    return new Promise((resolve, reject) => {
        try {
            const files = scanVideoFiles(folderPath);
            resolve(files);
        } catch (err) {
            reject(err);
        }
    });
});

ipcMain.handle('find-matching-video', async (event, srtPath) => {
    return findMatchingVideo(srtPath);
});

ipcMain.handle('start-burn-subtitles', async (event, config) => {
    burnController.isCancelled = false;

    const onProgress = (progress) => {
        mainWindow.webContents.send('burn-progress', progress);
    };

    try {
        const results = [];
        const totalTasks = config.tasks.length;
        let completedTasks = 0;

        for (const task of config.tasks) {
            if (burnController.isCancelled) break;

            const outputPath = task.outputPath || generateOutputVideoPath(task.videoPath, '_subbed');
            
            onProgress({
                type: 'task-start',
                video: path.basename(task.videoPath),
                srt: path.basename(task.srtPath),
                completedTasks,
                totalTasks
            });

            try {
                const result = await burnSubtitles(
                    task.videoPath,
                    task.srtPath,
                    outputPath,
                    config.options || {},
                    (progress) => {
                        onProgress({
                            type: 'video-progress',
                            video: path.basename(task.videoPath),
                            progress: progress.progress,
                            completedTasks,
                            totalTasks
                        });
                    },
                    burnController
                );

                completedTasks++;
                results.push({
                    video: task.videoPath,
                    srt: task.srtPath,
                    outputPath,
                    success: true
                });

                onProgress({
                    type: 'task-complete',
                    video: path.basename(task.videoPath),
                    outputPath,
                    completedTasks,
                    totalTasks
                });
            } catch (err) {
                if (burnController.isCancelled) {
                    results.push({
                        video: task.videoPath,
                        srt: task.srtPath,
                        success: false,
                        cancelled: true
                    });
                } else {
                    results.push({
                        video: task.videoPath,
                        srt: task.srtPath,
                        success: false,
                        error: err.message
                    });

                    onProgress({
                        type: 'task-error',
                        video: path.basename(task.videoPath),
                        error: err.message,
                        completedTasks,
                        totalTasks
                    });
                }
            }
        }

        onProgress({
            type: 'complete',
            completedTasks,
            totalTasks
        });

        return { success: true, results };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('cancel-burn', () => {
    burnController.isCancelled = true;
    if (burnController.cancel) {
        burnController.cancel();
    }
    return true;
});

ipcMain.handle('select-video-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: '视频文件', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'm4v'] },
            { name: '所有文件', extensions: ['*'] }
        ]
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('select-srt-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: '字幕文件', extensions: ['srt'] },
            { name: '所有文件', extensions: ['*'] }
        ]
    });
    return result.canceled ? null : result.filePaths[0];
});

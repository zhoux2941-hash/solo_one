const { ipcRenderer } = require('electron');

let srtFiles = [];
let isRunning = false;
let isPaused = false;

let burnTasks = [];
let ffmpegAvailable = false;
let currentBurnMode = 'folder';

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const translateTab = document.getElementById('translateTab');
const burnTab = document.getElementById('burnTab');

const selectFolderBtn = document.getElementById('selectFolderBtn');
const folderPath = document.getElementById('folderPath');
const fileList = document.getElementById('fileList');
const srtFilesList = document.getElementById('srtFiles');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const cancelBtn = document.getElementById('cancelBtn');
const progressSection = document.getElementById('progressSection');
const currentFile = document.getElementById('currentFile');
const fileProgress = document.getElementById('fileProgress');
const subtitleProgress = document.getElementById('subtitleProgress');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const subtitleProgressFill = document.getElementById('subtitleProgressFill');
const subtitleProgressPercent = document.getElementById('subtitleProgressPercent');
const logContainer = document.getElementById('logContainer');
const appIdInput = document.getElementById('appId');
const appKeyInput = document.getElementById('appKey');
const sourceLangSelect = document.getElementById('sourceLang');
const targetLangSelect = document.getElementById('targetLang');

const ffmpegStatus = document.getElementById('ffmpegStatus');
const ffmpegStatusText = document.getElementById('ffmpegStatusText');
const modeBtns = document.querySelectorAll('.mode-btn');
const folderModeSection = document.getElementById('folderModeSection');
const singleModeSection = document.getElementById('singleModeSection');

const selectBurnFolderBtn = document.getElementById('selectBurnFolderBtn');
const burnFolderPath = document.getElementById('burnFolderPath');
const burnFileList = document.getElementById('burnFileList');
const burnTasksList = document.getElementById('burnTasks');

const selectBurnVideoBtn = document.getElementById('selectBurnVideoBtn');
const burnVideoPath = document.getElementById('burnVideoPath');
const selectBurnSrtBtn = document.getElementById('selectBurnSrtBtn');
const burnSrtPath = document.getElementById('burnSrtPath');

const startBurnBtn = document.getElementById('startBurnBtn');
const cancelBurnBtn = document.getElementById('cancelBurnBtn');

const burnProgressSection = document.getElementById('burnProgressSection');
const burnCurrentVideo = document.getElementById('burnCurrentVideo');
const burnTaskProgress = document.getElementById('burnTaskProgress');
const burnProgressFill = document.getElementById('burnProgressFill');
const burnProgressPercent = document.getElementById('burnProgressPercent');
const burnVideoProgressText = document.getElementById('burnVideoProgressText');
const burnVideoProgressFill = document.getElementById('burnVideoProgressFill');
const burnVideoProgressPercent = document.getElementById('burnVideoProgressPercent');

const burnFontSize = document.getElementById('burnFontSize');
const burnFontName = document.getElementById('burnFontName');
const burnPreset = document.getElementById('burnPreset');
const burnCrf = document.getElementById('burnCrf');

function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function switchTab(tabName) {
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
}

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});

function switchBurnMode(mode) {
    currentBurnMode = mode;
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    if (mode === 'folder') {
        folderModeSection.classList.remove('hidden');
        singleModeSection.classList.add('hidden');
    } else {
        folderModeSection.classList.add('hidden');
        singleModeSection.classList.remove('hidden');
    }
    updateBurnButtonState();
}

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchBurnMode(btn.dataset.mode);
    });
});

async function checkFfmpeg() {
    const result = await ipcRenderer.invoke('check-ffmpeg');
    
    if (result.available) {
        ffmpegAvailable = true;
        ffmpegStatus.classList.remove('error');
        ffmpegStatus.classList.add('success');
        ffmpegStatus.querySelector('.status-icon').textContent = '✅';
        ffmpegStatusText.textContent = result.version || 'FFmpeg已就绪';
        addLog('FFmpeg检测成功: ' + (result.version || '已就绪'), 'success');
    } else {
        ffmpegAvailable = false;
        ffmpegStatus.classList.remove('success');
        ffmpegStatus.classList.add('error');
        ffmpegStatus.querySelector('.status-icon').textContent = '❌';
        ffmpegStatusText.textContent = result.message;
        addLog('FFmpeg检测失败: ' + result.message, 'error');
    }
    updateBurnButtonState();
}

function updateTranslateProgress(progress) {
    currentFile.textContent = progress.file || '-';
    fileProgress.textContent = `${progress.completedFiles || 0} / ${progress.totalFiles || 0}`;
    subtitleProgress.textContent = `${progress.completedSubtitles || 0} / ${progress.totalSubtitles || 0}`;

    const totalPercent = progress.totalSubtitles > 0 
        ? Math.round((progress.completedSubtitles / progress.totalSubtitles) * 100) 
        : 0;
    progressFill.style.width = `${totalPercent}%`;
    progressPercent.textContent = `${totalPercent}%`;

    if (progress.totalSubtitlesInFile) {
        const subtitlePercent = Math.round((progress.subtitleIndex / progress.totalSubtitlesInFile) * 100);
        subtitleProgressFill.style.width = `${subtitlePercent}%`;
        subtitleProgressPercent.textContent = `${subtitlePercent}%`;
    }
}

function setTranslateButtonsState(running, paused = false) {
    isRunning = running;
    isPaused = paused;

    startBtn.disabled = running;
    selectFolderBtn.disabled = running;
    appIdInput.disabled = running;
    appKeyInput.disabled = running;
    sourceLangSelect.disabled = running;
    targetLangSelect.disabled = running;
    pauseBtn.disabled = !running;
    cancelBtn.disabled = !running;

    if (paused) {
        pauseBtn.textContent = '继续';
    } else {
        pauseBtn.textContent = '暂停';
    }
}

function updateBurnButtonState() {
    let canStart = ffmpegAvailable;
    
    if (currentBurnMode === 'folder') {
        canStart = canStart && burnTasks.length > 0;
    } else {
        canStart = canStart && burnVideoPath.value && burnSrtPath.value;
    }
    
    startBurnBtn.disabled = !canStart;
}

function updateBurnProgress(progress) {
    burnCurrentVideo.textContent = progress.video || '-';
    burnTaskProgress.textContent = `${progress.completedTasks || 0} / ${progress.totalTasks || 0}`;

    if (progress.totalTasks > 0) {
        const taskPercent = Math.round((progress.completedTasks / progress.totalTasks) * 100);
        burnProgressFill.style.width = `${taskPercent}%`;
        burnProgressPercent.textContent = `${taskPercent}%`;
    }

    if (progress.progress !== undefined) {
        burnVideoProgressText.textContent = `${progress.progress}%`;
        burnVideoProgressFill.style.width = `${progress.progress}%`;
        burnVideoProgressPercent.textContent = `${progress.progress}%`;
    }
}

selectFolderBtn.addEventListener('click', async () => {
    const folder = await ipcRenderer.invoke('select-folder');
    if (folder) {
        folderPath.value = folder;
        addLog(`已选择文件夹: ${folder}`, 'info');

        try {
            srtFiles = await ipcRenderer.invoke('scan-srt-files', folder);
            
            if (srtFiles.length > 0) {
                fileList.classList.remove('hidden');
                srtFilesList.innerHTML = '';
                srtFiles.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                    srtFilesList.appendChild(li);
                });
                addLog(`共找到 ${srtFiles.length} 个SRT文件`, 'success');
                startBtn.disabled = false;
            } else {
                fileList.classList.add('hidden');
                addLog('该文件夹下没有找到SRT文件', 'warning');
                startBtn.disabled = true;
            }
        } catch (err) {
            addLog(`扫描文件失败: ${err.message}`, 'error');
        }
    }
});

startBtn.addEventListener('click', async () => {
    if (!appIdInput.value.trim()) {
        addLog('请输入百度翻译API的App ID', 'warning');
        return;
    }
    if (!appKeyInput.value.trim()) {
        addLog('请输入百度翻译API的密钥', 'warning');
        return;
    }
    if (srtFiles.length === 0) {
        addLog('请先选择包含SRT文件的文件夹', 'warning');
        return;
    }

    progressSection.classList.remove('hidden');
    setTranslateButtonsState(true);
    addLog('开始翻译...', 'info');

    const config = {
        files: srtFiles,
        sourceLang: sourceLangSelect.value,
        targetLang: targetLangSelect.value,
        appId: appIdInput.value.trim(),
        appKey: appKeyInput.value.trim()
    };

    const result = await ipcRenderer.invoke('start-translation', config);
    
    setTranslateButtonsState(false);
    addLog('翻译任务结束', 'info');

    if (result.success) {
        const successCount = result.result.filter(r => r.success).length;
        addLog(`翻译完成！成功 ${successCount}/${result.result.length} 个文件`, 'success');
    } else {
        addLog(`翻译失败: ${result.error}`, 'error');
    }
});

pauseBtn.addEventListener('click', async () => {
    if (isPaused) {
        await ipcRenderer.invoke('resume-translation');
        setTranslateButtonsState(true, false);
        addLog('已恢复翻译', 'info');
    } else {
        await ipcRenderer.invoke('pause-translation');
        setTranslateButtonsState(true, true);
        addLog('已暂停翻译', 'warning');
    }
});

cancelBtn.addEventListener('click', async () => {
    await ipcRenderer.invoke('cancel-translation');
    addLog('正在取消翻译任务...', 'warning');
});

ipcRenderer.on('translation-progress', (event, progress) => {
    switch (progress.type) {
        case 'file-start':
            addLog(`开始翻译文件: ${progress.file}`, 'info');
            updateTranslateProgress(progress);
            break;
        case 'subtitle-progress':
            updateTranslateProgress(progress);
            break;
        case 'file-complete':
            updateTranslateProgress(progress);
            if (progress.success) {
                addLog(`完成: ${progress.file} -> ${progress.outputPath}`, 'success');
            } else {
                addLog(`完成(部分失败): ${progress.file}`, 'warning');
            }
            break;
        case 'file-error':
            addLog(`错误: ${progress.file} - ${progress.error}`, 'error');
            break;
        case 'complete':
            updateTranslateProgress(progress);
            break;
    }
});

selectBurnFolderBtn.addEventListener('click', async () => {
    const folder = await ipcRenderer.invoke('select-folder');
    if (folder) {
        burnFolderPath.value = folder;
        addLog(`已选择文件夹: ${folder}`, 'info');

        try {
            const videoFiles = await ipcRenderer.invoke('scan-video-files', folder);
            const srtFilesInFolder = await ipcRenderer.invoke('scan-srt-files', folder);

            burnTasks = [];
            
            for (const srtFile of srtFilesInFolder) {
                const matchingVideo = await ipcRenderer.invoke('find-matching-video', srtFile.path);
                if (matchingVideo) {
                    const video = videoFiles.find(v => v.path === matchingVideo);
                    burnTasks.push({
                        videoPath: matchingVideo,
                        srtPath: srtFile.path,
                        videoName: video ? video.name : matchingVideo.split('\\').pop(),
                        srtName: srtFile.name
                    });
                }
            }

            if (burnTasks.length > 0) {
                burnFileList.classList.remove('hidden');
                burnTasksList.innerHTML = '';
                burnTasks.forEach(task => {
                    const li = document.createElement('li');
                    li.innerHTML = `🎬 ${task.videoName} + 📝 ${task.srtName}`;
                    burnTasksList.appendChild(li);
                });
                addLog(`找到 ${burnTasks.length} 个匹配的视频-字幕对`, 'success');
            } else {
                burnFileList.classList.add('hidden');
                addLog('未找到匹配的视频和字幕对', 'warning');
            }
            updateBurnButtonState();
        } catch (err) {
            addLog(`扫描文件失败: ${err.message}`, 'error');
        }
    }
});

selectBurnVideoBtn.addEventListener('click', async () => {
    const video = await ipcRenderer.invoke('select-video-file');
    if (video) {
        burnVideoPath.value = video;
        addLog(`已选择视频: ${video}`, 'info');
        updateBurnButtonState();
    }
});

selectBurnSrtBtn.addEventListener('click', async () => {
    const srt = await ipcRenderer.invoke('select-srt-file');
    if (srt) {
        burnSrtPath.value = srt;
        addLog(`已选择字幕: ${srt}`, 'info');
        updateBurnButtonState();
    }
});

startBurnBtn.addEventListener('click', async () => {
    let tasks = [];

    if (currentBurnMode === 'folder') {
        tasks = burnTasks.map(t => ({
            videoPath: t.videoPath,
            srtPath: t.srtPath
        }));
    } else {
        if (!burnVideoPath.value || !burnSrtPath.value) {
            addLog('请选择视频和字幕文件', 'warning');
            return;
        }
        tasks = [{
            videoPath: burnVideoPath.value,
            srtPath: burnSrtPath.value
        }];
    }

    const config = {
        tasks,
        options: {
            fontSize: parseInt(burnFontSize.value),
            fontName: burnFontName.value,
            preset: burnPreset.value,
            crf: parseInt(burnCrf.value)
        }
    };

    burnProgressSection.classList.remove('hidden');
    startBurnBtn.disabled = true;
    cancelBurnBtn.disabled = false;

    addLog('开始字幕压制...', 'info');

    const result = await ipcRenderer.invoke('start-burn-subtitles', config);

    startBurnBtn.disabled = !ffmpegAvailable || tasks.length === 0;
    cancelBurnBtn.disabled = true;

    if (result.success) {
        const successCount = result.results.filter(r => r.success).length;
        addLog(`压制完成！成功 ${successCount}/${result.results.length} 个任务`, 'success');
        
        result.results.forEach(r => {
            if (r.success) {
                addLog(`输出: ${r.outputPath}`, 'success');
            }
        });
    } else {
        addLog(`压制失败: ${result.error}`, 'error');
    }
});

cancelBurnBtn.addEventListener('click', async () => {
    await ipcRenderer.invoke('cancel-burn');
    addLog('正在取消压制任务...', 'warning');
});

ipcRenderer.on('burn-progress', (event, progress) => {
    switch (progress.type) {
        case 'task-start':
            addLog(`开始压制: ${progress.video} + ${progress.srt}`, 'info');
            updateBurnProgress(progress);
            break;
        case 'video-progress':
            updateBurnProgress(progress);
            break;
        case 'task-complete':
            addLog(`完成: ${progress.video}`, 'success');
            updateBurnProgress(progress);
            break;
        case 'task-error':
            addLog(`错误: ${progress.video} - ${progress.error}`, 'error');
            break;
        case 'complete':
            updateBurnProgress(progress);
            break;
    }
});

addLog('程序已启动', 'info');
checkFfmpeg();

const selectFolderBtn = document.getElementById('selectFolderBtn');
const scanBtn = document.getElementById('scanBtn');
const batchApplyBtn = document.getElementById('batchApplyBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const folderPathEl = document.getElementById('folderPath');
const videoCountEl = document.getElementById('videoCount');
const subtitleCountEl = document.getElementById('subtitleCount');
const matchedCountEl = document.getElementById('matchedCount');
const loadingEl = document.getElementById('loading');
const emptyStateEl = document.getElementById('emptyState');
const resultsContainerEl = document.getElementById('resultsContainer');

let currentFolderPath = null;
let scanResult = null;
let matchResults = [];

selectFolderBtn.addEventListener('click', async () => {
  const result = await window.electronAPI.selectFolder();
  
  if (result.success && result.path) {
    currentFolderPath = result.path;
    folderPathEl.textContent = result.path;
    scanBtn.disabled = false;
    resetUI();
  }
});

scanBtn.addEventListener('click', async () => {
  if (!currentFolderPath) return;
  
  showLoading();
  
  try {
    const scanResp = await window.electronAPI.scanFiles(currentFolderPath);
    
    if (!scanResp.success) {
      throw new Error(scanResp.error);
    }
    
    scanResult = scanResp.data;
    
    videoCountEl.textContent = scanResult.videos.length;
    subtitleCountEl.textContent = scanResult.subtitles.length;
    
    if (scanResult.videos.length === 0 || scanResult.subtitles.length === 0) {
      hideLoading();
      showEmptyState('未找到足够的文件', '请确保文件夹中包含视频文件和字幕文件');
      return;
    }
    
    const matchResp = await window.electronAPI.matchSubtitles({
      folderPath: currentFolderPath,
      videos: scanResult.videos,
      subtitles: scanResult.subtitles
    });
    
    if (!matchResp.success) {
      throw new Error(matchResp.error);
    }
    
    matchResults = matchResp.data;
    matchedCountEl.textContent = matchResults.length;
    
    if (matchResults.length === 0) {
      hideLoading();
      showEmptyState('无需匹配', '所有视频已经有对应的字幕或已在历史记录中');
      return;
    }
    
    renderResults();
    hideLoading();
    showResults();
    updateBatchButton();
    
  } catch (error) {
    hideLoading();
    showEmptyState('错误', error.message);
  }
});

batchApplyBtn.addEventListener('click', async () => {
  const selectedMatches = matchResults.filter(m => m.selectedMatch);
  
  if (selectedMatches.length === 0) {
    await window.electronAPI.showMessage({
      type: 'warning',
      title: '提示',
      message: '请先选择要应用的字幕'
    });
    return;
  }
  
  const confirm = await confirmAction(
    `确定要为 ${selectedMatches.length} 个视频应用选中的字幕吗？`,
    '字幕文件将被复制到视频同级目录并重命名'
  );
  
  if (!confirm) return;
  
  showLoading();
  
  try {
    const result = await window.electronAPI.batchRename(selectedMatches);
    
    const successCount = result.filter(r => r.success).length;
    const failCount = result.filter(r => !r.success).length;
    
    let message = `处理完成！\n\n成功: ${successCount} 个`;
    if (failCount > 0) {
      message += `\n失败: ${failCount} 个`;
    }
    
    await window.electronAPI.showMessage({
      type: successCount > 0 ? 'info' : 'error',
      title: '处理完成',
      message: message
    });
    
    hideLoading();
    scanBtn.click();
    
  } catch (error) {
    hideLoading();
    await window.electronAPI.showMessage({
      type: 'error',
      title: '错误',
      message: error.message
    });
  }
});

clearHistoryBtn.addEventListener('click', async () => {
  const confirm = await confirmAction(
    '确定要清除所有匹配历史吗？',
    '清除后，之前已经匹配过的视频将重新出现在列表中'
  );
  
  if (!confirm) return;
  
  try {
    await window.electronAPI.clearHistory();
    
    await window.electronAPI.showMessage({
      type: 'info',
      title: '完成',
      message: '匹配历史已清除'
    });
    
    if (currentFolderPath && scanResult) {
      scanBtn.click();
    }
    
  } catch (error) {
    await window.electronAPI.showMessage({
      type: 'error',
      title: '错误',
      message: error.message
    });
  }
});

function renderResults() {
  resultsContainerEl.innerHTML = '';
  
  matchResults.forEach((match, videoIndex) => {
    const card = document.createElement('div');
    card.className = 'video-match-card';
    
    const videoInfo = document.createElement('div');
    videoInfo.className = 'video-info';
    videoInfo.innerHTML = `
      <div class="video-icon">🎬</div>
      <div class="video-details">
        <div class="video-name">${escapeHtml(match.video.name)}</div>
        <div class="video-path">${escapeHtml(match.video.path)}</div>
      </div>
    `;
    card.appendChild(videoInfo);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'subtitle-options';
    
    match.matches.forEach((subMatch, subIndex) => {
      const option = document.createElement('div');
      option.className = 'subtitle-option';
      option.dataset.videoIndex = videoIndex;
      option.dataset.subIndex = subIndex;
      
      const similarityPercent = subMatch.similarity.toFixed(1);
      
      option.innerHTML = `
        <input 
          type="radio" 
          name="video-${videoIndex}" 
          class="subtitle-radio"
          ${subIndex === 0 ? 'checked' : ''}
        >
        <div class="subtitle-info">
          <div class="subtitle-name">${escapeHtml(subMatch.subtitle.name)}</div>
          <div class="subtitle-path">${escapeHtml(subMatch.subtitle.path)}</div>
        </div>
        <div class="match-stats">
          <span class="match-distance">编辑距离: ${subMatch.distance}</span>
          <span class="match-similarity">相似度: ${similarityPercent}%</span>
        </div>
      `;
      
      option.addEventListener('click', (e) => {
        if (e.target.type === 'radio') return;
        selectSubtitle(videoIndex, subIndex);
      });
      
      const radio = option.querySelector('.subtitle-radio');
      radio.addEventListener('change', () => {
        selectSubtitle(videoIndex, subIndex);
      });
      
      if (subIndex === 0) {
        option.classList.add('selected');
        matchResults[videoIndex].selectedMatch = subMatch;
      }
      
      optionsContainer.appendChild(option);
    });
    
    card.appendChild(optionsContainer);
    resultsContainerEl.appendChild(card);
  });
}

function selectSubtitle(videoIndex, subIndex) {
  const match = matchResults[videoIndex];
  match.selectedMatch = match.matches[subIndex];
  
  const options = document.querySelectorAll(`.subtitle-option[data-video-index="${videoIndex}"]`);
  options.forEach((opt, idx) => {
    const radio = opt.querySelector('.subtitle-radio');
    if (idx === subIndex) {
      opt.classList.add('selected');
      radio.checked = true;
    } else {
      opt.classList.remove('selected');
      radio.checked = false;
    }
  });
  
  updateBatchButton();
}

function updateBatchButton() {
  const hasSelected = matchResults.some(m => m.selectedMatch);
  batchApplyBtn.disabled = !hasSelected;
}

function showLoading() {
  loadingEl.style.display = 'block';
  emptyStateEl.style.display = 'none';
  resultsContainerEl.style.display = 'none';
}

function hideLoading() {
  loadingEl.style.display = 'none';
}

function showEmptyState(title, message) {
  emptyStateEl.style.display = 'block';
  resultsContainerEl.style.display = 'none';
  emptyStateEl.innerHTML = `
    <div class="empty-icon">📋</div>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(message)}</p>
  `;
}

function showResults() {
  emptyStateEl.style.display = 'none';
  resultsContainerEl.style.display = 'flex';
}

function resetUI() {
  videoCountEl.textContent = '0';
  subtitleCountEl.textContent = '0';
  matchedCountEl.textContent = '0';
  resultsContainerEl.innerHTML = '';
  resultsContainerEl.style.display = 'none';
  emptyStateEl.style.display = 'block';
  emptyStateEl.innerHTML = `
    <div class="empty-icon">🔍</div>
    <h3>点击"扫描并匹配"开始</h3>
    <p>工具将自动扫描视频文件并尝试匹配字幕</p>
  `;
  batchApplyBtn.disabled = true;
  scanResult = null;
  matchResults = [];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function confirmAction(title, detail) {
  return new Promise((resolve) => {
    const confirmed = window.confirm(`${title}\n\n${detail}`);
    resolve(confirmed);
  });
}

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
  });
});

const selectSubtitleBtn = document.getElementById('selectSubtitleBtn');
const shiftSubtitlePathEl = document.getElementById('shiftSubtitlePath');
const offsetSecondsEl = document.getElementById('offsetSeconds');
const offsetBtns = document.querySelectorAll('.offset-btn');
const applyShiftBtn = document.getElementById('applyShiftBtn');
const resetOffsetBtn = document.getElementById('resetOffsetBtn');
const outputModeRadios = document.querySelectorAll('input[name="outputMode"]');
const customOutputRow = document.getElementById('customOutputRow');
const selectOutputBtn = document.getElementById('selectOutputBtn');
const customOutputPathEl = document.getElementById('customOutputPath');
const shiftResultEl = document.getElementById('shiftResult');
const shiftResultDetailEl = document.getElementById('shiftResultDetail');
const shiftPreviewEl = document.getElementById('shiftPreview');
const previewOriginalEl = document.getElementById('previewOriginal');
const previewOffsetEl = document.getElementById('previewOffset');
const previewOutputEl = document.getElementById('previewOutput');

let selectedSubtitlePath = null;
let selectedOutputPath = null;

selectSubtitleBtn.addEventListener('click', async () => {
  const result = await window.electronAPI.selectFolder();
  
  if (result.success && result.path) {
    const scanResp = await window.electronAPI.scanFiles(result.path);
    
    if (scanResp.success && scanResp.data.subtitles.length > 0) {
      const subtitles = scanResp.data.subtitles;
      
      if (subtitles.length === 1) {
        selectedSubtitlePath = subtitles[0].path;
        shiftSubtitlePathEl.value = subtitles[0].name;
      } else {
        const options = subtitles.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
        const selectedIdx = prompt(`找到 ${subtitles.length} 个字幕文件，请选择：\n\n${options}\n\n输入序号 (1-${subtitles.length}):`);
        
        if (selectedIdx) {
          const idx = parseInt(selectedIdx) - 1;
          if (idx >= 0 && idx < subtitles.length) {
            selectedSubtitlePath = subtitles[idx].path;
            shiftSubtitlePathEl.value = subtitles[idx].name;
          }
        }
      }
      
      updateShiftUI();
    } else {
      await window.electronAPI.showMessage({
        type: 'warning',
        title: '提示',
        message: '未找到字幕文件'
      });
    }
  }
});

offsetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const offset = parseFloat(btn.dataset.offset);
    const current = parseFloat(offsetSecondsEl.value) || 0;
    offsetSecondsEl.value = current + offset;
    updatePreview();
    updateShiftUI();
  });
});

offsetSecondsEl.addEventListener('input', () => {
  updatePreview();
  updateShiftUI();
});

outputModeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'custom') {
      customOutputRow.style.display = 'block';
    } else {
      customOutputRow.style.display = 'none';
      selectedOutputPath = null;
    }
    updatePreview();
    updateShiftUI();
  });
});

function getFileName(filePath) {
  const separator = filePath.includes('/') ? '/' : '\\';
  const parts = filePath.split(separator);
  return parts[parts.length - 1];
}

function getFileExtension(fileName) {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(lastDot) : '';
}

function getBaseName(fileName) {
  const ext = getFileExtension(fileName);
  return ext ? fileName.substring(0, fileName.length - ext.length) : fileName;
}

selectOutputBtn.addEventListener('click', async () => {
  if (!selectedSubtitlePath) {
    await window.electronAPI.showMessage({
      type: 'warning',
      title: '提示',
      message: '请先选择字幕文件'
    });
    return;
  }
  
  const fileName = getFileName(selectedSubtitlePath);
  const ext = getFileExtension(fileName);
  const baseName = getBaseName(fileName);
  const offset = parseFloat(offsetSecondsEl.value) || 0;
  const suffix = offset >= 0 ? `_+${offset}s` : `_${offset}s`;
  const defaultName = baseName + suffix + ext;
  
  const result = await window.electronAPI.selectSavePath({
    defaultName: defaultName
  });
  
  if (result.success && result.path) {
    selectedOutputPath = result.path;
    customOutputPathEl.value = result.path;
    updatePreview();
    updateShiftUI();
  }
});

applyShiftBtn.addEventListener('click', async () => {
  if (!selectedSubtitlePath) {
    await window.electronAPI.showMessage({
      type: 'warning',
      title: '提示',
      message: '请先选择字幕文件'
    });
    return;
  }
  
  const offset = parseFloat(offsetSecondsEl.value);
  
  if (isNaN(offset)) {
    await window.electronAPI.showMessage({
      type: 'warning',
      title: '提示',
      message: '请输入有效的偏移量'
    });
    return;
  }
  
  const outputMode = document.querySelector('input[name="outputMode"]:checked').value;
  let outputPath = null;
  
  if (outputMode === 'custom') {
    if (!selectedOutputPath) {
      await window.electronAPI.showMessage({
        type: 'warning',
        title: '提示',
        message: '请选择保存路径'
      });
      return;
    }
    outputPath = selectedOutputPath;
  }
  
  const confirm = await confirmAction(
    '确定要应用时间轴偏移吗？',
    `偏移量: ${offset >= 0 ? '+' : ''}${offset} 秒\n${outputPath ? `输出到: ${outputPath}` : '自动命名保存'}`
  );
  
  if (!confirm) return;
  
  try {
    const result = await window.electronAPI.shiftSubtitle({
      subtitlePath: selectedSubtitlePath,
      offsetSeconds: offset,
      outputPath: outputPath
    });
    
    if (result.success) {
      shiftResultEl.style.display = 'block';
      shiftResultDetailEl.textContent = `已保存到: ${result.data.outputPath}`;
      
      await window.electronAPI.showMessage({
        type: 'info',
        title: '成功',
        message: `时间轴偏移已应用！\n偏移量: ${offset >= 0 ? '+' : ''}${offset} 秒\n输出文件: ${result.data.outputPath}`
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    await window.electronAPI.showMessage({
      type: 'error',
      title: '错误',
      message: error.message
    });
  }
});

resetOffsetBtn.addEventListener('click', () => {
  offsetSecondsEl.value = 0;
  shiftResultEl.style.display = 'none';
  updatePreview();
  updateShiftUI();
});

function updatePreview() {
  if (!selectedSubtitlePath) {
    shiftPreviewEl.style.display = 'none';
    return;
  }
  
  const offset = parseFloat(offsetSecondsEl.value) || 0;
  const fileName = getFileName(selectedSubtitlePath);
  const ext = getFileExtension(fileName);
  const baseName = getBaseName(fileName);
  const suffix = offset >= 0 ? `_+${offset}s` : `_${offset}s`;
  const outputName = baseName + suffix + ext;
  
  previewOriginalEl.textContent = fileName;
  previewOffsetEl.textContent = `${offset >= 0 ? '+' : ''}${offset} 秒`;
  previewOutputEl.textContent = selectedOutputPath || outputName;
  
  shiftPreviewEl.style.display = 'block';
}

function updateShiftUI() {
  const offset = parseFloat(offsetSecondsEl.value);
  const outputMode = document.querySelector('input[name="outputMode"]:checked').value;
  
  const canApply = selectedSubtitlePath && 
                   !isNaN(offset) && 
                   (outputMode === 'auto' || selectedOutputPath);
  
  applyShiftBtn.disabled = !canApply;
  
  if (selectedSubtitlePath) {
    updatePreview();
  }
}

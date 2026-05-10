const { snippetAPI } = window;

let editor;
let currentSnippetId = null;
let currentTags = [];
let snippets = [];
let allTags = [];
let selectedTagFilter = null;
let searchQuery = '';

const LANGUAGE_MODE_MAP = {
  javascript: 'javascript',
  python: 'python',
  java: 'text/x-java',
  cpp: 'text/x-c++src',
  c: 'text/x-csrc',
  csharp: 'text/x-csharp',
  typescript: 'text/typescript',
  php: 'php',
  ruby: 'ruby',
  go: 'go',
  rust: 'rust',
  sql: 'sql',
  html: 'htmlmixed',
  css: 'css',
  xml: 'xml',
  json: 'javascript',
  yaml: 'yaml',
  markdown: 'markdown',
  shell: 'shell'
};

function initCodeMirror() {
  editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    mode: 'javascript',
    theme: 'material-darker',
    lineNumbers: true,
    lineWrapping: true,
    autoCloseBrackets: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    styleActiveLine: true,
    tabSize: 2,
    indentUnit: 2,
    matchBrackets: true,
    highlightSelectionMatches: {
      showToken: /\w/,
      annotateScrollbar: true
    },
    extraKeys: {
      'Ctrl-S': saveSnippet,
      'Cmd-S': saveSnippet
    }
  });
  
  editor.setSize('100%', '100%');
}

let searchMarks = [];
let isRunning = false;
let outputPanelExpanded = true;

function clearSearchHighlights() {
  searchMarks.forEach(mark => {
    try {
      mark.clear();
    } catch (e) {}
  });
  searchMarks = [];
}

function highlightSearchMatches(query) {
  clearSearchHighlights();
  
  if (!query || !editor) return;
  
  const searchQuery = query.trim();
  if (!searchQuery) return;
  
  const text = editor.getValue();
  const regex = new RegExp(escapeRegExp(searchQuery), 'gi');
  let match;
  
  const lineStarts = [0];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    lineStarts.push(lineStarts[i] + lines[i].length + 1);
  }
  
  while ((match = regex.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    
    let startLine = 0;
    let endLine = 0;
    
    for (let i = 0; i < lineStarts.length - 1; i++) {
      if (startIndex >= lineStarts[i] && startIndex < lineStarts[i + 1]) {
        startLine = i;
      }
      if (endIndex >= lineStarts[i] && endIndex < lineStarts[i + 1]) {
        endLine = i;
      }
    }
    
    const startCh = startIndex - lineStarts[startLine];
    const endCh = endIndex - lineStarts[endLine];
    
    const from = { line: startLine, ch: startCh };
    const to = { line: endLine, ch: endCh };
    
    const mark = editor.markText(from, to, {
      className: 'cm-searching'
    });
    searchMarks.push(mark);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showOutputPanel() {
  document.getElementById('outputPanel').style.display = 'flex';
  outputPanelExpanded = true;
  document.getElementById('toggleOutputBtn').textContent = '收起';
}

function hideOutputPanel() {
  document.getElementById('outputPanel').style.display = 'none';
}

function toggleOutputPanel() {
  const panel = document.getElementById('outputPanel');
  if (panel.style.display === 'none') {
    panel.style.display = 'flex';
    outputPanelExpanded = true;
    document.getElementById('toggleOutputBtn').textContent = '收起';
  } else {
    panel.style.display = 'none';
    outputPanelExpanded = false;
    document.getElementById('toggleOutputBtn').textContent = '展开';
  }
}

function clearOutput() {
  document.getElementById('outputContent').innerHTML = '';
  document.getElementById('runStatus').textContent = '';
}

function appendOutput(text, type = 'normal') {
  const outputContent = document.getElementById('outputContent');
  const lineDiv = document.createElement('div');
  lineDiv.className = `output-line output-${type}`;
  lineDiv.textContent = text;
  outputContent.appendChild(lineDiv);
  outputContent.scrollTop = outputContent.scrollHeight;
}

function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

async function runCode() {
  if (isRunning) {
    showStatus('代码正在执行中...', 'info');
    return;
  }
  
  const language = document.getElementById('languageSelect').value;
  const code = editor.getValue();
  
  if (!code.trim()) {
    showStatus('代码为空', 'error');
    return;
  }
  
  if (language !== 'javascript' && language !== 'typescript' && language !== 'python') {
    showStatus('仅支持运行 JavaScript 和 Python 代码', 'error');
    return;
  }
  
  isRunning = true;
  const runBtn = document.getElementById('runBtn');
  runBtn.disabled = true;
  runBtn.textContent = '⏳ 运行中...';
  runBtn.style.opacity = '0.7';
  
  showOutputPanel();
  clearOutput();
  document.getElementById('runStatus').textContent = '⚡ 执行中...';
  document.getElementById('runStatus').className = 'run-status running';
  
  showStatus('正在执行代码...', 'info');
  
  try {
    const result = await snippetAPI.runCode(language, code);
    
    if (result.output) {
      const lines = result.output.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          appendOutput(line, 'stdout');
        }
      }
    }
    
    if (result.error) {
      const errorLines = result.error.split('\n');
      for (const line of errorLines) {
        if (line.trim()) {
          appendOutput(line, 'stderr');
        }
      }
    }
    
    const runStatusEl = document.getElementById('runStatus');
    if (result.success) {
      runStatusEl.textContent = `✅ 执行成功 (${formatDuration(result.duration)})`;
      runStatusEl.className = 'run-status success';
      showStatus(`执行成功 (${formatDuration(result.duration)})`, 'success');
    } else {
      runStatusEl.textContent = `❌ 执行失败 (${formatDuration(result.duration || 0)})`;
      runStatusEl.className = 'run-status error';
      showStatus('执行失败，请查看输出', 'error');
    }
    
  } catch (error) {
    appendOutput(`执行错误: ${error.message}`, 'stderr');
    const runStatusEl = document.getElementById('runStatus');
    runStatusEl.textContent = '❌ 执行异常';
    runStatusEl.className = 'run-status error';
    showStatus(`执行错误: ${error.message}`, 'error');
  } finally {
    isRunning = false;
    runBtn.disabled = false;
    runBtn.textContent = '▶️ 运行';
    runBtn.style.opacity = '1';
  }
}

function setEditorLanguage(language) {
  const mode = LANGUAGE_MODE_MAP[language] || 'javascript';
  editor.setOption('mode', mode);
}

async function loadSnippets() {
  if (searchQuery) {
    snippets = await snippetAPI.searchSnippets(searchQuery);
  } else if (selectedTagFilter) {
    snippets = await snippetAPI.getSnippetsByTag(selectedTagFilter);
  } else {
    snippets = await snippetAPI.getAllSnippets();
  }
  renderSnippetList();
}

async function loadTags() {
  allTags = await snippetAPI.getAllTags();
  renderTags();
}

function renderSnippetList() {
  const listEl = document.getElementById('snippetList');
  
  if (snippets.length === 0) {
    listEl.innerHTML = `
      <div class="no-snippets">
        ${searchQuery || selectedTagFilter ? '没有找到匹配的片段' : '暂无代码片段'}
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = snippets.map(snippet => `
    <div class="snippet-item ${currentSnippetId === snippet.id ? 'active' : ''}" data-id="${snippet.id}">
      <div class="snippet-header">
        <span class="snippet-title">${escapeHtml(snippet.title)}</span>
        <span class="snippet-language ${snippet.language}">${snippet.language}</span>
      </div>
      <div class="snippet-tags">
        ${snippet.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="snippet-preview">${escapeHtml(snippet.code.substring(0, 100))}${snippet.code.length > 100 ? '...' : ''}</div>
      <div class="snippet-date">${formatDate(snippet.updated_at)}</div>
    </div>
  `).join('');
  
  listEl.querySelectorAll('.snippet-item').forEach(item => {
    item.addEventListener('click', () => loadSnippet(parseInt(item.dataset.id)));
  });
}

function renderTags() {
  const tagsListEl = document.getElementById('tagsList');
  
  if (allTags.length === 0) {
    tagsListEl.innerHTML = '<div class="no-tags">暂无标签</div>';
    return;
  }
  
  tagsListEl.innerHTML = allTags.map(tag => `
    <span class="tag-filter ${selectedTagFilter === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}">
      #${escapeHtml(tag)}
    </span>
  `).join('');
  
  tagsListEl.querySelectorAll('.tag-filter').forEach(tagEl => {
    tagEl.addEventListener('click', () => {
      const tag = tagEl.dataset.tag;
      if (selectedTagFilter === tag) {
        selectedTagFilter = null;
        document.getElementById('clearTagFilter').style.display = 'none';
      } else {
        selectedTagFilter = tag;
        document.getElementById('clearTagFilter').style.display = 'inline-block';
      }
      loadSnippets();
    });
  });
}

function renderCurrentTags() {
  const container = document.getElementById('selectedTags');
  container.innerHTML = currentTags.map((tag, index) => `
    <span class="current-tag">
      #${escapeHtml(tag)}
      <button class="remove-tag" data-index="${index}">✕</button>
    </span>
  `).join('');
  
  container.querySelectorAll('.remove-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      currentTags.splice(index, 1);
      renderCurrentTags();
    });
  });
}

async function loadSnippet(id) {
  const snippet = await snippetAPI.getSnippetById(id);
  if (!snippet) return;
  
  currentSnippetId = snippet.id;
  currentTags = [...snippet.tags];
  
  document.getElementById('titleInput').value = snippet.title;
  document.getElementById('languageSelect').value = snippet.language;
  setEditorLanguage(snippet.language);
  editor.setValue(snippet.code);
  renderCurrentTags();
  
  if (searchQuery) {
    highlightSearchMatches(searchQuery);
  }
  
  document.getElementById('editorContainer').style.display = 'flex';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('deleteBtn').style.display = 'inline-block';
  
  renderSnippetList();
}

function createNewSnippet() {
  currentSnippetId = null;
  currentTags = [];
  
  document.getElementById('titleInput').value = '';
  document.getElementById('languageSelect').value = 'javascript';
  setEditorLanguage('javascript');
  editor.setValue('');
  clearSearchHighlights();
  renderCurrentTags();
  
  document.getElementById('editorContainer').style.display = 'flex';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('deleteBtn').style.display = 'none';
  
  document.getElementById('titleInput').focus();
  renderSnippetList();
}

async function saveSnippet() {
  const title = document.getElementById('titleInput').value.trim();
  const language = document.getElementById('languageSelect').value;
  const code = editor.getValue();
  
  if (!title) {
    showStatus('请输入片段标题', 'error');
    return;
  }
  
  try {
    if (currentSnippetId) {
      await snippetAPI.updateSnippet({
        id: currentSnippetId,
        title,
        language,
        code,
        tags: currentTags
      });
      showStatus('已保存', 'success');
    } else {
      const id = await snippetAPI.createSnippet({
        title,
        language,
        code,
        tags: currentTags
      });
      currentSnippetId = id;
      document.getElementById('deleteBtn').style.display = 'inline-block';
      showStatus('已创建', 'success');
    }
    
    await loadSnippets();
    await loadTags();
  } catch (error) {
    showStatus('保存失败: ' + error.message, 'error');
  }
}

async function deleteSnippet() {
  if (!currentSnippetId) return;
  
  if (!confirm('确定要删除这个代码片段吗？')) return;
  
  try {
    await snippetAPI.deleteSnippet(currentSnippetId);
    currentSnippetId = null;
    currentTags = [];
    
    document.getElementById('editorContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = 'flex';
    
    await loadSnippets();
    await loadTags();
    showStatus('已删除', 'success');
  } catch (error) {
    showStatus('删除失败: ' + error.message, 'error');
  }
}

async function copyToClipboard() {
  const code = editor.getValue();
  if (!code) return;
  
  await snippetAPI.copyToClipboard(code);
  showStatus('已复制到剪贴板', 'success');
}

function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-${type}`;
  
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = '';
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前';
  
  return date.toLocaleDateString('zh-CN');
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function initEventListeners() {
  document.getElementById('newSnippetBtn').addEventListener('click', createNewSnippet);
  
  document.getElementById('saveBtn').addEventListener('click', saveSnippet);
  document.getElementById('deleteBtn').addEventListener('click', deleteSnippet);
  document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
  
  document.getElementById('languageSelect').addEventListener('change', (e) => {
    setEditorLanguage(e.target.value);
  });
  
  document.getElementById('cancelBtn').addEventListener('click', () => {
    if (currentSnippetId) {
      loadSnippet(currentSnippetId);
    } else {
      document.getElementById('editorContainer').style.display = 'none';
      document.getElementById('emptyState').style.display = 'flex';
    }
  });
  
  const tagInput = document.getElementById('tagInput');
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = tagInput.value.trim().replace(/^#/, '');
      if (tag && !currentTags.includes(tag)) {
        currentTags.push(tag);
        renderCurrentTags();
      }
      tagInput.value = '';
    }
  });
  
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  
  const searchHandler = debounce(async () => {
    searchQuery = searchInput.value.trim();
    clearSearchBtn.style.display = searchQuery ? 'inline-block' : 'none';
    await loadSnippets();
    
    if (currentSnippetId) {
      if (searchQuery) {
        highlightSearchMatches(searchQuery);
      } else {
        clearSearchHighlights();
      }
    }
  }, 300);
  
  searchInput.addEventListener('input', searchHandler);
  
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    clearSearchHighlights();
    loadSnippets();
  });
  
  document.getElementById('clearTagFilter').addEventListener('click', () => {
    selectedTagFilter = null;
    document.getElementById('clearTagFilter').style.display = 'none';
    loadSnippets();
  });
  
  document.getElementById('runBtn').addEventListener('click', runCode);
  document.getElementById('clearOutputBtn').addEventListener('click', clearOutput);
  document.getElementById('toggleOutputBtn').addEventListener('click', toggleOutputPanel);
}

async function init() {
  initCodeMirror();
  initEventListeners();
  await loadSnippets();
  await loadTags();
}

init();

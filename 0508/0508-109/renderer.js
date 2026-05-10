const { ipcRenderer } = require('electron');

let currentProject = null;
let currentSelection = null;
let draggedBeatId = null;

let currentView = 'editor';

document.addEventListener('DOMContentLoaded', () => {
  loadTree();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btn-create-project').addEventListener('click', showCreateProjectModal);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);

  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchView(tab.dataset.view);
    });
  });
}

function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === viewName);
  });
  document.getElementById('editor-container').classList.toggle('hidden', viewName !== 'editor');
  document.getElementById('timeline-container').classList.toggle('hidden', viewName !== 'timeline');

  if (viewName === 'timeline' && currentProject) {
    loadTimelineView();
  }
}

async function loadTree() {
  const projects = await ipcRenderer.invoke('get-all-projects');
  const container = document.getElementById('tree-container');
  container.innerHTML = '';

  for (const project of projects) {
    const projectNode = await createProjectNode(project);
    container.appendChild(projectNode);
  }
}

async function createProjectNode(project) {
  const characters = await ipcRenderer.invoke('get-character-cards', project.id);
  const locations = await ipcRenderer.invoke('get-location-cards', project.id);
  const beats = await ipcRenderer.invoke('get-plot-beats', project.id);

  const div = document.createElement('div');
  div.className = 'project-node';

  const projectHeader = document.createElement('div');
  projectHeader.className = 'tree-item project-header';
  projectHeader.dataset.type = 'project';
  projectHeader.dataset.id = project.id;
  projectHeader.innerHTML = `
    <span class="collapse-icon">▼</span>
    <span class="tree-icon">📚</span>
    <span class="tree-label">${escapeHtml(project.title)}</span>
    <div class="tree-actions">
      <button class="btn-icon" data-action="edit-project" title="编辑项目">✏️</button>
      <button class="btn-icon" data-action="delete-project" title="删除项目">🗑️</button>
    </div>
  `;
  div.appendChild(projectHeader);

  const children = document.createElement('div');
  children.className = 'tree-children';

  const charGroup = createCardGroup('人物卡', 'character', project.id, characters.map(c => ({ id: c.id, name: c.name })));
  const locGroup = createCardGroup('地点卡', 'location', project.id, locations.map(l => ({ id: l.id, name: l.name })));
  const beatGroup = createCardGroup('情节节拍', 'beat', project.id, beats.map(b => ({ id: b.id, name: b.title })));

  children.appendChild(charGroup);
  children.appendChild(locGroup);
  children.appendChild(beatGroup);

  div.appendChild(children);

  projectHeader.addEventListener('click', (e) => {
    if (e.target.closest('.tree-actions')) return;
    children.classList.toggle('collapsed');
    projectHeader.querySelector('.collapse-icon').textContent = children.classList.contains('collapsed') ? '▶' : '▼';
    selectProject(project.id);
  });

  projectHeader.querySelector('[data-action="edit-project"]').addEventListener('click', () => showEditProjectModal(project));
  projectHeader.querySelector('[data-action="delete-project"]').addEventListener('click', () => deleteProject(project.id));

  return div;
}

function createCardGroup(groupName, type, projectId, items) {
  const div = document.createElement('div');
  div.className = 'card-group';

  const header = document.createElement('div');
  header.className = 'tree-item group-header';
  header.innerHTML = `
    <span class="collapse-icon">▼</span>
    <span class="tree-icon">${type === 'character' ? '👤' : type === 'location' ? '📍' : '📖'}</span>
    <span class="tree-label">${groupName}</span>
    <div class="tree-actions">
      <button class="btn-icon" data-action="add" title="添加">+</button>
    </div>
  `;
  div.appendChild(header);

  const children = document.createElement('div');
  children.className = 'tree-children';

  for (const item of items) {
    const itemDiv = createCardItem(type, item);
    children.appendChild(itemDiv);
  }
  div.appendChild(children);

  header.addEventListener('click', (e) => {
    if (e.target.closest('.tree-actions')) return;
    children.classList.toggle('collapsed');
    header.querySelector('.collapse-icon').textContent = children.classList.contains('collapsed') ? '▶' : '▼';
  });

  header.querySelector('[data-action="add"]').addEventListener('click', () => {
    if (type === 'character') showCreateCharacterModal(projectId);
    else if (type === 'location') showCreateLocationModal(projectId);
    else if (type === 'beat') showCreateBeatModal(projectId);
  });

  return div;
}

function createCardItem(type, item) {
  const div = document.createElement('div');
  div.className = `tree-item card-item ${type}-item`;
  div.dataset.type = type;
  div.dataset.id = item.id;
  if (type === 'beat') div.draggable = true;
  div.innerHTML = `
    <span class="tree-icon">${type === 'character' ? '👤' : type === 'location' ? '📍' : '📖'}</span>
    <span class="tree-label">${escapeHtml(item.name)}</span>
    <div class="tree-actions">
      <button class="btn-icon" data-action="delete" title="删除">🗑️</button>
    </div>
  `;

  div.addEventListener('click', (e) => {
    if (e.target.closest('.tree-actions')) return;
    loadCard(type, item.id);
  });

  div.querySelector('[data-action="delete"]').addEventListener('click', () => deleteCard(type, item.id));

  if (type === 'beat') {
    div.addEventListener('dragstart', (e) => {
      draggedBeatId = item.id;
      div.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    div.addEventListener('dragend', () => {
      div.classList.remove('dragging');
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
    div.addEventListener('dragover', (e) => {
      e.preventDefault();
      div.classList.add('drag-over');
    });
    div.addEventListener('dragleave', () => {
      div.classList.remove('drag-over');
    });
    div.addEventListener('drop', async (e) => {
      e.preventDefault();
      div.classList.remove('drag-over');
      if (!draggedBeatId || draggedBeatId === item.id) return;
      await reorderBeats(currentProject.id, draggedBeatId, item.id);
      draggedBeatId = null;
    });
  }

  return div;
}

async function selectProject(projectId) {
  const projects = await ipcRenderer.invoke('get-all-projects');
  currentProject = projects.find(p => p.id === projectId);
  
  document.getElementById('view-tabs').classList.remove('hidden');
  
  if (currentView === 'editor') {
    loadProjectEditor();
  } else {
    loadTimelineView();
  }
}

function loadProjectEditor() {
  if (!currentProject) return;
  const editor = document.getElementById('editor-container');
  editor.innerHTML = `
    <div class="editor-section">
      <h2 class="editor-title">${escapeHtml(currentProject.title)}</h2>
      <div class="field-group">
        <label>书名</label>
        <input type="text" id="edit-title" value="${escapeAttr(currentProject.title)}" />
      </div>
      <div class="field-group">
        <label>作者</label>
        <input type="text" id="edit-author" value="${escapeAttr(currentProject.author || '')}" />
      </div>
      <div class="field-group">
        <label>一句话简介</label>
        <textarea id="edit-summary" rows="3">${escapeHtml(currentProject.summary || '')}</textarea>
      </div>
      <button class="btn-primary" id="btn-save-project">保存项目</button>
    </div>
  `;
  document.getElementById('btn-save-project').addEventListener('click', async () => {
    await ipcRenderer.invoke('update-project', {
      id: currentProject.id,
      title: document.getElementById('edit-title').value,
      author: document.getElementById('edit-author').value,
      summary: document.getElementById('edit-summary').value,
    });
    await loadTree();
  });
}

async function loadCard(type, id) {
  currentSelection = { type, id };
  let data;
  if (type === 'character') {
    const list = await ipcRenderer.invoke('get-character-cards', currentProject?.id);
    data = list.find(c => c.id === id);
    loadCharacterEditor(data);
  } else if (type === 'location') {
    const list = await ipcRenderer.invoke('get-location-cards', currentProject?.id);
    data = list.find(l => l.id === id);
    loadLocationEditor(data);
  } else if (type === 'beat') {
    const list = await ipcRenderer.invoke('get-plot-beats', currentProject?.id);
    data = list.find(b => b.id === id);
    loadBeatEditor(data);
  }
}

function loadCharacterEditor(data) {
  const editor = document.getElementById('editor-container');
  editor.innerHTML = `
    <div class="editor-section">
      <h2 class="editor-title">人物卡</h2>
      <div class="field-group">
        <label>姓名</label>
        <input type="text" id="char-name" value="${escapeAttr(data.name)}" />
      </div>
      <div class="field-group">
        <label>年龄</label>
        <input type="text" id="char-age" value="${escapeAttr(data.age || '')}" />
      </div>
      <div class="field-group">
        <label>外貌</label>
        <div class="editor-toolbar">
          <button class="format-btn" data-format="bold"><strong>B</strong></button>
          <button class="format-btn" data-format="italic"><em>I</em></button>
        </div>
        <div class="rich-editor" id="char-appearance" contenteditable="true">${data.appearance || ''}</div>
      </div>
      <div class="field-group">
        <label>性格</label>
        <div class="editor-toolbar">
          <button class="format-btn" data-format="bold"><strong>B</strong></button>
          <button class="format-btn" data-format="italic"><em>I</em></button>
        </div>
        <div class="rich-editor" id="char-personality" contenteditable="true">${data.personality || ''}</div>
      </div>
      <button class="btn-primary" id="btn-save-char">保存</button>
    </div>
  `;
  setupFormatButtons();
  document.getElementById('btn-save-char').addEventListener('click', async () => {
    await ipcRenderer.invoke('update-character-card', {
      id: data.id,
      name: document.getElementById('char-name').value,
      age: document.getElementById('char-age').value,
      appearance: document.getElementById('char-appearance').innerHTML,
      personality: document.getElementById('char-personality').innerHTML,
    });
    await loadTree();
  });
}

function loadLocationEditor(data) {
  const editor = document.getElementById('editor-container');
  editor.innerHTML = `
    <div class="editor-section">
      <h2 class="editor-title">地点卡</h2>
      <div class="field-group">
        <label>名称</label>
        <input type="text" id="loc-name" value="${escapeAttr(data.name)}" />
      </div>
      <div class="field-group">
        <label>描述</label>
        <div class="editor-toolbar">
          <button class="format-btn" data-format="bold"><strong>B</strong></button>
          <button class="format-btn" data-format="italic"><em>I</em></button>
        </div>
        <div class="rich-editor" id="loc-desc" contenteditable="true">${data.description || ''}</div>
      </div>
      <button class="btn-primary" id="btn-save-loc">保存</button>
    </div>
  `;
  setupFormatButtons();
  document.getElementById('btn-save-loc').addEventListener('click', async () => {
    await ipcRenderer.invoke('update-location-card', {
      id: data.id,
      name: document.getElementById('loc-name').value,
      description: document.getElementById('loc-desc').innerHTML,
    });
    await loadTree();
  });
}

function loadBeatEditor(data) {
  const editor = document.getElementById('editor-container');
  editor.innerHTML = `
    <div class="editor-section">
      <h2 class="editor-title">情节节拍</h2>
      <div class="field-group">
        <label>标题</label>
        <input type="text" id="beat-title" value="${escapeAttr(data.title)}" />
      </div>
      <div class="field-group">
        <label>内容</label>
        <div class="editor-toolbar">
          <button class="format-btn" data-format="bold"><strong>B</strong></button>
          <button class="format-btn" data-format="italic"><em>I</em></button>
        </div>
        <div class="rich-editor" id="beat-content" contenteditable="true">${data.content || ''}</div>
      </div>
      <button class="btn-primary" id="btn-save-beat">保存</button>
    </div>
  `;
  setupFormatButtons();
  document.getElementById('btn-save-beat').addEventListener('click', async () => {
    await ipcRenderer.invoke('update-plot-beat', {
      id: data.id,
      title: document.getElementById('beat-title').value,
      content: document.getElementById('beat-content').innerHTML,
    });
    await loadTree();
  });
}

function setupFormatButtons() {
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      document.execCommand(format === 'bold' ? 'bold' : 'italic', false, null);
    });
  });
}

async function showCreateProjectModal() {
  showModal('新建项目', `
    <div class="field-group">
      <label>书名 *</label>
      <input type="text" id="new-title" />
    </div>
    <div class="field-group">
      <label>作者</label>
      <input type="text" id="new-author" />
    </div>
    <div class="field-group">
      <label>一句话简介</label>
      <textarea id="new-summary" rows="3"></textarea>
    </div>
  `, async () => {
    const title = document.getElementById('new-title').value.trim();
    if (!title) { alert('请输入书名'); return false; }
    await ipcRenderer.invoke('create-project', {
      title,
      author: document.getElementById('new-author').value,
      summary: document.getElementById('new-summary').value,
    });
    return true;
  });
}

function showEditProjectModal(project) {
  showModal('编辑项目', `
    <div class="field-group">
      <label>书名 *</label>
      <input type="text" id="edit-title-modal" value="${escapeAttr(project.title)}" />
    </div>
    <div class="field-group">
      <label>作者</label>
      <input type="text" id="edit-author-modal" value="${escapeAttr(project.author || '')}" />
    </div>
    <div class="field-group">
      <label>一句话简介</label>
      <textarea id="edit-summary-modal" rows="3">${escapeHtml(project.summary || '')}</textarea>
    </div>
  `, async () => {
    const title = document.getElementById('edit-title-modal').value.trim();
    if (!title) { alert('请输入书名'); return false; }
    await ipcRenderer.invoke('update-project', {
      id: project.id,
      title,
      author: document.getElementById('edit-author-modal').value,
      summary: document.getElementById('edit-summary-modal').value,
    });
    return true;
  });
}

function showCreateCharacterModal(projectId) {
  showModal('新建人物卡', `
    <div class="field-group">
      <label>姓名 *</label>
      <input type="text" id="new-char-name" />
    </div>
    <div class="field-group">
      <label>年龄</label>
      <input type="text" id="new-char-age" />
    </div>
    <div class="field-group">
      <label>外貌</label>
      <div class="editor-toolbar">
        <button class="format-btn" data-format="bold"><strong>B</strong></button>
        <button class="format-btn" data-format="italic"><em>I</em></button>
      </div>
      <div class="rich-editor" id="new-char-appearance" contenteditable="true"></div>
    </div>
    <div class="field-group">
      <label>性格</label>
      <div class="editor-toolbar">
        <button class="format-btn" data-format="bold"><strong>B</strong></button>
        <button class="format-btn" data-format="italic"><em>I</em></button>
      </div>
      <div class="rich-editor" id="new-char-personality" contenteditable="true"></div>
    </div>
  `, async () => {
    const name = document.getElementById('new-char-name').value.trim();
    if (!name) { alert('请输入姓名'); return false; }
    await ipcRenderer.invoke('create-character-card', {
      projectId,
      name,
      age: document.getElementById('new-char-age').value,
      appearance: document.getElementById('new-char-appearance').innerHTML,
      personality: document.getElementById('new-char-personality').innerHTML,
    });
    return true;
  });
}

function showCreateLocationModal(projectId) {
  showModal('新建地点卡', `
    <div class="field-group">
      <label>名称 *</label>
      <input type="text" id="new-loc-name" />
    </div>
    <div class="field-group">
      <label>描述</label>
      <div class="editor-toolbar">
        <button class="format-btn" data-format="bold"><strong>B</strong></button>
        <button class="format-btn" data-format="italic"><em>I</em></button>
      </div>
      <div class="rich-editor" id="new-loc-desc" contenteditable="true"></div>
    </div>
  `, async () => {
    const name = document.getElementById('new-loc-name').value.trim();
    if (!name) { alert('请输入名称'); return false; }
    await ipcRenderer.invoke('create-location-card', {
      projectId,
      name,
      description: document.getElementById('new-loc-desc').innerHTML,
    });
    return true;
  });
}

function showCreateBeatModal(projectId) {
  showModal('新建情节节拍', `
    <div class="field-group">
      <label>标题 *</label>
      <input type="text" id="new-beat-title" />
    </div>
    <div class="field-group">
      <label>内容</label>
      <div class="editor-toolbar">
        <button class="format-btn" data-format="bold"><strong>B</strong></button>
        <button class="format-btn" data-format="italic"><em>I</em></button>
      </div>
      <div class="rich-editor" id="new-beat-content" contenteditable="true"></div>
    </div>
  `, async () => {
    const title = document.getElementById('new-beat-title').value.trim();
    if (!title) { alert('请输入标题'); return false; }
    const beats = await ipcRenderer.invoke('get-plot-beats', projectId);
    await ipcRenderer.invoke('create-plot-beat', {
      projectId,
      title,
      content: document.getElementById('new-beat-content').innerHTML,
      sortOrder: beats.length,
    });
    return true;
  });
}

async function deleteProject(id) {
  if (!confirm('确定要删除这个项目吗？所有相关卡片都会被删除。')) return;
  await ipcRenderer.invoke('delete-project', id);
  if (currentProject?.id === id) {
    currentProject = null;
    document.getElementById('editor-container').innerHTML = `
      <div class="welcome-message">
        <h1>欢迎使用小说大纲管理器</h1>
        <p>请在左侧创建或选择一个项目开始创作</p>
      </div>
    `;
  }
  await loadTree();
}

async function deleteCard(type, id) {
  if (!confirm('确定要删除吗？')) return;
  if (type === 'character') await ipcRenderer.invoke('delete-character-card', id);
  else if (type === 'location') await ipcRenderer.invoke('delete-location-card', id);
  else if (type === 'beat') await ipcRenderer.invoke('delete-plot-beat', id);
  await loadTree();
}

async function reorderBeats(projectId, draggedId, targetId) {
  const beats = await ipcRenderer.invoke('get-plot-beats', projectId);
  const draggedIndex = beats.findIndex(b => b.id === draggedId);
  const targetIndex = beats.findIndex(b => b.id === targetId);
  if (draggedIndex === -1 || targetIndex === -1) return;

  const [removed] = beats.splice(draggedIndex, 1);
  beats.splice(targetIndex, 0, removed);

  const updates = beats.map((beat, index) => ({ id: beat.id, sortOrder: index }));
  await ipcRenderer.invoke('reorder-plot-beats', { projectId, beats: updates });
  await loadTree();
}

function showModal(title, bodyContent, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyContent;
  document.getElementById('modal-backdrop').classList.remove('hidden');

  const confirmBtn = document.getElementById('modal-confirm');
  const newHandler = async () => {
    const success = await onConfirm();
    if (success !== false) {
      closeModal();
      await loadTree();
    }
    confirmBtn.removeEventListener('click', newHandler);
  };
  confirmBtn.addEventListener('click', newHandler);

  setupFormatButtons();
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
  document.getElementById('modal-body').innerHTML = '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(value) {
  return value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function loadTimelineView() {
  if (!currentProject) return;

  const beats = await ipcRenderer.invoke('get-plot-beats', currentProject.id);
  const container = document.getElementById('timeline-container');

  if (beats.length === 0) {
    container.innerHTML = `
      <div class="timeline-empty">
        <h2>${escapeHtml(currentProject.title)}</h2>
        <p>暂无情节节拍，请在左侧树形结构中添加</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="timeline-header">
      <h2>${escapeHtml(currentProject.title)} - 时间线</h2>
      <p class="timeline-hint">点击节拍节点可跳转到编辑区</p>
    </div>
    <div class="timeline-wrapper">
      <canvas id="timeline-canvas"></canvas>
      <div id="timeline-nodes" class="timeline-nodes"></div>
    </div>
  `;

  renderTimeline(beats);
}

function renderTimeline(beats) {
  const canvas = document.getElementById('timeline-canvas');
  const nodesContainer = document.getElementById('timeline-nodes');
  const wrapper = canvas.parentElement;

  const beatCount = beats.length;
  const padding = 80;
  const nodeWidth = 180;
  const nodeHeight = 120;
  const nodeSpacing = 60;
  const totalWidth = padding * 2 + beatCount * (nodeWidth + nodeSpacing);
  const canvasHeight = 400;

  wrapper.style.minWidth = `${Math.max(totalWidth, 800)}px`;
  canvas.width = Math.max(totalWidth, 800);
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(padding, canvasHeight / 2);
  ctx.lineTo(canvas.width - padding, canvasHeight / 2);
  ctx.stroke();

  ctx.strokeStyle = '#95a5a6';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  const colors = [
    { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
    { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
    { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
    { bg: '#fce4ec', border: '#e91e63', text: '#ad1457' },
    { bg: '#f3e5f5', border: '#9c27b0', text: '#6a1b9a' },
    { bg: '#e0f7fa', border: '#00bcd4', text: '#00838f' },
    { bg: '#fff8e1', border: '#ffc107', text: '#ff8f00' },
    { bg: '#efebe9', border: '#795548', text: '#4e342e' },
  ];

  nodesContainer.innerHTML = '';

  beats.forEach((beat, index) => {
    const colorIndex = index % colors.length;
    const color = colors[colorIndex];
    const x = padding + index * (nodeWidth + nodeSpacing) + nodeWidth / 2;
    const y = canvasHeight / 2;

    const isAbove = index % 2 === 0;
    const nodeY = isAbove ? y - nodeHeight - 40 : y + 40;
    const lineEndY = isAbove ? y - 40 : y + 40;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, lineEndY);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = color.border;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([5, 5]);

    ctx.fillStyle = '#7f8c8d';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`第 ${index + 1} 节`, x, y + 35);

    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'timeline-node';
    nodeDiv.style.left = `${x - nodeWidth / 2}px`;
    nodeDiv.style.top = `${nodeY}px`;
    nodeDiv.style.width = `${nodeWidth}px`;
    nodeDiv.style.height = `${nodeHeight}px`;
    nodeDiv.style.backgroundColor = color.bg;
    nodeDiv.style.borderColor = color.border;
    nodeDiv.dataset.beatId = beat.id;

    const plainTitle = beat.title;
    const plainContent = stripHtml(beat.content || '');
    const truncatedContent = plainContent.length > 80 ? plainContent.substring(0, 80) + '...' : plainContent;

    nodeDiv.innerHTML = `
      <div class="timeline-node-title" style="color: ${color.text}">${escapeHtml(plainTitle)}</div>
      <div class="timeline-node-content">${escapeHtml(truncatedContent) || '（无内容）'}</div>
      <div class="timeline-node-action">点击编辑 →</div>
    `;

    nodeDiv.addEventListener('click', () => {
      loadCard('beat', beat.id);
      switchView('editor');
      document.querySelectorAll('.view-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === 'editor');
      });
    });

    nodesContainer.appendChild(nodeDiv);
  });
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

const { ipcRenderer } = require('electron');

// 全局状态
let currentView = 'timer';
let timerRunning = false;
let timerStartTime = null;
let timerInterval = null;
let selectedProjectId = null;
let currentDate = new Date();
let selectedDate = formatDate(new Date());
let currentReportData = null;

// 番茄钟状态
let currentTimerMode = 'normal';
let pomodoroRunning = false;
let pomodoroPaused = false;
let pomodoroInterval = null;
let pomodoroRemaining = 0;
let pomodoroWorkDuration = 25 * 60;
let pomodoroBreakDuration = 5 * 60;
let pomodoroPhase = 'work';
let pomodoroStartTime = null;
let pomodoroPausedTime = 0;
let pomodoroProjectId = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTimer();
    initPomodoro();
    initProjects();
    initCalendar();
    initReports();
    initModals();
    loadProjects();
    loadTodayRecords();
    loadPomodoroTodayCount();
    renderCalendar();
});

// 导航初始化
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${view}"]`).classList.add('active');
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    
    currentView = view;
    
    if (view === 'projects') {
        loadProjects();
    } else if (view === 'calendar') {
        renderCalendar();
    } else if (view === 'reports') {
        loadReportData();
    }
}

// 计时器
function initTimer() {
    document.getElementById('start-btn').addEventListener('click', startTimer);
    document.getElementById('stop-btn').addEventListener('click', stopTimer);
    document.getElementById('reset-btn').addEventListener('click', resetTimer);
    
    document.getElementById('project-select').addEventListener('change', (e) => {
        selectedProjectId = e.target.value ? parseInt(e.target.value) : null;
    });
}

function startTimer() {
    if (!selectedProjectId) {
        alert('请先选择一个项目');
        return;
    }
    
    timerRunning = true;
    timerStartTime = new Date();
    
    document.getElementById('start-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;
    document.getElementById('project-select').disabled = true;
    document.getElementById('timer-status').textContent = '计时中...';
    
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
    if (!timerRunning) return;
    
    const endTime = new Date();
    const diffMs = endTime - timerStartTime;
    const diffMinutes = Math.round(diffMs / 60000);
    
    if (diffMinutes < 1) {
        alert('工作时长至少需要1分钟');
        return;
    }
    
    saveWorkRecord(timerStartTime, endTime, diffMinutes);
    
    clearInterval(timerInterval);
    resetTimer();
    loadTodayRecords();
}

function resetTimer() {
    timerRunning = false;
    timerStartTime = null;
    clearInterval(timerInterval);
    
    document.getElementById('time-display').textContent = '00:00:00';
    document.getElementById('timer-status').textContent = '准备开始';
    document.getElementById('start-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    document.getElementById('project-select').disabled = false;
    document.getElementById('notes-input').value = '';
}

// 番茄钟模式
function initPomodoro() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTimerMode(btn.dataset.mode));
    });
    
    document.getElementById('pomodoro-start-btn').addEventListener('click', startPomodoro);
    document.getElementById('pomodoro-pause-btn').addEventListener('click', pausePomodoro);
    document.getElementById('pomodoro-reset-btn').addEventListener('click', resetPomodoro);
    
    document.getElementById('pomodoro-project-select').addEventListener('change', (e) => {
        pomodoroProjectId = e.target.value ? parseInt(e.target.value) : null;
    });
    
    document.getElementById('pomodoro-work-time').addEventListener('change', (e) => {
        pomodoroWorkDuration = parseInt(e.target.value) * 60;
        if (!pomodoroRunning) {
            pomodoroPhase = 'work';
            updatePomodoroDisplay();
        }
    });
    
    document.getElementById('pomodoro-break-time').addEventListener('change', (e) => {
        pomodoroBreakDuration = parseInt(e.target.value) * 60;
    });
}

function switchTimerMode(mode) {
    if (timerRunning || pomodoroRunning) {
        alert('请先停止当前计时');
        return;
    }
    
    currentTimerMode = mode;
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    document.getElementById('normal-controls').style.display = mode === 'normal' ? 'block' : 'none';
    document.getElementById('pomodoro-controls').style.display = mode === 'pomodoro' ? 'block' : 'none';
    
    const timerDisplay = document.querySelector('.timer-display');
    timerDisplay.classList.remove('pomodoro', 'pomodoro-break');
    
    if (mode === 'normal') {
        document.getElementById('time-display').textContent = '00:00:00';
        document.getElementById('timer-status').textContent = '准备开始';
    } else {
        pomodoroPhase = 'work';
        pomodoroRemaining = pomodoroWorkDuration;
        timerDisplay.classList.add('pomodoro');
        updatePomodoroDisplay();
    }
}

function startPomodoro() {
    if (!pomodoroProjectId) {
        alert('请先选择一个项目');
        return;
    }
    
    if (pomodoroPaused) {
        pomodoroPaused = false;
        document.getElementById('pomodoro-pause-btn').textContent = '⏸️ 暂停';
        document.getElementById('timer-status').textContent = pomodoroPhase === 'work' ? '🍅 专注中...' : '☕ 休息中...';
        
        pomodoroInterval = setInterval(tickPomodoro, 1000);
        return;
    }
    
    pomodoroRunning = true;
    pomodoroPaused = false;
    pomodoroStartTime = new Date();
    pomodoroRemaining = pomodoroWorkDuration;
    pomodoroPhase = 'work';
    
    const timerDisplay = document.querySelector('.timer-display');
    timerDisplay.classList.remove('pomodoro-break');
    timerDisplay.classList.add('pomodoro');
    
    document.getElementById('pomodoro-start-btn').disabled = true;
    document.getElementById('pomodoro-pause-btn').disabled = false;
    document.getElementById('pomodoro-project-select').disabled = true;
    document.getElementById('pomodoro-work-time').disabled = true;
    document.getElementById('pomodoro-break-time').disabled = true;
    document.getElementById('timer-status').textContent = '🍅 专注中...';
    
    updatePomodoroDisplay();
    pomodoroInterval = setInterval(tickPomodoro, 1000);
}

function pausePomodoro() {
    if (pomodoroPaused) {
        pomodoroPaused = false;
        document.getElementById('pomodoro-pause-btn').textContent = '⏸️ 暂停';
        document.getElementById('timer-status').textContent = pomodoroPhase === 'work' ? '🍅 专注中...' : '☕ 休息中...';
        pomodoroInterval = setInterval(tickPomodoro, 1000);
    } else {
        pomodoroPaused = true;
        document.getElementById('pomodoro-pause-btn').textContent = '▶️ 继续';
        document.getElementById('timer-status').textContent = '⏸️ 已暂停';
        clearInterval(pomodoroInterval);
    }
}

function resetPomodoro() {
    clearInterval(pomodoroInterval);
    
    pomodoroRunning = false;
    pomodoroPaused = false;
    pomodoroRemaining = pomodoroWorkDuration;
    pomodoroPhase = 'work';
    pomodoroStartTime = null;
    
    const timerDisplay = document.querySelector('.timer-display');
    timerDisplay.classList.remove('pomodoro-break');
    timerDisplay.classList.add('pomodoro');
    
    document.getElementById('pomodoro-start-btn').disabled = false;
    document.getElementById('pomodoro-pause-btn').disabled = true;
    document.getElementById('pomodoro-pause-btn').textContent = '⏸️ 暂停';
    document.getElementById('pomodoro-project-select').disabled = false;
    document.getElementById('pomodoro-work-time').disabled = false;
    document.getElementById('pomodoro-break-time').disabled = false;
    document.getElementById('timer-status').textContent = '准备开始';
    document.getElementById('pomodoro-notes-input').value = '';
    
    updatePomodoroDisplay();
}

function tickPomodoro() {
    pomodoroRemaining--;
    updatePomodoroDisplay();
    
    if (pomodoroRemaining <= 0) {
        clearInterval(pomodoroInterval);
        
        if (pomodoroPhase === 'work') {
            completePomodoroWork();
        } else {
            completePomodoroBreak();
        }
    }
}

function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroRemaining / 60);
    const seconds = pomodoroRemaining % 60;
    document.getElementById('time-display').textContent = `${padZero(minutes)}:${padZero(seconds)}:00`;
}

function completePomodoroWork() {
    playNotification('工作时间结束！该休息了 ☕');
    
    const now = new Date();
    const notes = document.getElementById('pomodoro-notes-input').value || '🍅 番茄钟';
    const workMinutes = Math.ceil(pomodoroWorkDuration / 60);
    
    saveWorkRecord(pomodoroStartTime, now, workMinutes, notes);
    loadPomodoroTodayCount();
    
    pomodoroPhase = 'break';
    pomodoroRemaining = pomodoroBreakDuration;
    
    const timerDisplay = document.querySelector('.timer-display');
    timerDisplay.classList.remove('pomodoro');
    timerDisplay.classList.add('pomodoro-break');
    
    document.getElementById('timer-status').textContent = '☕ 休息时间';
    
    pomodoroInterval = setInterval(tickPomodoro, 1000);
}

function completePomodoroBreak() {
    playNotification('休息结束！准备开始下一个番茄钟 🍅');
    
    pomodoroRunning = false;
    pomodoroPaused = false;
    pomodoroPhase = 'work';
    pomodoroRemaining = pomodoroWorkDuration;
    pomodoroStartTime = null;
    
    const timerDisplay = document.querySelector('.timer-display');
    timerDisplay.classList.remove('pomodoro-break');
    timerDisplay.classList.add('pomodoro');
    
    document.getElementById('pomodoro-start-btn').disabled = false;
    document.getElementById('pomodoro-pause-btn').disabled = true;
    document.getElementById('pomodoro-pause-btn').textContent = '⏸️ 暂停';
    document.getElementById('pomodoro-project-select').disabled = false;
    document.getElementById('pomodoro-work-time').disabled = false;
    document.getElementById('pomodoro-break-time').disabled = false;
    document.getElementById('timer-status').textContent = '休息结束，准备开始';
    document.getElementById('pomodoro-notes-input').value = '';
    
    updatePomodoroDisplay();
    loadTodayRecords();
}

function playNotification(message) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification('🍅 番茄钟', { body: message });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('🍅 番茄钟', { body: message });
                }
            });
        }
    }
    
    alert(message);
}

async function loadPomodoroTodayCount() {
    const today = formatDate(new Date());
    const records = await ipcRenderer.invoke('get-work-records-by-date', today);
    
    const pomodoroCount = records.filter(r => 
        r.notes && r.notes.includes('🍅')
    ).length;
    
    document.getElementById('pomodoro-today-count').textContent = pomodoroCount;
}

function saveWorkRecord(startTime, endTime, minutes, customNotes = null) {
    const notes = customNotes !== null ? customNotes : document.getElementById('notes-input').value;
    const projectId = currentTimerMode === 'pomodoro' ? pomodoroProjectId : selectedProjectId;
    
    if (!projectId) {
        alert('请选择项目');
        return;
    }
    
    return ipcRenderer.invoke('add-work-record', {
        projectId: projectId,
        date: formatDate(startTime),
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        durationMinutes: minutes,
        notes: notes
    });
}

function updateTimerDisplay() {
    if (!timerStartTime) return;
    
    const now = new Date();
    const diff = now - timerStartTime;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    document.getElementById('time-display').textContent = 
        `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}

// 项目管理
function initProjects() {
    document.getElementById('add-project-btn').addEventListener('click', () => openProjectModal());
    document.getElementById('save-project').addEventListener('click', saveProject);
    document.getElementById('close-modal').addEventListener('click', closeProjectModal);
    document.getElementById('cancel-project').addEventListener('click', closeProjectModal);
}

async function loadProjects() {
    const projects = await ipcRenderer.invoke('get-projects');
    
    const projectSelect = document.getElementById('project-select');
    projectSelect.innerHTML = '<option value="">-- 选择项目 --</option>';
    projects.forEach(p => {
        projectSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
    
    const pomodoroProjectSelect = document.getElementById('pomodoro-project-select');
    pomodoroProjectSelect.innerHTML = '<option value="">-- 选择项目 --</option>';
    projects.forEach(p => {
        pomodoroProjectSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
    
    const recordProject = document.getElementById('record-project');
    recordProject.innerHTML = '';
    projects.forEach(p => {
        recordProject.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
    
    const projectsGrid = document.getElementById('projects-grid');
    if (projects.length === 0) {
        projectsGrid.innerHTML = '<p class="empty-state">暂无项目，点击上方按钮创建</p>';
    } else {
        projectsGrid.innerHTML = projects.map(p => createProjectCard(p)).join('');
        
        projectsGrid.querySelectorAll('.project-card').forEach(card => {
            card.querySelector('.edit-project').addEventListener('click', () => 
                openProjectModal(parseInt(card.dataset.id)));
            card.querySelector('.delete-project').addEventListener('click', () => 
                deleteProject(parseInt(card.dataset.id)));
        });
    }
    
    if (selectedProjectId) {
        projectSelect.value = selectedProjectId;
        pomodoroProjectSelect.value = selectedProjectId;
    }
}

function createProjectCard(project) {
    return `
        <div class="project-card" data-id="${project.id}">
            <div class="project-card-header">
                <h3 class="project-name">${escapeHtml(project.name)}</h3>
                <div class="project-actions">
                    <button class="icon-btn edit-project" title="编辑">✏️</button>
                    <button class="icon-btn delete-project" title="删除">🗑️</button>
                </div>
            </div>
            <div class="project-info">
                <div class="project-info-item">
                    <span>预算</span>
                    <strong>¥${project.budget.toFixed(2)}</strong>
                </div>
                <div class="project-info-item">
                    <span>每小时费率</span>
                    <strong>¥${project.hourly_rate.toFixed(2)}/小时</strong>
                </div>
            </div>
        </div>
    `;
}

function openProjectModal(id = null) {
    const modal = document.getElementById('project-modal');
    const title = document.getElementById('modal-title');
    
    if (id) {
        title.textContent = '编辑项目';
        loadProjectForEdit(id);
    } else {
        title.textContent = '新建项目';
        document.getElementById('project-form').reset();
        document.getElementById('project-id').value = '';
    }
    
    modal.classList.add('active');
}

async function loadProjectForEdit(id) {
    const project = await ipcRenderer.invoke('get-project-by-id', id);
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-name').value = project.name;
    document.getElementById('project-budget').value = project.budget;
    document.getElementById('project-rate').value = project.hourly_rate;
}

function closeProjectModal() {
    document.getElementById('project-modal').classList.remove('active');
}

async function saveProject() {
    const id = document.getElementById('project-id').value;
    const name = document.getElementById('project-name').value.trim();
    const budget = parseFloat(document.getElementById('project-budget').value) || 0;
    const hourlyRate = parseFloat(document.getElementById('project-rate').value);
    
    if (!name) {
        alert('请输入项目名称');
        return;
    }
    
    if (isNaN(hourlyRate) || hourlyRate <= 0) {
        alert('请输入有效的小时费率');
        return;
    }
    
    if (id) {
        await ipcRenderer.invoke('update-project', { id: parseInt(id), name, budget, hourlyRate });
    } else {
        await ipcRenderer.invoke('add-project', { name, budget, hourlyRate });
    }
    
    closeProjectModal();
    loadProjects();
}

async function deleteProject(id) {
    if (confirm('确定要删除此项目吗？相关的所有工作记录也会被删除。')) {
        await ipcRenderer.invoke('delete-project', id);
        loadProjects();
        loadTodayRecords();
    }
}

// 今日记录
async function loadTodayRecords() {
    const today = formatDate(new Date());
    const records = await ipcRenderer.invoke('get-work-records-by-date', today);
    
    const container = document.getElementById('today-records');
    
    if (records.length === 0) {
        container.innerHTML = '<p class="empty-state">暂无记录</p>';
    } else {
        container.innerHTML = records.map(r => createRecordItem(r)).join('');
        setupRecordActions(container);
    }
}

function createRecordItem(record) {
    const hours = Math.floor(record.duration_minutes / 60);
    const mins = record.duration_minutes % 60;
    const durationText = hours > 0 ? `${hours}小时${mins}分` : `${mins}分`;
    
    return `
        <div class="record-item" data-id="${record.id}">
            <div class="record-info">
                <div class="record-project">${escapeHtml(record.project_name)}</div>
                <div class="record-time">
                    ${record.start_time ? record.start_time : ''} 
                    ${record.start_time && record.end_time ? '-' : ''}
                    ${record.end_time ? record.end_time : ''}
                    ${record.notes ? ' | ' + escapeHtml(record.notes) : ''}
                </div>
            </div>
            <span class="record-duration">${durationText}</span>
            <div class="record-actions">
                <button class="icon-btn edit-record" title="编辑">✏️</button>
                <button class="icon-btn delete-record" title="删除">🗑️</button>
            </div>
        </div>
    `;
}

function setupRecordActions(container) {
    container.querySelectorAll('.edit-record').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.closest('.record-item').dataset.id);
            openRecordModal(id);
        });
    });
    
    container.querySelectorAll('.delete-record').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.closest('.record-item').dataset.id);
            deleteRecord(id);
        });
    });
}

function calculateDurationFromTimes(startTime, endTime) {
    if (!startTime || !endTime) return null;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    
    let duration = endMinutes - startMinutes;
    
    if (duration < 0) {
        duration += 24 * 60;
    }
    
    return duration;
}

// 工作记录弹窗
function initModals() {
    document.getElementById('save-record').addEventListener('click', saveRecord);
    document.getElementById('close-record-modal').addEventListener('click', closeRecordModal);
    document.getElementById('cancel-record').addEventListener('click', closeRecordModal);
    
    const startInput = document.getElementById('record-start');
    const endInput = document.getElementById('record-end');
    const durationInput = document.getElementById('record-duration');
    
    const updateDuration = () => {
        const duration = calculateDurationFromTimes(startInput.value, endInput.value);
        if (duration !== null && duration > 0) {
            durationInput.value = duration;
        }
    };
    
    startInput.addEventListener('change', updateDuration);
    endInput.addEventListener('change', updateDuration);
}

async function openRecordModal(id) {
    const records = await ipcRenderer.invoke('get-work-records-by-date', selectedDate);
    const record = records.find(r => r.id === id);
    
    if (record) {
        document.getElementById('record-id').value = record.id;
        document.getElementById('record-project').value = record.project_id;
        document.getElementById('record-date').value = record.date;
        document.getElementById('record-start').value = record.start_time || '';
        document.getElementById('record-end').value = record.end_time || '';
        document.getElementById('record-duration').value = record.duration_minutes;
        document.getElementById('record-notes').value = record.notes || '';
        
        document.getElementById('record-modal').classList.add('active');
    }
}

function closeRecordModal() {
    document.getElementById('record-modal').classList.remove('active');
}

async function saveRecord() {
    const id = document.getElementById('record-id').value;
    const projectId = parseInt(document.getElementById('record-project').value);
    const date = document.getElementById('record-date').value;
    const startTime = document.getElementById('record-start').value || null;
    const endTime = document.getElementById('record-end').value || null;
    const notes = document.getElementById('record-notes').value;
    
    let durationMinutes = parseInt(document.getElementById('record-duration').value) || 0;
    
    if (startTime && endTime) {
        const calculatedDuration = calculateDurationFromTimes(startTime, endTime);
        if (calculatedDuration !== null) {
            durationMinutes = calculatedDuration;
            document.getElementById('record-duration').value = durationMinutes;
        }
    }
    
    if (!projectId) {
        alert('请选择项目');
        return;
    }
    
    if (durationMinutes < 1) {
        alert('时长至少需要1分钟');
        return;
    }
    
    await ipcRenderer.invoke('update-work-record', {
        id: parseInt(id),
        projectId,
        date,
        startTime,
        endTime,
        durationMinutes,
        notes
    });
    
    closeRecordModal();
    loadTodayRecords();
    renderCalendar();
    loadDayDetails(selectedDate);
}

async function deleteRecord(id) {
    if (confirm('确定要删除此工作记录吗？')) {
        await ipcRenderer.invoke('delete-work-record', id);
        loadTodayRecords();
        renderCalendar();
        loadDayDetails(selectedDate);
    }
}

// 日历
function initCalendar() {
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    document.getElementById('today-btn').addEventListener('click', () => {
        currentDate = new Date();
        selectedDate = formatDate(new Date());
        renderCalendar();
    });
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

async function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('calendar-title').textContent = 
        `${year}年${month + 1}月`;
    
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = formatDate(new Date(year, month - 1, day));
        grid.appendChild(await createCalendarDay(day, date, true));
    }
    
    for (let day = 1; day <= totalDays; day++) {
        const date = formatDate(new Date(year, month, day));
        grid.appendChild(await createCalendarDay(day, date, false));
    }
    
    const remainingDays = 42 - (startDay + totalDays);
    for (let day = 1; day <= remainingDays; day++) {
        const date = formatDate(new Date(year, month + 1, day));
        grid.appendChild(await createCalendarDay(day, date, true));
    }
}

async function createCalendarDay(dayNum, date, isOtherMonth) {
    const totalMinutes = await ipcRenderer.invoke('get-daily-total-minutes', date);
    const hours = (totalMinutes / 60).toFixed(1);
    const today = formatDate(new Date());
    
    const dayEl = document.createElement('div');
    dayEl.className = `calendar-day${isOtherMonth ? ' other-month' : ''}${date === today ? ' today' : ''}${date === selectedDate ? ' selected' : ''}`;
    
    dayEl.innerHTML = `
        <span class="day-number">${dayNum}</span>
        ${totalMinutes > 0 ? `<span class="day-hours">${hours}h</span>` : ''}
    `;
    
    dayEl.addEventListener('click', () => {
        selectedDate = date;
        renderCalendar();
        loadDayDetails(date);
    });
    
    return dayEl;
}

async function loadDayDetails(date) {
    const records = await ipcRenderer.invoke('get-work-records-by-date', date);
    const totalMinutes = await ipcRenderer.invoke('get-daily-total-minutes', date);
    
    const dateObj = new Date(date + 'T00:00:00');
    const displayDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
    
    document.getElementById('day-detail-title').textContent = displayDate;
    document.getElementById('day-total').textContent = `总工时: ${(totalMinutes / 60).toFixed(1)}小时`;
    
    const container = document.getElementById('day-records');
    
    if (records.length === 0) {
        container.innerHTML = '<p class="empty-state">当天没有工作记录</p>';
    } else {
        container.innerHTML = records.map(r => createRecordItem(r)).join('');
        setupRecordActions(container);
    }
}

// 报表
function initReports() {
    document.getElementById('report-type').addEventListener('change', updateDateRange);
    document.getElementById('generate-report').addEventListener('click', loadReportData);
    document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
    updateDateRange();
}

function updateDateRange() {
    const type = document.getElementById('report-type').value;
    const now = new Date();
    
    if (type === 'weekly') {
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        document.getElementById('report-start').value = formatDate(monday);
        document.getElementById('report-end').value = formatDate(sunday);
    } else {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        document.getElementById('report-start').value = formatDate(firstDay);
        document.getElementById('report-end').value = formatDate(lastDay);
    }
}

async function loadReportData() {
    const startDate = document.getElementById('report-start').value;
    const endDate = document.getElementById('report-end').value;
    
    if (!startDate || !endDate) {
        alert('请选择日期范围');
        return;
    }
    
    const summary = await ipcRenderer.invoke('get-project-summary', startDate, endDate);
    const records = await ipcRenderer.invoke('get-work-records-by-range', startDate, endDate);
    
    currentReportData = { summary, records, startDate, endDate };
    
    let totalMinutes = 0;
    let totalIncome = 0;
    let totalProjects = 0;
    
    summary.forEach(p => {
        totalMinutes += p.total_minutes;
        totalIncome += p.total_income;
        if (p.total_minutes > 0) totalProjects++;
    });
    
    document.getElementById('report-summary').innerHTML = `
        <div class="summary-item">
            <div class="summary-label">项目数</div>
            <div class="summary-value">${totalProjects}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">总工时</div>
            <div class="summary-value">${(totalMinutes / 60).toFixed(1)}h</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">总收入</div>
            <div class="summary-value">¥${totalIncome.toFixed(2)}</div>
        </div>
    `;
    
    const tbody = document.querySelector('#report-table tbody');
    const filteredSummary = summary.filter(p => p.total_minutes > 0);
    
    if (filteredSummary.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:40px;">所选日期范围内无数据</td></tr>';
    } else {
        tbody.innerHTML = filteredSummary.map(p => `
            <tr>
                <td>${escapeHtml(p.project_name)}</td>
                <td>${(p.total_minutes / 60).toFixed(1)}小时 (${p.total_minutes}分)</td>
                <td>¥${p.hourly_rate.toFixed(2)}/小时</td>
                <td>¥${p.total_income.toFixed(2)}</td>
            </tr>
        `).join('');
        
        tbody.innerHTML += `
            <tr class="total-row">
                <td><strong>总计</strong></td>
                <td><strong>${(totalMinutes / 60).toFixed(1)}小时</strong></td>
                <td>-</td>
                <td><strong>¥${totalIncome.toFixed(2)}</strong></td>
            </tr>
        `;
    }
}

async function exportCSV() {
    if (!currentReportData || currentReportData.summary.length === 0) {
        alert('请先生成报表');
        return;
    }
    
    const { summary, startDate, endDate } = currentReportData;
    const filteredSummary = summary.filter(p => p.total_minutes > 0);
    
    let csv = '项目名称,总工时(分钟),总工时(小时),小时费率(元),收入(元)\n';
    
    filteredSummary.forEach(p => {
        csv += `${p.project_name},${p.total_minutes},${(p.total_minutes/60).toFixed(2)},${p.hourly_rate.toFixed(2)},${p.total_income.toFixed(2)}\n`;
    });
    
    let totalMinutes = 0;
    let totalIncome = 0;
    filteredSummary.forEach(p => {
        totalMinutes += p.total_minutes;
        totalIncome += p.total_income;
    });
    
    csv += `总计,${totalMinutes},${(totalMinutes/60).toFixed(2)},,${totalIncome.toFixed(2)}\n`;
    csv += `\n报表周期,${startDate},至,${endDate},\n`;
    
    const type = document.getElementById('report-type').value;
    const result = await ipcRenderer.invoke('export-csv', csv, type);
    
    if (result) {
        alert(`CSV已导出到: ${result}`);
    }
}

// 工具函数
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

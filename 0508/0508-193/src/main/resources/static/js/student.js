const user = requireLogin('STUDENT');
let currentHomeworkId = null;
let currentHomeworkDeadline = null;
let currentAttachmentRequirement = null;
let currentAllowedExtensions = [];
let currentHomeworkPage = 1;
let currentHistoryPage = 1;
const PAGE_SIZE = 10;

document.addEventListener('DOMContentLoaded', function() {
    if (!user) return;
    
    document.getElementById('userInfo').textContent = `${user.name} (${user.className})`;

    initTabs();
    loadHomeworks();
    loadHistory();
    
    setInterval(() => {
        loadHomeworks();
    }, 60000);
});

function renderPagination(containerId, currentPage, totalPages, total, onPageChange) {
    const container = document.getElementById(containerId);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    html += `<button class="pagination-btn" onclick="${onPageChange}(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>`;
    
    html += `<span class="pagination-info">第 ${currentPage} / ${totalPages} 页，共 ${total} 条</span>`;
    
    html += `<button class="pagination-btn" onclick="${onPageChange}(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>`;
    
    container.innerHTML = html;
}

function goToHomeworkPage(page) {
    if (page < 1) return;
    currentHomeworkPage = page;
    loadHomeworks();
}

function goToHistoryPage(page) {
    if (page < 1) return;
    currentHistoryPage = page;
    loadHistory();
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'history') {
                loadHistory();
            }
        });
    });
}

async function loadHomeworks() {
    try {
        const result = await apiRequest(`/homeworks/class/${encodeURIComponent(user.className)}?page=${currentHomeworkPage}&size=${PAGE_SIZE}`);
        const listContainer = document.getElementById('homeworkList');
        const homeworks = result.homeworks || [];
        
        if (homeworks.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无作业</p>';
            document.getElementById('homeworkPagination').innerHTML = '';
            return;
        }

        let html = '';
        for (const hw of homeworks) {
            const submission = await checkSubmission(hw.id);
            const isExpired = new Date(hw.deadline) < new Date();
            const status = getStatus(submission, isExpired);
            
            html += `
                <div class="homework-item">
                    <div class="homework-header">
                        <div class="homework-info">
                            <h3>${hw.title}</h3>
                            <p>截止时间：${formatDate(hw.deadline)}</p>
                            <p>${hw.description || '无描述'}</p>
                            ${hw.attachmentRequirement ? `<p>📎 附件要求：${hw.attachmentRequirement}</p>` : ''}
                        </div>
                        <span class="status-badge ${status.class}">${status.text}</span>
                    </div>
                    ${status.action ? `
                        <button class="btn ${status.btnClass}" onclick="openSubmitModal(${hw.id}, '${hw.title}', '${hw.deadline}', ${isExpired}, '${hw.attachmentRequirement || ''}')">
                            ${status.action}
                        </button>
                    ` : ''}
                    ${submission && submission.score != null ? `
                        <div class="score-display">
                            <div class="score">${submission.score}分</div>
                            <div class="percentile">班级排名：超过 ${submission.percentile ? submission.percentile.toFixed(1) : 0}% 的同学</div>
                            ${submission.comment ? `<div class="comment">教师评语：${submission.comment}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        listContainer.innerHTML = html;
        renderPagination('homeworkPagination', result.currentPage, result.totalPages, result.total, 'goToHomeworkPage');
    } catch (error) {
        console.error('加载作业失败:', error);
    }
}

async function checkSubmission(homeworkId) {
    try {
        const submission = await apiRequest(`/submissions/homework/${homeworkId}/student/${user.id}`);
        if (submission && submission.score != null) {
            const percentile = await apiRequest(`/submissions/student/${user.id}/homework/${homeworkId}/percentile`);
            submission.percentile = percentile ? percentile.percentile : null;
        }
        return submission;
    } catch (error) {
        return null;
    }
}

function getStatus(submission, isExpired) {
    if (isExpired) {
        if (submission && submission.score != null) {
            return {
                class: 'status-graded',
                text: '已批改',
                action: null
            };
        }
        if (submission) {
            return {
                class: 'status-submitted',
                text: '已提交',
                action: null
            };
        }
        return {
            class: 'status-expired',
            text: '已过期',
            action: null
        };
    }
    
    if (!submission) {
        return {
            class: 'status-pending',
            text: '未提交',
            action: '提交作业',
            btnClass: 'btn-primary'
        };
    }
    
    if (submission.score != null) {
        return {
            class: 'status-graded',
            text: '已批改',
            action: null
        };
    }
    
    return {
        class: 'status-submitted',
        text: '已提交',
        action: '修改提交',
        btnClass: 'btn-primary'
    };
}

function parseAllowedExtensions(attachmentRequirement) {
    const allowed = [];
    if (!attachmentRequirement || attachmentRequirement.trim() === '') {
        return allowed;
    }
    
    const lower = attachmentRequirement.toLowerCase();
    
    if (lower.includes('word') || lower.includes('文档')) {
        allowed.push('.doc', '.docx');
    }
    if (lower.includes('pdf')) {
        allowed.push('.pdf');
    }
    if (lower.includes('excel') || lower.includes('表格')) {
        allowed.push('.xls', '.xlsx');
    }
    if (lower.includes('ppt') || lower.includes('演示')) {
        allowed.push('.ppt', '.pptx');
    }
    if (lower.includes('图片') || lower.includes('image')) {
        allowed.push('.jpg', '.jpeg', '.png', '.gif', '.bmp');
    }
    if (lower.includes('zip') || lower.includes('压缩')) {
        allowed.push('.zip', '.rar', '.7z');
    }
    if (lower.includes('txt') || lower.includes('文本')) {
        allowed.push('.txt');
    }
    
    return allowed;
}

function getFileExtension(fileName) {
    if (!fileName || !fileName.includes('.')) {
        return '';
    }
    return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
}

function openSubmitModal(homeworkId, title, deadline, isExpired, attachmentRequirement) {
    if (isExpired) {
        showToast('已超过作业截止时间，无法提交', 'error');
        return;
    }
    if (new Date(deadline) < new Date()) {
        showToast('已超过作业截止时间，无法提交', 'error');
        return;
    }
    currentHomeworkId = homeworkId;
    currentHomeworkDeadline = deadline;
    currentAttachmentRequirement = attachmentRequirement;
    currentAllowedExtensions = parseAllowedExtensions(attachmentRequirement);
    
    document.getElementById('submitModalTitle').textContent = `提交作业 - ${title}`;
    
    const requirementHint = document.getElementById('attachmentRequirementHint');
    if (currentAllowedExtensions.length > 0) {
        requirementHint.textContent = `支持格式：${currentAllowedExtensions.join('、')}`;
        requirementHint.style.display = 'block';
    } else {
        requirementHint.style.display = 'none';
    }
    
    document.getElementById('submitForm').reset();
    document.getElementById('fileName').textContent = '';
    document.getElementById('submitModal').classList.add('active');
}

function closeSubmitModal() {
    document.getElementById('submitModal').classList.remove('active');
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

document.getElementById('submitFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > MAX_FILE_SIZE) {
            showToast(`文件过大（${formatFileSize(file.size)}），最大支持100MB`, 'error');
            this.value = '';
            document.getElementById('fileName').textContent = '';
            return;
        }
        
        if (currentAllowedExtensions.length > 0) {
            const fileExt = getFileExtension(file.name);
            if (!currentAllowedExtensions.includes(fileExt)) {
                showToast(`文件类型不符合要求，仅支持：${currentAllowedExtensions.join('、')}`, 'error');
                this.value = '';
                document.getElementById('fileName').textContent = '';
                return;
            }
        }
        
        document.getElementById('fileName').textContent = `${file.name} (${formatFileSize(file.size)})`;
    } else {
        document.getElementById('fileName').textContent = '';
    }
});

document.getElementById('submitForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (new Date(currentHomeworkDeadline) < new Date()) {
        showToast('已超过作业截止时间，无法提交', 'error');
        closeSubmitModal();
        loadHomeworks();
        return;
    }
    
    const content = document.getElementById('submitContent').value;
    const fileInput = document.getElementById('submitFile');
    const file = fileInput.files[0];
    
    if (file && file.size > MAX_FILE_SIZE) {
        showToast(`文件过大（${formatFileSize(file.size)}），最大支持100MB`, 'error');
        return;
    }
    
    if (file && currentAllowedExtensions.length > 0) {
        const fileExt = getFileExtension(file.name);
        if (!currentAllowedExtensions.includes(fileExt)) {
            showToast(`文件类型不符合要求，仅支持：${currentAllowedExtensions.join('、')}`, 'error');
            return;
        }
    }

    const formData = new FormData();
    formData.append('homeworkId', currentHomeworkId);
    formData.append('studentId', user.id);
    if (content) formData.append('content', content);
    if (file) formData.append('file', file);

    try {
        const response = await fetch(API_BASE + '/submissions/submit', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '提交失败');
        }

        showToast('作业提交成功！');
        closeSubmitModal();
        loadHomeworks();
    } catch (error) {
        showToast(error.message || '提交失败，请重试', 'error');
    }
});

async function loadHistory() {
    try {
        const stats = await apiRequest(`/submissions/student/${user.id}/stats?page=${currentHistoryPage}&size=${PAGE_SIZE}`);
        
        document.getElementById('totalSubmitted').textContent = stats.totalSubmitted;
        document.getElementById('totalGraded').textContent = stats.totalGraded;
        document.getElementById('avgScore').textContent = stats.averageScore.toFixed(1);
        
        const historyList = document.getElementById('historyList');
        
        if (stats.history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无成绩记录</p>';
            document.getElementById('historyPagination').innerHTML = '';
            return;
        }
        
        historyList.innerHTML = stats.history.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <h4>${item.homeworkTitle}</h4>
                    <p>批改时间：${formatDate(item.gradedAt)}</p>
                    ${item.comment ? `<p style="color: #e74c3c;">评语：${item.comment}</p>` : ''}
                    <div class="percentile-bar">
                        <div class="percentile-fill" style="width: ${item.percentile || 0}%"></div>
                    </div>
                    <p style="font-size: 12px; color: #27ae60;">超过 ${item.percentile ? item.percentile.toFixed(1) : 0}% 的同学</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 28px; font-weight: bold; color: #667eea;">${item.score}分</div>
                </div>
            </div>
        `).join('');
        
        renderPagination('historyPagination', stats.currentPage, stats.totalPages, stats.total, 'goToHistoryPage');
    } catch (error) {
        console.error('加载历史成绩失败:', error);
    }
}

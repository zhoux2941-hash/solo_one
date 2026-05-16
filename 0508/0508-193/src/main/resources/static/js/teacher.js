const user = requireLogin('TEACHER');
let currentHomeworkId = null;
let currentSubmissionId = null;

function addAttachmentReq(type) {
    const input = document.getElementById('hwAttachment');
    const current = input.value.trim();
    if (current) {
        if (!current.includes(type)) {
            input.value = current + '、' + type;
        }
    } else {
        input.value = type;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (!user) return;
    
    document.getElementById('userInfo').textContent = `${user.name} (${user.className})`;
    
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('hwDeadline').min = now.toISOString().slice(0, 16);
    
    now.setDate(now.getDate() + 7);
    document.getElementById('hwDeadline').value = now.toISOString().slice(0, 16);

    initTabs();
    loadHomeworks();
});

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
            
            if (tabId === 'stats') {
                loadStatsHomeworks();
            }
        });
    });
}

document.getElementById('createHomeworkForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const deadlineValue = document.getElementById('hwDeadline').value;
    const deadline = new Date(deadlineValue);
    const now = new Date();
    
    if (deadline <= now) {
        showToast('截止时间必须晚于当前时间', 'error');
        return;
    }
    
    const homeworkData = {
        title: document.getElementById('hwTitle').value,
        description: document.getElementById('hwDescription').value,
        deadline: deadlineValue,
        attachmentRequirement: document.getElementById('hwAttachment').value,
        teacherId: user.id
    };

    try {
        await apiRequest('/homeworks', {
            method: 'POST',
            body: homeworkData
        });
        showToast('作业发布成功！');
        loadHomeworks();
    } catch (error) {
        showToast(error.message || '发布失败，请重试', 'error');
    }
});

async function loadHomeworks() {
    try {
        const homeworks = await apiRequest(`/homeworks/teacher/${user.id}`);
        const listContainer = document.getElementById('homeworkList');
        
        if (homeworks.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无作业</p>';
            return;
        }

        listContainer.innerHTML = homeworks.map(hw => `
            <div class="homework-item">
                <div class="homework-info">
                    <h3>${hw.title}</h3>
                    <p>截止时间：${formatDate(hw.deadline)}</p>
                    <p>${hw.description || '无描述'}</p>
                    ${hw.attachmentRequirement ? `<p>附件要求：${hw.attachmentRequirement}</p>` : ''}
                </div>
                <div class="homework-actions">
                    <button class="btn btn-primary btn-small" onclick="viewSubmissions(${hw.id}, '${hw.title}')">查看提交</button>
                    <button class="btn btn-success btn-small" onclick="viewStats(${hw.id})">成绩统计</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载作业失败:', error);
    }
}

async function viewSubmissions(homeworkId, title) {
    currentHomeworkId = homeworkId;
    document.getElementById('modalTitle').textContent = `${title} - 学生提交`;
    
    try {
        const submissions = await apiRequest(`/submissions/homework/${homeworkId}`);
        const container = document.getElementById('submissionList');
        
        if (submissions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无学生提交</p>';
        } else {
            container.innerHTML = submissions.map(sub => {
                const scoreClass = sub.score != null ? 
                    (sub.score >= 90 ? 'score-excellent' : 
                     sub.score >= 80 ? 'score-good' : 
                     sub.score >= 60 ? 'score-medium' : 'score-poor') 
                    : 'score-ungraded';
                const scoreText = sub.score != null ? `${sub.score}分` : '未批改';
                
                return `
                    <div class="submission-item">
                        <div class="submission-header">
                            <h4>${sub.student.name}</h4>
                            <span class="score-badge ${scoreClass}">${scoreText}</span>
                        </div>
                        <p style="color: #666; margin: 10px 0;">提交时间：${formatDate(sub.submittedAt)}</p>
                        ${sub.content ? `<p style="color: #333; margin: 10px 0; padding: 10px; background: #fff; border-radius: 6px;">${sub.content}</p>` : ''}
                        ${sub.fileName ? `<p style="color: #667eea;">📎 附件：${sub.fileName}</p>` : ''}
                        ${sub.comment ? `<p style="color: #e74c3c; margin-top: 10px;">教师评语：${sub.comment}</p>` : ''}
                        <div style="margin-top: 15px;">
                            <button class="btn ${sub.score != null ? 'btn-secondary' : 'btn-primary'} btn-small" 
                                    onclick="openGradeModal(${sub.id}, '${sub.student.name}')">
                                ${sub.score != null ? '修改分数' : '批改'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        document.getElementById('submissionModal').classList.add('active');
    } catch (error) {
        showToast('加载提交失败', 'error');
    }
}

function closeModal() {
    document.getElementById('submissionModal').classList.remove('active');
}

async function openGradeModal(submissionId, studentName) {
    currentSubmissionId = submissionId;
    
    try {
        const submission = await apiRequest(`/submissions/${submissionId}`);
        const container = document.getElementById('gradeContent');
        
        container.innerHTML = `
            <p style="margin-bottom: 20px;"><strong>学生：</strong>${studentName}</p>
            <div class="form-group">
                <label>分数 (0-100)</label>
                <input type="number" id="gradeScore" min="0" max="100" value="${submission.score || ''}" required>
            </div>
            <div class="form-group">
                <label>评语</label>
                <textarea id="gradeComment" rows="4" placeholder="请输入评语">${submission.comment || ''}</textarea>
            </div>
            <button class="btn btn-primary" onclick="submitGrade()">提交批改</button>
        `;
        
        closeModal();
        document.getElementById('gradeModal').classList.add('active');
    } catch (error) {
        showToast('加载数据失败', 'error');
    }
}

async function submitGrade() {
    const score = parseInt(document.getElementById('gradeScore').value);
    const comment = document.getElementById('gradeComment').value;
    
    if (isNaN(score) || score < 0 || score > 100) {
        showToast('请输入0-100之间的有效分数', 'error');
        return;
    }

    try {
        await apiRequest(`/submissions/grade/${currentSubmissionId}`, {
            method: 'POST',
            body: { score, comment }
        });
        
        showToast('批改成功！');
        closeGradeModal();
        viewSubmissions(currentHomeworkId, document.getElementById('modalTitle').textContent.split(' - ')[0]);
    } catch (error) {
        showToast('批改失败，请重试', 'error');
    }
}

function closeGradeModal() {
    document.getElementById('gradeModal').classList.remove('active');
}

async function loadStatsHomeworks() {
    try {
        const homeworks = await apiRequest(`/homeworks/teacher/${user.id}`);
        const select = document.getElementById('statsHomeworkSelect');
        
        select.innerHTML = '<option value="">请选择作业</option>' + 
            homeworks.map(hw => `<option value="${hw.id}">${hw.title}</option>`).join('');
        
        select.onchange = function() {
            if (this.value) {
                viewStats(this.value);
            } else {
                document.getElementById('chartContainer').style.display = 'none';
            }
        };
    } catch (error) {
        console.error('加载作业失败:', error);
    }
}

async function viewStats(homeworkId) {
    try {
        const stats = await apiRequest(`/submissions/homework/${homeworkId}/distribution`);
        document.getElementById('statsHomeworkSelect').value = homeworkId;
        
        const container = document.getElementById('chartContainer');
        const chart = document.getElementById('barChart');
        
        const colors = ['#27ae60', '#3498db', '#f39c12', '#e74c3c'];
        const distribution = stats.distribution;
        const maxCount = Math.max(...Object.values(distribution));
        
        chart.innerHTML = Object.entries(distribution).map(([label, count], index) => {
            const height = maxCount > 0 ? (count / maxCount * 250) : 0;
            return `
                <div class="bar">
                    <span class="bar-count">${count}</span>
                    <div class="bar-fill" style="height: ${height}px; background: ${colors[index]};"></div>
                    <span class="bar-label">${label}<br>(${stats.total > 0 ? (count / stats.total * 100).toFixed(1) : 0}%)</span>
                </div>
            `;
        }).join('');
        
        container.style.display = 'block';
        
        if (document.getElementById('list').classList.contains('active')) {
            loadStatsHomeworks();
            document.querySelector('[data-tab="stats"]').click();
        }
    } catch (error) {
        showToast('加载统计数据失败', 'error');
    }
}

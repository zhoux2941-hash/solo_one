let currentUser = null;
let allCourses = [];
let allEmployees = [];

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`${pageName}Page`).classList.add('active');
    document.querySelector(`button[onclick="showPage('${pageName}')"]`).classList.add('active');

    if (pageName === 'courses') loadCourses();
    if (pageName === 'myCourses') loadMyCourses();
    if (pageName === 'admin') loadStatistics();
}

function showMyTab(tabName) {
    document.querySelectorAll('#myCoursesPage .my-courses-list').forEach(div => div.style.display = 'none');
    document.querySelectorAll('#myCoursesPage .tab-btn').forEach(btn => btn.classList.remove('active'));

    if (tabName === 'enrolled') {
        document.getElementById('enrolledCourses').style.display = 'flex';
        document.getElementById('tabEnrolled').classList.add('active');
    } else {
        document.getElementById('attendedCourses').style.display = 'flex';
        document.getElementById('tabAttended').classList.add('active');
    }
}

function showAdminTab(tabName) {
    document.getElementById('createCourseSection').style.display = tabName === 'create' ? 'block' : 'none';
    document.getElementById('statisticsSection').style.display = tabName === 'statistics' ? 'block' : 'none';

    document.querySelectorAll('#adminPage .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');

    if (tabName === 'statistics') loadStatistics();
}

async function initApp() {
    await loadEmployees();
    await loadHomeStats();
}

async function loadEmployees() {
    const result = await EmployeeAPI.getAll();
    if (result.success) {
        allEmployees = result.data;
        const select = document.getElementById('userSelect');
        select.innerHTML = '<option value="">选择用户</option>';
        allEmployees.forEach(emp => {
            select.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.employeeNo})</option>`;
        });
    }
}

function switchUser() {
    const userId = document.getElementById('userSelect').value;
    if (userId) {
        currentUser = allEmployees.find(e => e.id == userId);
        document.getElementById('currentUser').textContent = `当前用户: ${currentUser.name}`;
        showToast(`已切换到用户: ${currentUser.name}`);
    } else {
        currentUser = null;
        document.getElementById('currentUser').textContent = '当前用户: 未登录';
    }
}

async function loadHomeStats() {
    const result = await CourseAPI.getPublished();
    if (result.success) {
        allCourses = result.data;
        document.getElementById('totalCourses').textContent = allCourses.length;
        document.getElementById('skillCourses').textContent = allCourses.filter(c => c.type === '技能培训').length;
        document.getElementById('qualityCourses').textContent = allCourses.filter(c => c.type === '素养培训').length;
    }
}

async function loadCourses() {
    const filter = document.getElementById('courseTypeFilter').value;
    let courses = filter ? allCourses.filter(c => c.type === filter) : allCourses;

    const coursesList = document.getElementById('coursesList');
    coursesList.innerHTML = '';

    for (const course of courses) {
        const countResult = await EnrollmentAPI.getCount(course.id);
        const enrolledCount = countResult.count || 0;

        let isEnrolled = false;
        if (currentUser) {
            const checkResult = await EnrollmentAPI.check(course.id, currentUser.id);
            isEnrolled = checkResult.enrolled;
        }

        coursesList.innerHTML += `
            <div class="course-card">
                <div class="course-header">
                    <span class="course-type">${course.type}</span>
                    <h3>${course.name}</h3>
                    <div class="course-instructor">讲师: ${course.instructor}</div>
                </div>
                <div class="course-body">
                    <div class="course-info">
                        <div class="course-info-item">
                            <span>📅</span>
                            <span>${formatDate(course.startTime)}</span>
                        </div>
                        <div class="course-info-item">
                            <span>📍</span>
                            <span>${course.location}</span>
                        </div>
                    </div>
                    <div class="course-enrollment">
                        <span class="enrollment-count">已报名: <strong>${enrolledCount}/${course.maxEnrollment}</strong></span>
                        <button onclick="viewCourseDetail(${course.id})" class="btn btn-primary">查看详情</button>
                    </div>
                </div>
            </div>
        `;
    }

    if (courses.length === 0) {
        coursesList.innerHTML = `
            <div class="empty-state">
                <h4>暂无课程</h4>
                <p>目前没有可用的培训课程</p>
            </div>
        `;
    }
}

function filterCourses() {
    loadCourses();
}

async function viewCourseDetail(courseId) {
    const result = await CourseAPI.getById(courseId);
    if (!result.success) {
        showToast('加载课程详情失败', 'error');
        return;
    }

    const course = result.data;
    const countResult = await EnrollmentAPI.getCount(courseId);
    const enrolledCount = countResult.count || 0;

    let isEnrolled = false;
    let isSignedIn = false;
    let enrollmentId = null;

    if (currentUser) {
        const enrollCheck = await EnrollmentAPI.check(courseId, currentUser.id);
        isEnrolled = enrollCheck.enrolled;

        const attendCheck = await AttendanceAPI.check(courseId, currentUser.id);
        isSignedIn = attendCheck.signedIn;

        const enrollmentsResult = await EnrollmentAPI.getByEmployee(currentUser.id);
        if (enrollmentsResult.success) {
            const enrollment = enrollmentsResult.data.find(e => e.course.id == courseId && e.status === 'ENROLLED');
            if (enrollment) enrollmentId = enrollment.id;
        }
    }

    document.getElementById('courseDetail').innerHTML = `
        <div class="course-detail-container">
            <div class="course-detail-header">
                <h2>${course.name}</h2>
                <div class="course-detail-meta">
                    <span class="meta-tag">${course.type}</span>
                    <span class="meta-item">👨‍🏫 ${course.instructor}</span>
                    <span class="meta-item">📍 ${course.location}</span>
                </div>
            </div>

            <div class="course-detail-section">
                <h3>课程描述</h3>
                <p>${course.description || '暂无描述'}</p>
            </div>

            <div class="course-detail-section">
                <h3>时间安排</h3>
                <p>开始时间: ${formatDate(course.startTime)}</p>
                <p>结束时间: ${formatDate(course.endTime)}</p>
            </div>

            <div class="course-detail-section">
                <h3>报名情况</h3>
                <p>已报名人数: ${enrolledCount} / ${course.maxEnrollment}</p>
                <p>剩余名额: ${course.maxEnrollment - enrolledCount} 个</p>
            </div>

            <div class="course-actions">
                ${!currentUser ? '<p style="color:#999;">请先选择用户以进行报名</p>' : ''}
                ${currentUser && !isEnrolled ? `<button onclick="enrollCourse(${courseId})" class="btn btn-primary">立即报名</button>` : ''}
                ${currentUser && isEnrolled && !isSignedIn && enrollmentId ? `<button onclick="cancelEnrollment(${enrollmentId})" class="btn btn-danger">取消报名</button>` : ''}
                ${currentUser && isEnrolled && !isSignedIn ? `<button onclick="signIn(${courseId})" class="btn btn-success">签到</button>` : ''}
                ${currentUser && isSignedIn ? '<span class="status-badge status-signedin">已签到</span>' : ''}
                ${currentUser && isEnrolled && !isSignedIn ? '<span class="status-badge status-enrolled">已报名</span>' : ''}
            </div>
        </div>
    `;

    showPage('courseDetail');
}

async function enrollCourse(courseId) {
    if (!currentUser) {
        showToast('请先选择用户', 'error');
        return;
    }

    const result = await EnrollmentAPI.enroll(courseId, currentUser.id);
    if (result.success) {
        showToast('报名成功！');
        viewCourseDetail(courseId);
    } else {
        showToast(result.message || '报名失败', 'error');
    }
}

async function cancelEnrollment(enrollmentId) {
    if (!enrollmentId || enrollmentId === 'null') {
        showToast('报名记录ID无效', 'error');
        return;
    }
    if (!confirm('确定要取消报名吗？')) return;

    const result = await EnrollmentAPI.cancel(enrollmentId);
    if (result.success) {
        showToast('已取消报名');
        loadCourses();
        showPage('courses');
    } else {
        showToast(result.message || '取消失败', 'error');
    }
}

async function signIn(courseId) {
    if (!currentUser) {
        showToast('请先选择用户', 'error');
        return;
    }

    const location = prompt('请输入签到地点:');
    if (location === null) return;

    const result = await AttendanceAPI.signIn(courseId, currentUser.id, location, '');
    if (result.success) {
        showToast('签到成功！');
        viewCourseDetail(courseId);
    } else {
        showToast(result.message || '签到失败', 'error');
    }
}

async function loadMyCourses() {
    if (!currentUser) {
        document.getElementById('enrolledCourses').innerHTML = `
            <div class="empty-state">
                <h4>请先选择用户</h4>
                <p>在顶部选择用户后查看您的培训记录</p>
            </div>
        `;
        document.getElementById('attendedCourses').innerHTML = '';
        return;
    }

    const enrollmentsResult = await EnrollmentAPI.getByEmployee(currentUser.id);
    const enrolledCoursesDiv = document.getElementById('enrolledCourses');

    if (enrollmentsResult.success && enrollmentsResult.data.length > 0) {
        const activeEnrollments = enrollmentsResult.data.filter(e => e.status === 'ENROLLED');
        if (activeEnrollments.length > 0) {
            enrolledCoursesDiv.innerHTML = activeEnrollments.map(e => `
                <div class="my-course-item">
                    <div class="my-course-info">
                        <h4>${e.course.name}</h4>
                        <p>${e.course.type} | ${e.course.instructor} | ${e.course.location}</p>
                        <p>报名时间: ${formatDate(e.enrolledAt)}</p>
                    </div>
                    <div class="my-course-status">
                        <span class="status-badge status-enrolled">已报名</span>
                        <button onclick="viewCourseDetail(${e.course.id})" class="btn btn-secondary">查看</button>
                    </div>
                </div>
            `).join('');
        } else {
            enrolledCoursesDiv.innerHTML = `
                <div class="empty-state">
                    <h4>暂无报名课程</h4>
                    <p>去课程列表浏览并报名感兴趣的课程吧</p>
                </div>
            `;
        }
    } else {
        enrolledCoursesDiv.innerHTML = `
            <div class="empty-state">
                <h4>暂无报名课程</h4>
                <p>去课程列表浏览并报名感兴趣的课程吧</p>
            </div>
        `;
    }

    const attendanceResult = await AttendanceAPI.getByEmployee(currentUser.id);
    const attendedCoursesDiv = document.getElementById('attendedCourses');

    if (attendanceResult.success && attendanceResult.data.length > 0) {
        attendedCoursesDiv.innerHTML = attendanceResult.data.map(a => `
            <div class="my-course-item">
                <div class="my-course-info">
                    <h4>${a.course.name}</h4>
                    <p>${a.course.type} | ${a.course.instructor}</p>
                    <p>签到时间: ${formatDate(a.signInTime)} | 地点: ${a.signInLocation || '未知'}</p>
                </div>
                <div class="my-course-status">
                    <span class="status-badge status-signedin">已签到</span>
                </div>
            </div>
        `).join('');
    } else {
        attendedCoursesDiv.innerHTML = `
            <div class="empty-state">
                <h4>暂无签到记录</h4>
                <p>报名课程后可在培训现场进行签到</p>
            </div>
        `;
    }
}

async function createCourse(event) {
    event.preventDefault();

    const course = {
        name: document.getElementById('courseName').value,
        description: document.getElementById('courseDescription').value,
        type: document.getElementById('courseType').value,
        instructor: document.getElementById('courseInstructor').value,
        startTime: document.getElementById('courseStartTime').value,
        endTime: document.getElementById('courseEndTime').value,
        location: document.getElementById('courseLocation').value,
        maxEnrollment: parseInt(document.getElementById('courseMaxEnrollment').value),
        status: 'PUBLISHED'
    };

    const result = await CourseAPI.create(course);
    if (result.success) {
        showToast('课程发布成功！');
        document.getElementById('courseForm').reset();
        loadHomeStats();
    } else {
        showToast(result.message || '发布失败', 'error');
    }
}

async function loadStatistics() {
    const result = await StatisticsAPI.getAll();
    if (result.success) {
        const stats = result.data;
        const tableDiv = document.getElementById('statisticsTable');

        tableDiv.innerHTML = `
            <div class="statistics-table">
                <table>
                    <thead>
                        <tr>
                            <th>课程名称</th>
                            <th>类型</th>
                            <th>最大人数</th>
                            <th>已报名</th>
                            <th>已签到</th>
                            <th>签到率</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.map(s => {
                            const rate = s.enrolledCount > 0 ? (s.signedInCount / s.enrolledCount * 100).toFixed(1) : 0;
                            let rateClass = 'low';
                            if (rate >= 80) rateClass = 'high';
                            else if (rate >= 50) rateClass = 'medium';

                            return `
                                <tr>
                                    <td>${s.courseName}</td>
                                    <td>${s.courseType}</td>
                                    <td>${s.maxEnrollment}</td>
                                    <td>${s.enrolledCount}</td>
                                    <td>${s.signedInCount}</td>
                                    <td><span class="attendance-rate ${rateClass}">${rate}%</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}

initApp();

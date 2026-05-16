const API_BASE = '/api';

async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${url}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        });
        return await response.json();
    } catch (error) {
        console.error('API请求失败:', error);
        return { success: false, message: '网络请求失败' };
    }
}

const CourseAPI = {
    getAll: () => apiRequest('/courses'),
    getPublished: () => apiRequest('/courses/published'),
    getById: (id) => apiRequest(`/courses/${id}`),
    getByType: (type) => apiRequest(`/courses/type/${type}`),
    create: (course) => apiRequest('/courses', {
        method: 'POST',
        body: JSON.stringify(course)
    }),
    update: (id, course) => apiRequest(`/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(course)
    }),
    delete: (id) => apiRequest(`/courses/${id}`, {
        method: 'DELETE'
    })
};

const EmployeeAPI = {
    getAll: () => apiRequest('/employees'),
    getById: (id) => apiRequest(`/employees/${id}`),
    getByNo: (no) => apiRequest(`/employees/no/${no}`),
    create: (employee) => apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify(employee)
    }),
    update: (id, employee) => apiRequest(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(employee)
    })
};

const EnrollmentAPI = {
    getByCourse: (courseId) => apiRequest(`/enrollments/course/${courseId}`),
    getByEmployee: (employeeId) => apiRequest(`/enrollments/employee/${employeeId}`),
    getCount: (courseId) => apiRequest(`/enrollments/count/${courseId}`),
    enroll: (courseId, employeeId) => apiRequest('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseId, employeeId })
    }),
    cancel: (enrollmentId) => apiRequest(`/enrollments/cancel/${enrollmentId}`, {
        method: 'PUT'
    }),
    check: (courseId, employeeId) => apiRequest(`/enrollments/check?courseId=${courseId}&employeeId=${employeeId}`)
};

const AttendanceAPI = {
    getByCourse: (courseId) => apiRequest(`/attendances/course/${courseId}`),
    getByEmployee: (employeeId) => apiRequest(`/attendances/employee/${employeeId}`),
    getCount: (courseId) => apiRequest(`/attendances/count/${courseId}`),
    signIn: (courseId, employeeId, location, remarks) => apiRequest('/attendances/signin', {
        method: 'POST',
        body: JSON.stringify({ courseId, employeeId, location, remarks })
    }),
    check: (courseId, employeeId) => apiRequest(`/attendances/check?courseId=${courseId}&employeeId=${employeeId}`)
};

const StatisticsAPI = {
    getAll: () => apiRequest('/statistics'),
    getByCourse: (courseId) => apiRequest(`/statistics/course/${courseId}`)
};

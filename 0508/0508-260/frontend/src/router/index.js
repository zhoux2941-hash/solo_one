import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue')
    },
    {
        path: '/admin',
        name: 'Admin',
        component: () => import('@/views/admin/Layout.vue'),
        redirect: '/admin/dashboard',
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('@/views/admin/Dashboard.vue')
            },
            {
                path: 'questions',
                name: 'Questions',
                component: () => import('@/views/admin/Questions.vue')
            },
            {
                path: 'papers',
                name: 'Papers',
                component: () => import('@/views/admin/Papers.vue')
            },
            {
                path: 'sessions',
                name: 'Sessions',
                component: () => import('@/views/admin/Sessions.vue')
            },
            {
                path: 'records',
                name: 'Records',
                component: () => import('@/views/admin/Records.vue')
            },
            {
                path: 'users',
                name: 'Users',
                component: () => import('@/views/admin/Users.vue')
            }
        ]
    },
    {
        path: '/examinee',
        name: 'Examinee',
        component: () => import('@/views/examinee/Layout.vue'),
        redirect: '/examinee/exams',
        children: [
            {
                path: 'exams',
                name: 'ExamineeExams',
                component: () => import('@/views/examinee/Exams.vue')
            },
            {
                path: 'records',
                name: 'ExamineeRecords',
                component: () => import('@/views/examinee/Records.vue')
            }
        ]
    },
    {
        path: '/exam/:recordId',
        name: 'ExamPage',
        component: () => import('@/views/ExamPage.vue')
    },
    {
        path: '/review/:recordId',
        name: 'ReviewPage',
        component: () => import('@/views/ReviewPage.vue')
    },
    {
        path: '/',
        redirect: '/login'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (to.path !== '/login' && !user) {
        next('/login')
    } else if (to.path === '/login' && user) {
        if (user.role === 'ADMIN') {
            next('/admin/dashboard')
        } else {
            next('/examinee/exams')
        }
    } else {
        next()
    }
})

export default router

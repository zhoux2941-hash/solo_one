import router from './router'
import { useUserStore } from './store/user'

const whiteList = ['/login']

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (token) {
    if (to.path === '/login') {
      next('/')
    } else {
      if (!userStore.roleCode) {
        next({ ...to, replace: true })
      } else {
        const roles = to.meta?.roles || []
        if (roles.length === 0 || roles.includes(userStore.roleCode)) {
          next()
        } else {
          next('/403')
        }
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

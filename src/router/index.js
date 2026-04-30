import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

const routes = [
  {
    path: '/login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/',
    component: () => import('../views/AppView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    component: () => import('../views/AdminView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function getCurrentUser() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub()
      resolve(user)
    })
  })
}

router.beforeEach(async to => {
  const user = await getCurrentUser()
  if (to.meta.requiresAuth && !user) return '/login'
  if (to.path === '/login' && user) return '/'
})

export default router

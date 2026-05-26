import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
  {
    // handler customizado para ações de e-mail do Firebase (reset de senha, etc.)
    path: '/auth/action',
    component: () => import('../views/AuthActionView.vue'),
  },
  {
    // fallback: Firebase pode enviar o link para /__/auth/action no domínio do Hosting
    path: '/__/auth/action',
    component: () => import('../views/AuthActionView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async to => {
  const authStore = useAuthStore()

  /* Aguarda o Firebase resolver o estado inicial de auth (sem criar novo listener) */
  if (!authStore.authReady) {
    await new Promise(resolve => {
      const stop = setInterval(() => {
        if (authStore.authReady) { clearInterval(stop); resolve(undefined) }
      }, 20)
    })
  }

  const user = authStore.currentUser
  if (to.meta.requiresAuth && !user) return '/login'
  if (to.path === '/login' && user)  return '/'
})

export default router

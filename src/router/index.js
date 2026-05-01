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

/**
 * useAuthStore
 * Responsável por: usuário autenticado (Firebase Auth)
 *
 * Por que Pinia aqui?
 * Antes, cada view fazia seu próprio onAuthStateChanged e guardava
 * currentUser num ref local. Com a store, há um único listener
 * para toda a aplicação — sem duplicação, sem inconsistência.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useProfileStore } from './profile'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const authReady    = ref(false)   // true após o primeiro disparo do listener

  /* Inicia o listener de autenticação — chamado uma única vez no main.ts */
  function init() {
    onAuthStateChanged(auth, user => {
      currentUser.value = user
      authReady.value   = true

      if (user) {
        /* Inicia o listener do perfil quando o usuário loga */
        useProfileStore().init(user.uid)
      } else {
        /* Limpa o perfil quando o usuário desloga */
        useProfileStore().clear()
      }
    })
  }

  async function logout() {
    await signOut(auth)
    useProfileStore().clear()
  }

  return { currentUser, authReady, init, logout }
})

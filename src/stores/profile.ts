/**
 * useProfileStore
 * Responsável por: perfil do usuário (Firestore users/{uid})
 *
 * Por que Pinia aqui?
 * AppView e AdminView chamavam useProfile() separadamente — dois onSnapshot
 * para o mesmo documento. Com a store, há apenas um listener ativo,
 * compartilhado por todos os componentes que precisarem do perfil.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Profile } from '../types'

export const useProfileStore = defineStore('profile', () => {
  const profile       = ref<Profile | null>(null)
  const profileLoaded = ref(false)

  let _unsub: (() => void) | null = null

  /* Chamado pelo useAuthStore quando o usuário loga */
  function init(uid: string) {
    /* Cancela listener anterior se houver (troca de conta) */
    if (_unsub) _unsub()

    _unsub = onSnapshot(doc(db, 'users', uid), snap => {
      profile.value       = snap.exists() ? { uid, ...(snap.data() as Omit<Profile, 'uid'>) } : null
      profileLoaded.value = true
    })
  }

  /* Chamado pelo useAuthStore quando o usuário desloga */
  function clear() {
    if (_unsub) { _unsub(); _unsub = null }
    profile.value       = null
    profileLoaded.value = false
  }

  return { profile, profileLoaded, init, clear }
})

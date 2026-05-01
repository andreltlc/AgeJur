import { ref, isRef, watchEffect } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useProfile(userRef) {
  const profile = ref(null)
  const profileLoaded = ref(false)

  watchEffect(onCleanup => {
    const uid = isRef(userRef) ? userRef.value?.uid : userRef
    if (!uid) { profileLoaded.value = false; return }
    const unsub = onSnapshot(doc(db, 'users', uid), snap => {
      profile.value = snap.exists() ? { uid, ...snap.data() } : null
      profileLoaded.value = true
    })
    onCleanup(unsub)
  })

  return { profile, profileLoaded }
}

import { ref, isRef, watchEffect } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useProfile(userRef) {
  const profile = ref(null)

  watchEffect(onCleanup => {
    const uid = isRef(userRef) ? userRef.value?.uid : userRef
    if (!uid) return
    const unsub = onSnapshot(doc(db, 'users', uid), snap => {
      profile.value = snap.exists() ? { uid, ...snap.data() } : null
    })
    onCleanup(unsub)
  })

  return { profile }
}

import { ref, isRef, watchEffect } from 'vue'
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export function useAudiencias(userRef) {
  const audiencias = ref([])

  watchEffect(onCleanup => {
    const uid = isRef(userRef) ? userRef.value?.uid : userRef
    if (!uid) return

    const unsub = onSnapshot(
      query(collection(db, 'audiencias'), where('userId', '==', uid)),
      snap => { audiencias.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
    )
    onCleanup(unsub)
  })

  function uid() {
    return isRef(userRef) ? userRef.value?.uid : userRef
  }

  async function addAudiencia(data) {
    return addDoc(collection(db, 'audiencias'), { ...data, userId: uid(), createdAt: serverTimestamp() })
  }

  async function updateAudiencia(id, data) {
    return updateDoc(doc(db, 'audiencias', id), data)
  }

  async function deleteAudiencia(id) {
    return deleteDoc(doc(db, 'audiencias', id))
  }

  return { audiencias, addAudiencia, updateAudiencia, deleteAudiencia }
}

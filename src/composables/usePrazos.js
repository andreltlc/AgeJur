import { ref, isRef, watchEffect } from 'vue'
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export function usePrazos(userRef) {
  const prazos = ref([])

  watchEffect(onCleanup => {
    const uid = isRef(userRef) ? userRef.value?.uid : userRef
    if (!uid) return

    const unsub = onSnapshot(
      query(collection(db, 'prazos'), where('userId', '==', uid)),
      snap => { prazos.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
    )
    onCleanup(unsub)
  })

  function uid() {
    return isRef(userRef) ? userRef.value?.uid : userRef
  }

  async function addPrazo(data) {
    return addDoc(collection(db, 'prazos'), { ...data, userId: uid(), createdAt: serverTimestamp() })
  }

  async function updatePrazo(id, data) {
    return updateDoc(doc(db, 'prazos', id), data)
  }

  async function deletePrazo(id) {
    return deleteDoc(doc(db, 'prazos', id))
  }

  return { prazos, addPrazo, updatePrazo, deletePrazo }
}

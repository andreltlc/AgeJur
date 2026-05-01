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

    let ownItems = []
    let sharedItems = []

    function merge() {
      const map = new Map()
      ownItems.forEach(i => map.set(i.id, i))
      sharedItems.forEach(i => { if (!map.has(i.id)) map.set(i.id, i) })
      prazos.value = [...map.values()]
    }

    const unsub1 = onSnapshot(
      query(collection(db, 'prazos'), where('userId', '==', uid)),
      snap => { ownItems = snap.docs.map(d => ({ id: d.id, ...d.data() })); merge() },
    )

    const unsub2 = onSnapshot(
      query(collection(db, 'prazos'), where('sharedWithUids', 'array-contains', uid)),
      snap => { sharedItems = snap.docs.map(d => ({ id: d.id, ...d.data() })); merge() },
    )

    onCleanup(() => { unsub1(); unsub2() })
  })

  function uid() {
    return isRef(userRef) ? userRef.value?.uid : userRef
  }

  async function addPrazo(data, ownerApelido = '') {
    return addDoc(collection(db, 'prazos'), {
      ...data,
      userId: uid(),
      ownerApelido,
      sharedWith: [],
      sharedWithUids: [],
      createdAt: serverTimestamp(),
    })
  }

  async function updatePrazo(id, data) {
    return updateDoc(doc(db, 'prazos', id), data)
  }

  async function deletePrazo(id) {
    return deleteDoc(doc(db, 'prazos', id))
  }

  return { prazos, addPrazo, updatePrazo, deletePrazo }
}

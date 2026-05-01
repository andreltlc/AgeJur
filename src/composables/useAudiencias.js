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

    let ownItems = []
    let sharedItems = []

    function merge() {
      const map = new Map()
      ownItems.forEach(i => map.set(i.id, i))
      sharedItems.forEach(i => { if (!map.has(i.id)) map.set(i.id, i) })
      audiencias.value = [...map.values()]
    }

    const unsub1 = onSnapshot(
      query(collection(db, 'audiencias'), where('userId', '==', uid)),
      snap => { ownItems = snap.docs.map(d => ({ id: d.id, ...d.data() })); merge() },
    )

    const unsub2 = onSnapshot(
      query(collection(db, 'audiencias'), where('sharedWithUids', 'array-contains', uid)),
      snap => { sharedItems = snap.docs.map(d => ({ id: d.id, ...d.data() })); merge() },
    )

    onCleanup(() => { unsub1(); unsub2() })
  })

  function uid() {
    return isRef(userRef) ? userRef.value?.uid : userRef
  }

  async function addAudiencia(data, ownerApelido = '') {
    return addDoc(collection(db, 'audiencias'), {
      ...data,
      userId: uid(),
      ownerApelido,
      sharedWith: [],
      sharedWithUids: [],
      createdAt: serverTimestamp(),
    })
  }

  async function updateAudiencia(id, data) {
    return updateDoc(doc(db, 'audiencias', id), data)
  }

  async function deleteAudiencia(id) {
    return deleteDoc(doc(db, 'audiencias', id))
  }

  return { audiencias, addAudiencia, updateAudiencia, deleteAudiencia }
}

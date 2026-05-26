import { ref, isRef, watchEffect } from 'vue'
import type { Ref } from 'vue'
import type { User } from 'firebase/auth'
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Prazo, Protocol } from '../types'

/* ── Tipos de entrada ── */
type UserRef = Ref<User | null> | string | null

/** Campos que o caller fornece ao criar um prazo */
export interface PrazoInput {
  titulo: string
  obs?: string
  data: string
  completed: boolean
  completedDate?: string | null
  protocol?: Protocol | null
}

/** Campos que podem ser atualizados num prazo existente */
export type PrazoUpdate = Partial<
  Pick<Prazo, 'titulo' | 'obs' | 'data' | 'completed' | 'completedDate' | 'protocol'>
>

/* ── Helper ── */
function resolveUid(userRef: UserRef): string | undefined {
  if (!userRef) return undefined
  return isRef(userRef) ? (userRef.value?.uid ?? undefined) : userRef
}

export function usePrazos(userRef: UserRef) {
  const prazos = ref<Prazo[]>([])

  watchEffect(onCleanup => {
    const uid = resolveUid(userRef)
    if (!uid) return

    let ownItems:    Prazo[] = []
    let sharedItems: Prazo[] = []

    function merge() {
      const map = new Map<string, Prazo>()
      ownItems.forEach(i => map.set(i.id, i))
      sharedItems.forEach(i => { if (!map.has(i.id)) map.set(i.id, i) })
      prazos.value = [...map.values()]
    }

    const unsub1 = onSnapshot(
      query(collection(db, 'prazos'), where('userId', '==', uid)),
      snap => {
        ownItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as Prazo))
        merge()
      },
    )

    const unsub2 = onSnapshot(
      query(collection(db, 'prazos'), where('sharedWithUids', 'array-contains', uid)),
      snap => {
        sharedItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as Prazo))
        merge()
      },
    )

    onCleanup(() => { unsub1(); unsub2() })
  })

  async function addPrazo(data: PrazoInput, ownerApelido = '') {
    const uid = resolveUid(userRef)
    return addDoc(collection(db, 'prazos'), {
      ...data,
      userId: uid,
      ownerApelido,
      sharedWith: [],
      sharedWithUids: [],
      createdAt: serverTimestamp(),
    })
  }

  async function updatePrazo(id: string, data: PrazoUpdate) {
    return updateDoc(doc(db, 'prazos', id), data)
  }

  async function deletePrazo(id: string) {
    return deleteDoc(doc(db, 'prazos', id))
  }

  return { prazos, addPrazo, updatePrazo, deletePrazo }
}

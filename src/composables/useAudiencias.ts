import { ref, isRef, watchEffect } from 'vue'
import type { Ref } from 'vue'
import type { User } from 'firebase/auth'
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Audiencia } from '../types'

/* ── Tipos de entrada ── */
type UserRef = Ref<User | null> | string | null

/** Campos que o caller fornece ao criar uma audiência */
export interface AudienciaInput {
  titulo: string
  obs?: string
  data: string
  hora: string
  online: boolean
  local?: string
  link?: string
}

/** Campos que podem ser atualizados numa audiência existente */
export type AudienciaUpdate = Partial<
  Pick<Audiencia, 'titulo' | 'obs' | 'data' | 'hora' | 'online' | 'local' | 'link'>
>

/* ── Helper ── */
function resolveUid(userRef: UserRef): string | undefined {
  if (!userRef) return undefined
  return isRef(userRef) ? (userRef.value?.uid ?? undefined) : userRef
}

export function useAudiencias(userRef: UserRef) {
  const audiencias = ref<Audiencia[]>([])

  watchEffect(onCleanup => {
    const uid = resolveUid(userRef)
    if (!uid) return

    let ownItems:    Audiencia[] = []
    let sharedItems: Audiencia[] = []

    function merge() {
      const map = new Map<string, Audiencia>()
      ownItems.forEach(i => map.set(i.id, i))
      sharedItems.forEach(i => { if (!map.has(i.id)) map.set(i.id, i) })
      audiencias.value = [...map.values()]
    }

    const unsub1 = onSnapshot(
      query(collection(db, 'audiencias'), where('userId', '==', uid)),
      snap => {
        ownItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as Audiencia))
        merge()
      },
    )

    const unsub2 = onSnapshot(
      query(collection(db, 'audiencias'), where('sharedWithUids', 'array-contains', uid)),
      snap => {
        sharedItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as Audiencia))
        merge()
      },
    )

    onCleanup(() => { unsub1(); unsub2() })
  })

  async function addAudiencia(data: AudienciaInput, ownerApelido = '') {
    const uid = resolveUid(userRef)
    return addDoc(collection(db, 'audiencias'), {
      ...data,
      userId: uid,
      ownerApelido,
      sharedWith: [],
      sharedWithUids: [],
      createdAt: serverTimestamp(),
    })
  }

  async function updateAudiencia(id: string, data: AudienciaUpdate) {
    return updateDoc(doc(db, 'audiencias', id), data)
  }

  async function deleteAudiencia(id: string) {
    return deleteDoc(doc(db, 'audiencias', id))
  }

  return { audiencias, addAudiencia, updateAudiencia, deleteAudiencia }
}

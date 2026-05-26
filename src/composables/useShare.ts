import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import type { Profile, ShareEntry } from '../types'

type Colecao = 'prazos' | 'audiencias'

function normalizeApelido(apelido: string): string {
  return apelido.trim().toLowerCase().replace(/^@/, '')
}

export async function buscarPorApelido(apelido: string): Promise<Profile | null> {
  const norm = normalizeApelido(apelido)
  if (!norm) return null
  const snap = await getDocs(query(collection(db, 'users'), where('apelido', '==', norm)))
  if (snap.empty) return null
  return { uid: snap.docs[0].id, ...snap.docs[0].data() } as Profile
}

export async function compartilharItem(
  colecao: Colecao,
  itemId: string,
  targetUid: string,
  targetApelido: string,
  role: ShareEntry['role'],
) {
  const shareObj: ShareEntry = { uid: targetUid, apelido: normalizeApelido(targetApelido), role }
  return updateDoc(doc(db, colecao, itemId), {
    sharedWithUids: arrayUnion(targetUid),
    sharedWith:     arrayUnion(shareObj),
  })
}

export async function removerCompartilhamento(
  colecao: Colecao,
  itemId: string,
  shareObj: ShareEntry,
) {
  return updateDoc(doc(db, colecao, itemId), {
    sharedWithUids: arrayRemove(shareObj.uid),
    sharedWith:     arrayRemove(shareObj),
  })
}

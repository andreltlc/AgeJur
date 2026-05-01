import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'

function normalizeApelido(apelido) {
  return apelido.trim().toLowerCase().replace(/^@/, '')
}

export async function buscarPorApelido(apelido) {
  const norm = normalizeApelido(apelido)
  if (!norm) return null
  const snap = await getDocs(query(collection(db, 'users'), where('apelido', '==', norm)))
  if (snap.empty) return null
  return { uid: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function compartilharItem(colecao, itemId, targetUid, targetApelido, role) {
  const shareObj = { uid: targetUid, apelido: normalizeApelido(targetApelido), role }
  return updateDoc(doc(db, colecao, itemId), {
    sharedWithUids: arrayUnion(targetUid),
    sharedWith: arrayUnion(shareObj),
  })
}

export async function removerCompartilhamento(colecao, itemId, shareObj) {
  return updateDoc(doc(db, colecao, itemId), {
    sharedWithUids: arrayRemove(shareObj.uid),
    sharedWith: arrayRemove(shareObj),
  })
}

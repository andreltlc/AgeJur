/**
 * Tipos centrais do AgeJur
 * Espelham exatamente o que está salvo no Firestore — não altere os nomes
 * dos campos pois isso quebraria dados já existentes em produção.
 */

import type { Timestamp } from 'firebase/firestore'

/* ── Perfil do usuário (coleção: users/{uid}) ── */
export interface Profile {
  uid: string
  nome: string
  apelido: string
  email: string
  createdAt?: Timestamp
}

/* ── Entrada de compartilhamento ── */
export interface ShareEntry {
  uid: string
  apelido: string
  role: 'editor' | 'viewer'
}

/* ── Protocolo de conclusão de prazo ── */
export interface Protocol {
  type: 'text'
  content: string
}

/* ── Prazo (coleção: prazos/{id}) ── */
export interface Prazo {
  id: string
  userId: string
  ownerApelido: string
  titulo: string
  obs?: string
  data: string          // 'YYYY-MM-DD'
  completed: boolean
  completedDate?: string | null
  protocol?: Protocol | null
  sharedWith: ShareEntry[]
  sharedWithUids: string[]
  createdAt?: Timestamp
}

/* ── Audiência (coleção: audiencias/{id}) ── */
export interface Audiencia {
  id: string
  userId: string
  ownerApelido: string
  titulo: string
  obs?: string
  data: string          // 'YYYY-MM-DD'
  hora: string          // 'HH:MM'
  online: boolean
  local?: string
  link?: string
  sharedWith: ShareEntry[]
  sharedWithUids: string[]
  createdAt?: Timestamp
}

/* ── Role do usuário em relação a um item ── */
export type ItemRole = 'owner' | 'editor' | 'viewer'

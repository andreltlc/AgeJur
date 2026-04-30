<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  collection, doc, getDoc, addDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import '../assets/admin.css'

const router = useRouter()
const currentUser = ref(null)
const tokens = ref([])
let unsub = null

onAuthStateChanged(auth, async user => {
  if (!user) { router.replace('/login'); return }
  try {
    const configDoc = await getDoc(doc(db, 'config', 'admin'))
    if (!configDoc.exists() || configDoc.data().uid !== user.uid) {
      router.replace('/')
      return
    }
    currentUser.value = user
    iniciarListaTokens()
  } catch {
    router.replace('/')
  }
})

function iniciarListaTokens() {
  unsub = onSnapshot(
    query(collection(db, 'tokens'), orderBy('createdAt', 'desc')),
    snap => { tokens.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
  )
}

onUnmounted(() => { if (unsub) unsub() })

function logout() {
  signOut(auth).then(() => router.replace('/login'))
}

/* ── GERAÇÃO DE TOKEN ── */
const tokenGerado = ref(null)
const gerandoToken = ref(false)
const btnCopiarTxt = ref('📋 Copiar')

function gerarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function gerarToken() {
  gerandoToken.value = true
  try {
    const token = gerarCodigo()
    await addDoc(collection(db, 'tokens'), {
      token,
      used: false, usedBy: null, usedAt: null,
      createdBy: currentUser.value.uid,
      createdAt: serverTimestamp(),
    })
    tokenGerado.value = token
    btnCopiarTxt.value = '📋 Copiar'
  } catch (e) {
    alert('Erro ao gerar código: ' + e.message)
  } finally {
    gerandoToken.value = false
  }
}

function copiarToken() {
  if (!tokenGerado.value) return
  navigator.clipboard.writeText(tokenGerado.value).then(() => {
    btnCopiarTxt.value = '✓ Copiado!'
    setTimeout(() => { btnCopiarTxt.value = '📋 Copiar' }, 2500)
  })
}

async function revogarToken(id) {
  if (!confirm('Revogar este código? Quem o tiver recebido não poderá mais usá-lo.')) return
  try { await deleteDoc(doc(db, 'tokens', id)) } catch (e) { alert('Erro ao revogar: ' + e.message) }
}

/* ── UTILITÁRIOS ── */
const disponiveis = tokens => tokens.filter(t => !t.used)
const utilizados  = tokens => tokens.filter(t =>  t.used)

function formatarData(timestamp) {
  if (!timestamp?.toDate) return '—'
  const d = timestamp.toDate()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
</script>

<template>
  <div v-if="currentUser">

    <header class="admin-header">
      <div class="admin-header-left">
        <span>⚖️</span>
        <div>
          <strong>Agenda Jurídica</strong>
          <span class="admin-badge">Admin</span>
        </div>
      </div>
      <div class="admin-header-actions">
        <router-link to="/" class="btn btn-sm admin-btn-outline">← Voltar ao app</router-link>
        <button class="btn btn-danger btn-sm" @click="logout">Sair</button>
      </div>
    </header>

    <div class="admin-main">
      <div class="admin-card">

        <div class="admin-card-header">
          <h2>🔑 Códigos de acesso</h2>
          <button class="btn btn-primary" @click="gerarToken" :disabled="gerandoToken">
            {{ gerandoToken ? 'Gerando...' : '+ Gerar código' }}
          </button>
        </div>

        <!-- Token gerado -->
        <div v-if="tokenGerado" class="token-gerado">
          <p>Código gerado com sucesso! Compartilhe com o cliente:</p>
          <div class="token-display">
            <span class="token-valor">{{ tokenGerado }}</span>
            <button class="btn btn-outline-dark btn-sm" @click="copiarToken">{{ btnCopiarTxt }}</button>
          </div>
        </div>

        <!-- Lista de tokens -->
        <template v-if="tokens.length === 0">
          <div class="empty-state">
            <div class="icon">🔑</div>
            <p>Nenhum código gerado ainda.</p>
          </div>
        </template>

        <template v-else>
          <div v-if="disponiveis(tokens).length > 0">
            <div class="tokens-section-label">Disponíveis ({{ disponiveis(tokens).length }})</div>
            <div v-for="t in disponiveis(tokens)" :key="t.id" class="token-card">
              <div class="token-code">{{ t.token }}</div>
              <div class="token-info">
                <span class="tag tag-disponivel">⏳ Disponível</span>
                <span class="token-meta">gerado em {{ formatarData(t.createdAt) }}</span>
              </div>
              <button class="btn btn-danger btn-sm" @click="revogarToken(t.id)">Revogar</button>
            </div>
          </div>

          <div v-if="utilizados(tokens).length > 0">
            <div class="tokens-section-label">Utilizados ({{ utilizados(tokens).length }})</div>
            <div v-for="t in utilizados(tokens)" :key="t.id" class="token-card usado">
              <div class="token-code riscado">{{ t.token }}</div>
              <div class="token-info">
                <span class="tag tag-usado">✓ Utilizado</span>
                <span class="token-meta">por {{ t.usedBy || '?' }} em {{ formatarData(t.usedAt) }}</span>
              </div>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

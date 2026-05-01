<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  onAuthStateChanged, signOut, sendPasswordResetEmail,
} from 'firebase/auth'
import {
  collection, doc, getDoc, addDoc, deleteDoc, setDoc,
  query, orderBy, onSnapshot, where, getDocs, serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import '../assets/admin.css'

const router = useRouter()
const currentUser = ref(null)
const abaAtiva = ref('usuarios')

/* ── AUTH GUARD ── */
let unsubTokens = null
let unsubUsers = null

onAuthStateChanged(auth, async user => {
  if (!user) { router.replace('/login'); return }
  try {
    const configDoc = await getDoc(doc(db, 'config', 'admin'))
    if (!configDoc.exists() || configDoc.data().uid !== user.uid) {
      router.replace('/'); return
    }
    currentUser.value = user
    iniciarListaTokens()
    iniciarListaUsuarios()
  } catch {
    router.replace('/')
  }
})

onUnmounted(() => {
  if (unsubTokens) unsubTokens()
  if (unsubUsers) unsubUsers()
})

function logout() {
  signOut(auth).then(() => router.replace('/login'))
}

/* ══════════════════════════════════════
   ABA USUÁRIOS
══════════════════════════════════════ */
const users = ref([])
const userSearch = ref('')

function iniciarListaUsuarios() {
  unsubUsers = onSnapshot(
    collection(db, 'users'),
    snap => {
      users.value = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0
          const tb = b.createdAt?.toMillis?.() ?? 0
          return tb - ta
        })
    },
    err => { console.error('Admin/users:', err.message) },
  )
}

const usuariosFiltrados = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.nome?.toLowerCase().includes(q) ||
    u.apelido?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q),
  )
})

/* Reset de senha */
const resetStatus = ref({}) // uid → 'sending' | 'sent' | 'error'

async function enviarResetSenha(user) {
  resetStatus.value[user.id] = 'sending'
  try {
    await sendPasswordResetEmail(auth, user.email)
    resetStatus.value[user.id] = 'sent'
    setTimeout(() => { delete resetStatus.value[user.id] }, 4000)
  } catch {
    resetStatus.value[user.id] = 'error'
    setTimeout(() => { delete resetStatus.value[user.id] }, 4000)
  }
}

/* Editar usuário */
const mEditUser = ref({ open: false, uid: null, nome: '', apelido: '', email: '', erro: '', salvando: false })

function abrirEditUser(user) {
  mEditUser.value = {
    open: true, uid: user.id,
    nome: user.nome || '',
    apelido: user.apelido || '',
    email: user.email || '',
    erro: '', salvando: false,
  }
}

function onApelidoEditInput(e) {
  mEditUser.value.apelido = e.target.value.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '')
}

async function salvarEditUser() {
  mEditUser.value.erro = ''
  const { uid, nome, apelido } = mEditUser.value
  if (!nome.trim()) { mEditUser.value.erro = 'Informe o nome.'; return }
  if (apelido.length < 3) { mEditUser.value.erro = 'Apelido deve ter pelo menos 3 caracteres.'; return }

  mEditUser.value.salvando = true
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('apelido', '==', apelido)))
    const conflito = snap.docs.find(d => d.id !== uid)
    if (conflito) { mEditUser.value.erro = 'Este apelido já está em uso.'; return }

    const emailVal = mEditUser.value.email.trim()
    await setDoc(doc(db, 'users', uid), {
      nome: nome.trim(),
      apelido,
      ...(emailVal && { email: emailVal }),
    }, { merge: true })
    mEditUser.value.open = false
  } catch (e) {
    mEditUser.value.erro = 'Erro ao salvar: ' + e.message
  } finally {
    mEditUser.value.salvando = false
  }
}

/* ══════════════════════════════════════
   ABA TOKENS
══════════════════════════════════════ */
const tokens = ref([])
const tokenGerado = ref(null)
const gerandoToken = ref(false)
const btnCopiarTxt = ref('📋 Copiar')

function iniciarListaTokens() {
  unsubTokens = onSnapshot(
    query(collection(db, 'tokens'), orderBy('createdAt', 'desc')),
    snap => { tokens.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
  )
}

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
      token, used: false, usedBy: null, usedAt: null,
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
  if (!confirm('Revogar este código?')) return
  try { await deleteDoc(doc(db, 'tokens', id)) } catch (e) { alert('Erro: ' + e.message) }
}

const disponiveis = t => t.filter(x => !x.used)
const utilizados  = t => t.filter(x =>  x.used)

/* ── UTILITÁRIOS ── */
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

      <!-- Abas -->
      <div class="admin-tabs">
        <button :class="['admin-tab', abaAtiva === 'usuarios' && 'active']" @click="abaAtiva = 'usuarios'">
          👤 Usuários <span class="admin-tab-count">{{ users.length }}</span>
        </button>
        <button :class="['admin-tab', abaAtiva === 'tokens' && 'active']" @click="abaAtiva = 'tokens'">
          🔑 Tokens <span class="admin-tab-count">{{ disponiveis(tokens).length }}</span>
        </button>
      </div>

      <!-- ══ ABA USUÁRIOS ══ -->
      <div v-if="abaAtiva === 'usuarios'" class="admin-card">

        <div class="admin-card-header">
          <h2>👤 Usuários cadastrados</h2>
        </div>

        <div class="admin-search-row">
          <input v-model="userSearch" type="text" placeholder="Buscar por nome, @apelido ou e-mail…" class="admin-search">
        </div>

        <div v-if="usuariosFiltrados.length === 0" class="empty-state">
          <div class="icon">👤</div>
          <p>Nenhum usuário encontrado.</p>
        </div>

        <div v-for="u in usuariosFiltrados" :key="u.id" class="user-card">
          <div class="user-info">
            <div class="user-nome">{{ u.nome || '(sem nome)' }}</div>
            <div class="user-meta">
              <span class="user-apelido">@{{ u.apelido || '—' }}</span>
              <span class="user-email">{{ u.email }}</span>
              <span class="user-data">desde {{ formatarData(u.createdAt) }}</span>
            </div>
          </div>
          <div class="user-actions">
            <button class="btn btn-sm btn-outline-dark" @click="abrirEditUser(u)" title="Editar dados">
              ✏️ Editar
            </button>
            <button
              class="btn btn-sm"
              :class="resetStatus[u.id] === 'sent' ? 'btn-success' : resetStatus[u.id] === 'error' ? 'btn-danger' : 'btn-outline-dark'"
              :disabled="resetStatus[u.id] === 'sending'"
              @click="enviarResetSenha(u)"
              title="Enviar e-mail de redefinição de senha"
            >
              <template v-if="!resetStatus[u.id]">🔒 Reset senha</template>
              <template v-else-if="resetStatus[u.id] === 'sending'">Enviando…</template>
              <template v-else-if="resetStatus[u.id] === 'sent'">✓ E-mail enviado</template>
              <template v-else>✗ Erro</template>
            </button>
          </div>
        </div>

      </div>

      <!-- ══ ABA TOKENS ══ -->
      <div v-if="abaAtiva === 'tokens'" class="admin-card">

        <div class="admin-card-header">
          <h2>🔑 Códigos de acesso</h2>
          <button class="btn btn-primary" @click="gerarToken" :disabled="gerandoToken">
            {{ gerandoToken ? 'Gerando...' : '+ Gerar código' }}
          </button>
        </div>

        <div v-if="tokenGerado" class="token-gerado">
          <p>Código gerado! Compartilhe com o usuário:</p>
          <div class="token-display">
            <span class="token-valor">{{ tokenGerado }}</span>
            <button class="btn btn-outline-dark btn-sm" @click="copiarToken">{{ btnCopiarTxt }}</button>
          </div>
        </div>

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

    <!-- ══ MODAL EDITAR USUÁRIO ══ -->
    <div v-if="mEditUser.open" class="modal-overlay open" @click.self="mEditUser.open = false">
      <div class="modal">
        <div class="modal-header">
          <h3>✏️ Editar usuário</h3>
          <button class="modal-close" @click="mEditUser.open = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nome completo</label>
            <input type="text" v-model="mEditUser.nome" placeholder="Nome do usuário">
          </div>
          <div class="form-group">
            <label>Apelido</label>
            <div class="apelido-input-wrap">
              <span class="apelido-prefix">@</span>
              <input type="text" :value="mEditUser.apelido" @input="onApelidoEditInput"
                     placeholder="apelido" autocomplete="off" spellcheck="false" maxlength="20">
            </div>
          </div>
          <div class="form-group">
            <label>E-mail de login</label>
            <input type="email" v-model="mEditUser.email" placeholder="email@exemplo.com">
          </div>
          <div v-if="mEditUser.erro" class="auth-erro">{{ mEditUser.erro }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="mEditUser.open = false">Cancelar</button>
          <button class="btn btn-primary" @click="salvarEditUser" :disabled="mEditUser.salvando">
            {{ mEditUser.salvando ? 'Salvando…' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

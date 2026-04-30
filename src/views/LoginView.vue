<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import {
  collection, query, where, getDocs,
  doc, updateDoc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

const router = useRouter()
const view = ref('login')

const showIosBanner = ref(false)
onMounted(() => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (isIOS && !window.navigator.standalone) showIosBanner.value = true
})

onAuthStateChanged(auth, user => {
  if (user) router.replace('/')
})

/* ── LOGIN ── */
const loginEmail   = ref('')
const loginSenha   = ref('')
const loginErro    = ref('')
const loginLoading = ref(false)

async function fazerLogin() {
  loginErro.value = ''
  if (!loginEmail.value || !loginSenha.value) {
    loginErro.value = 'Preencha e-mail e senha.'
    return
  }
  loginLoading.value = true
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginSenha.value)
  } catch (e) {
    loginErro.value = traduzirErro(e.code)
  } finally {
    loginLoading.value = false
  }
}

/* ── TOKEN ── */
const tokenInput   = ref('')
const tokenErro    = ref('')
const tokenLoading = ref(false)
const tokenDocId   = ref('')

function onTokenInput(e) {
  let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (v.length > 4) v = v.slice(0, 4) + '-' + v.slice(4, 8)
  tokenInput.value = v
}

async function validarToken() {
  tokenErro.value = ''
  if (tokenInput.value.length < 9) {
    tokenErro.value = 'Código inválido. Formato esperado: XXXX-XXXX'
    return
  }
  tokenLoading.value = true
  try {
    const snap = await getDocs(
      query(
        collection(db, 'tokens'),
        where('token', '==', tokenInput.value),
        where('used', '==', false),
      ),
    )
    if (snap.empty) {
      tokenErro.value = 'Código inválido ou já utilizado.'
    } else {
      tokenDocId.value = snap.docs[0].id
      view.value = 'registro'
    }
  } catch {
    tokenErro.value = 'Erro ao verificar. Tente novamente.'
  } finally {
    tokenLoading.value = false
  }
}

/* ── REGISTRO ── */
const regEmail   = ref('')
const regSenha   = ref('')
const regSenha2  = ref('')
const regErro    = ref('')
const regLoading = ref(false)

async function criarConta() {
  regErro.value = ''
  if (!regEmail.value || !regSenha.value) { regErro.value = 'Preencha todos os campos.'; return }
  if (regSenha.value !== regSenha2.value)  { regErro.value = 'As senhas não coincidem.'; return }
  if (regSenha.value.length < 6)           { regErro.value = 'A senha deve ter pelo menos 6 caracteres.'; return }

  regLoading.value = true
  try {
    const cred = await createUserWithEmailAndPassword(auth, regEmail.value.trim(), regSenha.value)
    await updateDoc(doc(db, 'tokens', tokenDocId.value), {
      used: true, usedBy: regEmail.value, usedAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: regEmail.value, tokenDocId: tokenDocId.value, createdAt: serverTimestamp(),
    })
  } catch (e) {
    regErro.value = traduzirErro(e.code)
    regLoading.value = false
  }
}

/* ── ESQUECI ── */
const esqueciEmail   = ref('')
const esqueciErro    = ref('')
const esqueciOk      = ref(false)
const esqueciLoading = ref(false)

async function enviarReset() {
  esqueciErro.value = ''
  esqueciOk.value = false
  if (!esqueciEmail.value) { esqueciErro.value = 'Informe seu e-mail.'; return }
  esqueciLoading.value = true
  try {
    await sendPasswordResetEmail(auth, esqueciEmail.value.trim())
    esqueciOk.value = true
  } catch (e) {
    esqueciErro.value = traduzirErro(e.code)
  } finally {
    esqueciLoading.value = false
  }
}

/* ── UTILITÁRIOS ── */
function traduzirErro(code) {
  const erros = {
    'auth/user-not-found':        'E-mail não encontrado.',
    'auth/wrong-password':        'Senha incorreta.',
    'auth/invalid-email':         'E-mail inválido.',
    'auth/email-already-in-use':  'Este e-mail já está cadastrado.',
    'auth/weak-password':         'Senha muito fraca. Use pelo menos 6 caracteres.',
    'auth/too-many-requests':     'Muitas tentativas. Aguarde alguns minutos.',
    'auth/invalid-credential':    'E-mail ou senha incorretos.',
    'auth/network-request-failed':'Sem conexão. Verifique sua internet.',
  }
  return erros[code] || 'Erro inesperado. Tente novamente.'
}
</script>

<template>
  <div class="auth-page">

    <div v-if="showIosBanner" class="ios-banner">
      <span class="ios-banner-icon">📲</span>
      <span>Para instalar: toque em <strong>Compartilhar</strong> e depois em <strong>"Adicionar à Tela de Início"</strong></span>
      <button @click="showIosBanner = false">✕</button>
    </div>

    <div class="auth-card">

      <div class="auth-logo">
        <span class="auth-icon">⚖️</span>
        <h1>Agenda Jurídica</h1>
        <p>Controle de prazos e audiências</p>
      </div>

      <!-- LOGIN -->
      <div v-if="view === 'login'">
        <h2>Entrar</h2>
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" v-model="loginEmail" placeholder="seu@email.com" autocomplete="email">
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input type="password" v-model="loginSenha" placeholder="••••••••"
                 autocomplete="current-password" @keydown.enter="fazerLogin">
        </div>
        <div v-if="loginErro" class="auth-erro">{{ loginErro }}</div>
        <button class="btn btn-primary btn-full" @click="fazerLogin" :disabled="loginLoading">
          {{ loginLoading ? 'Entrando...' : 'Entrar' }}
        </button>
        <div class="auth-link-row">
          <a href="#" @click.prevent="view = 'esqueci'">Esqueci minha senha</a>
          <span>·</span>
          <a href="#" @click.prevent="view = 'token'">Primeiro acesso</a>
        </div>
      </div>

      <!-- TOKEN -->
      <div v-else-if="view === 'token'">
        <h2>Código de acesso</h2>
        <p class="auth-info">Digite o código que você recebeu para criar sua conta.</p>
        <div class="form-group">
          <label>Código</label>
          <input type="text" :value="tokenInput" @input="onTokenInput"
                 placeholder="XXXX-XXXX" maxlength="9" autocomplete="off" spellcheck="false"
                 class="token-field" @keydown.enter="validarToken">
        </div>
        <div v-if="tokenErro" class="auth-erro">{{ tokenErro }}</div>
        <button class="btn btn-primary btn-full" @click="validarToken" :disabled="tokenLoading">
          {{ tokenLoading ? 'Verificando...' : 'Validar código' }}
        </button>
        <div class="auth-link-row">
          <a href="#" @click.prevent="view = 'login'">Voltar ao login</a>
        </div>
      </div>

      <!-- REGISTRO -->
      <div v-else-if="view === 'registro'">
        <h2>Criar conta</h2>
        <p class="auth-info">Código válido! Defina seu e-mail e senha de acesso.</p>
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" v-model="regEmail" placeholder="seu@email.com" autocomplete="email">
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input type="password" v-model="regSenha" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label>Confirmar senha</label>
          <input type="password" v-model="regSenha2" placeholder="Repita a senha" autocomplete="new-password">
        </div>
        <div v-if="regErro" class="auth-erro">{{ regErro }}</div>
        <button class="btn btn-primary btn-full" @click="criarConta" :disabled="regLoading">
          {{ regLoading ? 'Criando conta...' : 'Criar conta' }}
        </button>
      </div>

      <!-- ESQUECI -->
      <div v-else-if="view === 'esqueci'">
        <h2>Redefinir senha</h2>
        <p class="auth-info">Informe seu e-mail para receber o link de redefinição.</p>
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" v-model="esqueciEmail" placeholder="seu@email.com" autocomplete="email">
        </div>
        <div v-if="esqueciErro" class="auth-erro">{{ esqueciErro }}</div>
        <div v-if="esqueciOk" class="auth-ok">E-mail enviado! Verifique sua caixa de entrada.</div>
        <button class="btn btn-primary btn-full" @click="enviarReset" :disabled="esqueciLoading">
          {{ esqueciLoading ? 'Enviando...' : 'Enviar link' }}
        </button>
        <div class="auth-link-row">
          <a href="#" @click.prevent="view = 'login'">Voltar ao login</a>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.token-field {
  text-transform: uppercase;
  letter-spacing: 3px;
  font-size: 1.1rem;
  text-align: center;
  font-family: monospace;
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { auth } from '../firebase'

const router = useRouter()
const route = useRoute()

const mode = ref('')
const oobCode = ref('')
const email = ref('')

const novaSenha = ref('')
const confirmSenha = ref('')
const erro = ref('')
const sucesso = ref(false)
const loading = ref(false)
const verificando = ref(true)
const codigoInvalido = ref(false)

onMounted(async () => {
  mode.value = route.query.mode || ''
  oobCode.value = route.query.oobCode || ''

  if (!oobCode.value) {
    codigoInvalido.value = true
    verificando.value = false
    return
  }

  if (mode.value === 'resetPassword') {
    try {
      email.value = await verifyPasswordResetCode(auth, oobCode.value)
    } catch {
      codigoInvalido.value = true
    } finally {
      verificando.value = false
    }
  } else {
    verificando.value = false
    codigoInvalido.value = true
  }
})

async function redefinirSenha() {
  erro.value = ''
  if (novaSenha.value.length < 6) {
    erro.value = 'A senha deve ter pelo menos 6 caracteres.'
    return
  }
  if (novaSenha.value !== confirmSenha.value) {
    erro.value = 'As senhas não coincidem.'
    return
  }
  loading.value = true
  try {
    await confirmPasswordReset(auth, oobCode.value, novaSenha.value)
    sucesso.value = true
  } catch (e) {
    if (e.code === 'auth/expired-action-code') {
      erro.value = 'O link expirou. Peça um novo e-mail de redefinição.'
    } else if (e.code === 'auth/invalid-action-code') {
      erro.value = 'Link inválido ou já utilizado.'
    } else if (e.code === 'auth/weak-password') {
      erro.value = 'Senha muito fraca. Use pelo menos 6 caracteres.'
    } else {
      erro.value = 'Erro ao redefinir senha. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <span class="auth-icon">⚖️</span>
        <h1>Agenda Jurídica</h1>
      </div>

      <div v-if="verificando" class="auth-info">Verificando link…</div>

      <div v-else-if="codigoInvalido">
        <h2>Link inválido</h2>
        <p class="auth-info">
          Este link de redefinição é inválido ou já foi utilizado.
          Solicite um novo link na tela de login.
        </p>
        <button class="btn btn-primary btn-full" @click="router.replace('/login')">
          Ir para o login
        </button>
      </div>

      <div v-else-if="sucesso">
        <h2>Senha redefinida!</h2>
        <p class="auth-info">
          Sua senha foi alterada com sucesso. Você já pode entrar com a nova senha.
        </p>
        <button class="btn btn-primary btn-full" @click="router.replace('/login')">
          Ir para o login
        </button>
      </div>

      <div v-else>
        <h2>Redefinir senha</h2>
        <p class="auth-info">
          Conta: <strong>{{ email }}</strong>
        </p>
        <div class="form-group">
          <label>Nova senha</label>
          <input
            type="password"
            v-model="novaSenha"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
          >
        </div>
        <div class="form-group">
          <label>Confirmar nova senha</label>
          <input
            type="password"
            v-model="confirmSenha"
            placeholder="Repita a nova senha"
            autocomplete="new-password"
            @keydown.enter="redefinirSenha"
          >
        </div>
        <div v-if="erro" class="auth-erro">{{ erro }}</div>
        <button class="btn btn-primary btn-full" @click="redefinirSenha" :disabled="loading">
          {{ loading ? 'Salvando…' : 'Salvar nova senha' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { usePrazos } from '../composables/usePrazos'
import { useAudiencias } from '../composables/useAudiencias'
import { todayStr, formatDate, urgencyLabel, urgencyClass, audienciaUrgencyLabel, audienciaUrgencyClass } from '../utils'

const router = useRouter()
const currentUser = ref(null)

/* ── AUTH ── */
onAuthStateChanged(auth, user => {
  if (!user) { router.replace('/login'); return }
  currentUser.value = user
})

function logout() {
  signOut(auth).then(() => router.replace('/login'))
}

/* ── iOS BANNER ── */
const showIosBanner = ref(false)
onMounted(() => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (isIOS && !window.navigator.standalone) showIosBanner.value = true
})

/* ── ABAS MOBILE ── */
const activeTab = ref('prazos')

/* ── PRAZOS ── */
const { prazos, addPrazo, updatePrazo, deletePrazo } = usePrazos(currentUser)

const pendentes = computed(() =>
  prazos.value.filter(p => !p.completed).sort((a, b) => a.data.localeCompare(b.data)),
)

const concluidos = computed(() =>
  prazos.value
    .filter(p => p.completed)
    .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || '')),
)

/* Modal prazo */
const mp = reactive({ open: false, editId: null, titulo: '', obs: '', data: '', saving: false })

function abrirModalPrazo(id = null) {
  mp.editId = id
  mp.titulo = ''
  mp.obs = ''
  mp.data = ''
  if (id) {
    const p = prazos.value.find(x => x.id === id)
    if (p) { mp.titulo = p.titulo; mp.obs = p.obs || ''; mp.data = p.data }
  }
  mp.open = true
}

async function salvarPrazo() {
  if (!mp.titulo.trim() || !mp.data) { alert('Preencha a descrição e a data limite.'); return }
  mp.saving = true
  try {
    if (mp.editId) {
      await updatePrazo(mp.editId, { titulo: mp.titulo.trim(), obs: mp.obs.trim(), data: mp.data })
    } else {
      await addPrazo({ titulo: mp.titulo.trim(), obs: mp.obs.trim(), data: mp.data, completed: false, completedDate: null, protocol: null })
    }
    mp.open = false
  } catch (e) {
    alert('Erro ao salvar: ' + e.message)
  } finally {
    mp.saving = false
  }
}

async function confirmarDeletarPrazo(id) {
  if (!confirm('Excluir este prazo?')) return
  try { await deletePrazo(id) } catch (e) { alert('Erro ao excluir: ' + e.message) }
}

/* Modal protocolo */
const mpr = reactive({ open: false, prazoId: '', texto: '', saving: false })

function abrirModalProtocolo(id) {
  mpr.prazoId = id
  mpr.texto = ''
  mpr.open = true
}

async function confirmarConclusao() {
  mpr.saving = true
  try {
    const protocol = mpr.texto.trim() ? { type: 'text', content: mpr.texto.trim() } : null
    await updatePrazo(mpr.prazoId, { completed: true, completedDate: todayStr(), protocol })
    mpr.open = false
  } catch (e) {
    alert('Erro ao concluir: ' + e.message)
  } finally {
    mpr.saving = false
  }
}

/* Modal ver protocolo */
const mvp = reactive({ open: false, content: '' })

function verProtocolo(id) {
  const p = prazos.value.find(x => x.id === id)
  if (!p?.protocol) return
  mvp.content = p.protocol.content
  mvp.open = true
}

/* ── AUDIÊNCIAS ── */
const { audiencias, addAudiencia, updateAudiencia, deleteAudiencia } = useAudiencias(currentUser)

const hoje = todayStr()

const proximas = computed(() =>
  [...audiencias.value]
    .sort((a, b) => (a.data + 'T' + a.hora).localeCompare(b.data + 'T' + b.hora))
    .filter(a => a.data >= hoje),
)

const passadas = computed(() =>
  [...audiencias.value]
    .sort((a, b) => (a.data + 'T' + a.hora).localeCompare(b.data + 'T' + b.hora))
    .filter(a => a.data < hoje)
    .reverse(),
)

/* Modal audiência */
const ma = reactive({
  open: false, editId: null,
  titulo: '', data: '', hora: '', online: false, local: '', link: '', obs: '',
  saving: false,
})

function abrirModalAudiencia(id = null) {
  ma.editId = id
  ma.titulo = ''; ma.data = ''; ma.hora = ''; ma.online = false
  ma.local = ''; ma.link = ''; ma.obs = ''
  if (id) {
    const a = audiencias.value.find(x => x.id === id)
    if (a) {
      ma.titulo = a.titulo; ma.data = a.data; ma.hora = a.hora
      ma.online = a.online; ma.local = a.local || ''; ma.link = a.link || ''; ma.obs = a.obs || ''
    }
  }
  ma.open = true
}

async function salvarAudiencia() {
  if (!ma.titulo.trim() || !ma.data || !ma.hora) { alert('Preencha a descrição, data e horário.'); return }
  if (ma.online && !ma.link.trim()) { alert('Informe o link da audiência online.'); return }
  if (!ma.online && !ma.local.trim()) { alert('Informe o local da audiência.'); return }

  ma.saving = true
  const obj = {
    titulo: ma.titulo.trim(), data: ma.data, hora: ma.hora, online: ma.online,
    obs: ma.obs.trim(),
    local: ma.online ? '' : ma.local.trim(),
    link:  ma.online ? ma.link.trim() : '',
  }
  try {
    if (ma.editId) {
      await updateAudiencia(ma.editId, obj)
    } else {
      await addAudiencia(obj)
    }
    ma.open = false
  } catch (e) {
    alert('Erro ao salvar: ' + e.message)
  } finally {
    ma.saving = false
  }
}

async function confirmarDeletarAudiencia(id) {
  if (!confirm('Excluir esta audiência?')) return
  try { await deleteAudiencia(id) } catch (e) { alert('Erro ao excluir: ' + e.message) }
}
</script>

<template>
  <div v-if="currentUser">

    <!-- HEADER -->
    <header>
      <span class="header-icon">⚖️</span>
      <div class="header-info">
        <h1>Agenda Jurídica</h1>
        <div class="subtitle">Controle de prazos e audiências</div>
      </div>
      <div class="header-actions">
        <span class="user-email">{{ currentUser.email }}</span>
        <button @click="logout" class="btn-sair">Sair</button>
      </div>
    </header>

    <!-- iOS BANNER -->
    <div v-if="showIosBanner" class="ios-banner">
      <span class="ios-banner-icon">📲</span>
      <span>Para instalar: toque em <strong>Compartilhar</strong> e depois em <strong>"Adicionar à Tela de Início"</strong></span>
      <button @click="showIosBanner = false">✕</button>
    </div>

    <!-- ABAS MOBILE -->
    <div class="mobile-tabs">
      <button :class="{ active: activeTab === 'prazos' }" @click="activeTab = 'prazos'">⏳ Prazos</button>
      <button :class="{ active: activeTab === 'audiencias' }" @click="activeTab = 'audiencias'">🎤 Audiências</button>
    </div>

    <!-- COLUNAS -->
    <div class="main">

      <!-- PRAZOS -->
      <div class="column" :class="{ active: activeTab === 'prazos' }">
        <div class="column-header">
          <div class="column-title">
            <span class="icon">⏳</span>
            <h2>Prazos</h2>
            <span class="badge">{{ pendentes.length }}</span>
          </div>
          <button class="btn btn-primary" @click="abrirModalPrazo()">+ Novo Prazo</button>
        </div>

        <div class="items-list">
          <template v-if="prazos.length === 0">
            <div class="empty-state">
              <div class="icon">📋</div>
              <p>Nenhum prazo cadastrado.</p>
            </div>
          </template>

          <template v-else>
            <div v-if="pendentes.length > 0" class="section-label">Pendentes</div>
            <div v-for="p in pendentes" :key="p.id" class="card">
              <div class="card-top">
                <div>
                  <div class="card-title">{{ p.titulo }}</div>
                  <div v-if="p.obs" class="card-desc">{{ p.obs }}</div>
                </div>
                <div class="card-actions">
                  <button class="btn btn-outline btn-sm" @click="abrirModalPrazo(p.id)" title="Editar">✏️</button>
                  <button class="btn btn-success btn-sm" @click="abrirModalProtocolo(p.id)" title="Concluir">✓</button>
                  <button class="btn btn-danger btn-sm" @click="confirmarDeletarPrazo(p.id)" title="Excluir">🗑</button>
                </div>
              </div>
              <div class="card-meta">
                <span class="tag tag-date">📅 {{ formatDate(p.data) }}</span>
                <span class="tag" :class="urgencyClass(p.data)">{{ urgencyLabel(p.data) }}</span>
              </div>
            </div>

            <div v-if="concluidos.length > 0" class="section-label" style="margin-top:0.5rem">Concluídos</div>
            <div v-for="p in concluidos" :key="p.id" class="card completed">
              <div class="card-top">
                <div>
                  <div class="card-title strikethrough">{{ p.titulo }}</div>
                  <div v-if="p.obs" class="card-desc">{{ p.obs }}</div>
                </div>
                <div class="card-actions">
                  <button class="btn btn-danger btn-sm" @click="confirmarDeletarPrazo(p.id)" title="Excluir">🗑</button>
                </div>
              </div>
              <div class="card-meta">
                <span class="tag tag-date">📅 {{ formatDate(p.data) }}</span>
                <span class="tag tag-done">✅ Concluído em {{ formatDate(p.completedDate) }}</span>
                <span v-if="p.protocol" class="protocol-badge" @click="verProtocolo(p.id)">📎 Ver protocolo</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- AUDIÊNCIAS -->
      <div class="column" :class="{ active: activeTab === 'audiencias' }">
        <div class="column-header hearings">
          <div class="column-title">
            <span class="icon">🎤</span>
            <h2>Audiências</h2>
            <span class="badge gold">{{ audiencias.length }}</span>
          </div>
          <button class="btn btn-gold" @click="abrirModalAudiencia()">+ Nova Audiência</button>
        </div>

        <div class="items-list">
          <template v-if="audiencias.length === 0">
            <div class="empty-state">
              <div class="icon">🎤</div>
              <p>Nenhuma audiência cadastrada.</p>
            </div>
          </template>

          <template v-else>
            <div v-if="proximas.length > 0" class="section-label">Próximas</div>
            <div v-for="a in proximas" :key="a.id" class="card">
              <div class="card-top">
                <div>
                  <div class="card-title">{{ a.titulo }}</div>
                  <div v-if="a.obs" class="card-desc">{{ a.obs }}</div>
                </div>
                <div class="card-actions">
                  <button class="btn btn-outline btn-sm" @click="abrirModalAudiencia(a.id)" title="Editar">✏️</button>
                  <button class="btn btn-danger btn-sm" @click="confirmarDeletarAudiencia(a.id)" title="Excluir">🗑</button>
                </div>
              </div>
              <div class="card-meta">
                <span class="tag tag-date">📅 {{ formatDate(a.data) }} às {{ a.hora }}</span>
                <span v-if="a.online" class="tag tag-online">💻 Online</span>
                <a v-if="a.online" :href="a.link" target="_blank" rel="noopener" class="tag-link">🔗 Entrar na reunião</a>
                <span v-else class="tag tag-location">📍 {{ a.local }}</span>
                <span class="tag" :class="audienciaUrgencyClass(a.data)">{{ audienciaUrgencyLabel(a.data) }}</span>
              </div>
            </div>

            <div v-if="passadas.length > 0" class="section-label" style="margin-top:0.5rem">Realizadas</div>
            <div v-for="a in passadas" :key="a.id" class="card completed">
              <div class="card-top">
                <div>
                  <div class="card-title strikethrough">{{ a.titulo }}</div>
                  <div v-if="a.obs" class="card-desc">{{ a.obs }}</div>
                </div>
                <div class="card-actions">
                  <button class="btn btn-outline btn-sm" @click="abrirModalAudiencia(a.id)" title="Editar">✏️</button>
                  <button class="btn btn-danger btn-sm" @click="confirmarDeletarAudiencia(a.id)" title="Excluir">🗑</button>
                </div>
              </div>
              <div class="card-meta">
                <span class="tag tag-date">📅 {{ formatDate(a.data) }} às {{ a.hora }}</span>
                <a v-if="a.online" :href="a.link" target="_blank" rel="noopener" class="tag-link">🔗 Link da reunião</a>
                <span v-else class="tag tag-location">📍 {{ a.local }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

    </div><!-- /.main -->

    <!-- MODAL: Novo/Editar Prazo -->
    <div class="modal-overlay" :class="{ open: mp.open }" @click.self="mp.open = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">⏳ {{ mp.editId ? 'Editar Prazo' : 'Novo Prazo' }}</div>
          <button class="modal-close" @click="mp.open = false">✕</button>
        </div>
        <div class="form-group">
          <label>Descrição do Prazo *</label>
          <input type="text" v-model="mp.titulo" placeholder="Ex: Recurso de Apelação – Processo 0001234-56">
        </div>
        <div class="form-group">
          <label>Observações</label>
          <textarea v-model="mp.obs" placeholder="Detalhes adicionais..."></textarea>
        </div>
        <div class="form-group">
          <label>Data limite *</label>
          <input type="date" v-model="mp.data">
        </div>
        <div class="form-actions">
          <button class="btn btn-outline" @click="mp.open = false">Cancelar</button>
          <button class="btn btn-primary" @click="salvarPrazo" :disabled="mp.saving">
            {{ mp.saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Nova/Editar Audiência -->
    <div class="modal-overlay" :class="{ open: ma.open }" @click.self="ma.open = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">🎤 {{ ma.editId ? 'Editar Audiência' : 'Nova Audiência' }}</div>
          <button class="modal-close" @click="ma.open = false">✕</button>
        </div>
        <div class="form-group">
          <label>Descrição da Audiência *</label>
          <input type="text" v-model="ma.titulo" placeholder="Ex: Audiência de Instrução – Processo 0001234-56">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Data *</label>
            <input type="date" v-model="ma.data">
          </div>
          <div class="form-group">
            <label>Horário *</label>
            <input type="time" v-model="ma.hora">
          </div>
        </div>
        <div class="toggle-row">
          <label class="toggle">
            <input type="checkbox" v-model="ma.online">
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label">Audiência Online</span>
        </div>
        <div v-if="!ma.online" class="form-group">
          <label>Local *</label>
          <input type="text" v-model="ma.local" placeholder="Ex: Vara Cível da Comarca de São Paulo">
        </div>
        <div v-else class="form-group">
          <label>Link da Reunião *</label>
          <input type="url" v-model="ma.link" placeholder="https://meet.google.com/...">
        </div>
        <div class="form-group">
          <label>Observações</label>
          <textarea v-model="ma.obs" placeholder="Detalhes adicionais..."></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-outline" @click="ma.open = false">Cancelar</button>
          <button class="btn btn-gold" @click="salvarAudiencia" :disabled="ma.saving">
            {{ ma.saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Concluir Prazo (Protocolo) -->
    <div class="modal-overlay" :class="{ open: mpr.open }" @click.self="mpr.open = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">✅ Concluir Prazo</div>
          <button class="modal-close" @click="mpr.open = false">✕</button>
        </div>
        <p class="modal-info">Deseja registrar o número ou texto do protocolo?</p>
        <div class="form-group">
          <label>Número / Texto do Protocolo</label>
          <textarea v-model="mpr.texto" placeholder="Ex: Protocolo nº 123456, enviado via e-SAJ em 14/04/2026..."></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-outline" @click="mpr.open = false">Cancelar</button>
          <button class="btn btn-success" @click="confirmarConclusao" :disabled="mpr.saving">
            {{ mpr.saving ? 'Salvando...' : 'Confirmar Conclusão' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Visualizar Protocolo -->
    <div class="modal-overlay" :class="{ open: mvp.open }" @click.self="mvp.open = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">📋 Protocolo Anexado</div>
          <button class="modal-close" @click="mvp.open = false">✕</button>
        </div>
        <p style="font-size:0.875rem; white-space:pre-wrap; background:#f5f7fa; padding:1rem; border-radius:8px;">{{ mvp.content }}</p>
      </div>
    </div>

  </div>
</template>

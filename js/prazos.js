/**
 * prazos.js
 * Lógica de prazos com Firestore: renderização, formulário e protocolo.
 */

let prazosCache = [];

/* ─────────────────────────────────────────────
   INIT — inicia listener em tempo real
   ───────────────────────────────────────────── */
function initPrazos() {
    listenPrazos(prazos => {
        prazosCache = prazos;
        renderPrazos(prazos);
    });
}

/* ─────────────────────────────────────────────
   RENDERIZAÇÃO
   ───────────────────────────────────────────── */
function renderPrazos(prazos) {
    const list      = document.getElementById('list-prazos');
    const pendentes = prazos.filter(p => !p.completed).sort((a, b) => a.data.localeCompare(b.data));
    const concluidos = prazos.filter(p => p.completed)
        .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''));

    document.getElementById('badge-prazos').textContent = pendentes.length;

    if (prazos.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">📋</div>
                <p>Nenhum prazo cadastrado.</p>
            </div>`;
        return;
    }

    let html = '';

    if (pendentes.length > 0) {
        html += `<div class="section-label">Pendentes</div>`;
        html += pendentes.map(p => cardPrazo(p)).join('');
    }

    if (concluidos.length > 0) {
        html += `<div class="section-label" style="margin-top:0.5rem;">Concluídos</div>`;
        html += concluidos.map(p => cardPrazoConcluido(p)).join('');
    }

    list.innerHTML = html;
}

function cardPrazo(p) {
    return `
        <div class="card">
            <div class="card-top">
                <div>
                    <div class="card-title">${escapeHtml(p.titulo)}</div>
                    ${p.obs ? `<div class="card-desc">${escapeHtml(p.obs)}</div>` : ''}
                </div>
                <div class="card-actions">
                    <button class="btn btn-outline btn-sm" onclick="abrirModalPrazo('${p.id}')" title="Editar">✏️</button>
                    <button class="btn btn-success btn-sm" onclick="abrirModalProtocolo('${p.id}')" title="Concluir">✓</button>
                    <button class="btn btn-danger btn-sm"  onclick="deletarPrazo('${p.id}')" title="Excluir">🗑</button>
                </div>
            </div>
            <div class="card-meta">
                <span class="tag tag-date">📅 ${formatDate(p.data)}</span>
                ${urgencyTag(p.data)}
            </div>
        </div>`;
}

function cardPrazoConcluido(p) {
    return `
        <div class="card completed">
            <div class="card-top">
                <div>
                    <div class="card-title strikethrough">${escapeHtml(p.titulo)}</div>
                    ${p.obs ? `<div class="card-desc">${escapeHtml(p.obs)}</div>` : ''}
                </div>
                <div class="card-actions">
                    <button class="btn btn-danger btn-sm" onclick="deletarPrazo('${p.id}')" title="Excluir">🗑</button>
                </div>
            </div>
            <div class="card-meta">
                <span class="tag tag-date">📅 ${formatDate(p.data)}</span>
                <span class="tag tag-done">✅ Concluído em ${formatDate(p.completedDate)}</span>
                ${p.protocol ? `<span class="protocol-badge" onclick="verProtocolo('${p.id}')">📎 Ver protocolo</span>` : ''}
            </div>
        </div>`;
}

/* ─────────────────────────────────────────────
   FORMULÁRIO — ADICIONAR / EDITAR
   ───────────────────────────────────────────── */
function abrirModalPrazo(id = null) {
    document.getElementById('prazo-edit-id').value = id || '';
    document.getElementById('prazo-titulo').value  = '';
    document.getElementById('prazo-obs').value     = '';
    document.getElementById('prazo-data').value    = '';
    document.getElementById('modal-prazo-title').textContent = id ? 'Editar Prazo' : 'Novo Prazo';

    if (id) {
        const prazo = prazosCache.find(p => p.id === id);
        if (prazo) {
            document.getElementById('prazo-titulo').value = prazo.titulo;
            document.getElementById('prazo-obs').value    = prazo.obs || '';
            document.getElementById('prazo-data').value   = prazo.data;
        }
    }

    openModal('modal-prazo');
}

async function salvarPrazo() {
    const titulo = document.getElementById('prazo-titulo').value.trim();
    const data   = document.getElementById('prazo-data').value;
    const obs    = document.getElementById('prazo-obs').value.trim();
    const editId = document.getElementById('prazo-edit-id').value;

    if (!titulo || !data) { alert('Preencha a descrição e a data limite.'); return; }

    const btn = document.getElementById('btn-salvar-prazo');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        if (editId) {
            await updatePrazo(editId, { titulo, obs, data });
        } else {
            await addPrazo({ titulo, obs, data, completed: false, completedDate: null, protocol: null });
        }
        closeModal('modal-prazo');
    } catch (e) {
        alert('Erro ao salvar: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }
}

async function deletarPrazo(id) {
    if (!confirm('Excluir este prazo?')) return;
    try {
        await deletePrazoDoc(id);
    } catch (e) {
        alert('Erro ao excluir: ' + e.message);
    }
}

/* ─────────────────────────────────────────────
   MODAL DE CONCLUSÃO — PROTOCOLO
   ───────────────────────────────────────────── */
function abrirModalProtocolo(id) {
    document.getElementById('protocolo-prazo-id').value = id;
    document.getElementById('protocolo-texto').value    = '';
    openModal('modal-protocolo');
}

async function confirmarConclusao() {
    const id      = document.getElementById('protocolo-prazo-id').value;
    const txt     = document.getElementById('protocolo-texto').value.trim();
    const btn     = document.getElementById('btn-confirmar-conclusao');
    btn.disabled    = true;
    btn.textContent = 'Salvando...';

    try {
        const protocol = txt ? { type: 'text', content: txt } : null;

        await updatePrazo(id, {
            completed:     true,
            completedDate: todayStr(),
            protocol,
        });

        closeModal('modal-protocolo');
    } catch (e) {
        alert('Erro ao concluir: ' + e.message);
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Confirmar Conclusão';
    }
}

/* ─────────────────────────────────────────────
   VISUALIZAR PROTOCOLO ANEXADO
   ───────────────────────────────────────────── */
function verProtocolo(id) {
    const prazo = prazosCache.find(p => p.id === id);
    if (!prazo?.protocol) return;

    const html = `<p style="font-size:0.875rem; white-space:pre-wrap; background:#f5f7fa; padding:1rem; border-radius:8px;">${escapeHtml(prazo.protocol.content)}</p>`;

    document.getElementById('ver-protocolo-content').innerHTML = html;
    openModal('modal-ver-protocolo');
}

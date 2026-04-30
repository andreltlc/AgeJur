/**
 * audiencias.js
 * Lógica de audiências com Firestore: renderização e formulário.
 */

let audienciasCache = [];

/* ─────────────────────────────────────────────
   INIT — inicia listener em tempo real
   ───────────────────────────────────────────── */
function initAudiencias() {
    listenAudiencias(audiencias => {
        audienciasCache = audiencias;
        renderAudiencias(audiencias);
    });
}

/* ─────────────────────────────────────────────
   RENDERIZAÇÃO
   ───────────────────────────────────────────── */
function renderAudiencias(audiencias) {
    const sorted = [...audiencias].sort((a, b) =>
        (a.data + 'T' + a.hora).localeCompare(b.data + 'T' + b.hora)
    );

    const list = document.getElementById('list-audiencias');
    document.getElementById('badge-audiencias').textContent = audiencias.length;

    if (sorted.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">🎤</div>
                <p>Nenhuma audiência cadastrada.</p>
            </div>`;
        return;
    }

    const hoje     = todayStr();
    const proximas = sorted.filter(a => a.data >= hoje);
    const passadas = sorted.filter(a => a.data <  hoje).reverse();

    let html = '';

    if (proximas.length > 0) {
        html += `<div class="section-label">Próximas</div>`;
        html += proximas.map(a => cardAudiencia(a, false)).join('');
    }

    if (passadas.length > 0) {
        html += `<div class="section-label" style="margin-top:0.5rem;">Realizadas</div>`;
        html += passadas.map(a => cardAudiencia(a, true)).join('');
    }

    list.innerHTML = html;
}

function cardAudiencia(a, passada) {
    const diff = diffDays(a.data);
    let urgency = '';

    if (!passada) {
        if (diff === 0)     urgency = `<span class="tag tag-overdue">🔴 Hoje</span>`;
        else if (diff <= 3) urgency = `<span class="tag tag-urgent">🟠 Em ${diff} dia(s)</span>`;
        else if (diff <= 7) urgency = `<span class="tag tag-urgent">🟡 Em ${diff} dias</span>`;
        else                urgency = `<span class="tag tag-normal">🟢 Em ${diff} dias</span>`;
    }

    const localTag = a.online
        ? `<a href="${escapeHtml(a.link)}" target="_blank" rel="noopener" class="tag-link">🔗 Entrar na reunião</a>`
        : `<span class="tag tag-location">📍 ${escapeHtml(a.local)}</span>`;

    return `
        <div class="card${passada ? ' completed' : ''}">
            <div class="card-top">
                <div>
                    <div class="card-title${passada ? ' strikethrough' : ''}">${escapeHtml(a.titulo)}</div>
                    ${a.obs ? `<div class="card-desc">${escapeHtml(a.obs)}</div>` : ''}
                </div>
                <div class="card-actions">
                    <button class="btn btn-outline btn-sm" onclick="abrirModalAudiencia('${a.id}')" title="Editar">✏️</button>
                    <button class="btn btn-danger btn-sm"  onclick="deletarAudiencia('${a.id}')" title="Excluir">🗑</button>
                </div>
            </div>
            <div class="card-meta">
                <span class="tag tag-date">📅 ${formatDate(a.data)} às ${a.hora}</span>
                ${a.online ? '<span class="tag tag-online">💻 Online</span>' : ''}
                ${localTag}
                ${urgency}
            </div>
        </div>`;
}

/* ─────────────────────────────────────────────
   FORMULÁRIO — ADICIONAR / EDITAR
   ───────────────────────────────────────────── */
function abrirModalAudiencia(id = null) {
    document.getElementById('audiencia-edit-id').value  = id || '';
    document.getElementById('audiencia-titulo').value   = '';
    document.getElementById('audiencia-data').value     = '';
    document.getElementById('audiencia-hora').value     = '';
    document.getElementById('audiencia-local').value    = '';
    document.getElementById('audiencia-link').value     = '';
    document.getElementById('audiencia-obs').value      = '';
    document.getElementById('audiencia-online').checked = false;
    document.getElementById('modal-audiencia-title').textContent = id ? 'Editar Audiência' : 'Nova Audiência';
    mostrarCampoLocal();

    if (id) {
        const aud = audienciasCache.find(a => a.id === id);
        if (aud) {
            document.getElementById('audiencia-titulo').value   = aud.titulo;
            document.getElementById('audiencia-data').value    = aud.data;
            document.getElementById('audiencia-hora').value    = aud.hora;
            document.getElementById('audiencia-obs').value     = aud.obs || '';
            document.getElementById('audiencia-online').checked = aud.online;

            if (aud.online) {
                document.getElementById('audiencia-link').value = aud.link || '';
                mostrarCampoLink();
            } else {
                document.getElementById('audiencia-local').value = aud.local || '';
            }
        }
    }

    openModal('modal-audiencia');
}

async function salvarAudiencia() {
    const titulo = document.getElementById('audiencia-titulo').value.trim();
    const data   = document.getElementById('audiencia-data').value;
    const hora   = document.getElementById('audiencia-hora').value;
    const online = document.getElementById('audiencia-online').checked;
    const local  = document.getElementById('audiencia-local').value.trim();
    const link   = document.getElementById('audiencia-link').value.trim();
    const obs    = document.getElementById('audiencia-obs').value.trim();
    const editId = document.getElementById('audiencia-edit-id').value;

    if (!titulo || !data || !hora)  { alert('Preencha a descrição, data e horário.'); return; }
    if (online  && !link)           { alert('Informe o link da audiência online.'); return; }
    if (!online && !local)          { alert('Informe o local da audiência.'); return; }

    const btn = document.getElementById('btn-salvar-audiencia');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const obj = {
        titulo, data, hora, online, obs,
        local: online ? '' : local,
        link:  online ? link : '',
    };

    try {
        if (editId) {
            await updateAudiencia(editId, obj);
        } else {
            await addAudiencia(obj);
        }
        closeModal('modal-audiencia');
    } catch (e) {
        alert('Erro ao salvar: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }
}

async function deletarAudiencia(id) {
    if (!confirm('Excluir esta audiência?')) return;
    try {
        await deleteAudienciaDoc(id);
    } catch (e) {
        alert('Erro ao excluir: ' + e.message);
    }
}

/* ─────────────────────────────────────────────
   TOGGLE ONLINE / PRESENCIAL
   ───────────────────────────────────────────── */
function mostrarCampoLocal() {
    document.getElementById('campo-local').classList.remove('hidden');
    document.getElementById('campo-link').classList.add('hidden');
}

function mostrarCampoLink() {
    document.getElementById('campo-local').classList.add('hidden');
    document.getElementById('campo-link').classList.remove('hidden');
}

function handleToggleOnline(checkbox) {
    checkbox.checked ? mostrarCampoLink() : mostrarCampoLocal();
}

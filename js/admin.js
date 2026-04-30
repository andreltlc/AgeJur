/**
 * admin.js
 * Painel administrativo: autenticação, geração e gerenciamento de tokens.
 */

let currentUser = null;

/* ─────────────────────────────────────────────
   AUTENTICAÇÃO — só admin pode acessar
   ───────────────────────────────────────────── */
auth.onAuthStateChanged(async user => {
    if (!user) { window.location.replace('login.html'); return; }

    try {
        const configDoc = await db.collection('config').doc('admin').get();
        if (!configDoc.exists || configDoc.data().uid !== user.uid) {
            window.location.replace('index.html');
            return;
        }
        currentUser = user;
        iniciarListaTokens();
    } catch {
        window.location.replace('index.html');
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    auth.signOut().then(() => window.location.replace('login.html'));
});

/* ─────────────────────────────────────────────
   GERAÇÃO DE TOKEN
   ───────────────────────────────────────────── */
function gerarCodigo() {
    /* Caracteres sem ambiguidade visual (sem 0/O, 1/I/l) */
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code; /* ex: B3KR-M7PN */
}

const btnGerar = document.getElementById('btn-gerar-token');

btnGerar.addEventListener('click', async () => {
    btnGerar.disabled    = true;
    btnGerar.textContent = 'Gerando...';

    try {
        const token = gerarCodigo();

        await db.collection('tokens').add({
            token,
            used:      false,
            usedBy:    null,
            usedAt:    null,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        /* Exibe o token gerado */
        document.getElementById('token-valor-exibido').textContent = token;
        const box = document.getElementById('token-gerado');
        box.classList.remove('hidden');
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        /* Reseta o botão de copiar */
        document.getElementById('btn-copiar').textContent = '📋 Copiar';
    } catch (e) {
        alert('Erro ao gerar código: ' + e.message);
    } finally {
        btnGerar.disabled    = false;
        btnGerar.textContent = '+ Gerar código';
    }
});

document.getElementById('btn-copiar').addEventListener('click', () => {
    const token = document.getElementById('token-valor-exibido').textContent;
    navigator.clipboard.writeText(token).then(() => {
        const btn = document.getElementById('btn-copiar');
        btn.textContent = '✓ Copiado!';
        setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2500);
    });
});

/* ─────────────────────────────────────────────
   LISTA DE TOKENS (tempo real)
   ───────────────────────────────────────────── */
function iniciarListaTokens() {
    db.collection('tokens')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const tokens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTokens(tokens);
        });
}

function renderTokens(tokens) {
    const lista = document.getElementById('lista-tokens');

    if (tokens.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <div class="icon">🔑</div>
                <p>Nenhum código gerado ainda.</p>
            </div>`;
        return;
    }

    const disponiveis = tokens.filter(t => !t.used);
    const utilizados  = tokens.filter(t =>  t.used);
    let html = '';

    if (disponiveis.length > 0) {
        html += `<div class="tokens-section-label">Disponíveis (${disponiveis.length})</div>`;
        html += disponiveis.map(t => cardToken(t)).join('');
    }

    if (utilizados.length > 0) {
        html += `<div class="tokens-section-label">Utilizados (${utilizados.length})</div>`;
        html += utilizados.map(t => cardToken(t)).join('');
    }

    lista.innerHTML = html;
}

function cardToken(t) {
    const criadoEm = formatarData(t.createdAt);
    const usadoEm  = formatarData(t.usedAt);

    if (t.used) {
        return `
            <div class="token-card usado">
                <div class="token-code riscado">${t.token}</div>
                <div class="token-info">
                    <span class="tag tag-usado">✓ Utilizado</span>
                    <span class="token-meta">por ${escapeHtml(t.usedBy || '?')} em ${usadoEm}</span>
                </div>
            </div>`;
    }

    return `
        <div class="token-card">
            <div class="token-code">${t.token}</div>
            <div class="token-info">
                <span class="tag tag-disponivel">⏳ Disponível</span>
                <span class="token-meta">gerado em ${criadoEm}</span>
            </div>
            <button class="btn btn-danger btn-sm" onclick="revogarToken('${t.id}')">Revogar</button>
        </div>`;
}

async function revogarToken(id) {
    if (!confirm('Revogar este código? Quem o tiver recebido não poderá mais usá-lo.')) return;
    try {
        await db.collection('tokens').doc(id).delete();
    } catch (e) {
        alert('Erro ao revogar: ' + e.message);
    }
}

/* ─────────────────────────────────────────────
   UTILITÁRIOS
   ───────────────────────────────────────────── */
function formatarData(timestamp) {
    if (!timestamp?.toDate) return '—';
    const d = timestamp.toDate();
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

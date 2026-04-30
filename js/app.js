/**
 * app.js
 * Inicialização, autenticação, modais e abas mobile.
 */

let currentUser = null;

/* ─────────────────────────────────────────────
   AUTENTICAÇÃO
   ───────────────────────────────────────────── */
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.replace('login.html');
        return;
    }
    currentUser = user;
    document.getElementById('user-email').textContent = user.email;
    initPrazos();
    initAudiencias();
});

function logout() {
    auth.signOut().then(() => window.location.replace('login.html'));
}

/* ─────────────────────────────────────────────
   MODAIS
   ───────────────────────────────────────────── */
function openModal(id) {
    document.getElementById(id).classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

/* ─────────────────────────────────────────────
   ABAS MOBILE
   ───────────────────────────────────────────── */
function setTab(tab) {
    document.querySelectorAll('.column').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.mobile-tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(`col-${tab}`).classList.add('active');
    document.querySelector(`.mobile-tabs button[data-tab="${tab}"]`).classList.add('active');
}

document.querySelectorAll('.mobile-tabs button').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

/* ─────────────────────────────────────────────
   BOTÕES PRINCIPAIS
   ───────────────────────────────────────────── */
document.getElementById('btn-novo-prazo').addEventListener('click', () => abrirModalPrazo());
document.getElementById('btn-nova-audiencia').addEventListener('click', () => abrirModalAudiencia());
document.getElementById('btn-salvar-prazo').addEventListener('click', salvarPrazo);
document.getElementById('btn-salvar-audiencia').addEventListener('click', salvarAudiencia);
document.getElementById('btn-confirmar-conclusao').addEventListener('click', confirmarConclusao);

document.getElementById('audiencia-online').addEventListener('change', function () {
    handleToggleOnline(this);
});

/* ─────────────────────────────────────────────
   BANNER DE INSTALAÇÃO iOS
   ───────────────────────────────────────────── */
const isIOS        = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = window.navigator.standalone;

if (isIOS && !isStandalone) {
    document.getElementById('ios-banner').classList.remove('hidden');
}

document.getElementById('ios-banner-fechar').addEventListener('click', () => {
    document.getElementById('ios-banner').classList.add('hidden');
});

/* ─────────────────────────────────────────────
   SERVICE WORKER (PWA)
   ───────────────────────────────────────────── */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}

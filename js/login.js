/**
 * login.js
 * Lógica da página de autenticação: login, token, registro e reset de senha.
 */

/* Se já está logado, vai direto para o app */
auth.onAuthStateChanged(user => {
    if (user) window.location.replace('index.html');
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
   NAVEGAÇÃO ENTRE VIEWS
   ───────────────────────────────────────────── */
const VIEWS = ['view-login', 'view-token', 'view-registro', 'view-esqueci'];

function showView(id) {
    VIEWS.forEach(v => document.getElementById(v).classList.toggle('hidden', v !== id));
}

document.getElementById('link-ir-token').addEventListener('click',    e => { e.preventDefault(); showView('view-token');   });
document.getElementById('link-ir-login').addEventListener('click',    e => { e.preventDefault(); showView('view-login');   });
document.getElementById('link-esqueci').addEventListener('click',     e => { e.preventDefault(); showView('view-esqueci'); });
document.getElementById('link-voltar-login').addEventListener('click',e => { e.preventDefault(); showView('view-login');   });

/* ─────────────────────────────────────────────
   UTILITÁRIOS
   ───────────────────────────────────────────── */
function showErro(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.remove('hidden');
}

function hideErro(id) {
    document.getElementById(id).classList.add('hidden');
}

function setLoading(btn, loading, textoOriginal, textoCarregando) {
    btn.disabled    = loading;
    btn.textContent = loading ? textoCarregando : textoOriginal;
}

function traduzirErro(code) {
    const erros = {
        'auth/user-not-found':       'E-mail não encontrado.',
        'auth/wrong-password':       'Senha incorreta.',
        'auth/invalid-email':        'E-mail inválido.',
        'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
        'auth/weak-password':        'Senha muito fraca. Use pelo menos 6 caracteres.',
        'auth/too-many-requests':    'Muitas tentativas. Aguarde alguns minutos.',
        'auth/invalid-credential':   'E-mail ou senha incorretos.',
        'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
    };
    return erros[code] || 'Erro inesperado. Tente novamente.';
}

/* ─────────────────────────────────────────────
   LOGIN
   ───────────────────────────────────────────── */
const btnEntrar = document.getElementById('btn-entrar');

btnEntrar.addEventListener('click', async () => {
    hideErro('login-erro');
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;

    if (!email || !senha) { showErro('login-erro', 'Preencha e-mail e senha.'); return; }

    setLoading(btnEntrar, true, 'Entrar', 'Entrando...');
    try {
        await auth.signInWithEmailAndPassword(email, senha);
        /* onAuthStateChanged redireciona automaticamente */
    } catch (e) {
        showErro('login-erro', traduzirErro(e.code));
    } finally {
        setLoading(btnEntrar, false, 'Entrar', 'Entrando...');
    }
});

/* Enter na senha dispara o login */
document.getElementById('login-senha').addEventListener('keydown', e => {
    if (e.key === 'Enter') btnEntrar.click();
});

/* ─────────────────────────────────────────────
   VALIDAÇÃO DO TOKEN DE PRIMEIRO ACESSO
   ───────────────────────────────────────────── */
const tokenInput   = document.getElementById('token-input');
const btnValidar   = document.getElementById('btn-validar-token');

/* Formata automaticamente: XXXX-XXXX */
tokenInput.addEventListener('input', function () {
    let val = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4, 8);
    this.value = val;
});

tokenInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') btnValidar.click();
});

btnValidar.addEventListener('click', async () => {
    hideErro('token-erro');
    const token = tokenInput.value.trim();

    if (token.length < 9) { showErro('token-erro', 'Código inválido. Formato esperado: XXXX-XXXX'); return; }

    setLoading(btnValidar, true, 'Validar código', 'Verificando...');
    try {
        const snap = await db.collection('tokens')
            .where('token', '==', token)
            .where('used',  '==', false)
            .get();

        if (snap.empty) {
            showErro('token-erro', 'Código inválido ou já utilizado.');
        } else {
            document.getElementById('token-doc-id').value = snap.docs[0].id;
            showView('view-registro');
        }
    } catch {
        showErro('token-erro', 'Erro ao verificar. Tente novamente.');
    } finally {
        setLoading(btnValidar, false, 'Validar código', 'Verificando...');
    }
});

/* ─────────────────────────────────────────────
   REGISTRO DE CONTA
   ───────────────────────────────────────────── */
const btnRegistrar = document.getElementById('btn-registrar');

btnRegistrar.addEventListener('click', async () => {
    hideErro('reg-erro');
    const email      = document.getElementById('reg-email').value.trim();
    const senha      = document.getElementById('reg-senha').value;
    const senha2     = document.getElementById('reg-senha2').value;
    const tokenDocId = document.getElementById('token-doc-id').value;

    if (!email || !senha)   { showErro('reg-erro', 'Preencha todos os campos.'); return; }
    if (senha !== senha2)   { showErro('reg-erro', 'As senhas não coincidem.'); return; }
    if (senha.length < 6)   { showErro('reg-erro', 'A senha deve ter pelo menos 6 caracteres.'); return; }

    setLoading(btnRegistrar, true, 'Criar conta', 'Criando conta...');
    try {
        /* Cria o usuário no Firebase Auth */
        const cred = await auth.createUserWithEmailAndPassword(email, senha);

        /* Marca o token como utilizado */
        await db.collection('tokens').doc(tokenDocId).update({
            used:  true,
            usedBy: email,
            usedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        /* Cria o perfil do usuário no Firestore */
        await db.collection('users').doc(cred.user.uid).set({
            email,
            tokenDocId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        /* onAuthStateChanged redireciona automaticamente */
    } catch (e) {
        showErro('reg-erro', traduzirErro(e.code));
        setLoading(btnRegistrar, false, 'Criar conta', 'Criando conta...');
    }
});

/* ─────────────────────────────────────────────
   ESQUECI A SENHA
   ───────────────────────────────────────────── */
const btnReset = document.getElementById('btn-enviar-reset');

btnReset.addEventListener('click', async () => {
    hideErro('esqueci-erro');
    document.getElementById('esqueci-ok').classList.add('hidden');
    const email = document.getElementById('esqueci-email').value.trim();

    if (!email) { showErro('esqueci-erro', 'Informe seu e-mail.'); return; }

    setLoading(btnReset, true, 'Enviar link', 'Enviando...');
    try {
        await auth.sendPasswordResetEmail(email);
        document.getElementById('esqueci-ok').classList.remove('hidden');
    } catch (e) {
        showErro('esqueci-erro', traduzirErro(e.code));
    } finally {
        setLoading(btnReset, false, 'Enviar link', 'Enviando...');
    }
});

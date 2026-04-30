/**
 * firebase-config.js
 * Configuração do Firebase — substitua os valores pelo seu projeto.
 *
 * COMO CONFIGURAR:
 * 1. Acesse https://console.firebase.google.com
 * 2. Crie um projeto (ex: "agenda-juridica")
 * 3. Em "Authentication" → "Sign-in method" → ative "E-mail/senha"
 * 4. Em "Firestore Database" → crie o banco (modo de produção)
 * 5. Em "Storage" → ative o armazenamento
 * 6. Em "Configurações do projeto" → "Seus apps" → adicione um app Web
 * 7. Copie o objeto firebaseConfig abaixo e substitua os valores
 *
 * REGRAS DO FIRESTORE (cole no console > Firestore > Regras):
 * ─────────────────────────────────────────────────────────────
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /tokens/{id} {
 *       allow read: if true;
 *       allow write: if request.auth != null
 *         && get(/databases/$(database)/documents/config/admin).data.uid == request.auth.uid;
 *     }
 *     match /config/{id} {
 *       allow read: if request.auth != null;
 *       allow write: if request.auth != null
 *         && get(/databases/$(database)/documents/config/admin).data.uid == request.auth.uid;
 *     }
 *     match /users/{uid} {
 *       allow read, write: if request.auth != null && request.auth.uid == uid;
 *     }
 *     match /prazos/{id} {
 *       allow read, write, delete: if request.auth != null && resource.data.userId == request.auth.uid;
 *       allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
 *     }
 *     match /audiencias/{id} {
 *       allow read, write, delete: if request.auth != null && resource.data.userId == request.auth.uid;
 *       allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
 *     }
 *   }
 * }
 *
 * REGRAS DO STORAGE (cole no console > Storage > Regras):
 * ─────────────────────────────────────────────────────────────
 * rules_version = '2';
 * service firebase.storage {
 *   match /b/{bucket}/o {
 *     match /protocolos/{userId}/{allPaths=**} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 *
 * PRIMEIRO ACESSO (admin):
 * 1. Acesse Firebase Console > Authentication > Adicionar usuário
 * 2. Crie sua conta com email e senha
 * 3. Copie seu UID (aparece na lista de usuários)
 * 4. Acesse Firestore > Criar coleção "config" > documento "admin"
 * 5. Adicione os campos: uid (string) e email (string) com seus dados
 * 6. Agora você pode acessar /admin.html com suas credenciais
 */

const firebaseConfig = {
    apiKey: "AIzaSyAv_8Fbcpqwp1VoSccrkN284-g5BX1mf60",
    authDomain: "agenda-juridica-956d1.firebaseapp.com",
    projectId: "agenda-juridica-956d1",
    storageBucket: "agenda-juridica-956d1.firebasestorage.app",
    messagingSenderId: "269811243307",
    appId: "1:269811243307:web:d0a767b1f5f2acacd94d6e"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

// Persistência offline — Firestore sincroniza quando a conexão voltar
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

# AgeJur — Agenda Jurídica

PWA para advogados gerenciarem prazos e audiências com sync em tempo real via Firebase.

## Stack
- **Vue 3** (Composition API + `<script setup>`) — sem TypeScript, sem Pinia/Vuex
- **Vite 5** + **vite-plugin-pwa**
- **Firebase**: Auth (email/senha) + Firestore (banco + real-time) + Hosting
- CSS puro com variáveis para tema

## Estrutura
```
src/
├── views/
│   ├── LoginView.vue      # Cadastro livre (nome + @apelido + email + senha), login, reset
│   ├── AppView.vue        # Tela principal: prazos + audiências + modal de compartilhamento
│   └── AdminView.vue      # Geração/revogação de tokens (reservado para SaaS futuro)
├── composables/
│   ├── usePrazos.js       # Merge de duas queries: próprios + sharedWithUids
│   ├── useAudiencias.js   # Idem para audiências
│   ├── useProfile.js      # onSnapshot do perfil do usuário logado (users/{uid})
│   └── useShare.js        # buscarPorApelido, compartilharItem, removerCompartilhamento
├── router/index.js        # Rotas: /login, /app, /admin (com guards de auth)
├── firebase.js            # Init Firebase, exporta auth + db
├── utils.js               # Helpers de data, labels de urgência
└── assets/
    ├── styles.css         # Tema global com CSS vars + estilos de compartilhamento
    └── admin.css          # Estilos do painel admin
```

## Funcionalidades principais

### Autenticação
- Cadastro livre: nome, @apelido único, e-mail, senha
- @apelido: lowercase, alphanumeric + underscore, mín. 3 chars, verificado por unicidade antes do create
- Usuários sem apelido (contas antigas) recebem modal não-dispensável ao logar para definir um
- Login email/senha via Firebase Auth
- Reset de senha por e-mail

### Prazos & Audiências
- CRUD com listener `onSnapshot` (real-time)
- Duas queries mergeadas: `userId == eu` + `sharedWithUids array-contains eu`
- Indicadores visuais de urgência: vencido, hoje, 1-3 dias, 4-7 dias, 7+ dias
- Campo de protocolo ao concluir prazos
- Audiências: toggle presencial ↔ online (link clicável)

### Compartilhamento individual
- Dono busca outro usuário pelo `@apelido`
- Define role: **editor** (edita/conclui) ou **visualizador** (só lê)
- Documento armazena `sharedWith: [{uid, apelido, role}]` e `sharedWithUids: [uid]`
- Cards mostram: `👥 n pessoa(s)` (dono) ou `📨 De @apelido` + badge de role (receptor)
- Apenas o dono pode deletar e compartilhar; editor pode editar/concluir; visualizador só lê
- `ownerApelido` salvo no documento na criação para exibição nos cards compartilhados

### Admin (`/admin`)
- Acesso restrito por UID fixo no Firestore em `config/admin`
- **Aba Usuários**: lista em tempo real, busca por nome/@apelido/e-mail, editar nome e @apelido, reset de senha via `sendPasswordResetEmail` (client SDK não permite alterar senha de outro user diretamente)
- **Aba Tokens**: gera/revoga tokens `XXXX-XXXX` para uso futuro (SaaS/planos pagos)

## Padrão dos composables (usePrazos / useAudiencias)
```js
// Dois onSnapshot independentes → merge por Map (id como chave)
// ownItems + sharedItems → prazos.value / audiencias.value
// addPrazo(data, ownerApelido) — salva sharedWith:[], sharedWithUids:[], ownerApelido
// Cleanup automático no unmount
```

## Firebase
- **Projeto**: `agenda-juridica-956d1`
- **Collections**: `prazos`, `audiencias`, `tokens`, `users`, `config`
- `users/{uid}`: `{ email, nome, apelido, createdAt }`
- Regras: `users` — read para qualquer auth, write só para o próprio uid (necessário para busca por @apelido)
- Regras: `prazos`/`audiencias` — read/update para dono ou quem está em `sharedWithUids`, delete só para dono
- Arquivo de regras: [`firestore.rules`](firestore.rules)
- Persistência offline (`enablePersistence`) + multi-tab sync
- Deploy: automático via **GitHub Actions** no push para `main` — não usar `firebase deploy` manualmente
- Índice Firestore necessário: `sharedWithUids array-contains` (criado automaticamente)

## Scripts
```bash
npm run dev       # Dev server (HMR)
npm run build     # Build → dist/
npm run preview   # Serve dist/ local
# Deploy: push para main → GitHub Actions faz o build e deploy automático
```

## Convenções
- Sem TypeScript — JS puro
- Todo state vive no Firestore; sem store global
- UI modal-centric: criar/editar/deletar sem navegação de página
- Layout: duas colunas no desktop, abas no mobile
- Firebase API key no `src/firebase.js` é pública por design (segurança via Firestore Rules)
- Sem `.env` — credenciais Firebase são públicas e seguras por Rules
- Escritórios (workspaces) são a próxima feature planejada após compartilhamento individual

## Arquivos de referência
- [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md) — levantamento completo das features
- [`DOCUMENTACAO.md`](DOCUMENTACAO.md) — documentação do código

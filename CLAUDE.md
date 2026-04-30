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
│   ├── LoginView.vue      # Login, cadastro por token, reset de senha
│   ├── AppView.vue        # Tela principal: prazos + audiências (duas abas mobile)
│   └── AdminView.vue      # Geração/revogação de tokens de acesso
├── composables/
│   ├── usePrazos.js       # CRUD + onSnapshot de prazos
│   └── useAudiencias.js   # CRUD + onSnapshot de audiências
├── router/index.js        # Rotas: /login, /app, /admin (com guards de auth)
├── firebase.js            # Init Firebase, exporta auth + db
├── utils.js               # Helpers de data, labels de urgência
└── assets/
    ├── styles.css         # Tema global com CSS vars
    └── admin.css          # Estilos do painel admin
```

## Funcionalidades principais

### Autenticação
- Login email/senha via Firebase Auth
- Primeiro acesso por token no formato `XXXX-XXXX` (gerado pelo admin)
- Reset de senha por e-mail
- Banner iOS para "Adicionar à Tela Inicial"

### Prazos
- CRUD com listener `onSnapshot` (real-time)
- Separação: Pendentes (ordenados por data) / Concluídos
- Indicadores visuais de urgência: vencido, hoje, 1-3 dias, 4-7 dias, 7+ dias
- Campo de protocolo ao concluir

### Audiências
- CRUD com `onSnapshot`
- Separação: Próximas / Realizadas
- Toggle presencial (campo local) ↔ online (link clicável)
- Indicadores de urgência iguais aos prazos

### Admin (`/admin`)
- Acesso restrito por UID fixo no Firestore em `config/admin`
- Gera tokens `XXXX-XXXX` com caracteres seguros
- Lista tokens disponíveis e usados em tempo real
- Revogação com confirmação

## Padrão dos composables
Ambos (`usePrazos`, `useAudiencias`) seguem o mesmo padrão:
```js
// Observam userRef reativo → setup onSnapshot filtrado por userId
// Cleanup automático no unmount
// Funções: add / update / delete com serverTimestamp()
```

## Firebase
- **Projeto**: `agenda-juridica-956d1`
- **Collections**: `prazos`, `audiencias`, `tokens`, `users`, `config`
- Dados isolados por `userId` tanto nas queries quanto nas Firestore Rules
- Persistência offline habilitada (`enablePersistence`) + multi-tab sync
- Deploy: `firebase deploy --only hosting` → gera `dist/` via `vite build`

## Scripts
```bash
npm run dev       # Dev server (HMR)
npm run build     # Build → dist/
npm run preview   # Serve dist/ local
firebase deploy --only hosting  # Deploy produção
```

## Convenções do projeto
- Sem TypeScript — JS puro
- Todo state vive no Firestore; sem store global
- UI modal-centric: criar/editar/deletar sem navegação de página
- Layout: duas colunas no desktop, abas no mobile
- Firebase API key no `src/firebase.js` é pública por design (segurança via Firestore Rules)
- Sem `.env` — credenciais Firebase são públicas e seguras por Rules

## Arquivos de referência
- [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md) — levantamento completo das features
- [`DOCUMENTACAO.md`](DOCUMENTACAO.md) — documentação do código

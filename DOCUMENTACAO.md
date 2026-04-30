# Documentação do Código — Agenda Jurídica

Projeto Vue 3 + Vite + Firebase para controle de prazos e audiências jurídicas.

---

## Índice

1. [src/firebase.js](#srcfirebasejs)
2. [src/utils.js](#srcutilsjs)
3. [src/router/index.js](#srcrouterindexjs)
4. [src/composables/usePrazos.js](#srccomposablesuseprazosjs)
5. [src/composables/useAudiencias.js](#srccomposablesuseaudienciasjs)
6. [src/views/LoginView.vue](#srcviewsloginviewvue)
7. [src/views/AppView.vue](#srcviewsappviewvue)
8. [src/views/AdminView.vue](#srcviewsadminviewvue)
9. [src/main.js](#srcmainjs)

---

## src/firebase.js

Arquivo de configuração e inicialização do Firebase.

### Variáveis

| Variável | Tipo | Descrição |
|---|---|---|
| `firebaseConfig` | `Object` | Objeto com as credenciais do projeto Firebase (apiKey, authDomain, projectId, etc.) |
| `app` | `FirebaseApp` | Instância principal do Firebase criada por `initializeApp` |

### Exportações

| Export | Tipo | Descrição |
|---|---|---|
| `auth` | `Auth` | Instância do Firebase Authentication — usada em todo o app para login, logout e escuta de estado do usuário |
| `db` | `Firestore` | Instância do Firestore com **cache local persistente** habilitado para múltiplas abas. Permite que o app funcione offline e sincronize quando voltar a ter conexão |

---

## src/utils.js

Funções utilitárias puras para manipulação de datas e classificação de urgência. Não possuem estado próprio.

### Funções

#### `todayStr()`
Retorna a data de hoje no formato `YYYY-MM-DD` (ex: `"2026-04-30"`).
Usa `toISOString()` e descarta a parte de horário cortando em `T`.

---

#### `diffDays(dateStr)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `dateStr` | `string` | Data no formato `YYYY-MM-DD` |

Calcula a diferença em dias entre a data informada e hoje.
- Valor **negativo** → data já passou (vencido)
- Valor **zero** → vence hoje
- Valor **positivo** → dias restantes

Usa `Math.round` e divide por `86_400_000` (milissegundos em um dia).

---

#### `formatDate(dateStr)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `dateStr` | `string` | Data no formato `YYYY-MM-DD` |

Converte a data do formato ISO (`2026-04-30`) para o formato brasileiro (`30/04/2026`).
Retorna string vazia se `dateStr` for falsy.

---

#### `urgencyLabel(dateStr)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `dateStr` | `string` | Data limite do prazo no formato `YYYY-MM-DD` |

Retorna um texto descritivo com emoji indicando a urgência do prazo:

| Condição | Retorno |
|---|---|
| Vencido | `"⚠️ Vencido há N dia(s)"` |
| Vence hoje | `"🔴 Vence hoje"` |
| Vence em 1–3 dias | `"🟠 Vence em N dia(s)"` |
| Vence em 4–7 dias | `"🟡 Em N dias"` |
| Mais de 7 dias | `"🟢 Em N dias"` |

---

#### `urgencyClass(dateStr)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `dateStr` | `string` | Data limite do prazo no formato `YYYY-MM-DD` |

Retorna a classe CSS correspondente à urgência do prazo:

| Condição | Classe CSS |
|---|---|
| Vencido ou vence hoje | `"tag-overdue"` |
| 1–7 dias restantes | `"tag-urgent"` |
| Mais de 7 dias | `"tag-normal"` |

---

#### `audienciaUrgencyLabel(dateStr)`
Igual a `urgencyLabel`, mas adaptada para audiências (não exibe "Vencido" — audiências passadas são gerenciadas separadamente no componente).

| Condição | Retorno |
|---|---|
| Hoje | `"🔴 Hoje"` |
| 1–3 dias | `"🟠 Em N dia(s)"` |
| 4–7 dias | `"🟡 Em N dias"` |
| Mais de 7 dias | `"🟢 Em N dias"` |

---

#### `audienciaUrgencyClass(dateStr)`
Equivalente a `urgencyClass` para audiências. Retorna as mesmas classes CSS (`tag-overdue`, `tag-urgent`, `tag-normal`).

---

## src/router/index.js

Configuração das rotas da aplicação com proteção de autenticação.

### Variáveis

| Variável | Tipo | Descrição |
|---|---|---|
| `routes` | `Array` | Lista de objetos de rota do Vue Router |
| `router` | `Router` | Instância do Vue Router exportada para uso em `main.js` |

### Rotas definidas

| Caminho | Componente | Protegida |
|---|---|---|
| `/login` | `LoginView.vue` | Não |
| `/` | `AppView.vue` | Sim (`requiresAuth: true`) |
| `/admin` | `AdminView.vue` | Sim (`requiresAuth: true`) |

Todos os componentes são carregados com **lazy loading** (`() => import(...)`) — só são baixados quando a rota é acessada pela primeira vez.

### Funções

#### `getCurrentUser()`
Retorna uma `Promise` que resolve com o usuário atual do Firebase Auth (ou `null` se não autenticado).
Cria um listener temporário com `onAuthStateChanged`, captura o valor e se auto-destrói com `unsub()`.

---

#### `router.beforeEach(to)` *(guard de navegação)*
Executado antes de cada mudança de rota.

| Situação | Comportamento |
|---|---|
| Rota requer auth e usuário não logado | Redireciona para `/login` |
| Usuário logado tenta acessar `/login` | Redireciona para `/` |
| Qualquer outro caso | Permite a navegação normalmente |

---

## src/composables/usePrazos.js

Composable Vue 3 que encapsula toda a lógica de CRUD de prazos no Firestore.

### Função principal

#### `usePrazos(userRef)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `userRef` | `Ref<User> \| User` | Referência reativa (ou valor direto) ao usuário autenticado |

Retorna `{ prazos, addPrazo, updatePrazo, deletePrazo }`.

### Variáveis internas

| Variável | Tipo | Descrição |
|---|---|---|
| `prazos` | `Ref<Array>` | Array reativo com todos os prazos do usuário logado, mantido sincronizado em tempo real com o Firestore via `onSnapshot` |

### Lógica de sincronização

O `watchEffect` observa `userRef`. Quando o UID do usuário estiver disponível, cria um listener `onSnapshot` na coleção `prazos` filtrando por `userId == uid`. O listener é destruído automaticamente via `onCleanup` quando o `watchEffect` re-executa ou o componente é desmontado.

### Funções internas

#### `uid()` *(privada)*
Extrai o UID do usuário de `userRef`, seja ele um `Ref` reativo ou um valor direto.

---

### Funções exportadas

#### `addPrazo(data)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `data` | `Object` | Dados do prazo (titulo, obs, data, completed, completedDate, protocol) |

Adiciona um novo documento na coleção `prazos` no Firestore, injetando automaticamente `userId` e `createdAt` (timestamp do servidor).

---

#### `updatePrazo(id, data)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | ID do documento no Firestore |
| `data` | `Object` | Campos a atualizar (parcial) |

Atualiza campos específicos de um prazo existente.

---

#### `deletePrazo(id)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | ID do documento no Firestore |

Remove permanentemente um prazo do Firestore.

---

## src/composables/useAudiencias.js

Idêntico ao `usePrazos.js` em estrutura, mas opera na coleção `audiencias`.

### Função principal

#### `useAudiencias(userRef)`
Retorna `{ audiencias, addAudiencia, updateAudiencia, deleteAudiencia }`.

### Variáveis internas

| Variável | Tipo | Descrição |
|---|---|---|
| `audiencias` | `Ref<Array>` | Array reativo com todas as audiências do usuário, sincronizado em tempo real |

### Funções exportadas

#### `addAudiencia(data)`
Adiciona audiência na coleção `audiencias` com `userId` e `createdAt` automáticos.

#### `updateAudiencia(id, data)`
Atualiza campos de uma audiência existente.

#### `deleteAudiencia(id)`
Remove uma audiência do Firestore.

---

## src/views/LoginView.vue

Tela de autenticação com quatro fluxos distintos controlados pela variável `view`.

### Variáveis de controle de tela

| Variável | Tipo | Valores possíveis | Descrição |
|---|---|---|---|
| `view` | `Ref<string>` | `'login'`, `'token'`, `'registro'`, `'esqueci'` | Controla qual formulário é exibido |
| `showIosBanner` | `Ref<boolean>` | `true` / `false` | Exibe banner de instalação do PWA em dispositivos iOS que ainda não instalaram o app |

### Variáveis — Bloco Login

| Variável | Tipo | Descrição |
|---|---|---|
| `loginEmail` | `Ref<string>` | Campo de e-mail do formulário de login |
| `loginSenha` | `Ref<string>` | Campo de senha do formulário de login |
| `loginErro` | `Ref<string>` | Mensagem de erro exibida abaixo do formulário |
| `loginLoading` | `Ref<boolean>` | Desabilita o botão e exibe "Entrando..." durante a requisição |

### Variáveis — Bloco Token (Primeiro Acesso)

| Variável | Tipo | Descrição |
|---|---|---|
| `tokenInput` | `Ref<string>` | Valor do campo de código no formato `XXXX-XXXX` |
| `tokenErro` | `Ref<string>` | Mensagem de erro da validação do token |
| `tokenLoading` | `Ref<boolean>` | Estado de carregamento durante a consulta ao Firestore |
| `tokenDocId` | `Ref<string>` | ID do documento do token no Firestore, guardado para marcar como usado após o registro |

### Variáveis — Bloco Registro

| Variável | Tipo | Descrição |
|---|---|---|
| `regEmail` | `Ref<string>` | E-mail do novo usuário |
| `regSenha` | `Ref<string>` | Senha escolhida |
| `regSenha2` | `Ref<string>` | Confirmação de senha (comparada com `regSenha`) |
| `regErro` | `Ref<string>` | Mensagem de erro do formulário de registro |
| `regLoading` | `Ref<boolean>` | Estado de carregamento durante a criação da conta |

### Variáveis — Bloco Esqueci a Senha

| Variável | Tipo | Descrição |
|---|---|---|
| `esqueciEmail` | `Ref<string>` | E-mail para recebimento do link de redefinição |
| `esqueciErro` | `Ref<string>` | Mensagem de erro |
| `esqueciOk` | `Ref<boolean>` | Exibe mensagem de sucesso quando o e-mail é enviado |
| `esqueciLoading` | `Ref<boolean>` | Estado de carregamento |

### Funções

#### `fazerLogin()`
Valida se e-mail e senha estão preenchidos, chama `signInWithEmailAndPassword` do Firebase Auth. Em caso de sucesso, o listener `onAuthStateChanged` redireciona automaticamente para `/`.

---

#### `onTokenInput(e)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `e` | `InputEvent` | Evento nativo do campo de input |

Formata o código de token em tempo real enquanto o usuário digita:
1. Converte para maiúsculas
2. Remove caracteres que não sejam letras ou números
3. Insere automaticamente o hífen após o 4º caractere → `XXXX-XXXX`

---

#### `validarToken()`
Consulta a coleção `tokens` no Firestore buscando um documento onde `token == tokenInput` e `used == false`.
- Se encontrar: salva o `tokenDocId` e avança para a tela de registro
- Se não encontrar: exibe mensagem de erro

---

#### `criarConta()`
Fluxo de registro em 3 etapas:
1. Cria o usuário no Firebase Auth com `createUserWithEmailAndPassword`
2. Marca o token como usado no Firestore (`used: true`, `usedBy`, `usedAt`)
3. Cria o documento do usuário na coleção `users` com e-mail, ID do token e timestamp

---

#### `enviarReset()`
Chama `sendPasswordResetEmail` com o e-mail informado. Exibe `esqueciOk = true` em caso de sucesso.

---

#### `traduzirErro(code)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `code` | `string` | Código de erro retornado pelo Firebase Auth (ex: `'auth/wrong-password'`) |

Traduz os códigos de erro técnicos do Firebase para mensagens amigáveis em português. Retorna `"Erro inesperado. Tente novamente."` para códigos não mapeados.

---

## src/views/AppView.vue

Tela principal do aplicativo. Gerencia prazos e audiências do usuário logado.

### Variáveis de estado geral

| Variável | Tipo | Descrição |
|---|---|---|
| `router` | `Router` | Instância do Vue Router para navegação programática |
| `currentUser` | `Ref<User\|null>` | Usuário atualmente logado. A tela só é renderizada quando não é `null` |
| `showIosBanner` | `Ref<boolean>` | Banner de instalação do PWA para iOS |
| `activeTab` | `Ref<string>` | Aba ativa no mobile: `'prazos'` ou `'audiencias'` |
| `hoje` | `string` | Data de hoje em `YYYY-MM-DD`, calculada uma vez na inicialização do componente |

### Dados do composable — Prazos

| Variável | Tipo | Descrição |
|---|---|---|
| `prazos` | `Ref<Array>` | Todos os prazos do usuário (via `usePrazos`) |
| `addPrazo` | `Function` | Adiciona prazo no Firestore |
| `updatePrazo` | `Function` | Atualiza prazo no Firestore |
| `deletePrazo` | `Function` | Remove prazo do Firestore |

### Computed — Prazos

| Computed | Descrição |
|---|---|
| `pendentes` | Prazos com `completed == false`, ordenados por data crescente (mais urgentes primeiro) |
| `concluidos` | Prazos com `completed == true`, ordenados por `completedDate` decrescente (mais recentes primeiro) |

### Variáveis — Modal de Prazo (`mp`)

Objeto reativo (`reactive`) que controla o modal de criação/edição de prazos.

| Campo | Tipo | Descrição |
|---|---|---|
| `mp.open` | `boolean` | Controla visibilidade do modal |
| `mp.editId` | `string\|null` | ID do prazo sendo editado. `null` significa criação de novo |
| `mp.titulo` | `string` | Campo "Descrição do Prazo" |
| `mp.obs` | `string` | Campo "Observações" (opcional) |
| `mp.data` | `string` | Campo "Data limite" no formato `YYYY-MM-DD` |
| `mp.saving` | `boolean` | Desabilita o botão durante o salvamento |

### Variáveis — Modal de Protocolo (`mpr`)

Modal para registrar o número/texto do protocolo ao concluir um prazo.

| Campo | Tipo | Descrição |
|---|---|---|
| `mpr.open` | `boolean` | Controla visibilidade |
| `mpr.prazoId` | `string` | ID do prazo a ser concluído |
| `mpr.texto` | `string` | Texto livre do protocolo (ex: número, descrição do envio) |
| `mpr.saving` | `boolean` | Estado de carregamento |

### Variáveis — Modal Visualizar Protocolo (`mvp`)

Modal somente-leitura para exibir o protocolo já registrado.

| Campo | Tipo | Descrição |
|---|---|---|
| `mvp.open` | `boolean` | Controla visibilidade |
| `mvp.content` | `string` | Texto do protocolo a ser exibido |

### Dados do composable — Audiências

| Variável | Tipo | Descrição |
|---|---|---|
| `audiencias` | `Ref<Array>` | Todas as audiências do usuário (via `useAudiencias`) |
| `addAudiencia` | `Function` | Adiciona audiência no Firestore |
| `updateAudiencia` | `Function` | Atualiza audiência no Firestore |
| `deleteAudiencia` | `Function` | Remove audiência do Firestore |

### Computed — Audiências

| Computed | Descrição |
|---|---|
| `proximas` | Audiências com data `>= hoje`, ordenadas por data e hora crescentes |
| `passadas` | Audiências com data `< hoje`, ordenadas por data e hora **decrescente** (mais recentes primeiro) |

### Variáveis — Modal de Audiência (`ma`)

Objeto reativo que controla o modal de criação/edição de audiências.

| Campo | Tipo | Descrição |
|---|---|---|
| `ma.open` | `boolean` | Controla visibilidade |
| `ma.editId` | `string\|null` | ID da audiência sendo editada. `null` = nova |
| `ma.titulo` | `string` | Descrição da audiência |
| `ma.data` | `string` | Data da audiência (`YYYY-MM-DD`) |
| `ma.hora` | `string` | Horário da audiência (`HH:MM`) |
| `ma.online` | `boolean` | Se `true`, a audiência é online (exibe campo de link em vez de local) |
| `ma.local` | `string` | Endereço físico (quando `online == false`) |
| `ma.link` | `string` | URL da reunião online (quando `online == true`) |
| `ma.obs` | `string` | Observações adicionais |
| `ma.saving` | `boolean` | Estado de carregamento |

### Funções

#### `logout()`
Chama `signOut(auth)` do Firebase e redireciona para `/login`.

---

#### `abrirModalPrazo(id?)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string \| null` | ID do prazo para edição. Omitir abre o modal em modo criação |

Reseta os campos do modal `mp` e, se `id` for fornecido, pré-preenche com os dados do prazo existente.

---

#### `salvarPrazo()`
Valida campos obrigatórios (`titulo` e `data`). Dependendo de `mp.editId`:
- **Edição:** chama `updatePrazo` com os campos alterados
- **Criação:** chama `addPrazo` com todos os campos, incluindo `completed: false` e `protocol: null`

Fecha o modal ao finalizar com sucesso.

---

#### `confirmarDeletarPrazo(id)`
Exibe `confirm()` nativo do navegador. Se confirmado, chama `deletePrazo(id)`.

---

#### `abrirModalProtocolo(id)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | ID do prazo a ser concluído |

Abre o modal `mpr` para registrar o protocolo de conclusão do prazo.

---

#### `confirmarConclusao()`
Monta o objeto `protocol` com `{ type: 'text', content: mpr.texto }` (ou `null` se o texto estiver vazio).
Chama `updatePrazo` marcando `completed: true`, `completedDate: todayStr()` e `protocol`.

---

#### `verProtocolo(id)`
Busca o prazo pelo ID, extrai o conteúdo do protocolo e abre o modal `mvp` em modo leitura.

---

#### `abrirModalAudiencia(id?)`
Idêntico a `abrirModalPrazo` mas para audiências. Reseta e pré-preenche os campos do modal `ma`.

---

#### `salvarAudiencia()`
Valida:
- Campos obrigatórios: `titulo`, `data`, `hora`
- Se online: `link` obrigatório
- Se presencial: `local` obrigatório

Monta o objeto `obj` garantindo que `local` ou `link` sejam esvaziados conforme o tipo, e chama `addAudiencia` ou `updateAudiencia`.

---

#### `confirmarDeletarAudiencia(id)`
Exibe `confirm()` e, se confirmado, chama `deleteAudiencia(id)`.

---

## src/views/AdminView.vue

Painel de administração para gerenciamento de tokens de acesso. Só é acessível pelo usuário administrador (verificado no documento `config/admin` do Firestore).

### Variáveis de estado

| Variável | Tipo | Descrição |
|---|---|---|
| `router` | `Router` | Instância do Vue Router |
| `currentUser` | `Ref<User\|null>` | Usuário administrador logado |
| `tokens` | `Ref<Array>` | Lista de todos os tokens, atualizada em tempo real via `onSnapshot` |
| `unsub` | `Function\|null` | Referência à função de cancelamento do listener `onSnapshot` |
| `tokenGerado` | `Ref<string\|null>` | Código gerado mais recentemente, exibido na interface |
| `gerandoToken` | `Ref<boolean>` | Estado de carregamento do botão "Gerar código" |
| `btnCopiarTxt` | `Ref<string>` | Texto do botão de copiar (`"📋 Copiar"` → `"✓ Copiado!"`) |

### Funções

#### `iniciarListaTokens()`
Inicia um listener em tempo real (`onSnapshot`) na coleção `tokens`, ordenados por `createdAt` decrescente. Atualiza `tokens.value` a cada alteração no Firestore.

---

#### `logout()`
Chama `signOut(auth)` e redireciona para `/login`.

---

#### `gerarCodigo()`
Gera um código aleatório de 8 caracteres no formato `XXXX-XXXX`.
Usa o alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sem letras e números ambíguos como `I`, `O`, `0`, `1`).

---

#### `gerarToken()`
1. Chama `gerarCodigo()` para obter um código único
2. Salva o documento na coleção `tokens` com `used: false`, `usedBy: null`, `usedAt: null`, `createdBy` e `createdAt`
3. Atualiza `tokenGerado` para exibir o código na tela

---

#### `copiarToken()`
Copia `tokenGerado` para a área de transferência do sistema usando a API `navigator.clipboard`.
Altera `btnCopiarTxt` para `"✓ Copiado!"` por 2,5 segundos.

---

#### `revogarToken(id)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | ID do documento do token no Firestore |

Exibe `confirm()` e, se confirmado, deleta o documento do token com `deleteDoc`.

---

#### `disponiveis(tokens)` *(função auxiliar inline)*
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `tokens` | `Array` | Lista de tokens |

Filtra e retorna apenas os tokens com `used == false`.

---

#### `utilizados(tokens)` *(função auxiliar inline)*
Filtra e retorna apenas os tokens com `used == true`.

---

#### `formatarData(timestamp)`
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `timestamp` | `Timestamp \| null` | Timestamp do Firestore |

Converte um `Timestamp` do Firestore para string no formato `DD/MM/YYYY`.
Retorna `"—"` se o timestamp for nulo ou inválido.

---

## src/main.js

Ponto de entrada da aplicação.

```
createApp(App)   → Cria a instância Vue com o componente raiz App.vue
  .use(router)   → Registra o Vue Router
  .mount('#app') → Monta o app no elemento <div id="app"> do index.html
```

Também importa `./assets/styles.css` globalmente.

---

## Fluxo geral de dados

```
Firebase Auth
    │
    ├─► onAuthStateChanged → atualiza currentUser (Ref)
    │
    └─► currentUser → passado para usePrazos / useAudiencias
                           │
                           ├─► watchEffect detecta UID
                           │
                           └─► onSnapshot (Firestore)
                                   │
                                   └─► prazos / audiencias (Ref<Array>)
                                               │
                                               └─► computed (pendentes, concluidos,
                                                   proximas, passadas) → template
```

---

## Estrutura de documentos no Firestore

### Coleção `prazos`
| Campo | Tipo | Descrição |
|---|---|---|
| `userId` | `string` | UID do usuário dono do prazo |
| `titulo` | `string` | Descrição do prazo |
| `obs` | `string` | Observações opcionais |
| `data` | `string` | Data limite `YYYY-MM-DD` |
| `completed` | `boolean` | Se o prazo foi concluído |
| `completedDate` | `string\|null` | Data de conclusão `YYYY-MM-DD` |
| `protocol` | `{type, content}\|null` | Protocolo registrado na conclusão |
| `createdAt` | `Timestamp` | Data/hora de criação (servidor) |

### Coleção `audiencias`
| Campo | Tipo | Descrição |
|---|---|---|
| `userId` | `string` | UID do usuário |
| `titulo` | `string` | Descrição da audiência |
| `data` | `string` | Data `YYYY-MM-DD` |
| `hora` | `string` | Horário `HH:MM` |
| `online` | `boolean` | Se é audiência online |
| `local` | `string` | Local físico (quando presencial) |
| `link` | `string` | URL da reunião (quando online) |
| `obs` | `string` | Observações |
| `createdAt` | `Timestamp` | Data/hora de criação |

### Coleção `tokens`
| Campo | Tipo | Descrição |
|---|---|---|
| `token` | `string` | Código no formato `XXXX-XXXX` |
| `used` | `boolean` | Se já foi utilizado |
| `usedBy` | `string\|null` | E-mail do usuário que usou |
| `usedAt` | `Timestamp\|null` | Quando foi usado |
| `createdBy` | `string` | UID do admin que gerou |
| `createdAt` | `Timestamp` | Quando foi gerado |

### Coleção `users`
| Campo | Tipo | Descrição |
|---|---|---|
| `email` | `string` | E-mail do usuário |
| `tokenDocId` | `string` | ID do token usado no cadastro |
| `createdAt` | `Timestamp` | Data do cadastro |

### Documento `config/admin`
| Campo | Tipo | Descrição |
|---|---|---|
| `uid` | `string` | UID do único usuário administrador do sistema |

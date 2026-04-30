# Funcionalidades do Sistema — Agenda Jurídica

Levantamento completo de todas as funções implementadas no sistema.

---

## 1. Autenticação (`login.html` + `js/login.js`)

### 1.1 Login
- Entrada por e-mail e senha via Firebase Authentication
- Redirecionamento automático para o app se já estiver logado
- Mensagens de erro traduzidas para português (e-mail não encontrado, senha incorreta, muitas tentativas, etc.)
- Suporte a tecla Enter no campo de senha para submeter

### 1.2 Primeiro acesso com token
- Campo de código no formato `XXXX-XXXX` com formatação automática ao digitar
- Validação do token no Firestore (verifica se existe e se não foi usado)
- Bloqueio de tokens já utilizados
- Após token válido, exibe formulário de criação de conta

### 1.3 Criação de conta
- Registro com e-mail e senha (mínimo 6 caracteres)
- Confirmação de senha antes de criar
- Marcação do token como utilizado no Firestore após o cadastro
- Criação de perfil do usuário na coleção `users`
- Redirecionamento automático para o app após cadastro

### 1.4 Redefinição de senha
- Envio de e-mail de redefinição via Firebase
- Confirmação visual de envio na tela

### 1.5 Logout
- Botão de saída disponível no cabeçalho do app
- Redireciona para a tela de login

---

## 2. Prazos (`js/prazos.js`)

### 2.1 Listagem
- Exibição em tempo real via listener Firestore (`onSnapshot`)
- Separação visual em duas seções: **Pendentes** e **Concluídos**
- Pendentes ordenados por data mais próxima primeiro
- Concluídos ordenados pelo mais recente

### 2.2 Indicadores de urgência
Cada prazo pendente exibe automaticamente uma tag colorida:

| Situação | Tag |
|---|---|
| Data já passou | 🔴 Vencido há X dia(s) |
| Vence hoje | 🔴 Vence hoje |
| Vence em até 3 dias | 🟠 Vence em X dia(s) |
| Vence em até 7 dias | 🟡 Em X dias |
| Vence em mais de 7 dias | 🟢 Em X dias |

### 2.3 Criar prazo
- Campos: descrição, observações (opcional) e data limite
- Salvo no Firestore com o `userId` do usuário logado
- Lista atualizada automaticamente após salvar

### 2.4 Editar prazo
- Preenche o modal com os dados atuais do prazo
- Atualiza apenas os campos alterados no Firestore

### 2.5 Excluir prazo
- Confirmação antes de excluir
- Remove o documento do Firestore

### 2.6 Concluir prazo com protocolo
- Ao concluir, abre modal perguntando se deseja registrar protocolo
- Campo de texto livre para número ou descrição do protocolo (opcional)
- Salva data de conclusão e protocolo no documento do Firestore
- Prazo concluído exibe: data original, data de conclusão e badge de protocolo se houver

### 2.7 Visualizar protocolo
- Clique em "Ver protocolo" exibe o texto registrado em modal
- Disponível apenas em prazos concluídos com protocolo

---

## 3. Audiências (`js/audiencias.js`)

### 3.1 Listagem
- Exibição em tempo real via listener Firestore
- Separação visual em **Próximas** e **Realizadas**
- Ordenadas por data e horário
- Realizadas aparecem com visual esmaecido e título riscado

### 3.2 Indicadores de urgência (próximas)
| Situação | Tag |
|---|---|
| Acontece hoje | 🔴 Hoje |
| Em até 3 dias | 🟠 Em X dia(s) |
| Em até 7 dias | 🟡 Em X dias |
| Mais de 7 dias | 🟢 Em X dias |

### 3.3 Criar audiência
- Campos: descrição, data, horário, observações (opcional)
- Toggle para alternar entre **presencial** e **online**
- Se presencial: campo de local (ex: "Vara Cível de São Paulo")
- Se online: campo de link da reunião (Zoom, Meet, Teams, etc.)

### 3.4 Audiência online
- Link clicável direto no card — abre a reunião em nova aba
- Badge "💻 Online" exibida no card

### 3.5 Editar audiência
- Preenche o modal com os dados atuais
- Preserva o estado do toggle presencial/online

### 3.6 Excluir audiência
- Confirmação antes de excluir

---

## 4. Painel do Administrador (`admin.html` + `js/admin.js`)

### 4.1 Controle de acesso
- Só permite acesso ao usuário cujo UID está cadastrado em `config/admin` no Firestore
- Qualquer outro usuário é redirecionado para o app

### 4.2 Geração de tokens
- Gera código único no formato `XXXX-XXXX` (sem caracteres ambíguos como 0, O, 1, I, l)
- Salva o token no Firestore com data de criação
- Exibe o token gerado em destaque com botão de copiar
- Confirmação visual ao copiar ("✓ Copiado!")

### 4.3 Listagem de tokens em tempo real
- Separados em **Disponíveis** e **Utilizados**
- Tokens disponíveis: exibem data de geração e botão de revogar
- Tokens utilizados: exibem e-mail de quem usou e data de uso

### 4.4 Revogar token
- Remove o token do Firestore
- Confirmação antes de revogar
- Token revogado não pode mais ser usado para cadastro

---

## 5. Segurança e Dados (`js/storage.js` + Firestore Rules)

### 5.1 Isolamento por usuário
- Todos os prazos e audiências são salvos com o `userId` do criador
- Consultas filtradas por `userId == currentUser.uid`
- Regras do Firestore bloqueiam acesso cruzado entre usuários no servidor

### 5.2 Sincronização em tempo real
- Listeners `onSnapshot` atualizam a tela automaticamente quando dados mudam
- Funciona em múltiplos dispositivos simultaneamente

### 5.3 Persistência offline
- Firebase Firestore configurado com `enablePersistence`
- Dados continuam acessíveis sem internet
- Alterações feitas offline sincronizam ao reconectar

---

## 6. Interface e Navegação (`js/app.js` + `css/styles.css`)

### 6.1 Layout responsivo
- **Desktop:** duas colunas lado a lado (Prazos | Audiências)
- **Mobile:** abas para alternar entre as seções

### 6.2 Modais
- Abrem ao clicar nos botões de ação
- Fecham ao clicar no botão ✕, no botão Cancelar ou fora do modal

### 6.3 Contador de itens
- Badge no cabeçalho de cada coluna mostra o total de itens pendentes

### 6.4 Estados visuais
- Cards com hover suave
- Itens concluídos/realizados com visual esmaecido
- Botões com estado de carregamento durante operações assíncronas (ex: "Salvando...")

### 6.5 Banner de instalação iOS
- Detecta automaticamente Safari no iPhone/iPad fora do modo standalone
- Exibe banner fixo na parte inferior orientando como instalar via "Adicionar à Tela de Início"
- Botão para fechar o banner

---

## 7. PWA — Instalação como App (`manifest.json` + `sw.js`)

### 7.1 Android (Chrome)
- Prompt automático de instalação na barra do navegador
- Ícone na tela inicial, abre em tela cheia

### 7.2 iPhone / iPad (Safari)
- Meta tags Apple configuradas (`apple-mobile-web-app-capable`, `apple-touch-icon`, etc.)
- Ícone PNG 192×192 e 512×512 para a tela inicial
- Banner de instrução exibido automaticamente no Safari

### 7.3 Computador (Chrome / Edge)
- Botão de instalação na barra de endereços
- Abre em janela própria sem barra do navegador
- Aparece no menu Iniciar / Launchpad

### 7.4 Funcionamento offline
- Service Worker cacheia todos os arquivos do app na primeira visita
- Versão cacheada servida automaticamente sem conexão
- Cache atualizado em segundo plano quando há nova versão

---

## 8. Hospedagem e Deploy

| Serviço | Uso |
|---|---|
| Firebase Authentication | Login, cadastro e redefinição de senha |
| Firebase Firestore | Banco de dados em tempo real (prazos, audiências, tokens, usuários) |
| Firebase Hosting | Hospedagem do app (CDN global, HTTPS automático) |

- Deploy com um único comando: `firebase deploy --only hosting`
- URL pública: `https://agenda-juridica-956d1.web.app`

---

## Resumo de páginas

| Página | Acesso | Função |
|---|---|---|
| `/` | Usuário logado | App principal (prazos e audiências) |
| `/login.html` | Público | Login, primeiro acesso e reset de senha |
| `/admin.html` | Somente admin | Geração e gestão de tokens de acesso |

# Como colocar a Agenda Jurídica online

## O que você vai precisar

- Conta Google (para o Firebase)
- [Node.js](https://nodejs.org) instalado (versão 18 ou superior)
- Terminal (PowerShell, CMD ou Terminal do VS Code)
- Chrome ou Edge (para gerar os ícones)

---

## Passo 1 — Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"**
3. Dê um nome (ex: `agenda-juridica`) e clique em **Continuar**
4. Desative o Google Analytics (não é necessário) e clique em **Criar projeto**
5. Aguarde a criação e clique em **Continuar**

---

## Passo 2 — Ativar a autenticação por e-mail

1. No menu lateral, clique em **Authentication**
2. Clique em **Começar**
3. Na aba **"Método de login"**, clique em **E-mail/senha**
4. Ative a primeira opção e clique em **Salvar**

---

## Passo 3 — Criar o banco de dados (Firestore)

1. No menu lateral, clique em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Selecione **"Iniciar no modo de produção"** e clique em **Próximo**
4. Escolha a região `southamerica-east1 (São Paulo)` e clique em **Ativar**
5. Aguarde a criação do banco

### Configurar as regras de segurança do Firestore

1. Dentro do Firestore, clique na aba **"Regras"**
2. Apague o conteúdo existente e cole o seguinte:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /tokens/{id} {
      allow read: if true;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/config/admin).data.uid == request.auth.uid;
    }

    match /config/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/config/admin).data.uid == request.auth.uid;
    }

    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /prazos/{id} {
      allow read, write, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    match /audiencias/{id} {
      allow read, write, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

  }
}
```

3. Clique em **Publicar**

---

## Passo 4 — Registrar o app web e copiar as credenciais

1. Na página inicial do projeto, clique no ícone **`</>`** (Web)
2. Dê um apelido (ex: `agenda-web`) e marque **"Firebase Hosting"**
3. Clique em **Registrar app**
4. Você verá um bloco de código assim:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "agenda-juridica.firebaseapp.com",
  projectId: "agenda-juridica",
  storageBucket: "agenda-juridica.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. Abra o arquivo `js/firebase-config.js` e substitua os valores pelos seus
6. Clique em **Próximo** (pode pular os demais passos do assistente por enquanto)

---

## Passo 5 — Gerar os ícones do app

Os ícones PNG são obrigatórios para instalação no iPhone e Android.

1. Abra o arquivo `icons/generate-icon.html` no Chrome ou Edge
2. Clique em **"Baixar icon-512.png"** e salve dentro da pasta `icons/`
3. Clique em **"Baixar icon-192.png"** e salve dentro da pasta `icons/`
4. Confirme que a pasta ficou assim:
   ```
   icons/
   ├── icon.svg
   ├── icon-192.png
   └── icon-512.png
   ```

---

## Passo 6 — Criar sua conta de administrador

1. No menu lateral do Firebase, clique em **Authentication**
2. Vá para a aba **"Usuários"** e clique em **"Adicionar usuário"**
3. Preencha com o seu e-mail e uma senha forte e clique em **Adicionar usuário**
4. Copie o **UID** que aparece na lista (coluna "Identificador do usuário")

### Criar o documento de admin no Firestore

1. No menu lateral, clique em **Firestore Database**
2. Clique em **"+ Iniciar coleção"**
3. ID da coleção: `config` → clique em **Próximo**
4. ID do documento: `admin`
5. Adicione os campos:
   - Campo `uid` → tipo **string** → valor: *(cole o UID copiado)*
   - Campo `email` → tipo **string** → valor: *(seu e-mail)*
6. Clique em **Salvar**

> A partir daqui, ao acessar `/admin.html` com seu e-mail e senha, você terá acesso ao painel de geração de tokens para os clientes.

---

## Passo 7 — Publicar com Firebase Hosting

> Os arquivos `firebase.json` e `.firebaserc` já estão criados no projeto — não é necessário rodar `firebase init`.

Abra o terminal **dentro da pasta do projeto** e execute:

```bash
# 1. Instala a ferramenta do Firebase globalmente (só na primeira vez)
npm install -g firebase-tools

# 2. Faz login na sua conta Google
firebase login

# 3. Publica o app
firebase deploy --only hosting
```

Ao final o terminal mostrará a URL, como:

```
Hosting URL: https://agenda-juridica-956d1.web.app
```

---

## Passo 8 — Testar o fluxo completo

1. Acesse `https://seu-projeto.web.app/admin.html` com seu e-mail e senha
2. Clique em **"+ Gerar código"** e copie o código gerado
3. Abra `https://seu-projeto.web.app` em uma aba anônima
4. Clique em **"Primeiro acesso"**, cole o código e crie um e-mail e senha de teste
5. Confirme que os dados de prazos e audiências são salvos e sincronizados
6. Tudo funcionando: o cliente já pode usar o link

---

## Como instalar o app nos dispositivos

### Computador (Windows / Mac) — Chrome ou Edge

1. Acesse o link do app no navegador
2. Clique no ícone **⊕** ou **⬇** no canto direito da barra de endereços
3. Clique em **"Instalar"**
4. O app abre em janela própria e aparece no menu Iniciar / Launchpad

### Android — Chrome

1. Acesse o link no Chrome
2. Toque no menu **⋮** (três pontos) no canto superior direito
3. Toque em **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Confirme — o ícone aparece na tela inicial como qualquer app

### iPhone / iPad — Safari

> ⚠️ **Obrigatório usar o Safari.** Chrome e outros navegadores no iOS não permitem instalação de PWA.

1. Abra o link no **Safari**
2. Toque no botão **Compartilhar** (ícone de caixa com seta para cima, na barra inferior)
3. Role a lista e toque em **"Adicionar à Tela de Início"**
4. Confirme o nome e toque em **"Adicionar"**
5. O ícone da balança aparece na tela inicial e o app abre em tela cheia

> O app também mostra automaticamente um aviso na tela orientando o usuário a instalar pelo Safari.

---

## Como atualizar o app no futuro

Sempre que fizer alterações nos arquivos, basta rodar:

```bash
firebase deploy --only hosting
```

---

## Resumo rápido

```
Firebase Console
  ├── Authentication  → ativar E-mail/senha + criar seu usuário admin
  ├── Firestore       → criar banco + colar regras + criar doc config/admin
  └── Hosting         → registrar app web + copiar credenciais para firebase-config.js

Projeto local
  └── icons/generate-icon.html → abrir no Chrome → baixar icon-192.png e icon-512.png

Terminal (dentro da pasta do projeto)
  ├── npm install -g firebase-tools
  ├── firebase login
  └── firebase deploy --only hosting   ← firebase.json e .firebaserc já estão prontos

Resultado: https://seu-projeto.web.app
  ├── /             → app principal (requer login)
  ├── /login.html   → login e primeiro acesso com token
  └── /admin.html   → painel para gerar tokens de acesso
```

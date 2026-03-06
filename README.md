# VacarIA — Assistente para Professores de Inglês

Assistente pedagógico com IA (Grok-4) para geração de planos de aula de Língua Inglesa,
alinhado à BNCC, Referencial Gaúcho, DCOMVAC e Sistema Aprende Brasil.

---

## 🖥️ Rodar localmente (desenvolvimento)

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior

### Passos

1. Descompacte e abra a pasta no VSCode
2. Instale as dependências:
   ```bash
   npm install
   ```
3. O arquivo `.env.local` já vem configurado com a chave da API.
4. Inicie o servidor:
   ```bash
   npm run dev
   ```
5. Acesse: [http://localhost:5173](http://localhost:5173)

---

## 🚀 Deploy no Vercel (produção)

### 1. Enviar para o GitHub

```bash
# Na pasta do projeto, inicialize o repositório:
git init
git add .
git commit -m "first commit"

# Crie um repositório no github.com e depois:
git remote add origin https://github.com/SEU_USUARIO/vacarIA.git
git branch -M main
git push -u origin main
```

### 2. Importar no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **"Add New Project"**
3. Selecione o repositório **vacarIA**
4. Clique em **"Deploy"** (o Vercel detecta Vite automaticamente)

### 3. Configurar a variável de ambiente no Vercel

> ⚠️ O `.env.local` NÃO é enviado ao GitHub por segurança. Você deve adicionar a chave manualmente no Vercel.

1. No painel do projeto no Vercel, vá em **Settings → Environment Variables**
2. Adicione:
   - **Name:** `GROK_API_KEY`
   - **Value:** `SUA_CHAVE_AQUI`
   - **Environments:** ✅ Production ✅ Preview ✅ Development
3. Clique em **Save**
4. Vá em **Deployments** e clique em **Redeploy** para aplicar

Seu site estará disponível em `https://vacaria.vercel.app` (ou similar).

---

## 🏗️ Estrutura do projeto

```
vacarIA-projeto/
├── api/
│   └── grok.js          # Serverless function (proxy seguro para a xAI)
├── src/
│   ├── main.jsx         # Ponto de entrada React
│   └── App.jsx          # Componente principal (UI + lógica)
├── .env.local           # Chave local (NÃO vai para o GitHub)
├── .gitignore
├── index.html
├── vercel.json          # Configuração do Vercel
├── vite.config.js       # Proxy local para desenvolvimento
├── package.json
└── README.md
```

---

## 🔒 Segurança

A chave da API **nunca fica exposta no frontend**. O fluxo é:

```
Navegador → /api/grok → Vercel Function → api.x.ai
```

A função serverless (`api/grok.js`) lê a chave da variável de ambiente do servidor
e a injeta na requisição — o usuário final nunca vê a chave.

---

Desenvolvido para professores de inglês da Rede Municipal de Vacaria/RS.

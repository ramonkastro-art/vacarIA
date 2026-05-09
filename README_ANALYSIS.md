# 📊 Análise Completa do Projeto VacarIA

**Data da Análise:** 09 de Abril de 2026  
**Repositório:** https://github.com/ramonkastro-art/vacarIA  
**Objetivo:** Documentar arquitetura atual e planejar implementação do modelo freemium

---

## 📋 Índice
1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura Atual](#arquitetura-atual)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Estrutura de Pastas e Arquivos](#estrutura-de-pastas-e-arquivos)
5. [Análise Detalhada dos Componentes](#análise-detalhada-dos-componentes)
6. [Funcionalidades Existentes](#funcionalidades-existentes)
7. [Banco de Dados Atual (Supabase)](#banco-de-dados-atual-supabase)
8. [Pontos de Integração para Novas Funcionalidades](#pontos-de-integração-para-novas-funcionalidades)
9. [Recomendações de Arquitetura](#recomendações-de-arquitetura)
10. [Plano de Migração](#plano-de-migração)
11. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral do Projeto

### O que é o VacarIA?
VacarIA é um assistente pedagógico com IA para professores de Língua Inglesa da Rede Municipal de Vacaria/RS e outros estados brasileiros. O sistema gera:
- **Planos de aula** alinhados à BNCC e referenciais curriculares estaduais
- **Atividades avaliativas** (provas/exercícios) personalizadas

### Público-Alvo
- Professores de Inglês do ensino fundamental (Pré-escola ao 9º ano)
- Atualmente focado no Brasil, mas extensível para outros estados

### Modelo de Negócio Atual
- **100% gratuito** - sem limitações de uso
- Já possui base de usuários ativos no Brasil

### Modelo de Negócio Proposto (Freemium)
- **Versão Gratuita:** Funcionalidades atuais (geração de planos e avaliações)
- **Versão Premium:** 
  - Histórico de planos e avaliações gerados
  - Curadoria de metodologias docentes
  - Área de usuário com login (Google SSO)
  - Recursos avançados de personalização

---

## 🏗️ Arquitetura Atual

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   App.jsx    │  │ AdminPanel   │  │   tracker.js │    │
│  │ (Gerador UI) │  │  (Dashboard) │  │  (Analytics) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                  │                  │            │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              VERCEL SERVERLESS FUNCTIONS                    │
│                                                             │
│  ┌──────────────┐          ┌──────────────┐               │
│  │  api/grok.js │          │api/avaliacao │               │
│  │ (Planos de   │          │    .js       │               │
│  │   Aula)      │          │ (Avaliações) │               │
│  └──────────────┘          └──────────────┘               │
│         │                         │                        │
└─────────┼─────────────────────────┼────────────────────────┘
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    APIs EXTERNAS DE IA                      │
│                                                             │
│  ┌──────────────┐          ┌──────────────┐               │
│  │  Groq API    │          │ Gemini API   │               │
│  │ (Llama 3.3)  │          │ (Fallback)   │               │
│  └──────────────┘          └──────────────┘               │
└─────────────────────────────────────────────────────────────┘

          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                    │
│                                                             │
│  ┌──────────────┐          ┌──────────────┐               │
│  │access_logs   │          │interaction   │               │
│  │(Analytics)   │          │   _logs      │               │
│  └──────────────┘          └──────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Tipo de Aplicação
- **SPA (Single Page Application)** - React puro
- **NÃO é Next.js** - É React + Vite
- **Renderização:** Client-side rendering (CSR)
- **Deploy:** Vercel
- **PWA:** Service Worker configurado (offline capability)

---

## 💻 Stack Tecnológica

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.3.1 | Framework UI |
| **Vite** | 5.4.2 | Build tool e dev server |
| **CSS** | Vanilla | Estilização inline (styles object) |

### Backend
| Tecnologia | Propósito |
|------------|-----------|
| **Vercel Serverless Functions** | APIs para proxy de IA |
| **Node.js** | Runtime das functions |

### Banco de Dados
| Tecnologia | Propósito | Status |
|------------|-----------|--------|
| **Supabase** | PostgreSQL hospedado | ⚠️ **Credenciais hardcoded** |
| **@supabase/supabase-js** | 2.101.1 | Client SDK |

### APIs de IA
| Provedor | Modelo | Uso |
|----------|--------|-----|
| **Groq** | llama-3.3-70b-versatile | Geração de planos de aula (primário) |
| **Gemini** | gemini-2.0-flash | Avaliações (primário) + fallback |

### Deploy & Infraestrutura
- **Vercel** - Hospedagem e CI/CD
- **GitHub** - Controle de versão
- **PWA** - Service Worker para cache offline

---

## 📁 Estrutura de Pastas e Arquivos

```
vacarIA/
├── api/
│   ├── grok.js              # Serverless function - Planos de aula
│   └── avaliacao.js         # Serverless function - Avaliações
│
├── src/
│   ├── main.jsx             # Entry point React
│   ├── App.jsx              # Componente principal (UI + lógica)
│   ├── App.css              # Estilos do App
│   ├── AdminPanel.jsx       # Dashboard admin com senha
│   ├── supabase.js          # Cliente Supabase (env vars)
│   ├── supabaseClient.js    # ⚠️ Cliente com credenciais hardcoded
│   └── tracker.js           # Sistema de analytics
│
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker
│   ├── icon-*.png           # Ícones PWA
│   ├── docx-generator.html  # Gerador DOCX standalone
│   └── game-*.html          # Mini-games educacionais (4 jogos)
│
├── index.html               # HTML raiz
├── vite.config.js           # Configuração Vite + proxy dev
├── vercel.json              # Configuração Vercel
├── package.json             # Dependências
└── README.md                # Documentação
```

### 🎮 Recursos Adicionais Descobertos
O projeto inclui **4 mini-games educacionais** standalone em HTML puro:
1. **English Quest** - Jogo de aventura
2. **To Be Racer** - Corrida com verbo "to be"
3. **Verb Shooter** - Jogo de tiro com verbos
4. **Who's Door** - Jogo de portas

⚠️ **Nota:** Estes jogos não estão integrados ao sistema principal.

---

## 🔍 Análise Detalhada dos Componentes

### 1. **App.jsx** - Componente Principal

#### Funcionalidades
- **Geração de Planos de Aula**
  - Seleção de ano escolar (Pré-escola ao 9º ano)
  - Tema customizável
  - Duração (1 ou 2 períodos)
  - Nível (Básico, Intermediário, Avançado)
  - Recursos disponíveis (Quadro negro, Cards, Notebook, Ar livre)
  - Estado brasileiro (27 estados + referenciais curriculares)
  
- **Geração de Avaliações**
  - Mesmo formulário base (ano, tema, nível)
  - Quantidade de questões (10 ou 20)
  - Tipos de questões: múltipla escolha, relacionar colunas, interpretação, charadas

- **Sistema de Abas**
  - Aba "Plano de Aula"
  - Aba "Avaliação"
  - Aba "Admin" (protegida por senha)

#### Prompts de IA
Os prompts são **extremamente detalhados** (189 linhas para planos de aula):
- Inclui restrições pedagógicas da BNCC
- Adapta para referenciais curriculares estaduais
- Gera exemplos de atividades específicas por recurso
- Suporta aulas ao ar livre com dinâmicas físicas
- Personaliza para 3 níveis de proficiência

**Função Principal:**
```javascript
buildPrompt(ano, tema, duracao, nivel, recursos, estado)
```

**Chamada da API:**
```javascript
async function callAPI(params) {
  const response = await fetch("/api/grok", {
    method: "POST",
    body: JSON.stringify({
      messages: [
        { role: "system", content: "..." },
        { role: "user", content: buildPrompt(...) }
      ],
      temperature: 0.65,
      max_tokens: 4000
    })
  })
}
```

---

### 2. **api/grok.js** - Planos de Aula

#### Fluxo de Execução
```
1. Recebe requisição POST do frontend
2. Tenta Groq API (llama-3.3-70b-versatile)
3. Se falhar (rate limit/quota), fallback para Gemini
4. Retorna resposta normalizada + provedor usado
```

#### Características
- **Timeouts:** 30 segundos (configurado no vercel.json)
- **CORS:** Habilitado para todas as origens
- **Variáveis de ambiente:**
  - `GROQ_API_KEY` - Groq
  - `GEMINI_API_KEY` - Gemini (fallback)
- **Modelo Groq:** llama-3.3-70b-versatile
- **Temperatura:** 0.65 (balanceada)

---

### 3. **api/avaliacao.js** - Avaliações

#### Fluxo de Execução
```
1. Recebe requisição POST do frontend
2. PRIORIZA Gemini (com autodescoberta de modelos)
3. Lista modelos disponíveis via API
4. Tenta até 3 modelos Gemini (prioriza "flash")
5. Se todos falharem, fallback para Groq
6. Retorna resposta + diagnóstico de erros
```

#### Características Únicas
- **Autodescoberta de Modelos:** Consulta `listModels` da Gemini
- **Multi-tentativa:** Tenta 3 modelos diferentes
- **Priorização:** Modelos "flash" primeiro (mais rápidos)
- **Temperatura:** 0.3 (mais determinística para avaliações)
- **Timeouts:** 45 segundos (mais tempo que planos)
- **Diagnóstico:** Retorna `_gemini_diagnostico` com erros

---

### 4. **tracker.js** - Sistema de Analytics

#### Funcionalidades
- **Rastreamento de Acessos** (`trackPageAccess`)
  - IP do usuário (via ipapi.co)
  - Localização geográfica (cidade, estado, país)
  - User agent completo
  - Tipo de dispositivo (mobile/tablet/desktop)
  - Navegador
  - Caminho da página
  - Timestamp

- **Rastreamento de Interações** (`trackInteraction`)
  - Tipo de interação
  - Feature utilizada (plano/avaliação)
  - Texto do prompt
  - Resumo da resposta
  - Duração em ms
  - Sucesso/falha
  - Mensagem de erro (se houver)

#### Integração
```javascript
// No App.jsx
useEffect(() => {
  trackPageAccess();
}, []);

// Ao gerar plano/avaliação
trackInteraction({
  type: 'geração',
  feature: 'plano_aula',
  prompt: tema,
  durationMs: Date.now() - startTime,
  success: true
});
```

---

### 5. **AdminPanel.jsx** - Dashboard

#### Características
- **Autenticação:** Senha hardcoded (`V@c@R1A2026`)
- **Visualização:**
  - Lista de acessos (100 mais recentes)
  - Lista de interações (100 mais recentes)
  - Cards de resumo (total acessos, interações, IPs únicos, localizações)
- **Abas:** Acessos vs Interações
- **Formato:** Modal overlay com scroll

#### ⚠️ Problemas de Segurança
- Senha hardcoded no código
- Sem JWT ou sessão
- Sem rate limiting
- Dados sensíveis (IPs) expostos

---

## 🗄️ Banco de Dados Atual (Supabase)

### Esquema Identificado

#### Tabela: `access_logs`
```sql
CREATE TABLE access_logs (
  id SERIAL PRIMARY KEY,
  ip_address TEXT,
  ip_location TEXT,
  page_path TEXT,
  user_agent TEXT,
  device_type TEXT,    -- mobile/tablet/desktop
  browser_name TEXT,   -- Chrome/Firefox/Safari/Edge
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: `interaction_logs`
```sql
CREATE TABLE interaction_logs (
  id SERIAL PRIMARY KEY,
  ip_address TEXT,
  interaction_type TEXT,
  prompt_text TEXT,
  response_summary TEXT,
  feature_used TEXT,
  duration_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

#### Stored Procedures (RPCs)
- `get_access_stats()` - Estatísticas de acessos
- `get_interaction_stats()` - Estatísticas de interações
- `get_top_features()` - Features mais usadas

### ⚠️ Problema Crítico: Duas Configurações de Supabase

#### 1. `src/supabase.js` (✅ Correto)
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)
```
**Usado por:** tracker.js (analytics)

#### 2. `src/supabaseClient.js` (❌ Hardcoded)
```javascript
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-publica-aqui';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```
**Usado por:** AdminPanel.jsx

**Conclusão:** O sistema atual tem configuração duplicada e inconsistente.

---

## ✅ Funcionalidades Existentes

### Para Usuários (Professores)
1. ✅ Geração de planos de aula personalizados
2. ✅ Geração de avaliações/provas
3. ✅ Suporte a 27 estados brasileiros + referenciais curriculares
4. ✅ Exportação em Markdown (copy/paste)
5. ✅ PWA - funciona offline após primeiro acesso
6. ✅ Responsivo (mobile/tablet/desktop)

### Para Administradores
1. ✅ Dashboard de analytics
2. ✅ Visualização de acessos e interações
3. ✅ Métricas básicas (IPs únicos, localizações)

### Sistema de Tracking
1. ✅ Rastreamento automático de acessos
2. ✅ Rastreamento de uso das features
3. ✅ Geolocalização de usuários
4. ✅ Detecção de dispositivo e navegador

---

## 🚀 Pontos de Integração para Novas Funcionalidades

### 1. **Autenticação (Google SSO)**

#### Onde Implementar
- **Novo componente:** `src/Auth.jsx`
- **Provider:** Envolver App.jsx com `<AuthProvider>`
- **Hooks:** `useAuth()` para acessar estado do usuário

#### Integração com Supabase/Abacus
```javascript
// Opção 1: Supabase Auth
import { supabase } from './supabase'
await supabase.auth.signInWithOAuth({ provider: 'google' })

// Opção 2: NextAuth.js (migrando para Next.js)
// Opção 3: Auth0 / Firebase Auth
// Opção 4: Google OAuth direto + backend próprio
```

#### Mudanças Necessárias
- **App.jsx:** Adicionar verificação de autenticação
  ```javascript
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginPage />;
  ```
- **AdminPanel.jsx:** Substituir senha hardcoded por role do usuário
- **tracker.js:** Incluir `user_id` nos logs

#### Recomendação
**Usar Supabase Auth** (já está configurado):
- Suporte nativo a Google SSO
- Row Level Security (RLS) para proteção de dados
- Session management automático
- SDK já presente no projeto

---

### 2. **Sistema Freemium (Premium vs Gratuito)**

#### Estrutura de Dados Necessária

##### Tabela: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free' | 'premium'
  subscription_status TEXT DEFAULT 'active', -- 'active' | 'cancelled' | 'expired'
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  mercado_pago_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Lógica de Controle de Acesso

**No App.jsx:**
```javascript
const { user } = useAuth();
const isPremium = user?.subscription_tier === 'premium';

// Bloquear features premium para usuários gratuitos
if (!isPremium && feature === 'historico') {
  return <UpgradePrompt />;
}
```

**Limites Gratuitos vs Premium:**
```javascript
const LIMITS = {
  free: {
    gerações_por_dia: 5,
    historico: false,
    curadoria: false,
    exportar_docx: false
  },
  premium: {
    gerações_por_dia: Infinity,
    historico: true,
    curadoria: true,
    exportar_docx: true
  }
};
```

#### Onde Implementar
- **Novo componente:** `src/UpgradePrompt.jsx` (modal de upgrade)
- **Novo componente:** `src/PricingTable.jsx` (página de preços)
- **Modificar:** `App.jsx` - adicionar verificação de limites
- **Nova função:** `src/utils/checkUserLimits.js`

---

### 3. **Histórico de Planos e Avaliações**

#### Estrutura de Dados

##### Tabela: `lesson_plans`
```sql
CREATE TABLE lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadados do plano
  title TEXT NOT NULL,
  grade_level TEXT NOT NULL,        -- "6º Ano"
  topic TEXT NOT NULL,               -- Tema da aula
  duration TEXT,                     -- "1 período (40 min)"
  proficiency_level TEXT,            -- "Básico"
  state TEXT,                        -- "RS"
  resources TEXT[],                  -- ["Quadro negro", "Cards"]
  
  -- Conteúdo gerado
  content TEXT NOT NULL,             -- Plano completo em Markdown
  prompt_used TEXT,                  -- Prompt enviado à IA
  ai_provider TEXT,                  -- "groq" | "gemini"
  ai_model TEXT,                     -- "llama-3.3-70b-versatile"
  
  -- Metadados de geração
  generation_duration_ms INTEGER,
  tokens_used INTEGER,
  
  -- Organização
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[],                       -- ["vocabulário", "games"]
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lesson_plans_user ON lesson_plans(user_id);
CREATE INDEX idx_lesson_plans_created ON lesson_plans(created_at DESC);
```

##### Tabela: `assessments` (estrutura similar)
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  topic TEXT NOT NULL,
  proficiency_level TEXT,
  question_count INTEGER,           -- 10 ou 20
  content TEXT NOT NULL,
  prompt_used TEXT,
  ai_provider TEXT,
  ai_model TEXT,
  generation_duration_ms INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Funcionalidades do Histórico
1. **Listagem:** Tabela paginada com filtros
   - Por data (mais recentes primeiro)
   - Por ano escolar
   - Por tema
   - Favoritos
   
2. **Detalhes:** Modal expandido com opções
   - Visualizar conteúdo completo
   - Editar título/tags
   - Marcar como favorito
   - Exportar (DOCX, PDF)
   - Duplicar (regerar com mesmo prompt)
   - Deletar

3. **Busca:** Full-text search no conteúdo

#### Onde Implementar
- **Novo componente:** `src/History.jsx` (aba "Histórico")
- **Novo componente:** `src/HistoryItem.jsx` (card de item)
- **Novo serviço:** `src/services/lessonPlanService.js`
- **Modificar:** `App.jsx` - salvar no DB após gerar
  ```javascript
  async function callAPI(params) {
    const result = await fetch("/api/grok", ...);
    
    // Salvar no histórico (apenas para usuários premium)
    if (user && isPremium) {
      await saveLessonPlan({
        user_id: user.id,
        title: `${params.tema} - ${params.ano}`,
        grade_level: params.ano,
        topic: params.tema,
        content: result.text,
        ai_provider: result.provider,
        ...
      });
    }
    
    return result;
  }
  ```

---

### 4. **Curadoria de Metodologias Docentes**

#### Conceito
Biblioteca de recursos pedagógicos curados:
- Metodologias ativas (PBL, Gamificação, Flipped Classroom)
- Estratégias de ensino de inglês (CLIL, Task-based Learning)
- Templates de atividades
- Planejamentos anuais/bimestrais
- Materiais complementares

#### Estrutura de Dados

##### Tabela: `methodologies`
```sql
CREATE TABLE methodologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,        -- "gamificacao-ensino-ingles"
  title TEXT NOT NULL,              -- "Gamificação no Ensino de Inglês"
  subtitle TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL,           -- "metodologia" | "estrategia" | "template"
  grade_levels TEXT[],              -- ["6º Ano", "7º Ano", ...]
  topics TEXT[],                    -- ["vocabulário", "gramática"]
  
  -- Conteúdo
  content_markdown TEXT NOT NULL,   -- Artigo completo
  key_concepts TEXT[],              -- ["engajamento", "pontos", "badges"]
  practical_examples TEXT[],        -- Exemplos práticos
  resources_links JSONB,            -- Links externos
  
  -- Metadados
  author TEXT,                      -- Nome do especialista
  reading_time_minutes INTEGER,
  difficulty_level TEXT,            -- "iniciante" | "intermediário" | "avançado"
  
  -- Premium
  is_premium BOOLEAN DEFAULT FALSE, -- Se exige assinatura
  
  -- Engagement
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### Tabela: `user_methodology_favorites`
```sql
CREATE TABLE user_methodology_favorites (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  methodology_id UUID REFERENCES methodologies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, methodology_id)
);
```

#### Interface
- **Página principal:** Grid de cards com filtros
- **Página de detalhes:** Artigo completo + recursos
- **Filtros:** Categoria, ano escolar, tema, nível
- **Busca:** Full-text
- **Favoritos:** Sistema de bookmark

#### Onde Implementar
- **Novo componente:** `src/Methodologies.jsx` (aba "Curadoria")
- **Novo componente:** `src/MethodologyDetail.jsx`
- **Novo serviço:** `src/services/methodologyService.js`
- **Nova API:** `api/methodologies.js` (CRUD)

#### Integração com Gerador
**Sugestão de Metodologia ao Gerar Plano:**
```javascript
// Após selecionar tema/nível, sugerir metodologias relevantes
const suggestedMethodologies = await fetchRelevantMethodologies({
  topic: params.tema,
  gradeLevel: params.ano
});

// Exibir card: "💡 Sugestão: Experimente a metodologia X para este tema"
```

---

### 5. **Integração de Pagamentos (Mercado Pago)**

#### Fluxo de Pagamento

```
1. Usuário clica em "Assinar Premium"
2. Modal de checkout com planos (mensal/anual)
3. Redireciona para Mercado Pago (checkout pro ou transparente)
4. Mercado Pago processa pagamento
5. Webhook notifica backend
6. Backend atualiza status do usuário
7. Usuário é redirecionado de volta com sucesso
8. Frontend atualiza UI para refletir premium
```

#### Estrutura de Dados

##### Tabela: `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Mercado Pago IDs
  mp_subscription_id TEXT UNIQUE,   -- ID da assinatura no MP
  mp_customer_id TEXT,              -- ID do cliente no MP
  mp_payment_method TEXT,           -- "credit_card" | "pix" | "boleto"
  
  -- Plano
  plan_type TEXT NOT NULL,          -- "monthly" | "annual"
  plan_price DECIMAL(10, 2),        -- Preço pago
  currency TEXT DEFAULT 'BRL',
  
  -- Status
  status TEXT NOT NULL,             -- "active" | "cancelled" | "expired" | "past_due"
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  
  -- Histórico
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### Tabela: `payment_transactions`
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  
  -- Mercado Pago
  mp_payment_id TEXT UNIQUE,
  mp_transaction_id TEXT,
  
  -- Detalhes
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL,             -- "pending" | "approved" | "rejected" | "refunded"
  payment_method TEXT,
  installments INTEGER DEFAULT 1,
  
  -- Metadados
  metadata JSONB,                   -- Informações adicionais
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### APIs Necessárias

##### 1. **api/checkout.js** - Criar sessão de checkout
```javascript
export default async function handler(req, res) {
  const { user_id, plan_type } = req.body;
  
  // 1. Verificar autenticação
  const user = await getUserFromSession(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  // 2. Criar preferência no Mercado Pago
  const preference = {
    items: [{
      title: plan_type === 'monthly' ? 'VacarIA Premium Mensal' : 'VacarIA Premium Anual',
      unit_price: plan_type === 'monthly' ? 29.90 : 299.90,
      quantity: 1,
    }],
    back_urls: {
      success: `${process.env.APP_URL}/checkout/success`,
      failure: `${process.env.APP_URL}/checkout/failure`,
      pending: `${process.env.APP_URL}/checkout/pending`,
    },
    auto_return: 'approved',
    notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
  };
  
  const mp = new MercadoPago(process.env.MERCADO_PAGO_ACCESS_TOKEN);
  const response = await mp.preferences.create(preference);
  
  return res.json({ checkout_url: response.body.init_point });
}
```

##### 2. **api/webhooks/mercadopago.js** - Receber notificações
```javascript
export default async function handler(req, res) {
  const { type, data } = req.body;
  
  if (type === 'payment') {
    const payment = await fetchPaymentFromMP(data.id);
    
    if (payment.status === 'approved') {
      // Atualizar usuário para premium
      await activatePremiumSubscription(payment.metadata.user_id);
    }
  }
  
  return res.status(200).send('OK');
}
```

#### Onde Implementar
- **Novo componente:** `src/Checkout.jsx` (página de checkout)
- **Novo componente:** `src/PricingPlans.jsx` (tabela de preços)
- **Nova API:** `api/checkout.js`
- **Nova API:** `api/webhooks/mercadopago.js`
- **Novo serviço:** `src/services/subscriptionService.js`

#### SDK Recomendado
```bash
npm install mercadopago
```

---

## 🎨 Recomendações de Arquitetura

### 1. **Migrar para Next.js (Opcional mas Recomendado)**

#### Por quê?
- **SSR/SSG:** SEO melhorado para curadoria de metodologias
- **API Routes:** Backend integrado (menos complexidade que Vercel Functions)
- **Autenticação:** NextAuth.js (melhor integração)
- **File-based routing:** Mais escalável
- **App Router:** React Server Components

#### Estrutura Proposta (Next.js 14+)
```
vacaria-nextjs/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Dashboard principal
│   │   │   ├── historico/
│   │   │   ├── curadoria/
│   │   │   └── configuracoes/
│   │   └── layout.tsx               # Layout autenticado
│   ├── api/
│   │   ├── auth/[...nextauth]/      # NextAuth
│   │   ├── grok/
│   │   ├── avaliacao/
│   │   ├── checkout/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                          # Componentes base
│   ├── LessonPlanGenerator.tsx
│   ├── AssessmentGenerator.tsx
│   ├── History.tsx
│   └── Methodologies.tsx
├── lib/
│   ├── db.ts                        # Abacus AI PostgreSQL
│   ├── auth.ts                      # NextAuth config
│   └── mercadopago.ts
└── middleware.ts                    # Proteção de rotas
```

#### Vantagens
✅ Backend e frontend no mesmo projeto  
✅ Rotas protegidas nativas (`middleware.ts`)  
✅ Server Actions para mutações  
✅ Melhor DX (Developer Experience)  
✅ TypeScript nativo  
✅ Caching avançado  

#### Desvantagens
❌ Migração trabalhosa (reescrever App.jsx)  
❌ Curva de aprendizado (se equipe não conhece Next.js)  
❌ Mais pesado que SPA puro  

### 2. **Manter React + Vite (Mais Simples)**

Se optar por manter a arquitetura atual:

#### Melhorias Necessárias
1. **Adicionar React Router** para múltiplas páginas
   ```bash
   npm install react-router-dom
   ```

2. **Estrutura de pastas revisada**
   ```
   src/
   ├── components/
   │   ├── auth/
   │   ├── generators/
   │   ├── history/
   │   └── methodologies/
   ├── pages/
   │   ├── HomePage.jsx
   │   ├── HistoryPage.jsx
   │   ├── CuradoriaPage.jsx
   │   └── CheckoutPage.jsx
   ├── services/
   │   ├── api.js
   │   ├── auth.js
   │   └── subscription.js
   ├── hooks/
   │   ├── useAuth.js
   │   └── useSubscription.js
   ├── contexts/
   │   └── AuthContext.jsx
   └── utils/
   ```

3. **State Management**
   - Usar Context API ou Zustand
   - Evitar prop drilling
   
4. **TypeScript** (altamente recomendado)
   ```bash
   npm install -D typescript @types/react @types/react-dom
   ```

---

### 3. **Banco de Dados: Migrar de Supabase para Abacus AI PostgreSQL**

#### Por quê migrar?
- ✅ Consolidar infraestrutura
- ✅ Reduzir custos (?)
- ✅ Maior controle sobre o banco
- ✅ Integração nativa com outros produtos Abacus AI

#### Passos para Migração

##### 1. **Configurar Abacus AI PostgreSQL**
```javascript
// lib/db.js
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.ABACUS_PG_HOST,
  port: process.env.ABACUS_PG_PORT,
  database: process.env.ABACUS_PG_DATABASE,
  user: process.env.ABACUS_PG_USER,
  password: process.env.ABACUS_PG_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

export default pool;
```

##### 2. **Exportar dados do Supabase**
```sql
-- No Supabase SQL Editor
COPY access_logs TO '/tmp/access_logs.csv' CSV HEADER;
COPY interaction_logs TO '/tmp/interaction_logs.csv' CSV HEADER;
```

##### 3. **Recriar schema no Abacus AI**
```sql
-- Executar scripts de criação de tabelas
-- (access_logs, interaction_logs, users, lesson_plans, etc.)
```

##### 4. **Importar dados**
```sql
COPY access_logs FROM '/tmp/access_logs.csv' CSV HEADER;
COPY interaction_logs FROM '/tmp/interaction_logs.csv' CSV HEADER;
```

##### 5. **Atualizar código**
Substituir todas as chamadas `supabase.from('table')` por queries SQL diretas:
```javascript
// Antes (Supabase)
const { data } = await supabase
  .from('lesson_plans')
  .select('*')
  .eq('user_id', userId);

// Depois (PostgreSQL direto)
const result = await pool.query(
  'SELECT * FROM lesson_plans WHERE user_id = $1',
  [userId]
);
const data = result.rows;
```

##### 6. **Autenticação**
Se migrar do Supabase Auth, implementar JWT manual:
```javascript
// api/auth/login.js
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { user_id: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

res.cookie('auth_token', token, { httpOnly: true, secure: true });
```

#### Alternativa: Manter Supabase Auth + Abacus AI PostgreSQL
- **Autenticação:** Supabase (Google SSO já configurado)
- **Dados da aplicação:** Abacus AI PostgreSQL
- **Vantagem:** Melhor dos dois mundos

---

### 4. **Segurança**

#### Problemas Atuais
❌ Senha do admin hardcoded  
❌ CORS aberto para todas as origens  
❌ Sem rate limiting  
❌ IPs armazenados sem consentimento LGPD  
❌ Credenciais Supabase hardcoded em `supabaseClient.js`  

#### Melhorias Necessárias

##### 1. **Remover senha hardcoded**
```javascript
// Substituir por role no banco
const { user } = await supabase.auth.getUser();
const isAdmin = user.role === 'admin';
```

##### 2. **CORS restritivo**
```javascript
// api/grok.js
const allowedOrigins = [
  'https://vacaria.vercel.app',
  'https://www.vacaria.com.br'
];
const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

##### 3. **Rate Limiting**
```bash
npm install express-rate-limit
```
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 requisições por IP
});

app.use('/api/grok', limiter);
```

##### 4. **Validação de Input**
```bash
npm install zod
```
```javascript
import { z } from 'zod';

const lessonPlanSchema = z.object({
  ano: z.enum(ANOS),
  tema: z.string().min(3).max(100),
  duracao: z.enum(DURACOES),
  nivel: z.enum(NIVEIS),
});

const params = lessonPlanSchema.parse(req.body);
```

##### 5. **LGPD Compliance**
- Adicionar banner de consentimento
- Política de privacidade
- Opção de deletar dados (GDPR right to be forgotten)
- Anonimizar IPs antes de armazenar

---

## 📋 Plano de Migração

### Fase 1: Preparação (1-2 semanas)
1. ✅ Análise completa do código atual (concluído)
2. [ ] Definir stack final (Next.js ou React+Vite?)
3. [ ] Criar repositório de desenvolvimento
4. [ ] Configurar banco Abacus AI PostgreSQL
5. [ ] Criar schemas de tabelas novas (users, lesson_plans, etc.)
6. [ ] Configurar Google OAuth
7. [ ] Configurar Mercado Pago (sandbox)

### Fase 2: Autenticação (1 semana)
1. [ ] Implementar login com Google
2. [ ] Criar página de registro
3. [ ] Implementar sistema de sessões
4. [ ] Proteger rotas privadas
5. [ ] Migrar AdminPanel para usar roles

### Fase 3: Sistema Freemium (2 semanas)
1. [ ] Criar tabela users e subscriptions
2. [ ] Implementar lógica de limites (free vs premium)
3. [ ] Criar página de pricing
4. [ ] Implementar checkout com Mercado Pago
5. [ ] Criar webhook de pagamento
6. [ ] Testar fluxo completo em sandbox
7. [ ] Adicionar banners de upgrade

### Fase 4: Histórico (2 semanas)
1. [ ] Criar tabelas lesson_plans e assessments
2. [ ] Modificar callAPI() para salvar no DB
3. [ ] Implementar página de histórico
4. [ ] Adicionar filtros e busca
5. [ ] Implementar favoritos
6. [ ] Adicionar exportação (DOCX, PDF)

### Fase 5: Curadoria (2-3 semanas)
1. [ ] Criar tabela methodologies
2. [ ] Popular com conteúdo inicial (10-20 artigos)
3. [ ] Implementar página de listagem
4. [ ] Implementar página de detalhes
5. [ ] Adicionar sistema de favoritos
6. [ ] Integrar sugestões ao gerador

### Fase 6: Testes e Deploy (1-2 semanas)
1. [ ] Testes de integração
2. [ ] Testes de pagamento (sandbox → produção)
3. [ ] Testes de carga
4. [ ] Deploy em staging
5. [ ] Testes de aceitação com usuários beta
6. [ ] Deploy em produção
7. [ ] Monitoramento

### Fase 7: Migração de Usuários (1 semana)
1. [ ] Notificar usuários atuais sobre mudanças
2. [ ] Oferecer período de teste premium gratuito
3. [ ] Migrar dados de analytics existentes
4. [ ] Comunicação de lançamento

**Total estimado:** 10-13 semanas (2,5-3 meses)

---

## 🎯 Próximos Passos Imediatos

### 1. Decisão Tecnológica (Prioridade Máxima)
**Pergunta:** Migrar para Next.js ou manter React+Vite?

**Recomendação:** 
- **Se equipe sabe Next.js:** Migrar (vale a pena no longo prazo)
- **Se não:** Manter React+Vite e adicionar React Router

### 2. Configurar Ambiente de Desenvolvimento
```bash
# Clonar projeto
git clone https://github.com/ramonkastro-art/vacarIA.git
cd vacarIA

# Instalar dependências
npm install

# Criar .env.local
VITE_GROK_API_KEY=gsk_...
VITE_GEMINI_API_KEY=AIza...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
JWT_SECRET=...
ABACUS_PG_HOST=...
ABACUS_PG_USER=...
ABACUS_PG_PASSWORD=...
ABACUS_PG_DATABASE=vacaria

# Rodar
npm run dev
```

### 3. Configurar Banco Abacus AI
1. Criar database `vacaria`
2. Executar script de schema (criar arquivo `schema.sql`)
3. Testar conexão
4. Criar primeiras tabelas (users, subscriptions)

### 4. Implementar Autenticação (MVP)
1. Configurar Google OAuth
2. Criar página de login simples
3. Salvar usuário no banco
4. Implementar JWT
5. Proteger rota de histórico

### 5. Testar Mercado Pago Sandbox
1. Criar conta de testes
2. Implementar checkout básico
3. Testar fluxo de pagamento
4. Implementar webhook

---

## 📊 Estrutura de Dados Completa (Schema SQL)

```sql
-- ====================================================================
-- SCHEMA COMPLETO - VACARIA PREMIUM
-- ====================================================================

-- 1. USUÁRIOS E AUTENTICAÇÃO
-- ====================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  google_id TEXT UNIQUE,           -- ID do Google OAuth
  
  -- Assinatura
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'past_due')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  
  -- Mercado Pago
  mercado_pago_customer_id TEXT,
  
  -- Metadados
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_status);

-- ====================================================================

-- 2. ASSINATURAS E PAGAMENTOS
-- ====================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Mercado Pago
  mp_subscription_id TEXT UNIQUE,
  mp_customer_id TEXT,
  mp_payment_method TEXT,
  
  -- Plano
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  plan_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  
  -- Mercado Pago
  mp_payment_id TEXT UNIQUE,
  mp_transaction_id TEXT,
  
  -- Detalhes
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  payment_method TEXT,
  installments INTEGER DEFAULT 1,
  
  -- Metadados
  metadata JSONB,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_transactions_status ON payment_transactions(status);

-- ====================================================================

-- 3. PLANOS DE AULA
-- ====================================================================
CREATE TABLE lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadados
  title TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  topic TEXT NOT NULL,
  duration TEXT,
  proficiency_level TEXT,
  state TEXT,
  resources TEXT[],
  
  -- Conteúdo
  content TEXT NOT NULL,
  prompt_used TEXT,
  
  -- IA
  ai_provider TEXT,
  ai_model TEXT,
  generation_duration_ms INTEGER,
  tokens_used INTEGER,
  
  -- Organização
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  folder TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lesson_plans_user ON lesson_plans(user_id);
CREATE INDEX idx_lesson_plans_created ON lesson_plans(created_at DESC);
CREATE INDEX idx_lesson_plans_favorite ON lesson_plans(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_lesson_plans_search ON lesson_plans USING GIN(to_tsvector('portuguese', title || ' ' || topic || ' ' || content));

-- ====================================================================

-- 4. AVALIAÇÕES
-- ====================================================================
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadados
  title TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  topic TEXT NOT NULL,
  proficiency_level TEXT,
  question_count INTEGER,
  
  -- Conteúdo
  content TEXT NOT NULL,
  prompt_used TEXT,
  
  -- IA
  ai_provider TEXT,
  ai_model TEXT,
  generation_duration_ms INTEGER,
  tokens_used INTEGER,
  
  -- Organização
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  folder TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assessments_user ON assessments(user_id);
CREATE INDEX idx_assessments_created ON assessments(created_at DESC);
CREATE INDEX idx_assessments_favorite ON assessments(user_id, is_favorite) WHERE is_favorite = TRUE;

-- ====================================================================

-- 5. CURADORIA DE METODOLOGIAS
-- ====================================================================
CREATE TABLE methodologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  
  -- Conteúdo
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  
  -- Categorização
  category TEXT NOT NULL CHECK (category IN ('metodologia', 'estrategia', 'template', 'material')),
  grade_levels TEXT[],
  topics TEXT[],
  key_concepts TEXT[],
  
  -- Recursos
  practical_examples TEXT[],
  resources_links JSONB,
  video_url TEXT,
  pdf_url TEXT,
  
  -- Metadados
  author TEXT,
  author_bio TEXT,
  reading_time_minutes INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('iniciante', 'intermediario', 'avancado')),
  
  -- Premium
  is_premium BOOLEAN DEFAULT FALSE,
  
  -- SEO
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Engagement
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_methodologies_slug ON methodologies(slug);
CREATE INDEX idx_methodologies_category ON methodologies(category);
CREATE INDEX idx_methodologies_published ON methodologies(status, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_methodologies_search ON methodologies USING GIN(to_tsvector('portuguese', title || ' ' || description || ' ' || content_markdown));

CREATE TABLE user_methodology_favorites (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  methodology_id UUID REFERENCES methodologies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, methodology_id)
);

-- ====================================================================

-- 6. ANALYTICS (mantém estrutura atual)
-- ====================================================================
CREATE TABLE access_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL para usuários não logados
  ip_address TEXT,
  ip_location TEXT,
  page_path TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interaction_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  interaction_type TEXT,
  prompt_text TEXT,
  response_summary TEXT,
  feature_used TEXT,
  duration_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp DESC);
CREATE INDEX idx_access_logs_user ON access_logs(user_id);
CREATE INDEX idx_interaction_logs_timestamp ON interaction_logs(timestamp DESC);
CREATE INDEX idx_interaction_logs_user ON interaction_logs(user_id);

-- ====================================================================

-- 7. TRIGGERS PARA UPDATED_AT
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON lesson_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_methodologies_updated_at BEFORE UPDATE ON methodologies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================

-- 8. FUNCTIONS ÚTEIS
-- ====================================================================

-- Verificar se usuário é premium ativo
CREATE OR REPLACE FUNCTION is_user_premium(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_uuid
      AND subscription_tier = 'premium'
      AND subscription_status = 'active'
      AND (subscription_end_date IS NULL OR subscription_end_date > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Contar gerações do dia (para limites free tier)
CREATE OR REPLACE FUNCTION count_generations_today(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  plan_count INTEGER;
  assessment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count
  FROM lesson_plans
  WHERE user_id = user_uuid AND created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO assessment_count
  FROM assessments
  WHERE user_id = user_uuid AND created_at >= CURRENT_DATE;
  
  RETURN plan_count + assessment_count;
END;
$$ LANGUAGE plpgsql;

-- Incrementar visualizações de metodologia
CREATE OR REPLACE FUNCTION increment_methodology_views(methodology_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE methodologies
  SET views_count = views_count + 1
  WHERE id = methodology_uuid;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- FIM DO SCHEMA
-- ====================================================================
```

---

## 🎨 Wireframes e Fluxos (Recomendação)

### Páginas Necessárias

#### Públicas
1. **Landing Page** (atual)
2. **Login/Registro** (nova)
3. **Pricing** (nova)
4. **Curadoria** (pública com paywall)

#### Privadas (requer login)
5. **Dashboard** (nova)
   - Visão geral
   - Gerações recentes
   - Estatísticas pessoais
6. **Gerador de Planos** (atual App.jsx)
7. **Gerador de Avaliações** (atual App.jsx)
8. **Histórico** (nova)
9. **Configurações** (nova)
10. **Checkout** (nova)

#### Admin
11. **Admin Analytics** (atual AdminPanel)
12. **Gerenciar Metodologias** (nova)
13. **Gerenciar Usuários** (nova)

---

## ⚠️ Riscos e Mitigações

### Risco 1: Usuários Atuais Rejeitarem Freemium
**Mitigação:**
- Oferecer período de teste premium de 30 dias para usuários existentes
- Manter funcionalidades atuais gratuitas
- Comunicação transparente sobre mudanças

### Risco 2: Mercado Pago Problemas de Integração
**Mitigação:**
- Testar exaustivamente em sandbox
- Implementar fallback manual (pagamento por PIX com confirmação manual)
- Suporte dedicado para problemas de pagamento

### Risco 3: Custos de IA Aumentarem
**Mitigação:**
- Implementar cache de respostas similares
- Adicionar timeout mais agressivo
- Considerar modelo de créditos em vez de ilimitado

### Risco 4: Migração de Banco Quebrar Analytics
**Mitigação:**
- Fazer backup completo do Supabase antes
- Migrar em etapas (novo DB em paralelo)
- Manter Supabase read-only por 30 dias após migração

### Risco 5: LGPD/Privacidade
**Mitigação:**
- Adicionar política de privacidade
- Implementar consentimento de cookies
- Anonimizar IPs antes de armazenar
- Adicionar funcionalidade de "deletar minha conta"

---

## 📈 Métricas de Sucesso

### Fase 1 (Lançamento)
- [ ] 100% dos usuários atuais migrados
- [ ] 10% de conversão free → premium no primeiro mês
- [ ] 0 bugs críticos em pagamentos
- [ ] Tempo de geração < 15s (95th percentile)

### Fase 2 (Crescimento - 3 meses)
- [ ] 500+ usuários registrados
- [ ] 50+ assinantes premium
- [ ] Churn rate < 10%
- [ ] NPS > 40

### Fase 3 (Maturidade - 6 meses)
- [ ] 2000+ usuários registrados
- [ ] 200+ assinantes premium (10% conversão)
- [ ] MRR de R$ 6.000
- [ ] 50+ metodologias publicadas

---

## 🔗 Recursos Externos Recomendados

### Documentação
- [Mercado Pago Developers](https://www.mercadopago.com.br/developers/pt)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Router](https://reactrouter.com/)

### Bibliotecas Úteis
```bash
# Autenticação
npm install next-auth @auth/core

# Banco de dados
npm install pg @vercel/postgres

# Pagamentos
npm install mercadopago

# Validação
npm install zod

# State management
npm install zustand

# UI
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install tailwindcss

# Exportação
npm install jspdf docx

# Rate limiting
npm install express-rate-limit

# Markdown
npm install react-markdown remark-gfm
```

---

## 🎓 Considerações Finais

### Pontos Fortes do Projeto Atual
✅ **Código limpo e bem estruturado**  
✅ **Prompts de IA extremamente detalhados** (melhor que muitos produtos comerciais)  
✅ **Sistema de analytics robusto**  
✅ **PWA funcional**  
✅ **Deploy automatizado** (Vercel)  
✅ **Fallback de IA** (Groq → Gemini)  

### Pontos a Melhorar
❌ **Segurança** (senha hardcoded, CORS aberto)  
❌ **Arquitetura** (SPA simples para projeto que vai crescer)  
❌ **Banco de dados** (configuração duplicada e hardcoded)  
❌ **Sem autenticação** (limite o crescimento do produto premium)  

### Recomendação Final
**Migrar para Next.js** se o objetivo é crescer e profissionalizar. O esforço inicial compensa no longo prazo.

Se preferir simplicidade e velocidade, **manter React+Vite** mas adicionar:
- React Router
- Context API para autenticação
- Pasta `services/` organizada
- TypeScript

---

## 📞 Contato e Próximos Passos

**Criado por:** Abacus AI Agent  
**Data:** 09 de Abril de 2026  
**Repositório:** https://github.com/ramonkastro-art/vacarIA  

### Próxima Reunião Recomendada
**Agenda:**
1. Revisar este documento completo
2. Decidir stack tecnológica (Next.js vs React+Vite)
3. Definir prioridades (MVP mínimo)
4. Estimar timeline realista
5. Distribuir tarefas

---

**FIM DA ANÁLISE** 🎉

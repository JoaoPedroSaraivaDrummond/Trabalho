# Arquitetura de Software — TaskFlow Arc

> Documentação técnica sobre os padrões **MVC (Model-View-Controller)** e **Arquitetura em Camadas (Layered Architecture)** aplicados neste projeto.

---

## Sumário

1. [Visão Geral dos Padrões](#1-visão-geral-dos-padrões)
2. [Arquitetura em Camadas (Layered Architecture)](#2-arquitetura-em-camadas-layered-architecture)
   - [Camada de Rotas](#21-camada-de-rotas-srcroutesjs)
   - [Camada de Controllers](#22-camada-de-controllers-srccontrollersjs)
   - [Camada de Services](#23-camada-de-services-srcservicesjs)
   - [Camada de Repositories](#24-camada-de-repositories-srcrepositoriesjs)
   - [Camada de Configuração/Infraestrutura](#25-camada-de-configuraçãoinfrastrutura-srcconfigjs)
3. [Padrão MVC](#3-padrão-mvc)
   - [Model](#31-model--prismaschemaprisma)
   - [View](#32-view--frontendreact)
   - [Controller](#33-controller--srccontrollersjs)
4. [Fluxo Completo de uma Requisição](#4-fluxo-completo-de-uma-requisição)
5. [Serviço Web Integrado (REST)](#5-serviço-web-integrado-rest)
6. [Princípios e Benefícios da Arquitetura](#6-princípios-e-benefícios-da-arquitetura)

---

## 1. Visão Geral dos Padrões

Este projeto aplica **dois padrões arquiteturais complementares** que trabalham juntos para garantir separação de responsabilidades, testabilidade e manutenibilidade do código.

| Padrão | Escopo | Objetivo |
|---|---|---|
| **MVC** | Sistema completo (Full-stack) | Separar dados (Model), apresentação (View) e lógica de entrada (Controller) |
| **Layered Architecture** | Backend (Node.js/Express) | Dividir o backend em camadas horizontais com dependências de cima para baixo |

Ambos os padrões se **sobrepõem e se complementam**: o Controller do MVC coincide com a camada de Controllers da arquitetura em camadas, e o Model do MVC corresponde à camada de Repositórios + Schema do Prisma.

---

## 2. Arquitetura em Camadas (Layered Architecture)

Na Arquitetura em Camadas, cada camada tem uma única responsabilidade e **só pode se comunicar com a camada imediatamente abaixo dela**. Nunca uma camada inferior "sobe" para chamar uma superior.

```
┌──────────────────────────────────────────┐
│            CLIENTE (Frontend)            │  HTTP Request
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│         CAMADA DE ROTAS (Routes)         │  Dispatcher HTTP
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│      CAMADA DE CONTROLLERS               │  Entrada/Saída HTTP
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│        CAMADA DE SERVICES                │  Regras de Negócio
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│      CAMADA DE REPOSITORIES              │  Acesso a Dados
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│     BANCO DE DADOS (PostgreSQL)          │  Persistência
└──────────────────────────────────────────┘
```

---

### 2.1 Camada de Rotas (`src/routes/*.js`)

**Responsabilidade única:** Mapear verbos e caminhos HTTP para as funções dos controllers. Esta camada não contém nenhuma lógica de negócio — apenas conecta URLs a handlers.

**Arquivos:**
- `src/routes/projectRoutes.js`
- `src/routes/taskRoutes.js`
- `src/routes/externalServiceRoutes.js`

**Exemplo real — `taskRoutes.js`:**
```js
// Rota de estatísticas declarada ANTES de /:id para evitar conflito de roteamento
router.get('/stats', taskController.getDashboardStats);
router.get('/',      taskController.getAll);
router.get('/:id',   taskController.getById);
router.post('/',     taskController.create);
router.put('/:id',   taskController.update);
router.delete('/:id',taskController.delete);
```

> **Padrão aplicado:** Cada rota delega 100% da execução ao controller. Nenhuma lógica de filtro, validação ou banco de dados existe aqui.

---

### 2.2 Camada de Controllers (`src/controllers/*.js`)

**Responsabilidade única:** Tratar o protocolo HTTP. Extrair parâmetros da requisição (`req.params`, `req.query`, `req.body`), chamar o serviço correspondente e retornar a resposta com o **código de status HTTP correto**.

**Arquivos:**
- `src/controllers/taskController.js`
- `src/controllers/projectController.js`
- `src/controllers/externalServiceController.js`

**Exemplo real — `taskController.js` (método `getAll`):**
```js
async getAll(req, res) {
  try {
    // Extrai parâmetros da URL (responsabilidade do Controller)
    const filters = {
      projectId: req.query.projectId,
      status:    req.query.status,
      priority:  req.query.priority,
      category:  req.query.category
    };
    // Delega a lógica para o Service (o Controller NÃO sabe como filtrar)
    const tasks = await taskService.getAllTasks(filters);
    return res.status(200).json(tasks);   // HTTP 200 OK
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

**Exemplo real — `taskController.js` (tratamento de erros semântico):**
```js
async getById(req, res) {
  try {
    const task = await taskService.getTaskById(req.params.id);
    return res.status(200).json(task);
  } catch (error) {
    // O Controller decide o código HTTP correto com base na mensagem de erro do Service
    const status = error.message.includes('não encontrada') ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }
}
```

> **Padrão aplicado:** O Controller **não valida regras de negócio** (ex: "o projeto existe?"). Ele só sabe que se o Service lançar erro de "não encontrada", deve responder com `404 Not Found`.

---

### 2.3 Camada de Services (`src/services/*.js`)

**Responsabilidade única:** Concentrar **toda a lógica de negócio** da aplicação. Esta é a camada mais importante — ela define as regras que fazem a aplicação funcionar.

**Arquivos:**
- `src/services/taskService.js`
- `src/services/projectService.js`
- `src/services/externalProductivityService.js`

**Exemplo real — `taskService.js` (criação de tarefa com múltiplas validações):**
```js
async createTask(data) {
  // Regra 1: título obrigatório
  if (!data.title || data.title.trim() === '') {
    throw new Error('O título da tarefa é obrigatório.');
  }
  // Regra 2: projectId obrigatório e numérico
  if (!data.projectId || isNaN(data.projectId)) {
    throw new Error('Um projeto válido deve ser associado à tarefa.');
  }
  // Regra 3: verificar integridade referencial (o projeto deve existir)
  const project = await projectRepository.findById(data.projectId);
  if (!project) {
    throw new Error('O projeto associado não existe.');
  }
  // Regra 4: validar enum de status
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
  if (data.status && !validStatuses.includes(data.status)) {
    throw new Error('Status inválido.');
  }
  // Regra 5: validar enum de prioridade
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
  if (data.priority && !validPriorities.includes(data.priority)) {
    throw new Error('Prioridade inválida.');
  }
  // Só chama o Repository após todas as validações passarem
  return await taskRepository.create(data);
}
```

**Exemplo real — integração com serviço externo no `getTaskById`:**
```js
async getTaskById(id) {
  const task = await taskRepository.findById(id);
  if (!task) throw new Error('Tarefa não encontrada.');

  // O Service coordena a chamada ao Web Service externo
  const recommendation = await externalProductivityService.getTaskRecommendation(
    task.category,
    task.title
  );
  // Enriquece o dado antes de retornar ao Controller
  return { ...task, intelligence: recommendation };
}
```

> **Padrão aplicado:** O Service **não sabe nada sobre HTTP** (`req`/`res` não existem aqui). Ele apenas recebe dados brutos, aplica as regras e retorna um resultado ou lança um `Error`.

---

### 2.4 Camada de Repositories (`src/repositories/*.js`)

**Responsabilidade única:** Abstrair toda e qualquer comunicação com o banco de dados. Todo código SQL/ORM vive aqui — e **somente aqui**.

**Arquivos:**
- `src/repositories/taskRepository.js`
- `src/repositories/projectRepository.js`

**Exemplo real — `taskRepository.js` (busca com filtros dinâmicos):**
```js
async findAll(filters = {}) {
  const where = {};
  // Constrói o objeto de filtro dinamicamente
  if (filters.projectId) where.projectId = parseInt(filters.projectId);
  if (filters.status)    where.status    = filters.status;
  if (filters.priority)  where.priority  = filters.priority;
  if (filters.category)  where.category  = filters.category;

  return await prisma.task.findMany({
    where,
    include: { project: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
}
```

**Exemplo real — `taskRepository.js` (estatísticas do dashboard com `groupBy`):**
```js
async getDashboardStats() {
  const totalTasks      = await prisma.task.count();
  const completedTasks  = await prisma.task.count({ where: { status: 'COMPLETED' } });
  const pendingTasks    = await prisma.task.count({ where: { status: 'PENDING' } });
  const inProgressTasks = await prisma.task.count({ where: { status: 'IN_PROGRESS' } });

  const tasksByCategory = await prisma.task.groupBy({
    by: ['category'],
    _count: { id: true }
  });
  return { totalTasks, completedTasks, pendingTasks, inProgressTasks, tasksByCategory };
}
```

> **Padrão aplicado (Repository Pattern):** Se o banco de dados mudar (ex: de PostgreSQL para MongoDB), **apenas os arquivos desta pasta precisam ser alterados**. Os Services continuarão funcionando sem nenhuma modificação.

---

### 2.5 Camada de Configuração/Infraestrutura (`src/config/db.js`)

**Responsabilidade única:** Instanciar e exportar o cliente do banco de dados (PrismaClient) com suas configurações (logging, pool de conexões, etc.).

```js
// src/config/db.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Log de todas as queries SQL em dev
});
module.exports = prisma;
```

> Ao centralizar a instância do Prisma em um único módulo, garantimos que toda a aplicação compartilhe **um único pool de conexões**, evitando vazamentos de conexão com o banco.

---

## 3. Padrão MVC

O MVC divide o sistema em três responsabilidades principais, cada uma mapeada para um componente distinto do projeto:

```
┌─────────────────────────────────────────────────────────┐
│                    PADRÃO MVC                           │
│                                                         │
│  ┌──────────┐   interage   ┌─────────────┐             │
│  │   VIEW   │ ◄──────────► │ CONTROLLER  │             │
│  │(Frontend)│              │(src/controll│             │
│  │React/Vite│              │ers/*.js)    │             │
│  └──────────┘              └──────┬──────┘             │
│                                   │ usa                 │
│                            ┌──────▼──────┐             │
│                            │    MODEL    │             │
│                            │(schema.pris │             │
│                            │ma + repos)  │             │
│                            └─────────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

### 3.1 Model — `prisma/schema.prisma`

O **Model** define a estrutura dos dados e as regras de integridade no nível do banco de dados. No Prisma, os modelos são declarados no `schema.prisma` e geram as tabelas PostgreSQL automaticamente via migrations.

```prisma
model Project {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  createdAt   DateTime @default(now())
  tasks       Task[]   // Relação 1:N com Task
}

model Task {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  status      String    @default("PENDING")    // PENDING | IN_PROGRESS | COMPLETED
  priority    String    @default("MEDIUM")     // LOW | MEDIUM | HIGH
  category    String    @default("Geral")
  dueDate     DateTime?
  createdAt   DateTime  @default(now())
  projectId   Int
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

**Aspectos arquiteturais do Model:**
- **`@default`**: Valores padrão garantem consistência sem depender de lógica de aplicação.
- **`onDelete: Cascade`**: Integridade referencial — deletar um Project remove automaticamente suas Tasks.
- **`Task[]` em Project**: A relação bidirecional permite consultas em ambas as direções via Prisma.

> Os **Repositories** são a camada que "fala" com o Model. O Model (schema) define *o quê* existe; o Repository define *como* acessar.

---

### 3.2 View — Frontend (React/Vite)

A **View** é responsável exclusivamente por renderizar a interface e capturar interações do usuário. No projeto, toda a camada View reside no diretório `frontend/`.

**Características da View neste projeto:**
- É uma **SPA (Single Page Application)** construída com React e Vite.
- **Não contém regras de negócio** — apenas exibe dados recebidos via API REST.
- Se comunica com o backend exclusivamente via HTTP (`fetch`/`axios`) para os endpoints `/api/projects` e `/api/tasks`.
- Renderiza o dashboard com estatísticas, lista de tarefas com filtros (status, prioridade, categoria, projeto) e modais de criação/edição.

**Separação garantida:** A View não acessa o banco de dados diretamente. Qualquer mudança na regra de negócio (ex: nova validação de criação de tarefa) **não requer alteração no frontend**.

---

### 3.3 Controller — `src/controllers/*.js`

O **Controller** é o elo entre View e Model no padrão MVC. Ele:
1. Recebe a requisição HTTP enviada pela View.
2. Extrai os dados necessários.
3. Aciona o Service (que coordena o Model via Repository).
4. Devolve a resposta HTTP para a View.

Este componente já foi detalhado na [seção 2.2](#22-camada-de-controllers-srccontrollersjs).

---

## 4. Fluxo Completo de uma Requisição

Abaixo está o rastreamento passo a passo de uma requisição real: **criar uma nova tarefa**.

```
Frontend (View)
    │
    │  POST /api/tasks  { title: "Revisar PR", projectId: 1, priority: "HIGH" }
    ▼
taskRoutes.js (Camada de Rotas)
    │  router.post('/', taskController.create)
    ▼
taskController.js (Controller / MVC Controller)
    │  Extrai req.body
    │  Chama: taskService.createTask(req.body)
    ▼
taskService.js (Camada de Services / Regras de Negócio)
    │  ✔ Valida: title não é vazio
    │  ✔ Valida: projectId é numérico
    │  ✔ Verifica: projectRepository.findById(1) → projeto existe?
    │  ✔ Valida: status e priority são valores válidos
    │  Chama: taskRepository.create(data)
    ▼
taskRepository.js (Camada de Repositories / Acesso a Dados)
    │  Executa: prisma.task.create({ data: { ... } })
    ▼
PostgreSQL (Banco de Dados)
    │  INSERT INTO "Task" (...) VALUES (...)
    │  Retorna: { id: 5, title: "Revisar PR", ... }
    ▼
taskRepository.js → taskService.js → taskController.js
    │
    │  res.status(201).json({ id: 5, title: "Revisar PR", ... })
    ▼
Frontend (View)
    │  Exibe a nova tarefa no dashboard
```

---

## 5. Serviço Web Integrado (REST)

O projeto implementa um **Web Service REST interno** que simula um provedor externo de inteligência de produtividade. Este serviço demonstra o padrão de integração entre serviços e o princípio de **resiliência com fallback**.

### Arquitetura do Serviço Web

```
taskService.js
    │
    │  Ao buscar uma tarefa por ID, enriquece com recomendação externa
    ▼
externalProductivityService.js (Service de integração)
    │  axios.get('http://localhost:5000/api/external-service/productivity-tip')
    │  timeout: 2000ms  ← Resiliência: não trava o sistema
    │
    ├── [SUCESSO] Retorna dica + contexto climático do Mock Web Service
    │
    └── [FALHA/TIMEOUT] Retorna fallback local gerado internamente
         ─ Evita que a falha do serviço externo quebre a aplicação principal
    ▼
externalServiceController.js (Mock Web Service)
    │  Sorteia cidade brasileira + condição climática
    │  Seleciona dica contextualizada por categoria (Trabalho, Estudos, Pessoal, Geral)
    │  Retorna JSON estruturado com { source, tip, weatherContext, requestedAt }
```

### Endpoints do Serviço Externo

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET`  | `/api/external-service/productivity-tip?category=trabalho&title=Revisar PR` | Retorna dica de produtividade contextualizada + clima simulado |

### Resposta do Web Service

```json
{
  "source": "integrated-mock-web-service-rest",
  "tip": "Evite a multitarefa: execute uma atividade por vez e desligue notificações.",
  "weatherContext": {
    "city": "Curitiba",
    "temp": "15°C",
    "condition": "Frio/Nublado",
    "advice": "Luz excelente para telas. Mantenha-se confortável e revise planilhas."
  },
  "requestedAt": "2026-05-31T17:30:00.000Z"
}
```

---

## 6. Princípios e Benefícios da Arquitetura

### Princípio da Responsabilidade Única (SRP)

Cada arquivo do projeto tem **uma e apenas uma razão para mudar**:

| Arquivo | Muda somente quando... |
|---------|------------------------|
| `taskRoutes.js` | Uma URL ou verbo HTTP muda |
| `taskController.js` | O formato da req/res muda |
| `taskService.js` | Uma regra de negócio muda |
| `taskRepository.js` | A query ou o ORM muda |
| `schema.prisma` | A estrutura do banco muda |

### Baixo Acoplamento

- O **Controller** não sabe que existe um banco de dados.
- O **Service** não sabe que existe HTTP.
- O **Repository** não sabe que existem regras de negócio.

### Alta Coesão

Cada camada agrupa funcionalidades fortemente relacionadas entre si e fracamente relacionadas às demais camadas.

### Testabilidade

A separação em camadas permite testar cada componente de forma **isolada**:
- Testar o `taskService` substituindo o `taskRepository` por um mock.
- Testar o `taskController` substituindo o `taskService` por um stub.
- Testar o `taskRepository` apontando para um banco de dados de teste.

### Manutenibilidade e Escalabilidade

- **Trocar o banco de dados** (ex: PostgreSQL → MongoDB): altera apenas `src/repositories/` e `prisma/schema.prisma`.
- **Trocar o framework HTTP** (ex: Express → Fastify): altera apenas `src/routes/` e `src/controllers/`.
- **Adicionar nova regra de negócio**: altera apenas `src/services/`.
- **Mudar a interface**: altera apenas o `frontend/`.

---

> **Conclusão:** A combinação de MVC e Arquitetura em Camadas neste projeto não é redundante — são complementares. O MVC define as fronteiras macroscópicas do sistema (dados, apresentação, controle), enquanto a Arquitetura em Camadas refina a organização interna do backend em responsabilidades granulares e bem definidas.

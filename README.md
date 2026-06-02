# TaskFlow Arc - Gerenciador de Tarefas e Projetos (MVC + Camadas)

Esta é uma aplicação full-stack para gerenciamento de projetos e tarefas desenvolvida com **Node.js, Express, React (Vite), PostgreSQL e Prisma ORM**.
O sistema conta com um **Serviço Web Integrado (REST API)** que simula um provedor externo para fornecer dicas de produtividade e análise de clima dinâmicas com base no contexto da tarefa.

O projeto foi construído seguindo rigorosamente os padrões arquiteturais **MVC** e **Arquitetura em Camadas (Layered Architecture)**.

---

## 1. Mapeamento Arquitetural (MVC & Camadas)

Abaixo está a explicação de como os padrões de projeto se refletem nos diretórios e arquivos da aplicação.

### Camadas de Software (Backend)
No diretório `backend/src/`, as responsabilidades são rigidamente isoladas em camadas horizontais:

1. **Camada de Rotas (`src/routes/`)**
   - **Responsabilidade**: Mapeia as requisições HTTP para as funções dos controladores.
   - **Exemplo**: `projectRoutes.js` mapeia `GET /api/projects` para `projectController.getAll`.

2. **Camada de Controladores (`src/controllers/`) - *Controller (MVC)***
   - **Responsabilidade**: Trata a entrada/saída HTTP. Extrai parâmetros da URL, corpos de requisições, valida cabeçalhos, delega o processamento de regras para a camada de serviços e retorna a resposta com o status HTTP correto (ex: `201 Created`, `400 Bad Request`).
   - **Exemplo**: `taskController.js` recebe os dados da tarefa e envia para `taskService.createTask()`.

3. **Camada de Negócio (`src/services/`)**
   - **Responsabilidade**: Contém toda a lógica de negócio, regras de validação (ex: "um projeto não pode ter nome vazio" ou "verificar se o projeto associado a uma tarefa realmente existe") e coordena comunicações externas (como a chamada ao Web Service).
   - **Exemplo**: `taskService.js` faz validações de negócio e chama o serviço `externalProductivityService.js` para enriquecer a tarefa com dicas inteligentes.

4. **Camada de Acesso a Dados / Repositórios (`src/repositories/`)**
   - **Responsabilidade**: Abstrai as operações de banco de dados. Qualquer consulta ao banco usando Prisma é feita aqui. Se o banco ou o ORM mudar no futuro, a lógica de negócio (Services) continuará intocada.
   - **Exemplo**: `taskRepository.js` realiza queries diretas via Prisma Client no PostgreSQL.

5. **Camada de Modelo (`prisma/schema.prisma`) - *Model (MVC)***
   - **Responsabilidade**: Define a estrutura das entidades e tabelas no banco de dados.
   - **Exemplo**: O arquivo `schema.prisma` define os modelos `Project` e `Task` e suas relações.

6. **Camada de Apresentação (Frontend React) - *View (MVC)***
   - **Responsabilidade**: Interface SPA que renderiza o dashboard, as tabelas de dados, os modais e os filtros estilizados com CSS Vanilla moderno.
   - **Exemplo**: O arquivo `App.jsx` na pasta `frontend/`.

---

## 2. Serviço Web Integrado (REST API)
A aplicação consome um serviço web simulado rodando no mesmo Express mas de forma totalmente desacoplada através de chamadas HTTP internas:
- **Endpoint**: `GET http://localhost:5000/api/external-service/productivity-tip`
- **Funcionalidade**: Recebe a categoria e o título da tarefa, sorteia uma cidade brasileira e uma condição climática (ensolarado, chuvoso, nublado) e gera uma dica de produtividade sob medida para aquela tarefa sob o clima atual (ex: se chover e for trabalho, focar em deep work; se for estudos e ensolarado, fazer sessões de estudo com pausas na luz solar).
- **Resiliência (Fallback)**: O `externalProductivityService` no backend principal possui tratamento de erro robusto. Se o serviço web estiver fora do ar ou retornar erro, o sistema continuará funcionando normalmente fornecendo dicas de fallback geradas localmente.

---

## 3. Estrutura do Projeto

```text
Trabalho/
├── docker-compose.yml          # Container do PostgreSQL
├── README.md                   # Esta documentação
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Definição do banco e relacionamentos (Model)
│   ├── src/
│   │   ├── config/             # Conexão com o Banco de Dados (Prisma instance)
│   │   ├── controllers/        # Controladores (Tratam req/res) e o Mock de Serviço Externo
│   │   ├── services/           # Lógica de Negócios e integração Web Service
│   │   ├── repositories/       # Camada de Acesso a Dados
│   │   ├── routes/             # Roteamento HTTP
│   │   └── server.js           # Ponto de entrada do servidor principal
│   ├── .env                    # Variáveis do Backend (DATABASE_URL e portas)
│   └── package.json
└── frontend/                   # Interface React (View)
    ├── src/
    │   ├── App.jsx             # Fluxo lógico e UI do Dashboard
    │   ├── App.css             # Estilização com Vanilla CSS (Dark Mode & Glassmorphism)
    │   ├── index.css           # Estilos globais e variáveis de design
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

# 4. Docker – Subindo a Aplicação em Produção

A aplicação pode ser executada totalmente dentro de containers Docker. Essa abordagem elimina a necessidade de manter três terminais abertos e garante que as URLs corretas sejam usadas.

### 📋 Pré‑requisitos
- **Docker** e **Docker Compose** instalados e em execução.
- Nenhuma dependência do Node.js precisa ser instalada localmente (as imagens já contêm tudo).

### 🚀 Como iniciar tudo com Docker
1. **Na raiz do projeto** (`Trabalho/`) execute:
   ```bash
   docker compose up -d
   ```
   - O **PostgreSQL** será iniciado na porta **5432**.
   - O **backend** será exposto em **http://localhost:5000**.
   - O **frontend** será servido por Nginx na porta **80** (ou 8080 se preferir mudar o `docker-compose.yml`).

2. **Verificar os containers**:
   ```bash
   docker ps -a
   ```
   Você deverá ver três containers em estado **Up**.

3. **Acessar a aplicação**:
   - **Frontend**: abra o navegador em **http://localhost** (ou **http://localhost:80**) – este é o SPA React servindo os arquivos estáticos.
   - **Backend**: a API está disponível em **http://localhost:5000/api**.
   - **Web Service integrado**: ainda acessível via **/api/external-service**.

### 🛠️ Desenvolvimento local (opcional)
Se preferir trabalhar com os servidores de desenvolvimento (`npm run dev`), mantenha as instruções originais, mas lembre‑se de:
- Atualizar `frontend/src/App.jsx` para usar `const API_BASE = '/api';` (já feito).
- Configurar o proxy em `vite.config.js` para redirecionar `/api` ao backend.

### 📦 Limpar o ambiente Docker
Para parar e remover os containers, rede e volumes criados:
```bash
docker compose down -v
```
Isso deixa o banco de dados limpo para uma nova inicialização.

---

## 5. Testando as Camadas e o Serviço Web
1. Abra o navegador em **http://localhost** (ou **http://localhost:80**).
2. Crie um novo projeto clicando no ícone de mais (`+`) ao lado de "Projetos" na barra lateral esquerda (ex: "Faculdade").
3. Clique em **"Nova Tarefa"** no topo superior direito.
4. Preencha os campos (Título, Categoria, Prioridade, Projeto) e clique em **"Criar Tarefa"**.
5. No card da tarefa recém‑criada, clique no botão **"Dica Web Service"**.
6. Um modal será renderizado carregando dinamicamente as informações do clima simulado e dicas de produtividade do **Serviço Web Integrado** rodando sob `/api/external-service`.


Siga as instruções abaixo abrindo três terminais separados para rodar os diferentes componentes do ecossistema.

### 📋 Pré-requisitos
- **Node.js** instalado (versão 18 ou superior recomendada)
- **Docker** e **Docker Compose** instalados e em execução

---

### 💻 Passo 1: Subir o Banco de Dados (Terminal 1)
Navegue até a pasta raiz do projeto (`Trabalho/`) e execute o container do PostgreSQL:
```bash
# Se o seu usuário precisar de permissões especiais de administrador:
sudo docker-compose up -d

# Caso contrário:
docker compose up -d
```
> [!NOTE]
> O banco de dados estará disponível na porta `5432` com as credenciais pré-definidas no `.env` do backend.

---

### 💻 Passo 2: Configurar e Rodar o Backend (Terminal 2)
Abra um **novo terminal** na pasta `backend/` e execute a instalação, as migrações e o servidor de desenvolvimento:
```bash
# 1. Instalar as dependências do Node.js
npm install

# 2. Executar as migrações do Prisma para criar as tabelas no PostgreSQL
npx prisma migrate dev --name init

# 3. Iniciar o servidor backend em modo de desenvolvimento
npm run dev
```
> [!NOTE]
> O servidor Express principal estará rodando em [http://localhost:5000](http://localhost:5000).

---

### 💻 Passo 3: Rodar o Frontend React (Terminal 3)
Abra um **novo terminal** na pasta `frontend/` e execute o servidor do Vite:
```bash
# 1. Instalar as dependências do React
npm install

# 2. Iniciar o servidor de desenvolvimento Vite
npm run dev
```
> [!NOTE]
> O painel web estará rodando e disponível no endereço [http://localhost:5173](http://localhost:5173).

---

## 5. Testando as Camadas e o Serviço Web
1. Abra o navegador em [http://localhost:5173](http://localhost:5173).
2. Crie um novo projeto clicando no ícone de mais (`+`) ao lado de "Projetos" na barra lateral esquerda (ex: "Faculdade").
3. Clique em **"Nova Tarefa"** no topo superior direito.
4. Preencha os campos (Título, Categoria, Prioridade, Projeto) e clique em **"Criar Tarefa"**.
5. No card da tarefa recém-criada, clique no botão **"Dica Web Service"**.
6. Um modal será renderizado carregando dinamicamente as informações do clima simulado e dicas de produtividade do **Serviço Web Integrado** rodando sob `/api/external-service`.

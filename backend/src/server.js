require('dotenv').config();
const express = require('express');
const cors = require('cors');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const externalServiceRoutes = require('./routes/externalServiceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Rotas da API
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/external-service', externalServiceRoutes);

// Rota raiz para verificação
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Backend do Gerenciador de Tarefas rodando com sucesso.',
    architecture: 'Layers + MVC',
    version: '1.0.0'
  });
});

// Rota de erro para 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado.' });
});

// Inicialização
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Servidor Principal iniciado na porta ${PORT}`);
  console.log(`  Arquitetura: Camadas & MVC`);
  console.log(`  Integrado ao Prisma ORM`);
  console.log(`  Aguardando conexões...`);
  console.log(`==================================================`);
});

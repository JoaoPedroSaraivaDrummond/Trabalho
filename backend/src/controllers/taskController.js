const taskService = require('../services/taskService');

class TaskController {
  async getAll(req, res) {
    try {
      const filters = {
        projectId: req.query.projectId,
        status: req.query.status,
        priority: req.query.priority,
        category: req.query.category
      };
      console.log('[Controller] Obtendo todas as tarefas com filtros:', filters);
      const tasks = await taskService.getAllTasks(filters);
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('[Controller Error]', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      console.log(`[Controller] Obtendo tarefa por ID: ${id}`);
      const task = await taskService.getTaskById(id);
      return res.status(200).json(task);
    } catch (error) {
      console.error('[Controller Error]', error.message);
      const status = error.message.includes('não encontrada') ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      console.log('[Controller] Criando tarefa:', req.body);
      const newTask = await taskService.createTask(req.body);
      return res.status(201).json(newTask);
    } catch (error) {
      console.error('[Controller Error]', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      console.log(`[Controller] Atualizando tarefa ID: ${id}`, req.body);
      const updatedTask = await taskService.updateTask(id, req.body);
      return res.status(200).json(updatedTask);
    } catch (error) {
      console.error('[Controller Error]', error.message);
      const status = error.message.includes('não encontrada') ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      console.log(`[Controller] Deletando tarefa ID: ${id}`);
      await taskService.deleteTask(id);
      return res.status(200).json({ message: 'Tarefa deletada com sucesso.' });
    } catch (error) {
      console.error('[Controller Error]', error.message);
      const status = error.message.includes('não encontrada') ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async getDashboardStats(req, res) {
    try {
      console.log('[Controller] Obtendo estatísticas do painel');
      const stats = await taskService.getDashboardStats();
      return res.status(200).json(stats);
    } catch (error) {
      console.error('[Controller Error]', error.message);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TaskController();

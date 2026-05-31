const taskRepository = require('../repositories/taskRepository');
const projectRepository = require('../repositories/projectRepository');
const externalProductivityService = require('./externalProductivityService');

class TaskService {
  async getAllTasks(filters = {}) {
    return await taskRepository.findAll(filters);
  }

  async getTaskById(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID da tarefa inválido.');
    }
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new Error('Tarefa não encontrada.');
    }

    // Chamamos o serviço web externo para buscar recomendações dinâmicas
    const recommendation = await externalProductivityService.getTaskRecommendation(
      task.category,
      task.title
    );

    return {
      ...task,
      intelligence: recommendation
    };
  }

  async createTask(data) {
    if (!data.title || data.title.trim() === '') {
      throw new Error('O título da tarefa é obrigatório.');
    }
    if (!data.projectId || isNaN(data.projectId)) {
      throw new Error('Um projeto válido deve ser associado à tarefa.');
    }

    // Verificar se o projeto realmente existe
    const project = await projectRepository.findById(data.projectId);
    if (!project) {
      throw new Error('O projeto associado não existe.');
    }

    // Validar status e prioridade
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error('Status inválido.');
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      throw new Error('Prioridade inválida.');
    }

    return await taskRepository.create(data);
  }

  async updateTask(id, data) {
    if (!id || isNaN(id)) {
      throw new Error('ID da tarefa inválido.');
    }
    if (data.title !== undefined && data.title.trim() === '') {
      throw new Error('O título da tarefa não pode ser vazio.');
    }
    if (data.projectId !== undefined) {
      const project = await projectRepository.findById(data.projectId);
      if (!project) {
        throw new Error('O projeto associado não existe.');
      }
    }

    // Verificar se a tarefa existe
    await this.getTaskById(id);
    return await taskRepository.update(id, data);
  }

  async deleteTask(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID da tarefa inválido.');
    }
    await this.getTaskById(id);
    return await taskRepository.delete(id);
  }

  async getDashboardStats() {
    return await taskRepository.getDashboardStats();
  }
}

module.exports = new TaskService();

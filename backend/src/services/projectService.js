const projectRepository = require('../repositories/projectRepository');

class ProjectService {
  async getAllProjects() {
    return await projectRepository.findAll();
  }

  async getProjectById(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID do projeto inválido.');
    }
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new Error('Projeto não encontrado.');
    }
    return project;
  }

  async createProject(data) {
    if (!data.name || data.name.trim() === '') {
      throw new Error('O nome do projeto é obrigatório e não pode ser vazio.');
    }
    return await projectRepository.create(data);
  }

  async updateProject(id, data) {
    if (!id || isNaN(id)) {
      throw new Error('ID do projeto inválido.');
    }
    if (data.name !== undefined && data.name.trim() === '') {
      throw new Error('O nome do projeto não pode ser vazio.');
    }
    // Verificar se o projeto existe
    await this.getProjectById(id);
    return await projectRepository.update(id, data);
  }

  async deleteProject(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID do projeto inválido.');
    }
    // Verificar se existe
    await this.getProjectById(id);
    return await projectRepository.delete(id);
  }
}

module.exports = new ProjectService();

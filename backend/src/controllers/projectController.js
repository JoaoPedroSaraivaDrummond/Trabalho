const projectService = require('../services/projectService');

class ProjectController {
  async getAll(req, res) {
    try {
      console.log('[Controller] Obtendo todos os projetos');
      const projects = await projectService.getAllProjects();
      return res.status(200).json(projects);
    } catch (error) {
      console.error('[Controller Error]', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      console.log(`[Controller] Obtendo projeto por ID: ${id}`);
      const project = await projectService.getProjectById(id);
      return res.status(200).json(project);
    } catch (error) {
      console.error('[Controller Error]', error.message);
      const status = error.message.includes('não encontrado') ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      console.log('[Controller] Criando projeto:', req.body);
      const newProject = await projectService.createProject(req.body);
      return res.status(201).json(newProject);
    } catch (error) {
      console.error('[Controller Error]', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      console.log(`[Controller] Atualizando projeto ID: ${id}`, req.body);
      const updatedProject = await projectService.updateProject(id, req.body);
      return res.status(200).json(updatedProject);
    } catch (error) {
      console.error('[Controller Error]', error.message);
      const status = error.message.includes('não encontrado') ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      console.log(`[Controller] Deletando projeto ID: ${id}`);
      await projectService.deleteProject(id);
      return res.status(200).json({ message: 'Projeto deletado com sucesso.' });
    } catch (error) {
      console.error('[Controller Error]', error.message);
      const status = error.message.includes('não encontrado') ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = new ProjectController();

const prisma = require('../config/db');

class ProjectRepository {
  async findAll() {
    return await prisma.project.findMany({
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findById(id) {
    return await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: { tasks: true }
    });
  }

  async create(data) {
    return await prisma.project.create({
      data: {
        name: data.name,
        description: data.description
      }
    });
  }

  async update(id, data) {
    return await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        description: data.description
      }
    });
  }

  async delete(id) {
    return await prisma.project.delete({
      where: { id: parseInt(id) }
    });
  }
}

module.exports = new ProjectRepository();

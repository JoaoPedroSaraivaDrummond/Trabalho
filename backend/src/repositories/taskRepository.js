const prisma = require('../config/db');

class TaskRepository {
  async findAll(filters = {}) {
    const where = {};
    
    if (filters.projectId) {
      where.projectId = parseInt(filters.projectId);
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.category) {
      where.category = filters.category;
    }

    return await prisma.task.findMany({
      where,
      include: {
        project: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findById(id) {
    return await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: { project: true }
    });
  }

  async create(data) {
    return await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || 'PENDING',
        priority: data.priority || 'MEDIUM',
        category: data.category || 'Geral',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: parseInt(data.projectId)
      }
    });
  }

  async update(id, data) {
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.projectId !== undefined) updateData.projectId = parseInt(data.projectId);

    return await prisma.task.update({
      where: { id: parseInt(id) },
      data: updateData
    });
  }

  async delete(id) {
    return await prisma.task.delete({
      where: { id: parseInt(id) }
    });
  }

  async getDashboardStats() {
    const totalTasks = await prisma.task.count();
    const completedTasks = await prisma.task.count({ where: { status: 'COMPLETED' } });
    const pendingTasks = await prisma.task.count({ where: { status: 'PENDING' } });
    const inProgressTasks = await prisma.task.count({ where: { status: 'IN_PROGRESS' } });

    const tasksByCategory = await prisma.task.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    });

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      tasksByCategory: tasksByCategory.map(item => ({
        category: item.category,
        count: item._count.id
      }))
    };
  }
}

module.exports = new TaskRepository();

import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  Play, 
  Sparkles, 
  CloudSun,
  Layers,
  Filter,
  RefreshCw,
  Folder,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import './App.css';

const API_BASE = '/api';

function App() {
  // Dados principais
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    tasksByCategory: []
  });

  // Estados de carregamento e erro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros ativos
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Estados dos Modais
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isIntelModalOpen, setIsIntelModalOpen] = useState(false);

  // Tarefa atualmente selecionada para visualização de Dicas do Serviço Externo
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  // Formulários
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [taskForm, setTaskForm] = useState({
    id: null, // se preenchido, modo edição
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    category: 'Geral',
    projectId: '',
    dueDate: ''
  });

  // Efeitos de Inicialização
  useEffect(() => {
    loadAllData();
  }, []);

  // Recarregar tarefas toda vez que os filtros mudam
  useEffect(() => {
    fetchTasks();
  }, [selectedProjectId, filterStatus, filterPriority, filterCategory]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchStats()
      ]);
    } catch (err) {
      console.error('Erro de conexão com a API:', err);
      setError('Não foi possível conectar ao servidor backend. Verifique se o Docker/Banco e o Backend estão rodando na porta 5000.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Erro ao buscar projetos');
    const data = await res.json();
    setProjects(data);
    
    // Se houver projetos e a taskForm estiver sem projectId, seleciona o primeiro por padrão
    if (data.length > 0 && !taskForm.projectId) {
      setTaskForm(prev => ({ ...prev, projectId: data[0].id.toString() }));
    }
  };

  const fetchTasks = async () => {
    let url = `${API_BASE}/tasks?`;
    if (selectedProjectId) url += `projectId=${selectedProjectId}&`;
    if (filterStatus) url += `status=${filterStatus}&`;
    if (filterPriority) url += `priority=${filterPriority}&`;
    if (filterCategory) url += `category=${filterCategory}&`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar tarefas');
    const data = await res.json();
    setTasks(data);
  };

  const fetchStats = async () => {
    const res = await fetch(`${API_BASE}/tasks/stats`);
    if (!res.ok) throw new Error('Erro ao buscar estatísticas');
    const data = await res.json();
    setStats(data);
  };

  // CRUD de Projetos
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao criar projeto');
      }

      setProjectForm({ name: '', description: '' });
      setIsProjectModalOpen(false);
      await fetchProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  // CRUD de Tarefas
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.projectId) {
      alert('Preencha o título e selecione um projeto.');
      return;
    }

    const isEdit = !!taskForm.id;
    const url = isEdit ? `${API_BASE}/tasks/${taskForm.id}` : `${API_BASE}/tasks`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar tarefa');
      }

      resetTaskForm();
      setIsTaskModalOpen(false);
      await Promise.all([fetchTasks(), fetchStats(), fetchProjects()]);
    } catch (err) {
      alert(err.message);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      id: null,
      title: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      category: 'Geral',
      projectId: projects[0]?.id.toString() || '',
      dueDate: ''
    });
  };

  const handleEditTask = (task) => {
    setTaskForm({
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      category: task.category,
      projectId: task.projectId.toString(),
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : ''
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return;
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir tarefa');
      await Promise.all([fetchTasks(), fetchStats(), fetchProjects()]);
    } catch (err) {
      alert(err.message);
    }
  };

  // Alterna o status da tarefa diretamente pelo painel
  const toggleTaskStatus = async (task) => {
    const statusFlow = {
      'PENDING': 'IN_PROGRESS',
      'IN_PROGRESS': 'COMPLETED',
      'COMPLETED': 'PENDING'
    };
    const nextStatus = statusFlow[task.status] || 'PENDING';

    try {
      const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
      await Promise.all([fetchTasks(), fetchStats()]);
    } catch (err) {
      alert(err.message);
    }
  };

  // CONSULTAR O SERVIÇO WEB EXTERNO PARA OBTER DICAS CLIMÁTICAS E DE PRODUTIVIDADE
  const handleViewIntelligence = async (taskId) => {
    setLoadingIntel(true);
    setIsIntelModalOpen(true);
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`);
      if (!res.ok) throw new Error('Erro ao consultar detalhes da inteligência');
      const data = await res.json();
      setSelectedTask(data);
    } catch (err) {
      console.error(err);
      alert('Não foi possível obter dados do serviço web externo.');
      setIsIntelModalOpen(false);
    } finally {
      setLoadingIntel(false);
    }
  };

  const clearFilters = () => {
    setFilterStatus('');
    setFilterPriority('');
    setFilterCategory('');
    setSelectedProjectId(null);
  };

  const getPriorityColorClass = (priority) => {
    switch (priority) {
      case 'LOW': return 'badge-priority-low';
      case 'HIGH': return 'badge-priority-high';
      default: return 'badge-priority-medium';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Concluída';
      case 'IN_PROGRESS': return 'Em Progresso';
      default: return 'Pendente';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'completed';
      case 'IN_PROGRESS': return 'progress';
      default: return 'pending';
    }
  };

  return (
    <div className="app-container">
      {/* 1. SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <FolderKanban className="brand-icon" size={28} />
          <span className="text-gradient">TaskFlow Arc</span>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title-row">
            <h3>Projetos</h3>
            <button className="add-project-btn" onClick={() => setIsProjectModalOpen(true)} title="Criar Novo Projeto">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="project-list">
            <div 
              className={`project-item ${selectedProjectId === null ? 'active' : ''}`}
              onClick={() => setSelectedProjectId(null)}
            >
              <span>Todos os Projetos</span>
              <span className="project-count">{projects.reduce((acc, curr) => acc + curr._count.tasks, 0)}</span>
            </div>
            
            {projects.map(project => (
              <div 
                key={project.id} 
                className={`project-item ${selectedProjectId === project.id ? 'active' : ''}`}
                onClick={() => setSelectedProjectId(project.id)}
              >
                <span>{project.name}</span>
                <span className="project-count">{project._count?.tasks || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Informações sobre a Arquitetura */}
        <div className="arch-indicator">
          <div className="arch-dot"></div>
          <span>Padrão MVC + Camadas</span>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="main-content">
        
        {/* Header da Página */}
        <header className="header-row">
          <div className="welcome-section">
            <h1 className="text-gradient">Painel de Tarefas</h1>
            <p>Gerencie seus projetos com inteligência e produtividade climatizada.</p>
          </div>
          
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={loadAllData} title="Sincronizar dados">
              <RefreshCw size={16} /> Recarregar
            </button>
            <button className="btn btn-primary" onClick={() => { resetTaskForm(); setIsTaskModalOpen(true); }}>
              <Plus size={16} /> Nova Tarefa
            </button>
          </div>
        </header>

        {/* Mensagem de Erro de Conexão */}
        {error && (
          <div className="glass animate-fade-in" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', borderColor: 'var(--priority-high)', display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <AlertCircle color="var(--priority-high)" size={24} style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ color: 'var(--priority-high)', fontWeight: 700, fontSize: '0.95rem' }}>Erro de Comunicação</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>{error}</p>
            </div>
          </div>
        )}

        {/* 3. DASHBOARD STATS */}
        <section className="stats-grid">
          <div className="glass stat-card total">
            <div className="stat-info">
              <span className="stat-label">Total de Tarefas</span>
              <span className="stat-value">{stats.totalTasks}</span>
            </div>
            <div className="stat-icon-wrapper">
              <Folder size={20} />
            </div>
          </div>

          <div className="glass stat-card pending">
            <div className="stat-info">
              <span className="stat-label">Pendentes</span>
              <span className="stat-value">{stats.pendingTasks}</span>
            </div>
            <div className="stat-icon-wrapper">
              <Clock size={20} />
            </div>
          </div>

          <div className="glass stat-card progress">
            <div className="stat-info">
              <span className="stat-label">Em Execução</span>
              <span className="stat-value">{stats.inProgressTasks}</span>
            </div>
            <div className="stat-icon-wrapper">
              <Play size={20} />
            </div>
          </div>

          <div className="glass stat-card completed">
            <div className="stat-info">
              <span className="stat-label">Concluídas</span>
              <span className="stat-value">{stats.completedTasks}</span>
            </div>
            <div className="stat-icon-wrapper">
              <CheckCircle size={20} />
            </div>
          </div>
        </section>

        {/* 4. BARRA DE FILTROS */}
        <section className="glass filters-bar">
          <div className="filters-group">
            <Filter size={16} color="var(--text-muted)" />
            
            <select 
              className="filter-select" 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">Status: Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em Progresso</option>
              <option value="COMPLETED">Concluído</option>
            </select>

            <select 
              className="filter-select" 
              value={filterPriority} 
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="">Prioridade: Todas</option>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
            </select>

            <select 
              className="filter-select" 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">Categoria: Todas</option>
              <option value="Trabalho">Trabalho</option>
              <option value="Estudos">Estudos</option>
              <option value="Pessoal">Pessoal</option>
              <option value="Geral">Geral</option>
            </select>

            {(filterStatus || filterPriority || filterCategory || selectedProjectId) && (
              <button className="filter-reset" onClick={clearFilters}>Limpar Filtros</button>
            )}
          </div>

          <div className="arch-indicator">
            <Layers size={14} />
            <span>Exibindo {tasks.length} tarefa(s)</span>
          </div>
        </section>

        {/* 5. GRID DE TAREFAS */}
        <section className="tasks-section">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem auto', animation: 'spin 1.5s linear infinite' }} />
              <p>Carregando banco de dados...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <FolderKanban className="empty-state-icon" size={48} />
              <h3>Nenhuma tarefa encontrada</h3>
              <p>Comece adicionando uma nova tarefa ao projeto ativo ou limpe os filtros para ver tudo.</p>
              <button className="btn btn-primary" onClick={() => setIsTaskModalOpen(true)}>
                <Plus size={16} /> Nova Tarefa
              </button>
            </div>
          ) : (
            <div className="tasks-grid">
              {tasks.map(task => (
                <div key={task.id} className="glass task-card animate-fade-in">
                  <div className="task-header">
                    <span className="task-project-name">{task.project?.name}</span>
                    <div className="task-badges">
                      <span className={`badge ${getPriorityColorClass(task.priority)}`}>
                        {task.priority === 'LOW' ? 'Baixa' : task.priority === 'HIGH' ? 'Alta' : 'Média'}
                      </span>
                      <span className="badge badge-category">{task.category}</span>
                    </div>
                  </div>

                  <h3 
                    className={`task-title ${task.status === 'COMPLETED' ? 'completed' : ''}`}
                    onClick={() => toggleTaskStatus(task)}
                    title="Clique para alternar o status"
                  >
                    {task.title}
                  </h3>

                  <p className="task-desc">{task.description || 'Sem descrição cadastrada.'}</p>

                  {task.dueDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      <span>Até {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}

                  <div className="task-footer">
                    <button 
                      className={`status-pill ${getStatusClass(task.status)}`}
                      onClick={() => toggleTaskStatus(task)}
                    >
                      {getStatusLabel(task.status)}
                    </button>

                    <div className="task-actions">
                      <button 
                        className="action-btn intelligence" 
                        onClick={() => handleViewIntelligence(task.id)}
                        title="Ver dicas inteligentes do serviço externo"
                      >
                        <Sparkles size={13} /> Dica Web Service
                      </button>
                      <button className="action-btn edit" onClick={() => handleEditTask(task)} title="Editar">
                        <Edit3 size={15} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeleteTask(task.id)} title="Excluir">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ================= MODAIS ================= */}

      {/* A. MODAL DO WEB SERVICE EXTERNO (DICA INTELIGENTE + CLIMA) */}
      {isIntelModalOpen && (
        <div className="modal-overlay" onClick={() => setIsIntelModalOpen(false)}>
          <div className="glass modal-content intel-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles color="var(--primary)" size={22} />
                <span>Integração Web Service REST</span>
              </h2>
              <button className="close-modal-btn" onClick={() => setIsIntelModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {loadingIntel ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 1rem auto', animation: 'spin 1.5s linear infinite' }} />
                <p>Consultando serviço externo de inteligência...</p>
              </div>
            ) : selectedTask && (
              <div className="intel-panel">
                <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedTask.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Categoria: {selectedTask.category} | Projeto: {selectedTask.project?.name}
                  </p>
                </div>

                <div>
                  <div className="intel-section-title">Recomendação de Foco</div>
                  <div className="intel-tip-card">
                    <Sparkles className="intel-tip-icon" size={18} />
                    <p className="intel-tip-text">
                      "{selectedTask.intelligence?.tip}"
                    </p>
                  </div>
                </div>

                {selectedTask.intelligence?.weatherContext && (
                  <div>
                    <div className="intel-section-title">Contexto Climático Atual</div>
                    <div className="weather-widget">
                      <div className="weather-header">
                        <span className="weather-city" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CloudSun size={18} color="var(--secondary)" />
                          {selectedTask.intelligence.weatherContext.city} (Simulado)
                        </span>
                        <span className="weather-temp-badge">
                          {selectedTask.intelligence.weatherContext.temp}
                        </span>
                      </div>
                      
                      <div className="weather-details">
                        <span>Condição: <strong>{selectedTask.intelligence.weatherContext.condition}</strong></span>
                      </div>

                      <p className="weather-advice">
                        {selectedTask.intelligence.weatherContext.advice}
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <span>Fonte: REST API ({selectedTask.intelligence?.source})</span>
                  <span>IP/Porta: localhost:5001</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* B. MODAL DE CRIAÇÃO / EDIÇÃO DE TAREFA */}
      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <div className="glass modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{taskForm.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button className="close-modal-btn" onClick={() => setIsTaskModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Título da Tarefa</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Finalizar diagrama de banco de dados" 
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Detalhamento da tarefa..."
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Projeto</label>
                  <select 
                    className="form-select"
                    value={taskForm.projectId}
                    onChange={e => setTaskForm({ ...taskForm, projectId: e.target.value })}
                    required
                  >
                    <option value="" disabled>Selecione um projeto</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Categoria</label>
                  <select 
                    className="form-select"
                    value={taskForm.category}
                    onChange={e => setTaskForm({ ...taskForm, category: e.target.value })}
                  >
                    <option value="Trabalho">Trabalho</option>
                    <option value="Estudos">Estudos</option>
                    <option value="Pessoal">Pessoal</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prioridade</label>
                  <select 
                    className="form-select"
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Data de Vencimento</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select 
                  className="form-select"
                  value={taskForm.status}
                  onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                >
                  <option value="PENDING">Pendente</option>
                  <option value="IN_PROGRESS">Em Execução</option>
                  <option value="COMPLETED">Concluída</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsTaskModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {taskForm.id ? 'Salvar Alterações' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. MODAL DE CRIAR NOVO PROJETO */}
      {isProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProjectModalOpen(false)}>
          <div className="glass modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Projeto</h2>
              <button className="close-modal-btn" onClick={() => setIsProjectModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Nome do Projeto</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Trabalho de Faculdade" 
                  value={projectForm.name}
                  onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição (opcional)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Breve descrição dos objetivos..."
                  value={projectForm.description}
                  onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsProjectModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

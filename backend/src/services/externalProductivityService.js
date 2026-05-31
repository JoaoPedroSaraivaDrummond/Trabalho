const axios = require('axios');

class ExternalProductivityService {
  constructor() {
    this.apiUrl = process.env.EXTERNAL_SERVICE_URL || 'http://localhost:5001';
  }

  async getTaskRecommendation(category, title) {
    try {
      console.log(`[Service] Consultando serviço web externo no endpoint: ${this.apiUrl}/api/productivity-tip`);
      const response = await axios.get(`${this.apiUrl}/api/productivity-tip`, {
        params: { category, title },
        timeout: 2000 // 2 segundos de timeout para resiliência
      });
      return response.data;
    } catch (error) {
      console.error(`[Service] Erro ao consultar o serviço externo: ${error.message}. Utilizando fallback local.`);
      // Lógica de resiliência: Fallback caso o serviço externo esteja indisponível
      return {
        source: 'local-fallback',
        tip: `Organize suas tarefas de ${category} priorizando o que tem maior impacto. Defina períodos de 25 minutos de foco ininterrupto (Pomodoro).`,
        weatherContext: {
          city: 'Indisponível',
          temp: '--',
          condition: 'Desconhecido',
          advice: 'Mantenha um bom ritmo de trabalho independente do clima.'
        }
      };
    }
  }
}

module.exports = new ExternalProductivityService();

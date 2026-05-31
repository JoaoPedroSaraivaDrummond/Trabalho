// Controlador que simula um serviço web externo (REST) de inteligência de produtividade
const weatherConditions = [
  { condition: 'Ensolarado', temp: '26°C', advice: 'Clima ensolarado! Excelente dia para reuniões rápidas de pé ou caminhadas curtas na pausa para recarregar as energias.' },
  { condition: 'Chuvoso', temp: '19°C', advice: 'Tempo chuvoso lá fora. Momento perfeito para focar em tarefas complexas e escrita (deep work) sem distrações.' },
  { condition: 'Frio/Nublado', temp: '15°C', advice: 'Clima ameno e nublado. Luz excelente para telas. Mantenha-se confortável e revise planilhas ou organize e-mails.' },
  { condition: 'Tempestuoso', temp: '21°C', advice: 'Tempestade lá fora. Certifique-se de salvar seus arquivos na nuvem com frequência e evite procrastinar.' }
];

const categoryTips = {
  'trabalho': [
    'Evite a multitarefa: execute uma atividade por vez e desligue notificações de redes sociais.',
    'Separe as tarefas em blocos de 50 minutos seguidos de 10 minutos de descanso para manter a alta performance.',
    'Defina a "Meta Crucial do Dia" (MCD). Conclua-a antes de mexer em tarefas menores.'
  ],
  'estudos': [
    'Use o método Feynman: tente explicar o conteúdo dessa tarefa para si mesmo em voz alta para fixar o aprendizado.',
    'Revise suas anotações ativamente. Fazer perguntas a si mesmo é melhor do que apenas reler.',
    'Estude em sessões Pomodoro de 25 minutos. Isso previne o cansaço mental precoce.'
  ],
  'pessoal': [
    'Defina horários bem delimitados para que as pendências pessoais não sobrecarreguem seu momento de descanso.',
    'Organize o ambiente ao seu redor antes de começar. Um espaço limpo reduz o estresse.',
    'Lembre-se de celebrar pequenas vitórias do dia a dia.'
  ],
  'geral': [
    'Divida essa tarefa em 3 mini-passos. O primeiro passo deve levar menos de 2 minutos para começar.',
    'O ótimo é inimigo do bom. Foque em entregar uma versão funcional antes de buscar o refinamento máximo.',
    'Se essa tarefa demorar menos de 5 minutos, faça-a agora mesmo!'
  ]
};

class ExternalServiceController {
  getTip(req, res) {
    const { category, title } = req.query;
    console.log(`[Mock Web Service] Requisição recebida. Categoria: ${category}, Título: ${title}`);
    
    // 1. Simular seleção de clima dinâmico
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];

    // 2. Determinar dica com base na categoria
    const normalizedCategory = (category || 'geral').toLowerCase();
    const tipsList = categoryTips[normalizedCategory] || categoryTips['geral'];
    const randomTip = tipsList[Math.floor(Math.random() * tipsList.length)];

    // 3. Resposta estruturada
    return res.status(200).json({
      source: 'integrated-mock-web-service-rest',
      tip: randomTip,
      weatherContext: {
        city: randomCity,
        temp: randomWeather.temp,
        condition: randomWeather.condition,
        advice: randomWeather.advice
      },
      requestedAt: new Date().toISOString()
    });
  }
}

module.exports = new ExternalServiceController();

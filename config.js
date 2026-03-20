// Configuração de URLs do sistema
const CONFIG = {
    // URL da API (servidor backend)
    API_URL: 'https://meuoutube.netlify.app', // Altere para o URL do seu servidor em produção (ex: https://sua-api.herokuapp.com)

    // URLs dos sites no Netlify
    AMBIENTE_CRIADOR_URL: 'https://ambientecriador.netlify.app',
    MEU_YOUTUBE_URL: 'https://meuoutube.netlify.app'
};

// Se estiver em desenvolvimento local, usar localhost
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.AMBIENTE_CRIADOR_URL = 'http://localhost:3000/ambienteCriador';
    CONFIG.MEU_YOUTUBE_URL = 'http://localhost:3000/meuYoutube';
}

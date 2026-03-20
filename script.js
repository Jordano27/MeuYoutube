// Configurar links do Ambiente Criador
document.addEventListener('DOMContentLoaded', () => {
    const btnAdd = document.getElementById('btnAdd');
    const btnAddFirst = document.getElementById('btnAddFirst');
    
    if (btnAdd) {
        btnAdd.href = CONFIG.AMBIENTE_CRIADOR_URL;
    }
    if (btnAddFirst) {
        btnAddFirst.href = CONFIG.AMBIENTE_CRIADOR_URL;
    }
});

// Função para gerar thumbnail de um vídeo
function generateThumbnail(videoUrl) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = videoUrl;
        video.muted = true;
        video.preload = 'metadata';

        const timeoutId = setTimeout(() => {
            resolve(null); // Retorna null se demorar muito
        }, 10000);

        video.addEventListener('loadedmetadata', function () {
            // Ir para 2 segundos ou 10% do vídeo
            video.currentTime = Math.min(2, video.duration * 0.1);
        });

        video.addEventListener('seeked', function () {
            clearTimeout(timeoutId);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 225;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                resolve(thumbnail);
            } catch (error) {
                console.error('Erro ao gerar thumbnail:', error);
                resolve(null);
            }
        });

        video.addEventListener('error', function () {
            clearTimeout(timeoutId);
            resolve(null);
        });
    });
}

// Carregar vídeos da API
async function loadVideos() {
    const videoGrid = document.getElementById('videoGrid');
    const emptyState = document.getElementById('emptyState');

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/videos`);

        if (!response.ok) {
            throw new Error('Erro ao carregar vídeos');
        }

        const videos = await response.json();

        if (videos.length === 0) {
            videoGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        videoGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        // Criar cards dos vídeos
        videoGrid.innerHTML = videos.map((video, index) => {
            const date = new Date(video.addedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            const sizeMB = (video.size / 1024 / 1024).toFixed(2);

            // Thumbnail padrão com ícone de carregamento
            const loadingThumbnail = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"%3E%3Crect fill="%23667eea" width="400" height="225"/%3E%3Ctext fill="white" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ECarregando...%3C/text%3E%3C/svg%3E';

            return `
                <div class="video-card" data-index="${index}">
                    <div class="video-thumbnail">
                        <img src="${loadingThumbnail}" alt="Thumbnail" class="thumbnail-img" data-video-url="${CONFIG.API_URL}${video.path}">
                        <div class="play-overlay">
                            <svg viewBox="0 0 24 24">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                        </div>
                        <button class="delete-btn" onclick="deleteVideo('${video.savedFileName}'); event.stopPropagation();">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                    <div class="video-info">
                        <div class="video-title">${video.fileName}</div>
                        <div class="video-date">Adicionado em ${date} • ${sizeMB} MB</div>
                    </div>
                </div>
            `;
        }).join('');

        // Armazenar vídeos globalmente para acesso no modal
        window.currentVideos = videos;

        // Adicionar event listeners nos cards
        document.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', function () {
                const index = this.dataset.index;
                const video = videos[index];
                openModal(video);
            });
        });

        // Gerar thumbnails para cada vídeo
        const thumbnailImages = document.querySelectorAll('.thumbnail-img');
        thumbnailImages.forEach(async (img) => {
            const videoUrl = img.dataset.videoUrl;
            const thumbnail = await generateThumbnail(videoUrl);

            if (thumbnail) {
                img.src = thumbnail;
            } else {
                // Usar thumbnail padrão se falhar
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"%3E%3Crect fill="%23667eea" width="400" height="225"/%3E%3Ctext fill="white" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EVídeo%3C/text%3E%3C/svg%3E';
            }
        });

    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
        videoGrid.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h2>Erro ao Carregar Vídeos</h2>
            <p>Verifique se o servidor está rodando</p>
            <a href="../ambienteCriador/index.html" class="empty-btn">Iniciar Servidor</a>
        `;
    }
}

async function deleteVideo(filename) {
    if (confirm('Deseja realmente remover este vídeo?')) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/videos/${filename}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadVideos();
            } else {
                alert('Erro ao remover vídeo');
            }
        } catch (error) {
            console.error('Erro ao deletar vídeo:', error);
            alert('Erro ao remover vídeo. Verifique se o servidor está rodando.');
        }
    }
}

async function openModal(video) {
    const modal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');

    // Gerar thumbnail para usar como poster
    const videoUrl = `${CONFIG.API_URL}${video.path}`;
    const posterUrl = await generateThumbnail(videoUrl);

    // Criar player com controles personalizados
    const posterAttr = posterUrl ? `poster="${posterUrl}"` : '';

    videoPlayer.innerHTML = `
        <video 
            id="mainVideoPlayer"
            controls 
            controlsList="nodownload"
            ${posterAttr}
            preload="metadata"
        >
            <source src="${videoUrl}" type="video/mp4">
            <source src="${videoUrl}" type="video/webm">
            <source src="${videoUrl}" type="video/ogg">
            Seu navegador não suporta a reprodução de vídeos.
        </video>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Aguardar o vídeo carregar e ajustar o tamanho do modal
    const videoElement = document.getElementById('mainVideoPlayer');

    // Função para ajustar o tamanho do vídeo
    window.adjustVideoSize = () => {
        if (!videoElement.videoWidth || !videoElement.videoHeight) return;

        const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = (window.innerHeight * 0.95) - 76; // 76px para o header

        let videoWidth = videoElement.videoWidth;
        let videoHeight = videoElement.videoHeight;

        // Ajustar se for maior que a tela
        if (videoWidth > maxWidth) {
            videoWidth = maxWidth;
            videoHeight = videoWidth / aspectRatio;
        }

        if (videoHeight > maxHeight) {
            videoHeight = maxHeight;
            videoWidth = videoHeight * aspectRatio;
        }

        videoElement.style.width = videoWidth + 'px';
        videoElement.style.height = videoHeight + 'px';
    };

    videoElement.addEventListener('loadedmetadata', () => {
        window.adjustVideoSize();

        videoElement.play().catch(err => {
            console.log('Autoplay bloqueado:', err);
        });
    });

    // Ajustar tamanho ao redimensionar a janela
    window.addEventListener('resize', window.adjustVideoSize);
}

function closeModal() {
    const modal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    modal.classList.remove('active', 'fullscreen');

    // Remover event listener de resize
    window.removeEventListener('resize', window.adjustVideoSize);

    videoPlayer.innerHTML = '';
    document.body.style.overflow = '';
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

function toggleFullscreen() {
    const modal = document.getElementById('videoModal');
    const modalContent = modal.querySelector('.modal-content');
    if (!document.fullscreenElement) {
        modalContent.requestFullscreen().then(() => {
            modal.classList.add('fullscreen');
        }).catch(err => console.error(err));
    } else {
        document.exitFullscreen().then(() => {
            modal.classList.remove('fullscreen');
        });
    }
}

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
document.getElementById('videoModal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
});
document.addEventListener('fullscreenchange', function () {
    const modal = document.getElementById('videoModal');
    if (!document.fullscreenElement) modal.classList.remove('fullscreen');
});

// Carregar vídeos ao iniciar
loadVideos();

// Recarregar vídeos quando a página ganha foco (caso tenha adicionado em outra aba)
window.addEventListener('focus', loadVideos);
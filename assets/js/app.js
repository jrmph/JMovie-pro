// JMovie Pro
// Made by Jhames Rhonnielle Martin

//Pogi ako

// Global Variables
let currentPage = { movies: 1, tv: 1, episodes: 1, trending: 1, popular: 1 };
let viewAllPage = 1;
let currentViewAllType = '';
let heroSwiper = null;
let searchTimeout = null;
let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
let watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let isLoading = false;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    showLoadingScreen();
    
    try {
        await Promise.all([
            initializeHeroSlider(),
            loadInitialContent(),
            initializeEventListeners(),
            loadUserPreferences(),
            updateNotificationsUI()
        ]);
        
        setTimeout(() => {
            hideLoadingScreen();
            addNotification("Welcome to " + window.APP_CONFIG.APP_NAME + "! Enjoy unlimited streaming.", 'success');
        }, 2500);
        
    } catch (error) {
        console.error('App initialization error:', error);
        hideLoadingScreen();
        addNotification("Something went wrong. Please refresh the page.", 'error');
    }
}

function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
    document.body.classList.add('no-scroll');
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        document.body.classList.remove('no-scroll');
    }, 500);
}

// Hero Slider
async function initializeHeroSlider() {
    const heroMovies = window.APP_CONFIG.heroMovies;
    const heroSlides = document.getElementById('heroSlides');
    
    heroSlides.innerHTML = '';
    
    for (const movie of heroMovies) {
        const slide = createHeroSlide(movie);
        heroSlides.appendChild(slide);
    }
    
    heroSwiper = new Swiper('#heroSwiper', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            renderBullet: function (index, className) {
                return '<span class="' + className + '"></span>';
            },
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        }
    });
}

function createHeroSlide(movie) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide hero-slide';
    
    const backdropUrl = movie.backdrop_path 
        ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
        : `https://image.tmdb.org/t/p/w1280${movie.poster_path || ''}`;
        
    slide.style.backgroundImage = `url('${backdropUrl}')`;
    
    const isInWatchlist = isItemInWatchlist(movie.id, 'movie');
    
    slide.innerHTML = `
        <div class="hero-content animate-fade-in-left">
            <h1 class="hero-title">${movie.title || 'Untitled'}</h1>
            <p class="hero-description">${(movie.overview || 'No description available.').substring(0, 200)}...</p>
            <div class="hero-meta">
                <div class="hero-rating">
                    <i class='bx bx-star'></i>
                    <span>${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
                <div class="hero-year">${(movie.release_date || '').split('-')[0] || 'N/A'}</div>
                <div class="hero-genre">Action</div>
            </div>
            <div class="hero-actions">
                <button class="btn btn-primary ripple" onclick="requireAuth(() => openPlayer('movie', ${movie.id}, '${movie.title}'))">
                    <i class='bx bx-play'></i>
                    Play Now
                </button>
                <button class="btn btn-secondary ripple" onclick="requireAuth(() => openDetails(${movie.id}, 'movie'))">
                    <i class='bx bx-info-circle'></i>
                    More Info
                </button>
                <button class="btn-icon ${isInWatchlist ? 'active' : ''}" onclick="requireAuth(() => toggleWatchlist(${movie.id}, 'movie', '${movie.title}', '${backdropUrl}'))" title="${isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">
                    <i class='bx ${isInWatchlist ? 'bx-check' : 'bx-plus'}'></i>
                </button>
                <button class="btn-icon" onclick="requireAuth(() => openDownloadModal('movie', ${movie.id}, '${movie.title}'))" title="Download">
                    <i class='bx bx-download'></i>
                </button>
            </div>
        </div>
    `;
    
    return slide;
}

// Content Loading
async function loadInitialContent() {
    const moviesData = window.APP_CONFIG.moviesData;
    const tvData = window.APP_CONFIG.tvData;
    const episodesData = window.APP_CONFIG.episodesData;
    
    await Promise.all([
        renderMovieContent(moviesData, 'moviesGrid'),
        renderTVContent(tvData, 'tvGrid'),
        renderEpisodeContent(episodesData, 'episodesGrid'),
        loadTrendingContent(),
        loadPopularContent(),
        renderWatchlist()
    ]);
}

async function renderMovieContent(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    for (const movie of movies) {
        if (!movie.tmdb_id && !movie.imdb_id) continue;
        
        try {
            const movieData = await fetchTMDBData('movie', movie.tmdb_id || movie.imdb_id);
            if (movieData && !movieData.adult) {
                const card = createContentCard(movieData, 'movie');
                container.appendChild(card);
            }
        } catch (error) {
            console.error('Error loading movie:', error);
        }
    }
}

async function renderTVContent(shows, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    for (const show of shows) {
        if (!show.tmdb_id && !show.imdb_id) continue;
        
        try {
            const showData = await fetchTMDBData('tv', show.tmdb_id || show.imdb_id);
            if (showData) {
                const card = createContentCard(showData, 'tv');
                container.appendChild(card);
            }
        } catch (error) {
            console.error('Error loading TV show:', error);
        }
    }
}

async function renderEpisodeContent(episodes, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    for (const episode of episodes) {
        if (!episode.tmdb_id && !episode.imdb_id) continue;
        
        try {
            const showData = await fetchTMDBData('tv', episode.tmdb_id || episode.imdb_id);
            if (showData) {
                const card = createContentCard(showData, 'tv', episode.season, episode.episode);
                container.appendChild(card);
            }
        } catch (error) {
            console.error('Error loading episode:', error);
        }
    }
}

async function loadTrendingContent() {
    try {
        const trendingData = await fetchTMDBData('trending/all/week', null, 1);
        const container = document.getElementById('trendingGrid');
        
        if (trendingData && trendingData.results) {
            trendingData.results.slice(0, 12).forEach(item => {
                const type = item.media_type === 'movie' ? 'movie' : 'tv';
                if (!item.adult) {
                    const card = createContentCard(item, type);
                    container.appendChild(card);
                }
            });
        }
    } catch (error) {
        console.error('Error loading trending content:', error);
    }
}

async function loadPopularContent() {
    try {
        const popularData = await fetchTMDBData('movie/popular', null, 1);
        const container = document.getElementById('popularGrid');
        
        if (popularData && popularData.results) {
            popularData.results.slice(0, 12).forEach(item => {
                if (!item.adult) {
                    const card = createContentCard(item, 'movie');
                    container.appendChild(card);
                }
            });
        }
    } catch (error) {
        console.error('Error loading popular content:', error);
    }
}

// API Functions
async function fetchTMDBData(endpoint, id = null, page = 1) {
    try {
        let url;
        if (id) {
            url = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${window.APP_CONFIG.TMDB_API_KEY}&language=en-US`;
        } else {
            url = `https://api.themoviedb.org/3/${endpoint}?api_key=${window.APP_CONFIG.TMDB_API_KEY}&language=en-US&page=${page}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('TMDB API error:', error);
        return null;
    }
}

async function searchTMDB(query, page = 1) {
    if (!query.trim()) return null;
    
    try {
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${window.APP_CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Search error:', error);
        return null;
    }
}

// Content Card Creation
function createContentCard(data, type, season = null, episode = null) {
    const card = document.createElement('div');
    card.className = 'content-card animate-fade-in-up';
    
    const posterUrl = data.poster_path 
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image';
        
    const title = data.title || data.name || 'Untitled';
    const year = (data.release_date || data.first_air_date || '').split('-')[0] || '';
    const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
    const isInWatchlist = isItemInWatchlist(data.id, type);
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${posterUrl}" alt="${title}" class="card-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image'">
            <div class="card-overlay">
                <button class="card-btn" onclick="requireAuth(() => openPlayer('${type}', ${data.id}, '${title}'${season ? `, ${season}, ${episode}` : ''}))">
                    <i class='bx bx-play'></i>
                </button>
                <button class="card-btn secondary" onclick="requireAuth(() => openDetails(${data.id}, '${type}'))">
                    <i class='bx bx-info-circle'></i>
                </button>
                <button class="card-btn ${isInWatchlist ? 'active' : ''}" onclick="requireAuth(() => toggleWatchlist(${data.id}, '${type}', '${title}', '${posterUrl}'))" title="${isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">
                    <i class='bx ${isInWatchlist ? 'bx-check' : 'bx-plus'}'></i>
                </button>
                <button class="card-btn" onclick="requireAuth(() => openDownloadModal('${type}', ${data.id}, '${title}'${season ? `, ${season}, ${episode}` : ''}))" title="Download">
                    <i class='bx bx-download'></i>
                </button>
            </div>
            <div class="card-rating">
                <i class='bx bx-star star'></i>
                <span>${rating}</span>
            </div>
        </div>
        <div class="card-info">
            <h3 class="card-title">${title}</h3>
            <div class="card-meta">
                <span class="card-year">${year}</span>
                ${season && episode ? `<span class="card-genre">S${season}E${episode}</span>` : ''}
            </div>
        </div>
    `;
    
    return card;
}

// Authentication
function requireAuth(callback) {
    if (window.isUserSignedIn) {
        callback();
    } else {
        openAuthModal();
    }
}

function openAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('visible');
    document.body.classList.add('no-scroll');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('visible');
    document.body.classList.remove('no-scroll');
}

// Player Functions
function openPlayer(type, id, title, season = null, episode = null) {
    // Create player modal dynamically
    const modal = document.createElement('div');
    modal.id = 'playerModal';
    modal.className = 'modal player-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closePlayer()">
                <i class='bx bx-x'></i>
            </button>
            <div class="player-container">
                <iframe id="playerFrame" class="player-frame" src="" allowfullscreen></iframe>
            </div>
            <div class="player-info">
                <h2 class="player-title" id="playerTitle">${title || 'Loading...'}</h2>
                <p class="player-description" id="playerDescription">Loading information...</p>
                <div class="player-meta">
                    <div class="meta-item meta-rating">
                        <i class='bx bx-star star'></i>
                        <span id="playerRating">Loading...</span>
                    </div>
                    <div class="meta-item meta-year">
                        <i class='bx bx-calendar'></i>
                        <span id="playerYear">Loading...</span>
                    </div>
                    <div class="meta-item meta-duration">
                        <i class='bx bx-time'></i>
                        <span id="playerDuration">Loading...</span>
                    </div>
                </div>
                <div class="player-controls">
                    <button class="btn btn-secondary" onclick="openSubtitleSelector(${id}, '${type}')">
                        <i class='bx bx-closed-captioning'></i>
                        Subtitles
                    </button>
                    <button class="btn btn-secondary" onclick="openDownloadModal('${type}', ${id}, '${title}'${season ? `, ${season}, ${episode}` : ''})">
                        <i class='bx bx-download'></i>
                        Download
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const frame = document.getElementById('playerFrame');
    
    let playerUrl = '';
    if (type === 'movie') {
        playerUrl = `https://vidsrc.xyz/embed/movie/${id}`;
    } else if (type === 'tv') {
        if (season && episode) {
            playerUrl = `https://vidsrc.xyz/embed/tv/${id}/${season}-${episode}`;
        } else {
            playerUrl = `https://vidsrc.xyz/embed/tv/${id}`;
        }
    }
    
    frame.src = playerUrl;
    
    modal.classList.add('visible');
    document.body.classList.add('no-scroll');
    
    addToWatchHistory(id, type, title);
    loadPlayerInfo(id, type);
    addNotification(`Now playing: ${title}`, 'success');
}

function closePlayer() {
    const modal = document.getElementById('playerModal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

async function loadPlayerInfo(id, type) {
    try {
        const data = await fetchTMDBData(type, id);
        if (data) {
            const titleEl = document.getElementById('playerTitle');
            const descriptionEl = document.getElementById('playerDescription');
            const ratingEl = document.getElementById('playerRating');
            const yearEl = document.getElementById('playerYear');
            const durationEl = document.getElementById('playerDuration');
            
            if (titleEl) titleEl.textContent = data.title || data.name || 'Untitled';
            if (descriptionEl) descriptionEl.textContent = data.overview || 'No description available.';
            if (ratingEl) ratingEl.textContent = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
            if (yearEl) yearEl.textContent = (data.release_date || data.first_air_date || '').split('-')[0] || 'N/A';
            
            if (durationEl) {
                if (type === 'movie') {
                    durationEl.textContent = data.runtime ? `${data.runtime} min` : 'N/A';
                } else {
                    durationEl.textContent = data.number_of_seasons ? `${data.number_of_seasons} seasons` : 'N/A';
                }
            }
        }
    } catch (error) {
        console.error('Error loading player info:', error);
    }
}

// Download Functions
async function openDownloadModal(type, id, title, season = null, episode = null) {
    try {
        const response = await fetch('download.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'get_download_info',
                type: type,
                id: id,
                season: season,
                episode: episode
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDownloadModal(data);
        } else {
            addNotification('Failed to load download options: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error loading download info:', error);
        addNotification('Failed to load download options', 'error');
    }
}

function showDownloadModal(downloadData) {
    const modal = document.createElement('div');
    modal.id = 'downloadModal';
    modal.className = 'modal download-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeDownloadModal()">
                <i class='bx bx-x'></i>
            </button>
            <div class="download-info">
                <img src="${downloadData.poster}" alt="${downloadData.title}" class="download-poster">
                <h2 class="download-title">${downloadData.title}</h2>
                <div class="download-meta">
                    <span><i class='bx bx-star'></i> ${downloadData.rating}/10</span>
                    <span><i class='bx bx-calendar'></i> ${new Date().getFullYear()}</span>
                </div>
                <p class="download-description">${downloadData.overview}</p>
            </div>
            
            <div class="quality-selector">
                <h3 class="quality-title">Select Quality</h3>
                <div class="quality-options" id="qualityOptions">
                    ${Object.entries(downloadData.qualities).map(([quality, url]) => `
                        <div class="quality-option" data-quality="${quality}" onclick="selectQuality('${quality}')">
                            ${quality}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="subtitle-selector">
                <h3 class="subtitle-title">Select Subtitles (Optional)</h3>
                <div class="subtitle-options" id="subtitleOptions">
                    ${downloadData.subtitles.map(subtitle => `
                        <div class="subtitle-option" onclick="toggleSubtitle('${subtitle.language}')">
                            <div class="subtitle-checkbox" data-lang="${subtitle.language}"></div>
                            <span>${subtitle.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="download-actions">
                <button class="btn btn-primary" onclick="startDownload()" id="downloadBtn" disabled>
                    <i class='bx bx-download'></i>
                    Download
                </button>
                <button class="btn btn-secondary" onclick="closeDownloadModal()">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('visible');
    document.body.classList.add('no-scroll');
    
    // Store download data for later use
    window.currentDownloadData = downloadData;
}

function closeDownloadModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

function selectQuality(quality) {
    document.querySelectorAll('.quality-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelector(`[data-quality="${quality}"]`).classList.add('selected');
    document.getElementById('downloadBtn').disabled = false;
    
    window.selectedQuality = quality;
}

function toggleSubtitle(language) {
    const checkbox = document.querySelector(`[data-lang="${language}"]`);
    checkbox.classList.toggle('checked');
    
    if (!window.selectedSubtitles) window.selectedSubtitles = [];
    
    const index = window.selectedSubtitles.indexOf(language);
    if (index > -1) {
        window.selectedSubtitles.splice(index, 1);
    } else {
        window.selectedSubtitles.push(language);
    }
}

async function startDownload() {
    if (!window.selectedQuality) {
        addNotification('Please select a quality first', 'error');
        return;
    }
    
    try {
        const response = await fetch('download.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'generate_download_link',
                type: window.currentDownloadData.type,
                id: window.currentDownloadData.id,
                quality: window.selectedQuality,
                season: window.currentDownloadData.season,
                episode: window.currentDownloadData.episode
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Create download link
            const link = document.createElement('a');
            link.href = data.download_url;
            link.download = window.currentDownloadData.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            addNotification('Download started!', 'success');
            closeDownloadModal();
            
            // Download selected subtitles
            if (window.selectedSubtitles && window.selectedSubtitles.length > 0) {
                window.selectedSubtitles.forEach(lang => {
                    const subtitleLink = document.createElement('a');
                    subtitleLink.href = `subtitles.php?id=${window.currentDownloadData.id}&lang=${lang}`;
                    subtitleLink.download = `${window.currentDownloadData.filename}_${lang}.srt`;
                    document.body.appendChild(subtitleLink);
                    subtitleLink.click();
                    document.body.removeChild(subtitleLink);
                });
            }
        } else {
            addNotification('Failed to generate download link: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error starting download:', error);
        addNotification('Failed to start download', 'error');
    }
}

// Subtitle Functions
function openSubtitleSelector(id, type) {
    const modal = document.createElement('div');
    modal.id = 'subtitleModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; padding: var(--spacing-2xl);">
            <button class="modal-close" onclick="closeSubtitleModal()">
                <i class='bx bx-x'></i>
            </button>
            <h2 style="margin-bottom: var(--spacing-xl); text-align: center;">
                <i class='bx bx-closed-captioning' style="color: var(--primary-red); margin-right: var(--spacing-sm);"></i>
                Select Subtitles
            </h2>
            <div id="subtitleList" style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                <div style="text-align: center; padding: var(--spacing-lg);">
                    <div class="loading-spinner" style="margin: 0 auto var(--spacing-md);"></div>
                    <p>Loading subtitles...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('visible');
    document.body.classList.add('no-scroll');
    
    loadSubtitles(id);
}

function closeSubtitleModal() {
    const modal = document.getElementById('subtitleModal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

async function loadSubtitles(id) {
    try {
        const response = await fetch('subtitles.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });
        
        const data = await response.json();
        const subtitleList = document.getElementById('subtitleList');
        
        if (data.subtitles && data.subtitles.length > 0) {
            subtitleList.innerHTML = data.subtitles.map(subtitle => `
                <a href="${subtitle.url}" class="btn btn-secondary" style="justify-content: flex-start;" download>
                    <i class='bx bx-download'></i>
                    ${subtitle.name}
                </a>
            `).join('');
        } else {
            subtitleList.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                    <i class='bx bx-error' style="font-size: 3rem; margin-bottom: var(--spacing-md);"></i>
                    <p>No subtitles available</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading subtitles:', error);
        document.getElementById('subtitleList').innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-error);">
                <i class='bx bx-error' style="font-size: 3rem; margin-bottom: var(--spacing-md);"></i>
                <p>Failed to load subtitles</p>
            </div>
        `;
    }
}

// Details Modal
async function openDetails(id, type) {
    const modal = document.createElement('div');
    modal.id = 'detailsModal';
    modal.className = 'modal details-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeDetails()">
                <i class='bx bx-x'></i>
            </button>
            <div class="details-container">
                <div style="text-align: center; padding: 2rem;">
                    <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                    <p>Loading details...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('visible');
    document.body.classList.add('no-scroll');
    
    try {
        const data = await fetchTMDBData(type, id);
        if (data) {
            await populateDetailsModal(data, type);
        }
    } catch (error) {
        console.error('Error loading details:', error);
        modal.querySelector('.details-container').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-error);">
                <i class='bx bx-error' style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Failed to load details. Please try again.</p>
            </div>
        `;
    }
}

async function populateDetailsModal(data, type) {
    const posterUrl = data.poster_path 
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image';
        
    const title = data.title || data.name || 'Untitled';
    const isInWatchlist = isItemInWatchlist(data.id, type);
    
    const trailerUrl = await getTrailerUrl(data.id, type);
    
    const detailsContainer = document.querySelector('.details-container');
    detailsContainer.innerHTML = `
        <img class="details-poster" src="${posterUrl}" alt="${title} Poster">
        <div class="details-info">
            <h1 class="details-title">${title}</h1>
            <p class="details-overview">${data.overview || 'No description available.'}</p>
            
            <div class="details-meta">
                <div class="meta-group">
                    <div class="meta-label">Rating</div>
                    <div class="meta-value">${data.vote_average ? data.vote_average.toFixed(1) + '/10' : 'N/A'}</div>
                </div>
                <div class="meta-group">
                    <div class="meta-label">${type === 'movie' ? 'Release Date' : 'First Air Date'}</div>
                    <div class="meta-value">${(data.release_date || data.first_air_date || '').split('-')[0] || 'N/A'}</div>
                </div>
                <div class="meta-group">
                    <div class="meta-label">${type === 'movie' ? 'Runtime' : 'Seasons'}</div>
                    <div class="meta-value">
                        ${type === 'movie' 
                            ? (data.runtime ? `${data.runtime} min` : 'N/A')
                            : (data.number_of_seasons ? `${data.number_of_seasons} seasons` : 'N/A')
                        }
                    </div>
                </div>
                <div class="meta-group">
                    <div class="meta-label">Genres</div>
                    <div class="meta-value">${data.genres ? data.genres.map(g => g.name).join(', ') : 'N/A'}</div>
                </div>
            </div>
            
            ${trailerUrl ? `
                <div class="details-trailer">
                    <h3 class="trailer-title">
                        <i class='bx bx-play-circle'></i>
                        Official Trailer
                    </h3>
                    <iframe class="trailer-frame" src="${trailerUrl}" allowfullscreen></iframe>
                </div>
            ` : ''}
            
            <div class="details-actions">
                <button class="btn btn-primary" onclick="openPlayer('${type}', ${data.id}, '${title}')">
                    <i class='bx bx-play'></i>
                    Play Now
                </button>
                <button class="btn btn-secondary ${isInWatchlist ? 'active' : ''}" onclick="toggleWatchlist(${data.id}, '${type}', '${title}', '${posterUrl}')">
                    <i class='bx ${isInWatchlist ? 'bx-check' : 'bx-plus'}'></i>
                    ${isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
                <button class="btn btn-secondary" onclick="openDownloadModal('${type}', ${data.id}, '${title}')">
                    <i class='bx bx-download'></i>
                    Download
                </button>
            </div>
        </div>
    `;
}

function closeDetails() {
    const modal = document.getElementById('detailsModal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

async function getTrailerUrl(id, type) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${window.APP_CONFIG.TMDB_API_KEY}&language=en-US`);
        const data = await response.json();
        
        const trailer = data.results?.find(video => 
            video.type === 'Trailer' && 
            video.site === 'YouTube'
        );
        
        return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    } catch (error) {
        console.error('Error fetching trailer:', error);
        return null;
    }
}

// Watchlist Functions
function toggleWatchlist(id, type, title, poster) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const existingIndex = watchlist.findIndex(item => item.id === id && item.type === type);
    
    if (existingIndex === -1) {
        const item = {
            id: id,
            type: type,
            title: title,
            poster: poster,
            addedAt: new Date().toISOString()
        };
        watchlist.push(item);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        addNotification(`${title} added to your watchlist!`, 'success');
    } else {
        watchlist.splice(existingIndex, 1);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        addNotification(`${title} removed from your watchlist!`, 'info');
    }
    
    updateWatchlistUI();
    renderWatchlist();
}

function isItemInWatchlist(id, type) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    return watchlist.some(item => item.id === id && item.type === type);
}

function updateWatchlistUI() {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const badge = document.getElementById('watchlistBadge');
    
    badge.textContent = watchlist.length;
    badge.style.display = watchlist.length > 0 ? 'flex' : 'none';
}

async function renderWatchlist() {
    const container = document.getElementById('watchlistGrid');
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    
    container.innerHTML = '';
    
    if (watchlist.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class='bx bx-bookmark' style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <p>Your watchlist is empty</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Add movies and TV shows to watch them later</p>
            </div>
        `;
        return;
    }
    
    for (const item of watchlist.slice(0, 12)) {
        try {
            const data = await fetchTMDBData(item.type, item.id);
            if (data) {
                const card = createContentCard(data, item.type);
                container.appendChild(card);
            }
        } catch (error) {
            console.error('Error loading watchlist item:', error);
        }
    }
}

function addToWatchHistory(id, type, title) {
    let history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    
    history = history.filter(item => !(item.id === id && item.type === type));
    
    history.unshift({
        id: id,
        type: type,
        title: title,
        watchedAt: new Date().toISOString()
    });
    
    history = history.slice(0, 50);
    
    localStorage.setItem('watchHistory', JSON.stringify(history));
}

// Event Listeners
function initializeEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() && searchResults.innerHTML) {
            searchResults.classList.add('visible');
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('visible');
        }
    });
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', updateBackToTopButton);
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Ripple effect
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('ripple')) {
            const ripple = e.target;
            const rect = ripple.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            const rippleEffect = document.createElement('span');
            rippleEffect.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                pointer-events: none;
            `;
            
            ripple.appendChild(rippleEffect);
            
            setTimeout(() => {
                rippleEffect.remove();
            }, 600);
        }
    });
}

// Search Functions
async function handleSearch(event) {
    const query = event.target.value.trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (!query) {
        resultsContainer.classList.remove('visible');
        return;
    }
    
    resultsContainer.innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div>
            <p>Searching...</p>
        </div>
    `;
    resultsContainer.classList.add('visible');
    
    try {
        const searchData = await searchTMDB(query);
        
        if (!searchData || !searchData.results || searchData.results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class='bx bx-search-alt' style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                    <p>No results found for "${query}"</p>
                </div>
            `;
            return;
        }
        
        const results = searchData.results
            .filter(item => !item.adult && (item.media_type === 'movie' || item.media_type === 'tv'))
            .slice(0, 8);
        
        resultsContainer.innerHTML = results.map(item => {
            const posterUrl = item.poster_path 
                ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                : 'https://via.placeholder.com/92x138/1a1a1a/ffffff?text=No+Image';
            
            const title = item.title || item.name || 'Untitled';
            const year = (item.release_date || item.first_air_date || '').split('-')[0] || '';
            const type = item.media_type === 'movie' ? 'Movie' : 'TV Show';
            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
            
            return `
                <div class="search-result-item" onclick="requireAuth(() => openDetails(${item.id}, '${item.media_type}')); closeSearchResults();">
                    <img src="${posterUrl}" alt="${title}" class="search-result-image">
                    <div class="search-result-info">
                        <h4 class="search-result-title">${title}</h4>
                        <div class="search-result-meta">
                            <span>${type}</span>
                            ${year ? `<span>•</span><span>${year}</span>` : ''}
                            <span>•</span>
                            <div class="search-result-rating">
                                <i class='bx bx-star'></i>
                                <span>${rating}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = `
            <div class="search-error">
                <i class='bx bx-error' style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--text-error);"></i>
                <p>Search failed. Please try again.</p>
            </div>
        `;
    }
}

function closeSearchResults() {
    document.getElementById('searchResults').classList.remove('visible');
    document.getElementById('searchInput').value = '';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Scroll Functions
function handleScroll() {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

function updateBackToTopButton() {
    const backToTop = document.getElementById('backToTop');
    if (window.scrollY > 500) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(event) {
    if (event.key === 'Escape') {
        closeAllModals();
    }
    
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    if (event.key === ' ' && event.target.tagName !== 'INPUT') {
        const activeVideo = document.querySelector('#playerFrame');
        if (activeVideo && document.getElementById('playerModal')?.classList.contains('visible')) {
            event.preventDefault();
        }
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal.visible');
    modals.forEach(modal => {
        modal.classList.remove('visible');
    });
    document.body.classList.remove('no-scroll');
    
    // Clean up dynamically created modals
    setTimeout(() => {
        const dynamicModals = ['playerModal', 'downloadModal', 'detailsModal', 'subtitleModal'];
        dynamicModals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
    }, 300);
}

// Sidebar Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    document.body.classList.add('no-scroll');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.classList.remove('no-scroll');
}

// Theme Functions
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        themeIcon.className = 'bx bx-moon';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-theme');
        themeIcon.className = 'bx bx-sun';
        localStorage.setItem('theme', 'light');
    }
}

function loadUserPreferences() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const themeIcon = document.getElementById('themeIcon');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.className = 'bx bx-sun';
    } else if (savedTheme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (!prefersDark) {
            document.body.classList.add('light-theme');
        }
        themeIcon.className = prefersDark ? 'bx bx-moon' : 'bx bx-sun';
    }
}

// Profile Functions
function openProfile() {
    const modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; padding: var(--spacing-2xl);">
            <button class="modal-close" onclick="closeProfile()">
                <i class='bx bx-x'></i>
            </button>
            <div id="profileContent"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const content = document.getElementById('profileContent');
    
    if (window.isUserSignedIn && window.currentUser) {
        const user = window.currentUser;
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                ${user.photoURL ? `
                    <img src="${user.photoURL}" alt="${user.displayName || 'User'}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; border: 4px solid var(--primary-red);">
                ` : `
                    <div style="width: 100px; height: 100px; border-radius: 50%; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; border: 4px solid var(--primary-red);">
                        <i class='bx bx-user' style="font-size: 3rem; color: var(--text-muted);"></i>
                    </div>
                `}
                <h2 style="font-size: var(--font-size-2xl); margin-bottom: 0.5rem;">${user.displayName || 'User'}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">${user.email}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); text-align: center;">
                    <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--primary-red); margin-bottom: 0.5rem;">${watchlist.length}</div>
                    <div style="color: var(--text-muted); font-size: var(--font-size-sm);">Watchlist Items</div>
                </div>
                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); text-align: center;">
                    <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--secondary-green); margin-bottom: 0.5rem;">${watchHistory.length}</div>
                    <div style="color: var(--text-muted); font-size: var(--font-size-sm);">Watched</div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <button class="btn btn-secondary" onclick="signOutUser(); closeProfile();" style="width: 100%;">
                    <i class='bx bx-log-out'></i>
                    Sign Out
                </button>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div style="text-align: center;">
                <i class='bx bx-user' style="font-size: 4rem; color: var(--text-muted); margin-bottom: 1rem; display: block;"></i>
                <h2 style="font-size: var(--font-size-2xl); margin-bottom: 1rem;">Sign In Required</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">Sign in to access your profile and personalized features.</p>
                <button class="btn btn-primary" onclick="closeProfile(); openAuthModal();" style="width: 100%;">
                    <i class='bx bx-log-in'></i>
                    Sign In
                </button>
            </div>
        `;
    }
    
    modal.classList.add('visible');
    document.body.classList.add('no-scroll');
}

function closeProfile() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

// Settings Functions
function openSettings() {
    const modal = document.createElement('div');
    modal.id = 'settingsModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; padding: var(--spacing-2xl);">
            <button class="modal-close" onclick="closeSettings()">
                <i class='bx bx-x'></i>
            </button>
            <div>
                <h2 style="font-family: var(--font-family-secondary); font-size: var(--font-size-2xl); margin-bottom: var(--spacing-xl); text-align: center;">
                    <i class='bx bx-cog' style="color: var(--primary-red); margin-right: var(--spacing-sm);"></i>
                    Settings
                </h2>
                
                <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
                    <div>
                        <label style="display: block; color: var(--text-primary); font-weight: 600; margin-bottom: var(--spacing-sm);">Theme</label>
                        <select id="themeSelect" onchange="changeTheme()" style="width: 100%; padding: var(--spacing-md); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-tertiary); color: var(--text-primary); font-size: var(--font-size-base);">
                            <option value="dark">Dark Theme</option>
                            <option value="light">Light Theme</option>
                            <option value="auto">Auto (System)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; color: var(--text-primary); font-weight: 600; margin-bottom: var(--spacing-sm);">Video Quality</label>
                        <select id="qualitySelect" style="width: 100%; padding: var(--spacing-md); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-tertiary); color: var(--text-primary); font-size: var(--font-size-base);">
                            <option value="auto">Auto</option>
                            <option value="1080p">1080p HD</option>
                            <option value="720p">720p</option>
                            <option value="480p">480p</option>
                        </select>
                    </div>
                    
                    <div style="padding-top: var(--spacing-lg); border-top: 1px solid var(--border-primary); text-align: center;">
                        <button class="btn btn-primary" onclick="saveSettings()">
                            <i class='bx bx-save'></i>
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('visible');
    document.body.classList.add('no-scroll');
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.getElementById('themeSelect').value = savedTheme;
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

function saveSettings() {
    const theme = document.getElementById('themeSelect').value;
    const quality = document.getElementById('qualitySelect').value;
    
    const settings = {
        theme: theme,
        quality: quality
    };
    
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // Apply theme immediately
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    body.classList.remove('light-theme');
    
    if (theme === 'light') {
        body.classList.add('light-theme');
        themeIcon.className = 'bx bx-sun';
    } else if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (!prefersDark) {
            body.classList.add('light-theme');
        }
        themeIcon.className = prefersDark ? 'bx bx-moon' : 'bx bx-sun';
    } else {
        themeIcon.className = 'bx bx-moon';
    }
    
    localStorage.setItem('theme', theme);
    
    addNotification('Settings saved successfully!', 'success');
    closeSettings();
}

// About Functions
function openAbout() {
    const modal = document.createElement('div');
    modal.id = 'aboutModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; padding: var(--spacing-2xl);">
            <button class="modal-close" onclick="closeAbout()">
                <i class='bx bx-x'></i>
            </button>
            <div style="text-align: center;">
                <div style="margin-bottom: var(--spacing-xl);">
                    <img src="https://i.ibb.co/TBF7Y2RW/IMG-20250920-081728.jpg" alt="${window.APP_CONFIG.APP_AUTHOR}" style="width: 120px; height: 120px; border-radius: var(--radius-full); object-fit: cover; border: 4px solid var(--primary-red); margin-bottom: var(--spacing-md);">
                    <h2 style="font-family: var(--font-family-secondary); font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--spacing-sm);">${window.APP_CONFIG.APP_AUTHOR}</h2>
                    <p style="color: var(--text-secondary); font-size: var(--font-size-base);">Web Developer & Movie Lover</p>
                </div>
                
                <div style="text-align: left; margin-bottom: var(--spacing-xl);">
                    <h4 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-md); color: var(--primary-red);">About ${window.APP_CONFIG.APP_NAME}</h4>
                    <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: var(--spacing-md);">
                        ${window.APP_CONFIG.APP_NAME} is a modern streaming platform built with web technologies. This project showcases movies and TV shows with advanced features like download support and subtitle integration.
                    </p>
                    <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: var(--spacing-md);">
                        Features include real-time search, personalized watchlists, multiple viewing modes, video downloads, and subtitle support.
                    </p>
                    <p style="color: var(--text-secondary); line-height: 1.6;">
                        Built with PHP, HTML5, CSS3, and vanilla JavaScript - proving that modern web experiences don't always require heavy frameworks.
                    </p>
                </div>
                
                <div style="display: flex; justify-content: center; gap: var(--spacing-md); margin-bottom: var(--spacing-xl);">
                    <a href="#" class="social-link">
                        <i class='bx bxl-github'></i>
                    </a>
                    <a href="#" class="social-link">
                        <i class='bx bxl-linkedin'></i>
                    </a>
                    <a href="#" class="social-link">
                        <i class='bx bxl-facebook'></i>
                    </a>
                    <a href="#" class="social-link">
                        <i class='bx bxl-youtube'></i>
                    </a>
                </div>
                
                <div style="padding: var(--spacing-lg); background: var(--bg-tertiary); border-radius: var(--radius-lg); border-left: 4px solid var(--primary-red);">
                    <h4 style="color: var(--primary-red); margin-bottom: var(--spacing-sm); display: flex; align-items: center; gap: var(--spacing-sm);">
                        <i class='bx bx-info-circle'></i>
                        Version Info
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); font-size: var(--font-size-sm);">
                        <div style="color: var(--text-muted);">Version:</div>
                        <div style="color: var(--text-primary); font-weight: 600;">${window.APP_CONFIG.APP_VERSION} Pro</div>
                        <div style="color: var(--text-muted);">Build:</div>
                        <div style="color: var(--text-primary); font-weight: 600;">2025.01.17</div>
                        <div style="color: var(--text-muted);">License:</div>
                        <div style="color: var(--text-primary); font-weight: 600;">MIT</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('visible');
    document.body.classList.add('no-scroll');
}

function closeAbout() {
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

// Notification Functions
function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('visible');
    
    if (panel.classList.contains('visible')) {
        notifications.forEach(notif => notif.read = true);
        updateNotificationsUI();
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }
}

function addNotification(message, type = 'info') {
    const notification = {
        id: Date.now(),
        message: message,
        type: type,
        read: false,
        timestamp: new Date().toISOString()
    };
    
    notifications.unshift(notification);
    notifications = notifications.slice(0, 20);
    
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationsUI();
    
    showToastNotification(message, type);
}

function updateNotificationsUI() {
    const badge = document.getElementById('notificationBadge');
    const list = document.getElementById('notificationList');
    
    const unreadCount = notifications.filter(n => !n.read).length;
    
    badge.textContent = unreadCount;
    badge.classList.toggle('visible', unreadCount > 0);
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="empty-notifications">
                <i class='bx bx-bell'></i>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="markNotificationRead(${notif.id})">
            <div class="notification-content">
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${formatTimeAgo(notif.timestamp)}</div>
            </div>
            <button class="notification-delete" onclick="deleteNotification(${notif.id}); event.stopPropagation();" title="Delete notification">
                <i class='bx bx-trash'></i>
            </button>
        </div>
    `).join('');
}

function markNotificationRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationsUI();
    }
}

function markAllNotificationsRead() {
    notifications.forEach(notif => notif.read = true);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationsUI();
}

function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationsUI();
}

function clearAllNotifications() {
    notifications = [];
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationsUI();
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return past.toLocaleDateString();
}

function showToastNotification(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        border-left: 4px solid ${type === 'success' ? 'var(--secondary-green)' : type === 'error' ? 'var(--text-error)' : 'var(--primary-red)'};
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class='bx ${type === 'success' ? 'bx-check' : type === 'error' ? 'bx-error' : 'bx-info-circle'}'></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Pagination Functions
async function loadPage(section, direction) {
    if (isLoading) return;
    
    isLoading = true;
    const prevBtn = document.getElementById(`${section}Prev`);
    const nextBtn = document.getElementById(`${section}Next`);
    
    currentPage[section] += direction;
    if (currentPage[section] < 1) {
        currentPage[section] = 1;
        isLoading = false;
        return;
    }
    
    prevBtn.disabled = currentPage[section] <= 1;
    
    try {
        let url = '';
        let containerId = '';
        
        switch(section) {
            case 'movies':
                url = `https://vidsrc.xyz/movies/latest/page-${currentPage[section]}.json`;
                containerId = 'moviesGrid';
                break;
            case 'tv':
                url = `https://vidsrc.xyz/tvshows/latest/page-${currentPage[section]}.json`;
                containerId = 'tvGrid';
                break;
            case 'episodes':
                url = `https://vidsrc.xyz/episodes/latest/page-${currentPage[section]}.json`;
                containerId = 'episodesGrid';
                break;
        }
        
        if (url) {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.result && data.result.length > 0) {
                const container = document.getElementById(containerId);
                container.innerHTML = '';
                
                if (section === 'movies') {
                    await renderMovieContent(data.result, containerId);
                } else if (section === 'tv') {
                    await renderTVContent(data.result, containerId);
                } else if (section === 'episodes') {
                    await renderEpisodeContent(data.result, containerId);
                }
            } else {
                currentPage[section] -= direction;
                nextBtn.disabled = true;
                addNotification('No more content available', 'info');
            }
        }
    } catch (error) {
        console.error('Error loading page:', error);
        currentPage[section] -= direction;
        addNotification('Failed to load content. Please try again.', 'error');
    } finally {
        isLoading = false;
        prevBtn.disabled = currentPage[section] <= 1;
    }
}

function loadMore(section) {
    loadPage(section, 1);
}

// View All Functions
async function openViewAll(type) {
    currentViewAllType = type;
    viewAllPage = 1;
    
    const modal = document.createElement('div');
    modal.id = 'viewAllModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="width: 95vw; max-width: 1200px; height: 85vh; display: flex; flex-direction: column;">
            <button class="modal-close" onclick="closeViewAll()">
                <i class='bx bx-x'></i>
            </button>
            <div style="padding: var(--spacing-xl); border-bottom: 1px solid var(--border-primary);">
                <h2 id="viewAllTitle" style="font-family: var(--font-family-secondary); font-size: var(--font-size-2xl); font-weight: 700; margin: 0;">All ${type.charAt(0).toUpperCase() + type.slice(1)}</h2>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: var(--spacing-xl);">
                <div class="content-grid" id="viewAllGrid">
                    <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                        <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                        <p>Loading...</p>
                    </div>
                </div>
                <div class="pagination-container" id="viewAllPagination">
                    <button class="pagination-btn" id="viewAllPrev" onclick="loadViewAllPage(-1)" disabled>
                        <i class='bx bx-chevron-left'></i> Previous
                    </button>
                    <button class="pagination-btn load-more-btn" onclick="loadViewAllPage(1)">
                        <i class='bx bx-plus'></i> Load More
                    </button>
                    <button class="pagination-btn" id="viewAllNext" onclick="loadViewAllPage(1)">
                        Next <i class='bx bx-chevron-right'></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('visible');
    document.body.classList.add('no-scroll');
    
    try {
        await loadViewAllContent(type, 1);
    } catch (error) {
        console.error('Error loading view all content:', error);
        document.getElementById('viewAllGrid').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-error);">
                <i class='bx bx-error' style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Failed to load content</p>
            </div>
        `;
    }
}

async function loadViewAllContent(type, page) {
    const grid = document.getElementById('viewAllGrid');
    
    if (page === 1) {
        grid.innerHTML = '';
    }
    
    try {
        let data = [];
        
        switch(type) {
            case 'movies':
                const moviesResponse = await fetch(`https://vidsrc.xyz/movies/latest/page-${page}.json`);
                const moviesData = await moviesResponse.json();
                if (moviesData.result) {
                    for (const movie of moviesData.result.slice(0, 20)) {
                        if (movie.tmdb_id || movie.imdb_id) {
                            const movieData = await fetchTMDBData('movie', movie.tmdb_id || movie.imdb_id);
                            if (movieData && !movieData.adult) {
                                data.push({...movieData, type: 'movie'});
                            }
                        }
                    }
                }
                break;
                
            case 'tv':
                const tvResponse = await fetch(`https://vidsrc.xyz/tvshows/latest/page-${page}.json`);
                const tvData = await tvResponse.json();
                if (tvData.result) {
                    for (const show of tvData.result.slice(0, 20)) {
                        if (show.tmdb_id || show.imdb_id) {
                            const showData = await fetchTMDBData('tv', show.tmdb_id || show.imdb_id);
                            if (showData) {
                                data.push({...showData, type: 'tv'});
                            }
                        }
                    }
                }
                break;
                
            case 'trending':
                const trendingData = await fetchTMDBData('trending/all/week', null, page);
                if (trendingData && trendingData.results) {
                    data = trendingData.results.filter(item => !item.adult).map(item => ({
                        ...item,
                        type: item.media_type === 'movie' ? 'movie' : 'tv'
                    }));
                }
                break;
                
            case 'popular':
                const popularData = await fetchTMDBData('movie/popular', null, page);
                if (popularData && popularData.results) {
                    data = popularData.results.filter(item => !item.adult).map(item => ({
                        ...item,
                        type: 'movie'
                    }));
                }
                break;
                
            case 'watchlist':
                const watchlistItems = JSON.parse(localStorage.getItem('watchlist') || '[]');
                for (const item of watchlistItems.slice((page-1)*20, page*20)) {
                    const itemData = await fetchTMDBData(item.type, item.id);
                    if (itemData) {
                        data.push({...itemData, type: item.type});
                    }
                }
                break;
        }
        
        data.forEach(item => {
            const card = createContentCard(item, item.type);
            grid.appendChild(card);
        });
        
        if (data.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class='bx bx-movie' style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No content available</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading view all content:', error);
        throw error;
    }
}

async function loadViewAllPage(direction) {
    if (direction > 0) {
        viewAllPage++;
        await loadViewAllContent(currentViewAllType, viewAllPage);
    }
}

function closeViewAll() {
    const modal = document.getElementById('viewAllModal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
    currentViewAllType = '';
    viewAllPage = 1;
}

// Make functions globally available
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.toggleNotifications = toggleNotifications;
window.openProfile = openProfile;
window.closeProfile = closeProfile;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
window.openAbout = openAbout;
window.closeAbout = closeAbout;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.requireAuth = requireAuth;
window.openPlayer = openPlayer;
window.closePlayer = closePlayer;
window.openDetails = openDetails;
window.closeDetails = closeDetails;
window.openDownloadModal = openDownloadModal;
window.closeDownloadModal = closeDownloadModal;
window.selectQuality = selectQuality;
window.toggleSubtitle = toggleSubtitle;
window.startDownload = startDownload;
window.openSubtitleSelector = openSubtitleSelector;
window.closeSubtitleModal = closeSubtitleModal;
window.toggleWatchlist = toggleWatchlist;
window.scrollToTop = scrollToTop;
window.loadPage = loadPage;
window.loadMore = loadMore;
window.openViewAll = openViewAll;
window.closeViewAll = closeViewAll;
window.loadViewAllPage = loadViewAllPage;
window.markNotificationRead = markNotificationRead;
window.markAllNotificationsRead = markAllNotificationsRead;
window.deleteNotification = deleteNotification;
window.clearAllNotifications = clearAllNotifications;
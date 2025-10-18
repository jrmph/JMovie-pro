<?php
// JMovie Pro - Main Application File
// Made by Jhames Rhonnielle Martin

require_once 'config.php';
require_once 'functions.php';

// Get URL parameters
$type = $_GET['type'] ?? '';
$id = $_GET['id'] ?? '';
$season = $_GET['season'] ?? '';
$episode = $_GET['episode'] ?? '';
$section = $_GET['section'] ?? 'home';

// Load initial data
try {
    $moviesPage1 = get_json("https://vidsrc.xyz/movies/latest/page-1.json");
    $tvPage1 = get_json("https://vidsrc.xyz/tvshows/latest/page-1.json");
    $epsPage1 = get_json("https://vidsrc.xyz/episodes/latest/page-1.json");
    $popularMovies = get_json("https://api.themoviedb.org/3/movie/popular?api_key=" . TMDB_API_KEY . "&language=en-US&page=1");
    $trendingMovies = get_json("https://api.themoviedb.org/3/trending/movie/week?api_key=" . TMDB_API_KEY . "&language=en-US");
    $trendingTV = get_json("https://api.themoviedb.org/3/trending/tv/week?api_key=" . TMDB_API_KEY . "&language=en-US");
    $topRatedMovies = get_json("https://api.themoviedb.org/3/movie/top_rated?api_key=" . TMDB_API_KEY . "&language=en-US&page=1");
    $genres = get_json("https://api.themoviedb.org/3/genre/movie/list?api_key=" . TMDB_API_KEY . "&language=en-US");
    
    $shuffledMovies = $popularMovies['results'] ?? [];
    shuffle($shuffledMovies);
    $heroMovies = array_slice($shuffledMovies, 0, 8);
} catch (Exception $e) {
    error_log("Error loading initial data: " . $e->getMessage());
    $moviesPage1 = ['result' => []];
    $tvPage1 = ['result' => []];
    $epsPage1 = ['result' => []];
    $heroMovies = [];
    $genres = ['genres' => []];
}

// If specific content is requested, redirect to player or details
if ($type && $id) {
    if (isset($_GET['play'])) {
        // Redirect to player
        $play_url = "player.php?type={$type}&id={$id}";
        if ($season && $episode) {
            $play_url .= "&season={$season}&episode={$episode}";
        }
        header("Location: {$play_url}");
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="JMovie Pro - Ultimate streaming platform for movies and TV shows. Watch the latest releases in HD quality with subtitles and download options.">
    <meta name="keywords" content="movies, streaming, tv shows, entertainment, cinema, watch online, download movies, subtitles">
    <meta name="author" content="<?php echo APP_AUTHOR; ?>">
    <title><?php echo APP_NAME; ?> - Premium Streaming Experience</title>
    
    <link rel="icon" type="image/x-icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNlNTA5MTQiLz4KPHBhdGggZD0iTTEyIDEwTDIyIDE2TDEyIDIyVjEwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==">
    
    <!-- External CSS -->
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
    
    <!-- External JS -->
    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
</head>
<body>
    <!-- Loading Screen -->
    <div id="loadingScreen" class="loading-screen">
        <div class="loading-spinner"></div>
        <div class="loading-brand">
            <h1><i class='bx bx-movie-play'></i> <?php echo APP_NAME; ?></h1>
            <p>Premium Streaming Experience</p>
        </div>
        <div class="loading-progress">
            <div class="progress-bar"></div>
        </div>
        <div class="loading-tips">
            <div class="loading-tip">Loading your personalized content...</div>
        </div>
        <div class="loading-credit">Made by <?php echo APP_AUTHOR; ?></div>
    </div>

    <!-- Authentication Modal -->
    <div id="authModal" class="modal">
        <div class="modal-content" style="max-width: 450px; padding: var(--spacing-2xl);">
            <button class="modal-close" onclick="closeAuthModal()">
                <i class='bx bx-x'></i>
            </button>
            <div style="text-align: center;">
                <div style="margin-bottom: var(--spacing-xl);">
                    <i class='bx bx-movie-play' style="font-size: var(--font-size-4xl); color: var(--primary-red); margin-bottom: var(--spacing-md); display: block;"></i>
                    <h2 style="font-family: var(--font-family-secondary); font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--spacing-sm);">Welcome to <?php echo APP_NAME; ?></h2>
                    <p style="color: var(--text-secondary); font-size: var(--font-size-base);">Sign in to unlock premium features and personalized recommendations</p>
                </div>
                
                <div style="margin-bottom: var(--spacing-lg);">
                    <button class="btn btn-primary" onclick="signInWithGoogle()" style="width: 100%; gap: var(--spacing-md);">
                        <i class='bx bxl-google' style="font-size: var(--font-size-lg);"></i>
                        Continue with Google
                    </button>
                </div>
                
                <div style="position: relative; margin: var(--spacing-lg) 0;">
                    <div style="height: 1px; background: var(--border-primary);"></div>
                    <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--bg-secondary); padding: 0 var(--spacing-md); color: var(--text-muted); font-size: var(--font-size-sm);">or</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: var(--spacing-md); text-align: left;">
                    <div>
                        <label style="display: block; color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--spacing-xs);">Email</label>
                        <input type="email" placeholder="Enter your email" style="width: 100%; padding: var(--spacing-md); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-tertiary); color: var(--text-primary); font-size: var(--font-size-base);">
                    </div>
                    <div>
                        <label style="display: block; color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--spacing-xs);">Password</label>
                        <input type="password" placeholder="Enter your password" style="width: 100%; padding: var(--spacing-md); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-tertiary); color: var(--text-primary); font-size: var(--font-size-base);">
                    </div>
                    <button class="btn btn-secondary" style="width: 100%;">
                        <i class='bx bx-log-in'></i>
                        Sign In
                    </button>
                </div>
                
                <p style="color: var(--text-muted); font-size: var(--font-size-sm); margin-top: var(--spacing-lg);">
                    Don't have an account? <a href="#" style="color: var(--primary-red); text-decoration: none;">Sign up</a>
                </p>
            </div>
        </div>
    </div>

    <!-- Header -->
    <header class="header" id="header">
        <div class="container">
            <div class="header-container">
                <div class="header-left">
                    <button class="menu-toggle" onclick="toggleSidebar()">
                        <i class='bx bx-menu'></i>
                    </button>
                    <a href="/" class="logo">
                        <i class='bx bx-movie-play'></i>
                        <?php echo APP_NAME; ?>
                    </a>
                </div>
                
                <div class="search-container">
                    <div class="search-wrapper">
                        <input type="text" id="searchInput" class="search-input" placeholder="Search movies, TV shows, actors..." autocomplete="off">
                        <i class='bx bx-search search-icon'></i>
                    </div>
                    <div class="search-results" id="searchResults"></div>
                </div>
                
                <div class="header-actions">
                    <button class="header-btn theme-toggle" onclick="toggleTheme()" title="Toggle theme">
                        <i class='bx bx-moon' id="themeIcon"></i>
                    </button>
                    <button class="header-btn notification-btn" onclick="toggleNotifications()" title="Notifications">
                        <i class='bx bx-bell'></i>
                        <span class="notification-badge" id="notificationBadge">0</span>
                    </button>
                    <button class="header-btn user-btn" onclick="openProfile()" title="Profile">
                        <i class='bx bx-user' id="userIcon"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Sidebar -->
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-logo">
                <i class='bx bx-movie-play'></i>
                <?php echo APP_NAME; ?>
            </div>
            <button class="sidebar-close" onclick="closeSidebar()">
                <i class='bx bx-x'></i>
            </button>
        </div>
        
        <div class="sidebar-content">
            <div class="sidebar-section">
                <div class="sidebar-section-title">Browse</div>
                <ul class="sidebar-nav">
                    <li class="sidebar-nav-item">
                        <a href="/" class="sidebar-nav-link active" data-section="home">
                            <i class='bx bx-home sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Home</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="/movies" class="sidebar-nav-link" data-section="movies">
                            <i class='bx bx-camera-movie sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Movies</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="/tv-shows" class="sidebar-nav-link" data-section="tv">
                            <i class='bx bx-tv sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">TV Shows</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="#episodes" class="sidebar-nav-link" data-section="episodes">
                            <i class='bx bx-list-ul sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Episodes</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-section-title">Categories</div>
                <ul class="sidebar-nav">
                    <li class="sidebar-nav-item">
                        <a href="/trending" class="sidebar-nav-link" data-section="trending">
                            <i class='bx bx-trending-up sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Trending</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="/popular" class="sidebar-nav-link" data-section="popular">
                            <i class='bx bx-hot sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Popular</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="#top-rated" class="sidebar-nav-link" data-section="top-rated">
                            <i class='bx bx-star sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Top Rated</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="#recent" class="sidebar-nav-link" data-section="recent">
                            <i class='bx bx-time-five sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Recently Added</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-section-title">Library</div>
                <ul class="sidebar-nav">
                    <li class="sidebar-nav-item">
                        <a href="/watchlist" class="sidebar-nav-link" data-section="watchlist">
                            <i class='bx bx-bookmark sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">My Watchlist</span>
                            <span class="nav-badge" id="watchlistBadge">0</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="/history" class="sidebar-nav-link" data-section="history">
                            <i class='bx bx-history sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Watch History</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="/favorites" class="sidebar-nav-link" data-section="favorites">
                            <i class='bx bx-heart sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Favorites</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-section-title">Account</div>
                <ul class="sidebar-nav">
                    <li class="sidebar-nav-item">
                        <a href="#profile" class="sidebar-nav-link" onclick="openProfile()">
                            <i class='bx bx-user-circle sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Profile</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="#settings" class="sidebar-nav-link" onclick="openSettings()">
                            <i class='bx bx-cog sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">Settings</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="#about" class="sidebar-nav-link" onclick="openAbout()">
                            <i class='bx bx-info-circle sidebar-nav-icon'></i>
                            <span class="sidebar-nav-text">About</span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </aside>

    <!-- Notification Panel -->
    <div class="notification-panel" id="notificationPanel">
        <div class="notification-header">
            <h3 class="notification-title">Notifications</h3>
            <div class="notification-actions">
                <button class="notification-action-btn" onclick="markAllNotificationsRead()">Mark all read</button>
                <button class="notification-action-btn" onclick="clearAllNotifications()">Clear all</button>
                <button class="notification-action-btn" onclick="toggleNotifications()">
                    <i class='bx bx-x'></i>
                </button>
            </div>
        </div>
        <div class="notification-list" id="notificationList">
            <div class="empty-notifications">
                <i class='bx bx-bell'></i>
                <p>No notifications yet</p>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Hero Section -->
        <section class="hero-section">
            <div class="swiper hero-swiper" id="heroSwiper">
                <div class="swiper-wrapper" id="heroSlides"></div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
            </div>
        </section>

        <!-- Content Sections -->
        <div class="content-sections">
            <div class="container">
                <!-- Movies Section -->
                <section class="content-section" id="moviesSection">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class='bx bx-camera-movie section-icon'></i>
                            Latest Movies
                        </h2>
                        <a href="#" class="view-all-btn" onclick="openViewAll('movies')">
                            View All <i class='bx bx-right-arrow-alt'></i>
                        </a>
                    </div>
                    <div class="content-grid" id="moviesGrid"></div>
                    <div class="pagination-container">
                        <button class="pagination-btn" id="moviesPrev" onclick="loadPage('movies', -1)" disabled>
                            <i class='bx bx-chevron-left'></i> Previous
                        </button>
                        <button class="pagination-btn load-more-btn" onclick="loadMore('movies')">
                            <i class='bx bx-plus'></i> Load More
                        </button>
                        <button class="pagination-btn" id="moviesNext" onclick="loadPage('movies', 1)">
                            Next <i class='bx bx-chevron-right'></i>
                        </button>
                    </div>
                </section>

                <!-- TV Shows Section -->
                <section class="content-section" id="tvSection">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class='bx bx-tv section-icon'></i>
                            Popular TV Shows
                        </h2>
                        <a href="#" class="view-all-btn" onclick="openViewAll('tv')">
                            View All <i class='bx bx-right-arrow-alt'></i>
                        </a>
                    </div>
                    <div class="content-grid" id="tvGrid"></div>
                    <div class="pagination-container">
                        <button class="pagination-btn" id="tvPrev" onclick="loadPage('tv', -1)" disabled>
                            <i class='bx bx-chevron-left'></i> Previous
                        </button>
                        <button class="pagination-btn load-more-btn" onclick="loadMore('tv')">
                            <i class='bx bx-plus'></i> Load More
                        </button>
                        <button class="pagination-btn" id="tvNext" onclick="loadPage('tv', 1)">
                            Next <i class='bx bx-chevron-right'></i>
                        </button>
                    </div>
                </section>

                <!-- Episodes Section -->
                <section class="content-section" id="episodesSection">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class='bx bx-list-ul section-icon'></i>
                            Latest Episodes
                        </h2>
                        <a href="#" class="view-all-btn" onclick="openViewAll('episodes')">
                            View All <i class='bx bx-right-arrow-alt'></i>
                        </a>
                    </div>
                    <div class="content-grid" id="episodesGrid"></div>
                    <div class="pagination-container">
                        <button class="pagination-btn" id="episodesPrev" onclick="loadPage('episodes', -1)" disabled>
                            <i class='bx bx-chevron-left'></i> Previous
                        </button>
                        <button class="pagination-btn load-more-btn" onclick="loadMore('episodes')">
                            <i class='bx bx-plus'></i> Load More
                        </button>
                        <button class="pagination-btn" id="episodesNext" onclick="loadPage('episodes', 1)">
                            Next <i class='bx bx-chevron-right'></i>
                        </button>
                    </div>
                </section>

                <!-- Trending Section -->
                <section class="content-section" id="trendingSection">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class='bx bx-trending-up section-icon'></i>
                            Trending Now
                        </h2>
                        <a href="#" class="view-all-btn" onclick="openViewAll('trending')">
                            View All <i class='bx bx-right-arrow-alt'></i>
                        </a>
                    </div>
                    <div class="content-grid" id="trendingGrid"></div>
                </section>

                <!-- Popular Section -->
                <section class="content-section" id="popularSection">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class='bx bx-hot section-icon'></i>
                            Popular This Week
                        </h2>
                        <a href="#" class="view-all-btn" onclick="openViewAll('popular')">
                            View All <i class='bx bx-right-arrow-alt'></i>
                        </a>
                    </div>
                    <div class="content-grid" id="popularGrid"></div>
                </section>

                <!-- Watchlist Section -->
                <section class="content-section" id="watchlistSection" style="display: none;">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class='bx bx-bookmark section-icon'></i>
                            My Watchlist
                        </h2>
                        <a href="#" class="view-all-btn" onclick="openViewAll('watchlist')">
                            View All <i class='bx bx-right-arrow-alt'></i>
                        </a>
                    </div>
                    <div class="content-grid" id="watchlistGrid"></div>
                </section>
            </div>
        </div>
    </main>

    <!-- Modals -->
    <?php include 'includes/modals.php'; ?>

    <!-- Back to Top Button -->
    <button class="back-to-top" id="backToTop" onclick="scrollToTop()">
        <i class='bx bx-chevron-up'></i>
    </button>

    <!-- Footer -->
    <?php include 'includes/footer.php'; ?>

    <!-- Firebase Authentication -->
    <script type="module" src="assets/js/firebase-config.js"></script>
    
    <!-- Main Application Script -->
    <script src="assets/js/app.js"></script>
    
    <!-- Pass PHP data to JavaScript -->
    <script>
        window.APP_CONFIG = {
            TMDB_API_KEY: '<?php echo TMDB_API_KEY; ?>',
            APP_NAME: '<?php echo APP_NAME; ?>',
            APP_VERSION: '<?php echo APP_VERSION; ?>',
            APP_AUTHOR: '<?php echo APP_AUTHOR; ?>',
            moviesData: <?php echo json_encode($moviesPage1['result'] ?? []); ?>,
            tvData: <?php echo json_encode($tvPage1['result'] ?? []); ?>,
            episodesData: <?php echo json_encode($epsPage1['result'] ?? []); ?>,
            heroMovies: <?php echo json_encode($heroMovies); ?>,
            genres: <?php echo json_encode($genres['genres'] ?? []); ?>
        };
    </script>
</body>
</html>
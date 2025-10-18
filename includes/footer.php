<?php
// JMovie Pro - Footer Component
// Made by Jhames Rhonnielle Martin
?>

<footer class="footer">
    <div class="container">
        <div class="footer-container">
            <div class="footer-section">
                <div class="footer-logo">
                    <i class='bx bx-movie-play'></i>
                    <?php echo APP_NAME; ?>
                </div>
                <p class="footer-description">
                    Your ultimate destination for premium streaming entertainment. 
                    Discover movies, TV shows, and exclusive content in stunning quality with download support and subtitles.
                </p>
                <div class="social-links">
                    <a href="#" class="social-link" title="Facebook">
                        <i class='bx bxl-facebook'></i>
                    </a>
                    <a href="#" class="social-link" title="Twitter">
                        <i class='bx bxl-twitter'></i>
                    </a>
                    <a href="#" class="social-link" title="Instagram">
                        <i class='bx bxl-instagram'></i>
                    </a>
                    <a href="#" class="social-link" title="YouTube">
                        <i class='bx bxl-youtube'></i>
                    </a>
                </div>
            </div>
            
            <div class="footer-section">
                <h3 class="footer-title">Browse</h3>
                <ul class="footer-links">
                    <li><a href="/movies" class="footer-link">Movies</a></li>
                    <li><a href="/tv-shows" class="footer-link">TV Shows</a></li>
                    <li><a href="/trending" class="footer-link">Trending</a></li>
                    <li><a href="/popular" class="footer-link">Popular</a></li>
                    <li><a href="#top-rated" class="footer-link">Top Rated</a></li>
                </ul>
            </div>
            
            <div class="footer-section">
                <h3 class="footer-title">Genres</h3>
                <ul class="footer-links">
                    <li><a href="#" class="footer-link">Action</a></li>
                    <li><a href="#" class="footer-link">Comedy</a></li>
                    <li><a href="#" class="footer-link">Drama</a></li>
                    <li><a href="#" class="footer-link">Horror</a></li>
                    <li><a href="#" class="footer-link">Sci-Fi</a></li>
                </ul>
            </div>
            
            <div class="footer-section">
                <h3 class="footer-title">Features</h3>
                <ul class="footer-links">
                    <li><a href="#" class="footer-link">HD Streaming</a></li>
                    <li><a href="#" class="footer-link">Download Videos</a></li>
                    <li><a href="#" class="footer-link">Subtitles</a></li>
                    <li><a href="#" class="footer-link">Multiple Quality</a></li>
                    <li><a href="#" class="footer-link">Watchlist</a></li>
                </ul>
            </div>
            
            <div class="footer-section">
                <h3 class="footer-title">Support</h3>
                <ul class="footer-links">
                    <li><a href="#" class="footer-link">Help Center</a></li>
                    <li><a href="#" class="footer-link">Contact Us</a></li>
                    <li><a href="#" class="footer-link">Privacy Policy</a></li>
                    <li><a href="#" class="footer-link">Terms of Service</a></li>
                    <li><a href="#" class="footer-link">Cookie Policy</a></li>
                </ul>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p class="footer-copyright">&copy; <?php echo date('Y'); ?> <?php echo APP_NAME; ?>. All rights reserved.</p>
            <p class="footer-credit">Made with ❤️ by <?php echo APP_AUTHOR; ?></p>
        </div>
    </div>
</footer>
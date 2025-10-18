<?php
// JMovie Pro Configuration File
// Made by Jhames Rhonnielle Martin

//Pogi Ako

//Basta Anjan yung mga comments just remove it if u want guide lng yan mga yan

// Database Configuration (if needed for future features)

//Yung sa download and Subtitle add ko sya soon

// API Keys
define('TMDB_API_KEY', 'lagay_mo_apikey');

// Application Settings
define('APP_NAME', 'JMovie Pro');
define('APP_VERSION', '2.1.0');
define('APP_AUTHOR', 'Jhames Rhonnielle Martin');

// Security Settings
define('ALLOWED_HOSTS', ['localhost', '127.0.0.1', $_SERVER['HTTP_HOST'] ?? 'localhost']);
define('MAX_DOWNLOAD_SIZE', 1024 * 1024 * 1024); // 1GB
define('DOWNLOAD_TIMEOUT', 300); 

// Video Sources
define('VIDSRC_BASE_URL', 'https://vidsrc.xyz');
define('VIDSRC_EMBED_URL', 'https://vidsrc.xyz/embed');

// Subtitle Sources
define('OPENSUBTITLES_API_KEY', 'your_opensubtitles_api_key_here');
define('SUBTITLE_CACHE_DIR', __DIR__ . '/cache/subtitles/');

// Download Settings
define('DOWNLOAD_DIR', __DIR__ . '/downloads/');
define('TEMP_DIR', __DIR__ . '/temp/');

// Create necessary directories
$dirs = [SUBTITLE_CACHE_DIR, DOWNLOAD_DIR, TEMP_DIR];
foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/error.log');

// Session Configuration
session_start();

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// CORS Headers for API requests
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost', 'https://localhost'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    }
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Timezone
date_default_timezone_set('UTC');
?>
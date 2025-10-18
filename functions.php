<?php
// JMovie Pro Helper Functions
// Made by Jhames Rhonnielle Martin

require_once 'config.php';

/**
 * Make HTTP requests with cURL
 */
function get_json($url, $headers = []) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    
    $res = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpcode === 200 && $res) {
        return json_decode($res, true);
    }
    return ['results' => [], 'total_pages' => 0];
}

/**
 * Get video download URL
 */
function get_video_download_url($type, $id, $season = null, $episode = null) {
    try {
        if ($type === 'movie') {
            $embed_url = VIDSRC_EMBED_URL . "/movie/{$id}";
        } else {
            if ($season && $episode) {
                $embed_url = VIDSRC_EMBED_URL . "/tv/{$id}/{$season}-{$episode}";
            } else {
                $embed_url = VIDSRC_EMBED_URL . "/tv/{$id}";
            }
        }
        
        // This would need to be implemented based on the actual video source API
        // For now, return the embed URL
        return $embed_url;
    } catch (Exception $e) {
        error_log("Error getting download URL: " . $e->getMessage());
        return false;
    }
}

/**
 * Get subtitles for a movie/show
 */
function get_subtitles($imdb_id, $language = 'en') {
    $cache_file = SUBTITLE_CACHE_DIR . md5($imdb_id . $language) . '.json';
    
    // Check cache first
    if (file_exists($cache_file) && (time() - filemtime($cache_file)) < 3600) {
        return json_decode(file_get_contents($cache_file), true);
    }
    
    try {
        // Try OpenSubtitles API (you need to implement actual API calls)
        $subtitles = [
            [
                'language' => 'en',
                'name' => 'English',
                'url' => "subtitles.php?id={$imdb_id}&lang=en"
            ],
            [
                'language' => 'es',
                'name' => 'Spanish',
                'url' => "subtitles.php?id={$imdb_id}&lang=es"
            ],
            [
                'language' => 'fr',
                'name' => 'French',
                'url' => "subtitles.php?id={$imdb_id}&lang=fr"
            ]
        ];
        
        // Cache the result
        file_put_contents($cache_file, json_encode($subtitles));
        
        return $subtitles;
    } catch (Exception $e) {
        error_log("Error getting subtitles: " . $e->getMessage());
        return [];
    }
}

/**
 * Sanitize filename for downloads
 */
function sanitize_filename($filename) {
    $filename = preg_replace('/[^a-zA-Z0-9\-_\.]/', '_', $filename);
    $filename = preg_replace('/_{2,}/', '_', $filename);
    return trim($filename, '_');
}

/**
 * Log user activity
 */
function log_activity($action, $details = []) {
    $log_data = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'action' => $action,
        'details' => $details
    ];
    
    $log_file = __DIR__ . '/logs/activity.log';
    $log_dir = dirname($log_file);
    
    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    file_put_contents($log_file, json_encode($log_data) . "\n", FILE_APPEND | LOCK_EX);
}

/**
 * Rate limiting
 */
function check_rate_limit($action, $limit = 10, $window = 60) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $cache_key = md5($ip . $action);
    $cache_file = TEMP_DIR . $cache_key . '.tmp';
    
    $current_time = time();
    $requests = [];
    
    if (file_exists($cache_file)) {
        $requests = json_decode(file_get_contents($cache_file), true) ?: [];
    }
    
    // Remove old requests
    $requests = array_filter($requests, function($timestamp) use ($current_time, $window) {
        return ($current_time - $timestamp) < $window;
    });
    
    if (count($requests) >= $limit) {
        return false;
    }
    
    $requests[] = $current_time;
    file_put_contents($cache_file, json_encode($requests));
    
    return true;
}

/**
 * Generate secure download token
 */
function generate_download_token($data) {
    $secret = 'jmovie_pro_secret_key_2025';
    $timestamp = time();
    $payload = base64_encode(json_encode(array_merge($data, ['exp' => $timestamp + 3600])));
    $signature = hash_hmac('sha256', $payload, $secret);
    return $payload . '.' . $signature;
}

/**
 * Verify download token
 */
function verify_download_token($token) {
    $secret = 'jmovie_pro_secret_key_2025';
    $parts = explode('.', $token);
    
    if (count($parts) !== 2) {
        return false;
    }
    
    list($payload, $signature) = $parts;
    
    if (hash_hmac('sha256', $payload, $secret) !== $signature) {
        return false;
    }
    
    $data = json_decode(base64_decode($payload), true);
    
    if (!$data || $data['exp'] < time()) {
        return false;
    }
    
    return $data;
}

/**
 * Get video quality options
 */
function get_quality_options($video_url) {
    return [
        '1080p' => $video_url . '?quality=1080',
        '720p' => $video_url . '?quality=720',
        '480p' => $video_url . '?quality=480',
        '360p' => $video_url . '?quality=360'
    ];
}

/**
 * Format file size
 */
function format_file_size($bytes) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, 2) . ' ' . $units[$i];
}

/**
 * Check if user is authenticated (for premium features)
 */
function is_authenticated() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get user preferences
 */
function get_user_preferences() {
    $defaults = [
        'theme' => 'dark',
        'quality' => 'auto',
        'subtitles' => 'en',
        'autoplay' => true
    ];
    
    if (is_authenticated()) {
        // Get from database or session
        return array_merge($defaults, $_SESSION['preferences'] ?? []);
    }
    
    return $defaults;
}

/**
 * Clean old cache files
 */
function clean_cache() {
    $cache_dirs = [SUBTITLE_CACHE_DIR, TEMP_DIR];
    $max_age = 24 * 3600; // 24 hours
    
    foreach ($cache_dirs as $dir) {
        if (!is_dir($dir)) continue;
        
        $files = glob($dir . '*');
        foreach ($files as $file) {
            if (is_file($file) && (time() - filemtime($file)) > $max_age) {
                unlink($file);
            }
        }
    }
}

// Auto-clean cache on random requests (1% chance)
if (rand(1, 100) === 1) {
    clean_cache();
}
?>
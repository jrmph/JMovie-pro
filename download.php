<?php
// JMovie Pro Download Handler
// Made by Jhames Rhonnielle Martin

require_once 'config.php';
require_once 'functions.php';

header('Content-Type: application/json');

// Check rate limiting
if (!check_rate_limit('download', 5, 300)) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many download requests. Please wait.']);
    exit;
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'get_download_info':
        handle_get_download_info($input);
        break;
    
    case 'generate_download_link':
        handle_generate_download_link($input);
        break;
    
    case 'download':
        handle_download();
        break;
    
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

function handle_get_download_info($input) {
    $type = $input['type'] ?? '';
    $id = $input['id'] ?? '';
    $season = $input['season'] ?? null;
    $episode = $input['episode'] ?? null;
    
    if (!$type || !$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters']);
        return;
    }
    
    try {
        // Get video information from TMDB
        $tmdb_url = "https://api.themoviedb.org/3/{$type}/{$id}?api_key=" . TMDB_API_KEY;
        $video_info = get_json($tmdb_url);
        
        if (!$video_info) {
            throw new Exception('Video not found');
        }
        
        $title = $video_info['title'] ?? $video_info['name'] ?? 'Unknown';
        $year = substr($video_info['release_date'] ?? $video_info['first_air_date'] ?? '', 0, 4);
        
        // Generate filename
        $filename = sanitize_filename($title);
        if ($year) $filename .= "_({$year})";
        if ($season && $episode) $filename .= "_S{$season}E{$episode}";
        
        // Get quality options
        $base_url = get_video_download_url($type, $id, $season, $episode);
        $qualities = get_quality_options($base_url);
        
        // Get subtitles
        $imdb_id = $video_info['imdb_id'] ?? null;
        $subtitles = $imdb_id ? get_subtitles($imdb_id) : [];
        
        $response = [
            'success' => true,
            'title' => $title,
            'filename' => $filename,
            'qualities' => $qualities,
            'subtitles' => $subtitles,
            'poster' => $video_info['poster_path'] ? "https://image.tmdb.org/t/p/w500{$video_info['poster_path']}" : null,
            'overview' => $video_info['overview'] ?? '',
            'rating' => $video_info['vote_average'] ?? 0
        ];
        
        echo json_encode($response);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function handle_generate_download_link($input) {
    $type = $input['type'] ?? '';
    $id = $input['id'] ?? '';
    $quality = $input['quality'] ?? '720p';
    $season = $input['season'] ?? null;
    $episode = $input['episode'] ?? null;
    
    if (!$type || !$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters']);
        return;
    }
    
    try {
        // Generate secure download token
        $token_data = [
            'type' => $type,
            'id' => $id,
            'quality' => $quality,
            'season' => $season,
            'episode' => $episode
        ];
        
        $token = generate_download_token($token_data);
        $download_url = "download.php?action=download&token=" . urlencode($token);
        
        // Log download request
        log_activity('download_requested', $token_data);
        
        echo json_encode([
            'success' => true,
            'download_url' => $download_url,
            'expires_in' => 3600 // 1 hour
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function handle_download() {
    $token = $_GET['token'] ?? '';
    
    if (!$token) {
        http_response_code(400);
        die('Invalid download token');
    }
    
    $token_data = verify_download_token($token);
    if (!$token_data) {
        http_response_code(403);
        die('Invalid or expired download token');
    }
    
    try {
        // Get video URL based on token data
        $video_url = get_video_download_url(
            $token_data['type'],
            $token_data['id'],
            $token_data['season'],
            $token_data['episode']
        );
        
        if (!$video_url) {
            throw new Exception('Video source not available');
        }
        
        // Get video info for filename
        $tmdb_url = "https://api.themoviedb.org/3/{$token_data['type']}/{$token_data['id']}?api_key=" . TMDB_API_KEY;
        $video_info = get_json($tmdb_url);
        
        $title = $video_info['title'] ?? $video_info['name'] ?? 'video';
        $filename = sanitize_filename($title);
        if ($token_data['season'] && $token_data['episode']) {
            $filename .= "_S{$token_data['season']}E{$token_data['episode']}";
        }
        $filename .= "_{$token_data['quality']}.mp4";
        
        // Set headers for download
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
        
        // Log download start
        log_activity('download_started', $token_data);
        
        // Stream the video file
        stream_video_file($video_url);
        
    } catch (Exception $e) {
        http_response_code(500);
        die('Download failed: ' . $e->getMessage());
    }
}

function stream_video_file($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, DOWNLOAD_TIMEOUT);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    // Write directly to output
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) {
        echo $data;
        flush();
        return strlen($data);
    });
    
    $result = curl_exec($ch);
    
    if (curl_error($ch)) {
        throw new Exception('Download failed: ' . curl_error($ch));
    }
    
    curl_close($ch);
}
?>
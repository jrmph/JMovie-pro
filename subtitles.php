<?php
// JMovie Pro Subtitle Handler
// Made by Jhames Rhonnielle Martin

require_once 'config.php';
require_once 'functions.php';

$id = $_GET['id'] ?? '';
$lang = $_GET['lang'] ?? 'en';
$format = $_GET['format'] ?? 'srt';

if (!$id) {
    http_response_code(400);
    die('Missing subtitle ID');
}

// Check rate limiting
if (!check_rate_limit('subtitle', 20, 300)) {
    http_response_code(429);
    die('Too many subtitle requests. Please wait.');
}

try {
    $subtitle_content = get_subtitle_content($id, $lang, $format);
    
    if (!$subtitle_content) {
        http_response_code(404);
        die('Subtitles not found');
    }
    
    // Set appropriate headers
    header('Content-Type: text/plain; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . sanitize_filename($id) . '_' . $lang . '.' . $format . '"');
    header('Cache-Control: public, max-age=3600');
    
    // Log subtitle request
    log_activity('subtitle_downloaded', ['id' => $id, 'lang' => $lang, 'format' => $format]);
    
    echo $subtitle_content;
    
} catch (Exception $e) {
    http_response_code(500);
    die('Error loading subtitles: ' . $e->getMessage());
}

function get_subtitle_content($id, $lang, $format) {
    $cache_file = SUBTITLE_CACHE_DIR . md5($id . $lang . $format) . '.cache';
    
    // Check cache first
    if (file_exists($cache_file) && (time() - filemtime($cache_file)) < 3600) {
        return file_get_contents($cache_file);
    }
    
    // Generate sample subtitle content (in production, this would fetch from subtitle APIs)
    $subtitle_content = generate_sample_subtitles($id, $lang, $format);
    
    // Cache the result
    file_put_contents($cache_file, $subtitle_content);
    
    return $subtitle_content;
}

function generate_sample_subtitles($id, $lang, $format) {
    $language_names = [
        'en' => 'English',
        'es' => 'Spanish',
        'fr' => 'French',
        'de' => 'German',
        'it' => 'Italian',
        'pt' => 'Portuguese',
        'ru' => 'Russian',
        'ja' => 'Japanese',
        'ko' => 'Korean',
        'zh' => 'Chinese'
    ];
    
    $lang_name = $language_names[$lang] ?? 'Unknown';
    
    if ($format === 'srt') {
        return generate_srt_content($lang_name);
    } elseif ($format === 'vtt') {
        return generate_vtt_content($lang_name);
    } else {
        throw new Exception('Unsupported subtitle format');
    }
}

function generate_srt_content($lang_name) {
    return "1
00:00:01,000 --> 00:00:05,000
[$lang_name Subtitles]

2
00:00:05,500 --> 00:00:10,000
Welcome to JMovie Pro

3
00:00:10,500 --> 00:00:15,000
Premium streaming experience

4
00:00:15,500 --> 00:00:20,000
Enjoy your movie!

5
00:00:20,500 --> 00:00:25,000
Made by Jhames Rhonnielle Martin

";
}

function generate_vtt_content($lang_name) {
    return "WEBVTT

00:00:01.000 --> 00:00:05.000
[$lang_name Subtitles]

00:00:05.500 --> 00:00:10.000
Welcome to JMovie Pro

00:00:10.500 --> 00:00:15.000
Premium streaming experience

00:00:15.500 --> 00:00:20.000
Enjoy your movie!

00:00:20.500 --> 00:00:25.000
Made by Jhames Rhonnielle Martin

";
}

// API endpoint for getting available subtitles
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    $input = json_decode(file_get_contents('php://input'), true);
    $movie_id = $input['id'] ?? '';
    
    if (!$movie_id) {
        echo json_encode(['error' => 'Missing movie ID']);
        exit;
    }
    
    $available_subtitles = [
        ['code' => 'en', 'name' => 'English', 'url' => "subtitles.php?id={$movie_id}&lang=en"],
        ['code' => 'es', 'name' => 'Spanish', 'url' => "subtitles.php?id={$movie_id}&lang=es"],
        ['code' => 'fr', 'name' => 'French', 'url' => "subtitles.php?id={$movie_id}&lang=fr"],
        ['code' => 'de', 'name' => 'German', 'url' => "subtitles.php?id={$movie_id}&lang=de"],
        ['code' => 'it', 'name' => 'Italian', 'url' => "subtitles.php?id={$movie_id}&lang=it"],
        ['code' => 'pt', 'name' => 'Portuguese', 'url' => "subtitles.php?id={$movie_id}&lang=pt"],
        ['code' => 'ru', 'name' => 'Russian', 'url' => "subtitles.php?id={$movie_id}&lang=ru"],
        ['code' => 'ja', 'name' => 'Japanese', 'url' => "subtitles.php?id={$movie_id}&lang=ja"],
        ['code' => 'ko', 'name' => 'Korean', 'url' => "subtitles.php?id={$movie_id}&lang=ko"],
        ['code' => 'zh', 'name' => 'Chinese', 'url' => "subtitles.php?id={$movie_id}&lang=zh"]
    ];
    
    echo json_encode(['subtitles' => $available_subtitles]);
}
?>
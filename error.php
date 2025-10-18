<?php
// JMovie Pro - Error Page Handler
// Made by Jhames Rhonnielle Martin

require_once 'config.php';

$error_code = $_GET['code'] ?? '404';
$error_messages = [
    '400' => [
        'title' => 'Bad Request',
        'message' => 'The request could not be understood by the server.',
        'icon' => 'bx-error'
    ],
    '401' => [
        'title' => 'Unauthorized',
        'message' => 'You need to sign in to access this resource.',
        'icon' => 'bx-lock'
    ],
    '403' => [
        'title' => 'Forbidden',
        'message' => 'You don\'t have permission to access this resource.',
        'icon' => 'bx-shield-x'
    ],
    '404' => [
        'title' => 'Page Not Found',
        'message' => 'The page you\'re looking for doesn\'t exist.',
        'icon' => 'bx-search-alt'
    ],
    '500' => [
        'title' => 'Internal Server Error',
        'message' => 'Something went wrong on our end. Please try again later.',
        'icon' => 'bx-error-circle'
    ],
    '503' => [
        'title' => 'Service Unavailable',
        'message' => 'The service is temporarily unavailable. Please try again later.',
        'icon' => 'bx-time'
    ]
];

$error = $error_messages[$error_code] ?? $error_messages['404'];

http_response_code((int)$error_code);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $error['title']; ?> - <?php echo APP_NAME; ?></title>
    
    <link rel="icon" type="image/x-icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNlNTA5MTQiLz4KPHBhdGggZD0iTTEyIDEwTDIyIDE2TDEyIDIyVjEwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==">
    
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
    <link rel="stylesheet" href="assets/css/style.css">
    
    <style>
        .error-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl);
            background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
        }
        
        .error-content {
            text-align: center;
            max-width: 600px;
            padding: var(--spacing-2xl);
            background: var(--bg-card);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-xl);
            border: 1px solid var(--border-primary);
        }
        
        .error-icon {
            font-size: 6rem;
            color: var(--primary-red);
            margin-bottom: var(--spacing-lg);
            display: block;
        }
        
        .error-code {
            font-size: var(--font-size-5xl);
            font-weight: 800;
            color: var(--primary-red);
            margin-bottom: var(--spacing-md);
            font-family: var(--font-family-secondary);
        }
        
        .error-title {
            font-size: var(--font-size-2xl);
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: var(--spacing-md);
        }
        
        .error-message {
            font-size: var(--font-size-lg);
            color: var(--text-secondary);
            margin-bottom: var(--spacing-2xl);
            line-height: 1.6;
        }
        
        .error-actions {
            display: flex;
            gap: var(--spacing-md);
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .error-suggestions {
            margin-top: var(--spacing-xl);
            padding-top: var(--spacing-xl);
            border-top: 1px solid var(--border-primary);
        }
        
        .suggestions-title {
            font-size: var(--font-size-lg);
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: var(--spacing-md);
        }
        
        .suggestions-list {
            list-style: none;
            text-align: left;
            display: inline-block;
        }
        
        .suggestions-list li {
            color: var(--text-secondary);
            margin-bottom: var(--spacing-sm);
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
        }
        
        .suggestions-list i {
            color: var(--primary-red);
            font-size: var(--font-size-sm);
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-content">
            <i class='bx <?php echo $error['icon']; ?> error-icon'></i>
            <div class="error-code"><?php echo $error_code; ?></div>
            <h1 class="error-title"><?php echo $error['title']; ?></h1>
            <p class="error-message"><?php echo $error['message']; ?></p>
            
            <div class="error-actions">
                <a href="/" class="btn btn-primary">
                    <i class='bx bx-home'></i>
                    Go Home
                </a>
                <button class="btn btn-secondary" onclick="history.back()">
                    <i class='bx bx-arrow-back'></i>
                    Go Back
                </button>
                <button class="btn btn-secondary" onclick="location.reload()">
                    <i class='bx bx-refresh'></i>
                    Refresh
                </button>
            </div>
            
            <?php if ($error_code === '404'): ?>
            <div class="error-suggestions">
                <h3 class="suggestions-title">What you can do:</h3>
                <ul class="suggestions-list">
                    <li><i class='bx bx-check'></i> Check the URL for typos</li>
                    <li><i class='bx bx-check'></i> Use the search function</li>
                    <li><i class='bx bx-check'></i> Browse our categories</li>
                    <li><i class='bx bx-check'></i> Visit our homepage</li>
                </ul>
            </div>
            <?php endif; ?>
            
            <?php if ($error_code === '500'): ?>
            <div class="error-suggestions">
                <h3 class="suggestions-title">What happened:</h3>
                <ul class="suggestions-list">
                    <li><i class='bx bx-info-circle'></i> Our servers are experiencing issues</li>
                    <li><i class='bx bx-info-circle'></i> We've been notified and are working on it</li>
                    <li><i class='bx bx-info-circle'></i> Please try again in a few minutes</li>
                </ul>
            </div>
            <?php endif; ?>
            
            <div style="margin-top: var(--spacing-xl); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-primary);">
                <div style="display: flex; align-items: center; justify-content: center; gap: var(--spacing-sm); color: var(--text-muted); font-size: var(--font-size-sm);">
                    <i class='bx bx-movie-play' style="color: var(--primary-red);"></i>
                    <span><?php echo APP_NAME; ?> - Made by <?php echo APP_AUTHOR; ?></span>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-redirect to home after 30 seconds for 404 errors
        <?php if ($error_code === '404'): ?>
        setTimeout(() => {
            if (confirm('Would you like to be redirected to the homepage?')) {
                window.location.href = '/';
            }
        }, 30000);
        <?php endif; ?>
        
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            const errorIcon = document.querySelector('.error-icon');
            
            setInterval(() => {
                errorIcon.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    errorIcon.style.transform = 'scale(1)';
                }, 200);
            }, 3000);
        });
    </script>
</body>
</html>
<?php
// JMovie Pro - Modal Components
// Made by Jhames Rhonnielle Martin
?>

<!-- Player Modal (dynamically created) -->

<!-- Details Modal (dynamically created) -->

<!-- Download Modal (dynamically created) -->

<!-- Subtitle Modal (dynamically created) -->

<!-- Profile Modal (dynamically created) -->

<!-- Settings Modal (dynamically created) -->

<!-- About Modal (dynamically created) -->

<!-- View All Modal (dynamically created) -->

<!-- Error Modal -->
<div id="errorModal" class="modal">
    <div class="modal-content" style="max-width: 450px; padding: var(--spacing-2xl);">
        <button class="modal-close" onclick="closeErrorModal()">
            <i class='bx bx-x'></i>
        </button>
        <div style="text-align: center;">
            <i class='bx bx-error' style="font-size: var(--font-size-4xl); color: var(--text-error); margin-bottom: var(--spacing-md); display: block;"></i>
            <h2 id="errorTitle" style="font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--spacing-sm); color: var(--text-error);">Error</h2>
            <p id="errorMessage" style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">Something went wrong. Please try again.</p>
            <button class="btn btn-primary" onclick="closeErrorModal()">
                <i class='bx bx-check'></i>
                OK
            </button>
        </div>
    </div>
</div>

<!-- Confirmation Modal -->
<div id="confirmModal" class="modal">
    <div class="modal-content" style="max-width: 450px; padding: var(--spacing-2xl);">
        <button class="modal-close" onclick="closeConfirmModal()">
            <i class='bx bx-x'></i>
        </button>
        <div style="text-align: center;">
            <i class='bx bx-question-mark' style="font-size: var(--font-size-4xl); color: var(--accent-orange); margin-bottom: var(--spacing-md); display: block;"></i>
            <h2 id="confirmTitle" style="font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--spacing-sm);">Confirm Action</h2>
            <p id="confirmMessage" style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">Are you sure you want to continue?</p>
            <div style="display: flex; gap: var(--spacing-md); justify-content: center;">
                <button class="btn btn-secondary" onclick="closeConfirmModal()">
                    <i class='bx bx-x'></i>
                    Cancel
                </button>
                <button class="btn btn-primary" id="confirmButton" onclick="confirmAction()">
                    <i class='bx bx-check'></i>
                    Confirm
                </button>
            </div>
        </div>
    </div>
</div>

<script>
// Modal helper functions
function showErrorModal(title, message) {
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').classList.add('visible');
    document.body.classList.add('no-scroll');
}

function closeErrorModal() {
    document.getElementById('errorModal').classList.remove('visible');
    document.body.classList.remove('no-scroll');
}

function showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').classList.add('visible');
    document.body.classList.add('no-scroll');
    
    window.confirmCallback = callback;
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('visible');
    document.body.classList.remove('no-scroll');
    window.confirmCallback = null;
}

function confirmAction() {
    if (window.confirmCallback) {
        window.confirmCallback();
    }
    closeConfirmModal();
}

// Make functions globally available
window.showErrorModal = showErrorModal;
window.closeErrorModal = closeErrorModal;
window.showConfirmModal = showConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.confirmAction = confirmAction;
</script>
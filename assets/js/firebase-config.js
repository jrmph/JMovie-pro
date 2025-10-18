// JMovie Pro - Firebase Configuration
// Made by Jhames Rhonnielle Martin

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase Configuration Template
// Replace the placeholder values below with your own Firebase project credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Global auth state
window.isUserSignedIn = false;
window.currentUser = null;
window.auth = auth;

// Sign in with Google
window.signInWithGoogle = async function() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        window.isUserSignedIn = true;
        window.currentUser = user;
        
        if (typeof addNotification === 'function') {
            addNotification("Welcome back! Successfully signed in.", 'success');
        }
        
        if (typeof closeAuthModal === 'function') {
            closeAuthModal();
        }
        
        updateUIForUser(user);
        showUserContent();
    } catch (error) {
        console.error("Sign in error:", error);
        
        if (typeof addNotification === 'function') {
            addNotification("Sign in failed. Please try again.", 'error');
        }
    }
};

// Sign out user
window.signOutUser = async function() {
    try {
        await signOut(auth);
        window.isUserSignedIn = false;
        window.currentUser = null;
        
        if (typeof addNotification === 'function') {
            addNotification("Successfully signed out!", 'success');
        }
        
        updateUIForUser(null);
        hideUserContent();
    } catch (error) {
        console.error("Sign out error:", error);
        
        if (typeof addNotification === 'function') {
            addNotification("Sign out failed. Please try again.", 'error');
        }
    }
};

// Auth state listener
onAuthStateChanged(auth, (user) => {
    window.isUserSignedIn = !!user;
    window.currentUser = user;
    updateUIForUser(user);
    
    if (user) {
        showUserContent();
    } else {
        hideUserContent();
    }
});

// Update UI based on user state
function updateUIForUser(user) {
    const userIcon = document.getElementById('userIcon');
    const watchlistBadge = document.getElementById('watchlistBadge');
    
    if (user) {
        if (user.photoURL) {
            userIcon.outerHTML = `<img src="${user.photoURL}" alt="${user.displayName || 'User'}" class="user-avatar" id="userIcon">`;
        } else {
            userIcon.className = 'bx bx-user-check';
        }
        
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        watchlistBadge.textContent = watchlist.length;
        watchlistBadge.style.display = watchlist.length > 0 ? 'flex' : 'none';
    } else {
        const currentIcon = document.getElementById('userIcon');
        if (currentIcon && currentIcon.tagName !== 'I') {
            currentIcon.outerHTML = '<i class="bx bx-user" id="userIcon"></i>';
        }
        if (watchlistBadge) {
            watchlistBadge.style.display = 'none';
        }
    }
}

// Show user-specific content
function showUserContent() {
    const watchlistSection = document.getElementById('watchlistSection');
    if (watchlistSection) {
        watchlistSection.style.display = 'block';
    }
}

// Hide user-specific content
function hideUserContent() {
    const watchlistSection = document.getElementById('watchlistSection');
    if (watchlistSection) {
        watchlistSection.style.display = 'none';
    }
}

// Initialize auth state check
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already signed in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            window.isUserSignedIn = true;
            window.currentUser = user;
            updateUIForUser(user);
            showUserContent();
        } else {
            window.isUserSignedIn = false;
            window.currentUser = null;
            updateUIForUser(null);
            hideUserContent();
        }
        
        // Unsubscribe after initial check
        unsubscribe();
    });
});
/**
 * HOUSE PRICE PREDICTION - MAIN JAVASCRIPT
 * Pure Vanilla JavaScript: Slider, Theme Persistence, Mobile Nav, Toast Notifications
 */

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initMobileNav();
    initImageSlider();
    initProfileModal();
});

/* =========================================================
   1. THEME TOGGLE & PERSISTENCE
   ========================================================= */
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Load saved preference from localStorage
    const savedTheme = localStorage.getItem('site-theme');
    if (savedTheme === 'dark') {
        themeToggle.checked = true;
    } else if (savedTheme === 'light') {
        themeToggle.checked = false;
    } else {
        // Match system preference if user hasn't chosen yet
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            themeToggle.checked = true;
        }
    }

    // Save preference upon toggle
    themeToggle.addEventListener('change', () => {
        localStorage.setItem('site-theme', themeToggle.checked ? 'dark' : 'light');
    });
}

/* =========================================================
   2. MOBILE NAVIGATION
   ========================================================= */
function initMobileNav() {
    const navCheckbox = document.getElementById('nav-toggle');
    const navLinks = document.querySelectorAll('.nav-links a');

    if (!navCheckbox) return;

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navCheckbox.checked) {
                navCheckbox.checked = false;
            }
        });
    });
}

/* =========================================================
   3. HOME PAGE INTERACTIVE IMAGE SLIDER
   ========================================================= */
function initImageSlider() {
    const slider = document.querySelector('.slider-container');
    if (!slider) return;

    const wrapper = slider.querySelector('.slider-wrapper');
    const slides = slider.querySelectorAll('.slider-slide');
    const prevBtn = slider.querySelector('.slider-btn.prev');
    const nextBtn = slider.querySelector('.slider-btn.next');
    const dotsContainer = slider.querySelector('.slider-dots');
    const progressBar = slider.querySelector('.slider-progress');

    if (!wrapper || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoPlayTimer = null;
    let progressInterval = null;
    const slideDuration = 5000; // 5 seconds per slide
    let progressStartTime = 0;

    // Create dot indicators dynamically if not already present
    if (dotsContainer && dotsContainer.children.length === 0) {
        slides.forEach((_, idx) => {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
            dot.addEventListener('click', () => {
                goToSlide(idx);
                restartAutoPlay();
            });
            dotsContainer.appendChild(dot);
        });
    }

    const dots = dotsContainer ? dotsContainer.querySelectorAll('.slider-dot') : [];

    function updateSlider() {
        wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;

        // Update dots
        dots.forEach((dot, idx) => {
            if (idx === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function goToSlide(index) {
        currentIndex = (index + totalSlides) % totalSlides;
        updateSlider();
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    // Controls
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            restartAutoPlay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            restartAutoPlay();
        });
    }

    // Keyboard support
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            nextSlide();
            restartAutoPlay();
        } else if (e.key === 'ArrowLeft') {
            prevSlide();
            restartAutoPlay();
        }
    });

    // Touch swipe gesture support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoPlay();
    }, { passive: true });

    function handleSwipe() {
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 45) {
            if (diff < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }

    // Autoplay & progress
    function startAutoPlay() {
        stopAutoPlay();
        progressStartTime = Date.now();

        if (progressBar) {
            progressBar.style.width = '0%';
            progressInterval = setInterval(() => {
                const elapsed = Date.now() - progressStartTime;
                const percent = Math.min((elapsed / slideDuration) * 100, 100);
                progressBar.style.width = `${percent}%`;
            }, 50);
        }

        autoPlayTimer = setTimeout(() => {
            nextSlide();
            startAutoPlay();
        }, slideDuration);
    }

    function stopAutoPlay() {
        if (autoPlayTimer) clearTimeout(autoPlayTimer);
        if (progressInterval) clearInterval(progressInterval);
        if (progressBar) progressBar.style.width = '0%';
    }

    function restartAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }

    // Pause on hover
    slider.addEventListener('mouseenter', stopAutoPlay);
    slider.addEventListener('mouseleave', startAutoPlay);

    // Initialize
    updateSlider();
    startAutoPlay();
}

/* =========================================================
   4. TOAST NOTIFICATION SYSTEM
   ========================================================= */
window.showToast = function (message, type = 'success', title = '') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    let defaultTitle = 'Notification';
    if (type === 'success') {
        icon = '✅';
        defaultTitle = 'Success';
    } else if (type === 'error') {
        icon = '❌';
        defaultTitle = 'Error';
    } else if (type === 'info') {
        icon = '🔔';
        defaultTitle = 'Info';
    }

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title || defaultTitle}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
        toast.classList.add('toast-hiding');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    };

    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 4500);
};

/* =========================================================
   5. PROFILE EDIT MODAL
   ========================================================= */
function initProfileModal() {
    const editBtn = document.querySelector('.btn-edit-profile');
    const modal = document.getElementById('profile-modal');
    if (!editBtn || !modal) return;

    const closeBtns = modal.querySelectorAll('.modal-close, .modal-cancel');

    editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('active');
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

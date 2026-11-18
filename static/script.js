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
/**
 * HOUSE PRICE PREDICTION - FORM VALIDATION ENGINE
 * Pure Vanilla JavaScript Client-Side Form Validation for all project forms
 */

document.addEventListener('DOMContentLoaded', () => {
    initLoginForm();
    initSignupForm();
    initForgotPasswordForm();
    initPredictionForms();
    initContactForm();
    initFeedbackForm();
    initProfileEditForm();
});

/* =========================================================
   CORE VALIDATION UTILITIES
   ========================================================= */

function isValidEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).trim());
}

function isValidPhone(phone) {
    // Allows optional +, dashes, spaces, brackets, 10 to 15 digits
    const cleaned = String(phone).replace(/[\s\-()]/g, '');
    const re = /^\+?[0-9]{10,15}$/;
    return re.test(cleaned);
}

function setError(input, message) {
    const group = input.closest('.input-group') || input.parentElement;
    if (!group) return;

    group.classList.remove('has-success');
    group.classList.add('has-error');

    let errorEl = group.querySelector('.field-error');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        group.appendChild(errorEl);
    }
    errorEl.innerHTML = `⚠️ ${message}`;

    input.setAttribute('aria-invalid', 'true');
}

function setSuccess(input) {
    const group = input.closest('.input-group') || input.parentElement;
    if (!group) return;

    group.classList.remove('has-error');
    group.classList.add('has-success');

    const errorEl = group.querySelector('.field-error');
    if (errorEl) {
        errorEl.textContent = '';
    }

    input.removeAttribute('aria-invalid');
}

function clearStatus(input) {
    const group = input.closest('.input-group') || input.parentElement;
    if (!group) return;

    group.classList.remove('has-error', 'has-success');
    const errorEl = group.querySelector('.field-error');
    if (errorEl) errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
}

/* =========================================================
   1. LOGIN FORM VALIDATION
   ========================================================= */
function initLoginForm() {
    const form = document.querySelector('.auth-card form[action*="home.html"]');
    if (!form || !document.getElementById('login-email')) return;

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    // Real-time validation
    emailInput.addEventListener('blur', () => validateLoginEmail());
    emailInput.addEventListener('input', () => {
        if (emailInput.closest('.input-group').classList.contains('has-error')) {
            validateLoginEmail();
        }
    });

    passwordInput.addEventListener('blur', () => validateLoginPassword());
    passwordInput.addEventListener('input', () => {
        if (passwordInput.closest('.input-group').classList.contains('has-error')) {
            validateLoginPassword();
        }
    });

    function validateLoginEmail() {
        const val = emailInput.value.trim();
        if (!val) {
            setError(emailInput, 'Email address is required.');
            return false;
        }
        if (!isValidEmail(val)) {
            setError(emailInput, 'Please enter a valid email address (e.g. name@example.com).');
            return false;
        }
        setSuccess(emailInput);
        return true;
    }

    function validateLoginPassword() {
        const val = passwordInput.value;
        if (!val) {
            setError(passwordInput, 'Password is required.');
            return false;
        }
        if (val.length < 8) {
            setError(passwordInput, 'Password must be at least 8 characters long.');
            return false;
        }
        setSuccess(passwordInput);
        return true;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const isEmailValid = validateLoginEmail();
        const isPasswordValid = validateLoginPassword();

        if (!isEmailValid || !isPasswordValid) {
            if (window.showToast) window.showToast('Please fix the errors before logging in.', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const origText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        if (window.showToast) window.showToast('Welcome back! Logging you in...', 'success');

        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1200);
    });
}

/* =========================================================
   2. SIGNUP FORM VALIDATION & PASSWORD STRENGTH
   ========================================================= */
function initSignupForm() {
    const form = document.querySelector('.auth-card form[action*="login.html"]');
    if (!form || !document.getElementById('su-name')) return;

    const nameInput = document.getElementById('su-name');
    const emailInput = document.getElementById('su-email');
    const phoneInput = document.getElementById('su-phone');
    const passwordInput = document.getElementById('su-password');
    const confirmInput = document.getElementById('su-confirm');
    const termsCheckbox = form.querySelector('input[type="checkbox"]');

    // Build Password Strength Meter DOM element if not present
    let strengthWrap = form.querySelector('.password-strength-wrap');
    if (!strengthWrap && passwordInput) {
        strengthWrap = document.createElement('div');
        strengthWrap.className = 'password-strength-wrap';
        strengthWrap.innerHTML = `
            <div class="password-strength-bars">
                <div class="password-strength-bar"></div>
                <div class="password-strength-bar"></div>
                <div class="password-strength-bar"></div>
            </div>
            <div class="password-strength-text">Password strength: None</div>
        `;
        passwordInput.parentElement.appendChild(strengthWrap);
    }

    // Requirements list items
    const reqList = form.querySelector('.password-requirements');
    const reqItems = reqList ? reqList.querySelectorAll('li') : [];

    // Real-time validation
    nameInput.addEventListener('blur', validateName);
    nameInput.addEventListener('input', () => {
        if (nameInput.closest('.input-group').classList.contains('has-error')) validateName();
    });

    emailInput.addEventListener('blur', validateEmail);
    emailInput.addEventListener('input', () => {
        if (emailInput.closest('.input-group').classList.contains('has-error')) validateEmail();
    });

    phoneInput.addEventListener('blur', validatePhone);
    phoneInput.addEventListener('input', () => {
        if (phoneInput.closest('.input-group').classList.contains('has-error')) validatePhone();
    });

    passwordInput.addEventListener('input', () => {
        updatePasswordStrength();
        validatePassword();
        if (confirmInput.value) validateConfirmPassword();
    });

    confirmInput.addEventListener('input', validateConfirmPassword);
    confirmInput.addEventListener('blur', validateConfirmPassword);

    function validateName() {
        const val = nameInput.value.trim();
        if (!val) {
            setError(nameInput, 'Full name is required.');
            return false;
        }
        if (val.length < 2) {
            setError(nameInput, 'Full name must have at least 2 characters.');
            return false;
        }
        if (!/^[a-zA-Z\s.'-]+$/.test(val)) {
            setError(nameInput, 'Name should contain letters and spaces only.');
            return false;
        }
        setSuccess(nameInput);
        return true;
    }

    function validateEmail() {
        const val = emailInput.value.trim();
        if (!val) {
            setError(emailInput, 'Email address is required.');
            return false;
        }
        if (!isValidEmail(val)) {
            setError(emailInput, 'Please enter a valid email address.');
            return false;
        }
        setSuccess(emailInput);
        return true;
    }

    function validatePhone() {
        const val = phoneInput.value.trim();
        if (!val) {
            setError(phoneInput, 'Phone number is required.');
            return false;
        }
        if (!isValidPhone(val)) {
            setError(phoneInput, 'Enter a valid phone number with 10-15 digits.');
            return false;
        }
        setSuccess(phoneInput);
        return true;
    }

    function updatePasswordStrength() {
        const val = passwordInput.value;
        if (!strengthWrap) return;

        if (!val) {
            strengthWrap.classList.remove('active', 'strength-weak', 'strength-medium', 'strength-strong');
            return;
        }

        strengthWrap.classList.add('active');

        const hasMinLen = val.length >= 8;
        const hasUpper = /[A-Z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSpecial = /[^A-Za-z0-9]/.test(val);

        // Update list items
        if (reqItems.length >= 3) {
            reqItems[0].classList.toggle('valid', hasMinLen);
            reqItems[1].classList.toggle('valid', hasUpper);
            reqItems[2].classList.toggle('valid', hasNumber);
        }

        let score = 0;
        if (hasMinLen) score++;
        if (hasUpper) score++;
        if (hasNumber) score++;
        if (hasSpecial && val.length >= 10) score++;

        strengthWrap.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
        const textEl = strengthWrap.querySelector('.password-strength-text');

        if (score <= 1) {
            strengthWrap.classList.add('strength-weak');
            if (textEl) textEl.textContent = 'Password strength: Weak';
        } else if (score === 2) {
            strengthWrap.classList.add('strength-medium');
            if (textEl) textEl.textContent = 'Password strength: Medium';
        } else {
            strengthWrap.classList.add('strength-strong');
            if (textEl) textEl.textContent = 'Password strength: Strong 💪';
        }
    }

    function validatePassword() {
        const val = passwordInput.value;
        if (!val) {
            setError(passwordInput, 'Password is required.');
            return false;
        }
        if (val.length < 8) {
            setError(passwordInput, 'Password must be at least 8 characters long.');
            return false;
        }
        if (!/[A-Z]/.test(val)) {
            setError(passwordInput, 'Password must contain at least one uppercase letter.');
            return false;
        }
        if (!/[0-9]/.test(val)) {
            setError(passwordInput, 'Password must contain at least one number.');
            return false;
        }
        setSuccess(passwordInput);
        return true;
    }

    function validateConfirmPassword() {
        const val = confirmInput.value;
        const passVal = passwordInput.value;
        if (!val) {
            setError(confirmInput, 'Please confirm your password.');
            return false;
        }
        if (val !== passVal) {
            setError(confirmInput, 'Passwords do not match.');
            return false;
        }
        setSuccess(confirmInput);
        return true;
    }

    function validateTerms() {
        if (!termsCheckbox) return true;
        const parent = termsCheckbox.closest('.checkbox-row') || termsCheckbox.parentElement;
        if (!termsCheckbox.checked) {
            if (parent) parent.classList.add('has-error');
            return false;
        }
        if (parent) parent.classList.remove('has-error');
        return true;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const vName = validateName();
        const vEmail = validateEmail();
        const vPhone = validatePhone();
        const vPass = validatePassword();
        const vConf = validateConfirmPassword();
        const vTerms = validateTerms();

        if (!vName || !vEmail || !vPhone || !vPass || !vConf) {
            if (window.showToast) window.showToast('Please correct the highlighted fields.', 'error');
            return;
        }

        if (!vTerms) {
            if (window.showToast) window.showToast('You must agree to the Terms & Privacy Policy.', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        if (window.showToast) window.showToast('Account created successfully! Redirecting to login...', 'success');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    });
}

/* =========================================================
   3. FORGOT PASSWORD FORM VALIDATION
   ========================================================= */
function initForgotPasswordForm() {
    const form = document.querySelector('.auth-card form[action*="login.html"]');
    const emailInput = document.getElementById('fp-email');
    if (!form || !emailInput) return;

    emailInput.addEventListener('blur', validateFpEmail);
    emailInput.addEventListener('input', () => {
        if (emailInput.closest('.input-group').classList.contains('has-error')) validateFpEmail();
    });

    function validateFpEmail() {
        const val = emailInput.value.trim();
        if (!val) {
            setError(emailInput, 'Email address is required.');
            return false;
        }
        if (!isValidEmail(val)) {
            setError(emailInput, 'Please enter a valid email address.');
            return false;
        }
        setSuccess(emailInput);
        return true;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateFpEmail()) return;

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Sending reset link...';

        if (window.showToast) {
            window.showToast('Password reset link sent! Check your email inbox.', 'success');
        }

        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Link Sent ✓';
            form.reset();
            clearStatus(emailInput);
        }, 1200);
    });
}

/* =========================================================
   4. PREDICTION FORM VALIDATION (Home & Predict Pages)
   ========================================================= */
function initPredictionForms() {
    const forms = document.querySelectorAll('form.predict-form-card, form#predict-form');
    forms.forEach(form => {
        const medInc = form.querySelector('#MedInc');
        const houseAge = form.querySelector('#HouseAge');
        const aveRooms = form.querySelector('#AveRooms');
        const aveBedrms = form.querySelector('#AveBedrms');
        const population = form.querySelector('#Population');
        const aveOccup = form.querySelector('#AveOccup');
        const latitude = form.querySelector('#Latitude');
        const longitude = form.querySelector('#Longitude');
        const oceanProx = form.querySelector('#OceanProximity');

        if (!medInc) return;

        // Validation helpers
        function validateNumber(input, min, max, label) {
            const val = parseFloat(input.value);
            if (isNaN(val) || input.value.trim() === '') {
                setError(input, `${label} is required.`);
                return false;
            }
            if (min !== undefined && val < min) {
                setError(input, `${label} must be at least ${min}.`);
                return false;
            }
            if (max !== undefined && val > max) {
                setError(input, `${label} cannot exceed ${max}.`);
                return false;
            }
            setSuccess(input);
            return true;
        }

        function validateBedrooms() {
            const rooms = parseFloat(aveRooms.value);
            const bedrms = parseFloat(aveBedrms.value);
            if (isNaN(bedrms) || aveBedrms.value.trim() === '') {
                setError(aveBedrms, 'Average bedrooms is required.');
                return false;
            }
            if (bedrms <= 0) {
                setError(aveBedrms, 'Average bedrooms must be greater than 0.');
                return false;
            }
            if (!isNaN(rooms) && bedrms > rooms) {
                setError(aveBedrms, 'Bedrooms cannot exceed total rooms.');
                return false;
            }
            setSuccess(aveBedrms);
            return true;
        }

        function validateSelect(select, label) {
            if (!select.value) {
                setError(select, `Please select an ${label}.`);
                return false;
            }
            setSuccess(select);
            return true;
        }

        // Event listeners for instant feedback
        medInc.addEventListener('blur', () => validateNumber(medInc, 0.1, 20, 'Median Income'));
        houseAge.addEventListener('blur', () => validateNumber(houseAge, 1, 100, 'House Age'));
        aveRooms.addEventListener('blur', () => validateNumber(aveRooms, 0.5, 50, 'Average Rooms'));
        aveBedrms.addEventListener('blur', validateBedrooms);
        population.addEventListener('blur', () => validateNumber(population, 1, 50000, 'Population'));
        aveOccup.addEventListener('blur', () => validateNumber(aveOccup, 0.5, 30, 'Average Occupancy'));
        latitude.addEventListener('blur', () => validateNumber(latitude, 32.0, 43.0, 'Latitude (32 to 43)'));
        longitude.addEventListener('blur', () => validateNumber(longitude, -125.0, -114.0, 'Longitude (-125 to -114)'));
        if (oceanProx) oceanProx.addEventListener('change', () => validateSelect(oceanProx, 'Ocean Proximity'));

        form.addEventListener('submit', (e) => {
            const v1 = validateNumber(medInc, 0.1, 20, 'Median Income');
            const v2 = validateNumber(houseAge, 1, 100, 'House Age');
            const v3 = validateNumber(aveRooms, 0.5, 50, 'Average Rooms');
            const v4 = validateBedrooms();
            const v5 = validateNumber(population, 1, 50000, 'Population');
            const v6 = validateNumber(aveOccup, 0.5, 30, 'Average Occupancy');
            const v7 = validateNumber(latitude, 32.0, 43.0, 'Latitude (32 to 43)');
            const v8 = validateNumber(longitude, -125.0, -114.0, 'Longitude (-125 to -114)');
            const v9 = oceanProx ? validateSelect(oceanProx, 'Ocean Proximity') : true;

            if (!v1 || !v2 || !v3 || !v4 || !v5 || !v6 || !v7 || !v8 || !v9) {
                e.preventDefault();
                if (window.showToast) {
                    window.showToast('Please fix the invalid values in the prediction form.', 'error');
                }
                // Scroll first invalid input into view
                const firstError = form.querySelector('.input-group.has-error input, .input-group.has-error select');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
                return;
            }

            // If action is prediction.html, calculate dynamic estimate and forward params
            const isHomePage = window.location.pathname.includes('home.html') || window.location.pathname.endsWith('/');
            if (isHomePage) {
                // Allow standard navigation or save values in sessionStorage for prediction.html
                const predictionData = {
                    medInc: medInc.value,
                    houseAge: houseAge.value,
                    aveRooms: aveRooms.value,
                    aveBedrms: aveBedrms.value,
                    population: population.value,
                    aveOccup: aveOccup.value,
                    latitude: latitude.value,
                    longitude: longitude.value,
                    oceanProx: oceanProx ? oceanProx.value : 'NEAR BAY'
                };
                sessionStorage.setItem('lastPrediction', JSON.stringify(predictionData));
            }
        });

        // Reset button handler to clear errors
        form.addEventListener('reset', () => {
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => clearStatus(input));
        });
    });
}

/* =========================================================
   5. CONTACT FORM VALIDATION
   ========================================================= */
function initContactForm() {
    const form = document.querySelector('.contact-form-card');
    const nameInput = document.getElementById('c-name');
    const emailInput = document.getElementById('c-email');
    const msgInput = document.getElementById('c-message');

    if (!form || !nameInput || !emailInput || !msgInput) return;

    nameInput.addEventListener('blur', validateContactName);
    emailInput.addEventListener('blur', validateContactEmail);
    msgInput.addEventListener('blur', validateContactMessage);

    function validateContactName() {
        const val = nameInput.value.trim();
        if (!val) {
            setError(nameInput, 'Name is required.');
            return false;
        }
        if (val.length < 2) {
            setError(nameInput, 'Name must be at least 2 characters.');
            return false;
        }
        setSuccess(nameInput);
        return true;
    }

    function validateContactEmail() {
        const val = emailInput.value.trim();
        if (!val) {
            setError(emailInput, 'Email address is required.');
            return false;
        }
        if (!isValidEmail(val)) {
            setError(emailInput, 'Please enter a valid email address.');
            return false;
        }
        setSuccess(emailInput);
        return true;
    }

    function validateContactMessage() {
        const val = msgInput.value.trim();
        if (!val) {
            setError(msgInput, 'Message is required.');
            return false;
        }
        if (val.length < 10) {
            setError(msgInput, 'Message must be at least 10 characters long.');
            return false;
        }
        setSuccess(msgInput);
        return true;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const vName = validateContactName();
        const vEmail = validateContactEmail();
        const vMsg = validateContactMessage();

        if (!vName || !vEmail || !vMsg) {
            if (window.showToast) window.showToast('Please complete all required fields.', 'error');
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Sending...';

        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Send Message';
            form.reset();
            [nameInput, emailInput, msgInput].forEach(inp => clearStatus(inp));

            if (window.showToast) {
                window.showToast('Thank you! Your message has been sent successfully.', 'success', 'Message Sent');
            }
        }, 1000);
    });
}

/* =========================================================
   6. FEEDBACK FORM VALIDATION
   ========================================================= */
function initFeedbackForm() {
    const form = document.querySelector('.feedback-layout form');
    const nameInput = document.getElementById('fb-name');
    const emailInput = document.getElementById('fb-email');
    const msgInput = document.getElementById('fb-message');

    if (!form || !nameInput || !emailInput || !msgInput) return;

    nameInput.addEventListener('blur', () => {
        const val = nameInput.value.trim();
        if (!val) setError(nameInput, 'Full name is required.');
        else setSuccess(nameInput);
    });

    emailInput.addEventListener('blur', () => {
        const val = emailInput.value.trim();
        if (!val || !isValidEmail(val)) setError(emailInput, 'Valid email is required.');
        else setSuccess(emailInput);
    });

    msgInput.addEventListener('blur', () => {
        const val = msgInput.value.trim();
        if (!val || val.length < 10) setError(msgInput, 'Feedback message must be at least 10 characters.');
        else setSuccess(msgInput);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameVal = nameInput.value.trim();
        const emailVal = emailInput.value.trim();
        const msgVal = msgInput.value.trim();

        let valid = true;
        if (!nameVal) { setError(nameInput, 'Full name is required.'); valid = false; }
        if (!emailVal || !isValidEmail(emailVal)) { setError(emailInput, 'Valid email is required.'); valid = false; }
        if (!msgVal || msgVal.length < 10) { setError(msgInput, 'Feedback must be at least 10 characters.'); valid = false; }

        if (!valid) {
            if (window.showToast) window.showToast('Please fix the issues in the feedback form.', 'error');
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Submit Feedback';
            form.reset();
            [nameInput, emailInput, msgInput].forEach(inp => clearStatus(inp));

            if (window.showToast) {
                window.showToast('Thank you! Your feedback has been recorded.', 'success', 'Feedback Received');
            }
        }, 1000);
    });
}

/* =========================================================
   7. PROFILE EDIT FORM VALIDATION
   ========================================================= */
function initProfileEditForm() {
    const form = document.getElementById('profile-edit-form');
    if (!form) return;

    const nameInput = form.querySelector('#pe-name');
    const emailInput = form.querySelector('#pe-email');
    const phoneInput = form.querySelector('#pe-phone');
    const locationInput = form.querySelector('#pe-location');
    const modal = document.getElementById('profile-modal');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        let isValid = true;

        if (nameInput) {
            if (!nameInput.value.trim()) {
                setError(nameInput, 'Name cannot be empty.');
                isValid = false;
            } else {
                setSuccess(nameInput);
            }
        }

        if (emailInput) {
            if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
                setError(emailInput, 'A valid email is required.');
                isValid = false;
            } else {
                setSuccess(emailInput);
            }
        }

        if (phoneInput && phoneInput.value.trim()) {
            if (!isValidPhone(phoneInput.value)) {
                setError(phoneInput, 'Enter a valid phone number.');
                isValid = false;
            } else {
                setSuccess(phoneInput);
            }
        }

        if (!isValid) return;

        // Update profile text on page
        const nameDisplay = document.querySelector('.profile-header-info h1');
        const nameInfo = document.querySelector('.profile-info-grid .profile-info-item:nth-child(1) .info-value');
        const emailInfo = document.querySelector('.profile-info-grid .profile-info-item:nth-child(2) .info-value');
        const phoneInfo = document.querySelector('.profile-info-grid .profile-info-item:nth-child(3) .info-value');
        const locInfo = document.querySelector('.profile-info-grid .profile-info-item:nth-child(4) .info-value');

        if (nameDisplay && nameInput) nameDisplay.textContent = nameInput.value.trim();
        if (nameInfo && nameInput) nameInfo.textContent = nameInput.value.trim();
        if (emailInfo && emailInput) emailInfo.textContent = emailInput.value.trim();
        if (phoneInfo && phoneInput && phoneInput.value.trim()) phoneInfo.textContent = phoneInput.value.trim();
        if (locInfo && locationInput && locationInput.value.trim()) locInfo.textContent = locationInput.value.trim();

        if (modal) modal.classList.remove('active');

        if (window.showToast) {
            window.showToast('Profile updated successfully!', 'success', 'Profile Saved');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Check for skip parameter (from internal navigation)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('skip') === 'true') {
        const hero = document.querySelector('.hero');
        if (hero) {
            // Immediately hide without animation
            hero.style.transition = 'none';
            hero.classList.add('hero-hidden');

            // Clean up URL (optional, keeps address bar clean)
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }
    }

    // Initialize Language
    const savedLang = localStorage.getItem('siteLang') || 'en';
    setLanguage(savedLang);

    // Mobile Menu Toggle
    const navLogo = document.querySelector('.nav-logo');
    const navbar = document.querySelector('.navbar');

    if (navLogo && navbar) {
        navLogo.addEventListener('click', (e) => {
            const isHomePage = window.location.pathname.endsWith('index.html') ||
                window.location.pathname.endsWith('/') ||
                window.location.pathname === '/personal_website/';

            if (window.innerWidth <= 768 && !isHomePage) {
                // Prevent navigation to index.html when we just want to toggle menu
                e.preventDefault();
                navbar.classList.toggle('menu-open');
                // stopPropagation to prevent the window click handler from immediately closing it
                e.stopPropagation();
            }
        });
    }

    // Close menu when clicking outside
    window.addEventListener('click', (e) => {
        const navLinks = document.querySelector('.nav-links');
        if (navbar && navbar.classList.contains('menu-open')) {
            // If click is not inside the nav-links AND not on the nav-logo, close it
            const isClickInsideMenu = navLinks && navLinks.contains(e.target);
            const isClickOnLogo = navLogo && navLogo.contains(e.target);

            if (!isClickInsideMenu && !isClickOnLogo) {
                navbar.classList.remove('menu-open');
            }
        }
    });
});

// Assuming window.siteTranslations is loaded from js/translations.js

function setLanguage(lang) {
    // 1. Update State
    localStorage.setItem('siteLang', lang);
    document.documentElement.lang = lang;

    // 2. Update UI (Selector Active State)
    document.querySelectorAll('.lang-option').forEach(opt => {
        if (opt.getAttribute('data-lang') === lang) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });

    // 3. Update Splash Content with Animation (Legacy Logic for Splash)
    const translations = window.siteTranslations; // Use global object
    if (!translations) return; // Safety check

    const content = translations[lang];
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const exploreBtn = document.getElementById('exploreBtn');

    if (heroTitle && heroSubtitle && exploreBtn && content.home) {

        // Define animation helper
        const animateText = (el, newHtml) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            setTimeout(() => {
                el.innerHTML = newHtml;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 300);
        };

        // Only animate if content is actually different to avoid loop/flash on load
        if (heroTitle.innerHTML !== content.home.heroTitle) animateText(heroTitle, content.home.heroTitle);
        if (heroSubtitle.innerHTML !== content.home.heroSubtitle) animateText(heroSubtitle, content.home.heroSubtitle);

        // Button specific style
        if (exploreBtn.innerText !== content.home.exploreBtn) {
            exploreBtn.style.opacity = '0';
            setTimeout(() => {
                exploreBtn.innerText = content.home.exploreBtn;
                if (lang === 'cn') {
                    exploreBtn.style.letterSpacing = '0.1em';
                } else {
                    exploreBtn.style.letterSpacing = '0.2em';
                }
                exploreBtn.style.opacity = '1';
            }, 300);
        }
    }

    // 4. Update Smart Translatable Elements (data-i18n)
    // This handles everything else on the page (Nav, Cards, etc.)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n'); // e.g., "nav.education"
        const keys = key.split('.');
        let val = content;

        // Traverse dictionary: content['nav']['education']
        for (const k of keys) {
            val = val ? val[k] : null;
        }

        if (val) {
            // Check against current content to prevent unnecessary fades
            if (el.innerHTML !== val) {
                // Simple fade for text content change
                el.style.transition = 'opacity 0.3s';
                el.style.opacity = '0';
                setTimeout(() => {
                    el.innerHTML = val;
                    el.style.opacity = '1';
                }, 300);
            }
        }
    });
}

function enterSite() {
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.classList.add('hero-hidden');
    }
}

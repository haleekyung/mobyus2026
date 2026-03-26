// i18n.js - Handles language switching

const DEFAULT_LANG = 'ko';

// Safe localStorage wrapper
const safeStorage = {
    getItem: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('localStorage access failed:', e);
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('localStorage access failed:', e);
        }
    }
};

function getLanguage() {
    return safeStorage.getItem('preferredLanguage') || DEFAULT_LANG;
}

function setLanguage(lang) {
    const dicts = window.i18nData || { ko: {}, en: {} };
    const dictionary = dicts[lang];
    if (!dictionary) {
        console.error('i18nData not loaded or language not found:', lang);
        return;
    }
    
    // Save preference
    safeStorage.setItem('preferredLanguage', lang);
    document.documentElement.lang = lang;
    updateContent(lang);
    updateGnbUI(lang);
    
    // Dispatch event for other components to respond (like main.js)
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

function updateContent(lang) {
    const dicts = window.i18nData;
    if (!dicts) return;
    const dictionary = dicts[lang];
    if (!dictionary) return;

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary && key in dictionary) {
            const val = dictionary[key];
            if (val === '') {
                el.style.display = 'none';
            } else {
                el.style.display = '';
                if (el.tagName === 'OPTION') {
                    el.text = val;
                } else {
                    el.innerHTML = val;
                }
            }
        }
    });

    // Handle placeholders
    const placeholderEls = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderEls.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dictionary && key in dictionary) {
            el.setAttribute('placeholder', dictionary[key]);
        }
    });

    // Handle data-suffix translation for animated counters
    const suffixEls = document.querySelectorAll('[data-i18n-suffix]');
    suffixEls.forEach(el => {
        const key = el.getAttribute('data-i18n-suffix');
        if (key in dictionary) {
            const newSuffix = dictionary[key];
            el.setAttribute('data-suffix', newSuffix);
            // Re-render the displayed number with the new suffix immediately
            const target = parseFloat(el.getAttribute('data-target'));
            if (!isNaN(target)) {
                if (target % 1 !== 0) {
                    el.textContent = target.toFixed(1) + newSuffix;
                } else {
                    el.textContent = Math.floor(target) + newSuffix;
                }
            }
        }
    });
}

function updateGnbUI(lang) {
    const langContainer = document.querySelector('.gnb-lang');
    if (!langContainer) return;

    const links = langContainer.querySelectorAll('a');
    links.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-lang') === lang) {
            link.classList.add('active');
        }
    });
}

// Global functions for inline onclick handlers
window.setLanguage = setLanguage;

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    // We delay the initial application slightly to allow dynamically injected elements (like footer/GNB) to render
    setTimeout(() => {
        const currentLang = getLanguage();
        document.documentElement.lang = currentLang;
        // Always run updateContent once to handle currentLang and clear any stale states
        updateContent(currentLang);
        updateGnbUI(currentLang);
    }, 100);
});

(function () {
    'use strict';

    const STORAGE_KEY = 'theme_preference';

    function getStoredTheme() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function getSystemTheme() {
        try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
        catch (e) { return 'light'; }
    }

    function getCurrentTheme() {
        return getStoredTheme() || getSystemTheme();
    }

    function applyTheme(theme) {
        if (!document.body) return;
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            const isDark = theme === 'dark';
            const lang = (window.i18n && window.i18n.getCurrentLang && window.i18n.getCurrentLang()) || 'tr';
            const label = isDark
                ? (lang === 'en' ? 'Switch to light mode' : 'Aydınlık moda geç')
                : (lang === 'en' ? 'Switch to dark mode' : 'Karanlık moda geç');
            btn.setAttribute('aria-label', label);
            btn.setAttribute('title', label);
        }
    }

    function toggleTheme() {
        const current = getCurrentTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
        applyTheme(next);
    }

    function createToggleButton() {
        const btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.className = 'theme-toggle';
        btn.type = 'button';
        btn.innerHTML = '<span class="icon-moon">🌙</span><span class="icon-sun">☀️</span>';
        btn.onclick = toggleTheme;
        return btn;
    }

    function injectToggle() {
        const candidates = [
            '#lang-switcher', '.lang-switcher', '.nav-actions',
            '.nav-right', '#navbar-right', '.navbar-actions',
            '.nav-links', 'header nav', 'header', 'nav'
        ];
        for (const sel of candidates) {
            const el = document.querySelector(sel);
            if (el) {
                if (document.getElementById('theme-toggle')) return true;
                const btn = createToggleButton();
                if (sel === '#lang-switcher' || sel === '.lang-switcher') {
                    el.parentNode.insertBefore(btn, el);
                } else {
                    el.appendChild(btn);
                }
                applyTheme(getCurrentTheme());
                return true;
            }
        }
        return false;
    }

    function watchSystemTheme() {
        try {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e) => {
                if (!getStoredTheme()) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            };
            if (mq.addEventListener) mq.addEventListener('change', handler);
            else if (mq.addListener) mq.addListener(handler);
        } catch (e) {}
    }

    function init() {
        applyTheme(getCurrentTheme());
        if (!injectToggle()) {
            let tries = 0;
            const interval = setInterval(() => {
                tries++;
                if (injectToggle() || tries > 40) clearInterval(interval);
            }, 250);
        }
        watchSystemTheme();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

    window.themeManager = {
        toggle: toggleTheme,
        get: getCurrentTheme,
        set: (t) => {
            try { localStorage.setItem(STORAGE_KEY, t); } catch (e) {}
            applyTheme(t);
        },
        reset: () => {
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
            applyTheme(getSystemTheme());
        }
    };
})();

/**
 * BetulBooking AI Copilot — Chat Widget
 * Floating chat button + panel that talks to /api/copilot/chat
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'copilot_history';
    const MAX_HISTORY = 20;

    let isOpen = false;
    let isSending = false;
    let history = [];

    // Helper: get current language
    function getLang() {
        try {
            return (window.i18n && window.i18n.getCurrentLang && window.i18n.getCurrentLang()) || 'tr';
        } catch (e) {
            return 'tr';
        }
    }

    // Helper: translate (use i18n if available, else fallback)
    function t(key, fallback) {
        try {
            if (window.i18n && window.i18n.t) {
                const v = window.i18n.t(key);
                if (v && v !== key) return v;
            }
        } catch (e) {}
        return fallback;
    }

    // Helper: get token (logged-in user)
    function getToken() {
        return localStorage.getItem('token');
    }

    // Load history from localStorage
    function loadHistory() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            history = stored ? JSON.parse(stored) : [];
        } catch (e) {
            history = [];
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
        } catch (e) {}
    }

    function clearHistory() {
        history = [];
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    // ─── DOM helpers ───
    function createWidget() {
        // Floating button
        const fab = document.createElement('button');
        fab.id = 'copilot-fab';
        fab.className = 'copilot-fab';
        fab.setAttribute('aria-label', t('copilot.open', 'AI Asistanı'));
        fab.innerHTML = `
            <span class="pulse-ring"></span>
            <span style="position:relative;z-index:1;">✨</span>
        `;
        fab.onclick = togglePanel;
        document.body.appendChild(fab);

        // Panel
        const panel = document.createElement('div');
        panel.id = 'copilot-panel';
        panel.className = 'copilot-panel hidden';
        panel.innerHTML = `
            <div class="copilot-header">
                <div class="copilot-avatar">✨</div>
                <div class="copilot-title">
                    <h3>${t('copilot.title', 'BetulBooking Asistanı')}</h3>
                    <p><span class="copilot-status-dot"></span>${t('copilot.status', 'Çevrimiçi')}</p>
                </div>
                <button class="copilot-close" id="copilot-close" aria-label="Close">×</button>
            </div>
            <div class="copilot-messages" id="copilot-messages"></div>
            <div class="copilot-suggestions" id="copilot-suggestions"></div>
            <div class="copilot-input-area">
                <textarea
                    class="copilot-input"
                    id="copilot-input"
                    rows="1"
                    placeholder="${t('copilot.placeholder', 'Bir şey sorun...')}"
                ></textarea>
                <button class="copilot-send" id="copilot-send" aria-label="Send">→</button>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('copilot-close').onclick = togglePanel;
        document.getElementById('copilot-send').onclick = handleSend;

        const input = document.getElementById('copilot-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 100) + 'px';
        });
    }

    function togglePanel() {
        isOpen = !isOpen;
        const panel = document.getElementById('copilot-panel');
        const fab = document.getElementById('copilot-fab');
        if (isOpen) {
            panel.classList.remove('hidden');
            fab.classList.add('hidden');
            renderMessages();
            renderSuggestions();
            // Show greeting if first time opening with empty history
            if (history.length === 0) {
                showGreeting();
            }
            setTimeout(() => document.getElementById('copilot-input')?.focus(), 100);
        } else {
            panel.classList.add('hidden');
            fab.classList.remove('hidden');
        }
    }

    function showGreeting() {
        const lang = getLang();
        const isLoggedIn = !!getToken();
        let greeting;
        if (lang === 'en') {
            greeting = isLoggedIn
                ? "Hi! I'm your BetulBooking assistant. I can help you find businesses, check availability, view your reservations, and more. What can I help you with?"
                : "Hi! I'm your BetulBooking assistant. I can help you find businesses and check availability. Log in for personalized features. What can I help you with?";
        } else {
            greeting = isLoggedIn
                ? "Merhaba! Ben BetulBooking asistanınızım. İşletme arama, müsaitlik kontrolü, rezervasyonlarınızı görüntüleme ve daha fazlasında yardımcı olabilirim. Size nasıl yardımcı olabilirim?"
                : "Merhaba! Ben BetulBooking asistanınızım. İşletme aramada ve müsaitlik kontrolünde yardımcı olabilirim. Kişisel özellikler için giriş yapmanız gerekir. Size nasıl yardımcı olabilirim?";
        }
        appendMessage('assistant', greeting);
    }

    function renderMessages() {
        const container = document.getElementById('copilot-messages');
        if (!container) return;
        container.innerHTML = '';
        history.forEach(m => {
            const div = document.createElement('div');
            div.className = `copilot-msg ${m.role}`;
            div.textContent = m.text;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    }

    function renderSuggestions() {
        const lang = getLang();
        const isLoggedIn = !!getToken();
        let suggestions;

        if (lang === 'en') {
            suggestions = isLoggedIn
                ? ['Show my reservations', 'Find hotels in Istanbul', 'Recommend a beauty salon']
                : ['Find hotels in Istanbul', 'List spa centers', 'What businesses are in Ankara?'];
        } else {
            suggestions = isLoggedIn
                ? ['Rezervasyonlarımı göster', 'İstanbul\'da otel bul', 'Bir güzellik salonu öner']
                : ['İstanbul\'da otel bul', 'Spa merkezlerini listele', 'Ankara\'daki işletmeler neler?'];
        }

        const container = document.getElementById('copilot-suggestions');
        if (!container) return;
        // Hide suggestions after first user message
        if (history.some(m => m.role === 'user')) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'flex';
        container.innerHTML = '';
        suggestions.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'copilot-suggestion';
            btn.textContent = s;
            btn.onclick = () => {
                document.getElementById('copilot-input').value = s;
                handleSend();
            };
            container.appendChild(btn);
        });
    }

    function appendMessage(role, text) {
        history.push({ role, text });
        if (history.length > MAX_HISTORY) {
            history = history.slice(-MAX_HISTORY);
        }
        saveHistory();

        const container = document.getElementById('copilot-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `copilot-msg ${role}`;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;

        // Hide suggestions after first user message
        if (role === 'user') {
            const suggestions = document.getElementById('copilot-suggestions');
            if (suggestions) suggestions.style.display = 'none';
        }
    }

    function showTyping() {
        const container = document.getElementById('copilot-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'copilot-typing';
        div.id = 'copilot-typing';
        div.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function hideTyping() {
        const t = document.getElementById('copilot-typing');
        if (t) t.remove();
    }

    function showError(text) {
        const container = document.getElementById('copilot-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'copilot-msg error';
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    async function handleSend() {
        if (isSending) return;
        const input = document.getElementById('copilot-input');
        const message = input.value.trim();
        if (!message) return;

        appendMessage('user', message);
        input.value = '';
        input.style.height = 'auto';

        isSending = true;
        document.getElementById('copilot-send').disabled = true;
        showTyping();

        try {
            const headers = { 'Content-Type': 'application/json' };
            const token = getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const resp = await fetch('/api/copilot/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message,
                    history: history.slice(0, -1).slice(-10), // exclude the just-added user message; last 10
                    lang: getLang()
                })
            });

            hideTyping();

            const data = await resp.json();
            if (!resp.ok || data.error) {
                const lang = getLang();
                const errMsg = lang === 'en'
                    ? `Sorry, something went wrong: ${data.error || resp.statusText}`
                    : `Üzgünüm, bir hata oluştu: ${data.error || resp.statusText}`;
                showError(errMsg);
            } else {
                appendMessage('assistant', data.reply);
            }
        } catch (e) {
            hideTyping();
            const lang = getLang();
            const errMsg = lang === 'en'
                ? `Connection error. Please try again.`
                : `Bağlantı hatası. Lütfen tekrar deneyin.`;
            showError(errMsg);
        } finally {
            isSending = false;
            document.getElementById('copilot-send').disabled = false;
            input.focus();
        }
    }

    // Initialize when DOM ready
    function init() {
        loadHistory();
        createWidget();

        // Re-render when language changes (listen to i18n event if available)
        try {
            window.addEventListener('languageChanged', () => {
                if (isOpen) {
                    renderSuggestions();
                }
            });
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.copilot = {
        toggle: togglePanel,
        clear: () => { clearHistory(); renderMessages(); },
        history: () => history
    };
})();

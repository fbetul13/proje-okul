/* BETULBOOKING Application Logic */

/**
 * İşletme kategorisi çevirileri. Anahtar i18n'e bağlı (dil değişince otomatik günceller).
 * `konaklama`, `yeme-icme`, `guzellik` vb. backend'deki `business.type` değerleridir.
 */
const getBusinessTypeLabel = (type) => {
    if (!type) return t('biz.category.other');
    // Legacy alias'ları normalize et
    const legacy = { hotel: 'konaklama', salon: 'guzellik', spa: 'saglik' };
    const key = legacy[type] || type;
    const translated = t('biz.category.' + key);
    // Eğer key bulunamazsa t() anahtarı döner; o zaman raw değeri göster
    if (translated === 'biz.category.' + key) return type;
    return translated;
};

// Geriye dönük uyumluluk (bazı yerler hâlâ BUSINESS_TYPES[...] kullanıyor)
const BUSINESS_TYPES = new Proxy({}, {
    get: (_, key) => getBusinessTypeLabel(key)
});

/** İşletme listesi filtre sırası (navbar / seed ile aynı kategoriler) */
const BUSINESS_CATEGORY_ORDER = [
    'konaklama', 'yeme-icme', 'guzellik', 'saglik', 'spor', 'etkinlik', 'hizmet', 'egitim'
];

function normalizeBusinessTypeParam(raw) {
    if (!raw) return null;
    const legacy = { hotel: 'konaklama', salon: 'guzellik', spa: 'saglik' };
    return legacy[raw] || raw;
}

/** Ana sayfa hash (logo / Ana Sayfa); eski #hotels hâlâ router’da desteklenir */
const HOME_HASH = '#home';

/**
 * LOCALE — eski kod i18n dönüşümünden önce bu isimle Türkçe sabitler kullanıyordu.
 * Artık dinamik olarak i18n.js'deki t() fonksiyonuna bağlıdır; dil değişince
 * (sayfa reload'la) tüm render eden kod otomatik olarak yeni dilde alır.
 *
 * Not: Getter'lar her erişimde t() çağırır, böylece runtime'da doğru çeviri döner.
 */
const LOCALE = {
    NAV: {
        get HOME() { return t('nav.home'); },
        get RESERVATIONS() { return t('nav.reservations'); },
        get SUPERADMIN() { return t('nav.admin_panel'); },
        get BUSINESS() { return t('nav.business_panel'); },
        get STAFF() { return t('nav.staff_panel'); },
        get LOGS() { return t('sa.menu.logs'); },
        get LOGOUT() { return t('nav.logout'); },
        get LOGIN() { return t('nav.login'); },
        get REGISTER() { return t('nav.register'); }
    },
    STATUS: {
        get pending() { return t('status.pending'); },
        get approved() { return t('status.approved'); },
        get rejected() { return t('status.rejected'); }
    },
    MESSAGES: {
        get LOGIN_SUCCESS() { return t('msg.login_success'); },
        get REGISTER_SUCCESS() { return t('msg.register_success'); },
        get BOOKING_SUCCESS() { return t('msg.booking_success'); },
        get BOOKING_ERROR() { return t('msg.booking_error'); },
        get CANCEL_SUCCESS() { return t('msg.cancel_success'); },
        get UNAUTHORIZED() { return t('msg.unauthorized'); }
    }
};

/** Profil telefonu: gösterim 0532 123 45 67, API'ye 05321234567 */
function formatProfilePhoneDigits(d) {
    const x = String(d || '').replace(/\D/g, '').slice(0, 11);
    if (x.length <= 4) return x;
    if (x.length <= 7) return `${x.slice(0, 4)} ${x.slice(4)}`;
    if (x.length <= 9) return `${x.slice(0, 4)} ${x.slice(4, 7)} ${x.slice(7)}`;
    return `${x.slice(0, 4)} ${x.slice(4, 7)} ${x.slice(7, 9)} ${x.slice(9)}`;
}

function parseProfilePhoneToDigits(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('90') && d.length >= 12) d = d.slice(2);
    if (d.length === 10 && d[0] === '5') d = `0${d}`;
    return d.slice(0, 11);
}

function wireProfilePhoneInput(el) {
    if (!el) return;
    el.addEventListener('input', () => {
        const cur = parseProfilePhoneToDigits(el.value);
        el.value = formatProfilePhoneDigits(cur);
    });
}

/** Kayıt / personel / sahip formları — API'ye 05XXXXXXXXX */
function phoneInputToApiPayload(inputEl) {
    if (!inputEl) return null;
    let digits = parseProfilePhoneToDigits(inputEl.value);
    if (!digits) return null;
    if (digits.length === 10 && digits[0] === '5') return `0${digits}`;
    if (digits.length === 11 && digits[0] === '0') return digits;
    return null;
}


function escapeHtmlNavText(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function navUserInitials(name) {
    const t = String(name || '').trim();
    if (!t) return '?';
    const w = t.split(/\s+/).filter(Boolean);
    if (w.length >= 2) return (w[0][0] + w[w.length - 1][0]).toUpperCase();
    return t.slice(0, 2).toUpperCase();
}

function renderNavbar() {
    const navLinks = document.getElementById('nav-links');
    const authButtons = document.getElementById('auth-buttons');
    if (!navLinks || !authButtons) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const businessDropdown = `
        <li class="nav-dropdown">
            <button class="nav-dropdown-btn">${t('nav.businesses')}</button>
            <div class="nav-dropdown-menu">
                <a href="#businesses?type=konaklama">${t('nav.biz_cat.accommodation')}</a>
                <a href="#businesses?type=yeme-icme">${t('nav.biz_cat.food')}</a>
                <a href="#businesses?type=guzellik">${t('nav.biz_cat.beauty')}</a>
                <a href="#businesses?type=saglik">${t('nav.biz_cat.health')}</a>
                <a href="#businesses?type=spor">${t('nav.biz_cat.sport')}</a>
                <a href="#businesses?type=etkinlik">${t('nav.biz_cat.event')}</a>
                <a href="#businesses?type=hizmet">${t('nav.biz_cat.service')}</a>
                <a href="#businesses?type=egitim">${t('nav.biz_cat.education')}</a>
                <a href="#businesses">${t('nav.businesses_all')}</a>
            </div>
        </li>
    `;

    if (token) {
        navLinks.innerHTML = `
            <li><a href="${HOME_HASH}">${t('nav.home')}</a></li>
            ${businessDropdown}
            ${user.role === 'customer' ? `<li><a href="#reservations">${t('nav.reservations')}</a></li>` : ''}
            ${user.role === 'staff' ? `<li><a href="#staff-dashboard">${t('nav.staff_panel')}</a></li>` : ''}
            ${user.role === 'business_owner' ? `<li><a href="#business-dashboard">${t('nav.business_panel')}</a></li>` : ''}
            ${user.role === 'superadmin' ? `<li><a href="#superadmin-stats">${t('nav.admin_panel')}</a></li>` : ''}
        `;
        const displayName = escapeHtmlNavText(user.name || t('nav.my_account'));
        const initials = escapeHtmlNavText(navUserInitials(user.name));
        authButtons.innerHTML = `
            <div class="nav-auth-wrap">
                <a href="#profile" class="nav-user-chip" title="${t('nav.account_title')}" aria-label="${t('nav.account_title')}">
                    <span class="nav-user-avatar" aria-hidden="true">${initials}</span>
                    <span class="nav-user-text">
                        <span class="nav-user-label">${t('nav.my_account')}</span>
                        <span class="nav-user-name">${displayName}</span>
                    </span>
                </a>
                <button type="button" class="btn btn-outline btn-sm nav-logout-btn" onclick="logout()">${t('nav.logout')}</button>
            </div>
        `;
    } else {
        navLinks.innerHTML = `
            <li><a href="${HOME_HASH}">${t('nav.home')}</a></li>
            ${businessDropdown}
        `;
        authButtons.innerHTML = `
            <a href="#login" class="btn btn-sm">${t('nav.login')}</a>
            <a href="#register" class="btn btn-primary btn-sm">${t('nav.register')}</a>
        `;
    }
}

window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '#login';
};

// --- UI Components ---
window.showModal = (title, htmlContent) => {
    let overlay = document.getElementById('modal-overlay');
    let content = document.getElementById('modal-content');
    
    // Robustness: If somehow deleted, recreate
    if (!overlay || !content) {
        const div = document.createElement('div');
        div.id = 'modal-overlay';
        div.className = 'modal-overlay';
        div.innerHTML = '<div id="modal-content" class="modal-content"></div>';
        document.body.appendChild(div);
        overlay = div;
        content = document.getElementById('modal-content');
    }

    content.innerHTML = `
        <div class="modal-header">
            <h2 style="margin: 0;">${title}</h2>
            <span class="modal-close" onclick="closeModal()">&times;</span>
        </div>
        <div class="modal-body">${htmlContent}</div>
    `;
    overlay.classList.add('active');
    overlay.onclick = (e) => { if(e.target === overlay) closeModal(); };
};

window.closeModal = () => document.getElementById('modal-overlay').classList.remove('active');

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.background = type === 'success' ? 'var(--success)' : 'var(--error)';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- View Functions ---

let locationData = null;

async function loadLocationData() {
    if (!locationData) {
        locationData = await API.customer.getLocations();
    }
    return locationData;
}

window.updateIlceSelect = () => {
    const ilId = document.getElementById('filter-il').value;
    const ilceSelect = document.getElementById('filter-ilce');
    ilceSelect.innerHTML = '<option value="">Tüm İlçeler</option>';
    if (ilId && locationData && locationData.ilceler) {
        const filteredIlceler = locationData.ilceler
            .filter(i => i.il_id === ilId)
            .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        filteredIlceler.forEach(ilce => {
            ilceSelect.innerHTML += `<option value="${ilce.name}">${ilce.name}</option>`;
        });
    }
};

window.applyLocationFilter = async () => {
    const ilSelect = document.getElementById('filter-il');
    const ilName = ilSelect.options[ilSelect.selectedIndex]?.text;
    const ilce = document.getElementById('filter-ilce').value;
    const search = document.getElementById('filter-search')?.value || '';
    
    const params = {};
    if (ilSelect.value && ilName !== 'Tüm İller') params.il = ilName;
    if (ilce) params.ilce = ilce;
    if (search) params.search = search;
    
    const data = await API.customer.getBusinesses(1, params);
    renderBusinessCards(data.businesses);
};

function renderBusinessCards(businesses) {
    const grid = document.getElementById('businesses-grid');
    if (!businesses.length) {
        grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 3rem;">${t('biz.no_businesses')}</p>`;
        return;
    }
    grid.innerHTML = businesses.map(b => `
        <div class="service-card item-card business-card">
            <img src="${b.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600'}" class="service-img">
            <div class="service-info">
                <span class="badge" style="background: #f3f4f6; color: #374151; margin-bottom: 0.5rem; display: inline-block;">
                    ${getBusinessTypeLabel(b.type).toUpperCase()}
                </span>
                <h3 style="font-size: 1.3rem;">${b.name}</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">${b.il || ''}${b.ilce ? ', ' + b.ilce : ''}</p>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.description || ''}</p>
                <a href="#business-detail?id=${b.id}" class="btn btn-primary" style="width: 100%;">${t('biz.view_services')}</a>
            </div>
        </div>
    `).join('');
}

async function viewHotels(container) {
    try {
        const [businessData, locations] = await Promise.all([
            API.customer.getBusinesses(),
            loadLocationData()
        ]);

        const ilOptions = locations.iller.map(il => `<option value="${il.name}">${il.name}</option>`).join('');

        container.innerHTML = `
            <section class="hero-section">
                <div class="container">
                    <h1 style="color: white; font-size: 3rem; margin-bottom: 0.5rem;">${t('home.hero_title')}</h1>
                    <p style="color: #ddd; font-size: 1.1rem; max-width: 600px; margin: 0 auto 2rem;">
                        ${t('home.hero_subtitle')}
                    </p>
                    <div style="max-width: 900px; margin: 0 auto; background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                        <div style="position: relative; margin-bottom: 1rem;">
                            <input type="text" id="global-search"
                                placeholder="${t('home.search_placeholder')}"
                                style="width: 100%; padding: 1rem 1.2rem; font-size: 1rem; border: 2px solid #e2e8f0; border-radius: 10px; outline: none; transition: border-color 0.2s;"
                                onfocus="this.style.borderColor='var(--accent)'; this.parentElement.querySelector('#search-results').style.display = this.value.length >= 2 ? 'block' : 'none'"
                                onblur="this.style.borderColor='#e2e8f0'"
                                oninput="window.debounceSearch(this.value)"
                                autocomplete="off">
                            <div id="search-results" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); margin-top: 0.5rem; display: none; max-height: 350px; overflow-y: auto; z-index: 100;"></div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 0.75rem; align-items: end;">
                            <div>
                                <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.4rem; font-weight: 500;">${t('home.filter_city')}</label>
                                <select id="filter-il" class="pretty-select" onchange="window.updateIlceSelect()">
                                    <option value="">${t('home.filter_all')}</option>
                                    ${ilOptions}
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.4rem; font-weight: 500;">${t('home.filter_district')}</label>
                                <select id="filter-ilce" class="pretty-select">
                                    <option value="">${t('home.filter_all')}</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.4rem; font-weight: 500;">${t('home.filter_price')}</label>
                                <div style="display: flex; gap: 0.5rem;">
                                    <input type="number" id="filter-min-price" placeholder="${t('home.filter_min')}" style="width: 50%; padding: 0.75rem 0.5rem; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; font-size: 0.9rem;">
                                    <input type="number" id="filter-max-price" placeholder="${t('home.filter_max')}" style="width: 50%; padding: 0.75rem 0.5rem; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; font-size: 0.9rem;">
                                </div>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.4rem; font-weight: 500;">${t('home.filter_rating')}</label>
                                <select id="filter-rating" class="pretty-select">
                                    <option value="">${t('home.filter_all')}</option>
                                    <option value="4">${t('home.filter_rating_4plus')}</option>
                                    <option value="3">${t('home.filter_rating_3plus')}</option>
                                </select>
                            </div>
                            <button class="btn btn-primary" style="padding: 0.75rem 2rem; font-weight: 600;" onclick="window.filterBusinesses()">${t('btn.search')}</button>
                        </div>
                    </div>
                </div>
            </section>

            <div class="container" style="padding-top: 4rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 id="results-title">${t('home.popular_businesses')}</h2>
                </div>
                <div class="services-grid" id="businesses-grid">
                    ${renderBusinessCardsHTML(businessData.businesses)}
                </div>
            </div>

            <div class="container" style="padding: 4rem 0;">
                <div style="background: url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1400') center/cover; border-radius: 16px; position: relative; overflow: hidden;">
                    <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.55);"></div>
                    <div style="position: relative; padding: 3.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 2rem;">
                        <div>
                            <p style="color: rgba(255,255,255,0.8); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">${t('home.offer_period')}</p>
                            <h3 style="color: white; font-size: 2rem; margin-bottom: 0.5rem; font-weight: 700;">${t('home.offer_title')}</h3>
                            <p style="color: rgba(255,255,255,0.85); font-size: 1.1rem;">${t('home.offer_subtitle')}</p>
                        </div>
                        <a href="#businesses?type=konaklama" class="btn" style="background: white; color: #1e293b; padding: 1rem 2rem; font-weight: 600;">${t('home.offer_cta')}</a>
                    </div>
                </div>
            </div>

            <div class="container" style="padding-bottom: 4rem;">
                <h2 style="margin-bottom: 1.5rem;">${t('home.categories_title')}</h2>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;">
                    <a href="#businesses?type=konaklama" style="text-decoration: none;">
                        <div style="background: url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600') center/cover; height: 160px; border-radius: 12px; position: relative; overflow: hidden;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
                            <div style="position: absolute; bottom: 1.2rem; left: 1.2rem; color: white;">
                                <p style="font-size: 1.1rem; font-weight: 600;">Konaklama</p>
                            </div>
                        </div>
                    </a>
                    <a href="#businesses?type=yeme-icme" style="text-decoration: none;">
                        <div style="background: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600') center/cover; height: 160px; border-radius: 12px; position: relative; overflow: hidden;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
                            <div style="position: absolute; bottom: 1.2rem; left: 1.2rem; color: white;">
                                <p style="font-size: 1.1rem; font-weight: 600;">Yeme & İçme</p>
                            </div>
                        </div>
                    </a>
                    <a href="#businesses?type=guzellik" style="text-decoration: none;">
                        <div style="background: url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600') center/cover; height: 160px; border-radius: 12px; position: relative; overflow: hidden;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
                            <div style="position: absolute; bottom: 1.2rem; left: 1.2rem; color: white;">
                                <p style="font-size: 1.1rem; font-weight: 600;">Güzellik & Bakım</p>
                            </div>
                        </div>
                    </a>
                    <a href="#businesses?type=saglik" style="text-decoration: none;">
                        <div style="background: url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600') center/cover; height: 160px; border-radius: 12px; position: relative; overflow: hidden;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
                            <div style="position: absolute; bottom: 1.2rem; left: 1.2rem; color: white;">
                                <p style="font-size: 1.1rem; font-weight: 600;">Sağlık & Wellness</p>
                            </div>
                        </div>
                    </a>
                    <a href="#businesses?type=spor" style="text-decoration: none;">
                        <div style="background: url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600') center/cover; height: 160px; border-radius: 12px; position: relative; overflow: hidden;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
                            <div style="position: absolute; bottom: 1.2rem; left: 1.2rem; color: white;">
                                <p style="font-size: 1.1rem; font-weight: 600;">Spor & Aktivite</p>
                            </div>
                        </div>
                    </a>
                    <a href="#businesses?type=etkinlik" style="text-decoration: none;">
                        <div style="background: url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600') center/cover; height: 160px; border-radius: 12px; position: relative; overflow: hidden;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
                            <div style="position: absolute; bottom: 1.2rem; left: 1.2rem; color: white;">
                                <p style="font-size: 1.1rem; font-weight: 600;">Etkinlik & Organizasyon</p>
                            </div>
                        </div>
                    </a>
                    <a href="#businesses?type=hizmet" style="text-decoration: none;">
                        <div style="background: url('https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=600') center/cover; height: 160px; border-radius: 12px; position: relative; overflow: hidden;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
                            <div style="position: absolute; bottom: 1.2rem; left: 1.2rem; color: white;">
                                <p style="font-size: 1.1rem; font-weight: 600;">Hizmet & Servis</p>
                            </div>
                        </div>
                    </a>
                    <a href="#businesses?type=egitim" style="text-decoration: none;">
                        <div style="background: url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600') center/cover; height: 160px; border-radius: 12px; position: relative; overflow: hidden;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
                            <div style="position: absolute; bottom: 1.2rem; left: 1.2rem; color: white;">
                                <p style="font-size: 1.1rem; font-weight: 600;">Eğitim</p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        `;

        window.currentLocations = locations;

        window.updateIlceSelect = () => {
            const ilSelect = document.getElementById('filter-il');
            const ilceSelect = document.getElementById('filter-ilce');
            const selectedIl = ilSelect.value;
            
            ilceSelect.innerHTML = '<option value="">Tüm İlçeler</option>';
            if (selectedIl && window.currentLocations) {
                const il = window.currentLocations.iller.find(i => i.name === selectedIl);
                if (il) {
                    const ilceler = window.currentLocations.ilceler.filter(i => i.il_id === il.id);
                    ilceler.forEach(ilce => {
                        ilceSelect.innerHTML += `<option value="${ilce.name}">${ilce.name}</option>`;
                    });
                }
            }
        };

        window.filterBusinesses = async () => {
            const il = document.getElementById('filter-il').value;
            const ilce = document.getElementById('filter-ilce').value;
            const minPrice = document.getElementById('filter-min-price').value;
            const maxPrice = document.getElementById('filter-max-price').value;
            const minRating = document.getElementById('filter-rating').value;
            const grid = document.getElementById('businesses-grid');
            const title = document.getElementById('results-title');

            grid.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Aranıyor...</p>';

            try {
                const params = {};
                if (il) params.il = il;
                if (ilce) params.ilce = ilce;
                if (minPrice) params.min_price = minPrice;
                if (maxPrice) params.max_price = maxPrice;
                if (minRating) params.min_rating = minRating;

                const data = await API.customer.getBusinesses(1, params);
                grid.innerHTML = renderBusinessCardsHTML(data.businesses);

                let filterText = '';
                if (il || ilce) filterText = `${il || ''}${ilce ? ' / ' + ilce : ''}`;
                if (minRating) filterText += filterText ? ` (${minRating}+ Yıldız)` : `${minRating}+ Yıldız`;
                
                title.textContent = filterText ? `${filterText} İşletmeleri` : 'Popüler İşletmeler';
            } catch (e) {
                grid.innerHTML = `<p style="color: red; text-align: center;">${e.message}</p>`;
            }
        };

        let searchTimeout;
        window.debounceSearch = (val) => {
            clearTimeout(searchTimeout);
            const resultsDiv = document.getElementById('search-results');
            if (val.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }
            searchTimeout = setTimeout(() => performGlobalSearch(val), 300);
        };

        async function performGlobalSearch(query) {
            const resultsDiv = document.getElementById('search-results');
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = '<p style="padding: 1rem; color: #999; text-align: center;">Aranıyor...</p>';

            const il = document.getElementById('filter-il')?.value || '';
            const ilce = document.getElementById('filter-ilce')?.value || '';

            try {
                const data = await API.customer.search(query, il, ilce);
                const hasResults = data.businesses.length || data.services.length;

                if (!hasResults) {
                    resultsDiv.innerHTML = '<p style="padding: 1.5rem; color: #999; text-align: center;">Sonuç bulunamadı</p>';
                    return;
                }

                let html = '';
                
                if (data.businesses.length) {
                    html += '<div style="padding: 0.8rem 1rem; background: #f8fafc; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">İşletmeler</div>';
                    html += data.businesses.map(b => `
                        <a href="#business-detail?id=${b.id}" class="search-result-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; text-decoration: none; border-bottom: 1px solid #f0f0f0;">
                            <img src="${b.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=100'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; color: #1e293b; margin-bottom: 0.25rem;">${b.name}</div>
                                <div style="font-size: 0.8rem; color: #64748b;">${getBusinessTypeLabel(b.type)}${b.il ? ' - ' + b.il : ''}</div>
                            </div>
                        </a>
                    `).join('');
                }

                if (data.services.length) {
                    html += '<div style="padding: 0.8rem 1rem; background: #f8fafc; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Hizmetler</div>';
                    html += data.services.map(s => `
                        <a href="#service-detail?id=${s.id}" class="search-result-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; text-decoration: none; border-bottom: 1px solid #f0f0f0;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #16a34a, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7rem; font-weight: 600;">${s.category === 'hotel' ? 'ODA' : 'HZM'}</div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; color: #1e293b; margin-bottom: 0.25rem;">${s.name}</div>
                                <div style="font-size: 0.8rem; color: #64748b;">${s.category === 'hotel' ? (s.room_type || 'Oda') : 'Randevu'}${s.price ? ' - ' + s.price.toLocaleString('tr-TR') + ' ₺' : ''}</div>
                            </div>
                        </a>
                    `).join('');
                }

                resultsDiv.innerHTML = html;
            } catch (e) {
                resultsDiv.innerHTML = `<p style="padding: 1rem; color: var(--error); text-align: center;">${e.message}</p>`;
            }
        }

        document.addEventListener('click', (e) => {
            const resultsDiv = document.getElementById('search-results');
            const searchInput = document.getElementById('global-search');
            if (resultsDiv && !resultsDiv.contains(e.target) && e.target !== searchInput) {
                resultsDiv.style.display = 'none';
            }
        });

    } catch (e) {
        container.innerHTML = `<div class="container" style="padding: 5rem;">Hata: ${e.message}</div>`;
    }
}

function renderBusinessCardsHTML(businesses) {
    if (!businesses.length) {
        return `<p style="color: #999; text-align: center; grid-column: 1/-1; padding: 3rem;">${t('biz.no_businesses')}</p>`;
    }
    // Para birimi ve locale dile göre değişsin
    const lang = (window.i18n && window.i18n.getCurrentLang()) || 'tr';
    const numberLocale = lang === 'tr' ? 'tr-TR' : 'en-US';
    return businesses.map(b => `
        <div class="service-card item-card business-card">
            <img src="${b.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600'}" class="service-img">
            <div class="service-info">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span class="badge" style="background: #f3f4f6; color: #374151;">
                        ${getBusinessTypeLabel(b.type).toUpperCase()}
                    </span>
                    ${b.avg_rating ? `<span style="color: #f59e0b; font-weight: 600; font-size: 0.9rem;">★ ${b.avg_rating}</span>` : ''}
                </div>
                <h3 style="font-size: 1.3rem;">${b.name}</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">${b.il || ''}${b.ilce ? ', ' + b.ilce : ''}</p>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.description || ''}</p>
                ${b.min_price ? `<p style="color: var(--accent); font-weight: 600; font-size: 0.9rem; margin-bottom: 1rem;">${t('biz.price_from', { price: b.min_price.toLocaleString(numberLocale) })}</p>` : '<div style="margin-bottom: 1rem;"></div>'}
                <a href="#business-detail?id=${b.id}" class="btn btn-primary" style="width: 100%;">${t('biz.view_services')}</a>
            </div>
        </div>
    `).join('');
}

async function viewBusinessesByType(container) {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const type = normalizeBusinessTypeParam(params.get('type'));

    const title = type ? getBusinessTypeLabel(type) : t('biz.all_businesses');
    const filterButtons = [
        `<a href="#businesses" class="btn ${!type ? 'btn-primary' : 'btn-outline'} btn-sm">${t('nav.businesses_all')}</a>`,
        ...BUSINESS_CATEGORY_ORDER.map((slug) => {
            const label = getBusinessTypeLabel(slug);
            const active = type === slug;
            return `<a href="#businesses?type=${encodeURIComponent(slug)}" class="btn ${active ? 'btn-primary' : 'btn-outline'} btn-sm" title="${label}">${label}</a>`;
        })
    ].join('');

    container.innerHTML = `
        <div class="container" style="padding-top: 4rem;">
            <div style="margin-bottom: 2rem;">
                <a href="${HOME_HASH}" style="color: var(--accent); font-weight: 500;">${t('home.back_to_home')}</a>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                <h1 style="margin: 0;">${title}</h1>
                <div class="business-type-filters" style="display: flex; gap: 0.5rem; flex-wrap: wrap; max-width: 100%; justify-content: flex-end;">
                    ${filterButtons}
                </div>
            </div>
            <div class="services-grid" id="businesses-grid">
                <p style="text-align: center; padding: 2rem; color: #666; grid-column: 1/-1;">${t('common.loading_generic')}</p>
            </div>
        </div>
    `;

    try {
        const queryParams = type ? { type } : {};
        const data = await API.customer.getBusinesses(1, queryParams);
        document.getElementById('businesses-grid').innerHTML = renderBusinessCardsHTML(data.businesses);
    } catch (e) {
        document.getElementById('businesses-grid').innerHTML = `<p style="color: red; text-align: center; grid-column: 1/-1;">${e.message}</p>`;
    }
}


async function viewHotelDetail(container) {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const hotelId = params.get('id');
    const today = new Date().toISOString().split('T')[0];

    try {
        const hotels = await API.customer.getHotels();
        const hotel = hotels.businesses.find(b => b.id == hotelId);

        if (!hotel) return container.innerHTML = t('biz.hotel_not_found');

        container.innerHTML = `
            <div class="container" style="padding-top: 4rem;">
                <div style="margin-bottom: 3rem;">
                    <a href="${HOME_HASH}" style="color: var(--accent); font-weight: 600;">${t('home.back_to_home_full')}</a>
                    <h1 style="font-size: 3rem; margin-top: 1rem;">${hotel.name}</h1>
                    <p style="color: var(--text-muted); font-size: 1.1rem;">${hotel.description}</p>
                </div>

                <div class="card" style="padding: 2.5rem; background: white; border-radius: 20px; box-shadow: var(--shadow);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1.5rem;">
                        <div>
                            <h3 style="margin-bottom: 0.5rem;">${t('biz.room_selection')}</h3>
                            <p style="font-size: 0.9rem; color: var(--text-muted);">${t('biz.room_selection_hint')}</p>
                        </div>
                        <div style="display: flex; gap: 1rem;">
                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 0.8rem;">${t('res.check_in')}</label>
                                <input type="date" id="grid-check-in" class="btn-outline" style="padding: 0.5rem;" min="${today}" onchange="refreshRoomGrid(${hotelId})">
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 0.8rem;">${t('res.check_out')}</label>
                                <input type="date" id="grid-check-out" class="btn-outline" style="padding: 0.5rem;" min="${today}" onchange="refreshRoomGrid(${hotelId})">
                            </div>
                        </div>
                    </div>

                    <div id="room-grid-container" class="room-grid">
                        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">
                            ${t('common.loading_generic')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        loadRoomsWithCalendar(hotelId);

        async function loadRoomsWithCalendar(hotelId) {
            const grid = document.getElementById('room-grid-container');
            try {
                const rooms = await API.customer.getHotelRooms(hotelId);
                if (!rooms.rooms.length) {
                    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:3rem; color:#999;">${t('biz.no_rooms')}</p>`;
                    return;
                }

                const lang = (window.i18n && window.i18n.getCurrentLang()) || 'tr';
                const numberLocale = lang === 'tr' ? 'tr-TR' : 'en-US';

                grid.innerHTML = rooms.rooms.map(room => `
                    <div class="room-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; transition: all 0.2s;">
                        <div style="height: 140px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white;">
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; font-weight: 700;">${t('biz.room_num')} ${room.room_number || ''}</div>
                                <div style="font-size: 0.85rem; opacity: 0.9;">${room.room_type || t('biz.room_standart')}</div>
                            </div>
                        </div>
                        <div style="padding: 1.2rem;">
                            <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem;">${room.name}</h4>
                            <p style="color: #6b7280; font-size: 0.85rem; margin-bottom: 1rem;">${room.description || t('biz.room_comfortable_desc')}</p>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                ${room.price ? `<span style="font-size: 1.2rem; font-weight: 700; color: var(--accent);">${room.price.toLocaleString(numberLocale)} ₺<small style="font-size: 0.7rem; font-weight: 400; color: #999;">${t('res.per_night')}</small></span>` : '<span></span>'}
                                <button class="btn btn-primary btn-sm" onclick="window.showRoomCalendar(${room.id}, '${room.name.replace(/'/g,"\\'")}', '${room.room_type || t('biz.room_standart')}', ${room.price || 0})">${t('biz.availability')}</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } catch (e) { grid.innerHTML = t('common.error') + ': ' + e.message; }
        }

        window.showRoomCalendar = async (roomId, roomName, roomType, price) => {
            const today = new Date().toISOString().split('T')[0];
            const html = `
                <div style="margin-bottom: 1rem;">
                    <p style="color:#666; margin-bottom:0.5rem;">${roomType} ${price ? `- <strong style="color:var(--accent)">${price.toLocaleString('tr-TR')} ₺/gece</strong>` : ''}</p>
                </div>
                <div style="margin-bottom:1.5rem; padding:1rem; background:#f0fdf4; border-radius:8px; border:1px solid #10b981;">
                    <p style="font-size:0.9rem; margin-bottom:0.8rem;"><strong>Tarih Seçin:</strong></p>
                    <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                        <div>
                            <label style="font-size:0.8rem; color:#666;">Giriş</label>
                            <input type="date" id="cal-check-in" min="${today}" style="display:block; padding:0.5rem; border:1px solid #ddd; border-radius:6px;">
                        </div>
                        <div>
                            <label style="font-size:0.8rem; color:#666;">Çıkış</label>
                            <input type="date" id="cal-check-out" min="${today}" style="display:block; padding:0.5rem; border:1px solid #ddd; border-radius:6px;">
                        </div>
                        <button class="btn btn-primary" style="align-self:flex-end;" onclick="window.checkAndBook(${roomId})">Rezervasyon Yap</button>
                    </div>
                </div>
                <h4 style="margin-bottom:0.8rem;">Müsaitlik Takvimi</h4>
                <div id="room-cal-grid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:0.3rem; font-size:0.8rem;">
                    <div class="loading-row" style="grid-column:1/-1;">Yükleniyor...</div>
                </div>
                <p style="margin-top:0.8rem; font-size:0.75rem; color:#666;">
                    <span style="display:inline-block; width:10px; height:10px; background:#f0fdf4; border:1px solid #10b981; border-radius:2px;"></span> Müsait
                    <span style="display:inline-block; width:10px; height:10px; background:#fef2f2; border:1px solid #ef4444; border-radius:2px; margin-left:10px;"></span> Dolu
                </p>
            `;
            showModal(`${roomName} - Müsaitlik`, html);
            loadCustomerRoomCalendar(roomId);
        };

        async function loadCustomerRoomCalendar(roomId) {
            const grid = document.getElementById('room-cal-grid');
            try {
                const avail = await API.customer.getAvailability(roomId);
                const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
                
                grid.innerHTML = dayNames.map(d => 
                    `<div style="text-align:center; font-weight:600; padding:0.2rem; color:#666; font-size:0.7rem;">${d}</div>`
                ).join('');

                const today = new Date();
                today.setHours(0,0,0,0);
                const endDate = new Date(today);
                endDate.setDate(today.getDate() + 60);

                const bookedDates = new Set();
                if (avail.booked_ranges) {
                    avail.booked_ranges.forEach(r => {
                        let d = new Date(r.check_in);
                        const end = new Date(r.check_out);
                        while (d < end) {
                            bookedDates.add(d.toISOString().split('T')[0]);
                            d.setDate(d.getDate() + 1);
                        }
                    });
                }

                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());

                let currentDate = new Date(startOfWeek);
                while (currentDate <= endDate) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const isPast = currentDate < today;
                    const isBooked = bookedDates.has(dateStr);
                    const dayNum = currentDate.getDate();
                    
                    if (isPast) {
                        grid.innerHTML += `<div style="padding:0.4rem; text-align:center; opacity:0.3;"><div style="font-size:0.8rem; color:#cbd5e1;">${dayNum}</div></div>`;
                    } else if (isBooked) {
                        grid.innerHTML += `<div style="padding:0.4rem; border-radius:4px; text-align:center; background:#fef2f2; border:1px solid #ef4444;"><div style="font-weight:600; font-size:0.8rem;">${dayNum}</div></div>`;
                    } else {
                        grid.innerHTML += `<div style="padding:0.4rem; border-radius:4px; text-align:center; background:#f0fdf4; border:1px solid #10b981;"><div style="font-weight:600; font-size:0.8rem;">${dayNum}</div></div>`;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            } catch (e) { grid.innerHTML = `<p style="color:var(--error); grid-column:1/-1;">${e.message}</p>`; }
        }

        window.checkAndBook = async (roomId) => {
            const checkIn = document.getElementById('cal-check-in').value;
            const checkOut = document.getElementById('cal-check-out').value;
            if (!checkIn || !checkOut) return showToast('Lütfen giriş ve çıkış tarihi seçin.', 'error');
            if (new Date(checkOut) <= new Date(checkIn)) return showToast('Çıkış tarihi girişten sonra olmalı.', 'error');
            
            const avail = await API.customer.getAvailability(roomId);
            const isBooked = avail.booked_ranges?.some(r => {
                return (new Date(checkIn) < new Date(r.check_out)) && (new Date(checkOut) > new Date(r.check_in));
            });
            
            if (isBooked) {
                showToast('Seçilen tarihler için bu oda dolu.', 'error');
                return;
            }
            
            closeModal();
            window.location.hash = `#service-detail?id=${roomId}&start=${checkIn}&end=${checkOut}`;
        };

        window.refreshRoomGrid = async (id) => {
            const start = document.getElementById('grid-check-in').value;
            const end = document.getElementById('grid-check-out').value;
            const grid = document.getElementById('room-grid-container');

            if (!start || !end) return;
            if (new Date(end) <= new Date(start)) {
                showToast("Çıkış tarihi girişten sonra olmalıdır.", "error");
                return;
            }

            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Yükleniyor...</div>';

            try {
                const rooms = await API.customer.getHotelRooms(id);
                const gridHtml = await Promise.all(rooms.rooms.map(async room => {
                    const avail = await API.customer.getAvailability(room.id);
                    const isBooked = avail.booked_ranges?.some(r => {
                        return (new Date(start) < new Date(r.check_out)) && (new Date(end) > new Date(r.check_in));
                    });

                    return `
                        <div class="room-item ${isBooked ? 'booked' : 'available'}"
                             ${isBooked ? '' : `onclick="selectRoomForBooking(${room.id}, '${room.name}', this)"`}>
                            <div class="status-indicator ${isBooked ? 'status-booked' : 'status-available'}"></div>
                            <div class="room-number">${room.room_number || '#'}</div>
                            <div class="room-type-label">${room.room_type || 'Standart'}</div>
                            ${room.price ? `<div style="font-size:0.7rem; color:var(--accent); font-weight:600;">${room.price.toLocaleString('tr-TR')} ₺</div>` : ''}
                            <div style="font-size: 0.65rem; margin-top: 0.3rem; opacity: 0.7;">${isBooked ? 'DOLU' : 'MÜSAİT'}</div>
                        </div>
                    `;
                }));
                grid.innerHTML = gridHtml.join('') + `
                    <div id="booking-cta" style="grid-column: 1/-1; margin-top: 3rem; display: none; text-align: center; border-top: 1px solid #eee; padding-top: 2rem;">
                        <p id="selected-room-info" style="font-weight: 600; margin-bottom: 1rem;"></p>
                        <button class="btn btn-primary" style="padding: 1rem 3rem;" onclick="redirectToBooking()">Devam Et ve Rezerve Et</button>
                    </div>
                `;
            } catch (e) { grid.innerHTML = 'Hata: ' + e.message; }
        };

        window.selectRoomForBooking = (roomId, name, el) => {
            document.querySelectorAll('.room-item').forEach(r => r.classList.remove('selected'));
            el.classList.add('selected');
            
            // Set it on window to ensure redirectToBooking (which is also window) sees it
            window.lastSelectedRoomId = roomId; 
            
            const cta = document.getElementById('booking-cta');
            cta.style.display = 'block';
            document.getElementById('selected-room-info').innerHTML = `Seçilen Oda: <span style="color:var(--accent)">${name}</span>`;
            cta.scrollIntoView({ behavior: 'smooth' });
        };

        window.redirectToBooking = () => {
            if (!window.lastSelectedRoomId) return showToast("Lütfen önce bir oda seçin.", "error");
            const start = document.getElementById('grid-check-in').value;
            const end = document.getElementById('grid-check-out').value;
            window.location.hash = `#service-detail?id=${window.lastSelectedRoomId}&start=${start}&end=${end}`;
        };

    } catch (e) {
        container.innerHTML = e.message;
    }
}

async function viewBusinessDetail(container) {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const businessId = params.get('id');

    try {
        const business = await API.customer.getBusiness(businessId);
        if (!business) return container.innerHTML = '<div class="container" style="padding: 5rem; text-align: center;"><h2>İşletme bulunamadı.</h2></div>';

        const hotelServices = business.services?.filter(s => s.category === 'hotel') || [];
        const appointmentServices = business.services?.filter(s => s.category === 'appointment') || [];

        const fullAddress = [business.address, business.ilce, business.il].filter(Boolean).join(', ');
        const mapsUrl = business.latitude && business.longitude 
            ? `https://www.google.com/maps?q=${business.latitude},${business.longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
        
        const dayNames = { mon: 'Pazartesi', tue: 'Salı', wed: 'Çarşamba', thu: 'Perşembe', fri: 'Cuma', sat: 'Cumartesi', sun: 'Pazar' };
        
        let workingHoursHtml = '';
        if (business.working_hours) {
            const hoursArr = Object.entries(business.working_hours).map(([day, hours]) => {
                if (!hours) return `<span style="color: #999;">${dayNames[day]}: Kapalı</span>`;
                return `<span>${dayNames[day]}: ${hours.open} - ${hours.close}</span>`;
            });
            workingHoursHtml = `<div style="display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; font-size: 0.85rem;">${hoursArr.join('')}</div>`;
        }

        container.innerHTML = `
            <div class="container" style="padding-top: 4rem;">
                <a href="${HOME_HASH}" style="color: var(--accent); font-weight: 600; display: inline-block; margin-bottom: 1rem;">← Ana Sayfaya Dön</a>

                <div style="display: flex; gap: 3rem; flex-wrap: wrap; margin-bottom: 3rem;">
                    <img src="${business.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600'}" style="width: 400px; height: 300px; object-fit: cover; border-radius: 16px;">
                    <div style="flex: 1; min-width: 300px;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <span class="badge" style="background: #f3f4f6; color: #374151;">
                                ${getBusinessTypeLabel(business.type).toUpperCase()}
                            </span>
                            ${business.avg_rating ? `
                                <span style="display: flex; align-items: center; gap: 0.3rem; color: #f59e0b; font-weight: 600;">
                                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                    ${business.avg_rating} <span style="color: #999; font-weight: 400;">(${business.review_count} değerlendirme)</span>
                                </span>
                            ` : ''}
                        </div>
                        <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">${business.name}</h1>
                        <p style="color: var(--text-muted); font-size: 1rem; line-height: 1.7; margin-bottom: 1.5rem;">${business.description || 'Açıklama bulunmuyor.'}</p>
                        
                        <div style="display: flex; flex-direction: column; gap: 0.8rem; padding: 1.2rem; background: #f9fafb; border-radius: 12px; font-size: 0.95rem;">
                            ${fullAddress ? `
                                <div style="display: flex; align-items: flex-start; gap: 0.8rem;">
                                    <svg width="20" height="20" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    <div>
                                        <span style="color: #374151;">${fullAddress}</span>
                                        <a href="${mapsUrl}" target="_blank" style="display: block; font-size: 0.8rem; color: var(--accent); margin-top: 0.2rem;">Google Haritalar'da Aç</a>
                                    </div>
                                </div>
                            ` : ''}
                            ${business.phone ? `
                                <div style="display: flex; align-items: center; gap: 0.8rem;">
                                    <svg width="20" height="20" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                    <a href="tel:${business.phone}" style="color: #374151;">${business.phone}</a>
                                </div>
                            ` : ''}
                            ${business.email ? `
                                <div style="display: flex; align-items: center; gap: 0.8rem;">
                                    <svg width="20" height="20" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    <a href="mailto:${business.email}" style="color: #374151;">${business.email}</a>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${workingHoursHtml ? `
                            <div style="margin-top: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <strong style="font-size: 0.85rem; color: #374151; display: block; margin-bottom: 0.5rem;">Çalışma Saatleri</strong>
                                ${workingHoursHtml}
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${hotelServices.length > 0 ? `
                    <div style="margin-bottom: 4rem;">
                        <h2 style="margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">Odalar</h2>
                        <div class="services-grid">
                            ${hotelServices.map(s => `
                                <div class="service-card item-card">
                                    <img src="${s.image_url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600'}" class="service-img">
                                    <div class="service-info">
                                        <h3 style="font-size: 1.2rem;">${s.name}</h3>
                                        <p style="color: var(--text-muted); font-size: 0.85rem;">${s.room_type || 'Standart'} - ${s.room_number || ''}</p>
                                        ${s.price ? `<p style="font-size: 1.1rem; font-weight: 600; color: var(--accent); margin: 0.5rem 0;">${s.price.toLocaleString('tr-TR')} ₺ / gece</p>` : ''}
                                        <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="window.openRoomBookingModal(${s.id}, '${s.name.replace(/'/g,"\\'")}', '${s.room_type || 'Standart'}', ${s.price || 0})">Rezervasyon Yap</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${appointmentServices.length > 0 ? `
                    <div style="margin-bottom: 4rem;">
                        <h2 style="margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">Hizmetler</h2>
                        <div class="services-grid">
                            ${appointmentServices.map(s => `
                                <div class="service-card item-card">
                                    <img src="${s.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600'}" class="service-img">
                                    <div class="service-info">
                                        <h3 style="font-size: 1.2rem;">${s.name}</h3>
                                        ${s.price ? `<p style="font-size: 1.1rem; font-weight: 600; color: var(--accent); margin: 0.5rem 0;">${s.price.toLocaleString('tr-TR')} ₺</p>` : ''}
                                        <button class="btn btn-outline" style="width: 100%; margin-top: 1rem; border-color: var(--accent); color: var(--accent);" onclick="window.openAppointmentModal(${s.id}, '${s.name.replace(/'/g,"\\'")}', ${s.price || 0})">Randevu Al</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${!hotelServices.length && !appointmentServices.length ? `
                    <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <p>Bu işletmenin henüz hizmeti bulunmuyor.</p>
                    </div>
                ` : ''}

                <!-- Yorumlar Bölümü -->
                <div style="margin-bottom: 4rem;">
                    <h2 style="margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
                        Müşteri Yorumları 
                        ${business.review_count ? `<span style="font-size: 1rem; font-weight: 400; color: #999;">(${business.review_count})</span>` : ''}
                    </h2>
                    
                    ${business.reviews && business.reviews.length > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                            ${business.reviews.map(r => `
                                <div style="padding: 1.5rem; background: #f9fafb; border-radius: 12px;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
                                        <div>
                                            <strong style="color: #374151;">${r.user_name || 'Anonim'}</strong>
                                            <span style="color: #999; font-size: 0.85rem; margin-left: 0.5rem;">${r.service_name}</span>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 0.3rem;">
                                            ${[1,2,3,4,5].map(i => `
                                                <svg width="16" height="16" fill="${i <= r.rating ? '#f59e0b' : '#e5e7eb'}" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                                </svg>
                                            `).join('')}
                                        </div>
                                    </div>
                                    ${r.comment ? `<p style="color: #4b5563; line-height: 1.6;">${r.comment}</p>` : ''}
                                    ${r.created_at ? `<p style="font-size: 0.8rem; color: #999; margin-top: 0.5rem;">${new Date(r.created_at).toLocaleDateString('tr-TR')}</p>` : ''}
                                    ${r.staff_reply ? `
                                        <div style="margin-top: 1rem; padding: 1rem; background: white; border-left: 3px solid var(--accent); border-radius: 0 8px 8px 0;">
                                            <strong style="font-size: 0.85rem; color: var(--accent);">İşletme Yanıtı:</strong>
                                            <p style="color: #4b5563; margin-top: 0.3rem; font-size: 0.9rem;">${r.staff_reply}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: #f9fafb; border-radius: 12px;">
                            <p>Henüz yorum yapılmamış.</p>
                        </div>
                    `}
                </div>
            </div>
        `;

    } catch (e) {
        container.innerHTML = `<div class="container" style="padding: 5rem;">Hata: ${e.message}</div>`;
    }
}

const _TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function _isoFromYMD(y, m0, d) {
    return `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function _parseIsoLocal(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function _stripDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
}

function _dayInBookedRanges(tMs, ranges) {
    if (!ranges || !ranges.length) return false;
    return ranges.some((r) => {
        const ci = _stripDay(r.check_in);
        const co = _stripDay(r.check_out);
        return tMs >= ci && tMs < co;
    });
}

function _buildInlineMonthGrid(year, month0, ctx) {
    const { todayMs, bookedRanges, mode, singleIso, checkInIso, checkOutIso, onPickFn, disableToday } = ctx;
    const first = new Date(year, month0, 1);
    const mondayPad = (first.getDay() + 6) % 7;
    const dim = new Date(year, month0 + 1, 0).getDate();
    let html = '';
    for (let i = 0; i < mondayPad; i++) html += '<div class="inline-cal-pad" aria-hidden="true"></div>';
    for (let d = 1; d <= dim; d++) {
        const ms = new Date(year, month0, d).getTime();
        const iso = _isoFromYMD(year, month0, d);
        let cls = 'inline-cal-day';
        const past = ms < todayMs;
        const disableThisDay = !!disableToday && ms === todayMs;
        const booked = !past && bookedRanges && _dayInBookedRanges(ms, bookedRanges);
        if (past || booked || disableThisDay) {
            cls += booked ? ' inline-cal-day--booked inline-cal-day--disabled' : ' inline-cal-day--disabled';
        } else if (mode === 'single' && singleIso === iso) {
            cls += ' inline-cal-day--single';
        } else if (mode === 'range' && checkInIso && checkOutIso) {
            const a = _stripDay(_parseIsoLocal(checkInIso));
            const b = _stripDay(_parseIsoLocal(checkOutIso));
            if (iso === checkInIso) cls += ' inline-cal-day--range-start';
            else if (iso === checkOutIso) cls += ' inline-cal-day--range-end';
            else if (ms > a && ms < b) cls += ' inline-cal-day--in-range';
        } else if (mode === 'range' && checkInIso && !checkOutIso && iso === checkInIso) {
            cls += ' inline-cal-day--range-start';
        }
        const dis = past || booked || disableThisDay;
        const onclk = dis ? '' : ` onclick="${onPickFn}('${iso}')"`;
        html += `<button type="button" class="${cls}" data-iso="${iso}"${onclk}>${d}</button>`;
    }
    return html;
}

// --- Admin (business/staff) hotel availability calendar (month view) ---
function _buildAdminHotelMonthGrid(year, month0, ctx) {
    const { todayMs, slotMap, bookedRanges, onToggleFn, onPickFn, addMode, rangeStartIso, rangeEndIso } = ctx;
    const first = new Date(year, month0, 1);
    const mondayPad = (first.getDay() + 6) % 7;
    const dim = new Date(year, month0 + 1, 0).getDate();
    let html = '';
    for (let i = 0; i < mondayPad; i++) html += '<div class="inline-cal-pad" aria-hidden="true"></div>';
    for (let d = 1; d <= dim; d++) {
        const ms = new Date(year, month0, d).getTime();
        const iso = _isoFromYMD(year, month0, d);
        const slot = slotMap ? slotMap[iso] : null;
        const booked = bookedRanges && _dayInBookedRanges(ms, bookedRanges);
        const past = ms < todayMs;
        const hasSlot = !!slot;
        const canPick = !!addMode && !past && !booked;
        const clickable = !addMode && hasSlot && !booked;

        let cls = 'inline-cal-day inline-cal-day--stacked';
        if (!hasSlot) cls += ' inline-cal-day--disabled';
        if (booked) cls += ' inline-cal-day--booked inline-cal-day--disabled';

        if (addMode) {
            const aIso = rangeStartIso;
            const bIso = rangeEndIso;
            if (aIso && iso === aIso) cls += ' inline-cal-day--range-start';
            else if (bIso && iso === bIso) cls += ' inline-cal-day--range-end';
            else if (aIso && bIso) {
                const a = _stripDay(_parseIsoLocal(aIso));
                const b = _stripDay(_parseIsoLocal(bIso));
                if (ms > a && ms < b) cls += ' inline-cal-day--in-range';
            } else if (aIso && !bIso && iso === aIso) {
                cls += ' inline-cal-day--range-start';
            }
        }

        let style = '';
        let label = '';
        if (hasSlot) {
            if (booked) {
                style = 'style="opacity:0.75; cursor:not-allowed;"';
                label = '<div style="font-size:0.62rem; margin-top:2px; color:#b45309;">Rezerve</div>';
            } else if (slot.is_available) {
                style = 'style="border-color:#10b981; background:#f0fdf4;"';
                label = '<div style="font-size:0.62rem; margin-top:2px; color:#10b981;">Açık</div>';
            } else {
                style = 'style="border-color:#ef4444; background:#fef2f2;"';
                label = '<div style="font-size:0.62rem; margin-top:2px; color:#ef4444;">Kapalı</div>';
            }
        } else {
            if (addMode && !past && !booked) {
                style = 'style="opacity:0.9;"';
                label = '<div style="font-size:0.62rem; margin-top:2px; color:#94a3b8;">Ekle</div>';
                cls = cls.replace(' inline-cal-day--disabled', '');
            } else {
                style = 'style="opacity:0.45; cursor:not-allowed;"';
                label = '<div style="font-size:0.62rem; margin-top:2px; color:#94a3b8;">Yok</div>';
            }
        }

        const onclk = clickable
            ? ` onclick="${onToggleFn}('${iso}')"`
            : (canPick ? ` onclick="${onPickFn}('${iso}')"` : '');
        html += `<button type="button" class="${cls}" data-iso="${iso}"${onclk} ${style}><div class="inline-cal-daynum">${d}</div>${label}</button>`;
    }
    return html;
}

window._hotelAvailCtx = null;

window.openHotelAvailCalendar = async (serviceId, gridId) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || '';
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '<div class="loading-row" style="grid-column:1/-1;">Yükleniyor...</div>';

    try {
        const prev = (window._hotelAvailCtx && window._hotelAvailCtx.serviceId === serviceId && window._hotelAvailCtx.gridId === gridId)
            ? window._hotelAvailCtx
            : null;
        const slots = role === 'business_owner'
            ? await API.business.getSlots(serviceId, '')
            : await API.staff.getSlots(serviceId, '');
        const avail = await API.customer.getAvailability(serviceId);
        const bookedRanges = (avail && avail.booked_ranges) ? avail.booked_ranges : [];

        const slotMap = {};
        (slots || []).forEach(s => { slotMap[s.date] = s; });

        const base = new Date();
        base.setHours(0, 0, 0, 0);
        window._hotelAvailCtx = {
            serviceId,
            gridId,
            y: prev ? prev.y : base.getFullYear(),
            m: prev ? prev.m : base.getMonth(),
            slotMap,
            bookedRanges,
            role,
            allowAdd: role === 'business_owner' || role === 'staff',
            addMode: prev ? !!prev.addMode : false,
            rangeStartIso: prev ? (prev.rangeStartIso || null) : null,
            rangeEndIso: prev ? (prev.rangeEndIso || null) : null
        };
        window.paintHotelAvailCalendar();
    } catch (e) {
        grid.innerHTML = `<p style="color:var(--error); grid-column:1/-1;">${e.message}</p>`;
    }
};

window.shiftHotelAvailMonth = (delta) => {
    if (!window._hotelAvailCtx) return;
    let { y, m } = window._hotelAvailCtx;
    m += delta;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    window._hotelAvailCtx.y = y;
    window._hotelAvailCtx.m = m;
    window.paintHotelAvailCalendar();
};

window.paintHotelAvailCalendar = () => {
    if (!window._hotelAvailCtx) return;
    const { y, m, gridId, slotMap, bookedRanges, allowAdd, addMode, rangeStartIso, rangeEndIso } = window._hotelAvailCtx;
    const root = document.getElementById(gridId);
    if (!root) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const rangeText = rangeStartIso
        ? (rangeEndIso ? `${rangeStartIso} → ${rangeEndIso}` : `${rangeStartIso} → ?`)
        : 'Seçim yok';

    root.innerHTML = `
        <div class="inline-cal-nav">
            <button type="button" class="btn btn-sm btn-outline" onclick="window.shiftHotelAvailMonth(-1)">‹</button>
            <span>${_TR_MONTHS[m]} ${y}</span>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.shiftHotelAvailMonth(1)">›</button>
        </div>
        ${allowAdd ? `
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; justify-content:space-between; margin-bottom:0.6rem;">
                <div style="font-size:0.82rem; color:var(--text-muted);">
                    <strong style="color:var(--primary);">Aralık:</strong> ${rangeText}
                </div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:flex-end;">
                    <button type="button" class="btn btn-sm ${addMode ? 'btn-primary' : 'btn-outline'}" onclick="window.toggleHotelAvailAddMode()">
                        ${addMode ? 'Seçimi Kapat' : 'Aralık Seç'}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.clearHotelAvailRange()" ${!rangeStartIso ? 'disabled' : ''}>
                        Temizle
                    </button>
                    <button type="button" class="btn btn-sm btn-primary" onclick="window.applyHotelAvailRangeAdd()" ${!(rangeStartIso && rangeEndIso) ? 'disabled' : ''}>
                        Aralığı Aç
                    </button>
                </div>
            </div>
            <div style="font-size:0.75rem; color:#666; margin-bottom:0.5rem;">
                ${addMode ? 'Takvimden ilk günü, sonra son günü seç.' : 'Slot eklemek için "Aralık Seç"i aç.'}
            </div>
        ` : ''}
        <div class="inline-cal-weekdays">
            <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
        </div>
        <div class="inline-cal-grid">
            ${_buildAdminHotelMonthGrid(y, m, {
                todayMs,
                slotMap,
                bookedRanges,
                onToggleFn: 'window.toggleHotelAvailDay',
                onPickFn: 'window.pickHotelAvailRangeDay',
                addMode,
                rangeStartIso,
                rangeEndIso
            })}
        </div>
    `;
};

window.toggleHotelAvailDay = async (iso) => {
    if (!window._hotelAvailCtx) return;
    if (window._hotelAvailCtx.addMode) return;
    const slot = window._hotelAvailCtx.slotMap ? window._hotelAvailCtx.slotMap[iso] : null;
    if (!slot) return;
    // bookedRanges already disables click; keep a guard anyway
    const ms = _stripDay(_parseIsoLocal(iso));
    if (window._hotelAvailCtx.bookedRanges && _dayInBookedRanges(ms, window._hotelAvailCtx.bookedRanges)) {
        showToast('Bu tarih rezerve. İptal etmeden kapatamazsınız.', 'error');
        return;
    }
    try {
        await window.toggleSlotAvailability(slot.id, window._hotelAvailCtx.serviceId, true);
    } catch (_) {
        // toggleSlotAvailability already shows toast
    }
};

window.toggleHotelAvailAddMode = () => {
    if (!window._hotelAvailCtx || !window._hotelAvailCtx.allowAdd) return;
    window._hotelAvailCtx.addMode = !window._hotelAvailCtx.addMode;
    window.paintHotelAvailCalendar();
};

window.clearHotelAvailRange = () => {
    if (!window._hotelAvailCtx) return;
    window._hotelAvailCtx.rangeStartIso = null;
    window._hotelAvailCtx.rangeEndIso = null;
    window.paintHotelAvailCalendar();
};

window.pickHotelAvailRangeDay = (iso) => {
    if (!window._hotelAvailCtx || !window._hotelAvailCtx.addMode) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ms = _stripDay(_parseIsoLocal(iso));
    if (ms < today.getTime()) return;
    if (window._hotelAvailCtx.bookedRanges && _dayInBookedRanges(ms, window._hotelAvailCtx.bookedRanges)) {
        showToast('Bu gün rezerve (kilitli).', 'error');
        return;
    }

    const a = window._hotelAvailCtx.rangeStartIso;
    const b = window._hotelAvailCtx.rangeEndIso;
    if (!a || (a && b)) {
        window._hotelAvailCtx.rangeStartIso = iso;
        window._hotelAvailCtx.rangeEndIso = null;
    } else {
        const aMs = _stripDay(_parseIsoLocal(a));
        if (ms < aMs) {
            window._hotelAvailCtx.rangeStartIso = iso;
            window._hotelAvailCtx.rangeEndIso = a;
        } else {
            window._hotelAvailCtx.rangeEndIso = iso;
        }
    }
    window.paintHotelAvailCalendar();
};

window.applyHotelAvailRangeAdd = async () => {
    if (!window._hotelAvailCtx || !window._hotelAvailCtx.allowAdd) return;
    const { serviceId, gridId, rangeStartIso, rangeEndIso, role } = window._hotelAvailCtx;
    if (!(rangeStartIso && rangeEndIso)) return;
    try {
        const res = (role === 'business_owner')
            ? await API.business.generateSlots(serviceId, { start_date: rangeStartIso, end_date: rangeEndIso })
            : await API.staff.generateSlots(serviceId, { start_date: rangeStartIso, end_date: rangeEndIso });
        showToast(res.msg || 'Tarih aralığı açıldı.', 'success');
        await window.openHotelAvailCalendar(serviceId, gridId);
        if (window._hotelAvailCtx) window._hotelAvailCtx.addMode = true;
        window.paintHotelAvailCalendar();
    } catch (e) {
        showToast(e.message, 'error');
    }
};

// --- Admin (business/staff) appointment availability generator (range picker) ---
function _buildAdminRangeMonthGrid(year, month0, ctx) {
    const { todayMs, disabledDaySet, onPickFn, addMode, rangeStartIso, rangeEndIso } = ctx;
    const first = new Date(year, month0, 1);
    const mondayPad = (first.getDay() + 6) % 7;
    const dim = new Date(year, month0 + 1, 0).getDate();
    let html = '';
    for (let i = 0; i < mondayPad; i++) html += '<div class="inline-cal-pad" aria-hidden="true"></div>';
    for (let d = 1; d <= dim; d++) {
        const ms = new Date(year, month0, d).getTime();
        const iso = _isoFromYMD(year, month0, d);
        const past = ms < todayMs;
        const hasExisting = disabledDaySet && disabledDaySet.has(iso);

        let cls = 'inline-cal-day inline-cal-day--stacked';
        let style = '';
        let label = '';

        if (past || hasExisting) {
            cls += ' inline-cal-day--disabled';
            style = 'style="opacity:0.55; cursor:not-allowed;"';
            label = hasExisting ? '<div style="font-size:0.62rem; margin-top:2px; color:#64748b;">Mevcut</div>' : '<div style="font-size:0.62rem; margin-top:2px; color:#94a3b8;">Geçmiş</div>';
        } else if (!addMode) {
            cls += ' inline-cal-day--disabled';
            style = 'style="opacity:0.65; cursor:not-allowed;"';
            label = '<div style="font-size:0.62rem; margin-top:2px; color:#94a3b8;">Seç</div>';
        } else {
            label = '<div style="font-size:0.62rem; margin-top:2px; color:#94a3b8;">Ekle</div>';
        }

        if (addMode) {
            const aIso = rangeStartIso;
            const bIso = rangeEndIso;
            if (aIso && iso === aIso) cls += ' inline-cal-day--range-start';
            else if (bIso && iso === bIso) cls += ' inline-cal-day--range-end';
            else if (aIso && bIso) {
                const a = _stripDay(_parseIsoLocal(aIso));
                const b = _stripDay(_parseIsoLocal(bIso));
                if (ms > a && ms < b) cls += ' inline-cal-day--in-range';
            } else if (aIso && !bIso && iso === aIso) {
                cls += ' inline-cal-day--range-start';
            }
        }

        const canPick = addMode && !past && !hasExisting;
        const onclk = canPick ? ` onclick="${onPickFn}('${iso}')"` : '';
        html += `<button type="button" class="${cls}" data-iso="${iso}"${onclk} ${style}><div class="inline-cal-daynum">${d}</div>${label}</button>`;
    }
    return html;
}

window._apptAvailCtx = null;

window.openApptAvailCalendar = async (serviceId, gridId, summaryId = null) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || '';
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '<div class="loading-row">Yükleniyor...</div>';

    try {
        const prev = (window._apptAvailCtx && window._apptAvailCtx.serviceId === serviceId && window._apptAvailCtx.gridId === gridId)
            ? window._apptAvailCtx
            : null;

        const slots = role === 'business_owner'
            ? await API.business.getSlots(serviceId, '')
            : await API.staff.getSlots(serviceId, '');

        const daySet = new Set();
        (slots || []).forEach(s => { if (s && s.date) daySet.add(s.date); });

        // Optional summary block (min/max/available)
        if (summaryId) {
            try {
                const sum = role === 'business_owner'
                    ? await API.business.getAvailabilitySummary(serviceId)
                    : await API.staff.getAvailabilitySummary(serviceId);
                const box = document.getElementById(summaryId);
                if (box) {
                    box.innerHTML = sum && sum.min_date ? `
                        <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #666;">Mevcut Müsaitlik Dönemi</h4>
                        <p style="font-size: 1.05rem; font-weight: 600; color: var(--accent);">
                            ${new Date(sum.min_date).toLocaleDateString('tr-TR')} - ${new Date(sum.max_date).toLocaleDateString('tr-TR')}
                        </p>
                        <p style="font-size: 0.85rem; color: #666; margin-top: 0.3rem;">
                            Toplam ${sum.total_slots} slot, ${sum.available_slots} slot müsait
                        </p>
                    ` : `<p style="color:#999;">Henüz müsaitlik yok</p>`;
                }
            } catch (_) {}
        }

        const base = new Date();
        base.setHours(0, 0, 0, 0);
        window._apptAvailCtx = {
            serviceId,
            gridId,
            summaryId,
            role,
            y: prev ? prev.y : base.getFullYear(),
            m: prev ? prev.m : base.getMonth(),
            existingDaySet: daySet,
            addMode: prev ? !!prev.addMode : true,
            rangeStartIso: prev ? (prev.rangeStartIso || null) : null,
            rangeEndIso: prev ? (prev.rangeEndIso || null) : null
        };
        window.paintApptAvailCalendar();
    } catch (e) {
        grid.innerHTML = `<p style="color:var(--error);">${e.message}</p>`;
    }
};

window.shiftApptAvailMonth = (delta) => {
    if (!window._apptAvailCtx) return;
    let { y, m } = window._apptAvailCtx;
    m += delta;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    window._apptAvailCtx.y = y;
    window._apptAvailCtx.m = m;
    window.paintApptAvailCalendar();
};

window.clearApptAvailRange = () => {
    if (!window._apptAvailCtx) return;
    window._apptAvailCtx.rangeStartIso = null;
    window._apptAvailCtx.rangeEndIso = null;
    window.paintApptAvailCalendar();
};

window.pickApptAvailRangeDay = (iso) => {
    if (!window._apptAvailCtx || !window._apptAvailCtx.addMode) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ms = _stripDay(_parseIsoLocal(iso));
    if (ms < today.getTime()) return;
    if (window._apptAvailCtx.existingDaySet && window._apptAvailCtx.existingDaySet.has(iso)) return;

    const a = window._apptAvailCtx.rangeStartIso;
    const b = window._apptAvailCtx.rangeEndIso;
    if (!a || (a && b)) {
        window._apptAvailCtx.rangeStartIso = iso;
        window._apptAvailCtx.rangeEndIso = null;
    } else {
        const aMs = _stripDay(_parseIsoLocal(a));
        if (ms < aMs) {
            window._apptAvailCtx.rangeStartIso = iso;
            window._apptAvailCtx.rangeEndIso = a;
        } else {
            window._apptAvailCtx.rangeEndIso = iso;
        }
    }
    window.paintApptAvailCalendar();
};

window.applyApptAvailRangeAdd = async () => {
    if (!window._apptAvailCtx) return;
    const { serviceId, gridId, summaryId, rangeStartIso, rangeEndIso, role } = window._apptAvailCtx;
    if (!(rangeStartIso && rangeEndIso)) return;
    try {
        const res = role === 'business_owner'
            ? await API.business.generateSlots(serviceId, { start_date: rangeStartIso, end_date: rangeEndIso })
            : await API.staff.generateSlots(serviceId, { start_date: rangeStartIso, end_date: rangeEndIso });
        showToast(res.msg || 'Müsaitlik oluşturuldu.', 'success');
        await window.openApptAvailCalendar(serviceId, gridId, summaryId);
    } catch (e) { showToast(e.message, 'error'); }
};

window.paintApptAvailCalendar = () => {
    if (!window._apptAvailCtx) return;
    const { y, m, gridId, existingDaySet, addMode, rangeStartIso, rangeEndIso } = window._apptAvailCtx;
    const root = document.getElementById(gridId);
    if (!root) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const rangeText = rangeStartIso
        ? (rangeEndIso ? `${rangeStartIso} → ${rangeEndIso}` : `${rangeStartIso} → ?`)
        : 'Seçim yok';

    root.innerHTML = `
        <div class="inline-cal-nav">
            <button type="button" class="btn btn-sm btn-outline" onclick="window.shiftApptAvailMonth(-1)">‹</button>
            <span>${_TR_MONTHS[m]} ${y}</span>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.shiftApptAvailMonth(1)">›</button>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; justify-content:space-between; margin-bottom:0.6rem;">
            <div style="font-size:0.82rem; color:var(--text-muted);">
                <strong style="color:var(--primary);">Aralık:</strong> ${rangeText}
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:flex-end;">
                <button type="button" class="btn btn-sm ${addMode ? 'btn-primary' : 'btn-outline'}" onclick="window._apptAvailCtx.addMode=!window._apptAvailCtx.addMode; window.paintApptAvailCalendar();">
                    ${addMode ? 'Seçimi Kapat' : 'Aralık Seç'}
                </button>
                <button type="button" class="btn btn-sm btn-outline" onclick="window.clearApptAvailRange()" ${!rangeStartIso ? 'disabled' : ''}>Temizle</button>
                <button type="button" class="btn btn-sm btn-primary" onclick="window.applyApptAvailRangeAdd()" ${!(rangeStartIso && rangeEndIso) ? 'disabled' : ''}>Aralığı Aç</button>
            </div>
        </div>
        <div class="inline-cal-weekdays">
            <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
        </div>
        <div class="inline-cal-grid">
            ${_buildAdminRangeMonthGrid(y, m, {
                todayMs,
                disabledDaySet: existingDaySet,
                onPickFn: 'window.pickApptAvailRangeDay',
                addMode,
                rangeStartIso,
                rangeEndIso
            })}
        </div>
        <div class="inline-cal-legend">
            <span><i style="border-color:#10b981;background:#f0fdf4;"></i> Seçilebilir</span>
            <span><i style="border-color:#cbd5e1;background:#f1f5f9;"></i> Mevcut</span>
        </div>
    `;
};

window._roomBookingData = { roomId: null, price: 0, bookedRanges: [] };
window._roomModalCtx = { mode: 'create', reservationId: null, onSuccess: null };

window.openRoomBookingModal = async (roomId, roomName, roomType, price, ctx = {}) => {
    const mode = ctx.mode === 'modify' ? 'modify' : 'create';
    window._roomModalCtx = {
        mode,
        reservationId: ctx.reservationId || null,
        onSuccess: typeof ctx.onSuccess === 'function' ? ctx.onSuccess : null
    };

    window._roomBookingData = { roomId, price, bookedRanges: [] };
    window._hotelModalCalMonth = { y: new Date().getFullYear(), m: new Date().getMonth() };

    const guestsBlock = mode === 'modify' ? '' : `
        <div style="padding: 1.5rem; background: #f9fafb; border-radius: 12px; margin-bottom: 1.5rem;">
            <p style="font-weight: 600; margin-bottom: 1rem;">Misafir Sayısı</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <label style="font-size: 0.85rem; color: #666; display: block; margin-bottom: 0.3rem;">Yetişkin</label>
                    <select id="modal-adults" class="pretty-select">
                        <option value="1">1 Yetişkin</option>
                        <option value="2" selected>2 Yetişkin</option>
                        <option value="3">3 Yetişkin</option>
                        <option value="4">4 Yetişkin</option>
                    </select>
                </div>
                <div>
                    <label style="font-size: 0.85rem; color: #666; display: block; margin-bottom: 0.3rem;">Çocuk</label>
                    <select id="modal-children" class="pretty-select">
                        <option value="0" selected>0 Çocuk</option>
                        <option value="1">1 Çocuk</option>
                        <option value="2">2 Çocuk</option>
                        <option value="3">3 Çocuk</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    const priceSummary = (mode === 'modify' || !price) ? '' : `
        <div id="room-price-summary" style="display: none; padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-bottom: 1.5rem; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="font-size: 0.9rem; opacity: 0.9;">Toplam (<span id="room-nights-count">0</span> gece)</p>
                    <p style="font-size: 1.8rem; font-weight: 700;" id="room-total-price">0 ₺</p>
                </div>
                <div id="room-date-range" style="text-align: right; font-size: 0.85rem; opacity: 0.9;"></div>
            </div>
        </div>
    `;

    const noteVal = String(ctx.initialNote ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const primaryLabel = mode === 'modify' ? 'Kaydet' : 'Rezervasyon Yap';

    const html = `
        <div style="margin-bottom: 1.5rem;">
            <p style="color: #666; margin-bottom: 0.5rem;">${roomType}</p>
            ${price && mode !== 'modify' ? `<p style="font-size: 1.3rem; font-weight: 700; color: var(--accent);">${price.toLocaleString('tr-TR')} ₺ <small style="font-size: 0.8rem; font-weight: 400; color: #999;">/ gece</small></p>` : ''}
        </div>
        
        <div style="padding: 1.5rem; background: #f9fafb; border-radius: 12px; margin-bottom: 1.5rem;">
            <p style="font-weight: 600; margin-bottom: 0.35rem;">Giriş ve çıkış tarihleri</p>
            <p style="font-size: 0.82rem; color: #666; margin-bottom: 1rem;">Önce giriş gününe, sonra çıkış gününe tıklayın.${mode === 'modify' ? ' Kendi rezervasyonunuzdaki günler müsait sayılır; yalnızca başkalarının tarihleri dolu görünür.' : ' Dolu günler seçilemez.'}</p>
            <input type="hidden" id="modal-check-in" value="">
            <input type="hidden" id="modal-check-out" value="">
            <div id="modal-room-calendar">Yükleniyor…</div>
        </div>
        
        ${guestsBlock}
        ${priceSummary}
        
        <div class="form-group" style="margin-bottom: 1rem;">
            <label style="font-size: 0.85rem; color: #666;">Not (opsiyonel)</label>
            <textarea id="modal-note" rows="2" style="width: 100%; padding: 0.8rem; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.95rem; resize: none;" placeholder="Özel istekleriniz...">${noteVal}</textarea>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button class="btn btn-outline" style="flex: 1;" onclick="closeModal()">İptal</button>
            <button class="btn btn-primary" style="flex: 1;" id="room-book-btn" onclick="window.confirmRoomBooking()">${primaryLabel}</button>
        </div>
    `;
    
    showModal(`${roomName}`, html);
    await window.initHotelModalCalendar(roomId, {
        preserveSelection: mode === 'modify',
        initialCheckIn: ctx.initialCheckIn || '',
        initialCheckOut: ctx.initialCheckOut || ''
    });
};

window.calculateRoomPrice = () => {
    const checkIn = document.getElementById('modal-check-in')?.value;
    const checkOut = document.getElementById('modal-check-out')?.value;
    const summaryEl = document.getElementById('room-price-summary');
    if (!summaryEl) return;

    if (!checkIn || !checkOut) {
        summaryEl.style.display = 'none';
        return;
    }
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    if (end <= start) {
        summaryEl.style.display = 'none';
        return;
    }
    
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const total = nights * (window._roomBookingData.price || 0);

    const nEl = document.getElementById('room-nights-count');
    const pEl = document.getElementById('room-total-price');
    const rEl = document.getElementById('room-date-range');
    if (nEl) nEl.textContent = nights;
    if (pEl) pEl.textContent = total.toLocaleString('tr-TR') + ' ₺';
    if (rEl) rEl.innerHTML = `${start.toLocaleDateString('tr-TR')}<br>→ ${end.toLocaleDateString('tr-TR')}`;
    summaryEl.style.display = 'block';
};

window.onHotelModalDayPick = function (iso) {
    const inEl = document.getElementById('modal-check-in');
    const outEl = document.getElementById('modal-check-out');
    if (!inEl || !outEl) return;
    let ci = inEl.value;
    let co = outEl.value;
    if (ci && co) {
        ci = iso;
        co = '';
    } else if (!ci) {
        ci = iso;
    } else {
        const tClick = _stripDay(_parseIsoLocal(iso));
        const tIn = _stripDay(_parseIsoLocal(ci));
        if (tClick <= tIn) {
            ci = iso;
            co = '';
        } else {
            co = iso;
        }
    }
    inEl.value = ci;
    outEl.value = co;
    window.paintHotelModalCalendar();
    window.calculateRoomPrice();
};

window.shiftHotelModalMonth = function (delta) {
    let { y, m } = window._hotelModalCalMonth;
    m += delta;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);
    const minMs = new Date(t0.getFullYear(), t0.getMonth(), 1).getTime();
    if (new Date(y, m, 1).getTime() < minMs) return;
    window._hotelModalCalMonth = { y, m };
    window.paintHotelModalCalendar();
};

window.paintHotelModalCalendar = function () {
    const root = document.getElementById('modal-room-calendar');
    if (!root || !window._hotelModalCalMonth) return;
    const { y, m } = window._hotelModalCalMonth;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const now = new Date();
    const disableTodayCheckIn = now.getHours() >= 12;
    const ranges = window._roomBookingData.bookedRanges || [];
    const ci = document.getElementById('modal-check-in')?.value || '';
    const co = document.getElementById('modal-check-out')?.value || '';
    const gridHtml = _buildInlineMonthGrid(y, m, {
        todayMs,
        bookedRanges: ranges,
        mode: 'range',
        singleIso: null,
        checkInIso: ci,
        checkOutIso: co,
        onPickFn: 'window.onHotelModalDayPick',
        disableToday: disableTodayCheckIn
    });
    const title = `${_TR_MONTHS[m]} ${y}`;
    const atMinMonth = new Date(y, m, 1).getTime() <= new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    root.innerHTML = `
        <div class="inline-cal-nav">
            <button type="button" class="btn btn-sm btn-outline" ${atMinMonth ? 'disabled style="opacity:0.45"' : ''} onclick="window.shiftHotelModalMonth(-1)">‹</button>
            <span>${title}</span>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.shiftHotelModalMonth(1)">›</button>
        </div>
        <div class="inline-cal-weekdays">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((x) => `<div>${x}</div>`).join('')}</div>
        <div class="inline-cal-grid">${gridHtml}</div>
        <div class="inline-cal-legend">
            <span><i></i> Müsait</span>
            <span><i class="booked"></i> Dolu</span>
        </div>
    `;
};

window.initHotelModalCalendar = async function (roomId, opts = {}) {
    const root = document.getElementById('modal-room-calendar');
    if (!root) return;
    root.innerHTML = '<p style="color:#666;">Yükleniyor…</p>';
    try {
        const exId = (window._roomModalCtx?.mode === 'modify' && window._roomModalCtx?.reservationId)
            ? window._roomModalCtx.reservationId
            : null;
        const avail = exId
            ? await API.customer.getAvailability(roomId, { excludeReservationId: exId })
            : await API.customer.getAvailability(roomId);
        window._roomBookingData.bookedRanges = avail.booked_ranges || [];
        window._roomBookingData.roomId = roomId;
        const cin = document.getElementById('modal-check-in');
        const cout = document.getElementById('modal-check-out');
        const preserve = !!opts.preserveSelection;
        if (!preserve) {
            if (cin) cin.value = '';
            if (cout) cout.value = '';
        } else if (opts.initialCheckIn && opts.initialCheckOut) {
            if (cin) cin.value = opts.initialCheckIn;
            if (cout) cout.value = opts.initialCheckOut;
        }

        const base = opts.initialCheckIn ? _parseIsoLocal(opts.initialCheckIn) : new Date();
        window._hotelModalCalMonth = { y: base.getFullYear(), m: base.getMonth() };
        window.paintHotelModalCalendar();
        window.calculateRoomPrice();
    } catch (e) {
        root.innerHTML = `<p style="color:var(--error);">${e.message}</p>`;
    }
};

window.confirmRoomBooking = async () => {
    if (!localStorage.getItem('token')) {
        showToast("Rezervasyon yapabilmek için giriş yapmalısınız.", "error");
        setTimeout(() => { window.location.hash = '#login'; }, 1500);
        return;
    }
    
    const checkIn = document.getElementById('modal-check-in').value;
    const checkOut = document.getElementById('modal-check-out').value;
    
    if (!checkIn || !checkOut) {
        showToast('Lütfen giriş ve çıkış tarihi seçin.', 'error');
        return;
    }
    
    if (new Date(checkOut) <= new Date(checkIn)) {
        showToast('Çıkış tarihi girişten sonra olmalı.', 'error');
        return;
    }
    
    const isBooked = window._roomBookingData.bookedRanges?.some(r => {
        return (new Date(checkIn) < new Date(r.check_out)) && (new Date(checkOut) > new Date(r.check_in));
    });
    
    if (isBooked) {
        showToast('Seçilen tarihler için bu oda dolu.', 'error');
        return;
    }
    
    const btn = document.getElementById('room-book-btn');
    btn.disabled = true;
    btn.textContent = 'İşleniyor...';
    
    try {
        if (window._roomModalCtx?.mode === 'modify' && window._roomModalCtx.reservationId) {
            const noteEl = document.getElementById('modal-note');
            await API.customer.modifyReservation(window._roomModalCtx.reservationId, {
                check_in: checkIn,
                check_out: checkOut,
                note: noteEl ? noteEl.value : ''
            });
            closeModal();
            showToast('Rezervasyon güncellendi');
            if (window._roomModalCtx.onSuccess) window._roomModalCtx.onSuccess();
            else window.location.hash = '#reservations';
        } else {
            const adultsEl = document.getElementById('modal-adults');
            const childrenEl = document.getElementById('modal-children');
            await API.customer.createReservation({
                service_id: window._roomBookingData.roomId,
                check_in: checkIn,
                check_out: checkOut,
                note: document.getElementById('modal-note').value,
                guests: {
                    adults: adultsEl ? adultsEl.value : 1,
                    children: childrenEl ? childrenEl.value : 0
                }
            });
            closeModal();
            showToast("Rezervasyon başarıyla oluşturuldu!");
            window.location.hash = '#reservations';
        }
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = window._roomModalCtx?.mode === 'modify' ? 'Kaydet' : 'Rezervasyon Yap';
    }
};

window._apptBookingData = { serviceId: null, price: 0 };
window._apptModalCtx = { mode: 'create', reservationId: null, keepSlotId: null, onSuccess: null };

window.openAppointmentModal = async (serviceId, serviceName, price, ctx = {}) => {
    const mode = ctx.mode === 'modify' ? 'modify' : 'create';
    window._apptModalCtx = {
        mode,
        reservationId: ctx.reservationId || null,
        keepSlotId: ctx.keepSlotId || null,
        onSuccess: typeof ctx.onSuccess === 'function' ? ctx.onSuccess : null
    };

    window._apptBookingData = { serviceId, price };
    window._apptModalServiceId = serviceId;

    const noteVal = String(ctx.initialNote ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const primaryLabel = mode === 'modify' ? 'Kaydet' : 'Rezervasyon Yap';

    const priceSummaryBlock = (mode === 'modify' || !price) ? '' : `
        <div id="appt-price-summary" style="display: none; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-bottom: 1.5rem; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span id="appt-selected-time" style="font-size: 0.95rem;"></span>
                <span style="font-size: 1.3rem; font-weight: 700;">${price ? price.toLocaleString('tr-TR') + ' ₺' : ''}</span>
            </div>
        </div>
    `;

    const html = `
        ${price && mode !== 'modify' ? `<div style="margin-bottom: 1.5rem;"><p style="font-size: 1.3rem; font-weight: 700; color: var(--accent);">${price.toLocaleString('tr-TR')} ₺</p></div>` : ''}
        
        <div style="padding: 1.5rem; background: #f9fafb; border-radius: 12px; margin-bottom: 1.5rem;">
            <p style="font-weight: 600; margin-bottom: 0.35rem;">1. Gün seçin</p>
            <p style="font-size: 0.82rem; color: #666; margin-bottom: 1rem;">Takvimden bir güne tıklayın; ardından saatleri seçin.</p>
            <input type="hidden" id="modal-appt-date" value="">
            <div id="modal-appt-calendar-wrap"></div>
        </div>
        
        <div style="padding: 1.5rem; background: #f9fafb; border-radius: 12px; margin-bottom: 1.5rem;">
            <p style="font-weight: 600; margin-bottom: 1rem;">2. Saat Seçin</p>
            <div id="modal-appt-slots" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">
                <p style="grid-column: 1/-1; color: #999; text-align: center;">Önce takvimden gün seçin</p>
            </div>
        </div>
        
        <div class="form-group" style="margin-bottom: 1rem;">
            <label style="font-size: 0.85rem; color: #666;">Not (opsiyonel)</label>
            <textarea id="modal-appt-note" rows="2" style="width: 100%; padding: 0.8rem; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.95rem; resize: none;" placeholder="Özel istekleriniz...">${noteVal}</textarea>
        </div>
        
        ${priceSummaryBlock}
        
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button class="btn btn-outline" style="flex: 1;" onclick="closeModal()">İptal</button>
            <button class="btn btn-primary" style="flex: 1;" id="appt-book-btn" onclick="window.confirmAppointmentBooking()">${primaryLabel}</button>
        </div>
    `;
    
    showModal(`${serviceName}`, html);

    const hid = document.getElementById('modal-appt-date');
    if (mode === 'modify' && ctx.initialDate && hid) {
        hid.value = ctx.initialDate;
        const d0 = _parseIsoLocal(ctx.initialDate) || new Date();
        window._apptModalCalMonth = { y: d0.getFullYear(), m: d0.getMonth() };
    } else {
        window._apptModalCalMonth = { y: new Date().getFullYear(), m: new Date().getMonth() };
    }

    window._selectedAppointmentSlot = (mode === 'modify' && ctx.keepSlotId) ? ctx.keepSlotId : null;
    window.paintApptModalCalendar();

    if (mode === 'modify' && ctx.initialDate) {
        await window.loadModalAppointmentSlots(serviceId);
        // keepSlotId sadece ilk yüklemede "mevcut slotu" seçmek için kullanılsın
        window._apptModalCtx.keepSlotId = null;
    }
};

window.onApptModalDayPick = function (iso) {
    const hid = document.getElementById('modal-appt-date');
    if (!hid) return;
    const prev = hid.value;
    hid.value = iso;
    if (prev !== iso) {
        window._selectedAppointmentSlot = null;
        window.paintApptModalCalendar();
        window.loadModalAppointmentSlots(window._apptModalServiceId);
    } else {
        window.paintApptModalCalendar();
    }
};

window.shiftApptModalMonth = function (delta) {
    let { y, m } = window._apptModalCalMonth;
    m += delta;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);
    const minMs = new Date(t0.getFullYear(), t0.getMonth(), 1).getTime();
    if (new Date(y, m, 1).getTime() < minMs) return;
    window._apptModalCalMonth = { y, m };
    window.paintApptModalCalendar();
};

window.paintApptModalCalendar = function () {
    const root = document.getElementById('modal-appt-calendar-wrap');
    if (!root || !window._apptModalCalMonth) return;
    const { y, m } = window._apptModalCalMonth;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const sel = document.getElementById('modal-appt-date')?.value || '';
    const gridHtml = _buildInlineMonthGrid(y, m, {
        todayMs,
        bookedRanges: null,
        mode: 'single',
        singleIso: sel,
        checkInIso: null,
        checkOutIso: null,
        onPickFn: 'window.onApptModalDayPick'
    });
    const title = `${_TR_MONTHS[m]} ${y}`;
    const atMinMonth = new Date(y, m, 1).getTime() <= new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    root.innerHTML = `
        <div class="inline-cal-nav">
            <button type="button" class="btn btn-sm btn-outline" ${atMinMonth ? 'disabled style="opacity:0.45"' : ''} onclick="window.shiftApptModalMonth(-1)">‹</button>
            <span>${title}</span>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.shiftApptModalMonth(1)">›</button>
        </div>
        <div class="inline-cal-weekdays">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((x) => `<div>${x}</div>`).join('')}</div>
        <div class="inline-cal-grid">${gridHtml}</div>
    `;
};

window.loadModalAppointmentSlots = async (serviceId) => {
    const container = document.getElementById('modal-appt-slots');
    const date = document.getElementById('modal-appt-date')?.value;
    
    if (!date) return;
    
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Yükleniyor...</p>';
    
    try {
        const data = await API.customer.getAvailability(serviceId, date);
        
        if (data.slots && data.slots.length > 0) {
            const keepId = window._apptModalCtx?.keepSlotId;
            container.innerHTML = data.slots.map(s => {
                const mine = keepId && s.id === keepId;
                const clickable = s.is_available || mine;
                const cls = clickable ? 'available' : 'booked';
                const cur = mine ? ' selected' : '';
                return `
                <div class="slot-item ${cls}${cur}" 
                     style="padding: 0.6rem; text-align: center; border-radius: 6px; cursor: ${clickable ? 'pointer' : 'not-allowed'}; font-size: 0.9rem;"
                     onclick="${clickable ? `window.selectModalSlot(${s.id}, this)` : ''}">
                    ${s.start_time.substring(0, 5)}
                </div>
            `;
            }).join('');

            if (keepId) {
                const el = Array.from(container.querySelectorAll('.slot-item')).find(n => n.getAttribute('onclick')?.includes(`selectModalSlot(${keepId}`));
                if (el) window.selectModalSlot(keepId, el);
            }
        } else {
            container.innerHTML = '<p style="grid-column: 1/-1; color: #999; text-align: center;">Bu tarihte müsait saat bulunamadı.</p>';
        }
    } catch (e) {
        container.innerHTML = `<p style="grid-column: 1/-1; color: red; text-align: center;">Hata: ${e.message}</p>`;
    }
};

window.selectModalSlot = (slotId, el) => {
    document.querySelectorAll('#modal-appt-slots .slot-item').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    window._selectedAppointmentSlot = slotId;
    
    const summaryEl = document.getElementById('appt-price-summary');
    const date = document.getElementById('modal-appt-date').value;
    const time = el.textContent.trim();
    
    if (summaryEl && date) {
        const dateObj = new Date(date);
        document.getElementById('appt-selected-time').textContent = `${dateObj.toLocaleDateString('tr-TR')} - ${time}`;
        summaryEl.style.display = 'block';
    }
};

window.confirmAppointmentBooking = async () => {
    if (!localStorage.getItem('token')) {
        showToast("Rezervasyon yapabilmek için giriş yapmalısınız.", "error");
        setTimeout(() => { window.location.hash = '#login'; }, 1500);
        return;
    }
    
    if (!window._selectedAppointmentSlot) {
        showToast('Lütfen bir saat seçin.', 'error');
        return;
    }
    
    const btn = document.getElementById('appt-book-btn');
    btn.disabled = true;
    btn.textContent = 'İşleniyor...';
    
    try {
        if (window._apptModalCtx?.mode === 'modify' && window._apptModalCtx.reservationId) {
            const noteEl = document.getElementById('modal-appt-note');
            await API.customer.modifyReservation(window._apptModalCtx.reservationId, {
                slot_id: window._selectedAppointmentSlot,
                note: noteEl ? noteEl.value : ''
            });
            closeModal();
            showToast('Rezervasyon güncellendi');
            if (window._apptModalCtx.onSuccess) window._apptModalCtx.onSuccess();
            else window.location.hash = '#reservations';
        } else {
            await API.customer.createReservation({
                service_id: window._apptBookingData.serviceId,
                time_slot_id: window._selectedAppointmentSlot,
                note: document.getElementById('modal-appt-note').value
            });
            closeModal();
            showToast("Rezervasyon başarıyla oluşturuldu!");
            window.location.hash = '#reservations';
        }
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = window._apptModalCtx?.mode === 'modify' ? 'Kaydet' : 'Rezervasyon Yap';
    }
};

async function viewServiceDetail(container) {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');
    const urlStart = params.get('start');
    const urlEnd = params.get('end');

    try {
        const s = await API.customer.getService(id);
        if (!s) return container.innerHTML = `<div class="container" style="padding:5rem; text-align:center;"><h2>Hizmet bulunamadı. (ID: ${id})</h2><p>Lütfen ana sayfaya dönüp tekrar deneyin.</p><button onclick="window.location.hash='${HOME_HASH}'" class="btn btn-primary" style="margin-top:1rem;">Ana Sayfaya Dön</button></div>`;

        const isHotel = s.category === 'hotel';

        container.innerHTML = `
            <div class="container detail-layout">
                <div class="detail-content">
                    <img src="${s.image_url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200'}" style="width: 100%; height: 500px; object-fit: cover; border-radius: 20px;">
                    <div style="margin-top: 2rem;">
                        <span class="badge" style="background: ${isHotel ? '#f3f4f6' : 'var(--accent)'}; color: ${isHotel ? '#374151' : 'white'}; margin-bottom: 1rem; display: inline-block;">
                            ${isHotel ? '🏨 KONAKLAMA' : '📅 RANDEVU HİZMETİ'}
                        </span>
                        <h1 style="font-size: 2.5rem;">${s.name}</h1>
                        <p style="color: var(--text-muted); margin: 1rem 0; font-size: 1.1rem;">${s.description}</p>
                        
                        ${!isHotel ? `
                            <div style="margin-top: 3rem; background: white; padding: 2rem; border-radius: 12px; box-shadow: var(--shadow);">
                                <h3>1. Gün seçin</h3>
                                <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.5rem 0 1rem;">Takvimden gün seçtikten sonra uygun saate tıklayın.</p>
                                <input type="hidden" id="appointment-date" value="">
                                <div id="appointment-calendar-root"></div>
                                <h3 style="margin-top: 2rem;">2. Saat seçin</h3>
                                <div id="appointment-slots" class="slot-grid" style="margin-top: 1rem;">
                                    <p style="color: #999;">Önce takvimden gün seçin.</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="detail-sidebar">
                    <div class="booking-panel">
                        <h3>Rezervasyon Özeti</h3>
                        <div id="booking-summary" style="margin-top: 1.5rem; padding: 1.5rem; background: #fafafa; border-radius: 12px;">
                            ${isHotel ? `
                                <p><strong>Giriş:</strong> ${urlStart}</p>
                                <p><strong>Çıkış:</strong> ${urlEnd}</p>
                            ` : '<p id="selected-slot-text">Henüz tarih ve saat seçilmedi.</p>'}
                        </div>
                        ${isHotel ? `
                        <div class="form-group" style="margin-top: 1.5rem;">
                            <label>Kişi Sayısı</label>
                            <input type="number" id="adults" value="1" min="1" style="width: 100%;">
                        </div>
                        ` : ''}
                        <div style="padding-bottom:1rem">
                           <label>Varsa Notunuz</label>
                           <textarea id="note" class="form-control" style="width:100%"></textarea>
                        </div>
                        <button class="btn btn-primary" onclick="window.submitFinalBooking(${id}, '${s.category}')">Rezervasyonu Tamamla</button>
                    </div>
                </div>
            </div>
        `;

        let selectedSlotId = null;

        window.selectSlot = (slotId, date, time, el) => {
            document.querySelectorAll('.slot-item').forEach(s => s.classList.remove('selected'));
            el.classList.add('selected');
            selectedSlotId = slotId;
            document.getElementById('selected-slot-text').innerHTML = `
                <strong>Tarih:</strong> ${date}<br>
                <strong>Saat:</strong> ${time.substring(0, 5)}
            `;
        };

        window.loadAppointmentSlots = async (svcId, date) => {
            const container = document.getElementById('appointment-slots');
            container.innerHTML = 'Yükleniyor...';
            try {
                const data = await API.customer.getAvailability(svcId, date);
                if (data.slots && data.slots.length > 0) {
                    container.innerHTML = data.slots.map(s => `
                        <div class="slot-item ${s.is_available ? 'available' : 'booked'}" 
                             onclick="${s.is_available ? `window.selectSlot(${s.id}, '${s.date}', '${s.start_time}', this)` : ''}">
                            ${s.start_time.substring(0, 5)}
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<p style="color: var(--error);">Bu tarihte müsait randevu bulunamadı.</p>';
                }
            } catch (e) { container.innerHTML = 'Hata: ' + e.message; }
        };

        window.submitFinalBooking = async (svcId, category) => {
            if (!localStorage.getItem('token')) {
                showToast("Rezervasyon yapabilmek için giriş yapmalısınız.", "error");
                setTimeout(() => { window.location.hash = '#login'; }, 1500);
                return;
            }

            const payload = {
                service_id: svcId,
                note: document.getElementById('note').value
            };

            if (category === 'hotel') {
                payload.check_in = urlStart;
                payload.check_out = urlEnd;
                payload.guests = { adults: document.getElementById('adults')?.value || 1 };
            } else {
                if (!selectedSlotId) return showToast("Lütfen bir saat seçin.", "error");
                payload.time_slot_id = selectedSlotId;
            }

            try {
                await API.customer.createReservation(payload);
                showToast("Rezervasyon başarıyla oluşturuldu.");
                window.location.hash = '#reservations';
            } catch (err) { showToast(err.message, 'error'); }
        };

        if (!isHotel) {
            window._detailApptCalMonth = { y: new Date().getFullYear(), m: new Date().getMonth() };
            window._detailApptServiceId = id;

            window._shiftDetailApptMonth = function (delta) {
                let { y, m } = window._detailApptCalMonth;
                m += delta;
                if (m < 0) { m = 11; y--; }
                if (m > 11) { m = 0; y++; }
                const t0 = new Date();
                t0.setHours(0, 0, 0, 0);
                const minMs = new Date(t0.getFullYear(), t0.getMonth(), 1).getTime();
                if (new Date(y, m, 1).getTime() < minMs) return;
                window._detailApptCalMonth = { y, m };
                window._paintDetailAppointmentCalendar();
            };

            window._detailApptDayPick = function (iso) {
                const hid = document.getElementById('appointment-date');
                if (!hid) return;
                hid.value = iso;
                selectedSlotId = null;
                const st = document.getElementById('selected-slot-text');
                if (st) st.innerHTML = 'Önce saat seçin.';
                window._paintDetailAppointmentCalendar();
                window.loadAppointmentSlots(window._detailApptServiceId, iso);
            };

            window._paintDetailAppointmentCalendar = function () {
                const root = document.getElementById('appointment-calendar-root');
                if (!root || !window._detailApptCalMonth) return;
                const { y, m } = window._detailApptCalMonth;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayMs = today.getTime();
                const sel = document.getElementById('appointment-date')?.value || '';
                const gridHtml = _buildInlineMonthGrid(y, m, {
                    todayMs,
                    bookedRanges: null,
                    mode: 'single',
                    singleIso: sel,
                    checkInIso: null,
                    checkOutIso: null,
                    onPickFn: 'window._detailApptDayPick'
                });
                const title = `${_TR_MONTHS[m]} ${y}`;
                const atMinMonth = new Date(y, m, 1).getTime() <= new Date(today.getFullYear(), today.getMonth(), 1).getTime();
                root.innerHTML = `
                    <div class="inline-cal-nav">
                        <button type="button" class="btn btn-sm btn-outline" ${atMinMonth ? 'disabled style="opacity:0.45"' : ''} onclick="window._shiftDetailApptMonth(-1)">‹</button>
                        <span>${title}</span>
                        <button type="button" class="btn btn-sm btn-outline" onclick="window._shiftDetailApptMonth(1)">›</button>
                    </div>
                    <div class="inline-cal-weekdays">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((x) => `<div>${x}</div>`).join('')}</div>
                    <div class="inline-cal-grid">${gridHtml}</div>
                `;
            };

            window._paintDetailAppointmentCalendar();
        }

    } catch (e) {
        container.innerHTML = `<div class="container" style="padding: 5rem;">Hata: ${e.message}</div>`;
    }
}

// --- Auth Views ---
async function viewLogin(container) {
    container.innerHTML = `
        <div style="max-width: 450px; margin: 8rem auto;" class="service-card">
            <div style="padding: 3rem;">
                <h2 style="text-align: center; margin-bottom: 2rem;">${t('auth.login_title')}</h2>
                <form id="login-form">
                    <div class="form-group"><label>${t('auth.email')}</label><input type="email" id="login-email" required></div>
                    <div class="form-group"><label>${t('auth.password')}</label><input type="password" id="login-password" required></div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;">${t('auth.sign_in')}</button>
                </form>
                <p style="text-align: center; margin-top: 1.5rem;">
                    <a href="#forgot-password" style="color: var(--accent);">${t('auth.forgot_password')}</a>
                </p>
                <p style="text-align: center; margin-top: 0.75rem; color: var(--text-muted); font-size: 0.9rem;">
                    ${t('auth.no_account')} <a href="#register" style="color: var(--accent); font-weight: 600;">${t('nav.register')}</a>
                </p>
            </div>
        </div>
    `;
    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await API.auth.login(document.getElementById('login-email').value, document.getElementById('login-password').value);
            localStorage.setItem('token', res.access_token);
            localStorage.setItem('user', JSON.stringify(res.user));
            showToast(LOCALE.MESSAGES.LOGIN_SUCCESS);
            const role = res.user?.role;
            if (role === 'superadmin') window.location.hash = '#superadmin-stats';
            else if (role === 'business_owner') window.location.hash = '#business-dashboard';
            else if (role === 'staff') window.location.hash = '#staff-dashboard';
            else window.location.hash = HOME_HASH;
        } catch (err) { showToast(err.message, 'error'); }
    };
}

async function viewForgotPassword(container) {
    container.innerHTML = `
        <div style="max-width: 450px; margin: 8rem auto;" class="service-card">
            <div style="padding: 3rem;">
                <h2 style="text-align: center; margin-bottom: 1rem;">${t('auth.forgot_title')}</h2>
                <p style="text-align: center; color: var(--text-muted); margin-bottom: 2rem;">${t('auth.forgot_subtitle')}</p>
                <form id="forgot-form">
                    <div class="form-group"><label>${t('auth.email')}</label><input type="email" id="forgot-email" required></div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;">${t('auth.send_reset_link')}</button>
                </form>
                <p style="text-align: center; margin-top: 1.5rem;">
                    <a href="#login" style="color: var(--accent);">${t('auth.back_to_login')}</a>
                </p>
            </div>
        </div>
    `;
    document.getElementById('forgot-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = t('btn.loading');
        try {
            await API.auth.forgotPassword(document.getElementById('forgot-email').value);
            showToast(t('auth.check_email'));
            setTimeout(() => window.location.hash = '#login', 2000);
        } catch (err) { 
            showToast(err.message, 'error'); 
            btn.disabled = false;
            btn.textContent = t('auth.send_reset_link');
        }
    };
}

async function viewResetPassword(container) {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const token = params.get('token');
    
    if (!token) {
        container.innerHTML = `
            <div style="max-width: 450px; margin: 8rem auto; text-align: center;" class="service-card">
                <div style="padding: 3rem;">
                    <h2 style="color: var(--error);">${t('auth.invalid_link')}</h2>
                    <p style="margin-top: 1rem;">${t('auth.invalid_link_desc')}</p>
                    <a href="#forgot-password" class="btn btn-primary" style="margin-top: 2rem;">${t('auth.request_again')}</a>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="max-width: 450px; margin: 8rem auto;" class="service-card">
            <div style="padding: 3rem;">
                <h2 style="text-align: center; margin-bottom: 2rem;">${t('auth.reset_title')}</h2>
                <form id="reset-form">
                    <div class="form-group"><label>${t('auth.new_password')}</label><input type="password" id="reset-password" required minlength="6"></div>
                    <div class="form-group"><label>${t('auth.password_confirm')}</label><input type="password" id="reset-password-confirm" required minlength="6"></div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;">${t('auth.reset_btn')}</button>
                </form>
            </div>
        </div>
    `;
    document.getElementById('reset-form').onsubmit = async (e) => {
        e.preventDefault();
        const password = document.getElementById('reset-password').value;
        const confirm = document.getElementById('reset-password-confirm').value;
        
        if (password !== confirm) {
            showToast('Şifreler eşleşmiyor', 'error');
            return;
        }
        
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Güncelleniyor...';
        
        try {
            await API.auth.resetPassword(token, password);
            showToast('Şifreniz başarıyla güncellendi');
            setTimeout(() => window.location.hash = '#login', 2000);
        } catch (err) { 
            showToast(err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Şifreyi Güncelle';
        }
    };
}

async function viewProfile(container) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.hash = '#login';
        return;
    }
    
    try {
        const user = await API.auth.me();
        const phoneDigits = parseProfilePhoneToDigits(user.phone || '');
        const phoneDisplay = formatProfilePhoneDigits(phoneDigits).replace(/^0/, '');
        
        container.innerHTML = `
            <div class="container" style="padding-top: 4rem; max-width: 600px;">
                <h1 style="margin-bottom: 2rem;">${t('profile.title')}</h1>
                
                <div class="service-card" style="padding: 2rem; margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1.5rem;">${t('profile.info')}</h3>
                    <form id="profile-form">
                        <div class="form-group">
                            <label>${t('auth.name')}</label>
                            <input type="text" id="profile-name" value="${user.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${t('auth.email')}</label>
                            <input type="email" value="${user.email}" disabled style="background: #f5f5f5;">
                        </div>
                        <div class="form-group">
                            <label>${t('auth.phone_mobile')}</label>
                            <div class="phone-input-row">
                                <span class="phone-input-prefix" aria-hidden="true">+90</span>
                                <input type="tel" id="profile-phone" class="phone-input-field" inputmode="numeric" autocomplete="tel-national"
                                    value="${phoneDisplay}" placeholder="5XX XXX XX XX">
                            </div>
                            <p class="field-hint">${t('profile.phone_hint')}</p>
                        </div>
                        <button type="submit" class="btn btn-primary">${t('btn.save')}</button>
                    </form>
                </div>
                
                <div class="service-card" style="padding: 2rem;">
                    <h3 style="margin-bottom: 1.5rem;">${t('profile.change_password')}</h3>
                    <form id="password-form">
                        <div class="form-group">
                            <label>${t('profile.current_password')}</label>
                            <input type="password" id="current-password" required>
                        </div>
                        <div class="form-group">
                            <label>${t('profile.new_password')}</label>
                            <input type="password" id="new-password" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label>${t('auth.password_confirm')}</label>
                            <input type="password" id="new-password-confirm" required minlength="6">
                        </div>
                        <button type="submit" class="btn btn-outline">${t('profile.change_password')}</button>
                    </form>
                </div>
            </div>
        `;

        const phoneEl = document.getElementById('profile-phone');
        wireProfilePhoneInput(phoneEl);
        
        document.getElementById('profile-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            btn.disabled = true;
            try {
                let digits = parseProfilePhoneToDigits(document.getElementById('profile-phone').value);
                let phonePayload = null;
                if (digits) {
                    if (digits.length === 10 && digits[0] === '5') phonePayload = `0${digits}`;
                    else if (digits.length === 11 && digits[0] === '0') phonePayload = digits;
                    else phonePayload = digits;
                }
                const res = await API.auth.updateProfile({
                    name: document.getElementById('profile-name').value,
                    phone: phonePayload
                });
                localStorage.setItem('user', JSON.stringify(res.user));
                showToast(t('profile.info_updated'));
                renderNavbar();
            } catch (err) { showToast(err.message, 'error'); }
            btn.disabled = false;
        };
        
        document.getElementById('password-form').onsubmit = async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('new-password').value;
            const confirmPass = document.getElementById('new-password-confirm').value;
            
            if (newPass !== confirmPass) {
                showToast(t('auth.password_mismatch'), 'error');
                return;
            }
            
            const btn = e.target.querySelector('button');
            btn.disabled = true;
            try {
                await API.auth.changePassword(
                    document.getElementById('current-password').value,
                    newPass
                );
                showToast(t('profile.password_changed'));
                e.target.reset();
            } catch (err) { showToast(err.message, 'error'); }
            btn.disabled = false;
        };
        
    } catch (err) {
        container.innerHTML = `<div class="container" style="padding: 5rem;">${t('common.error')}: ${err.message}</div>`;
    }
}

async function viewRegister(container) {
    container.innerHTML = `
        <div style="max-width: 450px; margin: 8rem auto;" class="service-card">
            <div style="padding: 3rem;">
                <h2 style="text-align: center; margin-bottom: 2rem;">${t('auth.register_title')}</h2>
                <form id="register-form">
                    <div class="form-group"><label>${t('auth.name')}</label><input type="text" id="reg-name" required></div>
                    <div class="form-group"><label>${t('auth.email')}</label><input type="email" id="reg-email" required></div>
                    <div class="form-group">
                        <label>${t('auth.phone_mobile')}</label>
                        <div class="phone-input-row">
                            <span class="phone-input-prefix" aria-hidden="true">+90</span>
                            <input type="tel" id="reg-phone" class="phone-input-field" inputmode="numeric" autocomplete="tel-national" required placeholder="5XX XXX XX XX">
                        </div>
                    </div>
                    <div class="form-group"><label>${t('auth.password')}</label><input type="password" id="reg-password" required minlength="6"></div>
                    <div class="form-group"><label>${t('auth.password_confirm')}</label><input type="password" id="reg-password2" required minlength="6"></div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;">${t('auth.register_btn')}</button>
                </form>
                <p style="text-align: center; margin-top: 1.5rem; color: var(--text-muted); font-size: 0.9rem;">
                    ${t('auth.have_account')} <a href="#login" style="color: var(--accent); font-weight: 600;">${t('nav.login')}</a>
                </p>
            </div>
        </div>
    `;
    wireProfilePhoneInput(document.getElementById('reg-phone'));
    document.getElementById('register-form').onsubmit = async (e) => {
        e.preventDefault();
        const p1 = document.getElementById('reg-password').value;
        const p2 = document.getElementById('reg-password2').value;
        if (p1 !== p2) {
            showToast(t('auth.password_mismatch'), 'error');
            return;
        }
        const phone = phoneInputToApiPayload(document.getElementById('reg-phone'));
        if (!phone) {
            showToast(t('auth.invalid_phone'), 'error');
            return;
        }
        try {
            await API.auth.register({
                name: document.getElementById('reg-name').value.trim(),
                email: document.getElementById('reg-email').value.trim(),
                password: p1,
                phone
            });
            showToast(LOCALE.MESSAGES.REGISTER_SUCCESS);
            window.location.hash = '#login';
        } catch (err) { showToast(err.message, 'error'); }
    };
}

// --- Dashboard & Admin Logic ---
async function viewDashboard(container) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'superadmin') viewSuperAdminStats(container);
    else if (user.role === 'business_owner') viewBusinessDashboard(container);
    else if (user.role === 'staff') viewStaffDashboard(container);
    else viewMyReservations(container);
}

async function viewMyReservations(container) {
    try {
        const data = await API.customer.getMyReservations();
        container.innerHTML = `
            <div class="container" style="padding-top: 4rem;">
                <h1 style="margin-bottom: 3rem;">${t('res.my_title')}</h1>
                <div class="grid">
                    ${data.reservations.length ? data.reservations.map(r => {
                        const escHtml = (s) => String(s ?? '')
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#39;');
                        const thumb = (r.service_image_url || r.business_image_url || '').trim();
                        const thumbStyle = thumb
                            ? `style="background-image:url('${thumb.replace(/'/g, "\\'")}');"`
                            : '';
                        const thumbClass = `cust-res-thumb${thumb ? '' : ' cust-res-thumb--empty'}`;
                        const locLine = [r.business_ilce, r.business_il].filter(Boolean).join(', ');
                        const addrParts = [r.business_address, locLine].filter((x) => x && String(x).trim());
                        const addrText = addrParts.join(' · ');
                        const bizNameHtml = r.business_id && r.business_name
                            ? `<a class="cust-res-bizlink" href="#business-detail?id=${encodeURIComponent(String(r.business_id))}">${escHtml(r.business_name)}</a>`
                            : (r.business_name ? escHtml(r.business_name) : '');
                        const whenText = r.type === 'hotel'
                            ? `${r.check_in} → ${r.check_out}`
                            : `${r.slot_date} · ${r.slot_time}`;
                        return `
                        <div class="service-card cust-res-card">
                            <div class="${thumbClass}" ${thumbStyle} role="img" aria-label="${escHtml(r.service_name)}"></div>
                            <div class="cust-res-main">
                                <h3 class="cust-res-title">${escHtml(r.service_name)}</h3>
                                ${bizNameHtml ? `<div class="cust-res-biz">${bizNameHtml}</div>` : ''}
                                ${addrText ? `<div class="cust-res-addr">${escHtml(addrText)}</div>` : ''}
                                <div class="cust-res-meta">
                                    <div class="cust-res-meta-row">
                                        <span class="cust-res-k">${t('res.date')}</span>
                                        <span class="cust-res-v">${escHtml(whenText)}</span>
                                    </div>
                                    <div class="cust-res-meta-row">
                                        <span class="cust-res-k">${t('res.guest')}</span>
                                        <span class="cust-res-v">${escHtml(String(r.total_guests ?? 1))}</span>
                                        <span class="cust-res-sep" aria-hidden="true"></span>
                                        <span class="cust-res-k">${t('res.note')}</span>
                                        <span class="cust-res-v">${escHtml(r.note && String(r.note).trim() ? r.note : t('res.note_empty'))}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="cust-res-actions">
                                <span class="badge badge-${r.status}">${LOCALE.STATUS[r.status]}</span>
                                ${r.status === 'pending' ? `
                                    <div class="cust-res-btnrow">
                                        <button type="button" class="btn btn-sm cust-res-btn cust-res-btn--primary" onclick="window.showModifyReservationModal(${JSON.stringify(r).replace(/"/g, '&quot;')})">${t('res.modify')}</button>
                                        <button type="button" class="btn btn-sm cust-res-btn cust-res-btn--danger" onclick="window.cancelBooking(${r.id})">${t('res.cancel')}</button>
                                    </div>
                                ` : ''}
                                ${r.status === 'approved' ? `<button type="button" class="btn btn-sm cust-res-btn cust-res-btn--ghost" onclick="window.showReviewModal(${r.id}, '${r.service_name.replace(/'/g,"\\'")}')">${t('res.review')}</button>` : ''}
                            </div>
                        </div>
                    `;
                    }).join('') : `<p>${t('res.none')}</p>`}
                </div>
            </div>
        `;
        window.cancelBooking = async (id) => {
            if (confirm(t('res.confirm_cancel'))) {
                try {
                    const res = await API.customer.cancelReservation(id);
                    showToast(res.msg);
                    viewMyReservations(container);
                } catch (e) { showToast(e.message, 'error'); }
            }
        };

        window.showModifyReservationModal = async (reservation) => {
            try {
                const svc = await API.customer.getService(reservation.service_id);
                const isHotel = reservation.type === 'hotel' || svc?.category === 'hotel';
                const onSuccess = () => viewMyReservations(container);

                if (isHotel) {
                    await window.openRoomBookingModal(
                        reservation.service_id,
                        t('res.modify_dates'),
                        svc?.room_type || svc?.name || t('nav.biz_cat.accommodation'),
                        svc?.price || 0,
                        {
                            mode: 'modify',
                            reservationId: reservation.id,
                            initialCheckIn: reservation.check_in || '',
                            initialCheckOut: reservation.check_out || '',
                            initialNote: reservation.note || '',
                            onSuccess
                        }
                    );
                    return;
                }

                await window.openAppointmentModal(
                    reservation.service_id,
                    svc?.name || reservation.service_name || t('res.review'),
                    svc?.price || 0,
                    {
                        mode: 'modify',
                        reservationId: reservation.id,
                        initialDate: reservation.slot_date || '',
                        keepSlotId: reservation.time_slot_id || null,
                        initialNote: reservation.note || '',
                        onSuccess
                    }
                );
            } catch (e) {
                showToast(e.message || 'Düzenleme açılamadı', 'error');
            }
        };

        window.showReviewModal = (reservationId, serviceName) => {
            showModal(`${serviceName} — Yorum Yap`, `
                <form id="review-form">
                    <div class="form-group">
                        <label>Puanınız</label>
                        <div style="display:flex; gap:0.5rem; margin-top:0.5rem;" id="star-row">
                            ${[1,2,3,4,5].map(i => `<button type="button" class="btn btn-outline btn-sm star-btn" data-val="${i}" onclick="window.setRating(${i})" style="font-size:1.4rem; padding:0.3rem 0.6rem;">☆</button>`).join('')}
                        </div>
                        <input type="hidden" id="review-rating" value="">
                    </div>
                    <div class="form-group">
                        <label>Yorumunuz</label>
                        <textarea id="review-comment" rows="4" placeholder="Deneyiminizi paylaşın..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">Gönder</button>
                </form>
            `);

            window.setRating = (val) => {
                document.getElementById('review-rating').value = val;
                document.querySelectorAll('.star-btn').forEach((btn, i) => {
                    btn.textContent = i < val ? '★' : '☆';
                    btn.style.color = i < val ? '#f59e0b' : '';
                });
            };

            document.getElementById('review-form').onsubmit = async (e) => {
                e.preventDefault();
                const rating = document.getElementById('review-rating').value;
                if (!rating) return showToast('Lütfen puan seçin.', 'error');
                try {
                    await API.reviews.create(reservationId, {
                        rating: parseInt(rating),
                        comment: document.getElementById('review-comment').value
                    });
                    showToast('Yorumunuz alındı, teşekkürler!');
                    closeModal();
                } catch (err) { showToast(err.message, 'error'); }
            };
        };
    } catch (e) { container.innerHTML = e.message; }
}

// --- Shared SuperAdmin Layout ---
const SUPERADMIN_TABS = [
    { hash: '#superadmin-stats',        label: 'İstatistikler' },
    { hash: '#superadmin-businesses',   label: 'İşletmeler' },
    { hash: '#superadmin-users',        label: 'Kullanıcılar' },
    { hash: '#superadmin-logs',         label: 'Günlükler' },
];

function renderSuperAdminShell(container, activeHash, title, innerHtml, extraBtn = '') {
    const tabs = SUPERADMIN_TABS.map(t => {
        const isActive = t.hash === activeHash;
        return `<a href="${t.hash}" class="admin-tab${isActive ? ' active' : ''}">${t.label}</a>`;
    }).join('');

    container.innerHTML = `
        <div class="admin-layout">
            <div class="admin-tabs-bar">
                <div class="container">
                    <div class="admin-tabs">${tabs}</div>
                </div>
            </div>
            <div class="container" style="padding-top: 2.5rem; padding-bottom: 4rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                    <h1 style="font-size:1.6rem; font-weight:700;">${title}</h1>
                    ${extraBtn}
                </div>
                <div id="admin-panel-body">${innerHtml}</div>
            </div>
        </div>
    `;
}

// --- Shared Business Owner Layout ---
const BUSINESS_TABS = [
    { hash: '#business-dashboard',    label: 'İstatistikler' },
    { hash: '#business-services',     label: 'Hizmetler' },
    { hash: '#business-reservations', label: 'Rezervasyonlar' },
    { hash: '#business-staff',        label: 'Personel' },
    { hash: '#business-settings',     label: 'Ayarlar' },
];

function renderBusinessShell(container, activeHash, title, innerHtml, extraBtn = '') {
    const tabs = BUSINESS_TABS.map(t => {
        const isActive = t.hash === activeHash;
        return `<a href="${t.hash}" class="admin-tab${isActive ? ' active' : ''}">${t.label}</a>`;
    }).join('');

    container.innerHTML = `
        <div class="admin-layout">
            <div class="admin-tabs-bar">
                <div class="container">
                    <div class="admin-tabs">${tabs}</div>
                </div>
            </div>
            <div class="container" style="padding-top: 2.5rem; padding-bottom: 4rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                    <h1 style="font-size:1.6rem; font-weight:700;">${title}</h1>
                    ${extraBtn}
                </div>
                <div id="business-panel-body">${innerHtml}</div>
            </div>
        </div>
    `;
}

// --- SuperAdmin Views ---

async function viewSuperAdminStats(container) {
    renderSuperAdminShell(container, '#superadmin-stats', 'Platform İstatistikleri', `
        <div id="stats-overview" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
            <div class="loading-row">Yükleniyor...</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem;">
            <div class="service-card" style="padding: 2rem;">
                <h3 style="margin-bottom: 1.5rem;">Aylık Rezervasyon Trendi</h3>
                <canvas id="monthly-chart"></canvas>
            </div>
            <div class="service-card" style="padding: 2rem;">
                <h3 style="margin-bottom: 1.5rem;">Kategori Dağılımı</h3>
                <canvas id="category-chart"></canvas>
            </div>
        </div>
        <div class="service-card" style="padding: 2rem;">
            <h3 style="margin-bottom: 1.5rem;">En Popüler 5 Hizmet</h3>
            <div id="top-services-list" class="loading-row">Yükleniyor...</div>
        </div>
    `);

    try {
        const [overview, monthly, byCategory, topServices] = await Promise.all([
            API.superadmin.statsOverview(),
            API.superadmin.statsMonthly(),
            API.superadmin.statsByCategory(),
            API.superadmin.statsTopServices()
        ]);

        const statCards = [
            { label: 'Toplam Rezervasyon', value: overview.total_reservations },
            { label: 'Beklemede',          value: overview.pending },
            { label: 'Onaylandı',          value: overview.approved },
            { label: 'Reddedildi',         value: overview.rejected },
            { label: 'Kullanıcı',          value: overview.total_users },
            { label: 'İşletme',            value: overview.total_businesses }
        ];
        document.getElementById('stats-overview').innerHTML = statCards.map(s => `
            <div class="service-card stat-card">
                <div class="stat-value">${s.value}</div>
                <div class="stat-label">${s.label}</div>
            </div>
        `).join('');

        const monthlyCtx = document.getElementById('monthly-chart').getContext('2d');
        new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: monthly.map(m => m.month),
                datasets: [{
                    label: 'Rezervasyon',
                    data: monthly.map(m => m.count),
                    backgroundColor: 'rgba(197, 160, 89, 0.75)',
                    borderColor: 'var(--accent)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });

        const catCtx = document.getElementById('category-chart').getContext('2d');
        new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: byCategory.map(c => c.category === 'hotel' ? 'Otel' : 'Randevu'),
                datasets: [{
                    data: byCategory.map(c => c.count),
                    backgroundColor: ['#c5a059', '#1a1a1a'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });

        const maxCount = Math.max(...topServices.map(s => s.reservation_count), 1);
        document.getElementById('top-services-list').innerHTML = topServices.map((s, i) => `
            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.2rem;">
                <span style="font-size:0.85rem; font-weight:700; color:var(--text-muted); width:20px; text-align:right;">${i + 1}</span>
                <div style="flex:1;">
                    <div style="font-weight:600; font-size:0.9rem; margin-bottom:0.35rem;">${s.service_name}</div>
                    <div style="background:#f0f0f0; border-radius:4px; height:6px; overflow:hidden;">
                        <div style="background:var(--accent); height:100%; width:${(s.reservation_count / maxCount) * 100}%; border-radius:4px;"></div>
                    </div>
                </div>
                <span style="font-size:0.9rem; font-weight:600; color:var(--text-muted);">${s.reservation_count}</span>
            </div>
        `).join('') || '<p style="color:var(--text-muted);">Henüz rezervasyon yok.</p>';

    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function viewSuperAdminBusinesses(container) {
    renderSuperAdminShell(container, '#superadmin-businesses', 'İşletme Yönetimi',
        `
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center; justify-content:space-between; margin-bottom:1rem;">
            <input id="sa-biz-search" type="search" placeholder="İşletme ara (ad)..." style="flex:1; min-width: 240px; padding:0.65rem 0.85rem; border-radius:10px; border:1px solid #e5e7eb;">
            <button class="btn btn-outline btn-sm" onclick="window.clearSuperAdminBizSearch()">Temizle</button>
        </div>
        <div id="admin-businesses-list" class="loading-row">Yükleniyor...</div>
        `,
        `<button class="btn btn-primary" onclick="window.showBusinessFormModal()">+ Yeni İşletme Ekle</button>`
    );
    const list = document.getElementById('admin-businesses-list');
    const state = window._saBizState || { page: 1, search: '' };
    window._saBizState = state;

    window.clearSuperAdminBizSearch = () => {
        state.search = '';
        const inp = document.getElementById('sa-biz-search');
        if (inp) inp.value = '';
        window.loadSuperAdminBusinessesPage(1);
    };

    window.loadSuperAdminBusinessesPage = async (page = 1) => {
        state.page = Math.max(1, parseInt(page || 1, 10));
        if (list) list.innerHTML = 'Yükleniyor...';
        try {
            const data = await API.superadmin.getBusinesses(state.page, state.search || '');
            const pages = Number(data.pages || 1);
            const cur = Math.min(state.page, pages || 1);
            state.page = cur;

            const pager = pages > 1 ? `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; margin-top:1rem;">
                    <div style="color:var(--text-muted); font-size:0.85rem;">
                        Toplam: <strong>${Number(data.total || 0)}</strong> işletme • Sayfa <strong>${cur}</strong>/<strong>${pages}</strong>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
                        <button class="btn btn-outline btn-sm" ${cur <= 1 ? 'disabled' : ''} onclick="window.loadSuperAdminBusinessesPage(${cur - 1})">Önceki</button>
                        <select class="pretty-select" style="width:auto; min-width:120px;" onchange="window.loadSuperAdminBusinessesPage(this.value)">
                            ${Array.from({ length: pages }, (_, i) => i + 1).map(p => `<option value="${p}" ${p === cur ? 'selected' : ''}>Sayfa ${p}</option>`).join('')}
                        </select>
                        <button class="btn btn-outline btn-sm" ${cur >= pages ? 'disabled' : ''} onclick="window.loadSuperAdminBusinessesPage(${cur + 1})">Sonraki</button>
                    </div>
                </div>
            ` : '';

            list.innerHTML = `
                <table class="admin-table">
                    <thead><tr><th>Ad</th><th>Tür</th><th>Konum</th><th>İşlemler</th></tr></thead>
                    <tbody>
                        ${(data.businesses || []).map(b => `
                            <tr>
                                <td><strong>${b.name}</strong></td>
                                <td><span class="badge" style="background:#eee">${String(b.type || '').toUpperCase()}</span></td>
                                <td>${b.il ? b.il + (b.ilce ? ', ' + b.ilce : '') : (b.address || '-')}</td>
                                <td>
                                    <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                                        <button class="btn btn-outline btn-sm" onclick="window.showBusinessFormModal(${JSON.stringify(b).replace(/\"/g, '&quot;')})">Düzenle</button>
                                        <button class="btn btn-danger btn-sm" onclick="window.deleteBusiness(${b.id})">Sil</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${pager}
            `;
        } catch (e) {
            if (list) list.textContent = e.message;
        }
    };

    const searchEl = document.getElementById('sa-biz-search');
    if (searchEl) {
        searchEl.value = state.search || '';
        let t = null;
        searchEl.oninput = () => {
            const v = searchEl.value || '';
            if (t) clearTimeout(t);
            t = setTimeout(() => {
                state.search = v.trim();
                window.loadSuperAdminBusinessesPage(1);
            }, 250);
        };
    }

    window.loadSuperAdminBusinessesPage(state.page || 1);
}

async function viewSuperAdminUsers(container) {
    renderSuperAdminShell(container, '#superadmin-users', 'Sistem Kullanıcıları',
        `
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center; justify-content:space-between; margin-bottom:1rem;">
            <input id="sa-user-search" type="search" placeholder="Kullanıcı ara (ad/e-posta)..." style="flex:1; min-width: 240px; padding:0.65rem 0.85rem; border-radius:10px; border:1px solid #e5e7eb;">
            <button class="btn btn-outline btn-sm" onclick="window.clearSuperAdminUserSearch()">Temizle</button>
        </div>
        <div id="user-list" class="loading-row">Yükleniyor...</div>
        `
    );
    const root = document.getElementById('user-list');
    const state = window._saUsersState || { page: 1, search: '' };
    window._saUsersState = state;

    window.clearSuperAdminUserSearch = () => {
        state.search = '';
        const inp = document.getElementById('sa-user-search');
        if (inp) inp.value = '';
        window.loadSuperAdminUsersPage(1);
    };

    window.loadSuperAdminUsersPage = async (page = 1) => {
        state.page = Math.max(1, parseInt(page || 1, 10));
        if (root) root.innerHTML = 'Yükleniyor...';
        try {
            const data = await API.superadmin.getUsers(state.page, state.search || '');
            const pages = Number(data.pages || 1);
            const cur = Math.min(state.page, pages || 1);
            state.page = cur;

            const pager = pages > 1 ? `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; margin-top:1rem;">
                    <div style="color:var(--text-muted); font-size:0.85rem;">
                        Toplam: <strong>${Number(data.total || 0)}</strong> kullanıcı • Sayfa <strong>${cur}</strong>/<strong>${pages}</strong>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
                        <button class="btn btn-outline btn-sm" ${cur <= 1 ? 'disabled' : ''} onclick="window.loadSuperAdminUsersPage(${cur - 1})">Önceki</button>
                        <select class="pretty-select" style="width:auto; min-width:120px;" onchange="window.loadSuperAdminUsersPage(this.value)">
                            ${Array.from({ length: pages }, (_, i) => i + 1).map(p => `<option value="${p}" ${p === cur ? 'selected' : ''}>Sayfa ${p}</option>`).join('')}
                        </select>
                        <button class="btn btn-outline btn-sm" ${cur >= pages ? 'disabled' : ''} onclick="window.loadSuperAdminUsersPage(${cur + 1})">Sonraki</button>
                    </div>
                </div>
            ` : '';

            root.innerHTML = `
                <table class="admin-table">
                    <thead><tr><th>Ad</th><th>E-posta</th><th>Rol</th><th>İşletme ID</th><th>İşlemler</th></tr></thead>
                    <tbody>${(data.users || []).map(u => `
                        <tr>
                            <td>${u.name}</td>
                            <td style="font-size:0.85rem;">${u.email}</td>
                            <td><span class="badge" style="background:#f3f4f6; color:#374151;">${u.role}</span></td>
                            <td>${u.business_id || '-'}</td>
                            <td>
                                <div style="display:flex;gap:0.4rem;">
                                    <button class="btn btn-outline btn-sm" onclick="window.showEditUserModal(${JSON.stringify(u).replace(/"/g,'&quot;')})">Düzenle</button>
                                    <button class="btn btn-danger btn-sm" onclick="window.deleteUser(${u.id})">Sil</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}</tbody>
                </table>
                ${pager}
            `;
        } catch (e) {
            if (root) root.textContent = e.message;
        }
    };

    const searchEl = document.getElementById('sa-user-search');
    if (searchEl) {
        searchEl.value = state.search || '';
        let t = null;
        searchEl.oninput = () => {
            const v = searchEl.value || '';
            if (t) clearTimeout(t);
            t = setTimeout(() => {
                state.search = v.trim();
                window.loadSuperAdminUsersPage(1);
            }, 250);
        };
    }

    window.loadSuperAdminUsersPage(state.page || 1);
}

async function viewSuperAdminLogs(container) {
    renderSuperAdminShell(container, '#superadmin-logs', 'Sistem Günlükleri',
        `
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
            <input id="sa-log-search" type="search" placeholder="Log ara (işlem/kullanıcı/içerik)..." style="flex:1; min-width: 240px; padding:0.65rem 0.85rem; border-radius:10px; border:1px solid #e5e7eb;">
            <button class="btn btn-outline btn-sm" onclick="window.clearSuperAdminLogSearch()">Temizle</button>
        </div>
        <div style="font-size:0.8rem; color: var(--text-muted); margin-bottom: 1rem; padding: 0.5rem 0.75rem; background: #f8fafc; border-radius: 8px; border-left: 3px solid var(--accent);">
            <strong>İpucu:</strong> <code>AND</code>, <code>OR</code>, <code>NOT</code> operatörlerini kullanabilirsiniz (büyük harfle).
            Örnekler: <code>CREATE AND reservation</code> · <code>UPDATE OR DELETE</code> · <code>CREATE NOT service</code>
        </div>
        <div id="log-list" class="loading-row">Yükleniyor...</div>
        `
    );
    const root = document.getElementById('log-list');
    const state = window._saLogsState || { page: 1, search: '' };
    window._saLogsState = state;

    window.clearSuperAdminLogSearch = () => {
        state.search = '';
        const inp = document.getElementById('sa-log-search');
        if (inp) inp.value = '';
        window.loadSuperAdminLogsPage(1);
    };

    window.loadSuperAdminLogsPage = async (page = 1) => {
        state.page = Math.max(1, parseInt(page || 1, 10));
        if (root) root.innerHTML = 'Yükleniyor...';
        try {
            const data = await API.superadmin.getLogs(state.page, state.search || '');
            const pages = Number(data.pages || 1);
            const cur = Math.min(state.page, pages || 1);
            state.page = cur;

            const pager = pages > 1 ? `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; margin-top:1rem;">
                    <div style="color:var(--text-muted); font-size:0.85rem;">
                        Toplam: <strong>${Number(data.total || 0)}</strong> kayıt • Sayfa <strong>${cur}</strong>/<strong>${pages}</strong>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
                        <button class="btn btn-outline btn-sm" ${cur <= 1 ? 'disabled' : ''} onclick="window.loadSuperAdminLogsPage(${cur - 1})">Önceki</button>
                        <select class="pretty-select" style="width:auto; min-width:120px;" onchange="window.loadSuperAdminLogsPage(this.value)">
                            ${Array.from({ length: pages }, (_, i) => i + 1).map(p => `<option value="${p}" ${p === cur ? 'selected' : ''}>Sayfa ${p}</option>`).join('')}
                        </select>
                        <button class="btn btn-outline btn-sm" ${cur >= pages ? 'disabled' : ''} onclick="window.loadSuperAdminLogsPage(${cur + 1})">Sonraki</button>
                    </div>
                </div>
            ` : '';

            root.innerHTML = `
                <table class="admin-table">
                    <thead><tr><th>Zaman</th><th>İşlem</th><th>Kullanıcı ID</th></tr></thead>
                    <tbody>${(data.logs || []).map(l => `
                        <tr>
                            <td style="font-size:0.82rem;color:#666;">${l.timestamp}</td>
                            <td style="word-break:break-word;">${l.action}</td>
                            <td>${l.user_id}</td>
                        </tr>
                    `).join('')}</tbody>
                </table>
                ${pager}
            `;
        } catch (e) {
            if (root) root.textContent = e.message;
        }
    };

    const searchEl = document.getElementById('sa-log-search');
    if (searchEl) {
        searchEl.value = state.search || '';
        let t = null;
        searchEl.oninput = () => {
            const v = searchEl.value || '';
            if (t) clearTimeout(t);
            t = setTimeout(() => {
                state.search = v.trim();
                window.loadSuperAdminLogsPage(1);
            }, 250);
        };
    }

    window.loadSuperAdminLogsPage(state.page || 1);
}

window.showEditUserModal = (u) => {
    showModal('Kullanıcı Düzenle', `
        <form id="edit-user-form">
            <div class="form-group"><label>Ad Soyad</label><input type="text" id="eu-name" value="${u.name}" required></div>
            <div class="form-group"><label>E-posta</label><input type="email" id="eu-email" value="${u.email}" required></div>
            <div class="form-group"><label>Rol</label>
                <select id="eu-role" class="pretty-select">
                    <option value="customer" ${u.role==='customer'?'selected':''}>customer</option>
                    <option value="staff" ${u.role==='staff'?'selected':''}>staff</option>
                    <option value="business_owner" ${u.role==='business_owner'?'selected':''}>business_owner</option>
                    <option value="superadmin" ${u.role==='superadmin'?'selected':''}>superadmin</option>
                </select>
            </div>
            <div class="form-group"><label>İşletme ID <span style="color:#999;font-size:0.8rem;">(staff/business_owner için)</span></label><input type="number" id="eu-biz" value="${u.business_id || ''}"></div>
            <div class="form-group"><label>Yeni Şifre <span style="color:#999;font-size:0.8rem;">(boş bırakılabilir)</span></label><input type="password" id="eu-pass"></div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:1rem;">Kaydet</button>
        </form>
    `);
    document.getElementById('edit-user-form').onsubmit = async (e) => {
        e.preventDefault();
        const bizVal = document.getElementById('eu-biz').value;
        const payload = { 
            name: document.getElementById('eu-name').value, 
            email: document.getElementById('eu-email').value, 
            role: document.getElementById('eu-role').value,
            business_id: bizVal ? parseInt(bizVal) : null
        };
        const pass = document.getElementById('eu-pass').value;
        if (pass) payload.password = pass;
        try {
            await API.superadmin.updateUser(u.id, payload);
            showToast('Kullanıcı güncellendi.');
            closeModal();
            if (typeof window.loadSuperAdminUsersPage === 'function') {
                window.loadSuperAdminUsersPage(window._saUsersState?.page || 1);
            } else {
                viewSuperAdminUsers(document.getElementById('app-root'));
            }
        } catch (err) { showToast(err.message, 'error'); }
    };
};

window.deleteUser = async (id) => {
    if (!confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
        await API.superadmin.deleteUser(id);
        showToast('Kullanıcı silindi.');
        if (typeof window.loadSuperAdminUsersPage === 'function') {
            window.loadSuperAdminUsersPage(window._saUsersState?.page || 1);
        } else {
            viewSuperAdminUsers(document.getElementById('app-root'));
        }
    } catch (e) { showToast(e.message, 'error'); }
};

// --- SuperAdmin Helper Functions ---

window.showBusinessFormModal = async (biz = null) => {
    const isEdit = !!biz;
    const title = isEdit ? 'İşletme Düzenle' : 'Yeni İşletme Ekle';

    const locations = await loadLocationData();
    const ilOptions = locations.iller.map(il => 
        `<option value="${il.name}" ${biz?.il === il.name ? 'selected' : ''}>${il.name}</option>`
    ).join('');

    const html = `
        <form id="biz-form" style="max-height: 70vh; overflow-y: auto; padding-right: 0.5rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group"><label>İşletme Adı</label><input type="text" id="biz-name" value="${biz?.name || ''}" required></div>
                <div class="form-group"><label>Tür</label>
                    <select id="biz-type" class="pretty-select">
                        <option value="konaklama" ${biz?.type === 'konaklama' ? 'selected' : ''}>Konaklama</option>
                        <option value="yeme-icme" ${biz?.type === 'yeme-icme' ? 'selected' : ''}>Yeme & İçme</option>
                        <option value="guzellik" ${biz?.type === 'guzellik' ? 'selected' : ''}>Güzellik & Bakım</option>
                        <option value="saglik" ${biz?.type === 'saglik' ? 'selected' : ''}>Sağlık & Wellness</option>
                        <option value="spor" ${biz?.type === 'spor' ? 'selected' : ''}>Spor & Aktivite</option>
                        <option value="etkinlik" ${biz?.type === 'etkinlik' ? 'selected' : ''}>Etkinlik & Organizasyon</option>
                        <option value="hizmet" ${biz?.type === 'hizmet' ? 'selected' : ''}>Hizmet & Servis</option>
                        <option value="egitim" ${biz?.type === 'egitim' ? 'selected' : ''}>Eğitim</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Açıklama</label><textarea id="biz-desc" rows="2">${biz?.description || ''}</textarea></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group"><label>İl</label>
                    <select id="biz-il" class="pretty-select" onchange="window.updateBizIlceSelect()">
                        <option value="">Seçiniz</option>
                        ${ilOptions}
                    </select>
                </div>
                <div class="form-group"><label>İlçe</label>
                    <select id="biz-ilce" class="pretty-select">
                        <option value="">Önce il seçin</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Açık Adres</label><input type="text" id="biz-address" value="${biz?.address || ''}" placeholder="Mahalle, cadde, bina no..."></div>
            <div class="form-group"><label>Görsel URL</label><input type="text" id="biz-image" value="${biz?.image_url || ''}"></div>
            ${!isEdit ? `
                <hr style="margin: 1rem 0; border: none; border-top: 1px solid #eee;">
                <p style="font-weight: 600; margin-bottom: 0.8rem; font-size: 0.9rem;">İşletme Sahibi (Opsiyonel)</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                    <div class="form-group"><label>Ad Soyad</label><input type="text" id="owner-name"></div>
                    <div class="form-group"><label>E-posta</label><input type="email" id="owner-email"></div>
                </div>
                <div class="form-group">
                    <label>Cep telefonu</label>
                    <div class="phone-input-row">
                        <span class="phone-input-prefix" aria-hidden="true">+90</span>
                        <input type="tel" id="owner-phone" class="phone-input-field" inputmode="numeric" autocomplete="tel-national" placeholder="5XX XXX XX XX">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                    <div class="form-group"><label>Şifre</label><input type="password" id="owner-pass"></div>
                    <div class="form-group"><label>Şifre tekrar</label><input type="password" id="owner-pass2"></div>
                </div>
            ` : ''}
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">${isEdit ? 'Güncelle' : 'Ekle'}</button>
        </form>
    `;

    window.showModal(title, html);

    if (biz?.il) {
        setTimeout(() => window.updateBizIlceSelect(biz.ilce), 100);
    }
    const ownerPhoneEl = document.getElementById('owner-phone');
    if (ownerPhoneEl) wireProfilePhoneInput(ownerPhoneEl);

    document.getElementById('biz-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('biz-name').value,
            type: document.getElementById('biz-type').value,
            description: document.getElementById('biz-desc').value,
            il: document.getElementById('biz-il').value,
            ilce: document.getElementById('biz-ilce').value,
            address: document.getElementById('biz-address').value,
            image_url: document.getElementById('biz-image').value
        };
        if (!isEdit) {
            const ownerName = document.getElementById('owner-name')?.value?.trim();
            const ownerEmail = document.getElementById('owner-email')?.value?.trim();
            const ownerPass = document.getElementById('owner-pass')?.value;
            const ownerPass2 = document.getElementById('owner-pass2')?.value;
            const ownerPhone = ownerPhoneEl ? phoneInputToApiPayload(ownerPhoneEl) : null;
            const anyOwner = !!(ownerName || ownerEmail || ownerPass || ownerPass2 || (ownerPhoneEl && parseProfilePhoneToDigits(ownerPhoneEl.value)));
            if (anyOwner) {
                if (!ownerName || !ownerEmail || !ownerPass) {
                    showToast('İşletme sahibi için ad, e-posta ve şifre zorunludur.', 'error');
                    return;
                }
                if (ownerPass !== ownerPass2) {
                    showToast('İşletme sahibi şifreleri eşleşmiyor', 'error');
                    return;
                }
                if (!ownerPhone) {
                    showToast('İşletme sahibi için geçerli cep telefonu girin (05XX…)', 'error');
                    return;
                }
                data.owner_name = ownerName;
                data.owner_email = ownerEmail;
                data.owner_password = ownerPass;
                data.owner_phone = ownerPhone;
            }
        }
        try {
            if (isEdit) await API.superadmin.updateBusiness(biz.id, data);
            else await API.superadmin.createBusiness(data);
            showToast("İşletme başarıyla kaydedildi.");
            window.closeModal();
            if (typeof window.loadSuperAdminBusinessesPage === 'function') {
                window.loadSuperAdminBusinessesPage(window._saBizState?.page || 1);
            } else {
                viewSuperAdminBusinesses(document.getElementById('app-root'));
            }
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.updateBizIlceSelect = async (selectedIlce = null) => {
    const ilName = document.getElementById('biz-il').value;
    const ilceSelect = document.getElementById('biz-ilce');
    ilceSelect.innerHTML = '<option value="">Seçiniz</option>';
    
    if (ilName && locationData) {
        const il = locationData.iller.find(i => i.name === ilName);
        if (il) {
            const filteredIlceler = locationData.ilceler
                .filter(i => i.il_id === il.id)
                .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
            filteredIlceler.forEach(ilce => {
                ilceSelect.innerHTML += `<option value="${ilce.name}" ${selectedIlce === ilce.name ? 'selected' : ''}>${ilce.name}</option>`;
            });
        }
    }
};

window.deleteBusiness = async (id) => {
    if (!confirm("İşletmeyi silmek istediğinize emin misiniz? Bağlı tüm hizmetler etkilenebilir.")) return;
    try {
        await API.superadmin.deleteBusiness(id);
        showToast("İşletme silindi.");
        if (typeof window.loadSuperAdminBusinessesPage === 'function') {
            window.loadSuperAdminBusinessesPage(window._saBizState?.page || 1);
        } else {
            viewSuperAdminBusinesses(document.getElementById('app-root'));
        }
    } catch (e) { showToast(e.message, 'error'); }
};

window.toggleHotelFields = (val) => {
    document.getElementById('hotel-fields').style.display = val === 'hotel' ? 'block' : 'none';
};

// --- Business Owner Views ---

async function viewBusinessDashboard(container) {
    const todayISO = new Date().toISOString().slice(0, 10);
    const fmtDate = (iso) => {
        if (!iso) return '—';
        try { return new Date(iso).toLocaleDateString('tr-TR'); } catch (_) { return String(iso); }
    };
    const fmtDateTime = (d, t) => {
        if (!d) return '—';
        const time = t ? ` ${t}` : '';
        return `${d}${time}`;
    };
    const safe = (v) => (v == null ? '' : String(v));

    renderBusinessShell(container, '#business-dashboard', 'İşletme Paneli', `
        <div class="biz-dashboard">
            <div class="biz-dashboard__top">
                <div class="biz-dashboard__kpis" id="biz-kpis">
                    ${Array.from({ length: 6 }).map(() => `
                        <div class="kpi-card">
                            <div class="skeleton skeleton--line" style="width:48%"></div>
                            <div class="skeleton skeleton--line" style="width:64%; height:32px; margin-top:10px;"></div>
                        </div>
                    `).join('')}
                </div>

                <div class="biz-dashboard__actions">
                    <a class="btn btn-primary" href="#business-reservations">Rezervasyonlar</a>
                    <button class="btn btn-outline" onclick="window.showManualReservationModal()">+ Manuel Rezervasyon</button>
                    <a class="btn btn-outline" href="#business-services">Hizmetler</a>
                    <button class="btn btn-outline" onclick="window.showBizServiceFormModal()">+ Hizmet Ekle</button>
                    <a class="btn btn-outline" href="#business-staff">Personel</a>
                    <button class="btn btn-outline" onclick="window.showBizStaffFormModal()">+ Personel Ekle</button>
                </div>
            </div>

            <div class="biz-dashboard__grid">
                <div class="panel-card">
                    <div class="panel-header">
                        <h3>Bugünün Ajandası</h3>
                        <span class="panel-sub">${fmtDate(todayISO)}</span>
                    </div>
                    <div class="panel-body" id="biz-today-list">
                        <div class="skeleton skeleton--block" style="height:120px"></div>
                    </div>
                </div>

                <div class="panel-card">
                    <div class="panel-header">
                        <h3>Durum Dağılımı</h3>
                        <span class="panel-sub">Genel</span>
                    </div>
                    <div class="panel-body">
                        <div class="chart-wrap">
                            <canvas id="biz-status-chart" height="160"></canvas>
                        </div>
                    </div>
                </div>

                <div class="panel-card panel-card--full">
                    <div class="panel-header">
                        <h3>Son Rezervasyonlar</h3>
                        <a class="panel-link" href="#business-reservations">Tümünü gör</a>
                    </div>
                    <div class="panel-body" id="biz-recent-res">
                        <div class="skeleton skeleton--block" style="height:160px"></div>
                    </div>
                </div>
            </div>

            <div class="panel-card panel-card--full" id="biz-empty-hints" style="display:none;">
                <div class="panel-header">
                    <h3>Hızlı Başlangıç</h3>
                    <span class="panel-sub">Paneli dolduralım</span>
                </div>
                <div class="panel-body">
                    <div class="empty-hints">
                        <div class="empty-hints__text">
                            <p style="margin:0 0 0.75rem; color: var(--text-muted);">İlk adımları tamamladıkça burası otomatik dolacak.</p>
                            <ul class="empty-hints__list">
                                <li><a href="#business-services">En az 1 hizmet ekle</a></li>
                                <li><a href="#business-reservations">İlk rezervasyonunu al</a> veya <button class="linklike" onclick="window.showManualReservationModal()">manuel ekle</button></li>
                                <li><a href="#business-staff">Personel ekle</a> (opsiyonel)</li>
                            </ul>
                        </div>
                        <div class="empty-hints__actions">
                            <button class="btn btn-primary" onclick="window.showBizServiceFormModal()">+ Hizmet Ekle</button>
                            <button class="btn btn-outline" onclick="window.showManualReservationModal()">+ Manuel Rezervasyon</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);

    const kpiEl = document.getElementById('biz-kpis');
    const todayEl = document.getElementById('biz-today-list');
    const recentEl = document.getElementById('biz-recent-res');
    const emptyHintsEl = document.getElementById('biz-empty-hints');

    try {
        const [stats, resData] = await Promise.all([
            API.business.getStats(),
            API.business.getReservations(1, '')
        ]);

        const total = Number(stats.total_reservations || 0);
        const approved = Number(stats.approved || 0);
        const pending = Number(stats.pending || 0);
        const rejected = Number(stats.rejected || 0);
        const services = Number(stats.total_services || 0);
        const staff = Number(stats.total_staff || 0);
        const approvalRate = total ? Math.round((approved / total) * 100) : 0;

        const cards = [
            { label: 'Toplam Rezervasyon', value: total, hint: 'Genel' },
            { label: 'Beklemede', value: pending, hint: 'Yanıt bekliyor' },
            { label: 'Onaylandı', value: approved, hint: `Onay oranı %${approvalRate}` },
            { label: 'Reddedildi', value: rejected, hint: 'İptal/ret' },
            { label: 'Hizmet', value: services, hint: services ? 'Aktif' : 'Henüz yok' },
            { label: 'Personel', value: staff, hint: staff ? 'Aktif' : 'Opsiyonel' }
        ];
        kpiEl.innerHTML = cards.map(c => `
            <div class="kpi-card">
                <div class="kpi-title">${c.label}</div>
                <div class="kpi-value">${safe(c.value)}</div>
                <div class="kpi-hint">${c.hint}</div>
            </div>
        `).join('');

        // Chart (status distribution)
        const ctx = document.getElementById('biz-status-chart');
        if (ctx && window.Chart) {
            const chartData = [pending, approved, rejected];
            const sum = chartData.reduce((a, b) => a + b, 0);
            const hasData = sum > 0;
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Beklemede', 'Onaylandı', 'Reddedildi'],
                    datasets: [{
                        data: hasData ? chartData : [1],
                        backgroundColor: hasData ? ['#f59e0b', '#10b981', '#ef4444'] : ['#e5e7eb'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: { enabled: hasData }
                    },
                    cutout: '62%'
                }
            });
        }

        const reservations = Array.isArray(resData?.reservations) ? resData.reservations : [];

        // Today agenda
        const todayItems = reservations.filter(r => {
            const d = r.slot_date || r.check_in || '';
            return d === todayISO;
        });
        if (!todayItems.length) {
            todayEl.innerHTML = `
                <div class="empty-mini">
                    <div class="empty-mini__title">Bugün için kayıt yok.</div>
                    <div class="empty-mini__sub">Yeni rezervasyon geldiğinde burada görünecek.</div>
                </div>
            `;
        } else {
            const slice = todayItems.slice(0, 6);
            todayEl.innerHTML = `
                <div class="mini-list">
                    ${slice.map(r => `
                        <div class="mini-list__item">
                            <div class="mini-list__main">
                                <div class="mini-list__title">${safe(r.service_name)}</div>
                                <div class="mini-list__sub">${safe(r.user_name || '—')} • ${fmtDateTime(r.slot_date || r.check_in, r.slot_time)}</div>
                            </div>
                            <div class="mini-list__meta">
                                <span class="badge badge-${safe(r.status)}">${LOCALE.STATUS[r.status] || safe(r.status)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Recent reservations
        const sorted = reservations.slice().sort((a, b) => {
            const ad = a.slot_date || a.check_in || '';
            const bd = b.slot_date || b.check_in || '';
            const at = a.slot_time || '';
            const bt = b.slot_time || '';
            const aKey = `${ad} ${at}`.trim();
            const bKey = `${bd} ${bt}`.trim();
            return bKey.localeCompare(aKey);
        });
        const recent = sorted.slice(0, 10);
        if (!recent.length) {
            recentEl.innerHTML = `
                <div class="empty-mini">
                    <div class="empty-mini__title">Henüz rezervasyon yok.</div>
                    <div class="empty-mini__sub">Manuel ekleyebilir veya müşterilerden rezervasyon alabilirsiniz.</div>
                    <div style="margin-top:0.9rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
                        <button class="btn btn-primary" onclick="window.showManualReservationModal()">+ Manuel Rezervasyon</button>
                        <a class="btn btn-outline" href="#business-services">Hizmetleri düzenle</a>
                    </div>
                </div>
            `;
        } else {
            recentEl.innerHTML = `
                <div class="res-table-wrap">
                    <table class="admin-table" style="margin-top:0;">
                        <thead><tr><th>Müşteri</th><th>Hizmet</th><th>Tarih</th><th>Durum</th></tr></thead>
                        <tbody>
                            ${recent.map(r => `
                                <tr>
                                    <td>${safe(r.user_name || '—')}</td>
                                    <td>${safe(r.service_name || '—')}</td>
                                    <td style="font-size:0.85rem;">${r.slot_date ? `${safe(r.slot_date)} ${safe(r.slot_time || '')}` : (r.check_in ? `${safe(r.check_in)} → ${safe(r.check_out)}` : '—')}</td>
                                    <td><span class="badge badge-${safe(r.status)}">${LOCALE.STATUS[r.status] || safe(r.status)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Empty hints visibility
        const showHints = services === 0 || total === 0;
        if (emptyHintsEl) emptyHintsEl.style.display = showHints ? 'block' : 'none';
    } catch (e) {
        showToast(e.message, 'error');
        if (kpiEl) kpiEl.innerHTML = `<div class="loading-row" style="grid-column:1/-1; color:var(--error);">Veriler yüklenemedi: ${safe(e.message)}</div>`;
        if (todayEl) todayEl.innerHTML = `<p style="color:var(--error);">${safe(e.message)}</p>`;
        if (recentEl) recentEl.innerHTML = `<p style="color:var(--error);">${safe(e.message)}</p>`;
    }
}

async function viewBusinessServices(container) {
    renderBusinessShell(container, '#business-services', 'Hizmet Yönetimi',
        `<div id="biz-services-list" class="loading-row">Yükleniyor...</div>`,
        `<button class="btn btn-primary" onclick="window.showBizServiceFormModal()">+ Yeni Hizmet Ekle</button>`
    );
    window.loadBusinessServices();
}

window.loadBusinessServices = async () => {
    const list = document.getElementById('biz-services-list');
    try {
        const services = await API.business.getServices();
        list.innerHTML = `
            <table class="admin-table">
                <thead><tr><th>Ad</th><th>Kategori</th><th>Fiyat</th><th>İşlemler</th></tr></thead>
                <tbody>
                    ${services.map(s => `
                        <tr>
                            <td><strong>${s.name}</strong></td>
                            <td><span class="badge" style="background:#eee">${s.category === 'hotel' ? 'Oda' : 'Randevu'}</span></td>
                            <td>${s.price ? `${s.price.toLocaleString('tr-TR')} ₺` : '-'}</td>
                            <td>
                                <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                                    ${s.category === 'hotel' 
                                        ? `<button class="btn btn-outline btn-sm" onclick="window.showAvailabilityManager(${s.id}, '${s.name.replace(/'/g,"\\'")}')">Rezervasyon Tarihleri</button>`
                                        : `<button class="btn btn-outline btn-sm" onclick="window.showApptAvailabilityManager(${s.id}, '${s.name.replace(/'/g,"\\'")}')">Müsaitlik Oluştur</button>
                                           <button class="btn btn-outline btn-sm" onclick="window.showSlotsModal(${s.id}, '${s.name.replace(/'/g,"\\'")}', false)">Slotlar</button>`
                                    }
                                    <button class="btn btn-outline btn-sm" onclick="window.showBizServiceFormModal(${JSON.stringify(s).replace(/"/g, '&quot;')})">Düzenle</button>
                                    <button class="btn btn-danger btn-sm" onclick="window.deleteBizService(${s.id})">Sil</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) { list.innerHTML = e.message; }
};

window.showBizServiceFormModal = async (service = null) => {
    const isEdit = !!service;
    const title = isEdit ? 'Hizmet Düzenle' : 'Yeni Hizmet Ekle';

    const html = `
        <form id="biz-service-form">
            <div class="form-group"><label>Hizmet Adı</label><input type="text" id="bsvc-name" value="${service?.name || ''}" required></div>
            <div class="form-group"><label>Açıklama</label><textarea id="bsvc-desc">${service?.description || ''}</textarea></div>
            <div class="form-group"><label>Fiyat (₺)</label><input type="number" step="0.01" id="bsvc-price" value="${service?.price || ''}" placeholder="Örn: 150.00"></div>
            <div class="form-group"><label>Kategori</label>
                <select id="bsvc-cat" class="pretty-select" onchange="toggleHotelFields(this.value)">
                    <option value="hotel" ${service?.category === 'hotel' ? 'selected' : ''}>Otel Odası</option>
                    <option value="appointment" ${service?.category === 'appointment' ? 'selected' : ''}>Randevu Hizmeti</option>
                </select>
            </div>
            <div id="hotel-fields" style="display: ${service?.category === 'appointment' ? 'none' : 'block'}">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group"><label>Oda No</label><input type="text" id="bsvc-room-num" value="${service?.room_number || ''}"></div>
                    <div class="form-group"><label>Oda Tipi</label><input type="text" id="bsvc-room-type" value="${service?.room_type || ''}"></div>
                </div>
            </div>
            <div class="form-group"><label>Görsel URL</label><input type="text" id="bsvc-image" value="${service?.image_url || ''}"></div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">${isEdit ? 'Kaydet' : 'Ekle'}</button>
        </form>
    `;
    showModal(title, html);

    document.getElementById('biz-service-form').onsubmit = async (e) => {
        e.preventDefault();
        const priceVal = document.getElementById('bsvc-price').value;
        const payload = {
            name: document.getElementById('bsvc-name').value,
            description: document.getElementById('bsvc-desc').value,
            category: document.getElementById('bsvc-cat').value,
            room_number: document.getElementById('bsvc-room-num')?.value || null,
            room_type: document.getElementById('bsvc-room-type')?.value || null,
            image_url: document.getElementById('bsvc-image').value,
            price: priceVal ? parseFloat(priceVal) : null
        };
        try {
            if (isEdit) await API.business.updateService(service.id, payload);
            else await API.business.createService(payload);
            showToast("Başarıyla kaydedildi");
            closeModal();
            loadBusinessServices();
        } catch (err) { showToast(err.message, 'error'); }
    };
};

window.showSlotsModal = async (serviceId, serviceName, isHotel = false) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (isHotel) {
        showModal(`${serviceName} - Günlük Müsaitlik`, `
            <p style="margin-bottom:1rem; color:#666;">Otel odaları için günlük müsaitlik takvimi. Tıklayarak durumu değiştirebilirsiniz.</p>
            <div id="slots-grid" style="display:grid; grid-template-columns: repeat(7, 1fr); gap:0.5rem;">
                <div class="loading-row">Yükleniyor...</div>
            </div>
        `);
        window.loadHotelSlotsForModal(serviceId);
    } else {
        showModal(`${serviceName} - Zaman Dilimleri`, `
            <div style="margin-bottom:1rem;">
                <label style="font-weight:600;">Tarih Seç:</label>
                <input type="date" id="slot-date-filter" value="${today}" onchange="window.loadSlotsForModal(${serviceId})" style="padding:0.5rem; border-radius:8px; border:1px solid #ddd; margin-left:0.5rem;">
            </div>
            <div id="slots-grid" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:0.5rem;">
                <div class="loading-row">Yükleniyor...</div>
            </div>
            <p style="margin-top:1rem; font-size:0.85rem; color:#666;">Tıklayarak slotu meşgul/müsait yapabilirsiniz.</p>
        `);
        window.loadSlotsForModal(serviceId);
    }
};

window.loadHotelSlotsForModal = async (serviceId) => {
    const grid = document.getElementById('slots-grid');
    grid.innerHTML = '<div class="loading-row" style="grid-column:1/-1;">Yükleniyor...</div>';

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let slots;
        if (user.role === 'business_owner') {
            slots = await API.business.getSlots(serviceId, '');
        } else {
            slots = await API.staff.getSlots(serviceId, '');
        }

        if (!slots.length) {
            grid.innerHTML = '<p style="grid-column:1/-1; color:#999; text-align:center; padding:2rem;">Slot bulunamadı. "Müsaitlik Oluştur" ile 30 günlük takvim oluşturun.</p>';
            return;
        }

        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        grid.innerHTML = slots.slice(0, 30).map(s => {
            const d = new Date(s.date);
            const dayName = dayNames[d.getDay()];
            const dayNum = d.getDate();
            const month = d.getMonth() + 1;
            return `
                <div onclick="window.toggleSlotAvailability(${s.id}, ${serviceId}, true)"
                     style="cursor:pointer; padding:0.6rem 0.3rem; border-radius:8px; text-align:center; border:1px solid ${s.is_available ? '#10b981' : '#ef4444'}; background:${s.is_available ? '#f0fdf4' : '#fef2f2'};">
                    <div style="font-size:0.7rem; color:#666;">${dayName}</div>
                    <div style="font-weight:600; font-size:0.9rem;">${dayNum}/${month}</div>
                    <div style="font-size:0.65rem; color:${s.is_available ? '#10b981' : '#ef4444'}; margin-top:2px;">${s.is_available ? 'Müsait' : 'Dolu'}</div>
                </div>
            `;
        }).join('');
    } catch (e) { grid.innerHTML = `<p style="color:var(--error); grid-column:1/-1;">${e.message}</p>`; }
};

window.loadSlotsForModal = async (serviceId) => {
    const date = document.getElementById('slot-date-filter').value;
    const grid = document.getElementById('slots-grid');
    grid.innerHTML = '<div class="loading-row">Yükleniyor...</div>';

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let slots;
        if (user.role === 'business_owner') {
            slots = await API.business.getSlots(serviceId, date);
        } else {
            slots = await API.staff.getSlots(serviceId, date);
        }

        if (!slots.length) {
            grid.innerHTML = '<p style="grid-column:1/-1; color:#999; text-align:center; padding:2rem;">Bu tarihte slot bulunamadı.</p>';
            return;
        }

        grid.innerHTML = slots.map(s => `
            <div class="slot-item ${s.is_available ? 'available' : 'booked'}"
                 onclick="window.toggleSlotAvailability(${s.id}, ${serviceId}, false)"
                 style="cursor:pointer; padding:0.75rem; border-radius:8px; text-align:center; border:1px solid ${s.is_available ? '#10b981' : '#ef4444'}; background:${s.is_available ? '#f0fdf4' : '#fef2f2'};">
                <div style="font-weight:600;">${s.start_time.substring(0,5)}</div>
                <div style="font-size:0.75rem; color:${s.is_available ? '#10b981' : '#ef4444'};">${s.is_available ? 'Müsait' : 'Meşgul'}</div>
            </div>
        `).join('');
    } catch (e) { grid.innerHTML = `<p style="color:var(--error);">${e.message}</p>`; }
};

window.toggleSlotAvailability = async (slotId, serviceId, isHotel = false) => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'business_owner') {
            await API.business.toggleSlot(slotId);
        } else {
            await API.staff.toggleSlot(slotId);
        }
        showToast('Slot durumu güncellendi');
        if (isHotel) {
            if (window._hotelAvailCtx && window._hotelAvailCtx.serviceId === serviceId) {
                await window.openHotelAvailCalendar(serviceId, window._hotelAvailCtx.gridId);
            } else {
                // fallback (eski akışlar)
                try { loadHotelCalendar(serviceId); } catch (_) {}
                try { loadStaffHotelCalendar(serviceId); } catch (_) {}
            }
        } else {
            window.loadSlotsForModal(serviceId);
        }
    } catch (e) { showToast(e.message, 'error'); }
};

window.generateBizSlots = async (id, category = 'appointment') => {
    const msg = "Bu hizmet için 7 günlük müsaitlik oluşturulacak.";
    if (!confirm(msg)) return;
    try {
        await API.business.generateSlots(id);
        showToast("Müsaitlik oluşturuldu!");
    } catch (err) { showToast(err.message, 'error'); }
};

window.showApptAvailabilityManager = async (serviceId, serviceName) => {
    // Appointment services: select date range on calendar and generate slots for that range
    showModal(`${serviceName} - Müsaitlik Oluştur`, `
        <div id="appt-avail-summary" style="margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 12px;"></div>
        <div id="appt-avail-calendar" style="border:1px solid #e2e8f0; border-radius:12px; padding:0.75rem; background:#fff;">
            <div class="loading-row">Yükleniyor...</div>
        </div>
        <p style="margin-top: 0.75rem; font-size: 0.8rem; color: #666;">
            Takvimden aralık seçip “Aralığı Aç” deyin. Mevcut günlerde tekrar oluşturma yapılmaz.
        </p>
    `);
    window.openApptAvailCalendar(serviceId, 'appt-avail-calendar', 'appt-avail-summary');
};

window.showAvailabilityManager = async (serviceId, serviceName) => {
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let summary = { min_date: null, max_date: null, total_slots: 0, available_slots: 0 };
    try {
        summary = await API.business.getAvailabilitySummary(serviceId);
    } catch (e) {}

    const html = `
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 12px;">
            <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #666;">Mevcut Rezervasyon Dönemi</h4>
            ${summary.min_date ? `
                <p style="font-size: 1.1rem; font-weight: 600; color: var(--accent);">
                    ${new Date(summary.min_date).toLocaleDateString('tr-TR')} - ${new Date(summary.max_date).toLocaleDateString('tr-TR')}
                </p>
                <p style="font-size: 0.85rem; color: #666; margin-top: 0.3rem;">
                    Toplam ${summary.total_slots} gün, ${summary.available_slots} gün müsait
                </p>
            ` : `<p style="color: #999;">Henüz rezervasyona açık tarih yok</p>`}
        </div>

        <div style="padding: 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h4 style="margin-bottom: 1rem;">Yeni Tarih Aralığı Ekle</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.85rem;">Başlangıç Tarihi</label>
                    <input type="date" id="avail-start" value="${today}" min="${today}" style="width: 100%; padding: 0.6rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.85rem;">Bitiş Tarihi</label>
                    <input type="date" id="avail-end" value="${threeMonthsLater}" min="${today}" style="width: 100%; padding: 0.6rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>
            </div>
            <button class="btn btn-primary" style="width: 100%;" onclick="window.addAvailabilityRange(${serviceId})">
                Seçilen Tarihleri Rezervasyona Aç
            </button>
        </div>

        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #eee;">

        <h4 style="margin-bottom: 1rem;">Takvim Görünümü</h4>
        <div id="hotel-calendar-grid" style="border:1px solid #e2e8f0; border-radius:12px; padding:0.75rem; background:#fff;">
            <div class="loading-row">Yükleniyor...</div>
        </div>
        <p style="margin-top: 0.8rem; font-size: 0.8rem; color: #666;">
            <span style="display:inline-block; width:12px; height:12px; background:#f0fdf4; border:1px solid #10b981; border-radius:3px; margin-right:4px;"></span> Müsait
            <span style="display:inline-block; width:12px; height:12px; background:#fef2f2; border:1px solid #ef4444; border-radius:3px; margin-left:12px; margin-right:4px;"></span> Dolu
            <span style="display:inline-block; width:12px; height:12px; background:#fff7ed; border:1px solid #f59e0b; border-radius:3px; margin-left:12px; margin-right:4px;"></span> Rezerve (kilitli)
        </p>
    `;

    showModal(`${serviceName} - Rezervasyon Yapılabilir Tarihler`, html);
    window.openHotelAvailCalendar(serviceId, 'hotel-calendar-grid');
};

async function loadHotelCalendar(serviceId) {
    const grid = document.getElementById('hotel-calendar-grid');
    
    try {
        const slots = await API.business.getSlots(serviceId, '');
        
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        
        grid.innerHTML = dayNames.map(d => 
            `<div style="text-align:center; font-weight:600; padding:0.3rem; color:#666; font-size:0.75rem;">${d}</div>`
        ).join('');

        if (!slots.length) {
            grid.innerHTML += '<p style="grid-column:1/-1; color:#999; text-align:center; padding:2rem;">Takvimde gösterilecek tarih yok. Yukarıdan tarih aralığı ekleyin.</p>';
            return;
        }

        const slotMap = {};
        slots.forEach(s => { slotMap[s.date] = s; });

        const minDate = new Date(Math.min(...slots.map(s => new Date(s.date))));
        const maxDate = new Date(Math.max(...slots.map(s => new Date(s.date))));
        
        const startOfWeek = new Date(minDate);
        startOfWeek.setDate(minDate.getDate() - minDate.getDay());

        let currentDate = new Date(startOfWeek);
        const endPadded = new Date(maxDate);
        endPadded.setDate(maxDate.getDate() + (6 - maxDate.getDay()));

        while (currentDate <= endPadded) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const slot = slotMap[dateStr];
            const isInRange = currentDate >= minDate && currentDate <= maxDate;
            const dayNum = currentDate.getDate();
            
            if (slot) {
                grid.innerHTML += `
                    <div onclick="window.toggleSlotAvailability(${slot.id}, ${serviceId}, true)"
                         style="cursor:pointer; padding:0.5rem 0.2rem; border-radius:6px; text-align:center; 
                                border:1px solid ${slot.is_available ? '#10b981' : '#ef4444'}; 
                                background:${slot.is_available ? '#f0fdf4' : '#fef2f2'};">
                        <div style="font-weight:600; font-size:0.9rem;">${dayNum}</div>
                    </div>
                `;
            } else if (isInRange) {
                grid.innerHTML += `
                    <div style="padding:0.5rem 0.2rem; border-radius:6px; text-align:center; 
                                border:1px solid #cbd5e1; background:#f1f5f9; opacity:0.5;">
                        <div style="font-weight:600; font-size:0.9rem; color:#94a3b8;">${dayNum}</div>
                    </div>
                `;
            } else {
                grid.innerHTML += `
                    <div style="padding:0.5rem 0.2rem; text-align:center; opacity:0.3;">
                        <div style="font-size:0.9rem; color:#cbd5e1;">${dayNum}</div>
                    </div>
                `;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
    } catch (e) { 
        grid.innerHTML = `<p style="color:var(--error); grid-column:1/-1;">${e.message}</p>`; 
    }
}

window.addAvailabilityRange = async (serviceId) => {
    const startDate = document.getElementById('avail-start').value;
    const endDate = document.getElementById('avail-end').value;

    if (!startDate || !endDate) {
        showToast("Lütfen başlangıç ve bitiş tarihi seçin.", "error");
        return;
    }

    if (new Date(endDate) < new Date(startDate)) {
        showToast("Bitiş tarihi başlangıçtan önce olamaz.", "error");
        return;
    }

    try {
        const result = await API.business.generateSlots(serviceId, { start_date: startDate, end_date: endDate });
        showToast(result.msg);
        loadHotelCalendar(serviceId);
        
        const summary = await API.business.getAvailabilitySummary(serviceId);
        const summaryDiv = document.querySelector('.modal-content > div:first-child');
        if (summaryDiv && summary.min_date) {
            summaryDiv.innerHTML = `
                <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #666;">Mevcut Rezervasyon Dönemi</h4>
                <p style="font-size: 1.1rem; font-weight: 600; color: var(--accent);">
                    ${new Date(summary.min_date).toLocaleDateString('tr-TR')} - ${new Date(summary.max_date).toLocaleDateString('tr-TR')}
                </p>
                <p style="font-size: 0.85rem; color: #666; margin-top: 0.3rem;">
                    Toplam ${summary.total_slots} gün, ${summary.available_slots} gün müsait
                </p>
            `;
        }
    } catch (err) { showToast(err.message, 'error'); }
};

window.deleteBizService = async (id) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
        await API.business.deleteService(id);
        loadBusinessServices();
    } catch (e) { showToast(e.message, 'error'); }
};

async function viewBusinessReservations(container) {
    renderBusinessShell(container, '#business-reservations', 'Rezervasyonlar',
        `<div id="biz-res-list" class="loading-row">Yükleniyor...</div>`,
        `<button class="btn btn-primary" onclick="window.showManualReservationModal()">+ Manuel Rezervasyon</button>`
    );
    
    try {
        const data = await API.business.getReservations();
        document.getElementById('biz-res-list').innerHTML = `
            <table class="admin-table">
                <thead><tr><th>Müşteri</th><th>İletişim</th><th>Hizmet</th><th>Tarih</th><th>Durum</th><th>İşlemler</th></tr></thead>
                <tbody>
                    ${data.reservations.map(r => `
                        <tr>
                            <td>${r.user_name || '—'}</td>
                            <td style="font-size:0.85rem;">
                                <div style="display:flex; flex-direction:column; gap:0.15rem;">
                                    <span>${r.user_phone || '—'}</span>
                                    <span style="color:var(--text-muted);">${r.user_email || '—'}</span>
                                </div>
                            </td>
                            <td>${r.service_name}</td>
                            <td style="font-size:0.85rem;">${r.slot_date ? `${r.slot_date} ${r.slot_time || ''}` : (r.check_in ? `${r.check_in} → ${r.check_out}` : '—')}</td>
                            <td><span class="badge badge-${r.status}">${LOCALE.STATUS[r.status]}</span></td>
                            <td>
                                <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                                ${r.status === 'pending' ? `
                                    <button class="btn btn-outline btn-sm" style="color:var(--success);border-color:var(--success);" onclick="window.bizUpdateResStatus(${r.id}, 'approved')">Onayla</button>
                                    <button class="btn btn-outline btn-sm" style="color:var(--error);border-color:var(--error);" onclick="window.bizUpdateResStatus(${r.id}, 'rejected')">Reddet</button>
                                ` : ''}
                                ${r.status === 'approved' ? `
                                    <button class="btn btn-outline btn-sm" style="color:var(--error);border-color:var(--error);" onclick="window.bizCancelRes(${r.id})">İptal Et</button>
                                ` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) { document.getElementById('biz-res-list').innerHTML = e.message; }
}

window.bizUpdateResStatus = async (id, status) => {
    try {
        await API.business.updateReservationStatus(id, status);
        viewBusinessReservations(document.getElementById('app-root'));
    } catch (e) { showToast(e.message, 'error'); }
};

window.bizCancelRes = async (id) => {
    if (!confirm('Onaylanan rezervasyon iptal edilsin mi?')) return;
    try {
        await API.business.updateReservationStatus(id, 'rejected');
        viewBusinessReservations(document.getElementById('app-root'));
        showToast('Rezervasyon iptal edildi.', 'success');
    } catch (e) { showToast(e.message, 'error'); }
};

async function viewBusinessStaff(container) {
    renderBusinessShell(container, '#business-staff', 'Personel Yönetimi',
        `<div id="biz-staff-list" class="loading-row">Yükleniyor...</div>`,
        `<button class="btn btn-primary" onclick="window.showBizStaffFormModal()">+ Yeni Personel Ekle</button>`
    );
    window.loadBusinessStaff();
}

window.loadBusinessStaff = async () => {
    const list = document.getElementById('biz-staff-list');
    try {
        const staff = await API.business.getStaff();
        list.innerHTML = `
            <table class="admin-table">
                <thead><tr><th>Ad</th><th>E-posta</th><th>Telefon</th><th>İşlemler</th></tr></thead>
                <tbody>
                    ${staff.map(s => `
                        <tr>
                            <td>${s.name}</td>
                            <td style="font-size:0.85rem;">${s.email}</td>
                            <td style="font-size:0.85rem;">${s.phone || '—'}</td>
                            <td>
                                <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                                    <button class="btn btn-outline btn-sm" onclick="window.showBizStaffFormModal(${JSON.stringify(s).replace(/"/g, '&quot;')})">Düzenle</button>
                                    <button class="btn btn-danger btn-sm" onclick="window.deleteBizStaff(${s.id})">Sil</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) { list.innerHTML = e.message; }
};

window.showBizStaffFormModal = (staff = null) => {
    const isEdit = !!staff;
    const title = isEdit ? 'Personel Düzenle' : 'Yeni Personel Ekle';
    
    const phoneVal = staff?.phone
        ? formatProfilePhoneDigits(parseProfilePhoneToDigits(staff.phone)).replace(/^0/, '')
        : '';
    const html = `
        <form id="biz-staff-form">
            <div class="form-group"><label>Ad Soyad</label><input type="text" id="bstaff-name" value="${staff?.name || ''}" required></div>
            <div class="form-group"><label>E-posta</label><input type="email" id="bstaff-email" value="${staff?.email || ''}" required></div>
            <div class="form-group">
                <label>Cep telefonu</label>
                <div class="phone-input-row">
                    <span class="phone-input-prefix" aria-hidden="true">+90</span>
                    <input type="tel" id="bstaff-phone" class="phone-input-field" inputmode="numeric" autocomplete="tel-national" ${isEdit ? '' : 'required'} placeholder="5XX XXX XX XX" value="${phoneVal}">
                </div>
            </div>
            <div class="form-group"><label>Şifre ${isEdit ? '<span style="color:#999;font-size:0.8rem;">(boş bırakılabilir)</span>' : ''}</label><input type="password" id="bstaff-pass" ${isEdit ? '' : 'required'}></div>
            ${!isEdit ? `<div class="form-group"><label>Şifre tekrar</label><input type="password" id="bstaff-pass2" required></div>` : ''}
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">${isEdit ? 'Kaydet' : 'Ekle'}</button>
        </form>
    `;
    showModal(title, html);
    wireProfilePhoneInput(document.getElementById('bstaff-phone'));

    document.getElementById('biz-staff-form').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('bstaff-name').value,
            email: document.getElementById('bstaff-email').value
        };
        const pass = document.getElementById('bstaff-pass').value;
        const pass2El = document.getElementById('bstaff-pass2');
        if (!isEdit && pass2El && pass !== pass2El.value) {
            showToast('Şifreler eşleşmiyor', 'error');
            return;
        }
        const phone = phoneInputToApiPayload(document.getElementById('bstaff-phone'));
        if (!phone) {
            showToast('Geçerli bir cep telefonu girin (05XX…)', 'error');
            return;
        }
        payload.phone = phone;
        if (pass) payload.password = pass;
        
        try {
            if (isEdit) await API.business.updateStaff(staff.id, payload);
            else await API.business.createStaff(payload);
            showToast("Başarıyla kaydedildi");
            closeModal();
            loadBusinessStaff();
        } catch (err) { showToast(err.message, 'error'); }
    };
};

window.deleteBizStaff = async (id) => {
    if (!confirm("Personeli silmek istediğinize emin misiniz?")) return;
    try {
        await API.business.deleteStaff(id);
        loadBusinessStaff();
    } catch (e) { showToast(e.message, 'error'); }
};


window.showManualReservationModal = async () => {
    showModal('Manuel Rezervasyon', '<p>Yükleniyor...</p>');
    
    try {
        const services = await API.business.getServices();
        
        const html = `
            <form id="manual-res-form">
                <div class="form-group">
                    <label>Müşteri Adı *</label>
                    <input type="text" id="mr-name" required>
                </div>
                <div class="form-group">
                    <label>Telefon</label>
                    <input type="tel" id="mr-phone" placeholder="05XX XXX XX XX">
                </div>
                <div class="form-group">
                    <label>Hizmet *</label>
                    <select id="mr-service" class="pretty-select" required onchange="window.loadManualSlots()">
                        <option value="">Seçiniz</option>
                        ${services.map(s => `<option value="${s.id}" data-cat="${s.category}">${s.name} ${s.price ? '- ' + s.price.toLocaleString('tr-TR') + ' ₺' : ''}</option>`).join('')}
                    </select>
                </div>
                <div id="mr-date-section" style="display: none;">
                    <div class="form-group">
                        <label>Tarih *</label>
                        <input type="date" id="mr-date" onchange="window.loadManualSlots()">
                    </div>
                </div>
                <div id="mr-slot-section" style="display: none;">
                    <div class="form-group">
                        <label>Saat *</label>
                        <select id="mr-slot" class="pretty-select"></select>
                    </div>
                </div>
                <div id="mr-hotel-section" style="display: none;">
                    <div style="padding: 1rem; background: #f9fafb; border-radius: 12px; border: 1px solid #eef2f7;">
                        <p style="font-weight: 700; margin-bottom: 0.35rem;">Giriş / Çıkış Tarihleri *</p>
                        <p style="font-size: 0.82rem; color: #666; margin-bottom: 0.8rem;">Önce giriş gününe, sonra çıkış gününe tıklayın.</p>
                        <input type="hidden" id="mr-checkin" value="">
                        <input type="hidden" id="mr-checkout" value="">
                        <div id="mr-hotel-calendar"></div>
                        <div id="mr-hotel-picked" style="margin-top: 0.65rem; font-size: 0.85rem; color: #475569; font-weight: 600;"></div>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Rezervasyon Oluştur</button>
            </form>
        `;
        document.querySelector('.modal-content').innerHTML = html;
        
        // --- Manual hotel inline calendar (range) ---
        window._manualHotelCalMonth = { y: new Date().getFullYear(), m: new Date().getMonth() };

        window.shiftManualHotelMonth = function (delta) {
            let { y, m } = window._manualHotelCalMonth || { y: new Date().getFullYear(), m: new Date().getMonth() };
            m += delta;
            if (m < 0) { m = 11; y--; }
            if (m > 11) { m = 0; y++; }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const minMs = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
            if (new Date(y, m, 1).getTime() < minMs) return;
            window._manualHotelCalMonth = { y, m };
            window.paintManualHotelCalendar();
        };

        window.onManualHotelDayPick = function (iso) {
            const inEl = document.getElementById('mr-checkin');
            const outEl = document.getElementById('mr-checkout');
            if (!inEl || !outEl) return;
            let ci = inEl.value;
            let co = outEl.value;
            if (ci && co) {
                ci = iso;
                co = '';
            } else if (!ci) {
                ci = iso;
            } else {
                const tClick = _stripDay(_parseIsoLocal(iso));
                const tIn = _stripDay(_parseIsoLocal(ci));
                if (tClick <= tIn) {
                    ci = iso;
                    co = '';
                } else {
                    co = iso;
                }
            }
            inEl.value = ci;
            outEl.value = co;
            window.paintManualHotelCalendar();
        };

        window.paintManualHotelCalendar = function () {
            const root = document.getElementById('mr-hotel-calendar');
            if (!root || !window._manualHotelCalMonth) return;
            const { y, m } = window._manualHotelCalMonth;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayMs = today.getTime();
            const ci = document.getElementById('mr-checkin')?.value || '';
            const co = document.getElementById('mr-checkout')?.value || '';
            const gridHtml = _buildInlineMonthGrid(y, m, {
                todayMs,
                bookedRanges: [],
                mode: 'range',
                singleIso: null,
                checkInIso: ci,
                checkOutIso: co,
                onPickFn: 'window.onManualHotelDayPick',
                disableToday: false
            });
            const title = `${_TR_MONTHS[m]} ${y}`;
            const atMinMonth = new Date(y, m, 1).getTime() <= new Date(today.getFullYear(), today.getMonth(), 1).getTime();
            root.innerHTML = `
                <div class="inline-cal-nav">
                    <button type="button" class="btn btn-sm btn-outline" ${atMinMonth ? 'disabled style="opacity:0.45"' : ''} onclick="window.shiftManualHotelMonth(-1)">‹</button>
                    <span>${title}</span>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.shiftManualHotelMonth(1)">›</button>
                </div>
                <div class="inline-cal-weekdays">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((x) => `<div>${x}</div>`).join('')}</div>
                <div class="inline-cal-grid">${gridHtml}</div>
            `;

            const picked = document.getElementById('mr-hotel-picked');
            if (picked) {
                if (!ci && !co) picked.textContent = 'Tarih seçimi yapılmadı.';
                else if (ci && !co) picked.textContent = `Giriş: ${new Date(ci).toLocaleDateString('tr-TR')} • Çıkış: —`;
                else picked.textContent = `Giriş: ${new Date(ci).toLocaleDateString('tr-TR')} • Çıkış: ${new Date(co).toLocaleDateString('tr-TR')}`;
            }
        };

        window.loadManualSlots = async () => {
            const serviceEl = document.getElementById('mr-service');
            const serviceId = serviceEl.value;
            const cat = serviceEl.options[serviceEl.selectedIndex]?.dataset?.cat;
            
            document.getElementById('mr-date-section').style.display = cat === 'appointment' ? 'block' : 'none';
            document.getElementById('mr-slot-section').style.display = 'none';
            document.getElementById('mr-hotel-section').style.display = cat === 'hotel' ? 'block' : 'none';

            if (cat === 'hotel') {
                // Takvimi her açılışta resetleme; kullanıcı geçiş yapıp geri dönebilir
                window.paintManualHotelCalendar();
            }
            
            if (cat === 'appointment' && serviceId) {
                const date = document.getElementById('mr-date').value;
                if (date) {
                    try {
                        const slots = await API.business.getSlots(serviceId, date);
                        const available = slots.filter(s => s.is_available);
                        const slotSelect = document.getElementById('mr-slot');
                        slotSelect.innerHTML = available.length 
                            ? available.map(s => `<option value="${s.id}">${s.start_time}</option>`).join('')
                            : '<option value="">Müsait slot yok</option>';
                        document.getElementById('mr-slot-section').style.display = 'block';
                    } catch (e) { console.error(e); }
                }
            }
        };
        
        document.getElementById('manual-res-form').onsubmit = async (e) => {
            e.preventDefault();
            const serviceEl = document.getElementById('mr-service');
            const cat = serviceEl.options[serviceEl.selectedIndex]?.dataset?.cat;
            
            const payload = {
                customer_name: document.getElementById('mr-name').value,
                customer_phone: document.getElementById('mr-phone').value,
                service_id: parseInt(serviceEl.value)
            };
            
            if (cat === 'hotel') {
                const ci = document.getElementById('mr-checkin').value;
                const co = document.getElementById('mr-checkout').value;
                if (!ci || !co) {
                    showToast('Lütfen giriş ve çıkış tarihi seçin.', 'error');
                    return;
                }
                if (new Date(co) <= new Date(ci)) {
                    showToast('Çıkış tarihi girişten sonra olmalı.', 'error');
                    return;
                }
                payload.check_in = ci;
                payload.check_out = co;
            } else {
                payload.slot_id = parseInt(document.getElementById('mr-slot').value);
            }
            
            try {
                await API.business.createManualReservation(payload);
                showToast('Rezervasyon oluşturuldu');
                closeModal();
                if (window.loadBusinessReservations) loadBusinessReservations();
            } catch (err) { showToast(err.message, 'error'); }
        };
        
    } catch (e) {
        document.querySelector('.modal-content').innerHTML = `<p style="color: var(--error);">${e.message}</p>`;
    }
};

async function viewBusinessSettings(container) {
    renderBusinessShell(container, '#business-settings', 'İşletme Ayarları', `
        <div id="biz-settings-content" class="loading-row">Yükleniyor...</div>
    `);

    try {
        const business = await API.business.getMe();
        const days = [
            { key: 'mon', label: 'Pazartesi' },
            { key: 'tue', label: 'Salı' },
            { key: 'wed', label: 'Çarşamba' },
            { key: 'thu', label: 'Perşembe' },
            { key: 'fri', label: 'Cuma' },
            { key: 'sat', label: 'Cumartesi' },
            { key: 'sun', label: 'Pazar' }
        ];
        const wh = business.working_hours || {};

        document.getElementById('biz-settings-content').innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem;">
                <div class="service-card" style="padding: 2rem;">
                    <h3 style="margin-bottom: 1.5rem;">Genel Bilgiler</h3>
                    <form id="biz-info-form">
                        <div class="form-group">
                            <label>İşletme Adı</label>
                            <input type="text" id="biz-name" value="${business.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Açıklama</label>
                            <textarea id="biz-desc" rows="3">${business.description || ''}</textarea>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label>Telefon</label>
                                <input type="tel" id="biz-phone" value="${business.phone || ''}" placeholder="05XX XXX XX XX">
                            </div>
                            <div class="form-group">
                                <label>E-posta</label>
                                <input type="email" id="biz-email" value="${business.email || ''}" placeholder="info@example.com">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Açık Adres</label>
                            <input type="text" id="biz-address" value="${business.address || ''}">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label>Enlem (Latitude)</label>
                                <input type="number" step="any" id="biz-lat" value="${business.latitude || ''}" placeholder="41.0082">
                            </div>
                            <div class="form-group">
                                <label>Boylam (Longitude)</label>
                                <input type="number" step="any" id="biz-lng" value="${business.longitude || ''}" placeholder="28.9784">
                            </div>
                        </div>
                        <small style="color: var(--text-muted); display: block; margin-bottom: 1rem;">Google Haritalar'da konumu tıklayarak koordinatları alabilirsiniz</small>
                        <button type="submit" class="btn btn-primary">Kaydet</button>
                    </form>
                </div>

                <div class="service-card" style="padding: 2rem;">
                    <h3 style="margin-bottom: 1.5rem;">Çalışma Saatleri</h3>
                    <form id="biz-hours-form">
                        ${days.map(d => {
                            const dayData = wh[d.key] || null;
                            const isOpen = dayData !== null;
                            return `
                                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 0.8rem; background: #f8fafc; border-radius: 8px;">
                                    <label style="min-width: 100px; font-weight: 500;">${d.label}</label>
                                    <input type="checkbox" id="wh-${d.key}-open" ${isOpen ? 'checked' : ''} onchange="toggleDayInputs('${d.key}')">
                                    <input type="time" id="wh-${d.key}-start" value="${dayData?.open || '09:00'}" ${!isOpen ? 'disabled' : ''} style="padding: 0.4rem;">
                                    <span>-</span>
                                    <input type="time" id="wh-${d.key}-end" value="${dayData?.close || '18:00'}" ${!isOpen ? 'disabled' : ''} style="padding: 0.4rem;">
                                </div>
                            `;
                        }).join('')}
                        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Kaydet</button>
                    </form>
                </div>
            </div>
        `;

        window.toggleDayInputs = (day) => {
            const isOpen = document.getElementById(`wh-${day}-open`).checked;
            document.getElementById(`wh-${day}-start`).disabled = !isOpen;
            document.getElementById(`wh-${day}-end`).disabled = !isOpen;
        };

        document.getElementById('biz-info-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            btn.disabled = true;
            try {
                const latVal = document.getElementById('biz-lat').value;
                const lngVal = document.getElementById('biz-lng').value;
                await API.business.updateMe({
                    name: document.getElementById('biz-name').value,
                    description: document.getElementById('biz-desc').value,
                    phone: document.getElementById('biz-phone').value,
                    email: document.getElementById('biz-email').value,
                    address: document.getElementById('biz-address').value,
                    latitude: latVal ? parseFloat(latVal) : null,
                    longitude: lngVal ? parseFloat(lngVal) : null
                });
                showToast('Bilgiler güncellendi');
            } catch (err) { showToast(err.message, 'error'); }
            btn.disabled = false;
        };

        document.getElementById('biz-hours-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            btn.disabled = true;
            const working_hours = {};
            days.forEach(d => {
                const isOpen = document.getElementById(`wh-${d.key}-open`).checked;
                if (isOpen) {
                    working_hours[d.key] = {
                        open: document.getElementById(`wh-${d.key}-start`).value,
                        close: document.getElementById(`wh-${d.key}-end`).value
                    };
                } else {
                    working_hours[d.key] = null;
                }
            });
            try {
                await API.business.updateMe({ working_hours });
                showToast('Çalışma saatleri güncellendi');
            } catch (err) { showToast(err.message, 'error'); }
            btn.disabled = false;
        };

    } catch (e) {
        document.getElementById('biz-settings-content').innerHTML = `<p style="color: var(--error);">${e.message}</p>`;
    }
}

async function viewStaffDashboard(container) {
    container.innerHTML = `
        <div class="container" style="padding-top: 4rem;">
            <div style="display: flex; gap: 1rem; margin-bottom: 3rem;">
                <button class="btn btn-primary" onclick="window.location.hash='#staff-dashboard'">Takvim</button>
                <button class="btn btn-outline" onclick="window.location.hash='#staff-reservations'">Rezervasyonlar</button>
                <button class="btn btn-outline" onclick="window.location.hash='#staff-services'">Hizmetler</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <h1>Çalışma Takvimi</h1>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-outline btn-sm" onclick="window.loadSchedule('daily')">Bugün</button>
                    <button class="btn btn-outline btn-sm" onclick="window.loadSchedule('weekly')">Bu Hafta</button>
                </div>
            </div>
            <div id="schedule-container" class="service-card" style="padding: 2rem;">Yükleniyor...</div>
        </div>
    `;

    window.loadSchedule = async (view = 'weekly') => {
        const el = document.getElementById('schedule-container');
        el.innerHTML = 'Yükleniyor...';
        try {
            if (!API || !API.staff || !API.staff.getSchedule) {
                throw new Error('Takvim servisi bulunamadı (API.staff.getSchedule). Sayfayı yenileyin.');
            }
            const data = await API.staff.getSchedule(view);
            if (!data.reservations.length) {
                el.innerHTML = `<p style="text-align:center; color:#999; padding:3rem;">Bu dönem için rezervasyon bulunmuyor.</p>`;
                return;
            }
            const grouped = {};
            data.reservations.forEach(r => {
                const key = r.slot_date || r.check_in || '—';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(r);
            });
            el.innerHTML = Object.entries(grouped).map(([date, items]) => `
                <div style="margin-bottom: 2rem;">
                    <h3 style="font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); margin-bottom:0.75rem; padding-bottom:0.5rem; border-bottom:1px solid #eee;">${date}</h3>
                    ${items.map(r => `
                        <div style="display:flex; align-items:center; gap:1rem; padding:0.9rem 1rem; background:white; border:1px solid #f0f0f0; border-radius:8px; margin-bottom:0.4rem;">
                            <div style="flex:1;">
                                <strong style="font-size:0.95rem;">${r.service_name}</strong>
                                <p style="margin:0.15rem 0; color:var(--text-muted); font-size:0.82rem;">
                                    ${r.slot_time ? `Saat: ${r.slot_time}` : `${r.check_in} — ${r.check_out}`} &middot; ${r.user_name}
                                </p>
                            </div>
                            <span class="badge badge-${r.status}">${LOCALE.STATUS[r.status]}</span>
                        </div>
                    `).join('')}
                </div>
            `).join('');
        } catch (e) { el.innerHTML = `<p style="color:var(--error);">${e.message}</p>`; }
    };

    // Bazı ortamlarda ilk render sırasında inline handler/route yarışabiliyor.
    // İsteği garantiye almak için bir tick sonra da tetikle.
    window.loadSchedule('weekly');
    setTimeout(() => {
        if (window.location.hash === '#staff-dashboard') {
            try { window.loadSchedule('weekly'); } catch (_) {}
        }
    }, 0);
}

async function viewStaffReservations(container) {
    container.innerHTML = `
        <div class="container" style="padding-top: 4rem;">
            <div class="page-actions">
                <button class="btn btn-outline" onclick="window.location.hash='#staff-dashboard'">Takvim</button>
                <button class="btn btn-primary" onclick="window.location.hash='#staff-reservations'">Rezervasyonlar</button>
                <button class="btn btn-outline" onclick="window.location.hash='#staff-services'">Hizmetler</button>
            </div>
            <div class="page-header">
                <h1>Tüm Rezervasyonlar</h1>
                <select id="status-filter" class="pretty-select" onchange="window.filterStaffRes(this.value)">
                    <option value="">Tümü</option>
                    <option value="pending">Beklemede</option>
                    <option value="approved">Onaylandı</option>
                    <option value="rejected">Reddedildi</option>
                </select>
            </div>
            <div id="staff-res-list">Yükleniyor...</div>
        </div>
    `;

    window.filterStaffRes = async (status) => {
        const el = document.getElementById('staff-res-list');
        el.innerHTML = 'Yükleniyor...';
        try {
            const data = await API.staff.getReservations(1, status);
            if (!data.reservations.length) {
                el.innerHTML = '<p style="color:#999; text-align:center; padding:3rem;">Kayıt bulunamadı.</p>';
                return;
            }
            el.innerHTML = `<table class="admin-table">
                <thead><tr><th>Müşteri</th><th>İletişim</th><th>Hizmet</th><th>Tarih/Saat</th><th>Durum</th><th>İşlemler</th><th>Yorum</th></tr></thead>
                <tbody>${data.reservations.map(r => `
                    <tr>
                        <td>${r.user_name || '—'}</td>
                        <td style="font-size:0.85rem;">
                            <div style="display:flex; flex-direction:column; gap:0.15rem;">
                                <span>${r.user_phone || '—'}</span>
                                <span style="color:var(--text-muted);">${r.user_email || '—'}</span>
                            </div>
                        </td>
                        <td>${r.service_name}</td>
                        <td style="font-size:0.85rem;">${r.slot_date ? `${r.slot_date} ${r.slot_time}` : (r.check_in ? `${r.check_in} → ${r.check_out}` : '—')}</td>
                        <td><span class="badge badge-${r.status}">${LOCALE.STATUS[r.status]}</span></td>
                        <td>
                            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                            ${r.status === 'pending' ? `
                                <button class="btn btn-outline btn-sm" style="color:var(--success);border-color:var(--success);" onclick="window.staffUpdateResStatus(${r.id}, 'approved')">Onayla</button>
                                <button class="btn btn-outline btn-sm" style="color:var(--error);border-color:var(--error);" onclick="window.staffUpdateResStatus(${r.id}, 'rejected')">Reddet</button>
                            ` : ''}
                            ${r.status === 'approved' ? `
                                <button class="btn btn-outline btn-sm" style="color:var(--error);border-color:var(--error);" onclick="window.staffCancelRes(${r.id})">İptal Et</button>
                            ` : ''}
                            ${r.status !== 'pending' && r.status !== 'approved' ? '—' : ''}
                            </div>
                        </td>
                        <td><button class="btn btn-outline btn-sm" onclick="window.showReviewsForReservation(${r.id}, '${r.service_name.replace(/'/g,"\\'")}')" style="font-size:0.75rem;">Yorumlar</button></td>
                    </tr>
                `).join('')}</tbody>
            </table>`;
        } catch (e) { el.innerHTML = e.message; }
    };

    window.staffUpdateResStatus = async (id, status) => {
        try {
            await API.staff.updateReservationStatus(id, status);
            window.filterStaffRes(document.getElementById('status-filter')?.value || '');
            showToast(status === 'approved' ? 'Rezervasyon onaylandı.' : 'Rezervasyon reddedildi.', 'success');
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.staffCancelRes = async (id) => {
        if (!confirm('Onaylanan rezervasyon iptal edilsin mi?')) return;
        try {
            await API.staff.updateReservationStatus(id, 'rejected');
            window.filterStaffRes(document.getElementById('status-filter')?.value || '');
            showToast('Rezervasyon iptal edildi.', 'success');
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.showReviewsForReservation = async (resId, serviceName) => {
        try {
            const res = await API.staff.getReservation(resId);
            const reviews = await API.reviews.getForService(res.service_id);
            const rv = reviews.find(r => r.reservation_id === resId);
            if (!rv) return showToast('Bu rezervasyon için yorum yok.', 'error');
            showModal(`${serviceName} — Yorum`, `
                <div style="margin-bottom:1rem;">
                    <div style="color:#f59e0b; font-size:1.5rem;">${'★'.repeat(rv.rating)}${'☆'.repeat(5 - rv.rating)}</div>
                    <p style="margin-top:0.5rem;">${rv.comment || '<i style="color:#999">Yorum yok.</i>'}</p>
                </div>
                ${rv.staff_reply ? `<div style="background:#f0fdf4; padding:1rem; border-radius:8px; border-left:4px solid #10b981;"><strong>Yanıtınız:</strong> ${rv.staff_reply}</div>` : `
                <div class="form-group" style="margin-top:1rem;">
                    <label>Yanıtınız</label>
                    <textarea id="staff-reply" rows="3" placeholder="Müşteriye yanıt yazın..."></textarea>
                    <button class="btn btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.submitReply(${rv.id})">Yanıtı Gönder</button>
                </div>`}
            `);
            window.submitReply = async (reviewId) => {
                const reply = document.getElementById('staff-reply').value.trim();
                if (!reply) return showToast('Yanıt boş olamaz.', 'error');
                try { await API.staff.replyReview(reviewId, reply); showToast('Yanıt gönderildi.'); closeModal(); } catch(e) { showToast(e.message, 'error'); }
            };
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.filterStaffRes('');
}

async function viewStaffServices(container) {
    container.innerHTML = `
        <div class="container" style="padding-top: 4rem;">
            <div style="display: flex; gap: 1rem; margin-bottom: 3rem;">
                <button class="btn btn-outline" onclick="window.location.hash='#staff-dashboard'">Takvim</button>
                <button class="btn btn-outline" onclick="window.location.hash='#staff-reservations'">Rezervasyonlar</button>
                <button class="btn btn-primary" onclick="window.location.hash='#staff-services'">Hizmetler</button>
            </div>
            <h1 style="margin-bottom: 2rem;">Hizmetler & Müsaitlik Yönetimi</h1>
            <div id="staff-services-list">Yükleniyor...</div>
        </div>
    `;

    try {
        const services = await API.staff.getServices();
        const list = document.getElementById('staff-services-list');
        
        if (!services.length) {
            list.innerHTML = '<p style="color:#999; text-align:center; padding:3rem;">Bu işletmeye ait hizmet bulunamadı.</p>';
            return;
        }

        list.innerHTML = `
            <table class="admin-table">
                <thead><tr><th>Hizmet Adı</th><th>Kategori</th><th>Fiyat</th><th>İşlemler</th></tr></thead>
                <tbody>
                    ${services.map(s => `
                        <tr>
                            <td><strong>${s.name}</strong></td>
                            <td><span class="badge" style="background:#eee">${s.category === 'hotel' ? 'Oda' : 'Randevu'}</span></td>
                            <td>${s.price ? `${s.price.toLocaleString('tr-TR')} ₺` : '-'}</td>
                            <td>
                                ${s.category === 'hotel' 
                                    ? `<button class="btn btn-outline btn-sm" onclick="window.showStaffAvailabilityManager(${s.id}, '${s.name.replace(/'/g,"\\'")}')">Rezervasyon Tarihleri</button>`
                                    : `<button class="btn btn-outline btn-sm" onclick="window.showApptAvailabilityManager(${s.id}, '${s.name.replace(/'/g,"\\'")}')">Müsaitlik Oluştur</button>
                                       <button class="btn btn-outline btn-sm" onclick="window.showSlotsModal(${s.id}, '${s.name.replace(/'/g,"\\'")}', false)">Slotlar</button>`
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) { document.getElementById('staff-services-list').innerHTML = e.message; }
}

window.showStaffAvailabilityManager = async (serviceId, serviceName) => {
    let summary = { min_date: null, max_date: null, total_slots: 0, available_slots: 0 };
    try {
        summary = await API.staff.getAvailabilitySummary(serviceId);
    } catch (e) {}

    const html = `
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 12px;">
            <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #666;">Mevcut Rezervasyon Dönemi</h4>
            ${summary.min_date ? `
                <p style="font-size: 1.1rem; font-weight: 600; color: var(--accent);">
                    ${new Date(summary.min_date).toLocaleDateString('tr-TR')} - ${new Date(summary.max_date).toLocaleDateString('tr-TR')}
                </p>
                <p style="font-size: 0.85rem; color: #666; margin-top: 0.3rem;">
                    Toplam ${summary.total_slots} gün, ${summary.available_slots} gün müsait
                </p>
            ` : `<p style="color: #999;">Henüz rezervasyona açık tarih yok</p>`}
        </div>

        <h4 style="margin-bottom: 1rem;">Takvim Görünümü</h4>
        <div id="staff-hotel-calendar" style="border:1px solid #e2e8f0; border-radius:12px; padding:0.75rem; background:#fff;">
            <div class="loading-row">Yükleniyor...</div>
        </div>
        <p style="margin-top: 0.8rem; font-size: 0.8rem; color: #666;">
            <span style="display:inline-block; width:12px; height:12px; background:#f0fdf4; border:1px solid #10b981; border-radius:3px; margin-right:4px;"></span> Müsait
            <span style="display:inline-block; width:12px; height:12px; background:#fef2f2; border:1px solid #ef4444; border-radius:3px; margin-left:12px; margin-right:4px;"></span> Dolu
            <span style="display:inline-block; width:12px; height:12px; background:#fff7ed; border:1px solid #f59e0b; border-radius:3px; margin-left:12px; margin-right:4px;"></span> Rezerve (kilitli)
        </p>
        <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #999;">Tıklayarak müsaitlik durumunu değiştirebilirsiniz (rezerve günler kilitlidir).</p>
    `;

    showModal(`${serviceName} - Rezervasyon Tarihleri`, html);
    window.openHotelAvailCalendar(serviceId, 'staff-hotel-calendar');
};

function viewHowItWorks(container) {
    const partnerLink = `<a href="#partner-contact" style="color: var(--accent); font-weight: 600;">${t('footer.add_business')}</a>`;
    container.innerHTML = `
        <div class="container static-page">
            <h1>${t('hiw.title')}</h1>
            <p class="lead">${t('hiw.lead')}</p>
            <div class="static-steps">
                <div class="static-step">
                    <span class="static-step-num">1</span>
                    <div>
                        <h2>${t('hiw.step1_title')}</h2>
                        <p>${t('hiw.step1_desc')}</p>
                    </div>
                </div>
                <div class="static-step">
                    <span class="static-step-num">2</span>
                    <div>
                        <h2>${t('hiw.step2_title')}</h2>
                        <p>${t('hiw.step2_desc')}</p>
                    </div>
                </div>
                <div class="static-step">
                    <span class="static-step-num">3</span>
                    <div>
                        <h2>${t('hiw.step3_title')}</h2>
                        <p>${t('hiw.step3_desc')}</p>
                    </div>
                </div>
            </div>
            <p style="margin-top: 2rem; font-size: 0.95rem; color: var(--text-muted);">
                ${t('hiw.cta_partner', { link: partnerLink })}
            </p>
        </div>
    `;
}

function viewPartnerContact(container) {
    // Kategori seçenekleri dile göre dinamik (BUSINESS_TYPES zaten Proxy)
    const categoryOptions = ['konaklama','yeme-icme','guzellik','saglik','spor','etkinlik','hizmet','egitim']
        .map((slug) => `<option value="${slug}">${getBusinessTypeLabel(slug)}</option>`)
        .join('');
    container.innerHTML = `
        <div class="container partner-form-wrap">
            <div class="partner-form-card">
                <h1>${t('partner.title')}</h1>
                <p class="sub">${t('partner.sub')}</p>
                <div class="partner-process">
                    <strong>${t('partner.process_label')}</strong> ${t('partner.process').replace(/^Süreç: /, '').replace(/^Process: /, '')}
                </div>
                <form id="partner-form">
                    <div class="form-group">
                        <label for="partner-name">${t('partner.name')} *</label>
                        <input type="text" id="partner-name" required class="form-control" placeholder="${t('partner.name_placeholder')}">
                    </div>
                    <div class="form-group">
                        <label for="partner-business">${t('partner.business')}</label>
                        <input type="text" id="partner-business" class="form-control" placeholder="${t('partner.business_placeholder')}">
                    </div>
                    <div class="form-group">
                        <label for="partner-email">${t('partner.email')} *</label>
                        <input type="email" id="partner-email" required class="form-control" placeholder="ornek@firma.com">
                    </div>
                    <div class="form-group">
                        <label for="partner-phone">${t('partner.phone')}</label>
                        <input type="tel" id="partner-phone" class="form-control" placeholder="05xx xxx xx xx">
                    </div>
                    <div class="form-group">
                        <label for="partner-category">${t('partner.category')}</label>
                        <select id="partner-category" class="pretty-select">
                            <option value="">${t('partner.category_placeholder')}</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="partner-message">${t('partner.message')}</label>
                        <textarea id="partner-message" class="form-control" rows="4" placeholder="${t('partner.message_placeholder')}"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" id="partner-submit" style="width: 100%;">${t('partner.submit')}</button>
                </form>
            </div>
        </div>
    `;
    document.getElementById('partner-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('partner-submit');
        btn.disabled = true;
        try {
            const res = await API.customer.partnerInquiry({
                name: document.getElementById('partner-name').value.trim(),
                business_name: document.getElementById('partner-business').value.trim(),
                email: document.getElementById('partner-email').value.trim(),
                phone: document.getElementById('partner-phone').value.trim(),
                category: document.getElementById('partner-category').value,
                message: document.getElementById('partner-message').value.trim()
            });
            showToast(res.msg || t('partner.sent'));
            e.target.reset();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    };
}

/** Hash için gerekli rol; null = herkese açık */
function getRequiredRoleForHash(hash) {
    if (hash.startsWith('#superadmin')) return 'superadmin';
    if (hash.startsWith('#staff-')) return 'staff';
    // #business-detail = herkese açık işletme sayfası; #business-dashboard vb. = sahip paneli
    if (hash.startsWith('#business-detail')) return null;
    if (hash.startsWith('#business-')) return 'business_owner';
    return null;
}

function renderAccessDenied(container) {
    container.innerHTML = `
        <div class="container" style="padding: 5rem; text-align: center; max-width: 520px; margin: 0 auto;">
            <h1 style="margin-bottom: 1rem;">${t('access.denied_title')}</h1>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${t('access.denied_desc')}</p>
            <button type="button" class="btn btn-primary" onclick="window.location.hash='${HOME_HASH}'">${t('access.back_home')}</button>
        </div>`;
}

async function router() {
    window.scrollTo(0, 0);
    renderNavbar();
    let hash = window.location.hash || HOME_HASH;
    if (hash === '#') hash = HOME_HASH;
    const container = document.getElementById('app-root');
    
    // Hide main modal on route change instead of removing skeleton
    if (window.closeModal) window.closeModal();
    // Only remove dynamic modals (like the business form)
    document.querySelectorAll('.modal-overlay:not(#modal-overlay)').forEach(m => m.remove());

    const requiredRole = getRequiredRoleForHash(hash);
    if (requiredRole) {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!token) {
            window.location.hash = '#login';
            return;
        }
        if (user.role !== requiredRole) {
            renderAccessDenied(container);
            return;
        }
    }

    if (hash === '#login') viewLogin(container);
    else if (hash === '#register') viewRegister(container);
    else if (hash === '#forgot-password') viewForgotPassword(container);
    else if (hash.startsWith('#reset-password')) viewResetPassword(container);
    else if (hash === '#profile') viewProfile(container);
    else if (hash === '#how-it-works') viewHowItWorks(container);
    else if (hash === '#partner-contact') viewPartnerContact(container);
    else if (hash === '#home' || hash === '#hotels') viewHotels(container);
    else if (hash.startsWith('#businesses')) viewBusinessesByType(container);
    else if (hash === '#reservations') viewMyReservations(container);
    else if (hash.startsWith('#service-detail')) viewServiceDetail(container);
    else if (hash.startsWith('#hotel-detail')) viewHotelDetail(container);
    else if (hash.startsWith('#business-detail')) viewBusinessDetail(container);
    // SuperAdmin routes
    else if (hash === '#superadmin-stats') viewSuperAdminStats(container);
    else if (hash === '#superadmin-businesses') viewSuperAdminBusinesses(container);
    else if (hash === '#superadmin-users') viewSuperAdminUsers(container);
    else if (hash === '#superadmin-logs') viewSuperAdminLogs(container);
    // Business Owner routes
    else if (hash === '#business-dashboard') viewBusinessDashboard(container);
    else if (hash === '#business-services') viewBusinessServices(container);
    else if (hash === '#business-reservations') viewBusinessReservations(container);
    else if (hash === '#business-staff') viewBusinessStaff(container);
    else if (hash === '#business-settings') viewBusinessSettings(container);
    // Staff routes
    else if (hash === '#staff-dashboard') {
        viewStaffDashboard(container);
        // render sonrası schedule isteklerini garantiye al
        setTimeout(() => {
            if (window.location.hash === '#staff-dashboard' && typeof window.loadSchedule === 'function') {
                try { window.loadSchedule('weekly'); } catch (_) {}
            }
        }, 0);
    }
    else if (hash === '#staff-reservations') viewStaffReservations(container);
    else if (hash === '#staff-services') viewStaffServices(container);
    else viewHotels(container);
}

window.handleSearch = (e, className) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.' + className).forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = title.includes(query) ? 'block' : 'none';
    });
};

window.handleImageUpload = async (e) => { 
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const overlay = document.querySelector('.image-upload-wrapper');
    overlay.style.opacity = '0.5';
    overlay.style.pointerEvents = 'none';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('svc-img').value = data.url;
            const preview = document.getElementById('image-preview');
            preview.src = data.url;
            preview.style.display = 'block';
            overlay.classList.add('has-image');
            showToast("Resim başarıyla yüklendi");
        } else {
            showToast(data.msg || "Yükleme hatası", 'error');
        }
    } catch (err) {
        showToast("Sunucu hatası oluştu", 'error');
    } finally {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
    }
};

window.onhashchange = router;
window.onload = router;
router();

// ─── i18n: Dil Seçici Butonu ──────────────────────────────────────
function initLangSwitcher() {
    if (!window.i18n) return; // i18n.js yüklenmediyse sessizce çık
    const switcher = document.getElementById('lang-switcher');
    if (!switcher) return;

    const current = window.i18n.getCurrentLang();

    // Aktif dili işaretle
    switcher.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === current);
        // Tıklama handler'ı
        btn.onclick = (e) => {
            e.preventDefault();
            const targetLang = btn.dataset.lang;
            if (targetLang && targetLang !== window.i18n.getCurrentLang()) {
                window.i18n.setLang(targetLang); // localStorage'a yazar + sayfayı yeniler
            }
        };
    });
}

// Sayfa ilk yüklendiğinde ve her route değişiminde çalıştır
document.addEventListener('DOMContentLoaded', initLangSwitcher);
initLangSwitcher(); // Güvenlik için hemen de çağır (DOMContentLoaded geç gelebilir)

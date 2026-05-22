(function () {
    'use strict';

    function getToken() {
        return localStorage.getItem('token');
    }

    function getLang() {
        try {
            return (window.i18n && window.i18n.getCurrentLang && window.i18n.getCurrentLang()) || 'tr';
        } catch (e) {
            return 'tr';
        }
    }

    function t(tr, en) {
        return getLang() === 'en' ? en : tr;
    }

    async function startCheckout(reservationId) {
        const token = getToken();
        if (!token) {
            alert(t('Lütfen önce giriş yapın.', 'Please log in first.'));
            return;
        }

        try {
            const resp = await fetch('/api/payment/checkout/' + reservationId, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                }
            });

            const data = await resp.json();

            if (!resp.ok) {
                const msg = data.error || resp.statusText;
                alert(t('Ödeme başlatılamadı: ', 'Could not start payment: ') + msg);
                return;
            }

            if (data.checkout_url && data.checkout_url.indexOf('/dummy-payment') !== -1) {
                const p = new URLSearchParams(data.checkout_url.split('?')[1]);
                window.renderDummyPaymentPage(p.get('reservation_id'), p.get('amount'));
            } else {
                window.location.href = data.checkout_url;
            }
        } catch (e) {
            console.error('Payment error:', e);
            alert(t('Bağlantı hatası. Lütfen tekrar deneyin.', 'Connection error. Please try again.'));
        }
    }

    async function verifyPaymentReturn() {
        const url = new URL(window.location.href);
        const paymentResult = url.searchParams.get('payment');
        const reservationId = url.searchParams.get('reservation_id');
        const sessionId = url.searchParams.get('session_id');

        if (!paymentResult) return;

        url.searchParams.delete('payment');
        url.searchParams.delete('reservation_id');
        url.searchParams.delete('session_id');
        window.history.replaceState({}, document.title, url.toString());

        if (paymentResult === 'cancel') {
            showPaymentToast(t('Ödeme iptal edildi.', 'Payment canceled.'), 'cancel');
            return;
        }

        if (paymentResult !== 'success' || !reservationId || !sessionId) return;

        const token = getToken();
        if (!token) {
            showPaymentToast(t('Doğrulama için giriş yapmalısınız.', 'You must be logged in to verify payment.'), 'error');
            return;
        }

        try {
            const resp = await fetch('/api/payment/verify/' + reservationId, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                body: JSON.stringify({ session_id: sessionId })
            });

            const data = await resp.json();

            if (resp.ok && data.status === 'paid') {
                showPaymentToast(t('Ödeme başarılı! Rezervasyonunuz onaylandı.', 'Payment successful! Your reservation is confirmed.'), 'success');
                setTimeout(() => {
                    if (typeof window.loadMyReservations === 'function') window.loadMyReservations();
                    else if (typeof window.refreshReservations === 'function') window.refreshReservations();
                }, 1500);
            } else {
                showPaymentToast(t('Ödeme doğrulanamadı: ', 'Payment could not be verified: ') + (data.error || data.status), 'error');
            }
        } catch (e) {
            console.error('Verify error:', e);
            showPaymentToast(t('Doğrulama hatası', 'Verification error'), 'error');
        }
    }

    function showPaymentToast(message, kind) {
        const toast = document.createElement('div');
        toast.className = 'payment-toast payment-toast--' + (kind || 'info');
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('payment-toast--show');
        });

        setTimeout(() => {
            toast.classList.remove('payment-toast--show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    function injectPayButtons() {
        const cards = document.querySelectorAll('[data-reservation-id]');
        cards.forEach(card => {
            if (card.querySelector('.btn-pay-now')) return;

            const status = (card.getAttribute('data-status') || '').toLowerCase();
            const paymentStatus = (card.getAttribute('data-payment-status') || 'unpaid').toLowerCase();
            const reservationId = card.getAttribute('data-reservation-id');

            if (status !== 'approved' || paymentStatus === 'paid' || !reservationId) return;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-pay-now';
            btn.innerHTML = '<span>💳</span> ' + t('Ödeme Yap', 'Pay Now');
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                startCheckout(reservationId);
            };

            const actions = card.querySelector('.reservation-actions, .card-actions, .actions');
            if (actions) {
                actions.appendChild(btn);
            } else {
                card.appendChild(btn);
            }
        });

        document.querySelectorAll('[data-payment-status="paid"]').forEach(card => {
            if (card.querySelector('.payment-paid-badge')) return;
            const badge = document.createElement('span');
            badge.className = 'payment-paid-badge';
            badge.textContent = t('Ödendi', 'Paid');
            const titleArea = card.querySelector('.reservation-actions, .card-actions, .actions, h3, h4');
            if (titleArea) {
                titleArea.appendChild(badge);
            } else {
                card.appendChild(badge);
            }
        });
    }

    function observeReservationLists() {
        const observer = new MutationObserver(() => {
            injectPayButtons();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    function init() {
        verifyPaymentReturn();
        injectPayButtons();
        observeReservationLists();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.payment = {
        startCheckout,
        verifyReturn: verifyPaymentReturn,
        injectButtons: injectPayButtons,
    };
})();

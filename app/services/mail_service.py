import os
import threading
from flask import current_app
from flask_mail import Message
from app import mail


# ──────────────────────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────────────────────

def _send_async(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
        except Exception as e:
            print(f"Mail gönderimi başarısız: {e}")


def _send(subject, recipients, body, html=None):
    """Send email with optional HTML body. Plain text always included as fallback."""
    msg = Message(subject=subject, recipients=recipients, body=body)
    if html:
        msg.html = html
    app = current_app._get_current_object()
    thread = threading.Thread(target=_send_async, args=(app, msg))
    thread.start()


def _detect_lang(reservation=None, override=None):
    """Determine language for email. Priority: override > user.lang > default 'tr'."""
    if override and override in ('tr', 'en'):
        return override
    if reservation and reservation.user:
        # Try common language attributes on user model
        for attr in ('lang', 'language', 'locale'):
            val = getattr(reservation.user, attr, None)
            if val:
                if isinstance(val, str) and val.lower().startswith('en'):
                    return 'en'
                if isinstance(val, str) and val.lower().startswith('tr'):
                    return 'tr'
    return 'tr'


# ──────────────────────────────────────────────────────────────────────────
# HTML Template
# ──────────────────────────────────────────────────────────────────────────

def _html_template(title, status_badge, status_color, greeting, message, details_rows, cta_text, cta_url, footer_text):
    """
    Reusable HTML email template with BetulBooking branding (gold/cream).
    
    Args:
        title: Email title (h1)
        status_badge: Badge text (e.g. "APPROVED", "REJECTED")
        status_color: Hex color for badge (e.g. "#10B981" green, "#EF4444" red)
        greeting: First line greeting
        message: Main message paragraph
        details_rows: List of (label, value) tuples for the details box
        cta_text: Button text (e.g. "View Reservation")
        cta_url: Button URL
        footer_text: Footer text
    """
    rows_html = "".join(
        f'<tr><td style="padding:8px 12px; color:#6b6055; font-size:14px;">{label}</td>'
        f'<td style="padding:8px 12px; color:#2c2416; font-size:14px; font-weight:600; text-align:right;">{value}</td></tr>'
        for label, value in details_rows if value
    )
    
    cta_html = f'''
        <tr>
            <td style="padding: 24px 0 8px 0; text-align:center;">
                <a href="{cta_url}" 
                   style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#C9A875 0%,#B8954B 100%); color:white; text-decoration:none; border-radius:10px; font-weight:600; font-size:15px; box-shadow:0 2px 8px rgba(201,168,117,0.35);">
                    {cta_text}
                </a>
            </td>
        </tr>
    ''' if cta_text and cta_url else ""
    
    return f'''<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin:0; padding:0; background:#f5f1e8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e8; padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                    <!-- Header with logo -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#2c2416 0%,#3d3326 100%); padding:32px 40px; text-align:center;">
                            <h1 style="margin:0; color:#C9A875; font-size:28px; font-weight:700; letter-spacing:1px;">
                                BetulBooking
                            </h1>
                            <p style="margin:8px 0 0 0; color:#e8ddc4; font-size:13px; letter-spacing:2px; text-transform:uppercase;">
                                Premium Reservations
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Status badge -->
                    <tr>
                        <td style="padding:32px 40px 8px 40px; text-align:center;">
                            <span style="display:inline-block; padding:6px 16px; background:{status_color}; color:white; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:1.5px;">
                                {status_badge}
                            </span>
                        </td>
                    </tr>
                    
                    <!-- Title -->
                    <tr>
                        <td style="padding:8px 40px 16px 40px; text-align:center;">
                            <h2 style="margin:0; color:#2c2416; font-size:24px; font-weight:700;">{title}</h2>
                        </td>
                    </tr>
                    
                    <!-- Greeting & message -->
                    <tr>
                        <td style="padding:8px 40px;">
                            <p style="margin:0 0 12px 0; color:#2c2416; font-size:16px; font-weight:600;">{greeting}</p>
                            <p style="margin:0; color:#6b6055; font-size:14px; line-height:1.6;">{message}</p>
                        </td>
                    </tr>
                    
                    <!-- Details box -->
                    <tr>
                        <td style="padding:24px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7ef; border-radius:12px; border:1px solid #ede4cf;">
                                {rows_html}
                            </table>
                        </td>
                    </tr>
                    
                    {cta_html}
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding:32px 40px 24px 40px; text-align:center; border-top:1px solid #ede4cf;">
                            <p style="margin:0; color:#9b8f7d; font-size:12px; line-height:1.6;">
                                {footer_text}
                            </p>
                            <p style="margin:8px 0 0 0; color:#c0b39d; font-size:11px;">
                                © 2026 BetulBooking. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'''


# ──────────────────────────────────────────────────────────────────────────
# Translation strings
# ──────────────────────────────────────────────────────────────────────────

T = {
    'tr': {
        'confirmed_subject': 'Rezervasyonunuz Onaylandı 🎉',
        'rejected_subject': 'Rezervasyonunuz Hakkında',
        'confirmed_title': 'Rezervasyonunuz Onaylandı!',
        'rejected_title': 'Rezervasyonunuz Reddedildi',
        'badge_approved': 'ONAYLANDI',
        'badge_rejected': 'REDDEDİLDİ',
        'greeting': 'Sayın Müşterimiz,',
        'confirmed_msg': 'Harika bir haberimiz var! Rezervasyonunuz işletme tarafından onaylandı. Aşağıda rezervasyon detaylarını bulabilirsiniz.',
        'rejected_msg': 'Maalesef rezervasyonunuz işletme tarafından kabul edilmedi. Farklı bir tarih veya saat seçerek tekrar deneyebilirsiniz.',
        'reservation_id': 'Rezervasyon No',
        'service': 'Hizmet',
        'business': 'İşletme',
        'check_in': 'Giriş Tarihi',
        'check_out': 'Çıkış Tarihi',
        'date': 'Tarih',
        'time': 'Saat',
        'cta_view': 'Rezervasyonu Görüntüle',
        'cta_search': 'Yeni Rezervasyon Yap',
        'footer': 'Bu otomatik bir mesajdır. Sorularınız için BetulBooking destek ekibimizle iletişime geçebilirsiniz.',
        # Password reset
        'pwreset_subject': 'Şifre Sıfırlama Talebi',
        'pwreset_title': 'Şifrenizi Sıfırlayın',
        'pwreset_badge': 'GÜVENLİK',
        'pwreset_msg': 'Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.',
        'pwreset_cta': 'Şifremi Sıfırla',
        'pwreset_validity': 'Bu bağlantı 1 saat boyunca geçerlidir.',
        'pwreset_ignore': 'Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.',
    },
    'en': {
        'confirmed_subject': 'Your Reservation is Confirmed 🎉',
        'rejected_subject': 'About Your Reservation',
        'confirmed_title': 'Reservation Confirmed!',
        'rejected_title': 'Reservation Declined',
        'badge_approved': 'APPROVED',
        'badge_rejected': 'DECLINED',
        'greeting': 'Dear Customer,',
        'confirmed_msg': 'Great news! Your reservation has been approved by the business. You can find the details below.',
        'rejected_msg': 'Unfortunately, your reservation was not accepted by the business. You can try booking again with a different date or time.',
        'reservation_id': 'Reservation #',
        'service': 'Service',
        'business': 'Business',
        'check_in': 'Check-in',
        'check_out': 'Check-out',
        'date': 'Date',
        'time': 'Time',
        'cta_view': 'View Reservation',
        'cta_search': 'Make New Reservation',
        'footer': 'This is an automated message. If you have any questions, please contact our BetulBooking support team.',
        # Password reset
        'pwreset_subject': 'Password Reset Request',
        'pwreset_title': 'Reset Your Password',
        'pwreset_badge': 'SECURITY',
        'pwreset_msg': 'You requested to reset the password for your account. Click the button below to set a new password.',
        'pwreset_cta': 'Reset My Password',
        'pwreset_validity': 'This link is valid for 1 hour.',
        'pwreset_ignore': "If you didn't request this, you can safely ignore this email.",
    }
}


def _get_business_name(reservation):
    try:
        if reservation.service and reservation.service.business_id:
            from app.models.business import Business
            biz = Business.query.get(reservation.service.business_id)
            if biz:
                return biz.name
    except Exception:
        pass
    return None


def _build_details_rows(reservation, lang):
    """Build (label, value) tuples for the details box."""
    L = T[lang]
    rows = [(L['reservation_id'], f"#{reservation.id}")]
    
    if reservation.service:
        rows.append((L['service'], reservation.service.name))
    
    biz_name = _get_business_name(reservation)
    if biz_name:
        rows.append((L['business'], biz_name))
    
    if reservation.reservation_type == 'hotel':
        if reservation.check_in_date:
            rows.append((L['check_in'], reservation.check_in_date.strftime('%d.%m.%Y')))
        if reservation.check_out_date:
            rows.append((L['check_out'], reservation.check_out_date.strftime('%d.%m.%Y')))
    elif reservation.slot:
        rows.append((L['date'], reservation.slot.date.strftime('%d.%m.%Y')))
        rows.append((L['time'], reservation.slot.start_time.strftime('%H:%M')))
    
    return rows


# ──────────────────────────────────────────────────────────────────────────
# Public mail functions
# ──────────────────────────────────────────────────────────────────────────

def send_reservation_confirmed(user_email, reservation, lang=None):
    """Send 'reservation approved' email."""
    lang = _detect_lang(reservation, lang)
    L = T[lang]
    
    details = _build_details_rows(reservation, lang)
    base_url = os.getenv('APP_BASE_URL', 'http://localhost:15000')
    
    # Plain text fallback
    text_body = f"{L['greeting']}\n\n{L['confirmed_msg']}\n\n"
    for label, value in details:
        text_body += f"{label}: {value}\n"
    text_body += f"\n{L['footer']}"
    
    # HTML
    html_body = _html_template(
        title=L['confirmed_title'],
        status_badge=L['badge_approved'],
        status_color='#10B981',
        greeting=L['greeting'],
        message=L['confirmed_msg'],
        details_rows=details,
        cta_text=L['cta_view'],
        cta_url=f"{base_url}/#reservations",
        footer_text=L['footer'],
    )
    
    _send(L['confirmed_subject'], [user_email], text_body, html_body)


def send_reservation_rejected(user_email, reservation, lang=None):
    """Send 'reservation rejected' email."""
    lang = _detect_lang(reservation, lang)
    L = T[lang]
    
    details = _build_details_rows(reservation, lang)
    base_url = os.getenv('APP_BASE_URL', 'http://localhost:15000')
    
    text_body = f"{L['greeting']}\n\n{L['rejected_msg']}\n\n"
    for label, value in details:
        text_body += f"{label}: {value}\n"
    text_body += f"\n{L['footer']}"
    
    html_body = _html_template(
        title=L['rejected_title'],
        status_badge=L['badge_rejected'],
        status_color='#EF4444',
        greeting=L['greeting'],
        message=L['rejected_msg'],
        details_rows=details,
        cta_text=L['cta_search'],
        cta_url=f"{base_url}/#businesses",
        footer_text=L['footer'],
    )
    
    _send(L['rejected_subject'], [user_email], text_body, html_body)


def send_password_reset(user_email, reset_token, base_url=None, lang='tr'):
    """Send password reset email."""
    if lang not in ('tr', 'en'):
        lang = 'tr'
    L = T[lang]
    
    if not base_url:
        base_url = os.getenv('APP_BASE_URL', 'http://localhost:15000')
    reset_link = f"{base_url}/#reset-password?token={reset_token}"
    
    # Plain text
    text_body = (
        f"{L['greeting']}\n\n"
        f"{L['pwreset_msg']}\n\n"
        f"{reset_link}\n\n"
        f"{L['pwreset_validity']}\n\n"
        f"{L['pwreset_ignore']}\n\n"
        f"{L['footer']}"
    )
    
    # HTML
    html_body = _html_template(
        title=L['pwreset_title'],
        status_badge=L['pwreset_badge'],
        status_color='#3B82F6',
        greeting=L['greeting'],
        message=L['pwreset_msg'] + ' ' + L['pwreset_validity'],
        details_rows=[],
        cta_text=L['pwreset_cta'],
        cta_url=reset_link,
        footer_text=L['pwreset_ignore'] + ' ' + L['footer'],
    )
    
    _send(L['pwreset_subject'], [user_email], text_body, html_body)


def send_partner_inquiry(name, email, phone, business_name, category, message):
    """Internal admin notification — keeps original plain-text format."""
    to = os.getenv("PARTNER_INBOX") or os.getenv("MAIL_USERNAME")
    if not to:
        print(
            f"[partner-inquiry] PARTNER_INBOX / MAIL_USERNAME tanımlı değil. "
            f"Talep: {name} <{email}> | {business_name} | {category}\n{message}"
        )
        return
    subject = f"[BETULBOOKING] İşletme talebi: {business_name or name}"
    body = (
        f"Yeni işletme / iş ortaklığı talebi\n\n"
        f"Ad Soyad: {name}\n"
        f"E-posta: {email}\n"
        f"Telefon: {phone or '-'}\n"
        f"İşletme adı: {business_name or '-'}\n"
        f"Kategori: {category or '-'}\n\n"
        f"Mesaj:\n{message or '-'}\n"
    )
    _send(subject, [to], body)

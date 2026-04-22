import os
import threading
from flask import current_app
from flask_mail import Message
from app import mail


def _send_async(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
        except Exception as e:
            print(f"Mail gönderimi başarısız: {e}")


def _send(subject, recipients, body):
    msg = Message(subject=subject, recipients=recipients, body=body)
    app = current_app._get_current_object()
    thread = threading.Thread(target=_send_async, args=(app, msg))
    thread.start()


def send_reservation_confirmed(user_email, reservation):
    subject = "Rezervasyonunuz Onaylandı"
    body = (
        f"Sayın Müşterimiz,\n\n"
        f"#{reservation.id} numaralı rezervasyonunuz onaylanmıştır.\n"
        f"Servis: {reservation.service.name}\n"
    )
    if reservation.reservation_type == 'hotel':
        body += (
            f"Giriş: {reservation.check_in_date}\n"
            f"Çıkış: {reservation.check_out_date}\n"
        )
    elif reservation.slot:
        body += (
            f"Tarih: {reservation.slot.date}\n"
            f"Saat: {reservation.slot.start_time.strftime('%H:%M')}\n"
        )
    body += "\nİyi günler dileriz."
    _send(subject, [user_email], body)


def send_reservation_rejected(user_email, reservation):
    subject = "Rezervasyonunuz Reddedildi"
    body = (
        f"Sayın Müşterimiz,\n\n"
        f"#{reservation.id} numaralı rezervasyonunuz maalesef reddedilmiştir.\n"
        f"Servis: {reservation.service.name}\n\n"
        f"Başka bir tarih veya saat seçerek tekrar rezervasyon yapabilirsiniz.\n"
        f"İyi günler dileriz."
    )
    _send(subject, [user_email], body)


def send_partner_inquiry(name, email, phone, business_name, category, message):
    """İşletme ekleme talebi — PARTNER_INBOX veya MAIL_USERNAME adresine gider."""
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


def send_password_reset(user_email, reset_token, base_url="http://localhost:5050"):
    subject = "Şifre Sıfırlama Talebi"
    reset_link = f"{base_url}/#reset-password?token={reset_token}"
    body = (
        f"Merhaba,\n\n"
        f"Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n\n"
        f"{reset_link}\n\n"
        f"Bu bağlantı 1 saat geçerlidir.\n\n"
        f"Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.\n\n"
        f"İyi günler dileriz."
    )
    _send(subject, [user_email], body)

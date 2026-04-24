/**
 * BetulBooking — i18n (Internationalization) Engine
 *
 * Kullanım:
 *   t('nav.home')                → "Ana Sayfa" (TR) / "Home" (EN)
 *   t('err.field_required', {field: 'Email'})
 *                                 → "Email alanı zorunludur" / "Email field is required"
 *   setLang('en')                → Dili değiştirir ve sayfayı yeniler
 *   getCurrentLang()             → 'tr' veya 'en'
 *
 * SRS §7.1 uyarınca İngilizce desteği; Türk kullanıcı için varsayılan dil Türkçe.
 */

(function () {
    'use strict';

    // ─── SÖZLÜK ─────────────────────────────────────────────────────────────
    // Hiyerarşik anahtarlar (nokta ile ayrılmış)
    // Her alt-aşamada yeni bölümler eklenecek: public, customer, admin, staff, errors
    const TRANSLATIONS = {
        tr: {
            // Dil
            'lang.tr': 'Türkçe',
            'lang.en': 'English',

            // Navigasyon (header)
            'nav.home': 'Ana Sayfa',
            'nav.hotels': 'Oteller',
            'nav.how_it_works': 'Nasıl Çalışır?',
            'nav.partner': 'İş Ortağı Ol',
            'nav.login': 'Giriş Yap',
            'nav.register': 'Kayıt Ol',
            'nav.logout': 'Çıkış Yap',
            'nav.profile': 'Profilim',
            'nav.reservations': 'Rezervasyonlarım',
            'nav.business_panel': 'İşletme Paneli',
            'nav.staff_panel': 'Personel Paneli',
            'nav.admin_panel': 'Platform Yönetimi',
            'nav.my_account': 'Hesabım',
            'nav.account_title': 'Profil, iletişim ve şifre ayarları',
            'nav.businesses': 'İşletmeler',
            'nav.businesses_all': 'Tümü',
            'nav.biz_cat.accommodation': 'Konaklama',
            'nav.biz_cat.food': 'Yeme & İçme',
            'nav.biz_cat.beauty': 'Güzellik & Bakım',
            'nav.biz_cat.health': 'Sağlık & Wellness',
            'nav.biz_cat.sport': 'Spor & Aktivite',
            'nav.biz_cat.event': 'Etkinlik & Organizasyon',
            'nav.biz_cat.service': 'Hizmet & Servis',
            'nav.biz_cat.education': 'Eğitim',

            // İşletme kategorileri (business.type → etiket) - arka uç değerleriyle eşleşir
            'biz.category.konaklama': 'Konaklama',
            'biz.category.yeme-icme': 'Yeme & İçme',
            'biz.category.guzellik': 'Güzellik & Bakım',
            'biz.category.saglik': 'Sağlık & Wellness',
            'biz.category.spor': 'Spor & Aktivite',
            'biz.category.etkinlik': 'Etkinlik & Organizasyon',
            'biz.category.hizmet': 'Hizmet & Servis',
            'biz.category.egitim': 'Eğitim',
            'biz.category.other': 'Diğer',

            // İşletme kartları
            'biz.view_services': 'Hizmetleri Gör',
            'biz.price_from': '{price} ₺\'den başlayan fiyatlar',
            'biz.price_from_short': '{price} ₺\'den',
            'biz.no_businesses': 'Bu kriterlere uygun işletme bulunamadı.',
            'biz.all_businesses': 'Tüm İşletmeler',
            'biz.service_badge_hotel': '🏨 KONAKLAMA',
            'biz.service_badge_appointment': '📅 RANDEVU HİZMETİ',

            // Mesajlar (toast/alert)
            'msg.login_success': 'Giriş başarılı! Hoş geldiniz.',
            'msg.register_success': 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.',
            'msg.booking_success': 'Rezervasyonunuz başarıyla oluşturuldu.',
            'msg.booking_error': 'Rezervasyon sırasında bir hata oluştu.',
            'msg.cancel_success': 'Rezervasyon iptal edildi.',
            'msg.unauthorized': 'Lütfen önce giriş yapın.',
            'msg.logging_out': 'Çıkış yapılıyor...',

            // Superadmin menü
            'sa.menu.businesses': 'İşletmeler',
            'sa.menu.users': 'Kullanıcılar',
            'sa.menu.logs': 'Günlükler',
            'sa.menu.stats': 'İstatistikler',

            // Business/Staff menü
            'biz.menu.dashboard': 'Panelim',
            'biz.menu.reservations': 'Rezervasyonlar',
            'biz.menu.services': 'Hizmetler / Odalar',
            'biz.menu.staff': 'Personel',
            'biz.menu.settings': 'Ayarlar',
            'staff.menu.schedule': 'Günlük Program',
            'staff.menu.reservations': 'Rezervasyonlar',
            'staff.menu.services': 'Hizmetlerim',

            // Genel butonlar
            'btn.save': 'Kaydet',
            'btn.cancel': 'Vazgeç',
            'btn.delete': 'Sil',
            'btn.edit': 'Düzenle',
            'btn.add': 'Ekle',
            'btn.close': 'Kapat',
            'btn.confirm': 'Onayla',
            'btn.reject': 'Reddet',
            'btn.approve': 'Onayla',
            'btn.search': 'Ara',
            'btn.clear': 'Temizle',
            'btn.back': 'Geri',
            'btn.next': 'Sonraki',
            'btn.prev': 'Önceki',
            'btn.view_details': 'Detayları Gör',
            'btn.book_now': 'Rezervasyon Yap',
            'btn.loading': 'Yükleniyor...',

            // Durumlar
            'status.pending': 'Beklemede',
            'status.approved': 'Onaylandı',
            'status.rejected': 'Reddedildi',
            'status.cancelled': 'İptal Edildi',
            'status.completed': 'Tamamlandı',

            // Genel mesajlar
            'common.loading': 'Yükleniyor...',
            'common.no_results': 'Sonuç bulunamadı.',
            'common.yes': 'Evet',
            'common.no': 'Hayır',
            'common.required': 'zorunludur',
            'common.page': 'Sayfa',
            'common.of': '/',
            'common.total_records': 'Toplam {count} kayıt',
            'common.search': 'Ara...',

            // Footer
            'footer.tagline': 'İşletmeleri keşfet, randevunu veya konaklamanı tek yerden yönet.',
            'footer.discover': 'Keşfet',
            'footer.all_businesses': 'Tüm İşletmeler',
            'footer.partners': 'İş Ortakları',
            'footer.add_business': 'İşletmeni Ekle',
            'footer.help': 'Yardım',
            'footer.copyright': 'Tüm hakları saklıdır.',

            // Site title (document.title)
            'site.title': 'BetülBooking | Lüks Hizmet & Rezervasyon Sistemi',
            'site.description': 'Lüks otel stili hizmetlerimizden yararlanmak için kolayca rezervasyon yapın.',

            // Hero / Ana sayfa
            'home.hero_title': 'İstediğiniz Zaman, İstediğiniz Yerde',
            'home.hero_subtitle': 'Otellerden profesyonel hizmetlere, aradığınız her şey burada.',
            'home.search_placeholder': 'Ne aramıştınız? Otel, kuaför, masaj...',
            'home.filter_city': 'İl',
            'home.filter_district': 'İlçe',
            'home.filter_price': 'Fiyat Aralığı',
            'home.filter_rating': 'Puan',
            'home.filter_rating_4plus': '4+ Yıldız',
            'home.filter_rating_3plus': '3+ Yıldız',
            'home.filter_all': 'Tümü',
            'home.filter_min': 'Min',
            'home.filter_max': 'Max',
            'home.popular_businesses': 'Popüler İşletmeler',
            'home.offer_period': 'Mayıs - Haziran 2026',
            'home.offer_title': 'Erken Yaz Fırsatları',
            'home.offer_subtitle': 'Seçili konaklamalarda %20\'ye varan indirimler',
            'home.offer_cta': 'Fırsatları Gör',
            'home.categories_title': 'Kategoriler',
            'home.back_to_home': '← Ana Sayfa',
            'home.back_to_home_full': '← Ana Sayfaya Dön',
            'common.loading_generic': 'Yükleniyor...',

            // Auth
            'auth.forgot_password': 'Şifremi Unuttum',
            'auth.login_title': 'Giriş Yap',
            'auth.email': 'E-posta Adresi',
            'auth.password': 'Şifre',
            'auth.password_confirm': 'Şifre (Tekrar)',
            'auth.sign_in': 'Oturum Aç',
            'auth.register_title': 'Kayıt Ol',
            'auth.name': 'Ad Soyad',
            'auth.phone': 'Telefon (İsteğe Bağlı)',
            'auth.role': 'Kimlik',
            'auth.role_customer': 'Müşteri',
            'auth.role_business_owner': 'İşletme Sahibi',
            'auth.register_btn': 'Hesap Oluştur',
            'auth.have_account': 'Zaten hesabın var mı?',
            'auth.no_account': 'Hesabın yok mu?',
            'auth.forgot_title': 'Şifre Sıfırlama',
            'auth.forgot_subtitle': 'E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.',
            'auth.send_reset_link': 'Sıfırlama Bağlantısı Gönder',
            'auth.reset_title': 'Yeni Şifre Belirle',
            'auth.new_password': 'Yeni Şifre',
            'auth.reset_btn': 'Şifreyi Güncelle',
            'auth.back_to_login': '← Girişe dön',
            'auth.password_mismatch': 'Şifreler eşleşmiyor.',
            'auth.check_email': 'E-postanızı kontrol edin — sıfırlama bağlantısı gönderildi.',
            'auth.invalid_link': 'Geçersiz Bağlantı',
            'auth.invalid_link_desc': 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.',
            'auth.request_again': 'Yeniden Talep Et',
            'auth.phone_mobile': 'Cep telefonu',
            'auth.invalid_phone': 'Geçerli bir cep telefonu girin (05XX…)',

            // How it works
            'hiw.title': 'Nasıl Çalışır?',
            'hiw.lead': 'BETULBOOKING ile işletmeleri keşfedin, uygun tarih ve saati seçin, rezervasyonunuzu birkaç adımda tamamlayın.',
            'hiw.step1_title': 'Keşfet ve ara',
            'hiw.step1_desc': 'Ana sayfadan il, ilçe veya anahtar kelime ile arama yapın. Kategorilere göre işletmeleri listeleyin, detay sayfasında hizmetleri inceleyin.',
            'hiw.step2_title': 'Tarih ve saat seç',
            'hiw.step2_desc': 'Otel odalarında giriş–çıkış tarihlerini; randevu hizmetlerinde uygun gün ve saati seçin. Müsaitlik takviminden kontrol edebilirsiniz.',
            'hiw.step3_title': 'Rezervasyonu onayla',
            'hiw.step3_desc': 'Giriş yaptıktan sonra rezervasyonunuzu oluşturun. İşletme onayı sonrası bildirim alırsınız; rezervasyonlarınızı panelden yönetebilirsiniz.',
            'hiw.cta_partner': 'İşletmenizi platforma eklemek isterseniz {link} sayfasından bize ulaşın.',

            // Partner / İşletmeni Ekle
            'partner.title': 'İşletmeni Ekle',
            'partner.sub': 'İşletmenizi BETULBOOKING üzerinde listelemek için süreç ekibimizle birlikte yürütülür. Aşağıdaki formu doldurun; sizinle iletişime geçip hesap ve içerik kurulumunu tamamlayalım.',
            'partner.process': 'Süreç: Talep → Kısa ön görüşme → Onay ve sözleşme → İşletme profili & hizmetlerin yayına alınması. Ortalama süre işletme büyüklüğüne göre değişir.',
            'partner.process_label': 'Süreç:',
            'partner.name': 'Ad Soyad',
            'partner.name_placeholder': 'Yetkili adı',
            'partner.business': 'İşletme adı',
            'partner.business_placeholder': 'Ticari unvan veya marka',
            'partner.email': 'E-posta',
            'partner.phone': 'Telefon',
            'partner.category': 'İşletme kategorisi',
            'partner.category_placeholder': 'Seçiniz',
            'partner.message': 'Mesajınız',
            'partner.message_placeholder': 'Şehir, hizmet sayısı, web siteniz veya eklemek istediğiniz notlar...',
            'partner.submit': 'Talebi Gönder',
            'partner.sent': 'Talebiniz alındı, en kısa sürede dönüş yapacağız.',

            // Navigation extra
            'nav.how_it_works': 'Nasıl Çalışır?',

            // Access denied
            'access.denied_title': 'Erişim reddedildi',
            'access.denied_desc': 'Bu sayfayı görüntülemek için gerekli yetkiye sahip değilsiniz.',
            'access.back_home': 'Ana Sayfaya Dön',

            // Rezervasyonlarım
            'res.my_title': 'Rezervasyonlarım',
            'res.none': 'Rezervasyonunuz bulunamadı.',
            'res.date': 'Tarih',
            'res.guest': 'Misafir',
            'res.note': 'Not',
            'res.note_empty': '—',
            'res.modify': 'Değiştir',
            'res.cancel': 'İptal',
            'res.review': 'Yorum',
            'res.confirm_cancel': 'İptal etmek istiyor musunuz?',
            'res.modify_dates': 'Tarihleri Güncelle',
            'res.create_title': 'Yeni Rezervasyon',
            'res.complete': 'Rezervasyonu Tamamla',
            'res.summary': 'Rezervasyon Özeti',
            'res.check_in': 'Giriş',
            'res.check_out': 'Çıkış',
            'res.no_slot_selected': 'Henüz tarih ve saat seçilmedi.',
            'res.guest_count': 'Misafir Sayısı',
            'res.guest_max': 'En fazla {max} kişi',
            'res.guest_hint': 'Temel kapasite: {base} kişi. Üstü için gece başına kişi başı {fee} ek ücret.',
            'res.capacity_exceeded': '⚠ Bu oda en fazla <strong>{max} kişi</strong> kabul edebilir. {over} kişi fazla — lütfen ek oda alın veya daha büyük bir oda seçin.',
            'res.coupon_label': 'İndirim / Kupon Kodu (opsiyonel)',
            'res.coupon_placeholder': 'ör. WELCOME10',
            'res.coupon_apply': 'Uygula',
            'res.coupon_valid': '✓ Kupon geçerli: %{pct} indirim',
            'res.note_optional': 'Varsa Notunuz',
            'res.select_time_first': 'Lütfen bir saat seçin.',
            'res.capacity_blocked': 'Misafir sayısı oda kapasitesini aşıyor.',
            'res.extra_guest': 'Ek misafir',
            'res.room_subtotal': 'Oda ara toplam',
            'res.unit_price': 'Birim fiyat',
            'res.subtotal': 'Ara toplam',
            'res.discount': 'İndirim',
            'res.vat': 'KDV',
            'res.total': 'Toplam',
            'res.free': 'Ücretsiz',
            'res.nights': 'gece',
            'res.per_night': '/ gece',
            'res.per_session': '/ seans',
            'res.vat_included': '(KDV dahil)',

            // Profile
            'profile.title': 'Profilim',
            'profile.info': 'Hesap Bilgileri',
            'profile.save': 'Bilgileri Güncelle',
            'profile.change_password': 'Şifre Değiştir',
            'profile.current_password': 'Mevcut Şifre',
            'profile.new_password': 'Yeni Şifre',
            'profile.password_changed': 'Şifreniz güncellendi.',
            'profile.info_updated': 'Bilgileriniz güncellendi.',
            'profile.phone_hint': 'Kayıtta 0 olmadan da girebilirsiniz; kaydederken 05XX… olarak saklanır.',
            'common.error': 'Hata',

            // Reviews
            'review.title': 'Yorum Yap',
            'review.rating': 'Puan',
            'review.comment': 'Yorumunuz',
            'review.comment_placeholder': 'Deneyiminizi paylaşın...',
            'review.submit': 'Gönder',
            'review.thanks': 'Yorumunuz için teşekkürler!',
            'review.staff_reply_prefix': 'İşletme yanıtı:',

            // İşletme / Otel detay
            'biz.not_found': 'İşletme bulunamadı.',
            'biz.hotel_not_found': 'Otel bulunamadı.',
            'biz.no_rooms': 'Bu otelde oda bulunamadı.',
            'biz.room_selection': 'Oda Seçimi & Müsaitlik',
            'biz.room_selection_hint': 'Tarih seçin veya bir odanın takvimini görüntüleyin.',
            'biz.room_num': 'Oda',
            'biz.room_standart': 'Standart',
            'biz.room_comfortable_desc': 'Konforlu ve ferah oda',
            'biz.availability': 'Müsaitlik',
            'biz.select_dates': 'Tarih Seçin:',
            'biz.services': 'Hizmetler',
            'biz.no_services': 'Bu işletmede henüz hizmet tanımlı değil.',
            'biz.make_reservation': 'Rezervasyon Yap',
            'biz.make_appointment': 'Randevu Al',
            'biz.details_btn': 'ℹ Detayları Gör',
            'biz.service_duration': '⏱️ {min} Dakika',
            'biz.rating': 'Puan',
            'biz.reviews': 'Yorumlar',
            'biz.no_reviews': 'Henüz yorum yok.',
            'biz.address': 'Adres',
            'biz.phone_label': 'Telefon',
            'biz.working_hours': 'Çalışma Saatleri',
            'biz.sort_default': 'Önerilen',
            'biz.sort_price_asc': 'Ucuzdan pahalıya',
            'biz.sort_price_desc': 'Pahalıdan ucuza',
            'biz.sort_label': 'Sırala:',
            'common.please_select': 'Lütfen seçiniz',
            'common.day_mon': 'Pzt', 'common.day_tue': 'Sal', 'common.day_wed': 'Çar',
            'common.day_thu': 'Per', 'common.day_fri': 'Cum', 'common.day_sat': 'Cmt', 'common.day_sun': 'Paz',

            // Dil seçici
            'lang.switch': 'Dil',
            'lang.tooltip': 'Dili değiştir',
        },
        en: {
            // Language
            'lang.tr': 'Türkçe',
            'lang.en': 'English',

            // Navigation
            'nav.home': 'Home',
            'nav.hotels': 'Hotels',
            'nav.how_it_works': 'How It Works',
            'nav.partner': 'Become a Partner',
            'nav.login': 'Login',
            'nav.register': 'Register',
            'nav.logout': 'Logout',
            'nav.profile': 'My Profile',
            'nav.reservations': 'My Reservations',
            'nav.business_panel': 'Business Panel',
            'nav.staff_panel': 'Staff Panel',
            'nav.admin_panel': 'Platform Management',
            'nav.my_account': 'My Account',
            'nav.account_title': 'Profile, contact and password settings',
            'nav.businesses': 'Businesses',
            'nav.businesses_all': 'All',
            'nav.biz_cat.accommodation': 'Accommodation',
            'nav.biz_cat.food': 'Food & Drink',
            'nav.biz_cat.beauty': 'Beauty & Care',
            'nav.biz_cat.health': 'Health & Wellness',
            'nav.biz_cat.sport': 'Sport & Activity',
            'nav.biz_cat.event': 'Events & Organization',
            'nav.biz_cat.service': 'Service',
            'nav.biz_cat.education': 'Education',

            // Business categories (business.type → label)
            'biz.category.konaklama': 'Accommodation',
            'biz.category.yeme-icme': 'Food & Drink',
            'biz.category.guzellik': 'Beauty & Care',
            'biz.category.saglik': 'Health & Wellness',
            'biz.category.spor': 'Sport & Activity',
            'biz.category.etkinlik': 'Events & Organization',
            'biz.category.hizmet': 'Service',
            'biz.category.egitim': 'Education',
            'biz.category.other': 'Other',

            // Business cards
            'biz.view_services': 'View Services',
            'biz.price_from': 'Prices from ₺{price}',
            'biz.price_from_short': 'from ₺{price}',
            'biz.no_businesses': 'No businesses match these criteria.',
            'biz.all_businesses': 'All Businesses',
            'biz.service_badge_hotel': '🏨 ACCOMMODATION',
            'biz.service_badge_appointment': '📅 APPOINTMENT SERVICE',

            // Messages (toast/alert)
            'msg.login_success': 'Login successful! Welcome.',
            'msg.register_success': 'Registration successful! You can now log in.',
            'msg.booking_success': 'Your reservation has been created successfully.',
            'msg.booking_error': 'An error occurred during reservation.',
            'msg.cancel_success': 'Reservation cancelled.',
            'msg.unauthorized': 'Please log in first.',
            'msg.logging_out': 'Logging out...',

            // Superadmin
            'sa.menu.businesses': 'Businesses',
            'sa.menu.users': 'Users',
            'sa.menu.logs': 'Logs',
            'sa.menu.stats': 'Statistics',

            // Business/Staff
            'biz.menu.dashboard': 'Dashboard',
            'biz.menu.reservations': 'Reservations',
            'biz.menu.services': 'Services / Rooms',
            'biz.menu.staff': 'Staff',
            'biz.menu.settings': 'Settings',
            'staff.menu.schedule': 'Daily Schedule',
            'staff.menu.reservations': 'Reservations',
            'staff.menu.services': 'My Services',

            // Buttons
            'btn.save': 'Save',
            'btn.cancel': 'Cancel',
            'btn.delete': 'Delete',
            'btn.edit': 'Edit',
            'btn.add': 'Add',
            'btn.close': 'Close',
            'btn.confirm': 'Confirm',
            'btn.reject': 'Reject',
            'btn.approve': 'Approve',
            'btn.search': 'Search',
            'btn.clear': 'Clear',
            'btn.back': 'Back',
            'btn.next': 'Next',
            'btn.prev': 'Previous',
            'btn.view_details': 'View Details',
            'btn.book_now': 'Book Now',
            'btn.loading': 'Loading...',

            // Statuses
            'status.pending': 'Pending',
            'status.approved': 'Approved',
            'status.rejected': 'Rejected',
            'status.cancelled': 'Cancelled',
            'status.completed': 'Completed',

            // Common
            'common.loading': 'Loading...',
            'common.no_results': 'No results found.',
            'common.yes': 'Yes',
            'common.no': 'No',
            'common.required': 'is required',
            'common.page': 'Page',
            'common.of': 'of',
            'common.total_records': '{count} records total',
            'common.search': 'Search...',

            // Footer
            'footer.tagline': 'Discover businesses, manage your appointments and stays in one place.',
            'footer.discover': 'Discover',
            'footer.all_businesses': 'All Businesses',
            'footer.partners': 'Partners',
            'footer.add_business': 'Add Your Business',
            'footer.help': 'Help',
            'footer.copyright': 'All rights reserved.',

            // Site title
            'site.title': 'BetülBooking | Premium Service & Reservation System',
            'site.description': 'Easily book our premium hotel-quality services.',

            // Hero / Home
            'home.hero_title': 'Anytime, Anywhere',
            'home.hero_subtitle': 'From hotels to professional services — everything you need, here.',
            'home.search_placeholder': 'What are you looking for? Hotel, hairdresser, massage...',
            'home.filter_city': 'City',
            'home.filter_district': 'District',
            'home.filter_price': 'Price Range',
            'home.filter_rating': 'Rating',
            'home.filter_rating_4plus': '4+ Stars',
            'home.filter_rating_3plus': '3+ Stars',
            'home.filter_all': 'All',
            'home.filter_min': 'Min',
            'home.filter_max': 'Max',
            'home.popular_businesses': 'Popular Businesses',
            'home.offer_period': 'May - June 2026',
            'home.offer_title': 'Early Summer Deals',
            'home.offer_subtitle': 'Up to 20% off selected accommodations',
            'home.offer_cta': 'View Deals',
            'home.categories_title': 'Categories',
            'home.back_to_home': '← Home',
            'home.back_to_home_full': '← Back to Home',
            'common.loading_generic': 'Loading...',

            // Auth
            'auth.forgot_password': 'Forgot Password',
            'auth.login_title': 'Sign In',
            'auth.email': 'Email Address',
            'auth.password': 'Password',
            'auth.password_confirm': 'Password (Again)',
            'auth.sign_in': 'Sign In',
            'auth.register_title': 'Sign Up',
            'auth.name': 'Full Name',
            'auth.phone': 'Phone (Optional)',
            'auth.role': 'Account Type',
            'auth.role_customer': 'Customer',
            'auth.role_business_owner': 'Business Owner',
            'auth.register_btn': 'Create Account',
            'auth.have_account': 'Already have an account?',
            'auth.no_account': "Don't have an account?",
            'auth.forgot_title': 'Reset Password',
            'auth.forgot_subtitle': 'Enter your email and we\'ll send you a reset link.',
            'auth.send_reset_link': 'Send Reset Link',
            'auth.reset_title': 'Set New Password',
            'auth.new_password': 'New Password',
            'auth.reset_btn': 'Update Password',
            'auth.back_to_login': '← Back to login',
            'auth.password_mismatch': 'Passwords do not match.',
            'auth.check_email': 'Check your email — reset link sent.',
            'auth.invalid_link': 'Invalid Link',
            'auth.invalid_link_desc': 'The password reset link is invalid or has expired.',
            'auth.request_again': 'Request Again',
            'auth.phone_mobile': 'Mobile Phone',
            'auth.invalid_phone': 'Enter a valid mobile phone (05XX…)',

            // How it works
            'hiw.title': 'How It Works',
            'hiw.lead': 'Discover businesses with BETULBOOKING, pick your date and time, complete your reservation in a few steps.',
            'hiw.step1_title': 'Explore and search',
            'hiw.step1_desc': 'Search by city, district or keyword from the home page. List businesses by category and review services on detail pages.',
            'hiw.step2_title': 'Choose date and time',
            'hiw.step2_desc': 'For hotel rooms pick check-in/check-out dates; for appointment services pick an available day and time from the availability calendar.',
            'hiw.step3_title': 'Confirm your reservation',
            'hiw.step3_desc': 'Sign in and create your reservation. You\'ll be notified after business approval; manage your reservations from your panel.',
            'hiw.cta_partner': 'If you want to list your business on our platform, reach out via {link}.',

            // Partner / Add Your Business
            'partner.title': 'Add Your Business',
            'partner.sub': 'To list your business on BETULBOOKING we\'ll guide you through the process together. Fill out the form below; we\'ll contact you to complete account and content setup.',
            'partner.process': 'Process: Inquiry → Short intro call → Approval & agreement → Business profile & services go live. Average time depends on business size.',
            'partner.process_label': 'Process:',
            'partner.name': 'Full Name',
            'partner.name_placeholder': 'Contact name',
            'partner.business': 'Business name',
            'partner.business_placeholder': 'Legal name or brand',
            'partner.email': 'Email',
            'partner.phone': 'Phone',
            'partner.category': 'Business category',
            'partner.category_placeholder': 'Select',
            'partner.message': 'Your message',
            'partner.message_placeholder': 'City, number of services, your website or any notes you\'d like to add...',
            'partner.submit': 'Submit Request',
            'partner.sent': 'Your request was received. We\'ll get back to you shortly.',

            // Navigation extra
            'nav.how_it_works': 'How It Works',

            // Access denied
            'access.denied_title': 'Access denied',
            'access.denied_desc': 'You don\'t have the required permission to view this page.',
            'access.back_home': 'Back to Home',

            // My Reservations
            'res.my_title': 'My Reservations',
            'res.none': 'You have no reservations.',
            'res.date': 'Date',
            'res.guest': 'Guests',
            'res.note': 'Note',
            'res.note_empty': '—',
            'res.modify': 'Modify',
            'res.cancel': 'Cancel',
            'res.review': 'Review',
            'res.confirm_cancel': 'Do you want to cancel this reservation?',
            'res.modify_dates': 'Update Dates',
            'res.create_title': 'New Reservation',
            'res.complete': 'Complete Reservation',
            'res.summary': 'Reservation Summary',
            'res.check_in': 'Check-in',
            'res.check_out': 'Check-out',
            'res.no_slot_selected': 'No date/time selected yet.',
            'res.guest_count': 'Number of Guests',
            'res.guest_max': 'Up to {max} guests',
            'res.guest_hint': 'Base capacity: {base} guests. Extra per night per guest: {fee}.',
            'res.capacity_exceeded': '⚠ This room accepts up to <strong>{max} guests</strong>. {over} over — please book an additional room or pick a larger one.',
            'res.coupon_label': 'Discount / Coupon Code (optional)',
            'res.coupon_placeholder': 'e.g. WELCOME10',
            'res.coupon_apply': 'Apply',
            'res.coupon_valid': '✓ Coupon valid: %{pct} discount',
            'res.note_optional': 'Optional Note',
            'res.select_time_first': 'Please select a time slot.',
            'res.capacity_blocked': 'Guest count exceeds room capacity.',
            'res.extra_guest': 'Extra guest',
            'res.room_subtotal': 'Room subtotal',
            'res.unit_price': 'Unit price',
            'res.subtotal': 'Subtotal',
            'res.discount': 'Discount',
            'res.vat': 'VAT',
            'res.total': 'Total',
            'res.free': 'Free',
            'res.nights': 'nights',
            'res.per_night': '/ night',
            'res.per_session': '/ session',
            'res.vat_included': '(VAT included)',

            // Profile
            'profile.title': 'My Profile',
            'profile.info': 'Account Information',
            'profile.save': 'Update Information',
            'profile.change_password': 'Change Password',
            'profile.current_password': 'Current Password',
            'profile.new_password': 'New Password',
            'profile.password_changed': 'Your password has been updated.',
            'profile.info_updated': 'Your information has been updated.',
            'profile.phone_hint': 'You can enter without leading 0; will be saved as 05XX…',
            'common.error': 'Error',

            // Reviews
            'review.title': 'Leave a Review',
            'review.rating': 'Rating',
            'review.comment': 'Your Review',
            'review.comment_placeholder': 'Share your experience...',
            'review.submit': 'Submit',
            'review.thanks': 'Thanks for your review!',
            'review.staff_reply_prefix': 'Business reply:',

            // Business / Hotel detail
            'biz.not_found': 'Business not found.',
            'biz.hotel_not_found': 'Hotel not found.',
            'biz.no_rooms': 'No rooms found at this hotel.',
            'biz.room_selection': 'Room Selection & Availability',
            'biz.room_selection_hint': 'Pick dates or view a room\'s calendar.',
            'biz.room_num': 'Room',
            'biz.room_standart': 'Standard',
            'biz.room_comfortable_desc': 'Comfortable and spacious room',
            'biz.availability': 'Availability',
            'biz.select_dates': 'Select Dates:',
            'biz.services': 'Services',
            'biz.no_services': 'No services defined yet for this business.',
            'biz.make_reservation': 'Book Now',
            'biz.make_appointment': 'Book Appointment',
            'biz.details_btn': 'ℹ View Details',
            'biz.service_duration': '⏱️ {min} minutes',
            'biz.rating': 'Rating',
            'biz.reviews': 'Reviews',
            'biz.no_reviews': 'No reviews yet.',
            'biz.address': 'Address',
            'biz.phone_label': 'Phone',
            'biz.working_hours': 'Working Hours',
            'biz.sort_default': 'Recommended',
            'biz.sort_price_asc': 'Price: low to high',
            'biz.sort_price_desc': 'Price: high to low',
            'biz.sort_label': 'Sort:',
            'common.please_select': 'Please select',
            'common.day_mon': 'Mon', 'common.day_tue': 'Tue', 'common.day_wed': 'Wed',
            'common.day_thu': 'Thu', 'common.day_fri': 'Fri', 'common.day_sat': 'Sat', 'common.day_sun': 'Sun',

            // Language switcher
            'lang.switch': 'Language',
            'lang.tooltip': 'Change language',
        },
    };

    // ─── MOTORİZİM ──────────────────────────────────────────────────────────
    const DEFAULT_LANG = 'tr';
    const STORAGE_KEY = 'betulbooking_lang';
    let currentLang = getStoredLang();

    function getStoredLang() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'tr' || saved === 'en') return saved;
        } catch (e) { /* localStorage olmayan ortamlar için */ }
        return DEFAULT_LANG;
    }

    function setLang(lang) {
        if (lang !== 'tr' && lang !== 'en') return;
        currentLang = lang;
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) { /* ignore */ }
        // Sayfayı yeniden render etmek için reload — en basit ve güvenli çözüm
        window.location.reload();
    }

    function getCurrentLang() {
        return currentLang;
    }

    /**
     * Anahtardan çevrilmiş metin döndürür. Placeholder interpolasyonu: {name}
     *
     * Örnek: t('common.total_records', {count: 42}) → "Toplam 42 kayıt"
     */
    function t(key, params) {
        const dict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
        let text = dict[key];

        // Anahtar bulunamazsa: diğer dilden dene, o da yoksa anahtar metnini döndür (debug için)
        if (text === undefined) {
            const fallback = TRANSLATIONS[DEFAULT_LANG][key];
            if (fallback !== undefined) {
                text = fallback;
            } else {
                // Debug: console uyarısı (prod'da siliniyor)
                if (window.console && console.warn) {
                    console.warn(`[i18n] Missing translation: "${key}"`);
                }
                return key;
            }
        }

        // Placeholder interpolasyonu
        if (params && typeof params === 'object') {
            text = text.replace(/\{(\w+)\}/g, (m, p) => (params[p] !== undefined ? params[p] : m));
        }
        return text;
    }

    /**
     * Sayfada `data-i18n="key"` attribute'ü olan tüm elementleri çevirir.
     * `data-i18n-attr="placeholder"` ile attribute çevirisi (ör. input placeholder) da desteklenir.
     *
     * Kullanım HTML'de:
     *   <h1 data-i18n="nav.home">Ana Sayfa</h1>
     *   <input data-i18n="common.search" data-i18n-attr="placeholder" placeholder="Ara...">
     */
    function translatePage(root) {
        const scope = root || document;
        // Metin içeriği
        scope.querySelectorAll('[data-i18n]').forEach(function (el) {
            const key = el.getAttribute('data-i18n');
            const attr = el.getAttribute('data-i18n-attr');
            const translated = t(key);
            if (attr) {
                el.setAttribute(attr, translated);
            } else {
                el.textContent = translated;
            }
        });
        // Title attribute
        scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
        });
    }

    // ─── GLOBAL API ─────────────────────────────────────────────────────────
    window.i18n = {
        t: t,
        setLang: setLang,
        getCurrentLang: getCurrentLang,
        translatePage: translatePage,
        TRANSLATIONS: TRANSLATIONS,  // debug/geliştirme için
    };
    // Kısa alias — kod içinde direkt t('key') kullanılabilsin
    window.t = t;

    // Sayfa yüklendiğinde <html lang="..."> attribute'ünü güncelle
    // + dil seçici butonlarını aktifleştir
    // + data-i18n'li elementleri çevir
    // + document.title'ı mevcut dile göre ayarla
    document.addEventListener('DOMContentLoaded', function () {
        document.documentElement.setAttribute('lang', currentLang);
        translatePage(document);
        // Sekme başlığı ve meta description
        try {
            document.title = t('site.title');
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', t('site.description'));
        } catch (e) { /* ignore */ }

        // Dil seçici butonlarına click handler bağla
        const buttons = document.querySelectorAll('.lang-btn[data-lang]');
        buttons.forEach(function (btn) {
            // Aktif dili vurgula (CSS: .lang-btn.active)
            if (btn.getAttribute('data-lang') === currentLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            // Click handler
            btn.addEventListener('click', function () {
                const target = btn.getAttribute('data-lang');
                if (target && target !== currentLang) {
                    setLang(target);  // localStorage + reload
                }
            });
        });
    });
})();

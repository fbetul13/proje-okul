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
            'biz.availability_calendar': 'Müsaitlik Takvimi',
            'cal.available': 'Müsait',
            'cal.booked': 'Dolu',
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
            'biz.closed': 'Kapalı',
            'biz.open_in_maps': 'Google Haritalar\'da Aç',
            'biz.rooms_heading': 'Odalar',
            'biz.services_heading': 'Hizmetler',
            'biz.no_services_yet': 'Bu işletmenin henüz hizmeti bulunmuyor.',
            'biz.customer_reviews': 'Müşteri Yorumları',
            'biz.reviews_count': '{n} değerlendirme',
            'biz.no_description': 'Açıklama bulunmuyor.',
            'biz.no_reviews_yet': 'Henüz yorum yapılmamış.',
            'biz.anonymous': 'Anonim',
            'biz.business_reply_prefix': 'İşletme Yanıtı:',
            'biz.day_mon_full': 'Pazartesi', 'biz.day_tue_full': 'Salı', 'biz.day_wed_full': 'Çarşamba',
            'biz.day_thu_full': 'Perşembe', 'biz.day_fri_full': 'Cuma', 'biz.day_sat_full': 'Cumartesi', 'biz.day_sun_full': 'Pazar',
            'biz.sort_default': 'Önerilen',
            'biz.sort_price_asc': 'Ucuzdan pahalıya',
            'biz.sort_price_desc': 'Pahalıdan ucuza',
            'biz.sort_label': 'Sırala:',
            'common.please_select': 'Lütfen seçiniz',
            'common.day_mon': 'Pzt', 'common.day_tue': 'Sal', 'common.day_wed': 'Çar',
            'common.day_thu': 'Per', 'common.day_fri': 'Cum', 'common.day_sat': 'Cmt', 'common.day_sun': 'Paz',

            // Modal rezervasyon / randevu
            'modal.room_guests': 'Misafir Sayısı',
            'modal.adults': 'Yetişkin',
            'modal.children': 'Çocuk',
            'modal.adult_count_1': '1 Yetişkin', 'modal.adult_count_2': '2 Yetişkin',
            'modal.adult_count_3': '3 Yetişkin', 'modal.adult_count_4': '4 Yetişkin',
            'modal.child_count_0': '0 Çocuk', 'modal.child_count_1': '1 Çocuk',
            'modal.child_count_2': '2 Çocuk', 'modal.child_count_3': '3 Çocuk',
            'modal.total': 'Toplam',
            'modal.nights_count': '({n} gece)',
            'modal.dates_title': 'Giriş ve çıkış tarihleri',
            'modal.dates_hint_create': 'Önce giriş gününe, sonra çıkış gününe tıklayın. Dolu günler seçilemez.',
            'modal.dates_hint_modify': 'Önce giriş gününe, sonra çıkış gününe tıklayın. Kendi rezervasyonunuzdaki günler müsait sayılır; yalnızca başkalarının tarihleri dolu görünür.',
            'modal.note_optional': 'Not (opsiyonel)',
            'modal.note_placeholder': 'Özel istekleriniz...',
            'modal.cancel': 'İptal',
            'modal.book': 'Rezervasyon Yap',
            'modal.save': 'Kaydet',
            'modal.loading': 'Yükleniyor…',
            'modal.select_date_first': 'Lütfen tarih seçin.',
            'modal.select_slot_first': 'Lütfen bir saat seçin.',
            'modal.appt_title_date': 'Tarih',
            'modal.appt_title_time': 'Saat',
            'modal.appt_no_slots': 'Bu tarihte müsait saat yok.',
            'modal.appt_book': 'Randevu Al',
            'modal.appt_duration': '⏱️ {min} dakika',
            'modal.appt_step_day': '1. Gün seçin',
            'modal.appt_step_day_hint': 'Takvimden bir güne tıklayın; ardından saatleri seçin.',
            'modal.appt_step_time': '2. Saat Seçin',
            'modal.appt_pick_day_first': 'Önce takvimden gün seçin',

            // Review modal
            'rev.modal_title': 'Yorum Yap',
            'rev.rating_label': 'Puanınız',
            'rev.comment_label': 'Yorumunuz',
            'rev.placeholder': 'Deneyiminizi paylaşın...',
            'rev.send': 'Gönder',
            'rev.thanks': 'Yorumunuz için teşekkürler!',
            'rev.pick_rating': 'Lütfen bir puan seçin.',
            'rev.already': 'Bu rezervasyon için zaten yorum bıraktınız.',

            // ─── Admin / Staff / Business Owner Paneller ───────────────
            // Superadmin
            'sa.menu.stats': 'İstatistikler',
            'sa.menu.businesses': 'İşletmeler',
            'sa.menu.users': 'Kullanıcılar',
            'sa.menu.logs': 'Günlükler',
            'sa.title.stats': 'Platform İstatistikleri',
            'sa.title.businesses': 'İşletme Yönetimi',
            'sa.title.users': 'Kullanıcı Yönetimi',
            'sa.title.logs': 'Sistem Günlükleri',
            'sa.stats.total_users': 'Toplam Kullanıcı',
            'sa.stats.total_businesses': 'Toplam İşletme',
            'sa.stats.total_reservations': 'Toplam Rezervasyon',
            'sa.stats.total_revenue': 'Toplam Gelir',
            'sa.stats.monthly_revenue': 'Aylık Gelir',
            'sa.stats.pending_revenue': 'Bekleyen Gelir',
            'sa.stats.recent_logs': 'Son Hareketler',
            'sa.stats.no_logs': 'Henüz log kaydı yok.',
            'sa.stats.monthly_trend': 'Aylık Rezervasyon Trendi',
            'sa.stats.category_dist': 'Kategori Dağılımı',
            'sa.stats.top5_services': 'En Popüler 5 Hizmet',
            'sa.stats.reservation_label': 'Rezervasyon',
            'sa.cat.hotel': 'Otel',
            'sa.cat.appointment': 'Randevu',
            'sa.empty.no_reservations': 'Henüz rezervasyon yok.',

            // İşletme form modal
            'biz_form.new_title': 'Yeni İşletme Ekle',
            'biz_form.edit_title': 'İşletme Düzenle',
            'biz_form.name': 'İşletme Adı',
            'biz_form.description': 'Açıklama',
            'biz_form.address': 'Açık Adres',
            'biz_form.address_ph': 'Mahalle, cadde, bina no...',
            'biz_form.image_url': 'Görsel URL',
            'biz_form.pick_city_first': 'Önce il seçin',
            'biz_form.owner_optional': 'İşletme Sahibi (Opsiyonel)',
            'biz_form.owner_required': 'İşletme sahibi için ad, e-posta ve şifre zorunludur.',

            // Confirm dialogs
            'confirm.delete_user': 'Kullanıcıyı silmek istediğinize emin misiniz?',
            'confirm.delete_business_long': 'İşletmeyi silmek istediğinize emin misiniz? Bağlı tüm hizmetler etkilenebilir.',
            'confirm.delete_generic': 'Silmek istediğinize emin misiniz?',
            'confirm.delete_staff': 'Personeli silmek istediğinize emin misiniz?',
            'confirm.cancel_approved_reservation': 'Onaylanan rezervasyon iptal edilsin mi?',

            // Toast messages
            'toast.pick_dates': 'Lütfen giriş ve çıkış tarihi seçin.',
            'toast.checkout_after_checkin': 'Çıkış tarihi girişten sonra olmalıdır.',
            'toast.room_unavailable': 'Seçilen tarihler için bu oda dolu.',
            'toast.pick_room_first': 'Lütfen önce bir oda seçin.',
            'toast.login_to_book': 'Rezervasyon yapabilmek için giriş yapmalısınız.',
            'toast.pick_time': 'Lütfen bir saat seçin.',
            'toast.date_locked': 'Bu tarih rezerve. İptal etmeden kapatamazsınız.',
            'toast.day_locked': 'Bu gün rezerve (kilitli).',
            'toast.reservation_updated': 'Rezervasyon güncellendi.',
            'toast.reservation_created': 'Rezervasyon başarıyla oluşturuldu.',
            'toast.user_updated': 'Kullanıcı güncellendi.',
            'toast.user_deleted': 'Kullanıcı silindi.',
            'toast.owner_pass_mismatch': 'İşletme sahibi şifreleri eşleşmiyor.',
            'toast.owner_phone_invalid': 'İşletme sahibi için geçerli cep telefonu girin (05XX…).',
            'toast.business_saved': 'İşletme başarıyla kaydedildi.',
            'toast.business_deleted': 'İşletme silindi.',
            'toast.saved_success': 'Başarıyla kaydedildi.',
            'toast.slot_updated': 'Slot durumu güncellendi.',
            'toast.availability_created': 'Müsaitlik oluşturuldu!',
            'toast.pick_start_end': 'Lütfen başlangıç ve bitiş tarihi seçin.',
            'toast.end_after_start': 'Bitiş tarihi başlangıçtan önce olamaz.',
            'toast.reservation_cancelled': 'Rezervasyon iptal edildi.',
            'toast.hours_updated': 'Çalışma saatleri güncellendi.',
            'toast.no_review_for_reservation': 'Bu rezervasyon için yorum yok.',
            'toast.reply_empty': 'Yanıt boş olamaz.',
            'toast.reply_sent': 'Yanıt gönderildi.',
            'toast.image_uploaded': 'Resim başarıyla yüklendi.',
            'toast.server_error': 'Sunucu hatası oluştu.',
            'sa.btn.new_business': '+ Yeni İşletme',
            'sa.btn.add_user': '+ Kullanıcı Ekle',
            'sa.search_business_ph': 'İşletme ara...',
            'sa.search_user_ph': 'Kullanıcı ara...',
            'sa.search_log_ph': 'Log ara (işlem/kullanıcı/içerik)...',
            'sa.search_clear': 'Temizle',
            'sa.col.name': 'Ad',
            'sa.col.type': 'Tip',
            'sa.col.location': 'Konum',
            'sa.col.owner': 'Sahip',
            'sa.col.email': 'E-posta',
            'sa.col.role': 'Rol',
            'sa.col.created': 'Oluşturulma',
            'sa.col.actions': 'İşlemler',
            'sa.col.user': 'Kullanıcı',
            'sa.col.action': 'İşlem',
            'sa.col.affected': 'Etkilenen ID',
            'sa.col.timestamp': 'Tarih',
            'sa.empty.businesses': 'Henüz işletme yok.',
            'sa.empty.users': 'Henüz kullanıcı yok.',
            'sa.empty.logs_filter': 'Filtrenize uygun log bulunamadı.',
            'sa.confirm.delete_business': '"{name}" işletmesini silmek istediğinizden emin misiniz?',
            'sa.confirm.delete_user': '"{name}" kullanıcısını silmek istediğinizden emin misiniz?',
            'sa.role.customer': 'Müşteri',
            'sa.role.staff': 'Personel',
            'sa.role.business_owner': 'İşletme Sahibi',
            'sa.role.superadmin': 'Süper Admin',
            'sa.tab_log_hint': 'AND, OR, NOT operatörlerini kullanabilirsiniz (büyük harfle). Örnekler: CREATE AND reservation · UPDATE OR DELETE · CREATE NOT service',
            'sa.tab_log_hint_label': 'İpucu:',

            // Business Owner
            'bo.menu.dashboard': 'İstatistikler',
            'bo.menu.services': 'Hizmetler',
            'bo.menu.reservations': 'Rezervasyonlar',
            'bo.menu.staff': 'Personel',
            'bo.menu.settings': 'Ayarlar',
            'bo.title.dashboard': 'Pano',
            'bo.title.services': 'Hizmet Yönetimi',
            'bo.title.reservations': 'Rezervasyon Yönetimi',
            'bo.title.staff': 'Personel Yönetimi',
            'bo.title.settings': 'İşletme Ayarları',
            'bo.btn.add_service': '+ Yeni Hizmet',
            'bo.btn.add_staff': '+ Personel Ekle',
            'bo.empty.services': 'Henüz hizmet yok.',
            'bo.empty.reservations': 'Henüz rezervasyon yok.',
            'bo.empty.staff': 'Henüz personel yok.',
            'bo.col.service': 'Hizmet',
            'bo.col.category': 'Kategori',
            'bo.col.duration': 'Süre',
            'bo.col.price': 'Fiyat',
            'bo.col.customer': 'Müşteri',
            'bo.col.date': 'Tarih',
            'bo.col.status': 'Durum',
            'bo.col.contact': 'İletişim',
            'bo.col.phone': 'Telefon',
            'bo.col.datetime': 'Tarih/Saat',

            // Staff
            'st.menu.dashboard': 'Bugün',
            'st.menu.reservations': 'Rezervasyonlar',
            'st.menu.services': 'Hizmetler',
            'st.title.dashboard': 'Personel Panosu',
            'st.title.today': "Bugünkü Randevular",
            'st.no_today': 'Bugün için randevu yok.',
            'st.menu.calendar': 'Takvim',
            'st.work_schedule': 'Çalışma Takvimi',
            'st.this_week': 'Bu Hafta',
            'st.no_reservations_period': 'Bu dönem için rezervasyon bulunmuyor.',
            'st.api_error': 'Takvim servisi bulunamadı. Sayfayı yenileyin.',
            'st.time_label': 'Saat',
            'st.all_reservations': 'Tüm Rezervasyonlar',
            'common.no_records': 'Kayıt bulunamadı.',
            'toast.reservation_approved': 'Rezervasyon onaylandı.',
            'toast.reservation_rejected': 'Rezervasyon reddedildi.',
            'st.services_avail_mgmt': 'Hizmetler & Müsaitlik Yönetimi',
            'st.no_services_for_business': 'Bu işletmeye ait hizmet bulunamadı.',
            'st.cat.room': 'Oda',
            'st.reservation_dates': 'Rezervasyon Tarihleri',
            'st.create_availability': 'Müsaitlik Oluştur',
            'st.slots': 'Slotlar',
            'st.bookable_dates': 'Rezervasyon Yapılabilir Tarihler',

            // Calendar months (0-indexed)
            'cal.month.0': 'Ocak', 'cal.month.1': 'Şubat', 'cal.month.2': 'Mart',
            'cal.month.3': 'Nisan', 'cal.month.4': 'Mayıs', 'cal.month.5': 'Haziran',
            'cal.month.6': 'Temmuz', 'cal.month.7': 'Ağustos', 'cal.month.8': 'Eylül',
            'cal.month.9': 'Ekim', 'cal.month.10': 'Kasım', 'cal.month.11': 'Aralık',
            'search.searching': 'Aranıyor...',
            'search.badge_room': 'ODA',
            'search.badge_service': 'HZM',
            // Manual reservation
            'mr.title': 'Manuel Rezervasyon',
            'mr.customer_name': 'Müşteri Adı',
            'mr.checkin_checkout': 'Giriş / Çıkış Tarihleri',
            'mr.dates_hint': 'Önce giriş gününe, sonra çıkış gününe tıklayın.',
            'mr.create': 'Rezervasyon Oluştur',
            'mr.no_dates_picked': 'Tarih seçimi yapılmadı.',
            // Availability management
            'avail.current_period': 'Mevcut Müsaitlik Dönemi',
            'avail.daily': 'Günlük Müsaitlik',
            'avail.create': 'Müsaitlik Oluştur',
            'avail.no_slots_hint': 'Slot bulunamadı. "Müsaitlik Oluştur" ile 30 günlük takvim oluşturun.',
            'mr.no_slots': 'Müsait slot yok',
            'biz.continue_book': 'Devam Et ve Rezerve Et',

            // Dil seçici
            'lang.switch': 'Dil',
            'lang.tooltip': 'Dili değiştir',

            // — auto-added missing keys —
            'filter.all_districts': 'Tüm İlçeler',
            'filter.all_cities': 'Tüm İller',
            'filter.searching': 'Aranıyor...',
            'filter.stars': 'Yıldız',
            'filter.popular_businesses': 'Popüler İşletmeler',
            'filter.businesses_suffix': 'İşletmeleri',
            'day.mon': 'Pazartesi',
            'day.tue': 'Salı',
            'day.wed': 'Çarşamba',
            'day.thu': 'Perşembe',
            'day.fri': 'Cuma',
            'day.sat': 'Cumartesi',
            'day.sun': 'Pazar',
            'day.closed': 'Kapalı',
            'day.open': 'Açık',
            'common.processing': 'İşleniyor...',
            'common.updating': 'Güncelleniyor...',
            'common.no_selection': 'Seçim yok',
            'common.clear': 'Temizle',
            'common.close_selection': 'Seçimi Kapat',
            'common.select_range': 'Aralık Seç',
            'svc.not_found_msg': 'Hizmet bulunamadı.',
            'svc.try_again': 'Lütfen ana sayfaya dönüp tekrar deneyin.',
            'svc.go_home': 'Ana Sayfaya Dön',
            'svc.accommodation_label': '🏨 KONAKLAMA',
            'svc.appointment_label': '📅 RANDEVU HİZMETİ',
            'svc.no_slot_yet': 'Henüz tarih ve saat seçilmedi.',
            'svc.no_slots_for_date': 'Bu tarihte müsait saat bulunamadı.',
            'svc.no_appts_for_date': 'Bu tarihte müsait randevu bulunamadı.',
            'svc.select_time_first': 'Önce saat seçin.',
            'hotel.selected_room': 'Seçilen Oda',
            'hotel.no_availability': 'Henüz müsaitlik yok',
            'hotel.no_open_dates': 'Henüz rezervasyona açık tarih yok',
            'slot.existing': 'Mevcut',
            'slot.past': 'Geçmiş',
            'slot.select': 'Seç',
            'slot.no_slots_today': 'Bu tarihte slot bulunamadı.',
            'slot.no_dates_in_calendar': 'Takvimde gösterilecek tarih yok. Yukarıdan tarih aralığı ekleyin.',
            'avail.range_opened': 'Tarih aralığı açıldı.',
            'avail.open_range': 'Aralığı Aç',
            'avail.calendar_hint_select': 'Takvimden ilk günü, sonra son günü seç.',
            'avail.calendar_hint_open': 'Slot eklemek için "Aralık Seç"i aç.',
            'avail.create_7day': 'Bu hizmet için 7 günlük müsaitlik oluşturulacak.',
            'booking.special_requests': 'Özel istekleriniz...',
            'booking.modify_failed': 'Düzenleme açılamadı',
            'booking.share_experience': 'Deneyiminizi paylaşın...',
            'status.pending_label': 'Beklemede',
            'status.approved_label': 'Onaylandı',
            'status.rejected_label': 'Reddedildi',
            'status.waiting_response': 'Yanıt bekliyor',
            'status.cancel_or_reject': 'İptal/ret',
            'status.approval_rate': 'Onay oranı',
            'status.service_label': 'Hizmet',
            'status.active': 'Aktif',
            'status.none_yet': 'Henüz yok',
            'status.failed_to_load': 'Veriler yüklenemedi',
            'svc_form.title_edit': 'Hizmet Düzenle',
            'svc_form.title_new': 'Yeni Hizmet Ekle',
            'svc_form.name': 'Hizmet Adı',
            'svc_form.description': 'Açıklama',
            'svc_form.price': 'Fiyat (₺)',
            'svc_form.price_placeholder': 'Örn: 150.00',
            'svc_form.image_url': 'Görsel URL',
            'user_form.title': 'Kullanıcı Düzenle',
            'user_form.business_id_hint': '(staff/business_owner için)',
            'user_form.business_id': 'İşletme ID',
            'user_form.new_password': 'Yeni Şifre',
            'user_form.optional': '(boş bırakılabilir)',
            'staff_form.title_edit': 'Personel Düzenle',
            'staff_form.title_new': 'Yeni Personel Ekle',
            'staff_form.password': 'Şifre',
            'staff_form.password_repeat': 'Şifre tekrar',
            'staff.first_reservation': 'İlk rezervasyonunu al',
            'staff.add_manual': 'manuel ekle',
            'staff.your_reply': 'Yanıtınız:',
            'staff.reply_placeholder': 'Müşteriye yanıt yazın...',
            'toast.upload_error': 'Yükleme hatası',
            'form.select': 'Seçiniz',

            // — extra missing keys —
            'biz.opening_hours': 'Çalışma Saatleri',
            'booking.summary': 'Rezervasyon Özeti',
            'booking.num_guests': 'Kişi Sayısı',
            'booking.your_note': 'Varsa Notunuz',
            'booking.complete': 'Rezervasyonu Tamamla',
            'user_form.full_name': 'Ad Soyad',
            'bo.today_agenda': 'Bugünün Ajandası',
            'bo.status_distribution': 'Durum Dağılımı',
            'bo.recent_reservations': 'Son Rezervasyonlar',
            'common.see_all': 'Tümünü gör',
            'bo.quick_start': 'Hızlı Başlangıç',
            'bo.fill_panel': 'Paneli dolduralım',
            'bo.add_staff': 'Personel ekle',
            'bo.edit_services': 'Hizmetleri düzenle',
            'svc_form.cat_hotel': 'Otel Odası',
            'svc_form.cat_appointment': 'Randevu Hizmeti',
            'svc_form.room_number': 'Oda No',
            'svc_form.room_type': 'Oda Tipi',

            // — round-3 missing keys —
            'common.start_date': 'Başlangıç Tarihi',
            'common.end_date': 'Bitiş Tarihi',
            'common.calendar_view': 'Takvim Görünümü',
            'user_form.phone': 'Cep telefonu',
            'biz_form.general_info': 'Genel Bilgiler',
            'biz_form.full_address': 'Açık Adres',
            'staff.send_reply': 'Yanıtı Gönder',

            // -- amenities & details --
            'biz.view_details': 'Detayları Gör',
            'amenities.title': 'Oda Özellikleri',
            'amenities.wifi': 'Ücretsiz Wi-Fi',
            'amenities.ac': 'Klima',
            'amenities.breakfast': 'Kahvaltı Dahil',
            'amenities.minibar': 'Mini Bar',
            'amenities.tv': 'LCD TV',
            'amenities.bathroom': 'Özel Banyo',
            'amenities.parking': 'Otopark',
            'amenities.pool': 'Havuz',

            // -- amenities --
            'amenities.daily_cleaning': 'Günlük Temizlik',
            'amenities.city_view': 'Şehir Manzaralı',
            'amenities.living_room': 'Oturma Odası',
            'amenities.premium_bedding': 'Premium Yatak Takımı',
            'amenities.bathrobe': 'Bornoz ve Terlik',
            'amenities.welcome_drink': 'Hoşgeldin Şampanyası',
            'amenities.crib': 'Bebek Yatağı',
            'amenities.family_breakfast': 'Aile Kahvaltısı',
            'amenities.kids_area': 'Çocuk Oyun Alanı',
            'amenities.butler': 'Özel Butler Hizmeti',
            'amenities.private_pool': 'Özel Havuz Erişimi',
            'amenities.spa_voucher': 'Spa Hediye Çeki',
            'amenities.airport_transfer': 'Havalimanı Transferi',

            // -- cancellation policy --
            'res.cancel_free': 'Ücretsiz iptal (3+ gün önce).',
            'res.cancel_fee_20': 'İptal ücreti: %20 kesinti.',
            'res.cancel_fee_50': 'Bugün iptal: %50 kesinti uygulanır.',
            'res.cancel_too_late': 'Bu rezervasyon iptal edilemez (geçmiş tarih).',

            // -- breakfast --
            'modal.breakfast_included': 'Kahvaltı Dahil',
            'modal.breakfast_extra': '(+%15 ek ücret)',
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
            'biz.availability_calendar': 'Availability Calendar',
            'cal.available': 'Available',
            'cal.booked': 'Booked',
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
            'biz.closed': 'Closed',
            'biz.open_in_maps': 'Open in Google Maps',
            'biz.rooms_heading': 'Rooms',
            'biz.services_heading': 'Services',
            'biz.no_services_yet': 'This business has no services yet.',
            'biz.customer_reviews': 'Customer Reviews',
            'biz.reviews_count': '{n} reviews',
            'biz.no_description': 'No description available.',
            'biz.no_reviews_yet': 'No reviews yet.',
            'biz.anonymous': 'Anonymous',
            'biz.business_reply_prefix': 'Business Reply:',
            'biz.day_mon_full': 'Monday', 'biz.day_tue_full': 'Tuesday', 'biz.day_wed_full': 'Wednesday',
            'biz.day_thu_full': 'Thursday', 'biz.day_fri_full': 'Friday', 'biz.day_sat_full': 'Saturday', 'biz.day_sun_full': 'Sunday',
            'biz.sort_default': 'Recommended',
            'biz.sort_price_asc': 'Price: low to high',
            'biz.sort_price_desc': 'Price: high to low',
            'biz.sort_label': 'Sort:',
            'common.please_select': 'Please select',
            'common.day_mon': 'Mon', 'common.day_tue': 'Tue', 'common.day_wed': 'Wed',
            'common.day_thu': 'Thu', 'common.day_fri': 'Fri', 'common.day_sat': 'Sat', 'common.day_sun': 'Sun',

            // Modal reservation / appointment
            'modal.room_guests': 'Number of Guests',
            'modal.adults': 'Adults',
            'modal.children': 'Children',
            'modal.adult_count_1': '1 Adult', 'modal.adult_count_2': '2 Adults',
            'modal.adult_count_3': '3 Adults', 'modal.adult_count_4': '4 Adults',
            'modal.child_count_0': '0 Children', 'modal.child_count_1': '1 Child',
            'modal.child_count_2': '2 Children', 'modal.child_count_3': '3 Children',
            'modal.total': 'Total',
            'modal.nights_count': '({n} nights)',
            'modal.dates_title': 'Check-in and check-out dates',
            'modal.dates_hint_create': 'First click the check-in day, then the check-out day. Unavailable days cannot be selected.',
            'modal.dates_hint_modify': 'First click the check-in day, then the check-out day. Days from your own reservation count as available; only other bookings appear unavailable.',
            'modal.note_optional': 'Note (optional)',
            'modal.note_placeholder': 'Your special requests...',
            'modal.cancel': 'Cancel',
            'modal.book': 'Book Now',
            'modal.save': 'Save',
            'modal.loading': 'Loading…',
            'modal.select_date_first': 'Please select a date.',
            'modal.select_slot_first': 'Please select a time slot.',
            'modal.appt_title_date': 'Date',
            'modal.appt_title_time': 'Time',
            'modal.appt_no_slots': 'No available time slots on this date.',
            'modal.appt_book': 'Book Appointment',
            'modal.appt_duration': '⏱️ {min} minutes',
            'modal.appt_step_day': '1. Pick a day',
            'modal.appt_step_day_hint': 'Click a day on the calendar, then pick a time.',
            'modal.appt_step_time': '2. Pick a time',
            'modal.appt_pick_day_first': 'First pick a day from the calendar',

            // Review modal
            'rev.modal_title': 'Leave a Review',
            'rev.rating_label': 'Your Rating',
            'rev.comment_label': 'Your Review',
            'rev.placeholder': 'Share your experience...',
            'rev.send': 'Submit',
            'rev.thanks': 'Thanks for your review!',
            'rev.pick_rating': 'Please pick a rating.',
            'rev.already': 'You already reviewed this reservation.',

            // ─── Admin / Staff / Business Owner Panels ─────────────────
            // Superadmin
            'sa.menu.stats': 'Statistics',
            'sa.menu.businesses': 'Businesses',
            'sa.menu.users': 'Users',
            'sa.menu.logs': 'Logs',
            'sa.title.stats': 'Platform Statistics',
            'sa.title.businesses': 'Business Management',
            'sa.title.users': 'User Management',
            'sa.title.logs': 'System Logs',
            'sa.stats.total_users': 'Total Users',
            'sa.stats.total_businesses': 'Total Businesses',
            'sa.stats.total_reservations': 'Total Reservations',
            'sa.stats.total_revenue': 'Total Revenue',
            'sa.stats.monthly_revenue': 'Monthly Revenue',
            'sa.stats.pending_revenue': 'Pending Revenue',
            'sa.stats.recent_logs': 'Recent Activity',
            'sa.stats.no_logs': 'No logs yet.',
            'sa.stats.monthly_trend': 'Monthly Reservation Trend',
            'sa.stats.category_dist': 'Category Distribution',
            'sa.stats.top5_services': 'Top 5 Services',
            'sa.stats.reservation_label': 'Reservations',
            'sa.cat.hotel': 'Hotel',
            'sa.cat.appointment': 'Appointment',
            'sa.empty.no_reservations': 'No reservations yet.',

            // Business form modal
            'biz_form.new_title': 'New Business',
            'biz_form.edit_title': 'Edit Business',
            'biz_form.name': 'Business Name',
            'biz_form.description': 'Description',
            'biz_form.address': 'Address',
            'biz_form.address_ph': 'Neighborhood, street, building no...',
            'biz_form.image_url': 'Image URL',
            'biz_form.pick_city_first': 'Pick a city first',
            'biz_form.owner_optional': 'Business Owner (Optional)',
            'biz_form.owner_required': 'Owner name, email and password are required.',

            // Confirm dialogs
            'confirm.delete_user': 'Are you sure you want to delete this user?',
            'confirm.delete_business_long': 'Are you sure you want to delete this business? All linked services may be affected.',
            'confirm.delete_generic': 'Are you sure you want to delete?',
            'confirm.delete_staff': 'Are you sure you want to delete this staff member?',
            'confirm.cancel_approved_reservation': 'Cancel this approved reservation?',

            // Toast messages
            'toast.pick_dates': 'Please select check-in and check-out dates.',
            'toast.checkout_after_checkin': 'Check-out must be after check-in.',
            'toast.room_unavailable': 'This room is unavailable for the selected dates.',
            'toast.pick_room_first': 'Please pick a room first.',
            'toast.login_to_book': 'You need to log in to make a reservation.',
            'toast.pick_time': 'Please pick a time slot.',
            'toast.date_locked': 'This date is reserved. Cancel before closing.',
            'toast.day_locked': 'This day is reserved (locked).',
            'toast.reservation_updated': 'Reservation updated.',
            'toast.reservation_created': 'Reservation created successfully.',
            'toast.user_updated': 'User updated.',
            'toast.user_deleted': 'User deleted.',
            'toast.owner_pass_mismatch': 'Owner passwords do not match.',
            'toast.owner_phone_invalid': 'Enter a valid mobile phone for owner (05XX…).',
            'toast.business_saved': 'Business saved successfully.',
            'toast.business_deleted': 'Business deleted.',
            'toast.saved_success': 'Saved successfully.',
            'toast.slot_updated': 'Slot status updated.',
            'toast.availability_created': 'Availability created!',
            'toast.pick_start_end': 'Please pick start and end dates.',
            'toast.end_after_start': 'End date must be after start date.',
            'toast.reservation_cancelled': 'Reservation cancelled.',
            'toast.hours_updated': 'Working hours updated.',
            'toast.no_review_for_reservation': 'No review for this reservation.',
            'toast.reply_empty': 'Reply cannot be empty.',
            'toast.reply_sent': 'Reply sent.',
            'toast.image_uploaded': 'Image uploaded successfully.',
            'toast.server_error': 'A server error occurred.',
            'sa.btn.new_business': '+ New Business',
            'sa.btn.add_user': '+ Add User',
            'sa.search_business_ph': 'Search business...',
            'sa.search_user_ph': 'Search user...',
            'sa.search_log_ph': 'Search logs (action/user/content)...',
            'sa.search_clear': 'Clear',
            'sa.col.name': 'Name',
            'sa.col.type': 'Type',
            'sa.col.location': 'Location',
            'sa.col.owner': 'Owner',
            'sa.col.email': 'Email',
            'sa.col.role': 'Role',
            'sa.col.created': 'Created',
            'sa.col.actions': 'Actions',
            'sa.col.user': 'User',
            'sa.col.action': 'Action',
            'sa.col.affected': 'Affected ID',
            'sa.col.timestamp': 'Timestamp',
            'sa.empty.businesses': 'No businesses yet.',
            'sa.empty.users': 'No users yet.',
            'sa.empty.logs_filter': 'No logs match your filter.',
            'sa.confirm.delete_business': 'Are you sure you want to delete business "{name}"?',
            'sa.confirm.delete_user': 'Are you sure you want to delete user "{name}"?',
            'sa.role.customer': 'Customer',
            'sa.role.staff': 'Staff',
            'sa.role.business_owner': 'Business Owner',
            'sa.role.superadmin': 'Super Admin',
            'sa.tab_log_hint': 'You can use AND, OR, NOT operators (uppercase). Examples: CREATE AND reservation · UPDATE OR DELETE · CREATE NOT service',
            'sa.tab_log_hint_label': 'Hint:',

            // Business Owner
            'bo.menu.dashboard': 'Dashboard',
            'bo.menu.services': 'Services',
            'bo.menu.reservations': 'Reservations',
            'bo.menu.staff': 'Staff',
            'bo.menu.settings': 'Settings',
            'bo.title.dashboard': 'Dashboard',
            'bo.title.services': 'Service Management',
            'bo.title.reservations': 'Reservation Management',
            'bo.title.staff': 'Staff Management',
            'bo.title.settings': 'Business Settings',
            'bo.btn.add_service': '+ New Service',
            'bo.btn.add_staff': '+ Add Staff',
            'bo.empty.services': 'No services yet.',
            'bo.empty.reservations': 'No reservations yet.',
            'bo.empty.staff': 'No staff yet.',
            'bo.col.service': 'Service',
            'bo.col.category': 'Category',
            'bo.col.duration': 'Duration',
            'bo.col.price': 'Price',
            'bo.col.customer': 'Customer',
            'bo.col.date': 'Date',
            'bo.col.status': 'Status',
            'bo.col.contact': 'Contact',
            'bo.col.phone': 'Phone',
            'bo.col.datetime': 'Date/Time',

            // Staff
            'st.menu.dashboard': 'Today',
            'st.menu.reservations': 'Reservations',
            'st.menu.services': 'Services',
            'st.title.dashboard': 'Staff Dashboard',
            'st.title.today': "Today's Appointments",
            'st.no_today': 'No appointments for today.',
            'st.menu.calendar': 'Calendar',
            'st.work_schedule': 'Work Schedule',
            'st.this_week': 'This Week',
            'st.no_reservations_period': 'No reservations for this period.',
            'st.api_error': 'Schedule service not found. Please refresh the page.',
            'st.time_label': 'Time',
            'st.all_reservations': 'All Reservations',
            'common.no_records': 'No records found.',
            'toast.reservation_approved': 'Reservation approved.',
            'toast.reservation_rejected': 'Reservation rejected.',
            'st.services_avail_mgmt': 'Services & Availability Management',
            'st.no_services_for_business': 'No services found for this business.',
            'st.cat.room': 'Room',
            'st.reservation_dates': 'Reservation Dates',
            'st.create_availability': 'Create Availability',
            'st.slots': 'Slots',
            'st.bookable_dates': 'Bookable Dates',

            // Calendar months
            'cal.month.0': 'January', 'cal.month.1': 'February', 'cal.month.2': 'March',
            'cal.month.3': 'April', 'cal.month.4': 'May', 'cal.month.5': 'June',
            'cal.month.6': 'July', 'cal.month.7': 'August', 'cal.month.8': 'September',
            'cal.month.9': 'October', 'cal.month.10': 'November', 'cal.month.11': 'December',
            'search.searching': 'Searching...',
            'search.badge_room': 'ROOM',
            'search.badge_service': 'SVC',
            // Manual reservation
            'mr.title': 'Manual Reservation',
            'mr.customer_name': 'Customer Name',
            'mr.checkin_checkout': 'Check-in / Check-out Dates',
            'mr.dates_hint': 'First click the check-in day, then the check-out day.',
            'mr.create': 'Create Reservation',
            'mr.no_dates_picked': 'No dates selected.',
            // Availability management
            'avail.current_period': 'Current Availability Period',
            'avail.daily': 'Daily Availability',
            'avail.create': 'Create Availability',
            'avail.no_slots_hint': 'No slots found. Use "Create Availability" to generate a 30-day calendar.',
            'mr.no_slots': 'No available slots',
            'biz.continue_book': 'Continue and Book',

            // Language switcher
            'lang.switch': 'Language',
            'lang.tooltip': 'Change language',

            // — auto-added missing keys —
            'filter.all_districts': 'All Districts',
            'filter.all_cities': 'All Cities',
            'filter.searching': 'Searching...',
            'filter.stars': 'Stars',
            'filter.popular_businesses': 'Popular Businesses',
            'filter.businesses_suffix': 'Businesses',
            'day.mon': 'Monday',
            'day.tue': 'Tuesday',
            'day.wed': 'Wednesday',
            'day.thu': 'Thursday',
            'day.fri': 'Friday',
            'day.sat': 'Saturday',
            'day.sun': 'Sunday',
            'day.closed': 'Closed',
            'day.open': 'Open',
            'common.processing': 'Processing...',
            'common.updating': 'Updating...',
            'common.no_selection': 'No selection',
            'common.clear': 'Clear',
            'common.close_selection': 'Close Selection',
            'common.select_range': 'Select Range',
            'svc.not_found_msg': 'Service not found.',
            'svc.try_again': 'Please go back to the homepage and try again.',
            'svc.go_home': 'Go to Homepage',
            'svc.accommodation_label': '🏨 ACCOMMODATION',
            'svc.appointment_label': '📅 APPOINTMENT SERVICE',
            'svc.no_slot_yet': 'No date or time selected yet.',
            'svc.no_slots_for_date': 'No available time slots for this date.',
            'svc.no_appts_for_date': 'No available appointments for this date.',
            'svc.select_time_first': 'Please select a time first.',
            'hotel.selected_room': 'Selected Room',
            'hotel.no_availability': 'No availability yet',
            'hotel.no_open_dates': 'No open dates for reservation yet',
            'slot.existing': 'Existing',
            'slot.past': 'Past',
            'slot.select': 'Select',
            'slot.no_slots_today': 'No slots for this date.',
            'slot.no_dates_in_calendar': 'No dates to show in calendar. Add a date range above.',
            'avail.range_opened': 'Date range opened.',
            'avail.open_range': 'Open Range',
            'avail.calendar_hint_select': 'Select first day, then last day from calendar.',
            'avail.calendar_hint_open': 'Open "Select Range" to add slots.',
            'avail.create_7day': '7-day availability will be created for this service.',
            'booking.special_requests': 'Special requests...',
            'booking.modify_failed': 'Could not open modification',
            'booking.share_experience': 'Share your experience...',
            'status.pending_label': 'Pending',
            'status.approved_label': 'Approved',
            'status.rejected_label': 'Rejected',
            'status.waiting_response': 'Waiting for response',
            'status.cancel_or_reject': 'Cancel/reject',
            'status.approval_rate': 'Approval rate',
            'status.service_label': 'Service',
            'status.active': 'Active',
            'status.none_yet': 'None yet',
            'status.failed_to_load': 'Failed to load data',
            'svc_form.title_edit': 'Edit Service',
            'svc_form.title_new': 'Add New Service',
            'svc_form.name': 'Service Name',
            'svc_form.description': 'Description',
            'svc_form.price': 'Price (₺)',
            'svc_form.price_placeholder': 'E.g., 150.00',
            'svc_form.image_url': 'Image URL',
            'user_form.title': 'Edit User',
            'user_form.business_id_hint': '(for staff/business_owner)',
            'user_form.business_id': 'Business ID',
            'user_form.new_password': 'New Password',
            'user_form.optional': '(can be left empty)',
            'staff_form.title_edit': 'Edit Staff',
            'staff_form.title_new': 'Add New Staff',
            'staff_form.password': 'Password',
            'staff_form.password_repeat': 'Repeat Password',
            'staff.first_reservation': 'Get your first reservation',
            'staff.add_manual': 'add manually',
            'staff.your_reply': 'Your reply:',
            'staff.reply_placeholder': 'Write a reply to the customer...',
            'toast.upload_error': 'Upload error',
            'form.select': 'Select',

            // — extra missing keys —
            'biz.opening_hours': 'Opening Hours',
            'booking.summary': 'Reservation Summary',
            'booking.num_guests': 'Number of Guests',
            'booking.your_note': 'Your Note (optional)',
            'booking.complete': 'Complete Reservation',
            'user_form.full_name': 'Full Name',
            'bo.today_agenda': 'Today\'s Agenda',
            'bo.status_distribution': 'Status Distribution',
            'bo.recent_reservations': 'Recent Reservations',
            'common.see_all': 'See All',
            'bo.quick_start': 'Quick Start',
            'bo.fill_panel': 'Let\'s fill the panel',
            'bo.add_staff': 'Add Staff',
            'bo.edit_services': 'Edit Services',
            'svc_form.cat_hotel': 'Hotel Room',
            'svc_form.cat_appointment': 'Appointment Service',
            'svc_form.room_number': 'Room Number',
            'svc_form.room_type': 'Room Type',

            // — round-3 missing keys —
            'common.start_date': 'Start Date',
            'common.end_date': 'End Date',
            'common.calendar_view': 'Calendar View',
            'user_form.phone': 'Mobile Phone',
            'biz_form.general_info': 'General Information',
            'biz_form.full_address': 'Full Address',
            'staff.send_reply': 'Send Reply',

            // -- amenities & details --
            'biz.view_details': 'View Details',
            'amenities.title': 'Room Amenities',
            'amenities.wifi': 'Free Wi-Fi',
            'amenities.ac': 'Air Conditioning',
            'amenities.breakfast': 'Breakfast Included',
            'amenities.minibar': 'Mini Bar',
            'amenities.tv': 'LCD TV',
            'amenities.bathroom': 'Private Bathroom',
            'amenities.parking': 'Free Parking',
            'amenities.pool': 'Swimming Pool',

            // -- amenities --
            'amenities.daily_cleaning': 'Daily Cleaning',
            'amenities.city_view': 'City View',
            'amenities.living_room': 'Separate Living Room',
            'amenities.premium_bedding': 'Premium Bedding',
            'amenities.bathrobe': 'Bathrobe & Slippers',
            'amenities.welcome_drink': 'Welcome Champagne',
            'amenities.crib': 'Baby Crib',
            'amenities.family_breakfast': 'Family Breakfast',
            'amenities.kids_area': 'Kids Play Area',
            'amenities.butler': 'Private Butler Service',
            'amenities.private_pool': 'Private Pool Access',
            'amenities.spa_voucher': 'Spa Voucher',
            'amenities.airport_transfer': 'Airport Transfer',

            // -- cancellation policy --
            'res.cancel_free': 'Free cancellation (3+ days before).',
            'res.cancel_fee_20': 'Cancellation fee: 20% deduction.',
            'res.cancel_fee_50': 'Same-day cancellation: 50% fee applies.',
            'res.cancel_too_late': 'This reservation cannot be cancelled (past date).',

            // -- breakfast --
            'modal.breakfast_included': 'Breakfast Included',
            'modal.breakfast_extra': '(+15% extra)',
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

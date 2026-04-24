# BETULBOOKING

BETULBOOKING; **otel (konaklama)** ve **randevu (hizmet)** rezervasyonlarını aynı sistemde yöneten hibrit bir platformdur. Frontend vanilla JS, backend Flask + SQLAlchemy.

## Hızlı linkler

- **Seed giriş bilgileri**: `GIRIS_BILGILERI.md`
- **Testler**: `tests/` (pytest)

## Özellikler (özet)

- **Müşteri**
  - İşletme/hizmet keşfi
  - Otel için **giriş/çıkış tarih aralığı** ile rezervasyon
  - Randevu için **gün + saat slotu** ile rezervasyon
  - Rezervasyon iptal/değiştirme (kurallara bağlı)

- **Business Owner / Staff**
  - Hizmet/oda ve slot yönetimi
  - Rezervasyonları **onayla/reddet**
  - Müsaitlik oluşturma: hem otel hem randevu için **takvimden aralık seçerek** “aralığı aç”
  - **Rezerve edilmiş tarih/slot kapatılamaz** (iptal etmeden)

- **Superadmin**
  - İşletmeler / kullanıcılar / loglar
  - Pagination + arama

## Kurulum ve çalıştırma

### Docker

Projede `docker-compose.yml` varsa:

```bash
docker-compose up --build
```

Uygulama: `http://localhost:5000`

## Testler

Testleri Docker içinden çalıştırın:

```bash
docker-compose exec web pytest -q
```

Coverage (opsiyonel):

```bash
docker-compose exec web pytest --cov=app --cov-report=term-missing
```

## Seed / Demo veri

`seed.py` örnek işletme/hizmet/kullanıcılar üretir. Girişler için:

- `GIRIS_BILGILERI.md`

## Güvenlik

BetulBooking, SRS §8 Security gereksinimleri uyarınca aşağıdaki önlemleri uygular:

### Kimlik doğrulama ve şifreleme
- **Parola hashleme:** Tüm parolalar `Flask-Bcrypt` ile hashlenerek saklanır. Düz metin parola veritabanında tutulmaz.
- **JWT (JSON Web Token):** Giriş sonrası kullanıcıya kısa ömürlü JWT verilir; her API isteği `Authorization: Bearer <token>` başlığıyla doğrulanır. Token, kullanıcının `role` claim'ini taşır.
- **Rol tabanlı erişim (RBAC):** Her korumalı endpoint `@jwt_required()` ile kimlik ister; ayrıca yardımcı fonksiyonlar (`_require_superadmin`, `_require_business_owner`, `_require_staff`) rol yetkisini zorlar.

### Girdi doğrulama ve SQL güvenliği
- Tüm kullanıcı girdileri backend'de doğrulanır (tip, uzunluk, zorunluluk).
- ORM (SQLAlchemy) kullanıldığı için SQL enjeksiyonuna karşı tüm sorgular parametrik çalışır.

### CSRF Koruması
- API stateless JWT ile çalıştığı için klasik cookie tabanlı CSRF saldırı yüzeyi bulunmaz. Token `localStorage`'da saklanır, her istekte Authorization başlığı olarak manuel gönderilir — otomatik cookie iletimi yoktur.
- Üçüncü taraf bir sitenin JWT token'ını çalıp kullanabilmesi için aynı origin'de XSS gerekir; uygulama, render sırasında tüm kullanıcı içeriklerini HTML-escape eder.

### HTTPS / SSL (Üretim Ortamı)
Bu repo yerel geliştirme ve Docker testi için yapılandırılmıştır ve `HTTP` ile `localhost:5000` üzerinden çalışır. **Üretim dağıtımında mutlaka HTTPS kullanılmalıdır.** Önerilen yöntemler:

- **Opsiyon A — Nginx reverse proxy + Let's Encrypt (ücretsiz SSL):**
  ```
  Client ──HTTPS──▶ Nginx (443) ──HTTP──▶ Flask (5000)
  ```
  Sertifika otomatik yenileme için `certbot --nginx` kullanılabilir.

- **Opsiyon B — Cloudflare / AWS CloudFront gibi bir CDN önüne almak:**
  SSL terminasyonu CDN üzerinde yapılır, origin sunucuya HTTP geçer.

- **Opsiyon C — Gunicorn + SSL sertifikası:**
  ```bash
  gunicorn --certfile=cert.pem --keyfile=key.pem -b 0.0.0.0:443 run:app
  ```

Üretim dağıtımında ayrıca `SECRET_KEY` ve `JWT_SECRET_KEY` ortam değişkenleri güçlü, rastgele üretilmiş değerlerle değiştirilmelidir.

### Log kayıtları
Tüm CRUD işlemleri `Log` tablosuna kaydedilir: kullanıcı ID, işlem tipi, etkilenen kayıt, zaman damgası. Superadmin panelinden `AND`/`OR`/`NOT` operatörleriyle aranabilir (SRS §5.2.b uyumlu).

## Arama (SRS §5.2 uyumlu)

- **Case-insensitive:** PostgreSQL `ILIKE` ile tüm aramalar büyük/küçük harf duyarsızdır.
- **Mantıksal operatörler:** Süperadmin log arama ekranında `AND`, `OR`, `NOT` desteklenir:
  - `CREATE AND reservation` → her ikisini de içerir
  - `UPDATE OR DELETE` → birini içerir
  - `CREATE NOT service` → CREATE var ama service yok
  - İmplicit AND: `CREATE reservation` = `CREATE AND reservation`
- **Pagination:** Tüm listeleme endpoint'lerinde sayfa başına 20 kayıt (SRS §5.2.d uyumlu).

## Performans

SRS §9.4'e göre 4000 kayıt içerisinden 20 sonuç ≤ 3 saniye içinde dönmelidir. Projede:
- Arama alanları üzerinde PostgreSQL indeks (`name`, `email`, `action`, `timestamp`).
- Paginasyon ile sadece 20 kayıt işlenir.
- Performans doğrulama betiği: `scripts/performance_test.py` (aşağıya bkz.).

```bash
docker-compose exec web python scripts/performance_test.py
```

## Üretim dağıtımı kontrol listesi

- [ ] `.env` dosyasındaki `SECRET_KEY` ve `JWT_SECRET_KEY` güçlü değerlerle değiştirildi
- [ ] `DATABASE_URL` üretim PostgreSQL veritabanına işaret ediyor
- [ ] HTTPS aktif (Nginx + Let's Encrypt veya CDN)
- [ ] `debug=False` (Flask prod modda)
- [ ] Gunicorn veya uwsgi ile WSGI sunucusu kuruldu
- [ ] Mail servisi için SMTP bilgileri `.env`'e eklendi
- [ ] Log rotation yapılandırıldı
- [ ] DB yedeklemesi kuruldu


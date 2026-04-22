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


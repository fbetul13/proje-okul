# Giriş Bilgileri (Seed)

Bu doküman `seed.py` içindeki seed verisine göre hazırlanmıştır.

## Superadmin

- **E-posta**: `superadmin@test.com`
- **Şifre**: `super123`

## İşletme Owner Girişleri (Tüm işletmeler)

Seed sırasında oluşturulan **işletme sırasına** göre owner hesapları:

- **Şablon**
  - **E-posta**: `owner{N}@test.com`
  - **Şifre**: `owner123`
  - **Rol**: `business_owner`

## Staff Girişleri

Seed’de **sadece 5 staff** oluşturuluyor ve sırasıyla **ilk 5 işletmeye** atanıyor.

- **Şablon**
  - **E-posta**: `staff{N}@test.com`
  - **Şifre**: `staff123`
  - **Rol**: `staff`

### Staff → İşletme Eşlemesi (seed sırasına göre)

1) **Marmaris Blue Resort & Spa**
   - **Owner**: `owner1@test.com` / `owner123`
   - **Staff**: `staff1@test.com` / `staff123`

2) **The Bosphorus Palace Hotel**
   - **Owner**: `owner2@test.com` / `owner123`
   - **Staff**: `staff2@test.com` / `staff123`

3) **Antalya Grand Resort**
   - **Owner**: `owner3@test.com` / `owner123`
   - **Staff**: `staff3@test.com` / `staff123`

4) **Makas Premium Kuaför**
   - **Owner**: `owner4@test.com` / `owner123`
   - **Staff**: `staff4@test.com` / `staff123`

5) **Glow Beauty Studio**
   - **Owner**: `owner5@test.com` / `owner123`
   - **Staff**: `staff5@test.com` / `staff123`

6) **Nail Art Stüdyo**
   - **Owner**: `owner6@test.com` / `owner123`
   - **Staff**: —

7) **Zen Spa & Wellness**
   - **Owner**: `owner7@test.com` / `owner123`
   - **Staff**: —

8) **Vita Fizik Tedavi Merkezi**
   - **Owner**: `owner8@test.com` / `owner123`
   - **Staff**: —

9) **Liman Balık Restaurant**
   - **Owner**: `owner9@test.com` / `owner123`
   - **Staff**: —

10) **Köşk Fine Dining**
   - **Owner**: `owner10@test.com` / `owner123`
   - **Staff**: —

11) **PowerZone Fitness**
   - **Owner**: `owner11@test.com` / `owner123`
   - **Staff**: —

12) **Aqua Yüzme Akademisi**
   - **Owner**: `owner12@test.com` / `owner123`
   - **Staff**: —

13) **Başarı Özel Ders Merkezi**
   - **Owner**: `owner13@test.com` / `owner123`
   - **Staff**: —

14) **LingoPlus Dil Okulu**
   - **Owner**: `owner14@test.com` / `owner123`
   - **Staff**: —

15) **CleanPro Temizlik Hizmetleri**
   - **Owner**: `owner15@test.com` / `owner123`
   - **Staff**: —

16) **TeknoFix Teknik Servis**
   - **Owner**: `owner16@test.com` / `owner123`
   - **Staff**: —

17) **Dream Wedding Organizasyon**
   - **Owner**: `owner17@test.com` / `owner123`
   - **Staff**: —

## Notlar

- Test müşterileri:
  - `user1@test.com` … `user100@test.com` şifre: `password123`
  - `useruser@gmail.com` şifre: `password`


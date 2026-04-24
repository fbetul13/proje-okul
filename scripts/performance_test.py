"""
SRS §9.4 uyumlu performans doğrulama betiği.

Gereksinim:
  "When data up to 4000 records are loaded into the system for any topic,
   the system should provide the corresponding 20 records within 3 seconds."

Betik:
  1. 4000 log kaydı oluşturur (veritabanında yoksa)
  2. Çeşitli arama senaryolarını çalıştırır ve süre ölçer
  3. Her senaryo için ≤ 3 saniye kısıtının karşılanıp karşılanmadığını raporlar

Kullanım (Docker içinde):
  docker-compose exec web python scripts/performance_test.py

Örnek çıktı:
  ✅ PASS [0.041s] Basit arama: 'CREATE' → 20 kayıt
  ✅ PASS [0.078s] AND operatörü: 'CREATE AND reservation'
  ✅ PASS [0.053s] OR operatörü:  'CREATE OR UPDATE'
  ✅ PASS [0.094s] NOT operatörü: 'CREATE NOT service'
  ✅ PASS [0.121s] Kombinasyon:   'UPDATE AND user NOT admin'
  ✅ PASS [0.037s] Filtresiz liste: ilk 20 kayıt
  ✅ TÜM TESTLER BAŞARILI (6/6) — SRS §9.4 gereksinimi karşılanıyor.
"""

import sys
import os
import time

# Projenin kök dizinini Python yoluna ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.log import Log
from app.models.user import User
from app.services.log_service import LogService
from datetime import datetime, timedelta
import random


SRS_LIMIT_SECONDS = 3.0
TARGET_RECORDS = 4000
PAGE_SIZE = 20


ACTION_TEMPLATES = [
    "CREATE_RESERVATION",
    "UPDATE_RESERVATION_STATUS: approved",
    "UPDATE_RESERVATION_STATUS: rejected",
    "DELETE_RESERVATION",
    "CREATE_SERVICE",
    "UPDATE_SERVICE",
    "DELETE_SERVICE",
    "CREATE_USER",
    "UPDATE_USER_PROFILE",
    "DELETE_USER",
    "CREATE_BUSINESS",
    "UPDATE_BUSINESS",
    "LOGIN_SUCCESS",
    "LOGIN_FAILED",
    "PASSWORD_RESET_REQUESTED",
    "CREATE_REVIEW: rating=5",
    "UPDATE_REVIEW",
    "ADMIN_ACTION: user blocked",
    "ADMIN_ACTION: service approved",
    "SYSTEM_MAINTENANCE",
]


def seed_logs_if_needed():
    """Eğer 4000 log yoksa, eksik olanı ekler."""
    current = Log.query.count()
    if current >= TARGET_RECORDS:
        print(f"✅ Yeterli log mevcut ({current} kayıt) — seed atlanıyor.\n")
        return current

    needed = TARGET_RECORDS - current
    print(f"ℹ️  Mevcut log: {current}. Hedef: {TARGET_RECORDS}. Ekleniyor: {needed}...")

    # Rasgele bir kullanıcı ID'si seç (varsa)
    user_ids = [u.id for u in User.query.limit(20).all()] or [None]

    batch_size = 500
    base_time = datetime.utcnow() - timedelta(days=365)

    for start in range(0, needed, batch_size):
        batch = []
        for i in range(start, min(start + batch_size, needed)):
            action = random.choice(ACTION_TEMPLATES)
            log = Log(
                user_id=random.choice(user_ids),
                action=action,
                affected_record_id=random.randint(1, 1000),
                timestamp=base_time + timedelta(minutes=i)
            )
            batch.append(log)
        db.session.bulk_save_objects(batch)
        db.session.commit()
        print(f"   ... {start + len(batch)}/{needed} log eklendi")

    total = Log.query.count()
    print(f"✅ Seed tamamlandı. Toplam log: {total}\n")
    return total


def measure(name, func):
    """Bir fonksiyonu çalıştırır ve süre ölçer; sonucu formatlar."""
    t0 = time.perf_counter()
    result = func()
    elapsed = time.perf_counter() - t0
    count = len(result.items) if hasattr(result, 'items') else len(result)
    status = "✅ PASS" if elapsed <= SRS_LIMIT_SECONDS else "❌ FAIL"
    print(f"  {status} [{elapsed:6.3f}s] {name:50s} → {count} kayıt")
    return elapsed <= SRS_LIMIT_SECONDS


def run_tests():
    """Tüm SRS §9.4 test senaryolarını çalıştırır."""
    print("=" * 70)
    print("  BetulBooking — SRS §9.4 Performans Doğrulama")
    print(f"  Limit: ≤ {SRS_LIMIT_SECONDS} sn | Sayfa boyutu: {PAGE_SIZE} kayıt")
    print("=" * 70 + "\n")

    scenarios = [
        ("Basit arama: 'CREATE'",
            lambda: LogService.advanced_search("CREATE", page=1, per_page=PAGE_SIZE)),
        ("AND operatörü: 'CREATE AND reservation'",
            lambda: LogService.advanced_search("CREATE AND reservation", page=1, per_page=PAGE_SIZE)),
        ("OR operatörü: 'CREATE OR UPDATE'",
            lambda: LogService.advanced_search("CREATE OR UPDATE", page=1, per_page=PAGE_SIZE)),
        ("NOT operatörü: 'CREATE NOT service'",
            lambda: LogService.advanced_search("CREATE NOT service", page=1, per_page=PAGE_SIZE)),
        ("Kombinasyon: 'UPDATE AND user NOT admin'",
            lambda: LogService.advanced_search("UPDATE AND user NOT admin", page=1, per_page=PAGE_SIZE)),
        ("Filtresiz liste: ilk 20 kayıt",
            lambda: LogService.get_logs(page=1, per_page=PAGE_SIZE)),
        ("Son sayfa: page=200 (4000 kayıttan)",
            lambda: LogService.get_logs(page=200, per_page=PAGE_SIZE)),
    ]

    results = []
    for name, func in scenarios:
        # JIT warm-up (PostgreSQL query plan cache) için ilk çalıştırma
        try:
            func()
        except Exception:
            pass
        ok = measure(name, func)
        results.append((name, ok))

    print("\n" + "=" * 70)
    passed = sum(1 for _, ok in results if ok)
    total = len(results)
    if passed == total:
        print(f"  ✅ TÜM TESTLER BAŞARILI ({passed}/{total}) — SRS §9.4 gereksinimi karşılanıyor.")
    else:
        print(f"  ⚠️  {passed}/{total} test geçti. Başarısız olanlar:")
        for name, ok in results:
            if not ok:
                print(f"     - {name}")
    print("=" * 70)
    return passed == total


def main():
    app = create_app()
    with app.app_context():
        seed_logs_if_needed()
        success = run_tests()
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

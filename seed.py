import os
import json
from app import create_app, db
from app.models.user import User
from app.models.service import Service
from app.models.timeslot import TimeSlot
from app.models.log import Log
from app.models.business import Business
from app.models.reservation import Reservation
from app.models.review import Review
from app.models.location import Il, Ilce
from datetime import datetime, timedelta
import random

def _seed_populate():
    """Populates sample data; does not drop_all (tables must be ready)."""
    print("Seeding database...")

    # 0. Seed Il/Ilce data from JSON files (Turkish provinces — official names, kept as-is)
    print("Loading province/district data...")
    base_path = os.path.join(os.path.dirname(__file__), 'app', 'static', 'data')
    
    with open(os.path.join(base_path, 'il.json'), 'r', encoding='utf-8') as f:
        il_data = json.load(f)
    with open(os.path.join(base_path, 'ilce.json'), 'r', encoding='utf-8') as f:
        ilce_data = json.load(f)
    
    for il in il_data[2]["data"]:
        db.session.add(Il(id=int(il["id"]), name=il["name"]))
    db.session.commit()
    
    for ilce in ilce_data[2]["data"]:
        db.session.add(Ilce(id=int(ilce["id"]), il_id=int(ilce["il_id"]), name=ilce["name"]))
    db.session.commit()
    print(f"Loaded {Il.query.count()} provinces and {Ilce.query.count()} districts.")

    # 1. Create SuperAdmin
    superadmin = User(name="Platform Admin", email="superadmin@test.com", role="superadmin")
    superadmin.set_password("super123")
    db.session.add(superadmin)
    db.session.commit()

    # 2. Create Customers
    print("Creating 100 customers...")
    users = []
    for i in range(1, 101):
        u = User(name=f"Customer {i}", email=f"user{i}@test.com", role="customer")
        u.set_password("password123")
        users.append(u)
        db.session.add(u)
    db.session.commit()

    u_named = User(name="User User", email="useruser@gmail.com", role="customer")
    u_named.set_password("password")
    db.session.add(u_named)
    db.session.commit()

    # 3. Create Businesses
    konaklama_businesses = [
        Business(
            name="Marmaris Blue Resort & Spa", 
            type="konaklama", 
            description="A 5-star luxury holiday experience overlooking the turquoise waters of the Aegean. Private beach, outdoor pool and spa center.", 
            address="Uzunyali Street No:45", 
            il="MUĞLA", ilce="MARMARİS",
            phone="0252 412 00 00",
            image_url="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"
        ),
        Business(
            name="The Bosphorus Palace Hotel", 
            type="konaklama", 
            description="Boutique hotel with Bosphorus view in the historic peninsula. A meeting of Ottoman architecture and modern comfort.", 
            address="Cihangir District, Bogaz Street No:12", 
            il="İSTANBUL", ilce="BEYoĞLU",
            phone="0212 243 00 00",
            image_url="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800"
        ),
        Business(
            name="Antalya Grand Resort", 
            type="konaklama", 
            description="All-inclusive holiday at Lara, the pearl of the Mediterranean. Aquapark, kids' club and evening entertainment.", 
            address="Lara Tourism Center", 
            il="ANTALYA", ilce="MURATPAŞA",
            phone="0242 310 00 00",
            image_url="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800"
        )
    ]
    
    guzellik_businesses = [
        Business(
            name="Scissors Premium Hair Salon", 
            type="guzellik", 
            description="The most prestigious hair salon in Nisantasi. Specialist in haircuts, coloring, keratin care and bridal hair.", 
            address="Tesvikiye Avenue No:78", 
            il="İSTANBUL", ilce="ŞİŞLİ",
            phone="0212 234 56 78",
            image_url="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800"
        ),
        Business(
            name="Glow Beauty Studio", 
            type="guzellik", 
            description="Skin care, permanent makeup and beauty specialist. Hydrafacial and medical aesthetics.", 
            address="Bagdat Avenue No:234", 
            il="İSTANBUL", ilce="KADIKÖY",
            phone="0216 345 67 89",
            image_url="https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=800"
        ),
        Business(
            name="Nail Art Studio", 
            type="guzellik", 
            description="Professional manicure and nail art services. Artificial nails and gel applications.", 
            address="Tunali Hilmi Avenue No:56", 
            il="ANKARA", ilce="ÇANKAYA",
            phone="0312 456 78 90",
            image_url="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800"
        )
    ]
    
    saglik_businesses = [
        Business(
            name="Zen Spa & Wellness", 
            type="saglik", 
            description="Escape the city stress. Massage therapy, Turkish bath, sauna and aromatherapy services.", 
            address="Bebek District, Coast Road No:89", 
            il="İSTANBUL", ilce="BEŞİKTAŞ",
            phone="0212 287 00 00",
            image_url="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800"
        ),
        Business(
            name="Vita Physical Therapy Center", 
            type="saglik", 
            description="Rehabilitation, manual therapy and sports medicine services with expert physiotherapists.", 
            address="Kizilay District, Saglik Street No:15", 
            il="ANKARA", ilce="ÇANKAYA",
            phone="0312 425 00 00",
            image_url="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800"
        )
    ]
    
    yeme_icme_businesses = [
        Business(
            name="Harbor Seafood Restaurant", 
            type="yeme-icme", 
            description="Fresh seafood with Bosphorus view. Daily fish selection and appetizers.", 
            address="Arnavutkoy Coast No:23", 
            il="İSTANBUL", ilce="BEŞİKTAŞ",
            phone="0212 265 00 00",
            image_url="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"
        ),
        Business(
            name="Mansion Fine Dining", 
            type="yeme-icme", 
            description="Modern Turkish cuisine by award-winning chefs. Ideal venue for special celebrations.", 
            address="Nisantasi Abdi Ipekci Avenue No:40", 
            il="İSTANBUL", ilce="ŞİŞLİ",
            phone="0212 230 00 00",
            image_url="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800"
        )
    ]
    
    spor_businesses = [
        Business(
            name="PowerZone Fitness", 
            type="spor", 
            description="Fully-equipped gym. Personal trainer, group classes and nutrition counseling.", 
            address="Levent District, Spor Avenue No:100", 
            il="İSTANBUL", ilce="BEŞİKTAŞ",
            phone="0212 280 00 00",
            image_url="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800"
        ),
        Business(
            name="Aqua Swimming Academy", 
            type="spor", 
            description="Swimming lessons for all ages. Semi-Olympic pool, baby swimming and competition prep.", 
            address="Atasehir Boulevard No:50", 
            il="İSTANBUL", ilce="ATAŞEHİR",
            phone="0216 455 00 00",
            image_url="https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&q=80&w=800"
        )
    ]
    
    egitim_businesses = [
        Business(
            name="Success Private Tutoring Center", 
            type="egitim", 
            description="One-on-one private lessons for primary, middle and high school students. University and high-school entrance exam prep.", 
            address="Kizilay District, Egitim Street No:25", 
            il="ANKARA", ilce="ÇANKAYA",
            phone="0312 430 00 00",
            image_url="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800"
        ),
        Business(
            name="LingoPlus Language School", 
            type="egitim", 
            description="English, German, Spanish courses. IELTS, TOEFL prep and corporate training.", 
            address="Alsancak Kibris Sehitleri Avenue No:80", 
            il="İZMİR", ilce="KONAK",
            phone="0232 465 00 00",
            image_url="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800"
        )
    ]
    
    hizmet_businesses = [
        Business(
            name="CleanPro Cleaning Services", 
            type="hizmet", 
            description="Home and office cleaning, post-construction cleaning, sofa wash and disinfection.", 
            address="Umraniye Industrial District No:30", 
            il="İSTANBUL", ilce="ÜMRANİYE",
            phone="0216 600 00 00",
            image_url="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800"
        ),
        Business(
            name="TeknoFix Technical Service", 
            type="hizmet", 
            description="Appliance, A/C and boiler repair. 24/7 emergency service, on-site repair guarantee.", 
            address="Kadikoy Moda Avenue No:120", 
            il="İSTANBUL", ilce="KADIKÖY",
            phone="0216 340 00 00",
            image_url="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800"
        )
    ]
    
    etkinlik_businesses = [
        Business(
            name="Dream Wedding Organization", 
            type="etkinlik", 
            description="The wedding organization of your dreams. Venue selection, catering, decoration and DJ service.", 
            address="Maslak District, Plaza Street No:5", 
            il="İSTANBUL", ilce="SARIYER",
            phone="0212 345 00 00",
            image_url="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800"
        )
    ]
    
    hotels = konaklama_businesses
    all_businesses = konaklama_businesses + guzellik_businesses + saglik_businesses + yeme_icme_businesses + spor_businesses + egitim_businesses + hizmet_businesses + etkinlik_businesses
    for b in all_businesses:
        db.session.add(b)
    db.session.commit()

    # 4. Create Business Owners for each business
    print("Creating business owners...")
    owner_names = ["Kemal Ozturk", "Fatma Yildiz", "Ibrahim Aksoy", "Ayse Koc", "Mustafa Sen"]
    for i, biz in enumerate(all_businesses):
        owner = User(
            name=owner_names[i] if i < len(owner_names) else f"Business Owner {i+1}",
            email=f"owner{i+1}@test.com",
            role="business_owner",
            business_id=biz.id
        )
        owner.set_password("owner123")
        db.session.add(owner)
        biz.owner_id = owner.id
    db.session.commit()

    # 5. Create Staff Users (assigned to businesses)
    print("Creating staff users...")
    staff_names = ["Ahmet Yilmaz", "Elif Kaya", "Mehmet Demir", "Zeynep Sahin", "Ali Celik"]
    staff_users = []
    for i, name in enumerate(staff_names):
        biz = all_businesses[i % len(all_businesses)]
        s = User(name=name, email=f"staff{i+1}@test.com", role="staff", business_id=biz.id)
        s.set_password("staff123")
        staff_users.append(s)
        db.session.add(s)
    db.session.commit()

    # 6. Create Services
    print("Creating hotel rooms and appointment services...")
    
    appointment_services = []
    
    # Hotel Rooms with different images
    room_images = [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=600"
    ]
    room_types = [
        ("Standard Room", "City view, double bed, minibar and LCD TV.", 850),
        ("Deluxe Room", "Spacious balcony, king-size bed, jacuzzi and seating area.", 1400),
        ("Family Room", "2 separate bedrooms, kids' corner and kitchen.", 1800),
        ("Suite Room", "Panoramic view, private lounge and butler service.", 2800),
        ("Presidential Suite", "Top floor, private terrace, jacuzzi and VIP services.", 4500)
    ]
    
    for hotel in hotels:
        for i, (room_name, room_desc, base_price) in enumerate(room_types):
            for room_num in range(1, 4):  # 3 rooms of each type
                s = Service(
                    business_id=hotel.id,
                    name=f"{room_name}",
                    description=room_desc,
                    category="hotel",
                    room_number=f"{(i+1)*100 + room_num}",
                    room_type=room_name.split()[0],
                    price=base_price + random.randint(-100, 200),
                    image_url=room_images[i]
                )
                db.session.add(s)

    # Hair Salon Services (first beauty business)
    kuafor_services = [
        ("Women's Haircut", "Professional haircut and styling.", 45, 200, "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600"),
        ("Men's Haircut", "Modern men's haircut and beard trim.", 30, 120, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600"),
        ("Hair Coloring", "Professional hair coloring, ombre and balayage.", 90, 450, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600"),
        ("Keratin Treatment", "Hair straightening and keratin therapy.", 120, 800, "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=600"),
        ("Bridal Hair", "Special-occasion hair design and makeup.", 180, 1500, "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=600"),
        ("Blow-Dry & Curling", "Daily blow-dry or curling iron application.", 30, 150, "https://images.unsplash.com/photo-1522337094846-8a818192de1f?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in kuafor_services:
        s = Service(business_id=guzellik_businesses[0].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Beauty Studio Services (second beauty business)
    beauty_services = [
        ("Skin Care", "Deep cleansing, peeling and moisturizing.", 60, 350, "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600"),
        ("HydraFacial", "Medical skin renewal and hydration.", 45, 600, "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=600"),
        ("Permanent Makeup", "Brow contouring, lip and eyeliner.", 90, 1200, "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&q=80&w=600"),
        ("Professional Makeup", "Special-occasion and bridal makeup.", 60, 500, "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in beauty_services:
        s = Service(business_id=guzellik_businesses[1].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Nail Art Services (third beauty business)
    nail_services = [
        ("Manicure", "Classic hand care and nail polish application.", 30, 120, "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=600"),
        ("Gel Nails", "Permanent gel application and nail art.", 60, 250, "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&q=80&w=600"),
        ("Acrylic Nails", "Acrylic and artificial nail extensions.", 90, 400, "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in nail_services:
        s = Service(business_id=guzellik_businesses[2].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Spa & Wellness Services
    spa_services = [
        ("Swedish Massage", "Relaxing full-body massage.", 60, 450, "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600"),
        ("Hot Stone Therapy", "Deep-tissue massage with hot stones.", 75, 550, "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=600"),
        ("Aromatherapy", "Therapy with essential oils.", 60, 400, "https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&q=80&w=600"),
        ("Turkish Bath", "Traditional bath and foam massage.", 90, 350, "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600"),
        ("Balinese Massage", "Far-East-inspired massage.", 90, 600, "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in spa_services:
        s = Service(business_id=saglik_businesses[0].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Physical Therapy Services
    fizik_services = [
        ("Manual Therapy", "Hands-on joint and muscle treatment.", 45, 400, "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600"),
        ("Electrotherapy", "Pain-relief electrical therapy.", 30, 250, "https://images.unsplash.com/photo-1580281657527-47f249e8f00f?auto=format&fit=crop&q=80&w=600"),
        ("Rehabilitation", "Post-surgery recovery program.", 60, 500, "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in fizik_services:
        s = Service(business_id=saglik_businesses[1].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Restaurant Services
    for rest in yeme_icme_businesses:
        restoran_services = [
            ("Table for 2", "Ideal for a romantic dinner.", 120, 0, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600"),
            ("Table for 4", "For family and friend groups.", 120, 0, "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600"),
            ("VIP Room", "For private meetings and celebrations.", 180, 500, "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&q=80&w=600"),
        ]
        for name, desc, dur, price, img in restoran_services:
            s = Service(business_id=rest.id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
            db.session.add(s)
            appointment_services.append(s)

    # Gym Services
    fitness_services = [
        ("Personal Training", "One-on-one fitness coaching.", 60, 350, "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=600"),
        ("Pilates", "Group pilates class.", 50, 150, "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600"),
        ("Yoga", "Morning yoga session.", 60, 120, "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600"),
        ("CrossFit", "High-intensity workout.", 45, 180, "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in fitness_services:
        s = Service(business_id=spor_businesses[0].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Swimming Academy Services
    yuzme_services = [
        ("Adult Swimming Course", "Beginner-level swimming lessons.", 45, 200, "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&q=80&w=600"),
        ("Kids Swimming Course", "Swimming lessons for ages 4-12.", 45, 180, "https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&q=80&w=600"),
        ("Baby Swimming", "Parent-accompanied swimming for ages 0-3.", 30, 250, "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in yuzme_services:
        s = Service(business_id=spor_businesses[1].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Education Services - Tutoring
    ozel_ders_services = [
        ("Math Private Lesson", "One-on-one math tutoring.", 60, 300, "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&q=80&w=600"),
        ("Physics Private Lesson", "One-on-one physics tutoring.", 60, 300, "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600"),
        ("University Exam Prep", "University entrance exam preparation program.", 90, 400, "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in ozel_ders_services:
        s = Service(business_id=egitim_businesses[0].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Language School Services
    dil_services = [
        ("English Course", "A1-C2 level English lessons.", 60, 250, "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600"),
        ("IELTS Preparation", "IELTS exam preparation program.", 90, 400, "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600"),
        ("Business English", "Business English training.", 60, 350, "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in dil_services:
        s = Service(business_id=egitim_businesses[1].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Cleaning Services
    temizlik_services = [
        ("Home Cleaning", "Detailed home cleaning.", 180, 500, "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600"),
        ("Office Cleaning", "Workplace cleaning.", 120, 400, "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=600"),
        ("Sofa Wash", "Deep sofa and carpet cleaning.", 90, 300, "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in temizlik_services:
        s = Service(business_id=hizmet_businesses[0].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Technical Service
    teknik_services = [
        ("A/C Maintenance", "A/C cleaning and gas refill.", 60, 350, "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600"),
        ("Boiler Maintenance", "Annual boiler maintenance and tuning.", 45, 300, "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=600"),
        ("Appliance Repair", "Washing machine, dishwasher repair.", 60, 250, "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in teknik_services:
        s = Service(business_id=hizmet_businesses[1].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)

    # Event Organization Services
    org_services = [
        ("Wedding Organization", "End-to-end wedding planning.", 120, 5000, "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600"),
        ("Engagement Organization", "Engagement venue and decoration.", 90, 2500, "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=600"),
        ("Birthday Party", "Children's and adult parties.", 60, 1500, "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600"),
    ]
    for name, desc, dur, price, img in org_services:
        s = Service(business_id=etkinlik_businesses[0].id, name=name, description=desc, duration=dur, category="appointment", price=price, image_url=img)
        db.session.add(s)
        appointment_services.append(s)
    
    db.session.commit()

    # 7. Create TimeSlots
    print("Generating slots...")
    start_date = datetime.now()

    # Hotel rooms: daily slots (90 days - 3 months)
    hotel_rooms = Service.query.filter_by(category='hotel').all()
    for room in hotel_rooms:
        for d in range(90):
            date = start_date + timedelta(days=d)
            ts = TimeSlot(
                service_id=room.id,
                date=date.date(),
                start_time=datetime.strptime("00:00", "%H:%M").time(),
                end_time=datetime.strptime("23:59", "%H:%M").time(),
                is_available=True
            )
            db.session.add(ts)

    # Appointment services: hourly slots (10 days)
    for svc in appointment_services:
        for d in range(10):
            date = start_date + timedelta(days=d)
            for hour in range(9, 17):
                ts = TimeSlot(
                    service_id=svc.id,
                    date=date.date(),
                    start_time=datetime.strptime(f"{hour}:00", "%H:%M").time(),
                    end_time=datetime.strptime(f"{hour}:59", "%H:%M").time(),
                    is_available=True
                )
                db.session.add(ts)
    db.session.commit()

    # 7b. Generate sample reservations and reviews
    print("Generating reservations and reviews...", flush=True)
    try:
        all_appointment_services = Service.query.filter_by(category='appointment').all()
        all_users_list = User.query.filter_by(role='customer').all()
        
        sample_comments = [
            "Wonderful experience, I definitely recommend it.",
            "Service quality exceeded my expectations.",
            "Staff was very attentive and professional.",
            "Excellent value for money.",
            "I will definitely choose this place again.",
            "An average experience, room for improvement.",
            "Pretty good, I left satisfied.",
        ]
        
        review_count = 0
        for svc in all_appointment_services[:5]:
            slots = TimeSlot.query.filter_by(service_id=svc.id, is_available=True).limit(3).all()
            for slot in slots:
                user = random.choice(all_users_list)
                res = Reservation(
                    user_id=user.id, service_id=svc.id,
                    reservation_type='appointment', time_slot_id=slot.id,
                    status='approved', note=None
                )
                slot.is_available = False
                db.session.add(res)
                db.session.flush()
                
                review = Review(
                    reservation_id=res.id, user_id=user.id, service_id=svc.id,
                    rating=random.randint(3, 5),
                    comment=random.choice(sample_comments),
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
                )
                db.session.add(review)
                review_count += 1
        
        db.session.commit()
        print(f"{review_count} sample reviews created.", flush=True)
    except Exception as e:
        db.session.rollback()
        print(f"Review creation error (skipped): {e}", flush=True)

    # 8. Generate Logs
    print("Generating logs...")
    actions = ["REGISTER", "LOGIN", "CREATE_RESERVATION", "UPDATE_SERVICE", "CANCEL_RESERVATION", "DELETE_SERVICE"]
    for i in range(1000):
        l = Log(
            user_id=random.choice([superadmin.id] + [u.id for u in users]),
            action=random.choice(actions),
            affected_record_id=random.randint(1, 100),
            timestamp=datetime.now() - timedelta(minutes=random.randint(0, 10000))
        )
        db.session.add(l)
    db.session.commit()

    print(f"Restoration complete!")


def seed():
    """Drops all tables and reloads sample data from scratch (manual: python seed.py)."""
    print("Clearing database...")
    db.drop_all()
    db.create_all()
    _seed_populate()


def seed_if_empty():
    """
    If no users exist, loads sample data; otherwise leaves DB untouched.
    For Docker init / first install: python seed.py --if-empty
    """
    from app.utils.db_schema import ensure_user_profile_columns

    db.create_all()
    ensure_user_profile_columns(db.engine)
    if User.query.count() > 0:
        print("Database already has records, skipping seed.", flush=True)
        return
    print("Empty database detected, loading sample data...", flush=True)
    _seed_populate()


if __name__ == "__main__":
    import sys

    app = create_app()
    with app.app_context():
        if len(sys.argv) > 1 and sys.argv[1] == "--if-empty":
            seed_if_empty()
        else:
            seed()

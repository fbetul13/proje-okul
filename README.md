# BetulBooking

> **A multi-vertical online reservation platform with AI assistance**

BetulBooking is a hybrid reservation system that supports both **hotel bookings** (date-range based) and **appointment services** (time-slot based) under a single platform. Built as a graduation project at Istanbul Okan University, it integrates a working AI copilot, real Stripe payments, automatic refunds, and a tiered cancellation policy.

![Stack](https://img.shields.io/badge/backend-Flask%203.0-blue) ![Stack](https://img.shields.io/badge/db-PostgreSQL%2015-blue) ![Stack](https://img.shields.io/badge/ai-Llama%203.3%2070B-orange) ![Stack](https://img.shields.io/badge/payment-Stripe-purple) ![Container](https://img.shields.io/badge/container-Docker-blue)

---

## ✨ Features

### 🤖 AI Copilot
- Powered by **Groq Llama 3.3 70B** with native tool calling
- 8 distinct tools: business search, availability check, my reservations, business reviews, statistics, and more
- Bilingual conversation (Turkish & English)
- Retry mechanism for tool-call edge cases

### 💳 Payments & Refunds
- Real **Stripe Checkout** integration (test mode, Turkish Lira)
- Automatic **partial/full refunds** when reservations are cancelled
- Payment status tracking on each reservation

### 📅 Reservations
- **Hotel bookings**: date-range with overlap prevention
- **Appointment bookings**: time-slot based
- **Tiered cancellation policy**: 3+ days free / 1-2 days 20% fee / same-day 50% fee
- **Room capacity & extra-guest fees** (Standard 2, Suite 3, Family/Presidential 4)
- **Optional breakfast** (+15%) — Booking.com-style add-on
- **Price locking**: total computed at booking, persisted on the row

### 🌐 User Experience
- Full **Turkish/English internationalization** (600+ translation keys)
- **Dark mode** with system-preference detection
- **Bilingual HTML email notifications** when reservations change status
- Tier-based **room amenities** display (Standard 5 → Presidential 17 items)
- Mobile-responsive booking modals

### 🛡️ User Roles
- **Customer**: browse, reserve, pay, cancel, review
- **Business Owner**: manage services, approve/reject reservations, view stats
- **Staff**: assist business owners with day-to-day operations
- **Super Admin**: system-wide oversight, activity logs

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, Flask 3.0.3, SQLAlchemy, Flask-JWT-Extended |
| Database | PostgreSQL 15 |
| Frontend | Vanilla JavaScript, plain CSS with custom properties |
| AI | Groq Cloud API + Llama 3.3 70B Versatile |
| Payments | Stripe (Checkout Sessions, Refunds API) |
| Email | Gmail SMTP with bilingual HTML templates |
| Container | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- A copy of `.env` file at the project root with the required keys

### Run

```bash
git clone https://github.com/fbetul13/proje-okul.git
cd proje-okul
docker-compose up
```

Visit **http://localhost:15000** in your browser.

The first startup runs seed data, so a demo dataset (businesses, users, services) is automatically created. Default credentials are in `GIRIS_BILGILERI.md`.

---

## 🔑 Demo Credentials

See `GIRIS_BILGILERI.md` for the full list. Quick test:

- **Customer**: `[username from seed]` 
- **Business Owner**: `[username from seed]`
- **Super Admin**: `[username from seed]`

For Stripe payment testing, use card `4242 4242 4242 4242` with any future expiry and any CVC.

---

## 📁 Project Structure

```
okulproje/
├── app/
│   ├── models/              # SQLAlchemy models (User, Business, Service, Reservation)
│   ├── routes/              # Flask blueprints (customer, business, admin, auth)
│   ├── services/            # Business logic (reservation, payment, copilot, email)
│   ├── static/
│   │   ├── js/              # Vanilla JS: app.js, copilot.js, i18n.js, dark-mode.js
│   │   └── css/             # Styles + dark mode
│   └── templates/           # Email templates
├── tests/                   # pytest test suite
├── docker-compose.yml
├── Dockerfile
├── seed.py                  # Demo data
└── requirements.txt
```

---

## 🎯 Architectural Highlights

### Price Locking
When a reservation is created, the total price is computed (base × nights + extra-guest fee + breakfast multiplier) and stored on the row. The Stripe Checkout session reads this stored value rather than recomputing live, so a customer who booked at 1000 TL/night always pays 1000 TL/night even if the room rate later changes.

### Tiered Cancellation
Cancellation penalty is determined by how many days remain until check-in:
- **3+ days before** → free cancellation, 100% refund
- **1-2 days** → 20% penalty, 80% refund
- **Same day** → 50% penalty, 50% refund

When a paid reservation is cancelled, the system automatically issues a Stripe refund for the appropriate partial amount.

### AI Copilot Tool Calling
The copilot is implemented as a thin layer over `groq` SDK with structured tool definitions. Eight tools route into the same service-layer functions used by the rest of the application, so AI-driven actions and human-driven actions stay consistent. A retry mechanism handles cases where Llama occasionally emits a function call as text instead of using the structured format.

### Bilingual Email
When a reservation status changes (approved/rejected/etc.), the email service renders a gold-themed HTML email in the customer's preferred language (TR or EN), stored as a tag in the reservation note.

---

## 🧪 Testing

```bash
docker exec okulproje-web-1 pytest tests/ -v
```

Tests cover reservation creation, capacity logic, cancellation penalties, and payment amount calculation.

---

## 🎓 Academic Context

This project was developed as the graduation project for the Department of Software Engineering at İstanbul Okan University, under the supervision of **Asst. Prof. Dr. Emel Koç**.

- **Student**: Fatıma Betül Eroğlu (220218318)
- **Department**: Software Engineering
- **Year**: 2026

---

## 📜 License

This project is licensed for academic purposes. For other use cases please contact the author.

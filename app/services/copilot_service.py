"""
Copilot Service — AI Assistant powered by Groq (Llama 3.3)
OpenAI-compatible API. Function calling for DB tool use.
"""
import os
import json
import logging
from datetime import datetime, date
from urllib import request as urlrequest, parse as urlparse, error as urlerror

from app import db
from app.models.business import Business
from app.models.service import Service
from app.models.reservation import Reservation
from app.models.review import Review
from app.models.user import User
from app.models.timeslot import TimeSlot
from sqlalchemy import or_, and_, func

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _groq_post(payload, timeout=30):
    """POST to Groq API using urllib (OpenAI-compatible chat completions)."""
    body = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(
        GROQ_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY or ''}",
            "User-Agent": "Mozilla/5.0 (BetulBooking/1.0) Python-urllib",
            "Accept": "application/json",
        }
    )
    try:
        with urlrequest.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return resp.status, data, None
    except urlerror.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8")
        except Exception:
            err_body = str(e)
        logger.error("Groq HTTP %s: %s", e.code, err_body[:500])
        return e.code, None, err_body
    except urlerror.URLError as e:
        logger.exception("Groq URLError")
        return 0, None, str(e.reason)
    except Exception as e:
        logger.exception("Groq request failed")
        return 0, None, str(e)


# ──────────────────────────────────────────────────────────────────────────
# TOOL DEFINITIONS — OpenAI/Groq schema
# ──────────────────────────────────────────────────────────────────────────

CUSTOMER_TOOLS = [
    {"type": "function", "function": {
        "name": "search_businesses",
        "description": "Search for businesses by keyword, city, district, or category. Returns matching businesses.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search keyword"},
                "city": {"type": "string", "description": "City name"},
                "district": {"type": "string", "description": "District name"},
                "category": {
                    "type": "string",
                    "enum": ["konaklama", "yeme-icme", "guzellik", "saglik", "spor", "etkinlik", "hizmet", "egitim"]
                }
            }
        }
    }},
    {"type": "function", "function": {
        "name": "get_business_details",
        "description": "Get detailed information about a specific business including services and rating.",
        "parameters": {
            "type": "object",
            "properties": {
                "business_id": {"type": "string", "description": "ID of the business as string"}
            },
            "required": ["business_id"]
        }
    }},
    {"type": "function", "function": {
        "name": "check_room_availability",
        "description": "Check available rooms in a hotel for given check-in and check-out dates.",
        "parameters": {
            "type": "object",
            "properties": {
                "business_id": {"type": "string"},
                "check_in": {"type": "string", "description": "YYYY-MM-DD"},
                "check_out": {"type": "string", "description": "YYYY-MM-DD"}
            },
            "required": ["business_id", "check_in", "check_out"]
        }
    }},
    {"type": "function", "function": {
        "name": "get_my_reservations",
        "description": "Get all reservations of the currently logged-in user.",
        "parameters": {"type": "object", "properties": {}}
    }},
    {"type": "function", "function": {
        "name": "get_business_reviews",
        "description": "Get customer reviews and ratings for a business.",
        "parameters": {
            "type": "object",
            "properties": {
                "business_id": {"type": "string"},
                "limit": {"type": "integer", "description": "default 5"}
            },
            "required": ["business_id"]
        }
    }}
]

BO_TOOLS = [
    {"type": "function", "function": {
        "name": "get_business_stats",
        "description": "Get statistics for the BO's own business.",
        "parameters": {
            "type": "object",
            "properties": {
                "days": {"type": "integer", "description": "Last N days, default 30"}
            }
        }
    }},
    {"type": "function", "function": {
        "name": "get_pending_reservations",
        "description": "Get all pending (not yet approved) reservations for the BO's business.",
        "parameters": {"type": "object", "properties": {}}
    }},
    {"type": "function", "function": {
        "name": "get_top_services",
        "description": "Get the most-reserved services in the BO's business.",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "default 5"}
            }
        }
    }}
]


# ──────────────────────────────────────────────────────────────────────────
# TOOL IMPLEMENTATIONS
# ──────────────────────────────────────────────────────────────────────────

def _fmt_business(b):
    return {
        "id": b.id, "name": b.name, "type": b.type,
        "city": b.il, "district": b.ilce,
        "address": b.address,
        "description": (b.description or "")[:200],
    }


def tool_search_businesses(query=None, city=None, district=None, category=None):
    q = Business.query
    if category:
        q = q.filter(Business.type == category)
    if city:
        q = q.filter(Business.il.ilike(f"%{city}%"))
    if district:
        q = q.filter(Business.ilce.ilike(f"%{district}%"))
    if query:
        like = f"%{query}%"
        q = q.filter(or_(Business.name.ilike(like), Business.description.ilike(like)))
    results = q.limit(10).all()
    return {"count": len(results), "businesses": [_fmt_business(b) for b in results]}


def tool_get_business_details(business_id):
    if isinstance(business_id, str):
        if business_id.isdigit():
            business_id = int(business_id)
        else:
            biz = Business.query.filter(Business.name.ilike(f"%{business_id}%")).first()
            if biz:
                business_id = biz.id
            else:
                return {"error": f"Business '{business_id}' not found."}
    b = Business.query.get(business_id)
    if not b:
        return {"error": f"Business with id={business_id} not found."}

    services = Service.query.filter_by(business_id=business_id).all()
    avg_rating = db.session.query(func.avg(Review.rating)) \
        .join(Service, Review.service_id == Service.id) \
        .filter(Service.business_id == business_id).scalar()

    return {
        **_fmt_business(b),
        "phone": b.phone,
        "image_url": b.image_url,
        "services_count": len(services),
        "services": [
            {"id": s.id, "name": s.name, "category": s.category,
             "price": float(s.price) if s.price else None,
             "room_type": s.room_type, "duration": s.duration}
            for s in services[:20]
        ],
        "average_rating": round(float(avg_rating), 2) if avg_rating else None
    }


def tool_check_room_availability(business_id, check_in, check_out):
    # AI sometimes passes business name instead of ID — try to resolve it
    if isinstance(business_id, str):
        if business_id.isdigit():
            business_id = int(business_id)
        else:
            # Try to find business by name
            biz = Business.query.filter(Business.name.ilike(f"%{business_id}%")).first()
            if biz:
                business_id = biz.id
            else:
                return {"error": f"Business '{business_id}' not found. Please use search_businesses first to find the business ID."}
    try:
        ci = datetime.strptime(check_in, "%Y-%m-%d").date()
        co = datetime.strptime(check_out, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Date format must be YYYY-MM-DD"}

    if co <= ci:
        return {"error": "Check-out must be after check-in"}

    b = Business.query.get(business_id)
    if not b:
        return {"error": f"Business {business_id} not found"}

    rooms = Service.query.filter_by(business_id=business_id, category="hotel").all()
    available = []
    for room in rooms:
        conflict = Reservation.query.filter(
            Reservation.service_id == room.id,
            Reservation.status.in_(["pending", "approved"]),
            Reservation.check_in_date < co,
            Reservation.check_out_date > ci
        ).first()
        if not conflict:
            available.append({
                "id": room.id, "name": room.name,
                "room_type": room.room_type, "room_number": room.room_number,
                "price_per_night": float(room.price) if room.price else None
            })

    return {
        "business_id": business_id,
        "business_name": b.name,
        "check_in": check_in, "check_out": check_out,
        "available_rooms_count": len(available),
        "available_rooms": available[:10]
    }


def tool_get_my_reservations(user_id):
    if not user_id:
        return {"error": "User must be logged in to view their reservations."}

    reservations = Reservation.query.filter_by(user_id=user_id) \
        .order_by(Reservation.id.desc()).limit(20).all()

    result = []
    for r in reservations:
        svc = Service.query.get(r.service_id)
        biz = Business.query.get(svc.business_id) if svc else None
        result.append({
            "id": r.id,
            "service": svc.name if svc else "Unknown",
            "business": biz.name if biz else "Unknown",
            "status": r.status, "type": r.reservation_type,
            "check_in": r.check_in_date.isoformat() if r.check_in_date else None,
            "check_out": r.check_out_date.isoformat() if r.check_out_date else None,
        })

    return {"count": len(result), "reservations": result}


def tool_get_business_reviews(business_id, limit=5):
    reviews = Review.query.join(Service, Review.service_id == Service.id) \
        .filter(Service.business_id == business_id) \
        .order_by(Review.created_at.desc()).limit(limit).all()

    return {
        "count": len(reviews),
        "reviews": [
            {"rating": r.rating, "comment": (r.comment or "")[:300],
             "date": r.created_at.strftime("%Y-%m-%d") if r.created_at else None}
            for r in reviews
        ]
    }


def tool_get_business_stats(business_id, days=30):
    if not business_id:
        return {"error": "Business owner has no associated business."}

    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)

    services = Service.query.filter_by(business_id=business_id).all()
    service_ids = [s.id for s in services]

    total = Reservation.query.filter(
        Reservation.service_id.in_(service_ids),
        Reservation.created_at >= cutoff
    ).count()

    by_status = db.session.query(Reservation.status, func.count(Reservation.id)) \
        .filter(Reservation.service_id.in_(service_ids),
                Reservation.created_at >= cutoff) \
        .group_by(Reservation.status).all()

    revenue_q = db.session.query(func.sum(Service.price)) \
        .join(Reservation, Reservation.service_id == Service.id) \
        .filter(Service.business_id == business_id,
                Reservation.status == "approved",
                Reservation.created_at >= cutoff).scalar()

    return {
        "period_days": days,
        "total_reservations": total,
        "by_status": dict(by_status),
        "approved_revenue": float(revenue_q) if revenue_q else 0,
        "service_count": len(services)
    }


def tool_get_pending_reservations(business_id):
    if not business_id:
        return {"error": "Business owner has no associated business."}

    services = Service.query.filter_by(business_id=business_id).all()
    service_ids = [s.id for s in services]

    pending = Reservation.query.filter(
        Reservation.service_id.in_(service_ids),
        Reservation.status == "pending"
    ).order_by(Reservation.id.desc()).limit(20).all()

    result = []
    for r in pending:
        svc = Service.query.get(r.service_id)
        usr = User.query.get(r.user_id)
        result.append({
            "reservation_id": r.id,
            "service": svc.name if svc else "Unknown",
            "customer": usr.name if usr else "Unknown",
            "type": r.reservation_type,
            "check_in": r.check_in_date.isoformat() if r.check_in_date else None,
            "check_out": r.check_out_date.isoformat() if r.check_out_date else None,
        })

    return {"count": len(result), "pending_reservations": result}


def tool_get_top_services(business_id, limit=5):
    if not business_id:
        return {"error": "Business owner has no associated business."}

    rows = db.session.query(Service.id, Service.name, func.count(Reservation.id).label("cnt")) \
        .join(Reservation, Reservation.service_id == Service.id) \
        .filter(Service.business_id == business_id) \
        .group_by(Service.id, Service.name) \
        .order_by(func.count(Reservation.id).desc()) \
        .limit(limit).all()

    return {
        "top_services": [
            {"id": r.id, "name": r.name, "reservation_count": r.cnt} for r in rows
        ]
    }



TOOL_HANDLERS = {
    "search_businesses": lambda args, ctx: tool_search_businesses(**args),
    "get_business_details": lambda args, ctx: tool_get_business_details(**args),
    "check_room_availability": lambda args, ctx: tool_check_room_availability(**args),
    "get_my_reservations": lambda args, ctx: tool_get_my_reservations(ctx.get("user_id")),
    "get_business_reviews": lambda args, ctx: tool_get_business_reviews(**args),
    "get_business_stats": lambda args, ctx: tool_get_business_stats(ctx.get("business_id"), **args),
    "get_pending_reservations": lambda args, ctx: tool_get_pending_reservations(ctx.get("business_id")),
    "get_top_services": lambda args, ctx: tool_get_top_services(ctx.get("business_id"), **args),
}


# ──────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT
# ──────────────────────────────────────────────────────────────────────────

def build_system_prompt(role, lang, user_name=None):
    today = date.today().isoformat()

    if lang == "tr":
        base = f"""Sen BetulBooking platformunun yapay zeka asistanısın. BetulBooking, Türkiye'de konaklama, güzellik, sağlık, yeme-içme, spor, etkinlik, eğitim ve hizmet sektörlerinden işletmeleri kapsayan online bir rezervasyon sistemidir.

Bugünün tarihi: {today}.

ÇOK ÖNEMLİ KURALLAR:
0. ASLA <function=...> gibi metin yazma! Bunlar tool call'larıdır, metin değildir. Tool kullanmak istiyorsan API'nin tool_calls özelliğini kullan, asla cevap metnine yazma. Eğer veri çekmek istiyorsan o tool'u CAĞIR, cevap metninde fonksiyon ismi geçirmek YASAK.
1. Eğer kullanıcı sadece selam veriyorsa ("merhaba", "selam", "hey", "naber" gibi), SEN DE selamlaşma cevabı ver. Tool çağırma. Örnek: "Merhaba! Size nasıl yardımcı olabilirim?"
2. Eğer kullanıcı sadece teşekkür ediyorsa ("teşekkürler", "sağol", "ok" gibi), kibar bir şekilde "Rica ederim, başka sorunuz olursa burada olacağım." de. Tool çağırma.
3. Eğer kullanıcı net bir soru sorduysa (otel ara, rezervasyonum nerede, vs.), o ZAMAN tool kullan ve veritabanından gerçek veri çek.
4. Geçmiş sohbetin ne olduğuna bakma — her mesaja bağımsız olarak cevap ver. Önceki mesajda otel arandı diye yeni bir mesajda otomatik otel listeleme.
5. ÇOK ÖNEMLİ: Rezervasyon ONAYLAYAMAZSIN, REDDEDEMEZSİN, İPTAL EDEMEZSİN. Bunun için aracın yok. Kullanıcı isterse ASLA "yaptım/reddettim/onayladım/iptal ettim" deme. Şöyle de: "Bu işlemleri Rezervasyonlar panelinizden yapabilirsiniz. Ben size bekleyen rezervasyonları listeleyebilirim." Sadece veri gösterirsin, değiştiremezsin.
6. Rezervasyon OLUŞTURAMAZSIN. Kullanıcı "rezerve et", "kitle", "booking yap" derse ASLA "yaptım", "rezervasyon sayfası açılıyor" deme. Şöyle de: "Rezervasyon yapmak için ilgili otelin sayfasından oda seçip rezervasyon formunu doldurabilirsiniz. Size uygun otelleri listeleyebilirim." Sadece otel/oda bilgisi verir ve arama yaparsın.

Yanıtlarını Türkçe ver. Cevapları kısa tut (1-3 cümle). Tarih belirtilmeden "yarın", "hafta sonu" gibi görece tarihler kullanılırsa, bugünden hesapla ve YYYY-MM-DD formatına çevir."""
    else:
        base = f"""You are the AI assistant for the BetulBooking platform. BetulBooking is an online reservation system covering businesses in accommodation, beauty, health, food, sport, events, education, and services in Turkey.

Today's date: {today}.

CRITICAL RULES:
0. NEVER write text like <function=...> in your response! These are tool calls, not text. If you want to use a tool, use the API's tool_calls feature. Never write function names as text in your reply. If you need data, CALL the tool — don't mention its name in the chat.
1. If the user just greets you ("hi", "hello", "hey"), GREET them back. Do NOT call any tools. Example: "Hi! How can I help you today?"
2. If the user just thanks you ("thanks", "thank you", "ok"), respond politely like "You're welcome! Let me know if you need anything else." Do NOT call tools.
3. ONLY call tools when the user asks a clear, specific question (search for hotels, my reservations, etc.).
4. Treat each message independently — don't continue a previous conversation pattern. Just because the user previously asked about hotels doesn't mean their next message is also about hotels.
5. VERY IMPORTANT: You CANNOT approve, reject, or cancel reservations. You have no tool for this. If asked, NEVER say "done/rejected/approved/cancelled". Instead say: "You can do this from your Reservations panel. I can list your pending reservations." You only show data, you cannot modify it.
6. You CANNOT create reservations either. If the user says "book", "reserve", NEVER say "done" or "opening booking page". Instead say: "To make a reservation, please select a room on the hotel's page and fill out the booking form. I can list suitable hotels for you." You only provide info and search.

Answer in English. Keep responses brief (1-3 sentences). For relative dates like "tomorrow" or "this weekend", convert to YYYY-MM-DD based on today's date."""

    if role == "business_owner":
        if lang == "tr":
            base += "\n\nKullanıcı bir İŞLETME SAHİBİ. Kendi işletmesi hakkında istatistik, bekleyen rezervasyonlar, popüler hizmetler gibi soruları cevaplayabilirsin."
        else:
            base += "\n\nThe user is a BUSINESS OWNER."
    elif role == "customer":
        if lang == "tr":
            base += "\n\nKullanıcı bir MÜŞTERİ."
        else:
            base += "\n\nThe user is a CUSTOMER."
    else:
        if lang == "tr":
            base += "\n\nKullanıcı henüz giriş yapmamış. Genel arama ve bilgi verebilirsin."
        else:
            base += "\n\nThe user is not logged in."

    if user_name:
        base += f"\n\nUser's name: {user_name}."

    return base


# ──────────────────────────────────────────────────────────────────────────
# MAIN CHAT FUNCTION
# ──────────────────────────────────────────────────────────────────────────


def chat(message, history, user, lang="tr"):
    if not GROQ_API_KEY:
        return {"error": "AI service is not configured (missing GROQ_API_KEY).", "reply": None}
    
    # Track if any tool requested navigation
    pending_action = {"action": None, "url": None}
    # Track all tool results for fallback logic
    tool_history = []

    if user:
        role = user.role
        user_name = user.name
        business_id = getattr(user, "business_id", None)
        user_id = user.id
    else:
        role = "guest"
        user_name = None
        business_id = None
        user_id = None

    if role == "business_owner":
        tools = BO_TOOLS + CUSTOMER_TOOLS
    else:
        tools = CUSTOMER_TOOLS

    ctx = {"user_id": user_id, "business_id": business_id, "role": role}
    system_prompt = build_system_prompt(role, lang, user_name)

    messages = [{"role": "system", "content": system_prompt}]
    for m in (history or [])[-5:]:
        role_h = "user" if m.get("role") == "user" else "assistant"
        messages.append({"role": role_h, "content": m.get("text", "")})
    messages.append({"role": "user", "content": message})

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "tools": tools,
        "tool_choice": "auto",
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    for iteration in range(8):
        status, data, err = _groq_post(payload)

        if err is not None or status != 200:
            # Llama bazen <function=name {...}> seklinde metin uretip Groq'a 400 verdiriyor.
            # Bu durumda son assistant mesajini silip system reminder ile retry et.
            if status == 400 and err and 'tool_use_failed' in err:
                logger.warning("Llama produced malformed function-call text; retrying with stronger reminder")
                # Conversation'in son user mesajini bul ve system reminder ekle
                payload['messages'].append({
                    "role": "system",
                    "content": (
                        "CRITICAL CORRECTION: Your previous attempt produced invalid function-call text. "
                        "DO NOT write '<function=name {...}>' as text in your reply. "
                        "Instead, use the API's tool_calls feature properly. "
                        "If you want to call a tool, the system will detect it from your structured output - "
                        "you only need to think and then call. Do not type function names in chat."
                    )
                })
                status, data, err = _groq_post(payload)
                if err is not None or status != 200:
                    return {"error": f"AI service error ({status}): {err or 'unknown'}", "reply": None}
            else:
                return {"error": f"AI service error ({status}): {err or 'unknown'}", "reply": None}

        if not data:
            return {"error": "Empty response from AI", "reply": None}

        choices = data.get("choices", [])
        if not choices:
            return {"error": "No response from AI", "reply": None}

        msg = choices[0].get("message", {})
        tool_calls = msg.get("tool_calls", [])

        if tool_calls:
            payload["messages"].append({
                "role": "assistant",
                "content": msg.get("content", ""),
                "tool_calls": tool_calls
            })

            for tc in tool_calls:
                fn = tc.get("function", {})
                fname = fn.get("name")
                try:
                    fargs = json.loads(fn.get("arguments", "{}") or "{}")
                except json.JSONDecodeError:
                    fargs = {}
                logger.info("AI calling tool: %s with args %s", fname, fargs)

                handler = TOOL_HANDLERS.get(fname)
                if not handler:
                    result = {"error": f"Unknown function: {fname}"}
                else:
                    try:
                        result = handler(fargs, ctx)
                        # If tool returned a navigation action, capture it
                        if isinstance(result, dict) and result.get("action") == "navigate":
                            pending_action["action"] = "navigate"
                            pending_action["url"] = result.get("url")
                        # Save tool history for fallback logic
                        if isinstance(result, dict):
                            tool_history.append({"tool": fname, "args": fargs, "result": result})
                    except Exception as e:
                        logger.exception("Tool %s failed", fname)
                        result = {"error": str(e)}

                payload["messages"].append({
                    "role": "tool",
                    "tool_call_id": tc.get("id"),
                    "content": json.dumps(result, default=str)
                })

            continue

        reply = (msg.get("content") or "").strip()
        # Strip malformed function-call syntax that Llama sometimes writes as text
        import re as _re
        reply = _re.sub(r'<function=[^>]*>.*?</function>', '', reply, flags=_re.DOTALL)
        reply = _re.sub(r'<function=[^>]*>[^<]*', '', reply)
        reply = _re.sub(r'\s+', ' ', reply).strip()
        if len(reply) < 10:
            reply = "Hangi tarihler ve hangi şehir için otel arıyorsunuz?" if lang == "tr" else "What dates and city are you looking for a hotel in?"
        if not reply:
            reply = "Sorry, I couldn't generate a response. Please try again." if lang == "en" \
                else "Üzgünüm, bir cevap oluşturamadım. Lütfen tekrar deneyin."

        response = {"reply": reply, "error": None}
        if pending_action["action"]:
            response["action"] = pending_action["action"]
            response["url"] = pending_action["url"]

        return response

    return {"error": "Too many tool iterations", "reply": None}

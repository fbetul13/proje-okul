"""
Payment Routes — Stripe Checkout flow
"""
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.user import User
from app.models.reservation import Reservation
from app.services import payment_service

logger = logging.getLogger(__name__)

payment_bp = Blueprint("payment", __name__, url_prefix="/api/payment")


@payment_bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "configured": payment_service.is_configured(),
        "provider": "stripe",
        "publishable_key": payment_service.STRIPE_PUBLISHABLE_KEY or None,
    })


@payment_bp.route("/checkout/<int:reservation_id>", methods=["POST"])
@jwt_required()
def create_checkout(reservation_id):
    if not payment_service.is_configured():
        return jsonify({"error": "Payment service not configured"}), 500

    user_id = get_jwt_identity()
    try: user_id = int(user_id)
    except (TypeError, ValueError): pass
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({"error": "Reservation not found"}), 404

    if reservation.user_id != user_id:
        return jsonify({"error": "Not authorized to pay for this reservation"}), 403

    if reservation.status != "approved":
        return jsonify({
            "error": "Reservation must be approved before payment",
            "current_status": reservation.status
        }), 400

    if getattr(reservation, "payment_status", "unpaid") == "paid":
        return jsonify({"error": "This reservation has already been paid"}), 400

    base_url = request.host_url.rstrip("/")
    success_url = f"{base_url}/?payment=success&reservation_id={reservation.id}&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{base_url}/?payment=cancel&reservation_id={reservation.id}"

    session_data, err = payment_service.create_checkout_session(
        reservation,
        customer_email=user.email,
        success_url=success_url,
        cancel_url=cancel_url
    )

    if err:
        logger.error("Failed to create checkout session: %s", err)
        return jsonify({"error": err}), 500

    reservation.stripe_session_id = session_data["id"]
    db.session.commit()

    return jsonify({
        "session_id": session_data["id"],
        "checkout_url": session_data["url"],
        "amount": session_data["amount"],
        "currency": session_data["currency"],
    })


@payment_bp.route("/verify/<int:reservation_id>", methods=["POST"])
@jwt_required()
def verify_payment(reservation_id):
    if not payment_service.is_configured():
        return jsonify({"error": "Payment service not configured"}), 500

    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id required"}), 400

    user_id = get_jwt_identity()
    try: user_id = int(user_id)
    except (TypeError, ValueError): pass
    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({"error": "Reservation not found"}), 404

    if reservation.user_id != user_id:
        return jsonify({"error": "Not authorized"}), 403

    if reservation.stripe_session_id and reservation.stripe_session_id != session_id:
        return jsonify({"error": "Session mismatch"}), 400

    session_data, err = payment_service.retrieve_session(session_id)
    if err:
        return jsonify({"error": err}), 500

    if payment_service.is_session_paid(session_data):
        reservation.payment_status = "paid"
        reservation.paid_at = datetime.utcnow()
        db.session.commit()
        return jsonify({
            "status": "paid",
            "payment_status": "paid",
            "paid_at": reservation.paid_at.isoformat()
        })
    else:
        return jsonify({
            "status": session_data.get("payment_status", "unknown"),
            "payment_status": getattr(reservation, "payment_status", "unpaid")
        })


@payment_bp.route("/status/<int:reservation_id>", methods=["GET"])
@jwt_required()
def payment_status(reservation_id):
    user_id = get_jwt_identity()
    try: user_id = int(user_id)
    except (TypeError, ValueError): pass
    user = User.query.get(user_id)

    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({"error": "Reservation not found"}), 404

    if reservation.user_id != user_id:
        if not user or user.role not in ("superadmin",):
            from app.models.service import Service
            svc = Service.query.get(reservation.service_id)
            if not svc or getattr(user, "business_id", None) != svc.business_id:
                return jsonify({"error": "Not authorized"}), 403

    return jsonify({
        "reservation_id": reservation.id,
        "reservation_status": reservation.status,
        "payment_status": getattr(reservation, "payment_status", "unpaid"),
        "paid_at": reservation.paid_at.isoformat() if getattr(reservation, "paid_at", None) else None,
    })


@payment_bp.route("/dummy-pay/<int:reservation_id>", methods=["POST"])
@jwt_required()
def dummy_pay(reservation_id):
    """Dummy payment endpoint — card number last digit decides outcome."""
    from app.services.payment_service import dummy_card_result, is_dummy_mode, calculate_amount
    
    if not is_dummy_mode():
        return jsonify({"error": "Dummy mode is not enabled"}), 400

    user_id = get_jwt_identity()
    try: user_id = int(user_id)
    except (TypeError, ValueError): pass

    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({"error": "Reservation not found"}), 404
    if reservation.user_id != user_id:
        return jsonify({"error": "Not authorized"}), 403
    if reservation.status != "approved":
        return jsonify({"error": "Reservation must be approved before payment"}), 400
    if getattr(reservation, "payment_status", "unpaid") == "paid":
        return jsonify({"error": "Already paid"}), 400

    data = request.get_json(silent=True) or {}
    card_number = data.get("card_number", "")

    success, error_code, message = dummy_card_result(card_number)

    if success:
        reservation.payment_status = "paid"
        reservation.paid_at = datetime.utcnow()
        reservation.stripe_session_id = f"dummy_{reservation_id}"
        db.session.commit()
        amount = calculate_amount(reservation) or 0
        return jsonify({
            "status": "paid",
            "message": message,
            "amount": amount,
            "paid_at": reservation.paid_at.isoformat(),
        })
    else:
        return jsonify({
            "status": "failed",
            "error_code": error_code,
            "message": message,
        }), 402


@payment_bp.route("/dummy-refund/<int:reservation_id>", methods=["POST"])
@jwt_required()
def dummy_refund(reservation_id):
    """Dummy refund — instantly marks refunded, no real money."""
    from app.services.payment_service import is_dummy_mode, calculate_amount

    if not is_dummy_mode():
        return jsonify({"error": "Dummy mode not enabled"}), 400

    user_id = get_jwt_identity()
    try: user_id = int(user_id)
    except (TypeError, ValueError): pass

    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({"error": "Reservation not found"}), 404

    data = request.get_json(silent=True) or {}
    refund_amount = data.get("amount", 0)

    reservation.payment_status = "refunded"
    db.session.commit()

    return jsonify({
        "status": "refunded",
        "refund_amount": refund_amount,
        "message": f"{refund_amount:.2f} TL iade edildi.",
    })


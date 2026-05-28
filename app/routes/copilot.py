"""
Copilot Routes — AI chat endpoint
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.services import copilot_service
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

copilot_bp = Blueprint("copilot", __name__, url_prefix="/api/copilot")


@copilot_bp.route("/chat", methods=["POST"])
def chat():
    """
    Chat with the AI assistant.
    
    Body:
      { "message": "...", "history": [...], "lang": "tr" | "en" }
    
    Auth: Optional. If JWT provided, user is recognized.
    """
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    history = data.get("history") or []
    lang = data.get("lang") or "tr"
    if lang not in ("tr", "en"):
        lang = "tr"

    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400

    if len(message) > 1000:
        return jsonify({"error": "Message too long (max 1000 chars)"}), 400

    # Try to identify user (optional)
    user = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            user = User.query.get(user_id)
    except Exception as e:
        logger.warning("JWT optional verify failed: %s", e)
        user = None

    # Call service
    result = copilot_service.chat(message, history, user, lang)

    if result.get("error"):
        return jsonify({"error": result["error"]}), 500

    return jsonify({
        "reply": result["reply"],
        "user_role": user.role if user else "guest"
    })


@copilot_bp.route("/health", methods=["GET"])
def health():
    """Quick check that copilot service is configured."""
    import os
    return jsonify({
        "configured": bool(os.getenv("GROQ_API_KEY")),
        "model": copilot_service.GROQ_MODEL
    })

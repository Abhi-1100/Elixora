from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv
import bcrypt
import os
import re

from app import db
from app.models.models import User

auth_bp = Blueprint("auth_bp", __name__)

load_dotenv()

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(plain_password: str, hashed_password: str | None) -> bool:
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    age = data.get("age")
    gender = data.get("gender")

    # --- Validation ---
    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if not re.match(EMAIL_REGEX, email):
        return jsonify({"error": "Invalid email format"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    # --- Create user ---
    new_user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        age=age,
        gender=gender,
        profile_complete=age is not None and gender is not None,
    )
    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=new_user.id)

    return jsonify({
        "message": "Account created successfully",
        "access_token": access_token,
        "user": new_user.to_dict(),
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password(password, user.password_hash):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=user.id)

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/google", methods=["POST"])
def google_login():
    data = request.get_json(silent=True) or {}
    credential = data.get("credential")
    client_id = os.getenv("GOOGLE_CLIENT_ID")

    if not credential or not isinstance(credential, str):
        return jsonify({"error": "Google credential is required"}), 400
    if not client_id:
        return jsonify({"error": "Google sign-in is not configured on the server"}), 500

    try:
        claims = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            client_id,
        )
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid Google credential"}), 401

    google_id = claims.get("sub")
    email = (claims.get("email") or "").strip().lower()
    name = (claims.get("name") or claims.get("given_name") or "Google user").strip()

    if not google_id or not email or claims.get("email_verified") is not True:
        return jsonify({"error": "Google account email could not be verified"}), 401

    user = User.query.filter_by(google_id=google_id).first()
    if not user:
        user = User.query.filter_by(email=email).first()

    if user:
        if user.google_id and user.google_id != google_id:
            return jsonify({"error": "This email is linked to a different Google account"}), 409
        if not user.google_id:
            user.google_id = google_id
    else:
        user = User(
            name=name,
            email=email,
            password_hash=None,
            google_id=google_id,
            profile_complete=False,
        )
        db.session.add(user)

    db.session.commit()
    access_token = create_access_token(identity=user.id)
    return jsonify({
        "message": "Google login successful",
        "access_token": access_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    age = data.get("age")
    gender = data.get("gender")
    if not isinstance(age, int) or age < 1 or age > 120:
        return jsonify({"error": "Age must be an integer between 1 and 120"}), 400
    if gender not in {"Male", "Female", "Other"}:
        return jsonify({"error": "Gender must be Male, Female, or Other"}), 400

    user.age = age
    user.gender = gender
    user.profile_complete = True
    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200

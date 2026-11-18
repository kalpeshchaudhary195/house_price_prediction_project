"""Authentication Blueprint.

Handles user registration, login, logout, and session status with password hashing.
"""

from flask import Blueprint, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import db_session
from database.models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or request.form
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not full_name or not email or not password:
        return jsonify({"success": False, "message": "All fields are required."}), 400

    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters long."}), 400

    db = db_session()
    try:
        existing = db.query(User).filter_by(email=email).first()
        if existing:
            return jsonify({"success": False, "message": "Email is already registered. Please login."}), 409

        new_user = User(
            full_name=full_name,
            email=email,
            password_hash=generate_password_hash(password),
            role="user"
        )
        db.add(new_user)
        db.commit()

        # Set session
        session["user_id"] = new_user.id
        session["user_name"] = new_user.full_name
        session["user_email"] = new_user.email
        session["user_role"] = new_user.role

        return jsonify({
            "success": True,
            "message": "Registration successful!",
            "user": new_user.to_dict()
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or request.form
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required."}), 400

    db = db_session()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"success": False, "message": "Invalid email or password."}), 401

        session["user_id"] = user.id
        session["user_name"] = user.full_name
        session["user_email"] = user.email
        session["user_role"] = user.role

        return jsonify({
            "success": True,
            "message": "Login successful!",
            "user": user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


@auth_bp.route("/logout")
@auth_bp.route("/api/auth/logout", methods=["GET", "POST"])
def logout():
    session.clear()
    if request.path.startswith("/api/"):
        return jsonify({"success": True, "message": "Logged out successfully."}), 200
    return redirect(url_for("page_login"))


@auth_bp.route("/api/auth/me", methods=["GET"])
def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"authenticated": False}), 200

    db = db_session()
    user = db.get(User, user_id)
    if not user:
        session.clear()
        return jsonify({"authenticated": False}), 200

    return jsonify({
        "authenticated": True,
        "user": user.to_dict()
    }), 200

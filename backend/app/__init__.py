"""
EcoVision Backend Application Factory
Configures Flask, database, CORS, security headers, centralized logging, and global error handlers.
"""

import logging
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from .config import Config, validate_config
from .database import init_db, close_db
from .routes.health import health_bp
from .routes.metrics import metrics_bp
from .routes.environmental import environmental_bp

# Configure standard centralized logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def create_app(config_class=Config):
    """Application factory for EcoVision backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Validate critical configuration at startup
    validate_config(app)

    # Configure CORS for whitelisted frontend origins
    cors_origins = app.config.get("CORS_ORIGINS") or []
    CORS(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=True,
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    # Initialize SQLite database schema
    init_db(app)
    app.teardown_appcontext(close_db)

    # Register blueprints under /api
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(metrics_bp, url_prefix="/api/metrics")
    app.register_blueprint(environmental_bp, url_prefix="/api")

    # Security response headers
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        content_type = response.headers.get("Content-Type", "")
        if "application/json" in content_type:
            response.headers["Cache-Control"] = "no-store, max-age=0"
        return response

    # Global HTTP error handlers returning structured JSON without internal leakage
    @app.errorhandler(400)
    def handle_bad_request(err):
        msg = err.description if hasattr(err, "description") else "Bad request"
        return jsonify({"error": "Bad Request", "status": 400, "message": str(msg)}), 400

    @app.errorhandler(404)
    def handle_not_found(err):
        return jsonify({"error": "Not Found", "status": 404, "message": "The requested endpoint does not exist."}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(err):
        return jsonify({"error": "Method Not Allowed", "status": 405, "message": "HTTP method not supported for this route."}), 405

    @app.errorhandler(413)
    def handle_payload_too_large(err):
        return jsonify({"error": "Payload Too Large", "status": 413, "message": "Request payload exceeds maximum allowed limit (1MB)."}), 413

    @app.errorhandler(429)
    def handle_too_many_requests(err):
        msg = err.description if hasattr(err, "description") else "Rate limit exceeded. Please try again shortly."
        return jsonify({"error": "Too Many Requests", "status": 429, "message": str(msg)}), 429

    @app.errorhandler(500)
    def handle_internal_server_error(err):
        logger.error(f"Internal server error: {err}", exc_info=True)
        return jsonify({"error": "Internal Server Error", "status": 500, "message": "An unexpected server error occurred."}), 500

    @app.errorhandler(Exception)
    def handle_generic_exception(err):
        if isinstance(err, HTTPException):
            code = err.code or 500
            msg = err.description or "HTTP error occurred"
            return jsonify({"error": err.name, "status": code, "message": msg}), code
        logger.error(f"Unhandled exception caught: {err}", exc_info=True)
        return jsonify({"error": "Internal Server Error", "status": 500, "message": "An unexpected server error occurred."}), 500

    @app.route("/")
    def index():
        return jsonify({
            "project": "EcoVision",
            "status": "online",
            "message": "EcoVision Environmental Monitoring & Prediction API",
            "endpoints": {
                "health": "/api/health",
                "city_search": "/api/cities/search?q={name}",
                "city_environmental_data": "/api/environmental/data?lat={lat}&lon={lon}&name={city}",
                "saved_cities": "/api/cities/saved",
                "environmental_analysis": "/api/environmental/analysis?lat={lat}&lon={lon}&days={7|14|30}",
                "environmental_prediction": "/api/environmental/prediction?lat={lat}&lon={lon}&city_id={id}",
                "metrics_summary": "/api/metrics/summary"
            }
        })

    return app

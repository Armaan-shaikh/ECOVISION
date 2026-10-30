from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
from .database import init_db, close_db
from .routes.health import health_bp
from .routes.metrics import metrics_bp
from .routes.environmental import environmental_bp

def create_app(config_class=Config):
    """Application factory for EcoVision backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure CORS for all frontend origins
    CORS(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}})
    
    # Initialize SQLite database schema
    init_db(app)
    app.teardown_appcontext(close_db)
    
    # Register blueprints under /api
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(metrics_bp, url_prefix="/api/metrics")
    app.register_blueprint(environmental_bp, url_prefix="/api")
    
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

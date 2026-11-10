import os
import sys
import logging
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app
from app.config import get_config_by_name

config_class = get_config_by_name()
app = create_app(config_class)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", app.config.get("PORT", 5000)))
    host = os.environ.get("HOST", app.config.get("HOST", "127.0.0.1"))
    # Never enable debug if environment is production
    is_prod = app.config.get("ENV") == "production"
    debug = False if is_prod else app.config.get("DEBUG", False)
    
    logging.info("Starting EcoVision Backend API on http://%s:%d (env=%s, debug=%s)", host, port, app.config.get("ENV"), debug)
    print(f"Starting EcoVision Backend API on http://{host}:{port} [Environment: {app.config.get('ENV')}]", flush=True)
    app.run(host=host, port=port, debug=debug, use_reloader=False)

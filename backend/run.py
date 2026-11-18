"""Entrypoint script to start the House Price Prediction backend server."""

import os
import sys

# Ensure root directory is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import create_app
from backend.config import PORT, HOST, DEBUG

app = create_app()

if __name__ == "__main__":
    print(f"Starting House Price Prediction server on http://127.0.0.1:{PORT}")
    app.run(host=HOST, port=PORT, debug=DEBUG)


"""Entrypoint for Python ML FastAPI service on port 8000."""

import uvicorn
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if __name__ == "__main__":
    port = int(os.getenv("ML_PORT", "8000"))
    print(f"Starting Python ML FastAPI service on http://127.0.0.1:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


"""
Vercel Serverless Function Entry Point for LIBRIX Backend.
Exposes the FastAPI ASGI application for Vercel's Python runtime.
"""
import sys
from pathlib import Path

# Add backend and root directories to Python search path
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from main import app
except ImportError:
    from backend.main import app

__all__ = ["app"]

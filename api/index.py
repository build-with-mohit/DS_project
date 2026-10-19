"""
Vercel Serverless Function Entry Point for LIBRIX Backend.
Exposes the FastAPI ASGI application for Vercel's Python runtime.
"""
import sys
from pathlib import Path

# Add backend directory to Python search path so 'from main import app' works
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from main import app  # noqa: E402 — imported after sys.path manipulation

__all__ = ["app"]

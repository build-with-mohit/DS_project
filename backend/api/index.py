"""
Vercel Serverless Function Entry Point for LIBRIX Backend.
Exposes the FastAPI ASGI application for Vercel's Python Serverless Runtime.
"""
import sys
from pathlib import Path

# Add backend directory to sys.path so sibling modules import cleanly
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app

# Vercel's Python runtime discovers 'app' directly as the ASGI callable.
__all__ = ["app"]

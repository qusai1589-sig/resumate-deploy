"""Serve the built frontend and authenticated API through one temporary URL."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app import app as backend


frontend_dist = Path(__file__).resolve().parent.parent / "ResuMate-main" / "dist"
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", backend)
# Serve only build output; project files and backend configuration stay private.
app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

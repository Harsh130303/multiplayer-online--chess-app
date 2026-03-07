from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from app.db import engine, Base
from app.routes import router
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

# Serve static files from the React build
if os.path.exists("frontend/dist"):
    app.mount("/static", StaticFiles(directory="frontend/dist", html=True), name="static")

    @app.get("/{full_path:path}")
    async def serve_react_app(request: Request, full_path: str):
        # If the path starts with /api, let the router handle it (shouldn't happen with prefix)
        if full_path.startswith("api"):
            return None
        
        # Check if the requested path is a file in the dist folder
        file_path = os.path.join("frontend/dist", full_path)
        if os.path.isfile(file_path):
            return StaticFiles(directory="frontend/dist").get_response(full_path, scope=request.scope)
            
        # Otherwise, serve index.html for React Router
        return HTMLResponse(content=open("frontend/dist/index.html").read())


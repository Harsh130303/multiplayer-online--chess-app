from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
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

# Prefix all API routes with /api
app.include_router(router, prefix="/api")

# Serve static files from the React build
if os.path.exists("frontend/dist"):
    # Mount the assets specifically
    app.mount("/static", StaticFiles(directory="frontend/dist", html=True), name="static")

    @app.get("/{full_path:path}")
    async def serve_react_app(request: Request, full_path: str):
        # If the path starts with api/, the router above should have handled it.
        # If we are here, it means the router didn't find the path.
        if full_path.startswith("api/"):
            return HTMLResponse(status_code=404, content="API Route not found")
        
        # Check if the requested path is a file in the dist folder
        file_path = os.path.join("frontend/dist", full_path)
        if os.path.isfile(file_path):
            return await StaticFiles(directory="frontend/dist").get_response(full_path, scope=request.scope)
            
        # Otherwise, serve index.html for React Router (SPA)
        return FileResponse("frontend/dist/index.html")

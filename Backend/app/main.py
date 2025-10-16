from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from app.core.logging_config import configure_logging
from app.api.score import router as score_router


def log_effective_levels() -> None:
    root_level = logging.getLogger().getEffectiveLevel()
    app_level = logging.getLogger("app").getEffectiveLevel()
    uvicorn_level = logging.getLogger("uvicorn").getEffectiveLevel()
    logging.getLogger(__name__).info(
        "Effective log levels -> root=%s, app=%s, uvicorn=%s",
        logging.getLevelName(root_level),
        logging.getLevelName(app_level),
        logging.getLevelName(uvicorn_level),
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logging.getLogger(__name__).info("Application startup: logging configured")
    log_effective_levels()
    yield
    logging.getLogger(__name__).info("Application shutdown")


def create_app() -> FastAPI:
    application = FastAPI(lifespan=lifespan)
    
    # Configure CORS
    cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    # Parse comma-separated origins, or use "*" for all
    if cors_origins_str == "*":
        allow_origins = ["*"]
    else:
        allow_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
    
    application.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
        allow_headers=["*"],  # Allow all headers
    )
    
    application.include_router(score_router)
    return application


app = create_app()


@app.get("/")
async def root():
    return {"message": "Hello World"}
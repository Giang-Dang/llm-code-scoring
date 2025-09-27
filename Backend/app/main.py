from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging

from app.core.logging_config import configure_logging
from app.api.score import router as score_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logging.getLogger(__name__).info("Application startup: logging configured")
    root_level = logging.getLogger().getEffectiveLevel()
    app_level = logging.getLogger("app").getEffectiveLevel()
    uvicorn_level = logging.getLogger("uvicorn").getEffectiveLevel()
    logging.getLogger(__name__).info(
        "Effective log levels -> root=%s, app=%s, uvicorn=%s",
        logging.getLevelName(root_level),
        logging.getLevelName(app_level),
        logging.getLevelName(uvicorn_level),
    )
    yield
    logging.getLogger(__name__).info("Application shutdown")


app = FastAPI(lifespan=lifespan)

app.include_router(score_router)

@app.get("/")
async def root():
    return {"message": "Hello World"}
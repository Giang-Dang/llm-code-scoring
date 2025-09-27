from fastapi import FastAPI
from app.api.score import router as score_router

app = FastAPI()

app.include_router(score_router)

@app.get("/")
async def root():
    return {"message": "Hello World"}
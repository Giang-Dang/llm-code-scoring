
from app.models.scoring.requests import ScoringRequest
from pydantic import BaseModel


class BatchScoringRequest(BaseModel):
    submissions: list[ScoringRequest]
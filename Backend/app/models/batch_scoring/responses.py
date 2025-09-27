
from app.models.scoring.responses import ScoringResponse
from typing import List
from pydantic import BaseModel


class BatchScoringResponse(BaseModel):
    results: List[ScoringResponse]
    total_processed: int
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.common.llm_provider import LLMProvider

class CategoryBandDecision(BaseModel):
    min_score: int = Field(ge=0)
    max_score: int = Field(ge=0)
    description: str              # the band text from the rubric
    rationale: str                # LLM’s reason for choosing this band

class CategoryResult(BaseModel):
    category_name: str            # e.g., "correctness", "readability", or custom
    raw_score: float              # earned points before weighting (e.g., 0–10)
    points_possible: float        # category max (e.g., 10)
    weighted_score: float         # contribution to final (e.g., scaled to 0–100)
    band_decision: CategoryBandDecision

class PenaltyApplied(BaseModel):
    code: str                     # e.g., "io_handling"
    points: float                 # negative for deduction (e.g., -2)
    reason: Optional[str] = None  # optional explanation

class ScoringResponse(BaseModel):
    total_score: float            # final score after weighting/penalties (0–100)
    category_results: List[CategoryResult]
    penalties_applied: List[PenaltyApplied] = Field(default_factory=list)
    provider_used: LLMProvider
    feedback: Optional[str] = None  # optional overall narrative
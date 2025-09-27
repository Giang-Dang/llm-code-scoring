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
    weight: float                 # the weight of the category
    band_decision: CategoryBandDecision

class PenaltyApplied(BaseModel):
    code: str                     # e.g., "io_handling"
    points: float                 # negative for deduction (e.g., -2)
    reason: Optional[str] = None  # optional explanation

class ScoringResponse(BaseModel):
    category_results: List[CategoryResult]
    penalties_applied: List[PenaltyApplied] = Field(default_factory=list)
    provider_used: LLMProvider
    feedback: Optional[str] = None  # optional overall narrative
    total_score: float            # final score after weighting/penalties (0–10)

class LLMCategoryBandDecision(BaseModel):
    min_score: int
    max_score: int
    description: str
    rationale: str

class LLMCategoryResult(BaseModel):
    category_name: str
    raw_score: float
    band_decision: LLMCategoryBandDecision

class LLMPenaltyApplied(BaseModel):
    code: str
    points: float
    reason: Optional[str] = None

class LLMScoringPayload(BaseModel):
    category_results: List[LLMCategoryResult]
    penalties_applied: List[LLMPenaltyApplied] = []
    feedback: Optional[str] = None
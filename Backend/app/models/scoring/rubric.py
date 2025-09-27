from typing import List
from pydantic import BaseModel, Field

class RubricBand(BaseModel):
    min_score: int = Field(ge=0, le=10)
    max_score: int = Field(ge=0, le=10)
    description: str

class RubricCategory(BaseModel):
    name: str 
    max_points: int = Field(ge=0, le=10, default=10)
    weight: float = Field(ge=0, le=1, default=1)
    bands: List[RubricBand]

class PenaltyRule(BaseModel):
    code: str
    description: str
    points: int

class Rubric(BaseModel):
    categories: List[RubricCategory]
    penalties: List[PenaltyRule] = Field(default_factory=list)
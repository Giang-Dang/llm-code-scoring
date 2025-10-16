from typing import Literal
from pydantic import BaseModel

from app.models.common.llm_provider import LLMProvider
from .rubric import Rubric

class ScoringRequest(BaseModel):
    llm_provider: LLMProvider
    problem_description: str
    student_code: str
    programming_language: Literal["cpp", "python", "javascript", "java"] = "cpp"
    rubric: Rubric
    language: str = "Vietnamese"
    model: str
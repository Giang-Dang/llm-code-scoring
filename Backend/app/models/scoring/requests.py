from typing import Literal
from pydantic import BaseModel
from .rubric import Rubric

class ScoringRequest(BaseModel):
    problem_description: str
    student_code: str
    programming_language: Literal["cpp"] = "cpp"
    rubric: Rubric
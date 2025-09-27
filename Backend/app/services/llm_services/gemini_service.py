from app.models.batch_scoring.requests import BatchScoringRequest
from app.models.batch_scoring.responses import BatchScoringResponse
from app.models.common.llm_provider import LLMProvider
from app.models.scoring.requests import ScoringRequest
from app.models.scoring.responses import ScoringResponse
from app.services.llm_services.llm_base_service import LLMBaseService


class GeminiService(LLMBaseService):
    @property
    def provider(self) -> LLMProvider:
        return LLMProvider.GEMINI

    def generate_response(self, request: ScoringRequest) -> ScoringResponse:
        pass

    def generate_batch_response(self, request: BatchScoringRequest) -> BatchScoringResponse:
        pass
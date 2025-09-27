from abc import abstractmethod

from app.models.batch_scoring.requests import BatchScoringRequest
from app.models.batch_scoring.responses import BatchScoringResponse
from app.models.common.llm_provider import LLMProvider
from app.models.scoring.requests import ScoringRequest
from app.models.scoring.responses import ScoringResponse


class LLMBaseService:
    @property
    @abstractmethod
    def provider(self) -> LLMProvider:
        raise NotImplementedError

    @abstractmethod
    def generate_response(self, request: ScoringRequest) -> ScoringResponse:
        raise NotImplementedError

    @abstractmethod
    def generate_batch_response(self, request: BatchScoringRequest) -> BatchScoringResponse:
        raise NotImplementedError

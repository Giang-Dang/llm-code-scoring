import httpx
from typing import Any

from app.models.batch_scoring.requests import BatchScoringRequest
from app.models.batch_scoring.responses import BatchScoringResponse
from app.models.common.llm_provider import LLMProvider
from app.models.scoring.requests import ScoringRequest
from app.models.scoring.responses import ScoringResponse, PenaltyApplied
from app.services.llm_services.llm_base_service import LLMBaseService

import logging
logger = logging.getLogger(__name__)


class GeminiService(LLMBaseService):
    @property
    def provider(self) -> LLMProvider:
        logger.debug("Provider requested: GEMINI")
        return LLMProvider.GEMINI

    @property
    def endpoint_url(self) -> str:
        url = f"{self.base_url}/models/{self.model}:generateContent"
        logger.debug("Resolved endpoint URL: %s", url)
        return url

    async def generate_response(self, request: ScoringRequest) -> ScoringResponse:
        logger.debug("generate_response: start for provider=%s", self.provider)
        self._validate_request(request)
        logger.debug("Request validation passed")
        prompt = self._build_prompt(request)
        logger.debug("Built prompt; length=%d chars", len(prompt))

        result = await self._call_llm_api(prompt)

        # Extract text from response
        raw_response = self._extract_raw_text(result)
        logger.debug("Extracted raw LLM response; length=%d", len(raw_response) if raw_response else 0)

        # Parse LLM response to structured payload
        llm_payload = self._parse_llm_response(raw_response)
        logger.debug("Parsed LLM payload; categories=%d, penalties=%d", len(llm_payload.category_results) if hasattr(llm_payload, 'category_results') and llm_payload.category_results is not None else 0, len(llm_payload.penalties_applied) if hasattr(llm_payload, 'penalties_applied') and llm_payload.penalties_applied is not None else 0)

        # Calculate weighted scores and total
        category_results, total_score = self._score_results(request, llm_payload)

        return self._build_scoring_response(
            llm_payload=llm_payload,
            category_results=category_results,
            total_score=total_score,
        )

    async def generate_batch_response(self, request: BatchScoringRequest) -> BatchScoringResponse:
        logger.debug("generate_batch_response: start; request_count=%d", len(request.requests) if hasattr(request, 'requests') and request.requests is not None else 0)
        results = []
        for scoring_request in request.requests:
            try:
                result = await self.generate_response(scoring_request)
                results.append(result)
                logger.debug("Processed one request successfully; running_total=%d", len(results))
            except Exception as e:
                # Log error and continue with remaining requests
                logger.error("Error processing request: %s", e)
                logger.exception("Error processing request")

        logger.debug("Batch processing complete; total_processed=%d", len(results))
        return BatchScoringResponse(
            results=results,
            total_processed=len(results)
        )

    def _build_headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key or "",
        }

    def _build_payload(self, prompt: str) -> dict[str, Any]:
        return {
            "contents": [{"parts": [{"text": prompt}]}],
        }
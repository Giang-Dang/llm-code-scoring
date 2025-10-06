import logging
import httpx
from typing import Any

from app.models.batch_scoring.requests import BatchScoringRequest
from app.models.batch_scoring.responses import BatchScoringResponse
from app.models.common.llm_provider import LLMProvider
from app.models.scoring.requests import ScoringRequest
from app.models.scoring.responses import ScoringResponse
from app.services.llm_services.llm_base_service import LLMBaseService


logger = logging.getLogger(__name__)


class LMStudioService(LLMBaseService):
    @property
    def provider(self) -> LLMProvider:
        logger.debug("Provider requested: LMSTUDIO")
        return LLMProvider.LMSTUDIO

    @property
    def endpoint_url(self) -> str:
        # Normalize to REST Chat Completions endpoint per LM Studio docs
        base = (self.base_url or "").rstrip("/")
        if "/api/v0/" in base or "/v1/" in base:
            url = base
        elif base.endswith("/api/generate"):
            url = base.rsplit("/api/generate", 1)[0] + "/api/v0/chat/completions"
        else:
            url = base + "/api/v0/chat/completions"
        logger.debug("Resolved endpoint URL: %s", url)
        return url

    async def generate_response(self, request: ScoringRequest) -> ScoringResponse:
        logger.debug("generate_response: start for provider=%s", self.provider)
        self._validate_request(request)
        logger.debug("Request validation passed")

        prompt = self._build_prompt(request)
        logger.debug("Built prompt; length=%d chars", len(prompt))

        result = await self._call_llm_api(prompt, request.model)

        # Extract text from response
        raw_response = self._extract_raw_text(result)
        logger.debug("Extracted raw LLM response; length=%d", len(raw_response) if raw_response else 0)

        # Parse LLM response to structured payload
        llm_payload = self._parse_llm_response(raw_response)
        logger.debug(
            "Parsed LLM payload; categories=%d, penalties=%d",
            len(llm_payload.category_results) if hasattr(llm_payload, "category_results") and llm_payload.category_results is not None else 0,
            len(llm_payload.penalties_applied) if hasattr(llm_payload, "penalties_applied") and llm_payload.penalties_applied is not None else 0,
        )

        # Calculate weighted scores and total
        category_results, total_score = self._score_results(request, llm_payload)

        return self._build_scoring_response(
            llm_payload=llm_payload,
            category_results=category_results,
            total_score=total_score,
        )

    async def generate_batch_response(self, request: BatchScoringRequest) -> BatchScoringResponse:
        logger.debug("generate_batch_response: start; request_count=%d", len(request.requests) if hasattr(request, "requests") and request.requests is not None else 0)
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
            total_processed=len(results),
        )

    def _build_headers(self) -> dict[str, str]:
        # LM Studio local server typically does not require Authorization
        return {
            "Content-Type": "application/json",
        }

    def _build_payload(self, prompt: str, model: str) -> dict[str, Any]:
        # REST Chat Completions payload
        payload = {
            "model": model or self.model or "",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": self.temperature,
            "max_tokens": self.max_output_tokens,
            "stream": False,
        }

        logger.info("Built payload; payload=%s", payload)
        return payload

    def _extract_raw_text(self, result: dict[str, Any]) -> str:
        # REST Chat Completions shape per LM Studio docs
        try:
            choices = result.get("choices")
            if isinstance(choices, list) and choices:
                message = choices[0].get("message") if isinstance(choices[0], dict) else None
                if message and isinstance(message, dict) and "content" in message:
                    return message["content"]
        except Exception:
            pass

        logger.exception("Unexpected API response format for LM Studio: %s", result)
        raise ValueError("Unexpected API response format for LM Studio")

    async def _call_llm_api(self, prompt: str, model: str) -> dict[str, Any]:
        url = self.endpoint_url
        headers = self._build_headers()
        payload = self._build_payload(prompt, model)
        
        logger.info("Calling LM Studio API at %s", url)
        logger.debug("Request headers: %s", headers)
        logger.debug("Request payload: %s", payload)
        
        async with httpx.AsyncClient(timeout=self.api_timeout) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
        logger.debug("Received response from LM Studio API; status=%d", response.status_code)
        return result



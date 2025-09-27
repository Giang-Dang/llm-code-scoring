import httpx
from typing import Any

from app.models.batch_scoring.requests import BatchScoringRequest
from app.models.batch_scoring.responses import BatchScoringResponse
from app.models.common.llm_provider import LLMProvider
from app.models.scoring.requests import ScoringRequest
from app.models.scoring.responses import ScoringResponse
from app.services.llm_services.llm_base_service import LLMBaseService

import logging
logger = logging.getLogger(__name__)


class LMStudioService(LLMBaseService):
    @property
    def provider(self) -> LLMProvider:
        logger.debug("Provider requested: LMSTUDIO")
        return LLMProvider.LMSTUDIO

    @property
    def endpoint_url(self) -> str:
        # base_url for LMStudio already points to /api/generate
        url = f"{self.base_url}"
        logger.debug("Resolved endpoint URL: %s", url)
        return url

    @property
    def api_key(self) -> str:
        # LM Studio local endpoint does not require an API key
        return ""

    async def generate_response(self, request: ScoringRequest) -> ScoringResponse:
        logger.debug("generate_response: start for provider=%s", self.provider)
        self._validate_request(request)
        logger.debug("Request validation passed")
        prompt = self._build_prompt(request)
        logger.debug("Built prompt; length=%d chars", len(prompt))

        headers = self._build_headers()
        logger.debug("Prepared headers: keys=%s", list(headers.keys()))

        payload = self._build_payload(prompt)
        logger.debug(
            "Generation config: temperature=%s, max_tokens=%s, top_p=%s, top_k=%s",
            self.temperature,
            self.max_output_tokens,
            self.top_p,
            self.top_k,
        )

        async with httpx.AsyncClient(timeout=self.api_timeout) as client:
            logger.debug("POST %s", self.endpoint_url)
            response = await client.post(
                self.endpoint_url,
                headers=headers,
                json=payload,
            )

            if response.status_code != 200:
                logger.error(
                    "API request failed: status=%s, body_length=%d",
                    response.status_code,
                    len(response.text) if response.text else 0,
                )
                raise ValueError(
                    f"API request failed with status {response.status_code}: {response.text}"
                )

            logger.debug("API request succeeded: status=%s", response.status_code)
            result = response.json()
            logger.debug(
                "Parsed JSON response; raw_length=%d",
                len(response.text) if response.text else 0,
            )

        raw_response = self._extract_raw_text(result)
        logger.debug(
            "Extracted raw LLM response; length=%d",
            len(raw_response) if raw_response else 0,
        )

        llm_payload = self._parse_llm_response(raw_response)
        logger.debug(
            "Parsed LLM payload; categories=%d, penalties=%d",
            len(llm_payload.category_results)
            if hasattr(llm_payload, "category_results") and llm_payload.category_results is not None
            else 0,
            len(llm_payload.penalties_applied)
            if hasattr(llm_payload, "penalties_applied") and llm_payload.penalties_applied is not None
            else 0,
        )

        category_results, total_score = self._score_results(request, llm_payload)

        logger.debug(
            "Total score before clamp=%s, final=%s",
            total_score,
            max(0.0, min(10.0, total_score)),
        )
        return ScoringResponse(
            category_results=category_results,
            penalties_applied=llm_payload.penalties_applied,
            provider_used=self.provider,
            feedback=llm_payload.feedback,
            total_score=max(0.0, min(10.0, total_score)),
        )

    async def generate_batch_response(self, request: BatchScoringRequest) -> BatchScoringResponse:
        logger.debug(
            "generate_batch_response: start; request_count=%d",
            len(request.requests) if hasattr(request, "requests") and request.requests is not None else 0,
        )
        results = []
        for scoring_request in request.requests:
            try:
                result = await self.generate_response(scoring_request)
                results.append(result)
                logger.debug(
                    "Processed one request successfully; running_total=%d", len(results)
                )
            except Exception as e:
                logger.error("Error processing request: %s", e)
                logger.exception("Error processing request")

        logger.debug("Batch processing complete; total_processed=%d", len(results))
        return BatchScoringResponse(results=results, total_processed=len(results))

    # ---- Helpers ----
    def _build_headers(self) -> dict[str, str]:
        # No Authorization header for local LM Studio
        return {"Content-Type": "application/json"}

    def _build_payload(self, prompt: str) -> dict[str, Any]:
        # LM Studio local /api/generate typical payload
        return {
            "model": self.model,
            "prompt": prompt,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "top_k": self.top_k,
            "max_tokens": self.max_output_tokens,
            "stream": False,
        }

    def _extract_raw_text(self, result: dict[str, Any]) -> str:
        # Try common LM Studio /api/generate shapes
        try:
            if isinstance(result, dict):
                if "text" in result and isinstance(result["text"], str):
                    return result["text"]
                if "response" in result and isinstance(result["response"], str):
                    return result["response"]
                if "choices" in result and isinstance(result["choices"], list) and result["choices"]:
                    choice = result["choices"][0]
                    if isinstance(choice, dict):
                        if "message" in choice and isinstance(choice["message"], dict):
                            content = choice["message"].get("content")
                            if isinstance(content, str):
                                return content
                        if "text" in choice and isinstance(choice["text"], str):
                            return choice["text"]
        except Exception:
            logger.exception("Error while extracting raw text from LM Studio response")
        raise ValueError("Unexpected API response format for LM Studio result")



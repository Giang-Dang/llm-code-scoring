import httpx
import json
from typing import Dict, Any

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

    async def generate_response(self, request: ScoringRequest) -> ScoringResponse:
        self._validate_request(request)
        prompt = self._build_prompt(request)

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        payload = {
            "contents": [{
                "role": "user",
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": self.temperature,
                "maxOutputTokens": self.max_output_tokens,
                "topP": self.top_p,
                "topK": self.top_k
            }
        }

        async with httpx.AsyncClient(timeout=self.api_timeout) as client:
            response = await client.post(
                f"{self.base_url}/models/{self.model}:generateContent",
                headers=headers,
                json=payload
            )

            if response.status_code != 200:
                raise ValueError(
                    f"API request failed with status {response.status_code}: {response.text}")

            result = response.json()

        # Extract text from response
        try:
            raw_response = result["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            raise ValueError(f"Unexpected API response format: {e}")

        # Parse LLM response to structured payload
        llm_payload = self._parse_llm_response(raw_response)

        # Calculate weighted scores and total
        total_score = 0.0
        category_results = []

        for llm_category in llm_payload.category_results:
            # Find matching category from request to get weight
            category_weight = next(
                (c.weight for c in request.rubric.categories if c.name ==
                    llm_category.category_name),
                1.0
            )

            # Create category result with weight
            from app.models.scoring.responses import CategoryResult, CategoryBandDecision
            category = CategoryResult(
                category_name=llm_category.category_name,
                raw_score=llm_category.raw_score,
                weight=category_weight,
                band_decision=CategoryBandDecision(
                    min_score=llm_category.band_decision.min_score,
                    max_score=llm_category.band_decision.max_score,
                    description=llm_category.band_decision.description,
                    rationale=llm_category.band_decision.rationale
                )
            )
            category_results.append(category)
            total_score += llm_category.raw_score * category_weight

        # Apply penalties
        for penalty in llm_payload.penalties_applied:
            total_score += penalty.points  # Penalties are negative

        return ScoringResponse(
            category_results=category_results,
            penalties_applied=llm_payload.penalties_applied,
            provider_used=self.provider,
            feedback=llm_payload.feedback,
            total_score=max(0.0, min(10.0, total_score))  # Clamp between 0-10
        )

    async def generate_batch_response(self, request: BatchScoringRequest) -> BatchScoringResponse:
        results = []
        for scoring_request in request.requests:
            try:
                result = await self.generate_response(scoring_request)
                results.append(result)
            except Exception as e:
                # Log error and continue with remaining requests
                import logging
                logging.error(f"Error processing request: {e}")

        return BatchScoringResponse(
            results=results,
            total_processed=len(results)
        )

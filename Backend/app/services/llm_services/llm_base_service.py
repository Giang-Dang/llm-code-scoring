import logging
from typing import Any
from app.models.scoring.rubric import Rubric
from app.models.scoring.responses import CategoryBandDecision, CategoryResult, LLMScoringPayload, ScoringResponse
from app.models.scoring.requests import ScoringRequest
from app.models.common.llm_provider import LLMProvider
from app.models.batch_scoring.responses import BatchScoringResponse
from app.models.batch_scoring.requests import BatchScoringRequest
from abc import ABC, abstractmethod
from os import environ
import re
import json
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)


LLM_PROVIDER_URLS: dict[LLMProvider, tuple[str, str]] = {
    LLMProvider.OPENAI:   ("OPENAI_URL",   "https://api.openai.com/v1/chat/completions"),
    LLMProvider.GEMINI:   ("GEMINI_URL",   "https://generativelanguage.googleapis.com/v1beta"),
    LLMProvider.DEEPSEEK: ("DEEPSEEK_URL", "https://api.deepseek.com/v1/chat/completions"),
    LLMProvider.GROK:     ("GROK_URL",     "https://api.grok.com/v1/chat/completions"),
    LLMProvider.LMSTUDIO: ("LMSTUDIO_URL", "http://localhost:1234/api/generate"),
    LLMProvider.OLLAMA:   ("OLLAMA_URL",   "http://localhost:11434/api/generate"),
}

LLM_PROVIDER_API_KEYS: dict[LLMProvider, str] = {
    LLMProvider.OPENAI:   "OPENAI_API_KEY",
    LLMProvider.GEMINI:   "GEMINI_API_KEY",
    LLMProvider.DEEPSEEK: "DEEPSEEK_API_KEY",
    LLMProvider.GROK:     "GROK_API_KEY",
    LLMProvider.LMSTUDIO: "LMSTUDIO_API_KEY",
    LLMProvider.OLLAMA:   "OLLAMA_API_KEY",
}

LLM_PROVIDER_MODELS: dict[LLMProvider, str] = {
    LLMProvider.OPENAI:   "OPENAI_MODEL",
    LLMProvider.GEMINI:   "GEMINI_MODEL",
    LLMProvider.DEEPSEEK: "DEEPSEEK_MODEL",
    LLMProvider.GROK:     "GROK_MODEL",
    LLMProvider.LMSTUDIO: "LMSTUDIO_MODEL",
    LLMProvider.OLLAMA:   "OLLAMA_MODEL",
}


class LLMBaseService(ABC):
    @property
    @abstractmethod
    def provider(self) -> LLMProvider:
        raise NotImplementedError

    @property
    def temperature(self) -> float:
        return float(environ.get("TEMPERATURE", 0.0))

    @property
    def top_p(self) -> float:
        return float(environ.get("TOP_P", 0.90))

    @property
    def top_k(self) -> int:
        return int(environ.get("TOP_K", 5))

    @property
    def api_timeout(self) -> int:
        return int(environ.get("API_TIMEOUT", 120))

    @property
    def max_output_tokens(self) -> int:
        return int(environ.get("MAX_OUTPUT_TOKENS", 2000))

    @property
    def max_retries(self) -> int:
        return int(environ.get("MAX_RETRIES", 3))

    @property
    def base_url(self) -> str:
        try:
            env_key, default_url = LLM_PROVIDER_URLS[self.provider]
        except KeyError:
            raise NotImplementedError(f"Unsupported provider: {self.provider}")
        logger.debug("Resolving base_url for provider=%s", self.provider)
        logger.debug("Using env var %s with default %s", env_key, default_url)
        resolved = environ.get(env_key, default_url)
        logger.debug("Resolved base_url=%s", resolved)
        return resolved

    @property
    @abstractmethod
    def endpoint_url(self) -> str:
        raise NotImplementedError

    @property
    def api_key(self) -> str:
        try:
            env_key = LLM_PROVIDER_API_KEYS[self.provider]
        except KeyError:
            raise NotImplementedError(f"Unsupported provider: {self.provider}")
        logger.debug("Resolving api_key for provider=%s", self.provider)
        api_key = environ.get(env_key)
        masked = None
        if api_key:
            masked = (f"{api_key[:3]}...{api_key[-3:]}" if len(api_key) > 6 else "***")
        else:
            logger.warning("No API key found for provider=%s", self.provider)
        logger.debug("Resolved API key using env var %s; present=%s; masked=%s", env_key, api_key is not None, masked)
        return api_key

    @property
    def model(self) -> str:
        try:
            env_key = LLM_PROVIDER_MODELS[self.provider]
        except KeyError:
            raise NotImplementedError(f"Unsupported provider: {self.provider}")
        logger.debug("Resolving model for provider=%s", self.provider)
        model_name = environ.get(env_key)
        logger.debug("Resolved model using env var %s; model=%s", env_key, model_name)
        return model_name

    @property
    def prompt_name(self) -> str:
        return "scoring_prompt.yml"

    @abstractmethod
    def generate_response(self, request: ScoringRequest) -> ScoringResponse:
        raise NotImplementedError

    @abstractmethod
    def generate_batch_response(self, request: BatchScoringRequest) -> BatchScoringResponse:
        raise NotImplementedError

    def _validate_request(self, request: ScoringRequest) -> None:
        logger.debug("Validating scoring request")
        if not request.problem_description:
            logger.error("Validation failed: problem_description is missing")
            raise ValueError("Problem description is required")
        if not request.student_code:
            logger.error("Validation failed: student_code is missing")
            raise ValueError("Student code is required")
        if not request.programming_language:
            logger.error("Validation failed: programming_language is missing")
            raise ValueError("Programming language is required")
        if not request.rubric:
            logger.error("Validation failed: rubric is missing")
            raise ValueError("Rubric is required")
        logger.debug("Scoring request validation passed")

    def _build_prompt(self, request: ScoringRequest) -> str:
        prompt_template = self._load_prompt_template()
        logger.debug("Building prompt using template=%s", self.prompt_name)

        content = (
            prompt_template
            .replace("{rubric}", self._build_rubric_prompt(request.rubric))
            .replace("{programming_language}", request.programming_language)
            .replace("{problem_description}", request.problem_description)
            .replace("{student_code}", request.student_code)
        )
        logger.debug("Built prompt; length=%d chars", len(content))
        return content

    def _load_prompt_template(self) -> str:
        path = f"app/prompts/{self.prompt_name}"
        logger.debug("Loading prompt template from %s", path)
        with open(path, "r") as file:
            content = file.read()
        logger.debug("Loaded prompt template; length=%d chars", len(content))
        return content

    def _build_rubric_prompt(self, rubric: Rubric) -> str:
        parts = []

        categories_count = len(rubric.categories) if rubric and rubric.categories else 0
        penalties_count = len(rubric.penalties) if rubric and rubric.penalties else 0
        logger.debug("Building rubric prompt; categories=%d, penalties=%d", categories_count, penalties_count)

        for category in rubric.categories:
            parts.append(
                f'- category: "{category.name}", max_points: {category.max_points}, weight: {category.weight}'
            )
            for band in category.bands:
                parts.append(
                    f"  - band: [{band.min_score}-{band.max_score}] {band.description}"
                )
        if rubric.penalties:
            parts.append("Penalties:")
            for p in rubric.penalties:
                parts.append(
                    f'  - code: "{p.code}", points: {p.points}, desc: {p.description}')

        result = "\n".join(parts)
        logger.debug("Built rubric prompt; length=%d chars", len(result))
        return result

    def _parse_llm_response(self, response: str) -> LLMScoringPayload:
        """
        Parse a text response from the LLM and return a validated LLMScoringPayload.

        - Accepts responses with or without code fences (```json ... ```).
        - Tolerates '//' comments and trailing commas.
        - Validates the structure with Pydantic.
        """
        logger.debug("Parsing LLM response; length=%d chars", len(response) if response else 0)
        if not response or not response.strip():
            logger.error("Empty LLM response")
            raise ValueError("Empty LLM response")

        text = response.strip()

        # Prefer a fenced JSON block if present
        fenced = re.search(
            r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text, re.IGNORECASE)
        logger.debug("Detected fenced JSON block=%s", bool(fenced))
        candidate = fenced.group(1) if fenced else text

        # Extract first top-level JSON object
        start = candidate.find("{")
        if start == -1:
            logger.error("No JSON object found in LLM response")
            raise ValueError("No JSON object found in LLM response")
        sliced = candidate[start:]

        raw_json = self._extract_balanced(sliced)

        # Sanitize non-JSON features the LLM might include
        no_comments = re.sub(r"//.*?$", "", raw_json, flags=re.MULTILINE)
        no_trailing_commas = re.sub(r",\s*([}\]])", r"\1", no_comments)

        try:
            data = json.loads(no_trailing_commas)
        except json.JSONDecodeError as e:
            logger.exception("Failed to parse JSON from LLM response")
            raise ValueError(
                f"Failed to parse JSON from LLM response: {e}") from e

        try:
            # Pydantic v2 preferred
            if hasattr(LLMScoringPayload, "model_validate"):
                logger.debug("Validating LLMScoringPayload with model_validate")
                return LLMScoringPayload.model_validate(data)
            # Fallback for Pydantic v1
            logger.debug("Validating LLMScoringPayload with fallback path")
            return LLMScoringPayload.model_validate(data)
        except Exception as e:
            logger.exception("LLM payload validation error")
            raise ValueError(f"LLM payload validation error: {e}") from e

    def _extract_balanced(self, obj_text: str) -> str:
        """
        Extract the first balanced JSON object substring from the input text.

        - Scans from the first '{' and returns the substring up to the matching '}'.
        - Handles nested braces and ignores braces inside string literals.
        - Supports both single and double-quoted strings, and escaped quotes.
        - Returns the substring containing the balanced JSON object, or the input as a best-effort fallback.

        Args:
            obj_text (str): The text starting with a '{' character.

        Returns:
            str: The substring containing the first balanced JSON object.
        """
        logger.debug("Extracting balanced JSON substring; input length=%d", len(obj_text) if obj_text else 0)
        depth = 0
        in_str = False
        esc = False
        quote = ""
        for i, ch in enumerate(obj_text):
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == quote:
                    in_str = False
            else:
                if ch in ("'", '"'):
                    in_str = True
                    quote = ch
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        result = obj_text[: i + 1]
                        logger.debug("Extracted balanced JSON; length=%d", len(result))
                        return result
        return obj_text

    def _build_headers(self) -> dict[str, str]:
        api_key = self.api_key
        masked = (f"{api_key[:3]}...{api_key[-3:]}" if api_key and len(api_key) > 6 else "***")
        logger.debug("Building headers; api_key_present=%s masked=%s", bool(api_key), masked)
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }

    def _build_payload(self, prompt: str) -> dict[str, Any]:
        return {
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

    def _extract_raw_text(self, result: dict[str, Any]) -> str:
        try:
            return result["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            logger.exception("Unexpected API response format when extracting text")
            raise ValueError(f"Unexpected API response format: {e}")

    def _score_results(self, request: ScoringRequest, llm_payload: LLMScoringPayload) -> tuple[list[CategoryResult], float]:
        total_score = 0.0
        category_results: list[CategoryResult] = []

        for llm_category in llm_payload.category_results:
            category_weight = next(
                (c.weight for c in request.rubric.categories if c.name == llm_category.category_name),
                1.0,
            )
            logger.debug("Scoring category '%s': raw=%s, weight=%s", llm_category.category_name, llm_category.raw_score, category_weight)

            category = CategoryResult(
                category_name=llm_category.category_name,
                raw_score=llm_category.raw_score,
                weight=category_weight,
                band_decision=CategoryBandDecision(
                    min_score=llm_category.band_decision.min_score,
                    max_score=llm_category.band_decision.max_score,
                    description=llm_category.band_decision.description,
                    rationale=llm_category.band_decision.rationale,
                ),
            )
            category_results.append(category)
            total_score += llm_category.raw_score * category_weight

        for penalty in llm_payload.penalties_applied:
            total_score += penalty.points
            logger.debug("Applying penalty '%s': points=%s", getattr(penalty, 'code', 'unknown'), penalty.points)

        return category_results, total_score


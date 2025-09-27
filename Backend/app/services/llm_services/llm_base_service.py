from abc import abstractmethod
from os import environ
import re
import json
from dotenv import load_dotenv
load_dotenv()

from app.models.batch_scoring.requests import BatchScoringRequest
from app.models.batch_scoring.responses import BatchScoringResponse
from app.models.common.llm_provider import LLMProvider
from app.models.scoring.requests import ScoringRequest
from app.models.scoring.responses import LLMScoringPayload, ScoringResponse
from app.models.scoring.rubric import Rubric


LLM_PROVIDER_URLS: dict[LLMProvider, tuple[str, str]] = {
    LLMProvider.OPENAI:   ("OPENAI_URL",   "https://api.openai.com/v1/chat/completions"),
    LLMProvider.GEMINI:   ("GEMINI_URL",   "https://api.gemini.com/v1/chat/completions"),
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

class LLMBaseService:
    @property
    @abstractmethod
    def provider(self) -> LLMProvider:
        raise NotImplementedError

    @property
    @abstractmethod
    def temperature(self) -> float:
        return environ.get("TEMPERATURE", 0.0)

    @property
    @abstractmethod
    def top_p(self) -> float:
        return environ.get("TOP_P", 0.90)
    
    @property
    @abstractmethod
    def top_k(self) -> int:
        return int(environ.get("TOP_K", 5))

    @property
    @abstractmethod
    def api_timeout(self) -> int:
        return int(environ.get("API_TIMEOUT", 120))

    @property
    @abstractmethod
    def max_output_tokens(self) -> int:
        return int(environ.get("MAX_OUTPUT_TOKENS", 2000))
    
    @property
    @abstractmethod
    def max_retries(self) -> int:
        return int(environ.get("MAX_RETRIES", 3))
    
    @property
    @abstractmethod
    def base_url(self) -> str:
        try:
            env_key, default_url = LLM_PROVIDER_URLS[self.provider]
        except KeyError:
            raise NotImplementedError(f"Unsupported provider: {self.provider}")
        return environ.get(env_key, default_url)

    @property
    @abstractmethod
    def api_key(self) -> str:
        try:
            env_key = LLM_PROVIDER_API_KEYS[self.provider]
        except KeyError:
            raise NotImplementedError(f"Unsupported provider: {self.provider}")
        return environ.get(env_key)
    
    @property
    @abstractmethod
    def model(self) -> str:
        try:
            env_key = LLM_PROVIDER_MODELS[self.provider]
        except KeyError:
            raise NotImplementedError(f"Unsupported provider: {self.provider}")
        return environ.get(env_key)

    @property
    @abstractmethod
    def prompt_name(self) -> str:
        return "scoring_prompt.yml"

    @abstractmethod
    def generate_response(self, request: ScoringRequest) -> ScoringResponse:
        raise NotImplementedError

    @abstractmethod
    def generate_batch_response(self, request: BatchScoringRequest) -> BatchScoringResponse:
        raise NotImplementedError

    def _validate_request(self, request: ScoringRequest) -> None:
        if not request.problem_description:
            raise ValueError("Problem description is required")
        if not request.student_code:
            raise ValueError("Student code is required")
        if not request.programming_language:
            raise ValueError("Programming language is required")
        if not request.rubric:
            raise ValueError("Rubric is required")

    def _build_prompt(self, request: ScoringRequest) -> str:
        prompt_template = self._load_prompt_template()

        return prompt_template.format(
            role=self._build_role_constraints_prompt(),
            rules=self._build_scoring_rules_and_guardrails_prompt(),
            rubric=self._build_rubric_prompt(request.rubric),
            programming_language=request.programming_language,
            student_code=request.student_code,
        )

    def _load_prompt_template(self) -> str:
        with open(f"app/prompts/{self.prompt_name}", "r") as file:
            return file.read()

    def _build_rubric_prompt(self, rubric: Rubric) -> str:
        parts = []

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
                parts.append(f'  - code: "{p.code}", points: {p.points}, desc: {p.description}')

        return "\n".join(parts)

    def _parse_llm_response(self, response: str) -> LLMScoringPayload:
        """
        Parse a text response from the LLM and return a validated LLMScoringPayload.

        - Accepts responses with or without code fences (```json ... ```).
        - Tolerates '//' comments and trailing commas.
        - Validates the structure with Pydantic.
        """
        if not response or not response.strip():
            raise ValueError("Empty LLM response")

        text = response.strip()

        # Prefer a fenced JSON block if present
        fenced = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text, re.IGNORECASE)
        candidate = fenced.group(1) if fenced else text

        # Extract first top-level JSON object
        start = candidate.find("{")
        if start == -1:
            raise ValueError("No JSON object found in LLM response")
        sliced = candidate[start:]

        raw_json = self._extract_balanced(sliced)

        # Sanitize non-JSON features the LLM might include
        no_comments = re.sub(r"//.*?$", "", raw_json, flags=re.MULTILINE)
        no_trailing_commas = re.sub(r",\s*([}\]])", r"\1", no_comments)

        try:
            data = json.loads(no_trailing_commas)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON from LLM response: {e}") from e

        try:
            # Pydantic v2 preferred
            if hasattr(LLMScoringPayload, "model_validate"):
                return LLMScoringPayload.model_validate(data)
            # Fallback for Pydantic v1
            return LLMScoringPayload.model_validate(data)
        except Exception as e:
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
                        return obj_text[: i + 1]
        return obj_text

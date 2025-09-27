from app.models.common.llm_provider import LLMProvider
from app.services.llm_services.gemini_service import GeminiService
from app.services.llm_services.llm_base_service import LLMBaseService
from app.services.llm_services.lmstudio_service import LMStudioService


class LLMCommonService:
    @staticmethod
    def get_llm_service(provider: LLMProvider) -> LLMBaseService:
        if provider == LLMProvider.GEMINI:
            return GeminiService()
        if provider == LLMProvider.LMSTUDIO:
            return LMStudioService()
        return None

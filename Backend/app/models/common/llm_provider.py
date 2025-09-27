from enum import Enum


class LLMProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    DEEPSEEK = "deepseek"
    GROK = "grok"
    LMSTUDIO = "lmstudio"
    OLLAMA = "ollama"
# LLM Code Scoring — Backend

FastAPI service that scores student code against a rubric using pluggable LLM providers (Gemini, LM Studio, etc.). It builds a prompt from your rubric and request, calls the configured provider, parses the LLM output into structured results, and computes a weighted total score with penalties.

---

## Quick start

```bash
# From the Backend/ directory
python -m venv .venv
source .venv/bin/activate    # Linux / macOS
# On Windows (PowerShell):
# .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt

# Create a .env with your settings (see Environment variables)
# Then run the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug --env-file .env.development
```

API will be available at `http://localhost:8000`.

- Root health: `GET /` → `{ "message": "Hello World" }`
- Score endpoint: `POST /score`

---

## Environment variables

The backend is configured via environment variables. Create a `.env` file in `Backend/` (or export env vars another way). The service loads `.env` via `python-dotenv`.

Core generation controls:

- `TEMPERATURE` (float, default `0.0`)
- `TOP_P` (float, default `0.90`)
- `TOP_K` (int, default `5`)
- `API_TIMEOUT` (seconds, default `120`)
- `MAX_OUTPUT_TOKENS` (int, default `2000`)
- `MAX_RETRIES` (int, default `3`) — reserved
- `LOG_LEVEL` (`CRITICAL|ERROR|WARNING|INFO|DEBUG`, default `INFO`)

Provider endpoints, API keys, and models:

- `OPENAI_URL` (default `https://api.openai.com/v1/chat/completions`)
- `GEMINI_URL` (default `https://generativelanguage.googleapis.com/v1beta`)
- `DEEPSEEK_URL` (default `https://api.deepseek.com/v1/chat/completions`)
- `GROK_URL` (default `https://api.grok.com/v1/chat/completions`)
- `LMSTUDIO_URL` (default `http://localhost:1234/api/generate`)
- `OLLAMA_URL` (default `http://localhost:11434/api/generate`)

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `DEEPSEEK_API_KEY`
- `GROK_API_KEY`
- `LMSTUDIO_API_KEY` (often not required for local)
- `OLLAMA_API_KEY` (often not required for local)

- `OPENAI_MODEL`
- `GEMINI_MODEL` (e.g., `gemini-1.5-pro`)
- `DEEPSEEK_MODEL`
- `GROK_MODEL`
- `LMSTUDIO_MODEL` (e.g., local model name in LM Studio)
- `OLLAMA_MODEL` (e.g., `llama3.1`)

Example `.env` (Gemini):

```env
LOG_LEVEL=DEBUG
TEMPERATURE=0.0
TOP_P=0.9
TOP_K=5
API_TIMEOUT=120
MAX_OUTPUT_TOKENS=1500

GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-pro
GEMINI_URL=https://generativelanguage.googleapis.com/v1beta
```

LM Studio (local):

```env
LMSTUDIO_URL=http://localhost:1234
LMSTUDIO_MODEL=your-local-model
```

---

## Running

- Development (auto-reload):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Production (example):

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

Logs are written to `Backend/logs/` and level is controlled by `LOG_LEVEL`. A default `logging_settings.json` is applied and paths are normalized at runtime.

---

## API

High-level docs live in `Backend/API.md`. Summary below.

- Path: `POST /score`
- Body: `ScoringRequest`
- Response: `ScoringResponse`

ScoringRequest:

```json
{
  "llm_provider": "gemini",
  "problem_description": "Write a function to compute gcd(a, b) using Euclid's algorithm.",
  "student_code": "int gcd(int a,int b){while(b){int t=a%b;a=b;b=t;}return a;}",
  "programming_language": "cpp",
  "rubric": {
    "categories": [
      {
        "name": "correctness",
        "max_points": 10,
        "weight": 0.7,
        "bands": [
          {
            "min_score": 0,
            "max_score": 4,
            "description": "Fails common cases"
          },
          { "min_score": 5, "max_score": 8, "description": "Mostly correct" },
          {
            "min_score": 9,
            "max_score": 10,
            "description": "Correct and robust"
          }
        ]
      },
      {
        "name": "readability",
        "max_points": 10,
        "weight": 0.3,
        "bands": [
          { "min_score": 0, "max_score": 4, "description": "Hard to read" },
          { "min_score": 5, "max_score": 8, "description": "Reasonably clear" },
          {
            "min_score": 9,
            "max_score": 10,
            "description": "Clear and idiomatic"
          }
        ]
      }
    ],
    "penalties": [
      {
        "code": "io_handling",
        "description": "Missing input validation",
        "points": -2
      }
    ]
  },
  "language": "Vietnamese"
}
```

cURL:

```bash
curl -X POST "http://localhost:8000/score" \
  -H "Content-Type: application/json" \
  -d @request.json
```

Response (example):

```json
{
  "category_results": [
    {
      "category_name": "correctness",
      "raw_score": 9.0,
      "weight": 0.7,
      "band_decision": {
        "min_score": 9,
        "max_score": 10,
        "description": "Correct and robust",
        "rationale": "Handles typical and edge cases"
      }
    },
    {
      "category_name": "readability",
      "raw_score": 8.0,
      "weight": 0.3,
      "band_decision": {
        "min_score": 5,
        "max_score": 8,
        "description": "Reasonably clear",
        "rationale": "Concise but lacks comments"
      }
    }
  ],
  "penalties_applied": [
    { "code": "io_handling", "points": -2, "reason": "No input validation" }
  ],
  "provider_used": "gemini",
  "feedback": "Giải pháp chính xác, nên thêm kiểm tra input.",
  "total_score": 8.3
}
```

Notes:

- The endpoint is mounted without a prefix; full path is `/score`.
- `programming_language` currently supports only `"cpp"`.
- The concrete LLM service is selected by `llm_provider`.

---

## Providers

Implemented:

- Gemini: uses `x-goog-api-key` header and `models/{model}:generateContent` endpoint.
- LM Studio: local server via REST Chat Completions. Normalizes typical LM Studio URLs to `/api/v0/chat/completions`.

Placeholders present for additional providers via the common base service. Add a new provider by implementing `LLMBaseService` and registering it in `LLMCommonService.get_llm_service`.

---

## Prompts and scoring

- Prompt template: `app/prompts/scoring_prompt.yml`. The service fills placeholders: `{rubric}`, `{programming_language}`, `{problem_description}`, `{student_code}`, `{language}`.
- The LLM is expected to return structured JSON (optionally fenced). The backend sanitizes comments and trailing commas and validates against `LLMScoringPayload`.
- Final `total_score` is computed as the weighted sum of category raw scores plus any penalties, then clamped to `[0, 10]`.

---

## Logging

- Configured at startup via `app.core.logging_config.configure_logging()`.
- Honors `LOG_LEVEL` and uses `Backend/logging_settings.json` if present; otherwise a sane default.
- Logs are rotated daily into `Backend/logs/`: `app.log`, `error.log`, `access.log`.

---

## Project structure (Backend)

```
Backend/
  app/
    api/                # FastAPI routers (e.g., /score)
    core/               # logging configuration
    models/             # pydantic models for requests/responses
    prompts/            # prompt templates
    services/           # LLM provider services
    main.py             # FastAPI app factory
  logs/                 # created on first run
  logging_settings.json # optional logging config
  requirements.txt
  API.md                # endpoint reference for /score
```

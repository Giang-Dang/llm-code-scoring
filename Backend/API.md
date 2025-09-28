### POST /score

Score a student's code submission against a rubric using a selected LLM provider.

- Base URL: depends on your deployment (e.g., `http://localhost:8000`)
- Method: POST
- Content-Type: application/json
- Response: application/json

#### Request body
Fields:
- `llm_provider` (string, required): one of `openai`, `gemini`, `deepseek`, `grok`, `lmstudio`, `ollama`.
- `problem_description` (string, required): description of the programming problem to solve.
- `student_code` (string, required): the code to be scored.
- `programming_language` (string, optional): currently only `"cpp"` is supported. Defaults to `"cpp"`.
- `rubric` (object, required): scoring rubric.
  - `categories` (array of objects, required):
    - `name` (string, required)
    - `max_points` (int, 0–10, default 10)
    - `weight` (float, 0–1, default 1)
    - `bands` (array of objects, required):
      - `min_score` (int, 0–10)
      - `max_score` (int, 0–10)
      - `description` (string)
  - `penalties` (array of objects, optional, default empty):
    - `code` (string)
    - `description` (string)
    - `points` (float) — negative values deduct points
- `language` (string, optional): language for feedback text (e.g., `"Vietnamese"`). Default `"Vietnamese"`.

Example:
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
          { "min_score": 0,  "max_score": 4,  "description": "Fails common cases" },
          { "min_score": 5,  "max_score": 8,  "description": "Mostly correct" },
          { "min_score": 9,  "max_score": 10, "description": "Correct and robust" }
        ]
      },
      {
        "name": "readability",
        "max_points": 10,
        "weight": 0.3,
        "bands": [
          { "min_score": 0,  "max_score": 4,  "description": "Hard to read" },
          { "min_score": 5,  "max_score": 8,  "description": "Reasonably clear" },
          { "min_score": 9,  "max_score": 10, "description": "Clear and idiomatic" }
        ]
      }
    ],
    "penalties": [
      { "code": "io_handling", "description": "Missing input validation", "points": -2 }
    ]
  },
  "language": "Vietnamese"
}
```

#### Responses
200 OK
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

Error responses
- 400 Bad Request: validation or parsing error (e.g., malformed rubric or values out of bounds).
- 502 Bad Gateway: unexpected error while scoring or from the upstream LLM.

#### Notes
- The endpoint is mounted without a prefix; full path is `/score`.
- The service selects the concrete LLM implementation via `llm_provider`.
- `programming_language` is currently limited to `"cpp"` and defaults to it.


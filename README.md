# LLM Code Scoring System

An automated code grading system powered by Large Language Models (LLMs) for evaluating student programming assignments. The system provides a complete solution with a FastAPI backend and a modern Next.js frontend interface.

## Overview

This project enables educators to:
- Define programming questions with detailed rubrics
- Submit student code for automated evaluation
- Receive AI-generated scores and feedback
- Support multiple programming languages
- Export results in various formats

The system leverages state-of-the-art LLMs (Gemini, OpenAI, DeepSeek, Grok, LM Studio, Ollama) to provide consistent, detailed, and educational feedback on code submissions.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
  - [Rubric-Based Grading](#rubric-based-grading)
  - [Multi-Language Support](#multi-language-support)
  - [LLM Provider Support](#llm-provider-support)
  - [Batch Processing](#batch-processing)
  - [Results & Export](#results--export)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Configuration](#configuration)
  - [Backend Environment Variables](#backend-environment-variables)
  - [Frontend Environment Variables](#frontend-environment-variables)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
  - [Backend Structure](#backend-structure)
  - [Frontend Structure](#frontend-structure)
- [Workflow](#workflow)
- [Development](#development)
  - [Backend Development](#backend-development)
  - [Frontend Development](#frontend-development)
- [Testing](#testing)
  - [Backend Tests](#backend-tests)
  - [API Testing](#api-testing)
- [Deployment](#deployment)
  - [Backend Deployment](#backend-deployment)
  - [Frontend Deployment](#frontend-deployment)
- [Security Considerations](#security-considerations)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Acknowledgments](#acknowledgments)

## Architecture

```
llm-code-scoring/
├── Backend/           # FastAPI backend service
├── Frontend/          # Next.js web application
│   └── fe-code-scoring/
└── Samples/           # Sample data and examples
```

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **LLM Integration**: Multiple provider support
- **API**: RESTful endpoint for code scoring
- **Logging**: Structured logging with rotation
- **Validation**: Pydantic models for request/response

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 + TailwindCSS 4
- **Features**: Multi-step workflow, batch processing, real-time results
- **Code Editor**: CodeMirror with syntax highlighting

## Features

### Rubric-Based Grading
- Define custom scoring categories with weights
- Flexible score bands with descriptions
- Support for penalty deductions
- Automatic weight validation

### Multi-Language Support
- Python
- JavaScript/TypeScript
- C++
- Java
- Extensible for additional languages

### LLM Provider Support
- **Google Gemini**: 2.0/2.5 Flash, Pro models
- **OpenAI**: GPT-3.5, GPT-4 series
- **DeepSeek**: DeepSeek models
- **Grok**: xAI models
- **LM Studio**: Local model hosting
- **Ollama**: Local open-source models

### Batch Processing
- Upload multiple submissions at once
- Process files from TXT format
- Real-time progress tracking
- Concurrent grading with status updates

### Results & Export
- Detailed score breakdowns by category
- AI-generated feedback and comments
- Export to CSV or JSON
- Individual submission review

## Quick Start

### Prerequisites

**Backend:**
- Python 3.10 or higher
- Conda (recommended) or pip
- API keys for chosen LLM provider(s)

**Frontend:**
- Node.js 20.x or higher
- npm 10.x or higher

### Installation

#### 1. Backend Setup

```bash
cd Backend

# Create conda environment
conda env create -f environment.yml
conda activate llm-code-scoring

# Or use pip
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

#### 2. Frontend Setup

```bash
cd Frontend/fe-code-scoring

# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### Running the Application

#### Start Backend Server

```bash
cd Backend
conda activate llm-code-scoring

# Development
uvicorn app.main:app --reload --port 8000

# Production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Start Frontend Server

```bash
cd Frontend/fe-code-scoring

# Development
npm run dev

# Production
npm run build
npm start
```

Access the application at `http://localhost:3000`

## Configuration

### Backend Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
# Required: Choose your LLM provider(s)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
GROK_API_KEY=your_grok_api_key

# Optional: Model selection
GEMINI_MODEL=gemini-2.0-flash-lite
OPENAI_MODEL=gpt-4o-mini

# Optional: Local providers
LMSTUDIO_BASE_URL=http://localhost:1234/v1
OLLAMA_BASE_URL=http://localhost:11434

# Server configuration
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000
```

### Frontend Environment Variables

Create a `.env.local` file in the `Frontend/fe-code-scoring/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Documentation

### POST /score

Score a student's code submission against a rubric.

**Endpoint:** `POST /score`

**Request Body:**
```json
{
  "llm_provider": "gemini",
  "problem_description": "Write a function to compute factorial",
  "student_code": "def factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)",
  "programming_language": "python",
  "rubric": {
    "categories": [
      {
        "name": "correctness",
        "max_points": 10,
        "weight": 0.7,
        "bands": [
          { "min_score": 0, "max_score": 4, "description": "Incorrect logic" },
          { "min_score": 5, "max_score": 8, "description": "Mostly correct" },
          { "min_score": 9, "max_score": 10, "description": "Fully correct" }
        ]
      },
      {
        "name": "code_quality",
        "max_points": 10,
        "weight": 0.3,
        "bands": [
          { "min_score": 0, "max_score": 5, "description": "Poor quality" },
          { "min_score": 6, "max_score": 10, "description": "Good quality" }
        ]
      }
    ]
  },
  "language": "English"
}
```

**Response:**
```json
{
  "final_score": 8.5,
  "category_scores": {
    "correctness": { "raw_score": 9.0, "weighted_score": 6.3 },
    "code_quality": { "raw_score": 7.0, "weighted_score": 2.1 }
  },
  "feedback": "The solution correctly implements factorial...",
  "comments": "Consider adding input validation..."
}
```

See `Backend/API.md` for complete API documentation.

## Project Structure

### Backend Structure

```
Backend/
├── app/
│   ├── api/                    # API endpoints
│   │   └── routes/
│   │       └── scoring.py      # /score endpoint
│   ├── core/                   # Core configuration
│   │   ├── config.py           # Settings management
│   │   └── logging_config.py   # Logging setup
│   ├── models/                 # Pydantic models
│   │   ├── request.py          # Request schemas
│   │   └── response.py         # Response schemas
│   ├── services/               # Business logic
│   │   └── llm_services/       # LLM integrations
│   │       ├── gemini_service.py
│   │       ├── openai_service.py
│   │       └── ...
│   └── main.py                 # Application entry
├── tests/                      # Test suite
├── requirements.txt            # Python dependencies
└── environment.yml             # Conda environment
```

### Frontend Structure

```
Frontend/fe-code-scoring/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/             # React components
│   │   ├── QuestionForm.tsx
│   │   ├── RubricBuilder.tsx
│   │   ├── CodeInput.tsx
│   │   ├── BatchUpload.tsx
│   │   ├── GradingSettings.tsx
│   │   ├── ReviewConfirm.tsx
│   │   ├── Results.tsx
│   │   └── Stepper.tsx
│   ├── services/               # API integration
│   │   └── gradingService.ts
│   ├── state/                  # State management
│   │   └── appState.tsx
│   └── types/                  # TypeScript types
│       └── index.ts
├── package.json
└── tsconfig.json
```

## Workflow

1. **Question Setup**: Define the programming problem with constraints and expected format
2. **Rubric Creation**: Build scoring categories with weights and score bands
3. **Code Submission**: Upload student code (single or batch)
4. **Configuration**: Select AI model and output language
5. **Review**: Validate all settings before grading
6. **Grading**: Automated evaluation with real-time progress
7. **Results**: View detailed scores, feedback, and export data

## Development

### Backend Development

```bash
# Install development dependencies
pip install -r requirements.txt

# Run tests
pytest

# Code formatting
black app/
ruff check app/

# Type checking
mypy app/
```

### Frontend Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build
```

## Testing

### Backend Tests

```bash
cd Backend
pytest tests/ -v
```

### API Testing

Use the provided samples in `Samples/` directory or test with curl:

```bash
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d @samples/sample_request.json
```

## Deployment

### Backend Deployment

**Docker:**
```bash
cd Backend
docker build -t llm-code-scoring-backend .
docker run -p 8000:8000 --env-file .env llm-code-scoring-backend
```

**Traditional:**
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment

**Vercel (Recommended):**
```bash
cd Frontend/fe-code-scoring
vercel deploy
```

**Docker:**
```bash
cd Frontend/fe-code-scoring
docker build -t llm-code-scoring-frontend .
docker run -p 3000:3000 llm-code-scoring-frontend
```

## Security Considerations

- Store API keys in environment variables, never in code
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs
- Keep dependencies updated
- Use secure CORS configuration

## Performance

- Backend supports concurrent request processing
- Frontend implements optimistic UI updates
- Batch processing with progress tracking
- Efficient state management with React Context
- Code splitting and lazy loading in Next.js

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check Python version (3.10+)
- Verify API keys in `.env`
- Ensure all dependencies installed

**Frontend can't connect to backend:**
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check backend is running on correct port
- Review CORS settings in backend

**Grading fails:**
- Verify API key is valid
- Check LLM provider status
- Review request payload format
- Check backend logs in `Backend/logs/`

### Code Style

**Backend:**
- Follow PEP 8
- Use type hints
- Write docstrings
- Format with Black

**Frontend:**
- Use TypeScript strict mode
- Follow React best practices
- Use kebab-case for files
- Use PascalCase for components

## Acknowledgments

- Built with FastAPI and Next.js
- Powered by Google Gemini, OpenAI, and other LLM providers
- Uses CodeMirror for code editing
- Styled with TailwindCSS

---

**Version:** 0.1.0  
**Last Updated:** October 2025

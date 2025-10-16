# LLM Code Scoring - Frontend

A modern, intuitive web application for automated code grading powered by Large Language Models (LLMs). Built with Next.js 15, React 19, and TailwindCSS 4.

## Overview

This frontend application provides a comprehensive interface for educators to:
- Define grading questions and rubrics
- Upload student code submissions (single or batch)
- Configure AI-powered grading settings
- Review and validate grading results
- Export results in multiple formats

## Features

### Question Management
- Create detailed programming questions with constraints
- Define expected output formats
- Support for multiple programming languages

### Rubric Builder
- Visual rubric category creation
- Flexible scoring bands with descriptions
- Weight distribution validation
- Category preview modals

### Code Submission
- **Single Submission**: Direct code input with syntax highlighting
- **Batch Upload**: multiple TXT file upload for multiple students
- Language auto-detection
- Real-time validation

### Grading Configuration
- Multiple AI model selection (Gemini 2.0/2.5 Flash, Pro)
- Output language customization
- Review & confirm workflow

### Results Dashboard
- Real-time grading progress
- Detailed score breakdowns by category
- AI-generated feedback and comments
- Export to CSV/JSON
- Individual submission review

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Code Editor**: [CodeMirror](https://codemirror.net/) with language support
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **State Management**: React Context API with useReducer
- **File Parsing**: [PapaParse](https://www.papaparse.com/) for CSV

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main application page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── BatchUpload.tsx    # Batch file upload
│   ├── CodeInput.tsx      # Code submission tabs
│   ├── GradingSettings.tsx # AI model configuration
│   ├── QuestionForm.tsx   # Question definition
│   ├── Results.tsx        # Grading results display
│   ├── ReviewConfirm.tsx  # Pre-grading review
│   ├── RubricBuilder.tsx  # Rubric creation
│   ├── SingleSubmission.tsx # Single code input
│   └── Stepper.tsx        # Progress stepper
├── services/              # API services
│   └── gradingService.ts  # Backend communication
├── state/                 # State management
│   └── appState.tsx       # Global app state
└── types/                 # TypeScript definitions
    └── index.ts           # Type definitions

```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher (or yarn/pnpm)
- **Backend API**: Running instance of the LLM Code Scoring backend

### Installation

1. **Clone the repository**
   ```bash
   cd Frontend/fe-code-scoring
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## UI/UX Features

### Design System
- **Color Palette**: Neutral grays with accent colors per section
  - Blue/Indigo: Questions
  - Amber/Orange: Rubrics
  - Teal/Emerald: Code Submissions
  - Purple/Pink: Settings
- **Typography**: System fonts with Geist Sans
- **Components**: Custom-designed cards, modals, buttons
- **Responsive**: Mobile-first design

### User Flow
1. **Question Setup** → Define the programming problem
2. **Rubric Creation** → Build scoring criteria
3. **Code Upload** → Submit student code
4. **Settings** → Configure AI grading
5. **Review** → Validate configuration
6. **Results** → View and export grades

## API Integration

The frontend communicates with the backend API at `/score` endpoint:

```typescript
// Example API call
const result = await gradeSubmission(
  submission,
  state.question,
  state.rubric,
  state.ui.model,
  state.ui.outputLanguage
);
```

## Key Components

### State Management
```typescript
// Global state structure
{
  question: { title, prompt, constraints, expectedFormat },
  rubric: { categories: [...] },
  submissions: [...],
  ui: { step, model, outputLanguage },
  grading: { results: {...}, status: {...} }
}
```

### Rubric Category
```typescript
{
  id: string,
  name: string,
  description: string,
  max_points: number,
  weight: number,
  bands: [{ min, max, description }]
}
```

### Submission
```typescript
{
  id: string,
  name: string,
  language: string,
  code: string,
  rubricScores: {...},
  finalScore: number
}
```

## Styling Guidelines

- **Utility-first**: TailwindCSS classes
- **Consistent spacing**: 4px base unit
- **Border radius**: `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px)
- **Shadows**: Subtle elevation with `shadow-sm`, `shadow-md`
- **Transitions**: Smooth hover states with `transition-colors`, `transition-all`

## Code Quality

- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Component structure**: Single responsibility principle
- **File naming**: kebab-case for files, PascalCase for components

## Build & Deploy

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Deployment Platforms
- **Vercel**: Recommended (zero-config)
- **Netlify**: Supported
- **Docker**: Custom deployment

## Related

- **Backend API**: `../Backend/` - FastAPI backend service
- **Documentation**: See `API.md` in backend for API details

---

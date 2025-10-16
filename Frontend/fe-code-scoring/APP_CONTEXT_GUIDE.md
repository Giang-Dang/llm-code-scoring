# App Context Guide

## Overview

Your application already has a complete **AppState Context** system that stores all data across steps. Data persists when navigating between steps.

## Architecture

### 1. State Structure (`appState.tsx`)

```typescript
AppState = {
  question: {
    title: string
    prompt: string
    constraints: string
    expectedFormat: string
  },
  rubric: {
    categories: RubricCategory[]
    penalties: PenaltyRule[]
  },
  submissions: Submission[],
  ui: {
    step: 1 | 2 | 3 | 4
    provider: LLMProvider
    outputLanguage: string
  }
}
```

### 2. Data Persistence

**Step 1 - Define Question:**
- Data stored in `state.question`
- Persists when navigating to Step 2, 3, or 4

**Step 2 - Define Rubric:**
- Data stored in `state.rubric`
- Persists across all steps

**Step 3 - Submit Code:**
- Data stored in `state.submissions[]`
- Each submission added via `submissions/add` action
- All submissions persist when navigating back/forward

**Step 4 - Dashboard:**
- Reads from `state.submissions[]` and `state.rubric`
- All data available for grading

### 3. How It Works

#### Provider Setup
```typescript
// In page.tsx
<AppStateProvider>
  <AppContent />
</AppStateProvider>
```

#### Using the Context
```typescript
// In any component
import { useAppState } from "@/state/appState";

function MyComponent() {
  const { state, dispatch } = useAppState();
  
  // Read data
  const currentStep = state.ui.step;
  const submissions = state.submissions;
  
  // Update data
  dispatch({ type: "ui/setStep", step: 2 });
  dispatch({ type: "submissions/add", submission: newSubmission });
}
```

### 4. Available Actions

**UI Actions:**
- `ui/setStep` - Navigate between steps
- `ui/setProvider` - Change LLM provider
- `ui/setOutputLanguage` - Change output language

**Question Actions:**
- `question/update` - Update question data

**Rubric Actions:**
- `rubric/set` - Set entire rubric
- `rubric/addCategory` - Add rubric category
- `rubric/updateCategory` - Update category
- `rubric/reorder` - Reorder categories
- `rubric/deleteCategory` - Delete category

**Submission Actions:**
- `submissions/add` - Add new submission
- `submissions/update` - Update submission
- `submissions/set` - Replace all submissions

### 5. Current Implementation

**CodeInput Component:**
```typescript
// Already using context correctly
const { state, dispatch } = useAppState();

// Adding submissions
dispatch({
  type: "submissions/add",
  submission: {
    id: generateId("sub"),
    name: studentName,
    language: language,
    code: code,
    // ... other fields
  }
});

// Navigating steps
dispatch({ type: "ui/setStep", step: 4 });
```

## Benefits

✅ **Data Persistence:** All data persists across step navigation
✅ **Centralized State:** Single source of truth
✅ **Type Safety:** Full TypeScript support
✅ **Predictable Updates:** Redux-style reducer pattern
✅ **No Props Drilling:** Access state from any component

## Example: Navigating Between Steps

```typescript
// User fills out question in Step 1
dispatch({ type: "question/update", update: { title: "My Question" } });

// Navigate to Step 2
dispatch({ type: "ui/setStep", step: 2 });

// Question data still available
console.log(state.question.title); // "My Question"

// Navigate back to Step 1
dispatch({ type: "ui/setStep", step: 1 });

// Data still there!
console.log(state.question.title); // "My Question"
```

## Summary

Your application **already has** a complete context system that:
- Stores all data centrally
- Persists data across step navigation
- Provides type-safe access to state
- Uses a reducer pattern for predictable updates

No additional context creation needed - the system is already working! 🎉

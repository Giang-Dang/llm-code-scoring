"use client";

import { Stepper } from "./Stepper";
import { useAppState } from "@/state/appState";
import { useAlert } from "./Alert";

export function Header() {
  const { state, dispatch } = useAppState();
  const alertModal = useAlert();
  
  // Validation functions
  const isStep1Valid = () => {
    return state.question.title.trim() !== "" && state.question.prompt.trim() !== "";
  };
  
  const isStep2Valid = () => {
    if (state.rubric.categories.length === 0) return false;
    const totalWeight = state.rubric.categories.reduce((sum, cat) => sum + cat.weight, 0);
    return Math.abs(totalWeight - 1) < 0.01;
  };
  
  const isStep3Valid = () => {
    return state.submissions.length > 0;
  };
  
  const steps = [
    { id: 1, label: "Question", isValid: true }, // Always accessible
    { id: 2, label: "Rubric", isValid: isStep1Valid() },
    { id: 3, label: "Code", isValid: isStep1Valid() && isStep2Valid() },
    { id: 4, label: "Settings", isValid: isStep1Valid() && isStep2Valid() && isStep3Valid() },
    { id: 5, label: "Review", isValid: isStep1Valid() && isStep2Valid() && isStep3Valid() },
    { id: 6, label: "Dashboard", isValid: isStep1Valid() && isStep2Valid() && isStep3Valid() },
  ];
  const handleStepSelect = async (id: number) => {
    const targetStep = steps.find(s => s.id === id);
    
    // Allow going back to any previous step
    if (id <= state.ui.step) {
      dispatch({ type: "ui/setStep", step: id as 1 | 2 | 3 | 4 | 5 | 6 });
      return;
    }
    
    // Check if target step is valid
    if (!targetStep?.isValid) {
      // Show specific error message based on which step is invalid
      if (id >= 2 && !isStep1Valid()) {
        await alertModal({
          title: "Question Required",
          message: "Please complete the Question step (title and description) before proceeding.",
          tone: "warning"
        });
      } else if (id >= 3 && !isStep2Valid()) {
        await alertModal({
          title: "Rubric Required",
          message: "Please complete the Rubric step (add categories with weights summing to 100%) before proceeding.",
          tone: "warning"
        });
      } else if (id >= 4 && !isStep3Valid()) {
        await alertModal({
          title: "Code Submissions Required",
          message: "Please add at least one code submission before proceeding.",
          tone: "warning"
        });
      }
      return;
    }
    
    dispatch({ type: "ui/setStep", step: id as 1 | 2 | 3 | 4 | 5 | 6 });
  };
  
  return (
    <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">RubricScore</div>
          <Stepper steps={steps} active={state.ui.step} onSelect={handleStepSelect} />
        </div>
        <div className="flex items-center gap-4 text-sm">
        </div>
      </div>
    </header>
  );
}



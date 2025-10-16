"use client";

import { useAppState } from "@/state/appState";
import { useAlert } from "./Alert";

export function QuestionForm() {
  const { state, dispatch } = useAppState();
  const { question } = state;
  const alertModal = useAlert();

  function useExample() {
    dispatch({
      type: "question/update",
      update: {
        title: "Day of the year",
        prompt: `Write a program in C++ that reads a date string from input and outputs the day number of the year. The input date will be given in the Gregorian calendar and formatted as YYYY-MM-DD.  

Input: A single line containing a date string in the format YYYY-MM-DD.  
Output: An integer representing the day number of the year.  

Example 1:
Input: 2019-01-09  
Output: 9  

Example 2 :
Input: 2019-02-10  
Output: 41  

Constraints:
- The input string has length 10.  
- date[4] == date[7] == '-', and all other characters are digits.  
- The date represents a valid Gregorian calendar date between Jan 1st, 1900 and Dec 31st, 2019. `,
        constraints: "",
        expectedFormat: "",
      },
    });
  }

  const promptChars = question.prompt.length;

  function clearQuestion() {
    dispatch({ type: "question/update", update: { title: "", prompt: "", constraints: "", expectedFormat: "" } });
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="space-y-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-neutral-800">Assignment Details</h3>
            <div className="flex items-center gap-2">
              <button className="btn-secondary" onClick={useExample}>Use example</button>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="q-title" className="block text-sm text-neutral-700">Assignment Title</label>
              <p className="text-xs text-neutral-600">Keep it short and specific.</p>
              <input
                id="q-title"
                className="w-full mt-1 rounded-lg border border-neutral-300 px-3 py-2 bg-white"
                value={question.title}
                onChange={(e) => dispatch({ type: "question/update", update: { title: e.target.value } })}
                placeholder="e.g., Two Sum Function"
              />
            </div>
            <div>
              <label htmlFor="q-prompt" className="block text-sm text-neutral-700">Problem description</label>
              <p className="text-xs text-neutral-600">Describe the task, inputs, outputs, constraints, and edge cases in one clear prompt.</p>
              <textarea
                id="q-prompt"
                className="w-full mt-1 rounded-lg border border-neutral-300 px-3 py-2 bg-white"
                rows={12}
                value={question.prompt}
                onChange={(e) => dispatch({ type: "question/update", update: { prompt: e.target.value } })}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (!question.title.trim()) {
                      await alertModal({ title: "Title Required", message: "Please enter an assignment title before proceeding.", tone: "warning" });
                      return;
                    }
                    if (!question.prompt.trim()) {
                      await alertModal({ title: "Problem Description Required", message: "Please enter a problem description before proceeding.", tone: "warning" });
                      return;
                    }
                    dispatch({ type: "ui/setStep", step: 2 });
                  }
                }}
                placeholder="Describe the problem the student must solve… Include constraints and expected output."
              />
              <div className="mt-1 text-xs text-neutral-600">{promptChars} characters</div>
            </div>
            {/* Focus mode: Only Title and Problem description */}
          </div>
        </div>

        <div className="sticky bottom-4 z-10">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white/90 backdrop-blur px-3 py-2 shadow-lg">
            <div className="text-sm text-neutral-600">Press <span className="font-semibold">Ctrl/⌘ + Enter</span> to continue</div>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={clearQuestion}>Reset</button>
              <button className="btn-primary" onClick={async () => {
                if (!question.title.trim()) {
                  await alertModal({ title: "Title Required", message: "Please enter an assignment title before proceeding.", tone: "warning" });
                  return;
                }
                if (!question.prompt.trim()) {
                  await alertModal({ title: "Problem Description Required", message: "Please enter a problem description before proceeding.", tone: "warning" });
                  return;
                }
                dispatch({ type: "ui/setStep", step: 2 });
              }}>Next: Rubric →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



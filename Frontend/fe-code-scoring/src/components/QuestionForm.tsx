"use client";

import { useAppState } from "@/state/appState";

export function QuestionForm() {
  const { state, dispatch } = useAppState();
  const { question } = state;

  function useExample() {
    dispatch({
      type: "question/update",
      update: {
        title: "Valid anagram",
        prompt: `Write a program in C++ that reads two strings from input and determines whether they are anagrams of each other. Two strings are anagrams if one can be formed by rearranging the letters of the other, using all the original letters exactly once. The program should output true if the second string is an anagram of the first, and false otherwise.

Input: Two lines, each containing a string s and t.
Output: A single word: true if t is an anagram of s, otherwise false.

Example 1:
Input:
anagram
nagaram
Output:
true

Example 2:
Input:
rat
car
Output:
false

Constraints:
1 <= s.length, t.length <= 5 * 10^2
Both strings consist of lowercase English letters.`,
        constraints: "Inputs are 0 ≤ a,b ≤ 1e9. Prefer O(log min(a,b)).",
        expectedFormat: "Return an integer (the GCD)",
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
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
              <button className="btn-primary" onClick={() => dispatch({ type: "ui/setStep", step: 2 })}>Next: Rubric →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



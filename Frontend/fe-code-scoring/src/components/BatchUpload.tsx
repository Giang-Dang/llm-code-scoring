"use client";

import { useState } from "react";
import type { Action } from "@/state/appState";

type BatchUploadProps = {
  batchLanguage: string;
  uploadedFiles: Array<{ name: string; size: number; status: "pending" | "success" | "error" }>;
  onLanguageChange: (language: string) => void;
  onFilesUpload: (files: File[]) => Promise<void>;
  dispatch: React.Dispatch<Action>;
  alertModal: (opts: { title?: string; message?: string; tone?: "success" | "error" | "info" | "warning" }) => Promise<void>;
};

export function BatchUpload({
  batchLanguage,
  uploadedFiles,
  onLanguageChange,
  onFilesUpload,
  dispatch,
  alertModal,
}: BatchUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".txt"));

    if (files.length === 0) {
      await alertModal({ title: "Invalid File Type", message: "Please drop .txt files only", tone: "error" });
      return;
    }

    await onFilesUpload(files);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter((f) => f.name.endsWith(".txt"));

    if (fileArray.length === 0) {
      await alertModal({ title: "Invalid File Type", message: "Please select .txt files only", tone: "error" });
      return;
    }

    await onFilesUpload(fileArray);
    e.target.value = ""; // reset
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Language Selector */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="batch-language">
            Programming Language for All Files
          </label>
          <select 
            id="batch-language" 
            aria-label="Choose programming language for batch upload" 
            className="w-full rounded-xl border-2 border-neutral-200 px-4 py-3 bg-white text-neutral-900 font-medium transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100" 
            value={batchLanguage} 
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            <option value="c++">C++</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
          </select>
          <p className="text-xs text-neutral-500 mt-2">All uploaded files will be evaluated using this language</p>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div 
        className={`rounded-2xl border-2 border-dashed p-16 text-center transition-all ${
          isDragging 
            ? "border-purple-500 bg-purple-50" 
            : "border-neutral-300 bg-gradient-to-br from-white to-neutral-50 hover:border-purple-400 hover:bg-purple-50/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-neutral-900 mb-3">
              {isDragging ? "Drop files here" : "Drag & Drop Text Files"}
            </h3>
            <p className="text-lg text-neutral-600 mb-2">
              Drop multiple .txt files here
            </p>
            <p className="text-neutral-500">
              Student name will be extracted from filename
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">.txt files only</span>
            <span className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">Language: {batchLanguage}</span>
          </div>
          <div className="mt-6">
            <label htmlFor="file-upload" className="btn-primary cursor-pointer inline-flex items-center gap-3 px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-shadow">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Browse Files
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".txt"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900">Uploaded Files</h3>
            <span className="text-sm text-neutral-600">{uploadedFiles.length} files</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  file.status === "success" ? "bg-green-100" : 
                  file.status === "error" ? "bg-red-100" : "bg-blue-100"
                }`}>
                  {file.status === "success" ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : file.status === "error" ? (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-neutral-900 truncate">{file.name}</div>
                  <div className="text-xs text-neutral-500">{(file.size / 1024).toFixed(2)} KB</div>
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded ${
                  file.status === "success" ? "bg-green-100 text-green-700" : 
                  file.status === "error" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {file.status === "success" ? "Success" : file.status === "error" ? "Failed" : "Processing"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button 
          className="btn-secondary flex items-center gap-2 px-5 py-3" 
          onClick={() => dispatch({ type: "ui/setStep", step: 2 })}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rubric
        </button>
        <button
          className="btn-primary flex items-center gap-2 px-8 py-3 text-base font-bold shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => dispatch({ type: "ui/setStep", step: 4 })}
        >
          Settings
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

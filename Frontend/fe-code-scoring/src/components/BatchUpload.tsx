"use client";

import { useState } from "react";
import type { Action } from "@/state/appState";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";

type BatchUploadProps = {
  batchLanguage: string;
  uploadedFiles: Array<{ name: string; size: number; status: "pending" | "success" | "error"; code?: string; submissionId?: string }>;
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
  const [viewingFile, setViewingFile] = useState<{ name: string; code: string } | null>(null);

  // Get language extensions for CodeMirror
  const getLanguageExtensions = (language: string) => {
    switch (language.toLowerCase()) {
      case "python":
        return [python()];
      case "javascript":
        return [javascript({ jsx: true, typescript: true })];
      case "cpp":
      case "c++":
        return [cpp()];
      default:
        return [javascript({ jsx: true, typescript: true })];
    }
  };

  // Remove file from uploaded list and its corresponding submission
  const handleRemoveFile = (index: number) => {
    const fileToRemove = uploadedFiles[index];
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    dispatch({ type: "codeInput/setUploadedFiles", files: newFiles });
    
    // Also remove the corresponding submission if it exists
    if (fileToRemove.submissionId) {
      dispatch({ type: "submissions/delete", id: fileToRemove.submissionId });
    }
  };

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
            <option value="cpp">C++</option>
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
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {file.status === "success" && file.code && (
                    <button
                      onClick={() => setViewingFile({ name: file.name, code: file.code! })}
                      className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                      title="View code"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
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

      {/* Code Viewer Modal */}
      {viewingFile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setViewingFile(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
              </div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{viewingFile.name}</h3>
                  <p className="text-slate-300 text-sm">Code Preview</p>
                </div>
                <button
                  onClick={() => setViewingFile(null)}
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="rounded-xl overflow-hidden border border-neutral-300 shadow-sm">
                <CodeMirror
                  value={viewingFile.code}
                  extensions={getLanguageExtensions(batchLanguage)}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: false,
                    highlightActiveLine: false,
                    foldGutter: true,
                  }}
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

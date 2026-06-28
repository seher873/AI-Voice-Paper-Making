"use client";

import { usePaper } from "@/context/PaperContext";
import { useState, useCallback } from "react";
import VoiceTyping from "./VoiceTyping";
import { useToast } from "@/context/ToastContext";

export default function QuestionEditor() {
  const { state, dispatch } = usePaper();
  const { addToast } = useToast();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleAddQuestion = useCallback(() => {
    dispatch({
      type: "ADD_QUESTION",
      payload: { id: crypto.randomUUID(), text: "" },
    });
    addToast("New question added", "info");
  }, [dispatch, addToast]);

  const handleVoiceResult = useCallback(
    (text: string) => {
      if (!text.trim()) {
        addToast("No speech detected", "warning");
        return;
      }
      dispatch({
        type: "ADD_QUESTION",
        payload: { id: crypto.randomUUID(), text },
      });
    },
    [dispatch, addToast]
  );

  const handleUpdateQuestion = useCallback(
    (id: string, text: string) => {
      dispatch({ type: "UPDATE_QUESTION", payload: { id, text } });
    },
    [dispatch]
  );

  const handleDeleteQuestion = useCallback(
    (id: string) => {
      dispatch({ type: "DELETE_QUESTION", payload: id });
      addToast("Question deleted", "info");
    },
    [dispatch, addToast]
  );

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const items = [...state.questions];
    const [reordered] = items.splice(dragIndex, 1);
    items.splice(index, 0, reordered);
    dispatch({ type: "REORDER_QUESTIONS", payload: items });
    setDragIndex(index);
  };

  const handleDragEnd = () => setDragIndex(null);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
            Questions
            {state.questions.length > 0 && (
              <span className="ml-1.5 text-xs sm:text-sm font-normal text-slate-400">({state.questions.length})</span>
            )}
          </h2>
        </div>
        <button
          onClick={handleAddQuestion}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-[0.98] transition-all text-xs sm:text-sm font-medium shadow-sm flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden xs:inline">Add</span> Question
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
          Voice Typing
        </label>
        <VoiceTyping onTranscriptReady={handleVoiceResult} />
      </div>

      <div className="space-y-2 max-h-[300px] sm:max-h-[400px] lg:max-h-[420px] overflow-y-auto pr-1">
        {state.questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">No questions yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Use the microphone above or click Add Question to start building your paper
            </p>
          </div>
        ) : (
          state.questions.map((question, index) => (
            <div
              key={question.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-start gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-white border rounded-xl transition-all ${
                dragIndex === index
                  ? "opacity-50 border-indigo-400 shadow-md"
                  : "border-slate-200 hover:border-indigo-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-1 mt-1 cursor-grab text-slate-300 hover:text-slate-500 transition-colors">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-6 h-5 sm:w-7 sm:h-6 rounded-md bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Q{index + 1}</span>
                </div>
                <textarea
                  value={question.text}
                  onChange={(e) => handleUpdateQuestion(question.id, e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-none transition-all"
                  placeholder="Type or edit question text..."
                />
              </div>

              <button
                onClick={() => handleDeleteQuestion(question.id)}
                className="mt-1 p-1 sm:p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Delete question"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {state.questions.length > 0 && (
        <p className="text-[10px] sm:text-xs text-slate-400 text-center">
          Drag questions to reorder &middot; Tap delete icon to remove
        </p>
      )}
    </div>
  );
}

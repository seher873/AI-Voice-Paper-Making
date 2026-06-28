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
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">
            Questions
            {state.questions.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">({state.questions.length})</span>
            )}
          </h2>
        </div>
        <button
          onClick={handleAddQuestion}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all text-sm font-bold shadow-md flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Question
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Voice Typing
        </label>
        <VoiceTyping onTranscriptReady={handleVoiceResult} />
      </div>

      <div className="space-y-3 max-h-[400px] sm:max-h-[500px] lg:max-h-[550px] overflow-y-auto pr-1">
        {state.questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-500">No questions yet</p>
            <p className="text-sm text-slate-400 mt-2 max-w-[260px]">
              Use the microphone above or click <strong>Add Question</strong> to start building your paper
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
              className={`group flex items-start gap-3 p-4 bg-white border-2 rounded-2xl transition-all ${
                dragIndex === index
                  ? "opacity-50 border-indigo-400 shadow-lg"
                  : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-1 mt-1.5 cursor-grab text-slate-300 hover:text-slate-500 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center w-8 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-400 font-bold">Q{index + 1}</span>
                </div>
                <textarea
                  value={question.text}
                  onChange={(e) => handleUpdateQuestion(question.id, e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-none transition-all"
                  placeholder="Type or edit question text..."
                />
              </div>

              <button
                onClick={() => handleDeleteQuestion(question.id)}
                className="mt-1.5 p-2.5 bg-white border-2 border-red-200 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 rounded-xl transition-all"
                title="Delete question"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {state.questions.length > 0 && (
        <p className="text-xs sm:text-sm text-slate-400 text-center font-medium">
          Drag ⇅ to reorder questions &middot; Click the delete button to remove
        </p>
      )}
    </div>
  );
}

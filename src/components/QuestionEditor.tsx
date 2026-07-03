"use client";

import { usePaper } from "@/context/PaperContext";
import { useCallback } from "react";
import VoiceTyping from "./VoiceTyping";
import { useToast } from "@/context/ToastContext";

export default function QuestionEditor() {
  const { state, dispatch } = usePaper();
  const { addToast } = useToast();

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

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const items = [...state.questions];
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      dispatch({ type: "REORDER_QUESTIONS", payload: items });
    },
    [dispatch, state.questions]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === state.questions.length - 1) return;
      const items = [...state.questions];
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
      dispatch({ type: "REORDER_QUESTIONS", payload: items });
    },
    [dispatch, state.questions]
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
          className="flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all text-sm font-bold shadow-md flex-shrink-0"
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
              className="flex items-start gap-2 p-4 bg-white border-2 border-slate-200 rounded-2xl transition-all hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-1 mt-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.92]"
                  title="Move up"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === state.questions.length - 1}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.92]"
                  title="Move down"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l7-7m-7 7l-7-7" />
                  </svg>
                </button>
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
                  dir="auto"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-none transition-all text-right"
                  placeholder="Type or edit question text..."
                />
              </div>

              <button
                onClick={() => handleDeleteQuestion(question.id)}
                className="flex items-center justify-center min-h-[48px] min-w-[48px] p-3 bg-white border-2 border-red-200 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 rounded-xl transition-all active:scale-[0.92]"
                title="Delete question"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {state.questions.length > 0 && (
        <p className="text-xs sm:text-sm text-slate-400 text-center font-medium">
          Use arrow buttons to reorder questions &middot; Click delete to remove
        </p>
      )}
    </div>
  );
}

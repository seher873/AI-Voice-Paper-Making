"use client"

import { useState, useRef, useCallback } from "react"
import { parseDocx, generateDocx } from "@/lib/docx"
import { useSpeech } from "@/hooks/useSpeech"
import { saveAs } from "file-saver"
import { useToast } from "@/context/ToastContext"
import { cleanTranscript } from "@/lib/textCleaner"

interface TagEntry {
  tag: string
  name: string
  value: string
}

export default function TemplateSection() {
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [zipData, setZipData] = useState<ArrayBuffer | null>(null)
  const [tags, setTags] = useState<TagEntry[]>([])
  const [selectedTag, setSelectedTag] = useState("")
  const [textareaValue, setTextareaValue] = useState("")
  const [parsing, setParsing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [voiceLang, setVoiceLang] = useState<"ur-PK" | "en-US">("ur-PK")
  const [pendingText, setPendingText] = useState("")
  const [pendingConfidence, setPendingConfidence] = useState(0)
  const [showPending, setShowPending] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isListening, startListening, stopListening, transcript } = useSpeech()
  const { addToast } = useToast()

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    if (!f.name.endsWith(".docx")) {
      addToast("Please select a .docx file", "error")
      return
    }

    setParsing(true)
    try {
      const result = await parseDocx(f)
      setFile(f)
      setFileName(f.name)
      setZipData(result.zipData)

      if (result.tags.length === 0) {
        addToast("No tags { } found in the file", "warning")
        setTags([])
      } else {
        const entries = result.tags.map((tag) => ({
          tag,
          name: tag.slice(1, -1),
          value: "",
        }))
        setTags(entries)
        setSelectedTag(result.tags[0])
        setTextareaValue("")
        addToast(`Found ${result.tags.length} tag(s)`, "success")
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to read file", "error")
    } finally {
      setParsing(false)
    }
  }, [addToast])

  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTag(tag)
    const existing = tags.find((t) => t.tag === tag)
    setTextareaValue(existing?.value || "")
    setShowPending(false)
  }, [tags])

  const handleTextareaChange = useCallback((value: string) => {
    setTextareaValue(value)
    setTags((prev) =>
      prev.map((t) => (t.tag === selectedTag ? { ...t, value } : t))
    )
  }, [selectedTag])

  const handleVoiceResult = useCallback(
    (result: { text: string; confidence: number }) => {
      const cleaned = voiceLang === "en-US" ? cleanTranscript(result.text) : result.text
      setPendingText(cleaned)
      setPendingConfidence(result.confidence)
      setShowPending(true)
    },
    [voiceLang]
  )

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      setShowPending(false)
      startListening(handleVoiceResult, voiceLang)
    }
  }, [isListening, startListening, stopListening, handleVoiceResult, voiceLang])

  const handleAcceptPending = useCallback(() => {
    if (!pendingText.trim()) return
    setTextareaValue(pendingText)
    setTags((prev) =>
      prev.map((t) => (t.tag === selectedTag ? { ...t, value: pendingText } : t))
    )
    setShowPending(false)
    setPendingText("")
    setPendingConfidence(0)
    addToast("Tag value updated", "success")
  }, [pendingText, selectedTag, addToast])

  const handleRejectPending = useCallback(() => {
    setShowPending(false)
    setPendingText("")
    setPendingConfidence(0)
    addToast("Re-record", "info")
  }, [addToast])

  const allFilled = tags.length > 0 && tags.every((t) => t.value.trim().length > 0)

  const handleDownload = useCallback(async () => {
    if (!zipData || tags.length === 0) return

    setGenerating(true)
    try {
      const tagValues: Record<string, string> = {}
      for (const t of tags) {
        tagValues[t.name] = t.value
      }
      const blob = generateDocx(zipData, tagValues)
      const outName = fileName.replace(".docx", "-filled.docx")
      saveAs(blob, outName)
      addToast("File downloaded successfully", "success")
    } catch {
      addToast("Failed to generate DOCX", "error")
    } finally {
      setGenerating(false)
    }
  }, [zipData, tags, fileName, addToast])

  const handleReset = useCallback(() => {
    setFile(null)
    setFileName("")
    setZipData(null)
    setTags([])
    setSelectedTag("")
    setTextareaValue("")
    setShowPending(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-800">Template Filler</h2>
      </div>

      {/* Upload */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
          >
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-bold text-slate-600 mb-1">Upload .docx Template</p>
            <p className="text-xs text-slate-400">File must contain tags like {`{Q1}`} or {`{StudentName}`}</p>
            <input ref={fileInputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileUpload} className="hidden" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{fileName}</p>
                <p className="text-xs text-slate-400">{tags.length} tag(s) found</p>
              </div>
              <button onClick={handleReset} className="text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Change</button>
            </div>
            {parsing && <p className="text-sm text-slate-500">Parsing tags...</p>}
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <>
          {/* Tag Selection + Voice */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Select Tag</label>
              <div className="relative">
                <select
                  value={selectedTag}
                  onChange={(e) => handleTagSelect(e.target.value)}
                  className="appearance-none w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all cursor-pointer font-medium"
                >
                  {tags.map((t) => (
                    <option key={t.tag} value={t.tag}>{t.tag}</option>
                  ))}
                </select>
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Voice Language</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setVoiceLang("ur-PK")}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    voiceLang === "ur-PK" ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-400"
                  }`}
                >اردو</button>
                <button
                  onClick={() => setVoiceLang("en-US")}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    voiceLang === "en-US" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-blue-400"
                  }`}
                >English</button>
              </div>
            </div>

            <button
              onClick={handleMicClick}
              className={`flex items-center justify-center gap-2 min-h-[48px] w-full px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                isListening ? "bg-red-600 text-white shadow-md" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
              }`}
            >
              {isListening ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                  <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8" />
                </svg>
              )}
              <span>{isListening ? "Stop" : "Mic"}</span>
            </button>

            {isListening && (
              <div className="flex items-center gap-2 text-sm text-red-600 font-bold">
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" />
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
                </span>
                Listening...
              </div>
            )}
          </div>

          {/* Pending transcription preview */}
          {showPending && (
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-indigo-200 shadow-sm space-y-3 animate-fade-in">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Preview Transcription
              </label>
              <textarea
                value={pendingText}
                onChange={(e) => setPendingText(e.target.value)}
                dir="auto"
                rows={3}
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition-all"
              />
              {voiceLang === "en-US" && pendingConfidence > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Confidence:</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-[120px]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(pendingConfidence * 100)}%`,
                        backgroundColor: pendingConfidence > 0.7 ? "#10b981" : pendingConfidence > 0.4 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{Math.round(pendingConfidence * 100)}%</span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleAcceptPending}
                  className="flex items-center justify-center gap-2 min-h-[48px] flex-1 px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all text-sm font-bold shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </button>
                <button
                  onClick={handleRejectPending}
                  className="flex items-center justify-center gap-2 min-h-[48px] flex-1 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all text-sm font-bold shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Textarea */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Value for {selectedTag}
            </label>
            <textarea
              value={textareaValue}
              onChange={(e) => handleTextareaChange(e.target.value)}
              dir="auto"
              rows={4}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none"
              placeholder="Type or use voice input..."
            />
          </div>

          {/* Progress + Download */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t.tag} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  t.value.trim() ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-white text-slate-400 border border-slate-200"
                }`}>
                  {t.value.trim() ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                    </svg>
                  )}
                  {t.tag}
                </span>
              ))}
            </div>

            <button
              onClick={handleDownload}
              disabled={!allFilled || generating || !zipData}
              className="w-full flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all text-sm font-bold shadow-md"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Filled DOCX
                </>
              )}
            </button>
            {!allFilled && tags.length > 0 && (
              <p className="text-xs text-slate-400 text-center">Fill all tags to enable download</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

"use client"

import { useState, useRef, useCallback } from "react"
import { parseDocx, generateDocx, type TagInfo } from "@/lib/docx"
import { useSpeech } from "@/hooks/useSpeech"
import { saveAs } from "file-saver"

export default function PaperBol() {
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [zipData, setZipData] = useState<ArrayBuffer | null>(null)
  const [tags, setTags] = useState<TagInfo[]>([])
  const [selectedTag, setSelectedTag] = useState("")
  const [textareaValue, setTextareaValue] = useState("")
  const [parsing, setParsing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isListening, startListening, stopListening } = useSpeech()

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    if (!f.name.endsWith(".docx")) {
      setError("براہ کرم .docx فائل منتخب کریں")
      return
    }

    setError("")
    setSuccess("")
    setParsing(true)

    try {
      const result = await parseDocx(f)
      setFile(f)
      setFileName(f.name)
      setZipData(result.zipData)

      if (result.tags.length === 0) {
        setError("فائل میں کوئی ٹیگ { } نہیں ملا۔ براہ کرم {Q1}، {StudentName} جیسے ٹیگ استعمال کریں")
        setTags([])
      } else {
        const tagInfos = result.tags.map((tag) => ({
          tag,
          name: tag.slice(1, -1),
          value: "",
        }))
        setTags(tagInfos)
        setSelectedTag(result.tags[0])
        setSuccess(`${result.tags.length} ٹیگز مل گئے`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فائل پڑھنے میں مسئلہ")
    } finally {
      setParsing(false)
    }
  }, [])

  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTag(tag)
    const existing = tags.find((t) => t.tag === tag)
    setTextareaValue(existing?.value || "")
  }, [tags])

  const handleTextareaChange = useCallback((value: string) => {
    setTextareaValue(value)
    setTags((prev) =>
      prev.map((t) => (t.tag === selectedTag ? { ...t, value } : t))
    )
  }, [selectedTag])

  const handleVoiceResult = useCallback(
    (text: string) => {
      setTextareaValue(text)
      setTags((prev) =>
        prev.map((t) => (t.tag === selectedTag ? { ...t, value: text } : t))
      )
    },
    [selectedTag]
  )

  const handleUrduMic = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening(handleVoiceResult, "ur-PK")
    }
  }, [isListening, startListening, stopListening, handleVoiceResult])

  const handleEnglishMic = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening(handleVoiceResult, "en-US")
    }
  }, [isListening, startListening, stopListening, handleVoiceResult])

  const allFilled = tags.length > 0 && tags.every((t) => t.value.trim().length > 0)

  const handleDownload = useCallback(async () => {
    if (!zipData || tags.length === 0) return

    setGenerating(true)
    setError("")
    setSuccess("")

    try {
      const tagValues: Record<string, string> = {}
      for (const t of tags) {
        tagValues[t.name] = t.value
      }

      const blob = generateDocx(zipData, tagValues)
      const outName = fileName.replace(".docx", "-filled.docx")
      saveAs(blob, outName)
      setSuccess("فائل ڈاؤن لوڈ ہو گئی")
    } catch (err) {
      setError("DOCX بنانے میں مسئلہ ہوا")
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }, [zipData, tags, fileName])

  const handleNewFile = useCallback(() => {
    setFile(null)
    setFileName("")
    setZipData(null)
    setTags([])
    setSelectedTag("")
    setTextareaValue("")
    setError("")
    setSuccess("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">PaperBol</h1>
            <p className="text-xs text-slate-500">اردو وائس ٹو ورڈ</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {error && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-fade-in">
            <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-emerald-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Template Upload + Tags */}
          <div className="space-y-4">
            {/* Upload */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-slate-800">ٹیمپلیٹ اپ لوڈ</h2>
              </div>

              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                >
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-bold text-slate-600 mb-1">
                    .docx فائل منتخب کریں
                  </p>
                  <p className="text-xs text-slate-400">
                    { } ٹیگز والی فائل اپ لوڈ کریں
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{fileName}</p>
                      <p className="text-xs text-slate-400">{tags.length} ٹیگز مل گئے</p>
                    </div>
                    <button
                      onClick={handleNewFile}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      تبدیل کریں
                    </button>
                  </div>

                  {parsing && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      ٹیگز نکالے جا رہے ہیں...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-slate-800">ٹیگز بھریں</h2>
                </div>

                {/* Tag Dropdown */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    ٹیگ منتخب کریں
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTag}
                      onChange={(e) => handleTagSelect(e.target.value)}
                      className="appearance-none w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all cursor-pointer font-medium"
                    >
                      {tags.map((t) => (
                        <option key={t.tag} value={t.tag}>
                          {t.tag}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Textarea for selected tag */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    {selectedTag} کی ویلیو
                  </label>
                  <textarea
                    value={textareaValue}
                    onChange={(e) => handleTextareaChange(e.target.value)}
                    dir="auto"
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none"
                    placeholder="یہاں ٹیکسٹ لکھیں یا مائک استعمال کریں"
                  />
                </div>

                {/* Tag progress */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500">
                    پیش رفت: {tags.filter((t) => t.value.trim().length > 0).length}/{tags.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span
                        key={t.tag}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          t.value.trim()
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
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
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Voice Typing */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3zm0 10a5 5 0 005-5 1 1 0 10-2 0 3 3 0 11-6 0 1 1 0 10-2 0 5 5 0 005 5zm-1 3.07A7.001 7.001 0 015 11a1 1 0 10-2 0 9 9 0 008 8.94V22a1 1 0 102 0v-2.06A9 9 0 0021 11a1 1 0 10-2 0 7.001 7.001 0 01-6 6.07z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-slate-800">وائس ٹائپنگ</h2>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={handleUrduMic}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    isListening
                      ? "bg-red-600 text-white shadow-md shadow-red-200 hover:bg-red-700"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3zm0 10a5 5 0 005-5 1 1 0 10-2 0 3 3 0 11-6 0 1 1 0 10-2 0 5 5 0 005 5zm-1 3.07A7.001 7.001 0 015 11a1 1 0 10-2 0 9 9 0 008 8.94V22a1 1 0 102 0v-2.06A9 9 0 0021 11a1 1 0 10-2 0 7.001 7.001 0 01-6 6.07z" clipRule="evenodd" />
                  </svg>
                  {isListening ? "رکیں" : "اردو مائک"}
                </button>

                <button
                  onClick={handleEnglishMic}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    isListening
                      ? "bg-red-600 text-white shadow-md shadow-red-200 hover:bg-red-700"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3zm0 10a5 5 0 005-5 1 1 0 10-2 0 3 3 0 11-6 0 1 1 0 10-2 0 5 5 0 005 5zm-1 3.07A7.001 7.001 0 015 11a1 1 0 10-2 0 9 9 0 008 8.94V22a1 1 0 102 0v-2.06A9 9 0 0021 11a1 1 0 10-2 0 7.001 7.001 0 01-6 6.07z" clipRule="evenodd" />
                  </svg>
                  {isListening ? "Stop" : "English Mic"}
                </button>
              </div>

              {isListening && (
                <div className="flex items-center gap-2 text-sm text-red-600 font-bold mb-3">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" />
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
                  </span>
                  سن رہا ہے...
                </div>
              )}

              {/* Live transcript area */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  لائیو ٹیکسٹ
                </label>
                <textarea
                  dir="auto"
                  rows={3}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg text-slate-800 focus:outline-none resize-none"
                  placeholder="مائک دبائیں اور بولیں..."
                />
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700 font-medium">
                  پہلے بائیں طرف سے ٹیگ منتخب کریں، پھر مائک دبائیں اور بولیں۔ آواز خود بخود منتخب ٹیگ میں محفوظ ہو جائے گی۔
                </p>
              </div>
            </div>

            {/* Download */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              <button
                onClick={handleDownload}
                disabled={!allFilled || generating || !zipData}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all text-base font-bold shadow-md shadow-indigo-200"
              >
                {generating ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    بنا رہا ہے...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ڈاؤن لوڈ کریں
                  </>
                )}
              </button>
              {!allFilled && tags.length > 0 && (
                <p className="text-xs text-slate-400 text-center mt-2">
                  تمام ٹیگز پُر کریں
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

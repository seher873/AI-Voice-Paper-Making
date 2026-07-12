"use client"

import { useState, useCallback, useRef } from "react"

export interface SpeechResult {
  text: string
  confidence: number
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [confidence, setConfidence] = useState(0)
  const [activeLang, setActiveLang] = useState("")

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = useCallback(
    (onResult: (result: SpeechResult) => void, lang: string = "ur-PK") => {
      if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.")
        return
      }

      const w = window as unknown as Window
      const SpeechRecognitionAPI =
        w.SpeechRecognition || w.webkitSpeechRecognition
      if (!SpeechRecognitionAPI) return

      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      const effectiveLang = lang === "sd-PK" ? "ur-PK" : lang
      recognition.lang = effectiveLang

      setActiveLang(lang)

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      let fullTranscript = ""
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            let newText = result[0].transcript.trim()
            if (fullTranscript && newText) {
              const lastWords = fullTranscript.split(/\s+/)
              const firstWords = newText.split(/\s+/)
              let overlap = 0
              for (let len = Math.min(lastWords.length, firstWords.length); len > 0; len--) {
                const tail = lastWords.slice(-len).join(" ")
                const head = firstWords.slice(0, len).join(" ")
                if (tail === head) { overlap = len; break }
              }
              if (overlap > 0) {
                newText = firstWords.slice(overlap).join(" ")
              }
            }
            if (newText) {
              fullTranscript += (fullTranscript ? " " : "") + newText
            }
          }
        }
        const last = event.results[event.results.length - 1]
        if (last.isFinal && fullTranscript) {
          setTranscript(fullTranscript)
          setConfidence(last[0].confidence)
          onResult({ text: fullTranscript, confidence: last[0].confidence })
          setTranscript("")
          setConfidence(0)
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    },
    []
  )

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const speak = useCallback((text: string, lang: string = "ur-PK") => {
    if (!("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 1

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  return {
    isListening,
    isSpeaking,
    transcript,
    confidence,
    activeLang,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}

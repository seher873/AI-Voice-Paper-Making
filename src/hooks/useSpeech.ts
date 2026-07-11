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
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.lang = lang

      setActiveLang(lang)

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex]
        const transcriptText = result[0].transcript
        const conf = result[0].confidence

        setTranscript(transcriptText)
        setConfidence(conf)

        onResult({ text: transcriptText, confidence: conf })
        setTranscript("")
        setConfidence(0)
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

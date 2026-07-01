"use client"

import { useState, useCallback, useRef } from "react"

export function useSpeech() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [activeLang, setActiveLang] = useState("")

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = useCallback(
    (onResult: (text: string) => void, lang: string = "ur-PK") => {
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
      recognition.interimResults = true
      recognition.lang = lang

      setActiveLang(lang)

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex
        const transcriptText = event.results[current][0].transcript
        setTranscript(transcriptText)
        if (event.results[current].isFinal) {
          onResult(transcriptText)
          setTranscript("")
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
    activeLang,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}

const FILLER_WORDS = [
  "um", "uh", "ah", "er", "hmm", "like", "you know", "actually",
  "basically", "literally", "sort of", "kind of", "i mean",
  "yeah", "okay", "so", "well", "right", "huh",
]

const QUESTION_WORDS = [
  "what", "why", "how", "when", "where", "which", "who", "whom", "whose",
]

function removeFillerWords(text: string): string {
  let result = text.toLowerCase()
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi")
    result = result.replace(regex, "")
  }
  return result.replace(/\s+/g, " ").trim()
}

function removeConsecutiveDuplicates(text: string): string {
  const words = text.split(/\s+/)
  const cleaned: string[] = []
  for (let i = 0; i < words.length; i++) {
    if (i === 0 || words[i].toLowerCase() !== words[i - 1].toLowerCase()) {
      cleaned.push(words[i])
    }
  }
  return cleaned.join(" ")
}

function removeConsecutiveWordRepetitions(text: string): string {
  return text.replace(/\b(\w+)\b(?:\s*\1\b)+/gi, "$1")
}

function removeConcatenatedDuplicates(text: string): string {
  const knownWords = [
    "what", "why", "how", "when", "where", "which", "who", "whom", "whose",
    "is", "are", "was", "were", "am", "be", "been", "being",
    "your", "my", "his", "her", "its", "our", "their",
    "a", "an", "the", "this", "that", "these", "those",
    "in", "on", "at", "to", "for", "of", "with", "by", "from",
    "and", "or", "but", "so", "if", "because",
    "write", "define", "describe", "explain", "name", "list", "five",
    "sentences", "sentence", "adjective", "school", "about", "your",
  ]
  const words = text.split(/\s+/)
  const result: string[] = []
  for (const word of words) {
    let remaining = word.toLowerCase()
    let rebuilt = ""
    while (remaining.length > 0) {
      let matched = false
      for (const kw of [...knownWords].sort((a, b) => b.length - a.length)) {
        if (remaining.startsWith(kw)) {
          rebuilt += (rebuilt ? " " : "") + kw
          remaining = remaining.slice(kw.length)
          matched = true
          break
        }
      }
      if (!matched) {
        rebuilt += (rebuilt ? " " : "") + remaining
        break
      }
    }
    result.push(rebuilt)
  }
  return removeConsecutiveDuplicates(result.join(" "))
}

function removeRepeatedPhrases(text: string, minLen: number = 2, maxLen: number = 5): string {
  const words = text.split(/\s+/)
  const result: string[] = []
  const seen = new Set<string>()
  let i = 0
  while (i < words.length) {
    let found = false
    for (let len = maxLen; len >= minLen; len--) {
      if (i + len > words.length) continue
      const phrase = words.slice(i, i + len).join(" ").toLowerCase()
      if (seen.has(phrase)) {
        i += len
        found = true
        break
      }
    }
    if (!found) {
      const phrase = words.slice(i, i + minLen).join(" ").toLowerCase()
      if (i + minLen <= words.length) {
        seen.add(phrase)
      }
      result.push(words[i])
      i++
    }
  }
  return result.join(" ")
}

function cleanPunctuation(text: string): string {
  return text
    .replace(/([.!?])\1+/g, "$1")
    .replace(/[,]{2,}/g, ",")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.,!?;:])\s+/g, "$1 ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function capitalizeFirst(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function addQuestionMark(text: string): string {
  const trimmed = text.trim()
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase()
  if (firstWord && QUESTION_WORDS.includes(firstWord)) {
    if (!trimmed.endsWith("?") && !trimmed.endsWith(".")) {
      return trimmed + "?"
    }
  }
  return trimmed
}

function removeExtraSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

export function cleanTranscript(text: string): string {
  if (!text) return text

  let result = text

  result = result.toLowerCase()
  result = removeConcatenatedDuplicates(result)
  result = removeFillerWords(result)
  result = removeConsecutiveWordRepetitions(result)
  result = removeConsecutiveDuplicates(result)

  const parts = result.split(/([.!?]+)/)
  const cleanedParts = parts.map((part) => {
    const trimmed = part.trim()
    if (!trimmed || /^[.!?]+$/.test(trimmed)) return trimmed
    return removeRepeatedPhrases(trimmed, 2, 4)
  })
  result = cleanedParts.join("")

  result = cleanPunctuation(result)
  result = removeExtraSpaces(result)
  result = addQuestionMark(result)
  result = capitalizeFirst(result)

  return result
}

const NUMBER_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  ten: "10", eleven: "11", twelve: "12", thirteen: "13",
  fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17",
  eighteen: "18", nineteen: "19", twenty: "20", thirty: "30",
  forty: "40", fifty: "50", sixty: "60", seventy: "70",
  eighty: "80", ninety: "90", hundred: "100",
}

const MATH_OPS: [RegExp, string][] = [
  [/plus/g, "+"],
  [/minus/g, "-"],
  [/multiplied by/g, "×"],
  [/multiply by/g, "×"],
  [/times/g, "×"],
  [/divided by/g, "÷"],
  [/divide by/g, "÷"],
  [/equals/g, "="],
  [/equal to/g, "="],
  [/percent/g, "%"],
  [/percentage/g, "%"],
  [/square/g, "²"],
  [/cube/g, "³"],
  [/greater than/g, ">"],
  [/less than/g, "<"],
  [/bracket open/g, "("],
  [/open bracket/g, "("],
  [/bracket close/g, ")"],
  [/close bracket/g, ")"],
]

function replaceNumberWords(text: string): string {
  const words = text.split(/\s+/)
  const result = words.map((w) => {
    const clean = w.toLowerCase().replace(/[^a-zA-Z]/g, "")
    if (NUMBER_WORDS[clean]) {
      return w.toLowerCase().replace(clean, NUMBER_WORDS[clean])
    }
    return w
  })
  return result.join(" ")
}

export function mathsCleaner(text: string): string {
  if (!text) return text

  let result = text.toLowerCase()
  result = replaceNumberWords(result)

  for (const [pattern, replacement] of MATH_OPS) {
    result = result.replace(pattern, replacement)
  }

  result = result.replace(/\s+/g, " ").trim()
  result = capitalizeFirst(result)

  return result
}

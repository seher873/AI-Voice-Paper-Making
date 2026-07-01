import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"

export interface TagInfo {
  tag: string
  name: string
  value: string
}

export function extractTags(xmlText: string): string[] {
  const tagRegex = /\{(\w+)\}/g
  const tags: string[] = []
  let match
  while ((match = tagRegex.exec(xmlText)) !== null) {
    const fullTag = `{${match[1]}}`
    if (!tags.includes(fullTag)) {
      tags.push(fullTag)
    }
  }
  return tags
}

export async function parseDocx(file: File): Promise<{ tags: string[]; zipData: ArrayBuffer }> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = new PizZip(arrayBuffer)
  const docXml = zip.file("word/document.xml")?.asText()
  if (!docXml) {
    throw new Error("Invalid .docx file: missing document.xml")
  }
  const tags = extractTags(docXml)
  return { tags, zipData: arrayBuffer }
}

export function generateDocx(
  zipData: ArrayBuffer,
  tagValues: Record<string, string>
): Blob {
  const zip = new PizZip(zipData)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  doc.setData(tagValues)

  try {
    doc.render()
  } catch (error) {
    console.error("Docxtemplater render error:", error)
    throw error
  }

  const output = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })

  return output
}

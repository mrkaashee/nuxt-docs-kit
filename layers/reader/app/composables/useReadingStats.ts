/**
 * useReadingStats — word count, char count, and reading time from markdown/plain text.
 * Reading speed: 238 wpm (average adult silent reading).
 */

const WORDS_PER_MINUTE = 238

export interface ReadingStats {
  words: number
  chars: number
  charsNoSpaces: number
  readingTimeMin: number
  readingTimeSec: number
  /** Human-readable string, e.g. "3 min read" or "< 1 min read" */
  readingTimeLabel: string
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*_]{3,}\s*$/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/:{2,}[a-z][a-z0-9-]*(\{[^}]*\})?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function computeReadingStats(rawText: string): ReadingStats {
  const clean = stripMarkdown(rawText ?? "")
  const words = clean.length === 0 ? 0 : clean.split(/\s+/).filter(Boolean).length
  const chars = rawText.length
  const charsNoSpaces = rawText.replace(/\s/g, "").length
  const totalSeconds = Math.round((words / WORDS_PER_MINUTE) * 60)
  const readingTimeMin = Math.floor(totalSeconds / 60)
  const readingTimeSec = totalSeconds % 60
  const readingTimeLabel = words === 0 ? "—" : readingTimeMin < 1 ? "< 1 min read" : `${readingTimeMin} min read`
  return { words, chars, charsNoSpaces, readingTimeMin, readingTimeSec, readingTimeLabel }
}

export function useReadingStats(source: Ref<string> | ComputedRef<string>) {
  return computed(() => computeReadingStats(unref(source)))
}

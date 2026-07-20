/**
 * LaTeX detection and conversion utilities.
 * No external dependencies — pure string processing.
 */

/**
 * Checks if the text has LaTeX document or snippet characteristics.
 */
export function isLatexDocument(text: string): boolean {
  if (/\\documentclass|\\begin\{document\}|\\usepackage/.test(text)) return true
  let nonMathText = text.replace(/\$\$[\s\S]*?\$\$/g, "")
  nonMathText = nonMathText.replace(/\$(?:\\[\s\S]|[^\\$])+\$/g, "")
  return /\\begin\{|\\end\{|\\item\b|\\newpage\b|\\color\{|\\(?:centering|vfill|hfill|Large|large|Huge|huge)\b|\\section\{|\\subsection\{|\\textbf\{|\\\[|\\\(|\\\\\s*\n/.test(nonMathText)
}

function replaceCommandWithBraces(text: string, commandName: string, replaceFn: (content: string) => string): string {
  let index = 0
  const target = `\\${commandName}{`
  while (true) {
    const startIdx = text.indexOf(target, index)
    if (startIdx === -1) break
    let depth = 1; let endIdx = -1
    for (let i = startIdx + target.length; i < text.length; i++) {
      if (text[i] === "\\") { i++; continue }
      if (text[i] === "{") { depth++ }
      else if (text[i] === "}") { depth--; if (depth === 0) { endIdx = i; break } }
    }
    if (endIdx !== -1) {
      const content = text.slice(startIdx + target.length, endIdx)
      const replacement = replaceFn(content)
      text = text.slice(0, startIdx) + replacement + text.slice(endIdx + 1)
      index = startIdx + replacement.length
    } else { index = startIdx + target.length }
  }
  return text
}

function stripGroupingBraces(text: string): string {
  let index = 0
  while (index < text.length) {
    const braceIdx = text.indexOf("{", index)
    if (braceIdx === -1) break
    let prevChar = ""
    for (let i = braceIdx - 1; i >= 0; i--) {
      if (!/\s/.test(text[i] || "")) { prevChar = text[i] || ""; break }
    }
    const isGrouping = !/[\w\\}*]/.test(prevChar)
    if (isGrouping) {
      let depth = 1; let endIdx = -1
      for (let i = braceIdx + 1; i < text.length; i++) {
        if (text[i] === "\\") { i++; continue }
        if (text[i] === "{") { depth++ }
        else if (text[i] === "}") { depth--; if (depth === 0) { endIdx = i; break } }
      }
      if (endIdx !== -1) {
        text = text.slice(0, braceIdx) + text.slice(braceIdx + 1, endIdx) + text.slice(endIdx + 1)
        index = braceIdx; continue
      }
    }
    index = braceIdx + 1
  }
  return text
}

/**
 * Converts a LaTeX document or snippet string into Markdown.
 * Math environments are preserved as $$ ... $$ blocks for KaTeX rendering.
 */
export function convertLatexToMarkdown(latex: string): string {
  let md = latex
  const mathEnvs = ["align","align\\*","equation","equation\\*","gather","gather\\*","multline","multline\\*","alignat","alignat\\*"]
  for (const env of mathEnvs) {
    const rawEnv = env.replace("\\*", "*")
    const regex = new RegExp(`\\\\begin\\{${env}\\}([\\s\\S]*?)\\\\end\\{${env}\\}`, "g")
    md = md.replace(regex, `$$$$\n\\begin{${rawEnv}}$1\\end{${rawEnv}}\n$$$$`)
  }
  md = md.replace(/\\\[([\s\S]*?)\\\]/g, "$$$$\n$1\n$$$$")
  const parts = md.split("$$")
  for (let i = 0; i < parts.length; i += 2) {
    const rawSegment = parts[i]; if (rawSegment === undefined) continue
    let segment = rawSegment
    segment = segment.replace(/(?<!\\)%.*$/gm, "")
    segment = segment.replace(/\\(section|subsection|subsubsection)\*/g, "\\$1")
    segment = stripGroupingBraces(segment)
    segment = segment.replace(/\\\\\[.*?\]/g, "\n")
    segment = segment.replace(/\\documentclass[\s\S]*?\\begin\{document\}/, "")
    segment = segment.replace(/\\end\{document\}[\s\S]*/, "")
    segment = segment.replace(/\\usepackage(?:\[.*?\])?\{.*?\}/g, "")
    segment = segment.replace(/\\setstretch\{.*?\}|\\pagestyle\{.*?\}|\\fancyhf\{\}|\\fancyfoot\[.*?\]\{.*?\}|\\fancyhead\[.*?\]\{.*?\}|\\chead\{.*?\}|\\lhead\{.*?\}|\\rhead\{.*?\}|\\cfoot\{.*?\}|\\lfoot\{.*?\}|\\rfoot\{.*\}/g, "")
    segment = segment.replace(/\\tocloftclean|\\tableofcontents|\\addcontentsline\{.*?\}\{.*?\}\{.*\}/g, "")
    segment = segment.replace(/\\newtcolorbox(?:\[.*?\])?\{.*?\}\{[\s\S]*?\}/g, "")
    segment = segment.replace(/\\centering|\\vfill|\\hfill|\\indent|\\noindent|\\maketitle/g, "")
    segment = segment.replace(/\\quad/g, " ").replace(/\\qquad/g, "  ").replace(/~/g, " ")
    segment = segment.replace(/\\newpage|\\clearpage/g, "\n---\n")
    segment = replaceCommandWithBraces(segment, "color", () => "")
    segment = replaceCommandWithBraces(segment, "vspace", () => "")
    segment = replaceCommandWithBraces(segment, "hspace", () => "")
    segment = segment.replace(/\\color\b/g, "")
    segment = segment.replace(/\\(?:tiny|scriptsize|footnotesize|small|normalsize|large|Large|LARGE|huge|Huge)\b/g, "")
    segment = replaceCommandWithBraces(segment, "section", (c) => `# ${c.trim()}`)
    segment = replaceCommandWithBraces(segment, "subsection", (c) => `## ${c.trim()}`)
    segment = replaceCommandWithBraces(segment, "subsubsection", (c) => `### ${c.trim()}`)
    segment = replaceCommandWithBraces(segment, "textbf", (c) => `**${c}**`)
    segment = replaceCommandWithBraces(segment, "textit", (c) => `*${c}*`)
    segment = replaceCommandWithBraces(segment, "emph", (c) => `*${c}*`)
    segment = replaceCommandWithBraces(segment, "textsuperscript", (c) => `<sup>${c}</sup>`)
    segment = replaceCommandWithBraces(segment, "text", (c) => c)
    segment = segment.replace(/\\begin\{mybox\}\{([\s\S]*?)\}([\s\S]*?)\\end\{mybox\}/g, (_, title, body) => `::card{title="${title.trim()}"}\n${body.trim()}\n::`)
    segment = segment.replace(/\\begin\{tcolorbox\}([\s\S]*?)\\end\{tcolorbox\}/g, (_, body) => `::callout\n${body.trim()}\n::`)
    segment = segment.replace(/\\begin\{chaptertitlebox\}([\s\S]*?)\\end\{chaptertitlebox\}/g, (_, body) => `::card\n${body.trim()}\n::`)
    segment = segment.replace(/^[ \t]+/gm, "").replace(/[ \t]+$/gm, "")
    segment = segment.replace(/\\begin\{.*?\}(?:\{.*?\})?(?:\[.*?\])?/g, "")
    segment = segment.replace(/\\end\{.*?\}/g, "")
    segment = segment.replace(/\\item(?:\[.*?\])?/g, "-")
    segment = segment.replace(/\\begin\{itemize\}|\\end\{itemize\}|\\begin\{enumerate\}|\\end\{enumerate\}/g, "")
    segment = segment.replace(/\\\(|\\\)/g, "$")
    segment = segment.replace(/\\\\~\s*\\\\/g, "\n\n").replace(/\\\\~\s*/g, "\n\n").replace(/\\\\\s*\n/g, "\n").replace(/\\\\/g, "\n")
    parts[i] = segment
  }
  md = parts.join("$$")
  md = md.replace(/\n---\n(\s*\n---)+/g, "\n---\n")
  md = md.replace(/\n{3,}/g, "\n\n")
  return md.trim()
}

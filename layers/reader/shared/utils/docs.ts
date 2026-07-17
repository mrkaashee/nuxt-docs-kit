// ── sanitizeComarkAst ─────────────────────────────────────────────────────────
// Recursively strips attribute keys containing invalid HTML character sequences
// (like "=" or spaces) that crash Vue's vdom setAttribute on the client.
// Must run before passing a Comark AST to ComarkRenderer.

export function sanitizeComarkAst(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) return nodes
  return nodes.map((node) => {
    if (!Array.isArray(node)) return node
    const [tag, attrs, ...children] = node
    const cleanAttrs: Record<string, any> = {}
    if (attrs && typeof attrs === "object") {
      for (const [key, value] of Object.entries(attrs)) {
        if (key && !key.includes("=") && !key.includes(" ") && !key.includes('"') && !key.includes("'")) {
          cleanAttrs[key] = value
        }
      }
    }
    return [tag, cleanAttrs, ...sanitizeComarkAst(children)]
  })
}

// ── resolveDocPageTitle ───────────────────────────────────────────────────────

export type DocPageTitleContext = "head" | "h1" | "breadcrumb" | "nav"

export function resolveDocPageTitle(
  page: { title: string; seo?: { title?: string }; navigation?: true | false | { title: string } },
  context: DocPageTitleContext,
): string {
  switch (context) {
    case "head":
      return page.seo?.title?.trim() || page.title
    case "h1":
    case "breadcrumb":
      return page.title
    case "nav":
      if (page.navigation && typeof page.navigation === "object" && "title" in page.navigation) {
        return page.navigation.title
      }
      return page.title
  }
}

// ── isLatexDocument ───────────────────────────────────────────────────────────

export function isLatexDocument(text: string): boolean {
  if (/\\documentclass|\\begin\{document\}|\\usepackage/.test(text)) return true
  let nonMath = text.replace(/\$\$[\s\S]*?\$\$/g, "").replace(/\$(?:\\[\s\S]|[^\\$])+\$/g, "")
  return /\\begin\{|\\end\{|\\item\b|\\newpage\b|\\color\{|\\(?:centering|vfill|hfill|Large|large|Huge|huge)\b|\\section\{|\\subsection\{|\\textbf\{|\\\[|\\\(|\\\\\s*\n/.test(nonMath)
}

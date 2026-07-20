/**
 * Comark AST utilities for the reader layer.
 * No Qarpeo-specific dependencies — safe to use in any project.
 */

/**
 * Recursively sanitizes attributes in a Comark AST tree.
 * Removes keys containing invalid HTML characters (=, spaces, quotes).
 */
export function sanitizeComarkAst(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) return nodes
  return nodes.map((node) => {
    if (!Array.isArray(node)) return node
    const [tag, attrs, ...children] = node
    const cleanAttrs: Record<string, any> = {}
    if (attrs && typeof attrs === "object") {
      for (const [key, value] of Object.entries(attrs)) {
        if (
          key &&
          !key.includes("=") &&
          !key.includes(" ") &&
          !key.includes('"') &&
          !key.includes("'")
        ) {
          cleanAttrs[key] = value
        }
      }
    }
    return [tag, cleanAttrs, ...sanitizeComarkAst(children)]
  })
}

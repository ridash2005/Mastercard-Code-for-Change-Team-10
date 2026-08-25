// Lightweight `{placeholder}` interpolation for dictionary strings that need
// a dynamic value (a count, a name, a percentage) - e.g.
// formatT(t.helloGreeting, { name: "Ananya" }) for "Hello, {name}". Kept
// separate from provider.tsx so it can be imported into plain (non-hook)
// contexts too if that's ever needed.
export function formatT(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

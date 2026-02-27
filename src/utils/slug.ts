/**
 * Sanitizes a string to be URL-safe slug
 * - Trims whitespace
 * - Converts spaces to hyphens
 * - Lowercases
 * - Collapses multiple hyphens
 */
export function sanitizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

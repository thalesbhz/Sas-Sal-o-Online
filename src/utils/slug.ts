/**
 * Utility to generate client-friendly brand slugs for salons.
 * It removes all accents, converts to lowercase, and removes whitespace/special symbols
 * to yield a beautiful, clean run-together address part.
 * Example: "Estúdio Amanda Martins" -> "estudioamandamartins"
 */
export const getSalonSlug = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .replace(/[^a-z0-9-]/g, '')     // Keep only letters, numbers, hyphens
    .replace(/-+/g, '')             // Remove hyphens if run together or keep them simple. Let's completely strip space/hyphen to meet "estudioamandamartins"
    .trim();
};

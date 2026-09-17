/** "Casa Melipilla" -> "casa-melipilla". Sin tildes, sin caracteres raros. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Sufijo corto para que el slug sea único sin depender de un contador en la base. */
export function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

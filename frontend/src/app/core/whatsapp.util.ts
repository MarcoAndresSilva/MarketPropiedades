/** `whatsapp` viene en formato E.164 con "+" (ej. "+56912345678") — wa.me lo quiere sin el "+". */
export function buildWhatsappUrl(whatsapp: string, text: string): string {
  const digitsOnly = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`;
}

/**
 * Lleva a E.164 un celular chileno escrito como lo escribe la gente ("9 1234 5678",
 * "+56 9 1234 5678", "56912345678"). Si no calza con ninguno, lo devuelve tal cual y el
 * backend responde con el formato esperado.
 */
export function normalizarWhatsapp(valor: string): string {
  const limpio = valor.replace(/[\s().-]/g, '');
  if (/^9\d{8}$/.test(limpio)) return `+56${limpio}`;
  if (/^569\d{8}$/.test(limpio)) return `+${limpio}`;
  return limpio;
}

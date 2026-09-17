/** `whatsapp` viene en formato E.164 con "+" (ej. "+56912345678") — wa.me lo quiere sin el "+". */
export function buildWhatsappUrl(whatsapp: string, text: string): string {
  const digitsOnly = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`;
}

/** Copy and contact — keep this the single place for names. */
export const SITE = {
  facilitators: "Isaac Calderón y Claudia Saviñón",
  home: "https://terrasana.pro/",
  /** Set when Isaac confirms the inbox. Empty = do not invent an address. */
  inbox: "",
  /**
   * Correos que pueden abrir /expedientes.
   * Vacío = la primera persona que entra por /adminlogin queda como staff.
   * Después, Isaac invita a Claudia desde el panel.
   */
  adminEmails: [] as string[],
  crisis: {
    name: "Línea de la Vida",
    phone: "800 911 2000",
  },
} as const;

export function mailtoFicha(subject: string, body: string): string | null {
  if (!SITE.inbox) return null;
  return `mailto:${SITE.inbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Copy and contact — keep this the single place for names. */
export const SITE = {
  /**
   * Quién acompaña, en genérico.
   *
   * Nombrar a Isaac y a Claudia creaba la expectativa de que ellos dos hacen
   * todas las entrevistas, y también las hace Isaura. Petición de Claudia.
   */
  facilitators: "los facilitadores",
  home: "https://terrasana.pro/",
  /** Set when Isaac confirms the inbox. Empty = do not invent an address. */
  inbox: "",
  /**
   * Única fuente de verdad de quién puede crear acceso al archivo interno.
   *
   * No hay regla de arranque: si esta lista está vacía nadie entra, en vez de
   * que la primera persona en llegar se vuelva staff. Esa regla convirtió en
   * staff a quien entró primero cuando la base se creó de cero al conectar Neon.
   *
   * Para sumar a alguien: agrégalo aquí, o autorízalo desde el panel (queda en
   * staff_invites, que vale una sola vez).
   */
  adminEmails: [
    "isaac.calderon.d@gmail.com",
    "isaac@cienciapsicodelica.com",
    "isaura.maro@gmail.com",
    "clausavinon@gmail.com",
  ] as string[],
  crisis: {
    name: "Línea de la Vida",
    phone: "800 911 2000",
  },
} as const;

export function mailtoFicha(subject: string, body: string): string | null {
  if (!SITE.inbox) return null;
  return `mailto:${SITE.inbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

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
  /**
   * A quién avisar.
   *
   * Son los únicos números del sitio. No hay una línea de crisis pública: la que
   * venía heredada del código original nunca se pudo verificar, y un número que
   * no sabemos si contesta es peor que ninguno — quien marca en un mal momento y
   * no obtiene respuesta aprende que pedir ayuda no sirve. Decisión de Isaac.
   *
   * `tel` va en formato internacional con los diez dígitos del número mexicano,
   * que es como se marca desde 2019. `display` es como se lee en pantalla.
   */
  contacts: [
    { name: "Isaac Calderón", tel: "+524424752806", display: "+52 442 475 2806" },
    { name: "Claudia Saviñón", tel: "+525554325764", display: "+52 55 5432 5764" },
    { name: "Isaura Madinabeita", tel: "+528711061805", display: "+52 871 106 1805" },
  ],
} as const;

export function mailtoFicha(subject: string, body: string): string | null {
  if (!SITE.inbox) return null;
  return `mailto:${SITE.inbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Legales por app. Una sola web aloja privacidad, soporte y términos de todas
 * las apps. Publicar una app nueva = una entrada aquí (y `docs` marca qué
 * documentos genera). El texto sale de una plantilla parametrizada por flags.
 */
import type { Lang } from "@i18n/ui";

export type LegalDoc = "privacy" | "support" | "terms";

export interface LegalApp {
  slug: string;
  name: string;
  supportEmail: string;
  /** Fecha de última actualización, "YYYY-MM-DD". */
  updated: string;
  /** Muestra anuncios con Google AdMob. */
  usesAds: boolean;
  /** Los datos se guardan localmente en el dispositivo (no en servidores). */
  offlineFirst: boolean;
  docs: LegalDoc[];
}

export const legalApps: LegalApp[] = [
  {
    slug: "finclarity",
    name: "FinClarity",
    supportEmail: "finclarity.support@gmail.com",
    updated: "2026-08-21",
    usesAds: true,
    offlineFirst: true,
    docs: ["privacy", "support", "terms"],
  },
];

export function getLegalApp(slug: string): LegalApp | undefined {
  return legalApps.find((a) => a.slug === slug);
}

export const DOC_LABEL: Record<LegalDoc, { es: string; en: string }> = {
  privacy: { es: "Política de Privacidad", en: "Privacy Policy" },
  support: { es: "Soporte", en: "Support" },
  terms: { es: "Términos y Condiciones", en: "Terms & Conditions" },
};

export const UPDATED_LABEL = { es: "Última actualización", en: "Last updated" };
export const CONTACT_LABEL = { es: "Contacto", en: "Contact" };
export const BACK_LABEL = { es: "Volver al proyecto", en: "Back to project" };

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

type BL = { es: string; en: string };
const pick = (v: BL, l: Lang) => v[l];

/** Genera las secciones de un documento legal para una app e idioma. */
export function buildLegalDoc(app: LegalApp, doc: LegalDoc, lang: Lang): LegalSection[] {
  const n = app.name;
  const mail = app.supportEmail;
  const S = (es: string, en: string): string => pick({ es, en }, lang);

  if (doc === "privacy") {
    const sections: LegalSection[] = [];
    sections.push({
      heading: S("Introducción", "Introduction"),
      paragraphs: [
        app.offlineFirst
          ? S(
              `${n} es una aplicación con enfoque offline-first: la información que introduces se almacena localmente en tu dispositivo. Esta política explica qué datos se manejan y cómo.`,
              `${n} is an offline-first application: the information you enter is stored locally on your device. This policy explains what data is handled and how.`,
            )
          : S(
              `Esta política explica qué información maneja ${n} y cómo se utiliza.`,
              `This policy explains what information ${n} handles and how it is used.`,
            ),
      ],
    });
    sections.push({
      heading: S("Qué información recopilamos", "What we collect"),
      paragraphs: [
        app.offlineFirst
          ? S(
              `${n} no recopila ni guarda tus datos en servidores propios. La información que creas (transacciones, categorías, cuentas, notas y ajustes) se almacena localmente en tu dispositivo.`,
              `${n} does not collect or store your data on our own servers. The information you create (transactions, categories, accounts, notes and settings) is stored locally on your device.`,
            )
          : S(
              `${n} solo recopila la información necesaria para funcionar. No se venden ni se comparten tus datos con terceros con fines publicitarios.`,
              `${n} only collects the information required to work. Your data is not sold or shared with third parties for advertising.`,
            ),
      ],
    });
    if (app.usesAds) {
      sections.push({
        heading: S("Anuncios (Google AdMob)", "Advertising (Google AdMob)"),
        paragraphs: [
          S(
            `${n} utiliza Google Mobile Ads (AdMob). Según tu consentimiento, los anuncios pueden ser personalizados. AdMob puede recopilar identificadores del dispositivo (como el Advertising ID), la dirección IP e información técnica para mostrar y medir la publicidad.`,
            `${n} uses Google Mobile Ads (AdMob). Depending on your consent, ads may be personalized. AdMob may collect device identifiers (such as the Advertising ID), IP address and technical information to serve and measure ads.`,
          ),
        ],
      });
    }
    sections.push({
      heading: S("Almacenamiento de datos", "Data storage"),
      paragraphs: [
        app.offlineFirst
          ? S(
              `Todos los datos de ${n} se almacenan localmente en tu dispositivo. Si borras los datos desde la app, limpias su almacenamiento o desinstalas la aplicación, los datos locales se eliminan. Como no se guardan en servidores, los datos eliminados no se pueden recuperar.`,
              `All ${n} data is stored locally on your device. If you clear the data from within the app, clear its storage or uninstall the application, the local data is removed. Since it is not stored on servers, deleted data cannot be recovered.`,
            )
          : S(
              `Aplicamos medidas razonables para proteger tu información. Puedes solicitar la eliminación de tus datos escribiéndonos.`,
              `We apply reasonable measures to protect your information. You may request deletion of your data by contacting us.`,
            ),
      ],
    });
    sections.push({
      heading: S("Cambios a esta política", "Changes to this policy"),
      paragraphs: [
        S(
          `Podemos actualizar esta política ocasionalmente. La fecha de la última actualización aparece al inicio de este documento.`,
          `We may update this policy from time to time. The last updated date appears at the top of this document.`,
        ),
      ],
    });
    return sections;
  }

  if (doc === "support") {
    return [
      {
        heading: S("Cómo obtener ayuda", "Getting help"),
        paragraphs: [
          S(
            `¿Tienes una pregunta o un problema con ${n}? Estás en el lugar correcto. Abajo encontrarás respuestas frecuentes y cómo contactarnos.`,
            `Have a question or a problem with ${n}? You're in the right place. Below you'll find common answers and how to reach us.`,
          ),
        ],
      },
      {
        heading: S("Preguntas frecuentes", "Frequently asked questions"),
        paragraphs: [
          S(
            `¿Cómo registro información? Abre la app y crea un nuevo registro; selecciona las opciones y guarda.`,
            `How do I add information? Open the app and create a new entry; choose the options and save.`,
          ),
          app.offlineFirst
            ? S(
                `¿Cómo borro mis datos? Usa la opción de la app para borrar todos los datos, o limpia el almacenamiento de la app / desinstálala. Los datos borrados no se pueden recuperar porque no se guardan en la nube.`,
                `How do I delete my data? Use the in-app option to delete all data, or clear the app's storage / uninstall it. Deleted data cannot be recovered because it is not stored in the cloud.`,
              )
            : S(
                `¿Cómo borro mi cuenta o mis datos? Escríbenos y gestionamos la eliminación.`,
                `How do I delete my account or data? Contact us and we'll handle the deletion.`,
              ),
          app.usesAds
            ? S(
                `¿Cómo funcionan los anuncios? Al abrir la app puedes elegir si permites anuncios personalizados. Si los permites, AdMob puede usar identificadores del dispositivo para mostrar anuncios más relevantes.`,
                `How do ads work? On first launch you can choose whether to allow personalized ads. If you allow them, AdMob may use device identifiers to show more relevant ads.`,
              )
            : "",
        ].filter(Boolean),
      },
      {
        heading: S("Solución de problemas", "Troubleshooting"),
        paragraphs: [
          S(
            `Intenta actualizar la app, reiniciar el dispositivo y verificar tu conexión a internet. Si el problema continúa, escríbenos con el modelo de tu dispositivo y la versión del sistema.`,
            `Try updating the app, restarting your device and checking your internet connection. If the problem persists, contact us with your device model and system version.`,
          ),
        ],
      },
    ];
  }

  // doc === "terms"
  const terms: LegalSection[] = [
    {
      heading: S("Aceptación de los términos", "Acceptance of terms"),
      paragraphs: [
        S(
          `Al descargar o usar ${n} aceptas estos Términos y Condiciones. Si no estás de acuerdo, no utilices la aplicación.`,
          `By downloading or using ${n} you agree to these Terms & Conditions. If you do not agree, do not use the application.`,
        ),
      ],
    },
    {
      heading: S("Uso de la aplicación", "Use of the application"),
      paragraphs: [
        S(
          `Se te concede una licencia personal, limitada y no exclusiva para usar ${n} en tus dispositivos. Te comprometes a no realizar ingeniería inversa, redistribuir ni usar la app con fines ilícitos.`,
          `You are granted a personal, limited and non-exclusive license to use ${n} on your devices. You agree not to reverse engineer, redistribute or use the app for unlawful purposes.`,
        ),
      ],
    },
    {
      heading: S("Propiedad intelectual", "Intellectual property"),
      paragraphs: [
        S(
          `${n}, su diseño, código y marca son propiedad de su autor. El contenido que tú generas te pertenece.`,
          `${n}, its design, code and brand belong to its author. The content you create belongs to you.`,
        ),
      ],
    },
    {
      heading: S("Garantías y responsabilidad", "Warranties and liability"),
      paragraphs: [
        S(
          `${n} se ofrece "tal cual", sin garantías de ningún tipo. En la medida permitida por la ley, el autor no será responsable de daños derivados del uso o la imposibilidad de uso de la aplicación. ${n} no constituye asesoramiento profesional.`,
          `${n} is provided "as is", without warranties of any kind. To the extent permitted by law, the author is not liable for damages arising from the use or inability to use the application. ${n} does not constitute professional advice.`,
        ),
      ],
    },
  ];
  if (app.usesAds) {
    terms.push({
      heading: S("Anuncios", "Advertising"),
      paragraphs: [
        S(
          `La aplicación puede mostrar anuncios de terceros a través de Google AdMob. El uso de esos anuncios se rige también por las políticas de Google.`,
          `The application may display third-party ads through Google AdMob. The use of those ads is also governed by Google's policies.`,
        ),
      ],
    });
  }
  terms.push({
    heading: S("Cambios a los términos", "Changes to the terms"),
    paragraphs: [
      S(
        `Podemos actualizar estos términos ocasionalmente. El uso continuado de la app tras los cambios implica su aceptación.`,
        `We may update these terms from time to time. Continued use of the app after changes implies acceptance.`,
      ),
    ],
  });
  return terms;
}

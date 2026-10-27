/**
 * Textos legales centralizados de FinPal.
 * Cubre jurisdicción boliviana (Ley N° 393 ASFI, Código Civil Arts. 409-414, CPE Art. 21.2 Hábeas Data, Ley N° 164),
 * estándares de EE. UU. (AS-IS Disclaimer, Limitation of Liability $0 USD, Class Action Waiver, FDCPA/FCRA Disclaimer, CCPA, COPPA +18)
 * y normativa internacional de privacidad y deslinde de Inteligencia Artificial / cálculos automatizados.
 */

export const LEGAL_VERSION = "2026.10";
export const LEGAL_EFFECTIVE_DATE = "27 de octubre de 2026";

export interface LegalSection {
  id: string;
  titulo: string;
  parrafos: string[];
}

export const TERMINOS_DE_SERVICIO: LegalSection[] = [
  {
    id: "naturaleza-software",
    titulo: "1. Naturaleza del Software y Ausencia de Intermediación Financiera",
    parrafos: [
      "FinPal es exclusivamente una herramienta informática de registro contable personal y calculadora matemática de amortizaciones (Software as a Service / Open Source). FinPal NO es un banco, entidad de intermediación financiera, cooperativa, empresa de servicios de pago, transmisor de dinero ni custodio de fondos.",
      "En cumplimiento de la Ley N° 393 de Servicios Financieros del Estado Plurinacional de Bolivia (supervisada por la ASFI) y de las leyes financieras internacionales (incluyendo FinCEN, leyes bancarias estatales y federales de los Estados Unidos), FinPal no capta recursos del público, no otorga créditos, no procesa transferencias de dinero real ni interviene en la negociación entre acreedores y deudores.",
      "Para usuarios en los Estados Unidos y otras jurisdicciones: FinPal NO es una agencia de cobro de deudas bajo la Fair Debt Collection Practices Act (FDCPA, 15 U.S.C. § 1692) ni una agencia de informes de crédito bajo la Fair Credit Reporting Act (FCRA, 15 U.S.C. § 1681).",
    ],
  },
  {
    id: "cumplimiento-usura",
    titulo: "2. Cumplimiento Legal de Tasas de Interés, Prohibición de Usura y Obligaciones Tributarias",
    parrafos: [
      "Los porcentajes, plazos, monedas y montos ingresados en FinPal son configurados de manera libre y bajo exclusiva responsabilidad del Usuario. FinPal no fija, recomienda ni avala tasas de interés.",
      "El Usuario declara y garantiza que utilizará la plataforma respetando estrictamente los límites máximos de interés convencional y las normas contra la usura y el anatocismo vigentes en su país o estado de residencia (por ejemplo, en Bolivia, los Artículos 409 al 414 del Código Civil y el Artículo 360 del Código Penal que regulan el interés máximo legal y convencional; o las leyes estatales de usura aplicables en EE. UU. y la Unión Europea).",
      "El cumplimiento de obligaciones fiscales, impositivas o de facturación derivadas de los préstamos o movimientos registrados recae única y exclusivamente sobre el Usuario.",
    ],
  },
  {
    id: "deslinde-ia",
    titulo: "3. Deslinde de Responsabilidad sobre Inteligencia Artificial, 'Smart Insights' y Proyecciones Automatizadas",
    parrafos: [
      "FinPal incluye paneles estadísticos, cálculos automatizados de concentración de cartera, proyecciones de flujo de caja y funciones de análisis inteligente ('Smart Insights'). Toda información, alerta, métrica o sugerencia generada por algoritmos o modelos automatizados se ofrece únicamente con fines ilustrativos e informativos.",
      "NO ASESORAMIENTO PROFESIONAL: Ningún resultado, proyección o indicador del sistema constituye asesoramiento financiero, legal, contable, tributario ni calificación de riesgo crediticio (Credit Scoring). Los sistemas automatizados e inteligencia artificial pueden presentar imprecisiones, errores de redondeo o interpretaciones incompletas del contexto real.",
      "El Usuario asume el riesgo total de verificar manualmente cualquier cálculo antes de tomar decisiones económicas o celebrar contratos con terceros, liberando al autor y operadores de FinPal de cualquier reclamo por lucro cesante, pérdida de capital o daños por confianza ('Reliance Damages' / 'Negligent Misrepresentation').",
    ],
  },
  {
    id: "datos-terceros",
    titulo: "4. Registro de Datos de Terceros (Contactos / Deudores) e Indemnidad",
    parrafos: [
      "Al registrar nombres, teléfonos, correos electrónicos o notas sobre terceras personas (contactos o deudores), el Usuario actúa como único 'Responsable del Tratamiento' (Data Controller) en el marco de su actividad privada o doméstica, mientras que FinPal actúa únicamente como infraestructura tecnológica de almacenamiento cifrado ('Data Processor').",
      "El Usuario garantiza contar con el consentimiento o base legal suficiente para registrar dichos datos de contacto y se obliga a mantener indemne, defender y resarcir al creador y operadores de FinPal frente a cualquier demanda, reclamo administrativo, acción de protección de privacidad o gasto legal iniciado por terceros o autoridades.",
    ],
  },
  {
    id: "uso-aceptable-antiabuso",
    titulo: "5. Uso Aceptable, Cuotas del Sistema y Protección Anti-Sobrecostos (Anti-DoW)",
    parrafos: [
      "Con el fin de garantizar la estabilidad y gratuidad del servicio, FinPal aplica límites técnicos automatizados (Rate Limiting y cuotas máximas de almacenamiento por cuenta y espacio de trabajo).",
      "Queda estrictamente prohibido utilizar bots, scrapers de inteligencia artificial, scripts automatizados, ataques de denegación de servicio o denegación de billetera ('Denial of Wallet'), inyección de cargas masivas o intentos de vulnerar las políticas Row Level Security (RLS). Las cuentas que generen tráfico anómalo o abusivo podrán ser suspendidas o eliminadas sin previo aviso.",
    ],
  },
  {
    id: "sin-garantias-responsabilidad",
    titulo: "6. Exclusión de Garantías ('AS IS') y Limitación Máxima de Responsabilidad ($0.00 USD)",
    parrafos: [
      "EL SOFTWARE SE PROPORCIONA 'TAL CUAL' ('AS IS') Y 'SEGÚN DISPONIBILIDAD' ('AS AVAILABLE'), SIN GARANTÍAS DE NINGÚN TIPO, EXPRESAS O IMPLÍCITAS, INCLUYENDO PERO NO LIMITADO A GARANTÍAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR, DISPONIBILIDAD ININTERRUMPIDA O AUSENCIA DE ERRORES.",
      "EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE (TANTO EN BOLIVIA COMO EN ESTADOS UNIDOS Y OTRAS JURISDICCIONES), LA RESPONSABILIDAD TOTAL ACUMULADA DEL CREADOR, COLABORADORES Y OPERADORES DE FINPAL POR CUALQUIER RECLAMO, DAÑO DIRECTO, INDIRECTO, INCIDENTAL, CONSECUENCIAL, PÉRDIDA DE DATOS O PÉRDIDA FINANCIERA NO EXCEDERÁ EL MONTO DE CERO DÓLARES ESTADOUNIDENSES ($0.00 USD) O EL IMPORTE EFECTIVAMENTE PAGADO POR EL USUARIO EN LOS ÚLTIMOS DOCE (12) MESES.",
    ],
  },
  {
    id: "ley-aplicable-arbitraje",
    titulo: "7. Ley Aplicable, Jurisdicción Exclusiva en Bolivia y Renuncia a Demandas Colectivas (Class Action Waiver)",
    parrafos: [
      "Elegibilidad: El uso de FinPal está reservado exclusivamente a personas mayores de 18 años con plena capacidad legal de obrar (en cumplimiento del Código Civil Boliviano y de la ley COPPA de EE. UU.).",
      "Ley Aplicable y Jurisdicción: Estos Términos se rigen e interpretan de conformidad con las leyes del Estado Plurinacional de Bolivia, sin dar efecto a principios de conflicto de leyes internacionales. Cualquier controversia que no pueda resolverse de forma amistosa se someterá a la jurisdicción exclusiva de los tribunales y centros de conciliación competentes de Bolivia, renunciando el Usuario a cualquier otro fuero que pudiera corresponderle por razón de su domicilio presente o futuro.",
      "RENUNCIA A DEMANDAS COLECTIVAS (CLASS ACTION WAIVER PARA EE. UU. E INTERNACIONAL): En la medida permitida por la ley, el Usuario acepta que cualquier reclamo o disputa se resolverá únicamente de manera individual y NO como demandante ni miembro de clase en ninguna acción colectiva, consolidada o representativa ('Class Action').",
    ],
  },
];

export const POLITICA_DE_PRIVACIDAD: LegalSection[] = [
  {
    id: "arquitectura-seguridad",
    titulo: "1. Cifrado Criptográfico en Servidor y Aislamiento por Fila (RLS)",
    parrafos: [
      "FinPal protege la confidencialidad de tu información mediante dos capas técnicas independientes: (a) Aislamiento estricto a nivel de fila (Row Level Security - RLS) en PostgreSQL/Supabase, garantizando que cada espacio de trabajo solo sea accesible por su propietario autenticado; y (b) Cifrado autenticado AES-256-GCM en servidor (Server-Side Field Encryption) para campos sensibles como nombres de contactos, teléfonos, correos electrónicos y notas.",
      "Transparencia Técnica: El cifrado se ejecuta en el entorno seguro del servidor antes de almacenarse en la base de datos (cifrado en reposo a nivel de aplicación) y las comunicaciones viajan sobre HTTPS/TLS 1.3.",
    ],
  },
  {
    id: "cero-venta-cero-entrenamiento-ia",
    titulo: "2. Cero Venta de Datos y No Entrenamiento de Modelos de IA",
    parrafos: [
      "FinPal NO vende, alquila, comercializa ni comparte tus datos personales o financieros con corredores de datos (Data Brokers), redes publicitarias ni terceros (cumpliendo con CCPA/CPRA de California, GDPR europeo y protección constitucional en Bolivia).",
      "Los registros financieros, saldos, préstamos y contactos almacenados en tu cuenta NUNCA se utilizan para entrenar modelos públicos o externos de Inteligencia Artificial (LLMs). Asimismo, FinPal bloquea activamente mediante directivas técnicas los bots de raspado de entrenamiento de IA.",
    ],
  },
  {
    id: "subprocesadores",
    titulo: "3. Infraestructura y Subprocesadores Tecnológicos",
    parrafos: [
      "Para operar el servicio en la nube, FinPal utiliza exclusivamente proveedores de infraestructura líderes con certificaciones SOC 2 Tipo II e ISO 27001: Vercel Inc. (alojamiento de aplicación web y ejecución sin servidor) y Supabase Inc. (base de datos PostgreSQL gestionada y autenticación).",
      "Únicamente se emplean cookies técnicas estrictamente necesarias (HttpOnly / SameSite) para mantener tu sesión autenticada y aplicar el cierre automático por inactividad (20 minutos). No utilizamos cookies de rastreo publicitario de terceros.",
    ],
  },
  {
    id: "derechos-arco-olvido",
    titulo: "4. Soberanía de Datos, Portabilidad y Derecho al Olvido (Bolivia, CCPA, GDPR)",
    parrafos: [
      "En cumplimiento del Artículo 21.2 y 130 de la Constitución Política del Estado Plurinacional de Bolivia (Acción de Protección de Privacidad / Hábeas Data), la Ley N° 164, el GDPR de la Unión Europea y la CCPA de Estados Unidos, tienes control total y permanente sobre tu información:",
      "• Derecho de Acceso y Portabilidad: Puedes exportar en cualquier momento todos tus préstamos, cobros y movimientos en formatos abiertos (CSV, Excel y reportes PDF) desde el panel de Reportes.",
      "• Derecho de Rectificación y Supresión (Derecho al Olvido): Desde la sección de Configuración puedes eliminar de forma inmediata, autónoma e irreversible tu cuenta de usuario junto con todos tus espacios de trabajo, contactos, préstamos y registros asociados en la base de datos.",
    ],
  },
];

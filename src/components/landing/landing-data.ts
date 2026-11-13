export const GITHUB_WEB_URL = "https://github.com/chacaejosue/finpal";

export interface BorrowerPreview {
  initials: string;
  name: string;
  detail: string;
  capital: string;
  interest: string;
  date: string;
  status: string;
  late: boolean;
}

export const borrowers: BorrowerPreview[] = [
  {
    initials: "CR",
    name: "Carlos Ramírez",
    detail: "Préstamo personal",
    capital: "$1,200.00",
    interest: "+2.5% mes ($30.00)",
    date: "En 5 días",
    status: "Al día",
    late: false,
  },
  {
    initials: "MV",
    name: "Mariana Vega",
    detail: "Cuota de taller",
    capital: "$450.00",
    interest: "+2% mes ($9.00)",
    date: "Ayer",
    status: "Con atraso (1 d)",
    late: true,
  },
  {
    initials: "JP",
    name: "Jorge Peña",
    detail: "Equipos de oficina",
    capital: "$1,800.00",
    interest: "+3% mes ($54.00)",
    date: "En 18 días",
    status: "Al día",
    late: false,
  },
];

export const faqs = [
  {
    pregunta: "¿Qué es FinPal y para qué sirve?",
    respuesta:
      "Es una plataforma web para registrar préstamos personales, calcular intereses, emitir recibos y controlar el saldo de tus cuentas en un solo lugar.",
  },
  {
    pregunta: "¿Cómo calcula los intereses y amortizaciones?",
    respuesta:
      "Puedes elegir entre cobro de solo interés mensual fijo o cuotas con amortización a capital bajo Sistema Francés. El sistema recalcula saldos y genera comprobantes automáticamente.",
  },
  {
    pregunta: "¿Qué pasa si un deudor se atrasa en su pago?",
    respuesta:
      "FinPal activa una alerta visual automática con semáforo de puntualidad y contabiliza los días exactos de mora sin cargos ocultos.",
  },
  {
    pregunta: "¿Mis datos financieros están seguros?",
    respuesta:
      "Sí. Aplicamos cifrado AES-256 en servidor sobre nombres, teléfonos y notas, y aislamiento estricto por usuario mediante políticas RLS en base de datos.",
  },
  {
    pregunta: "¿Puedo separar finanzas personales de préstamos y usar otra moneda?",
    respuesta:
      "Sí. Puedes crear múltiples espacios de trabajo independientes (para negocios, familiares o cuentas personales) y configurar la moneda que necesites, como USD ($), BOB (Bs) u otras divisas.",
  },
  {
    pregunta: "¿Tiene algún costo o suscripción?",
    respuesta:
      "No. FinPal es un proyecto independiente de código abierto, libre de suscripciones y sin publicidad invasiva.",
  },
];

export const metrics = [
  { value: "100%", label: "Libre de suscripciones", highlight: false },
  { value: "AES-256", label: "Cifrado en servidor", highlight: true },
  { value: "En la nube", label: "PC, tablet y móvil", highlight: false },
  { value: "Multi-espacio", label: "Carteras separadas", highlight: false },
];

"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, type MouseEvent } from "react";
import { FinPalLogo } from "@/components/finpal-logo";
import { ContactAvatar } from "@/components/contact-avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { MODO_MANTENIMIENTO } from "@/config/mantenimiento";
import { PantallaMantenimiento } from "@/components/pantalla-mantenimiento";
import { resetGlobalThemeColors, clearSessionAccent } from "@/lib/theme-utils";
import {
  ArrowUp,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Code2,
  Copy,
  ExternalLink,
  Handshake,
  HelpCircle,
  Landmark,
  LogIn,
  Percent,
  Plus,
  Terminal,
  WalletCards,
  X,
  ShieldCheck,
} from "lucide-react";

const githubUrl = "https://github.com/chacaejosue/finpal.git";
const githubWebUrl = "https://github.com/chacaejosue/finpal";
const cloneCommand = "git clone https://github.com/chacaejosue/finpal.git";

const borrowers = [
  {
    initials: "CR",
    name: "Carlos Ramírez",
    detail: "Préstamo personal",
    capital: "$1,200.00",
    interest: "+5% mes ($60.00)",
    date: "15 Oct 2024",
    status: "Al día",
    late: false,
    color: "bg-primary-fixed text-on-primary-fixed",
  },
  {
    initials: "MV",
    name: "Mariana Vega",
    detail: "Cuota de taller",
    capital: "$450.00",
    interest: "+3% mes ($13.50)",
    date: "Ayer (10 Oct)",
    status: "Con atraso (1 d)",
    late: true,
    color: "bg-secondary-container text-on-secondary-container",
  },
  {
    initials: "JP",
    name: "Jorge Peña",
    detail: "Equipos de oficina",
    capital: "$1,800.00",
    interest: "+4.5% mes ($81.00)",
    date: "28 Oct 2024",
    status: "Al día",
    late: false,
    color: "bg-surface-container text-on-surface",
  },
];

const features = [
  {
    title: "Cuentas organizadas",
    description: "Separa espacios personales o proyectos sin mezclar saldos, movimientos ni información.",
    icon: Landmark,
    bgColor: "kpi-icon-blue",
  },
  {
    title: "Movimientos claros",
    description: "Registra entradas, salidas y ajustes para entender cómo cambia el dinero disponible.",
    icon: Percent,
    bgColor: "kpi-icon-teal",
  },
  {
    title: "Cobros y fechas",
    description: "Conserva la fecha esperada y la fecha real de cada cobro, incluidos atrasos y abonos parciales.",
    icon: CalendarDays,
    bgColor: "kpi-icon-amber",
  },
  {
    title: "Préstamos en contexto",
    description: "Consulta préstamos, intereses y estados junto con el resto de tu información financiera.",
    icon: WalletCards,
    bgColor: "kpi-icon-emerald",
  },
];

const faqs = [
  {
    pregunta: "¿Qué es FinPal y para qué sirve?",
    respuesta:
      "FinPal es una plataforma web creada para el control inteligente de préstamos personales, cobro programado de intereses mensuales fijos o porcentuales, gestión de amortizaciones a capital y balance centralizado de cuentas de dinero (efectivo, bancos y billeteras móviles).",
  },
  {
    pregunta: "¿Cómo calcula FinPal los intereses mensuales y amortizaciones?",
    respuesta:
      "Calcula el interés aplicando el porcentaje pactado sobre el capital vigente. Puedes registrar cobros de interés mensual, abonos parciales o amortizaciones a capital, recalculando automáticamente el saldo deudor y la cuota esperada para el siguiente período sin perder el historial.",
  },
  {
    pregunta: "¿Cómo me ayuda a evitar olvidos y atrasos en los cobros?",
    respuesta:
      "Cada préstamo define su fecha de inicio y su día mensual de cobro. FinPal categoriza de forma automática los cobros al día, los próximos a vencer y los atrasados, mostrándote alertas visuales y el número exacto de días transcurridos para un control puntual.",
  },
  {
    pregunta: "¿Mis datos financieros y de mis contactos están protegidos?",
    respuesta:
      "Sí. FinPal prioriza la privacidad absoluta: no vende ni comparte tus datos con terceros. Opera sobre Supabase con Row Level Security (RLS) estricto por usuario y cifrado criptográfico AES-256 en servidor para datos sensibles como teléfonos de contacto y notas personales.",
  },
  {
    pregunta: "¿Puedo separar mis finanzas en diferentes espacios de trabajo?",
    respuesta:
      "Sí. FinPal te permite crear múltiples espacios de trabajo independientes (por ejemplo: 'Préstamos Personales', 'Proyectos', 'Finanzas del Hogar'), cada uno con sus propias cuentas, saldos, movimientos y configuración de moneda.",
  },
  {
    pregunta: "¿Tiene algún costo o requiere tarjeta de crédito?",
    respuesta:
      "FinPal es de libre acceso y de código abierto en GitHub. Puedes registrarte de inmediato con tu correo electrónico y utilizar todas las funciones del sistema sin ingresar tarjetas de crédito ni suscripciones ocultas.",
  },
];

function handleLandingNavigation(event: MouseEvent<HTMLElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const anchor = event.target instanceof Element ? event.target.closest("a") : null;
  const href = anchor?.getAttribute("href");
  if (!href?.startsWith("#") || href.length < 2) return;
  const section = document.querySelector(href);
  if (!section) return;
  event.preventDefault();
  section.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.pushState({}, "", href);
}

export default function Home() {
  if (MODO_MANTENIMIENTO) {
    return <PantallaMantenimiento />;
  }

  const [copied, setCopied] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [legalModal, setLegalModal] = useState<"terminos" | "privacidad" | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mesActualLanding, setMesActualLanding] = useState("Mes Actual");

  useEffect(() => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    setMesActualLanding(meses[new Date().getMonth()]);
  }, []);

  useEffect(() => {
    clearSessionAccent();
    const onScroll = () => setShowBackToTop(window.scrollY > 350);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copyCommand = async () => {
    try {
      await navigator.clipboard?.writeText(cloneCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="bg-surface font-sans text-on-surface antialiased min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed relative overflow-x-hidden w-full max-w-full"
      onClick={handleLandingNavigation}
    >
      {/* Barra de navegación superior fija */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/85 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 text-on-surface hover:opacity-90 transition-opacity shrink-0">
            <FinPalLogo size={36} className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" priority />
            <div className="flex items-baseline tracking-tight font-heading text-xl sm:text-2xl">
              <span className="font-extrabold text-on-surface">Fin</span>
              <span className="font-extrabold text-primary">Pal</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a
              className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors"
              href="#vista-sistema"
            >
              Vista del sistema
            </a>
            <a
              className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors"
              href="#alcance"
            >
              Características
            </a>
            <a
              className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors"
              href="#faq"
            >
              Preguntas frecuentes
            </a>
            <a
              className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors"
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Botón de cambio de Modo Oscuro */}
            <ThemeToggle />

            {/* Botón de Iniciar Sesión adaptado a móvil */}
            <Link
              href="/iniciar-sesion"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-semibold hover:bg-primary-container transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Iniciar sesión</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 bg-surface overflow-x-hidden">
        {/* Hero Area */}
        <div className="relative w-full overflow-hidden border-b border-surface-container-high/40">
          {/* Subtle top accent glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[780px] max-w-[100vw] h-[380px] bg-gradient-to-b from-primary-fixed/35 via-secondary-container/20 to-transparent blur-3xl pointer-events-none rounded-full" />

          {/* Project context strip */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-6 pb-4 flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-emerald font-mono text-xs font-semibold shadow-2xs">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Proyecto personal en desarrollo</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low text-xs font-mono text-on-surface-variant border border-surface-container-high/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Disponible en la web
              </span>
              <a
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container border border-surface-container-high/60 transition-all text-xs font-semibold"
                href={githubUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Code2 className="w-4 h-4 text-primary" />
                <span>Ver en GitHub</span>
              </a>
            </div>
          </div>

          {/* Contenido principal del Hero */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-12 sm:pb-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Columna izquierda: Descripción y Acciones */}
              <motion.div
                className="lg:col-span-7 flex flex-col items-start space-y-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-teal text-xs font-semibold">
                  <Handshake className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Control de Préstamos Personales y Finanzas • FinPal</span>
                </div>

                {/* Título principal H1 */}
                <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-on-surface text-balance break-words">
                  Control inteligente de préstamos y cobro de intereses:{" "}
                  <motion.span
                    className="relative inline-block text-primary font-bold"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { delay: 0.35, duration: 0.3 } },
                    }}
                  >
                    todo en un solo lugar
                    <span className="absolute left-0 right-0 -bottom-1 h-1 overflow-hidden rounded-full bg-primary/15">
                      <motion.span
                        className="absolute inset-y-0 w-1/2 rounded-full bg-primary/60"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }}
                      />
                    </span>
                    <span className="absolute left-0 right-0 -bottom-1 h-1 rounded-full border-b-2 border-primary/25" />
                  </motion.span>
                </h1>

                {/* Párrafo descriptivo */}
                <p className="text-sm sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                  FinPal centraliza el registro de préstamos personales, cálculo de intereses mensuales, amortizaciones
                  a capital, cobros programados y cuentas de dinero. Olvídate de dispersar registros entre hojas de cálculo:
                  mantén tu balance claro, privado y accesible en tiempo real.
                </p>

                {/* Botones de acción principales (CTAs) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full sm:w-auto">
                  <a
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-[0.99] text-center"
                    href={githubUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Code2 className="w-5 h-5 shrink-0" />
                    <span>Ver en GitHub</span>
                  </a>
                  <a
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-surface-container-high/80 font-semibold text-sm sm:text-base shadow-xs transition-colors text-center"
                    href="#vista-sistema"
                  >
                    <span>Ver la vista del sistema</span>
                  </a>
                </div>

                {/* Quick Clone Box */}
                <div className="w-full max-w-lg mt-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-surface-container-low border border-surface-container-high/50 text-on-surface flex items-center justify-between gap-2 sm:gap-3 shadow-xs">
                  <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                    <Terminal className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-mono text-[11px] sm:text-xs text-on-surface-variant truncate">{cloneCommand}</span>
                  </div>
                  <button
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                    type="button"
                    onClick={copyCommand}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Micro specs badges */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 text-on-surface-variant text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary stroke-[3]" /> Next.js 16 App Router
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary stroke-[3]" /> Supabase (PostgreSQL + RLS)
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary stroke-[3]" /> Accesible desde tus dispositivos
                  </span>
                </div>
              </motion.div>

              {/* Columna derecha: Maqueta visual e interfaz destacada */}
              <motion.div
                className="lg:col-span-5 relative flex flex-col items-center lg:-translate-y-6 w-full overflow-hidden"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="relative w-full rounded-2xl bg-surface-container-lowest border border-surface-container-high/70 p-3 sm:p-4 shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between gap-2 pb-3 px-1 border-b border-surface-container-low mb-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 shrink-0" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 shrink-0" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shrink-0" />
                      <span className="ml-1 sm:ml-2 font-mono text-[10px] sm:text-xs text-outline truncate max-w-[110px] xs:max-w-[140px] sm:max-w-none">
                        finpal.local/prestamos
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold badge-emerald px-2 sm:px-2.5 py-0.5 rounded-full shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Espacio: Préstamos
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl bg-surface-container-low border border-surface-container-high/30 shadow-inner p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <FinPalLogo size={28} className="w-7 h-7" priority />
                      <div className="h-2.5 w-28 rounded-full bg-surface-container-high" />
                      <div className="ml-auto h-2.5 w-12 rounded-full bg-primary/25" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {["Saldo total", "Por cobrar", "Movimientos"].map((label, index) => (
                        <div key={label} className="rounded-lg bg-surface-container-lowest p-2">
                          <p className="text-[9px] text-on-surface-variant">{label}</p>
                          <div className={`mt-2 h-3 rounded-full ${index === 1 ? "w-3/4 bg-primary/45" : "w-1/2 bg-primary/25"}`} />
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-surface-container-lowest p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-2.5 w-24 rounded-full bg-surface-container-high" />
                        <div className="h-2.5 w-16 rounded-full bg-primary/30" />
                      </div>
                      <div className="space-y-2">
                        {[["Cuenta principal", "Saldo disponible"], ["Cobro pendiente", "Próxima fecha"], ["Movimiento reciente", "Registrado"]].map(([title, detail]) => (
                          <div key={title} className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-primary/15" />
                            <div className="flex-1">
                              <div className="h-2 w-2/3 rounded-full bg-surface-container-high" />
                              <div className="h-1.5 w-1/2 rounded-full bg-surface-container mt-1.5" />
                            </div>
                            <span className="text-[8px] text-on-surface-variant">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </div>

        {/* Product view */}
        <motion.section
          className="w-full py-16 scroll-mt-20"
          id="vista-sistema"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4 border-b border-surface-container-high/40 pb-6">
              <div>
                <span className="font-mono text-primary font-bold text-xs tracking-wider uppercase">
                  Tablero Simple y Práctico
                </span>
                {/* Normalized H2 */}
                <h2 className="font-heading text-2xl sm:text-4xl font-bold text-on-surface mt-1.5">
                  Tu balance centralizado en segundos
                </h2>
                <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-xl">
                  Registra préstamos, abonos parciales y visualiza el saldo de tus cuentas sin curvas de aprendizaje.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 text-xs sm:text-sm font-semibold text-on-surface shadow-xs hover:bg-surface-container transition-colors"
                  href={githubUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Repositorio GitHub
                </a>
                <Link
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 hover:bg-primary-container transition-colors"
                  href="/registrarse"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Préstamo</span>
                </Link>
              </div>
            </div>

            {/* Cuadrícula Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Tabla interactiva de préstamos y movimientos (Ocupa 8 columnas) */}
              <div className="lg:col-span-8 bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-surface-container-low mb-4">
                    <div className="flex items-center gap-2.5">
                      <WalletCards className="w-5 h-5 text-primary shrink-0" />
                      <h3 className="font-heading text-base sm:text-lg font-bold text-on-surface">
                        Deudores y Préstamos Recientes
                      </h3>
                    </div>
                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-mono text-[11px] sm:text-xs font-semibold border border-surface-container-high/40 shrink-0">
                      Espacio: Préstamos
                    </span>
                  </div>

                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <table className="w-full text-left text-sm min-w-[500px]">
                      <thead>
                        <tr className="bg-surface-container-low/70 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                          <th className="py-3 px-3.5 rounded-l-lg">Contacto</th>
                          <th className="py-3 px-3.5">Capital</th>
                          <th className="py-3 px-3.5">Interés</th>
                          <th className="py-3 px-3.5">Próximo Pago</th>
                          <th className="py-3 px-3.5 rounded-r-lg text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="text-on-surface divide-y divide-surface-container-low">
                        {borrowers.map((borrower) => (
                          <tr
                            key={borrower.name}
                            className="hover:bg-surface-container-low/40 transition-colors"
                          >
                            <td className="py-3.5 px-3.5 flex items-center gap-3">
                              <ContactAvatar
                                name={borrower.name}
                                size={36}
                                className="rounded-full shadow-2xs shrink-0"
                              />
                              <div>
                                <p className="font-semibold text-sm leading-snug">{borrower.name}</p>
                                <p className="text-xs text-on-surface-variant">{borrower.detail}</p>
                              </div>
                            </td>
                            <td className="py-3.5 px-3.5 font-mono font-semibold text-sm">{borrower.capital}</td>
                            <td className="py-3.5 px-3.5 font-mono text-xs text-primary font-medium">
                              {borrower.interest}
                            </td>
                            <td
                              className={`py-3.5 px-3.5 text-xs ${
                                borrower.late ? "text-error font-semibold" : "text-on-surface-variant"
                              }`}
                            >
                              {borrower.date}
                            </td>
                            <td className="py-3.5 px-3.5 text-right">
                              {borrower.late ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold badge-atrasado">
                                  {borrower.status}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold badge-al-dia">
                                  {borrower.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Lado derecho: Mini gráfico y resumen de flujo de fondos (Ocupa 4 columnas) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-xs">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-mono">
                    Flujo Neto Esperado ({mesActualLanding})
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">$2,154.50</span>
                    <span className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
                      ↑ Cobros programados
                    </span>
                  </div>

                  {/* Inline SVG Sparkline */}
                  <div className="mt-4 h-16 w-full">
                    <svg className="w-full h-full text-primary" preserveAspectRatio="none" viewBox="0 0 300 70">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,55 Q 30,50 60,35 T 120,40 T 180,25 T 240,15 T 300,5 L 300,70 L 0,70 Z"
                        fill="url(#chartGrad)"
                      />
                      <path
                        d="M 0,55 Q 30,50 60,35 T 120,40 T 180,25 T 240,15 T 300,5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>

                  <div className="mt-3 pt-3 border-t border-surface-container-low flex items-center justify-between text-xs text-on-surface-variant">
                    <span>
                      Capital Recuperado: <b className="text-on-surface font-semibold">$1,850</b>
                    </span>
                    <span>
                      Intereses: <b className="text-primary font-bold">$304.50</b>
                    </span>
                  </div>
                </div>

                {/* Cuentas de dinero simples */}
                <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading text-base font-bold text-on-surface">Cuentas Disponibles</h3>
                      <span className="text-xs font-mono text-primary font-medium">Impacto automático</span>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low/70">
                        <span className="flex items-center gap-2 text-on-surface font-medium">
                          <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Efectivo en mano
                        </span>
                        <span className="font-mono font-bold text-sm">$380.00</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low/70">
                        <span className="flex items-center gap-2 text-on-surface font-medium">
                          <Landmark className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Banco Principal
                        </span>
                        <span className="font-mono font-bold text-sm">$2,840.00</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low/70">
                        <span className="flex items-center gap-2 text-on-surface font-medium">
                          <WalletCards className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Billetera Móvil
                        </span>
                        <span className="font-mono font-bold text-sm">$125.00</span>
                      </div>
                    </div>
                  </div>
                  <a
                    className="mt-4 inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors border border-surface-container-high/40"
                    href={githubUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>Ver en GitHub</span>
                    <ExternalLink className="w-4 h-4 text-on-surface-variant" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* SECCIÓN: Alcance del MVP (Hecho para lo que realmente necesitas) */}
        <section className="w-full py-16 bg-surface-container-low/40 border-y border-surface-container-high/40 scroll-mt-20" id="alcance">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="font-mono text-primary font-bold text-xs tracking-wider uppercase">
                  Esencial &amp; Sin Complejidad
                </span>
                {/* Normalized H2 */}
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-on-surface mt-1.5">
                  Todo lo que hoy puedes centralizar
                </h2>
              </div>
              <p className="text-base text-on-surface-variant max-w-md">
                Una base sencilla para consultar tu información financiera desde un mismo sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <div>
                      <div className={`w-10 h-10 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      {/* Normalized H3 */}
                      <h3 className="font-heading text-lg font-bold text-on-surface mb-2">{feature.title}</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECCIÓN: Preguntas Frecuentes (FAQ) optimizada para SEO y Schema.org */}
        <section
          className="w-full py-16 sm:py-20 bg-surface-container-low/60 border-t border-surface-container-high/40 scroll-mt-20"
          id="faq"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-emerald text-xs font-semibold mb-3">
                <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Respuestas y Guía de Uso</span>
              </span>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                Preguntas Frecuentes sobre FinPal
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant mt-3 max-w-xl mx-auto leading-relaxed">
                Todo lo que necesitas saber sobre el control de préstamos personales, cálculo de intereses mensuales y seguridad de tus datos.
              </p>
            </div>

            <div className="space-y-3.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={faq.pregunta}
                    className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-hidden transition-all duration-200 shadow-2xs hover:border-primary/40"
                  >
                    <button
                      type="button"
                      className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span className="font-heading text-sm sm:text-base font-bold text-on-surface pr-2">
                        {faq.pregunta}
                      </span>
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isOpen
                            ? "bg-primary text-on-primary rotate-180"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-on-surface-variant leading-relaxed border-t border-surface-container-low">
                        {faq.respuesta}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Marcado Schema.org FAQPage para Rich Snippets en Google */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faqs.map((faq) => ({
                    "@type": "Question",
                    name: faq.pregunta,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: faq.respuesta,
                    },
                  })),
                }),
              }}
            />
          </div>
        </section>

        {/* Banner de llamada a la acción del proyecto */}
        <section className="w-full py-20 bg-surface-container relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center relative z-10">
            <div className="max-w-2xl mx-auto flex flex-col items-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-emerald text-xs font-semibold mb-4">
                <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Proyecto personal en desarrollo
              </span>
              {/* Normalized H2 */}
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                Un solo lugar para consultar tu información
              </h2>
              <p className="text-base sm:text-lg text-on-surface-variant mt-4 leading-relaxed">
                FinPal seguirá creciendo a partir de una necesidad concreta: tener cuentas, movimientos y cobros
                accesibles desde cualquier dispositivo con internet.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                <a
                  className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-base transition-all shadow-md hover:shadow-lg flex items-center gap-2.5 active:scale-[0.99]"
                  href={githubUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>Conocer el proyecto</span>
                </a>
                <a
                  className="px-6 py-3.5 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container-high font-semibold text-base transition-colors shadow-xs flex items-center gap-2.5 border border-surface-container-high/70"
                  href={githubUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>Ver en GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Cuadrícula de enlaces del pie de página */}
        <section className="w-full py-14 bg-surface-container-lowest border-t border-surface-container-high/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 lg:gap-16">
              <div>
                <h4 className="font-heading text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
                  Proyecto
                </h4>
                <ul className="space-y-2.5 text-sm text-on-surface-variant">
                  <li>
                    <a className="hover:text-primary transition-colors" href="#vista-sistema">
                      Vista del sistema
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-primary transition-colors" href="#alcance">
                      Características
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-primary transition-colors" href="#faq">
                      Preguntas frecuentes
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Repositorio GitHub
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-heading text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
                  Recursos
                </h4>
                <ul className="space-y-2.5 text-sm text-on-surface-variant">
                  <li>
                    <a
                      className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Código Fuente en GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant" />
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                      href={`${githubWebUrl}/issues`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Reportar un problema (Issues)</span>
                      <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant" />
                    </a>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setLegalModal("privacidad")}
                      className="hover:text-primary transition-colors text-left cursor-pointer"
                    >
                      Privacidad y Soberanía de Datos
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-heading text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
                  Sobre el proyecto
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Proyecto personal en desarrollo, creado para centralizar información financiera cotidiana y compartir
                  una posible solución con personas que tengan una situación parecida.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container font-mono text-xs text-on-surface border border-surface-container-high/50">
                    <span className="w-2 h-2 rounded-full bg-primary" /> FinPal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Barra de pie de página inferior */}
      <footer className="w-full bg-surface-container-lowest border-t border-surface-container-high/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-on-surface-variant text-xs font-medium">
            <span className="font-bold text-on-surface">FinPal</span>
            <span>© 2026 FinPal. Josué Chacae.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-on-surface-variant font-medium">
            <button
              type="button"
              onClick={() => setLegalModal("terminos")}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Términos de servicio
            </button>
            <button
              type="button"
              onClick={() => setLegalModal("privacidad")}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Privacidad y datos
            </button>
            <a
              className="hover:text-on-surface transition-colors"
              href={githubUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* Botón flotante animado para volver arriba */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            aria-label="Volver al inicio"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-7 right-7 z-50 p-3.5 rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary-container transition-colors focus:outline-none focus:ring-4 focus:ring-primary/20 flex items-center justify-center group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal Funcional de Términos y Privacidad */}
      <AnimatePresence>
        {legalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative text-on-surface max-h-[85vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-surface-container-low">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h3 className="font-heading text-lg font-bold">
                  {legalModal === "terminos" ? "Términos de Servicio" : "Política de Privacidad y Seguridad"}
                </h3>
              </div>

              {legalModal === "terminos" ? (
                <div className="space-y-3.5 text-xs text-on-surface-variant leading-relaxed">
                  <p>
                    <strong className="text-on-surface">1. Propósito de la Plataforma:</strong> FinPal es un sistema diseñado para el registro, cálculo de intereses y control administrativo de préstamos y finanzas personales o familiares.
                  </p>
                  <p>
                    <strong className="text-on-surface">2. Sin Custodia de Fondos:</strong> FinPal no es un banco ni custodio monetario. No capta dinero ni custodia fondos reales; actúa exclusivamente como libro contable digital y calculadora de amortizaciones.
                  </p>
                  <p>
                    <strong className="text-on-surface">3. Responsabilidad del Usuario:</strong> La veracidad de los datos, acuerdos pactados con deudores y registros contables introducidos en la plataforma son responsabilidad exclusiva de cada usuario.
                  </p>
                  <p>
                    <strong className="text-on-surface">4. Licencia Abierta:</strong> El código fuente está disponible públicamente con fines de transparencia, auditabilidad y soberanía sobre los datos propios.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs text-on-surface-variant leading-relaxed">
                  <p>
                    <strong className="text-on-surface">1. Cero Venta de Información:</strong> FinPal no vende, no comercializa ni comparte tu información financiera, deudores ni saldos con anunciantes ni terceros.
                  </p>
                  <p>
                    <strong className="text-on-surface">2. Seguridad y Aislamiento por RLS:</strong> Tu información está aislada mediante políticas de seguridad a nivel de fila (Row Level Security - RLS) en la base de datos; únicamente tu usuario autenticado puede leer y modificar tus espacios de trabajo.
                  </p>
                  <p>
                    <strong className="text-on-surface">3. Sesiones y Control:</strong> Puedes cerrar sesión en cualquier momento y decidir si recordar tu sesión en tu navegador o requerir autenticación cada vez que abras una nueva pestaña.
                  </p>
                  <p>
                    <strong className="text-on-surface">4. Exportación y Respaldo:</strong> Tienes derecho a descargar copias de tus datos en formatos abiertos (CSV, reporte ejecutivo en PDF) cuando lo consideres oportuno.
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-surface-container-low flex justify-end">
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

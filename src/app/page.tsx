"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useMemo, type MouseEvent } from "react";
import { FinPalLogo } from "@/components/finpal-logo";
import { ContactAvatar } from "@/components/contact-avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { MODO_MANTENIMIENTO } from "@/config/mantenimiento";
import { PantallaMantenimiento } from "@/components/pantalla-mantenimiento";
import { clearSessionAccent } from "@/lib/theme-utils";
import {
  TERMINOS_DE_SERVICIO,
  POLITICA_DE_PRIVACIDAD,
  LEGAL_VERSION,
} from "@/config/legal-content";
import {
  ArrowRight,
  ArrowUp,
  Banknote,
  Check,
  ChevronDown,
  Code2,
  ExternalLink,
  Handshake,
  HelpCircle,
  Landmark,
  LogIn,
  Percent,
  Plus,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
  Calculator,
  FileSpreadsheet,
  ArrowLeftRight,
  ReceiptText,
  Clock,
  TrendingUp,
  CheckCircle2,
  Wallet,
  BadgePercent,
  UserCheck,
  Scale,
  AlertTriangle,
} from "lucide-react";

const githubUrl = "https://github.com/chacaejosue/finpal.git";
const githubWebUrl = "https://github.com/chacaejosue/finpal";

const borrowers = [
  {
    initials: "CR",
    name: "Carlos Ramírez",
    detail: "Préstamo personal",
    capital: "$1,200.00",
    interest: "+2.5% mes ($30.00)",
    date: "15 Oct 2024",
    status: "Al día",
    late: false,
  },
  {
    initials: "MV",
    name: "Mariana Vega",
    detail: "Cuota de taller",
    capital: "$450.00",
    interest: "+2% mes ($9.00)",
    date: "Ayer (10 Oct)",
    status: "Con atraso (1 d)",
    late: true,
  },
  {
    initials: "JP",
    name: "Jorge Peña",
    detail: "Equipos de oficina",
    capital: "$1,800.00",
    interest: "+3% mes ($54.00)",
    date: "28 Oct 2024",
    status: "Al día",
    late: false,
  },
];

const features = [
  {
    title: "Cuentas y Billeteras",
    description: "Controla saldos de efectivo, bancos y billeteras con transferencias inmediatas y trazabilidad.",
    tag: "Billeteras",
    icon: Wallet,
    accentColor: "text-cyan-600 dark:text-cyan-400",
    bgGradient: "from-cyan-500/15 via-blue-500/10 to-indigo-500/5",
    borderColor: "border-cyan-500/20",
    glowColor: "bg-cyan-500/20",
    badgeBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    title: "Intereses y Cuotas",
    description: "Calcula cobros de interés mensual fijo o cuotas con amortización a capital (Sistema Francés).",
    tag: "Francés & Fijo",
    icon: BadgePercent,
    accentColor: "text-teal-600 dark:text-teal-400",
    bgGradient: "from-teal-500/15 via-emerald-500/10 to-teal-500/5",
    borderColor: "border-teal-500/20",
    glowColor: "bg-teal-500/20",
    badgeBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    title: "Recibos Digitales",
    description: "Emite comprobantes con folio y desglose claro, listos para compartir o imprimir en PDF.",
    tag: "PDF & Folio",
    icon: ReceiptText,
    accentColor: "text-amber-600 dark:text-amber-400",
    bgGradient: "from-amber-500/15 via-orange-500/10 to-amber-500/5",
    borderColor: "border-amber-500/20",
    glowColor: "bg-amber-500/20",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Kardex de Deudores",
    description: "Monitorea el historial de cobros, saldos pendientes y el semáforo de puntualidad de cada cliente.",
    tag: "Semáforo 360°",
    icon: UserCheck,
    accentColor: "text-violet-600 dark:text-violet-400",
    bgGradient: "from-violet-500/15 via-purple-500/10 to-violet-500/5",
    borderColor: "border-violet-500/20",
    glowColor: "bg-violet-500/20",
    badgeBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

const faqs = [
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
    pregunta: "¿Puedo separar finanzas personales de préstamos?",
    respuesta:
      "Sí. Puedes crear múltiples espacios de trabajo independientes para separar negocios, préstamos a familiares o cuentas personales.",
  },
  {
    pregunta: "¿Tiene algún costo o suscripción?",
    respuesta:
      "No. FinPal es un proyecto independiente de código abierto, libre de suscripciones y sin publicidad invasiva.",
  },
];

const metrics = [
  { value: "100%", label: "Libre de suscripciones", highlight: false },
  { value: "AES-256", label: "Cifrado en servidor", highlight: true },
  { value: "En la nube", label: "PC, tablet y móvil", highlight: false },
  { value: "Multi-espacio", label: "Carteras separadas", highlight: false },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [legalModal, setLegalModal] = useState<"terminos" | "privacidad" | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [mockTab, setMockTab] = useState<"resumen" | "prestamos" | "recibo">("resumen");

  // Estado del Mini-Simulador Interactivo
  const [simMonto, setSimMonto] = useState<number>(1000);
  const [simTasa, setSimTasa] = useState<number>(3);
  const [simPlazo, setSimPlazo] = useState<number>(6);
  const [simModalidad, setSimModalidad] = useState<"solo_interes" | "frances">("solo_interes");

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setShowScrollTop(window.scrollY > 350);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mesActualLanding = useMemo(() => {
    try {
      const hoy = new Date();
      const txt = hoy.toLocaleDateString("es-ES", { month: "long" });
      return txt.charAt(0).toUpperCase() + txt.slice(1);
    } catch {
      return "Octubre";
    }
  }, []);

  // Cálculos matemáticos en vivo del simulador
  const simResultado = useMemo(() => {
    const P = Math.max(1, simMonto);
    const r = Math.max(0.1, simTasa) / 100;
    const n = Math.max(1, simPlazo);

    if (simModalidad === "solo_interes") {
      const interesMensual = P * r;
      const interesTotal = interesMensual * n;
      const totalRecuperar = P + interesTotal;
      return {
        cuota: interesMensual,
        cuotaLabel: "Interés mensual a cobrar",
        interesTotal,
        totalRecuperar,
        abonoCapital: 0,
      };
    } else {
      // Sistema Francés: Cuota = P * [r * (1 + r)^n] / [(1 + r)^n - 1]
      const factor = Math.pow(1 + r, n);
      const cuotaFrancesa = (P * (r * factor)) / (factor - 1);
      const totalRecuperar = cuotaFrancesa * n;
      const interesTotal = totalRecuperar - P;
      return {
        cuota: cuotaFrancesa,
        cuotaLabel: "Cuota fija mensual (Capital + Interés)",
        interesTotal,
        totalRecuperar,
        abonoCapital: P / n,
      };
    }
  }, [simMonto, simTasa, simPlazo, simModalidad]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (MODO_MANTENIMIENTO) {
    return <PantallaMantenimiento />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* ─── NAVEGACIÓN SUPERIOR CONCISA ─── */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-surface-container-high/60 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-full flex items-center justify-between">
          <Link
            href="/"
            onClick={(e) => {
              clearSessionAccent();
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            aria-label="FinPal Inicio"
          >
            <FinPalLogo size={32} className="w-8 h-8 transition-transform group-hover:scale-105" />
            <span className="font-heading text-xl font-bold tracking-tight text-on-surface">
              Fin<span className="text-primary font-black">Pal</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <a className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors" href="#simulador">
              Simulador
            </a>
            <a className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors" href="#vista-sistema">
              Sistema
            </a>
            <a className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors" href="#centralizar">
              Por qué FinPal
            </a>
            <a className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors" href="#alcance">
              Funciones
            </a>
            <a className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors" href="#faq">
              Preguntas
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            <Link
              href="/iniciar-sesion"
              className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-on-surface hover:bg-surface-container text-xs sm:text-sm font-semibold transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Iniciar sesión</span>
            </Link>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/registrarse"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-semibold hover:bg-primary-container transition-all cursor-pointer shadow-xs shrink-0"
              >
                <span>Empezar gratis</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 bg-surface overflow-x-hidden">
        {/* ─── HERO AREA DINÁMICA & EQUILIBRADA ─── */}
        <div className="relative w-full overflow-hidden border-b border-surface-container-high/40 bg-surface">
          {/* Luces ambientales sutiles */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] max-w-[100vw] h-[420px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-3xl pointer-events-none rounded-full" />
          <div className="absolute top-1/4 right-0 w-[400px] h-[300px] bg-teal-500/10 blur-[100px] pointer-events-none rounded-full" />

          {/* Patrón de matriz sutil con máscara radial */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_25%,#000_60%,transparent_100%)] pointer-events-none" />

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-14 pb-14 sm:pb-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-14 items-center">
              {/* Columna izquierda: 6 columnas */}
              <motion.div
                className="lg:col-span-6 flex flex-col items-start space-y-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-emerald text-xs font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Control de préstamos simple · Cifrado AES-256</span>
                </div>

                {/* H1 con línea animada de vida */}
                <h1 className="font-heading text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.12] text-on-surface text-balance">
                  Préstamos personales y cobro de intereses,{" "}
                  <span className="relative inline-block text-primary font-bold">
                    simplificados.
                    <span className="absolute left-0 right-0 -bottom-1.5 h-1 overflow-hidden rounded-full bg-primary/20">
                      <motion.span
                        className="absolute inset-y-0 w-1/2 rounded-full bg-primary"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }}
                      />
                    </span>
                    <span className="absolute left-0 right-0 -bottom-1.5 h-1 rounded-full border-b-2 border-primary/30" />
                  </span>
                </h1>

                <p className="text-sm sm:text-base lg:text-lg text-on-surface-variant max-w-xl leading-relaxed">
                  Registra préstamos, calcula intereses al instante y cobra a tiempo con recibos digitales. Sin hojas de cálculo ni desorden.
                </p>

                {/* Botones de acción principales */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 w-full sm:w-auto">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all text-center w-full"
                      href="/registrarse"
                    >
                      <span>Empezar gratis</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <a
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-surface-container-high/80 font-semibold text-sm sm:text-base shadow-xs transition-colors text-center w-full"
                      href="#simulador"
                    >
                      <Calculator className="w-4 h-4 text-primary" />
                      <span>Simular préstamo</span>
                    </a>
                  </motion.div>
                </div>

                {/* Beneficios directos */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-on-surface-variant text-xs pt-1">
                  <span className="flex items-center gap-1.5 font-medium text-on-surface">
                    <Check className="w-3.5 h-3.5 text-primary stroke-[3]" /> Gratis sin tarjeta
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1.5 font-medium text-on-surface">
                    <Check className="w-3.5 h-3.5 text-primary stroke-[3]" /> Celular y PC
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1.5 font-medium text-on-surface">
                    <Check className="w-3.5 h-3.5 text-primary stroke-[3]" /> Cifrado en servidor
                  </span>
                </div>
              </motion.div>

              {/* Columna derecha: 6 columnas, espaciosa, centrada y con Pestañas Interactivas */}
              <motion.div
                className="lg:col-span-6 relative flex flex-col items-center justify-center w-full"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              >
                {/* Floating Chip 1: Notificación de cobro con flotación continua */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: [0, -6, 0] }}
                  transition={{
                    opacity: { delay: 0.4, duration: 0.4 },
                    y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.4 },
                  }}
                  className="hidden sm:flex absolute -top-3.5 -right-2 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-highest/95 backdrop-blur-md border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-lg pointer-events-none"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cobro registrado +$200.00</span>
                </motion.div>

                {/* Floating Chip 2: Privacidad y Cifrado con flotación continua */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: [0, 6, 0] }}
                  transition={{
                    opacity: { delay: 0.5, duration: 0.4 },
                    y: { repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.8 },
                  }}
                  className="hidden sm:flex absolute -bottom-3 -left-3 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-highest/95 backdrop-blur-md border border-surface-container-high/80 text-on-surface text-xs font-semibold shadow-lg pointer-events-none"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Cifrado AES-256 en servidor</span>
                </motion.div>

                {/* Contenedor Mockup Ventana */}
                <div className="relative w-full rounded-2xl bg-surface-container-lowest border border-surface-container-high/80 p-4 sm:p-5 shadow-2xl">
                  {/* Barra de cabecera con pestañas */}
                  <div className="flex items-center justify-between gap-2 pb-3 px-1 border-b border-surface-container-low mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="ml-1 font-mono text-[11px] text-outline hidden xs:inline">
                        finpal.app/panel
                      </span>
                    </div>

                    {/* Selector de pestañas dinámico con indicador animado */}
                    <div className="relative inline-flex rounded-lg bg-surface-container-low p-0.5 border border-surface-container-high/40 text-[11px] font-semibold">
                      {(["resumen", "prestamos", "recibo"] as const).map((tabKey) => {
                        const labels = { resumen: "Resumen", prestamos: "Préstamos", recibo: "Recibo" };
                        const isActive = mockTab === tabKey;
                        return (
                          <button
                            key={tabKey}
                            type="button"
                            onClick={() => setMockTab(tabKey)}
                            className={`relative px-2.5 py-1 rounded-md transition-colors cursor-pointer z-10 ${
                              isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            {isActive && (
                              <motion.span
                                layoutId="mockTabPill"
                                className="absolute inset-0 rounded-md bg-surface-container-lowest shadow-xs -z-10"
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                              />
                            )}
                            {labels[tabKey]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cuerpo de la Maqueta con transición animada suave */}
                  <div className="rounded-xl bg-surface-container-low border border-surface-container-high/30 p-3.5 min-h-[260px] flex flex-col justify-between overflow-hidden">
                    <AnimatePresence mode="wait">
                      {/* TAB 1: RESUMEN */}
                      {mockTab === "resumen" && (
                        <motion.div
                          key="resumen"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="space-y-3"
                        >
                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/40 p-2.5">
                              <p className="text-[10px] font-semibold uppercase text-on-surface-variant">Saldo total</p>
                              <p className="mt-1 font-heading text-sm sm:text-base font-extrabold text-on-surface">$4,825.00</p>
                              <span className="text-[9px] font-mono text-primary font-semibold">+12.4% mes</span>
                            </div>
                            <div className="rounded-xl bg-surface-container-lowest border border-primary/25 p-2.5">
                              <p className="text-[10px] font-semibold uppercase text-on-surface-variant">Por cobrar</p>
                              <p className="mt-1 font-heading text-sm sm:text-base font-extrabold text-primary">$1,950.00</p>
                              <span className="text-[9px] text-on-surface-variant">3 préstamos</span>
                            </div>
                            <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/40 p-2.5">
                              <p className="text-[10px] font-semibold uppercase text-on-surface-variant">Interés mes</p>
                              <p className="mt-1 font-heading text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">+$93.00</p>
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">94% puntual</span>
                            </div>
                          </div>

                          <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/40 p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-on-surface">Carlos Ramírez • Mensual</span>
                              <span className="font-mono text-[11px] font-bold text-primary">75% al día</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                            <div className="flex items-center justify-between pt-1 text-xs">
                              <span className="text-on-surface-variant flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                Abono reciente #FP-842
                              </span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+$200.00</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* TAB 2: PRÉSTAMOS */}
                      {mockTab === "prestamos" && (
                        <motion.div
                          key="prestamos"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="space-y-2"
                        >
                          {borrowers.map((b) => (
                            <div
                              key={b.name}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/40 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <ContactAvatar name={b.name} size={30} className="rounded-full shrink-0" />
                                <div>
                                  <p className="font-semibold text-on-surface">{b.name}</p>
                                  <p className="text-[10px] text-on-surface-variant">{b.detail}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-on-surface">{b.capital}</p>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${b.late ? "badge-atrasado" : "badge-al-dia"}`}>
                                  {b.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {/* TAB 3: RECIBO DIGITAL */}
                      {mockTab === "recibo" && (
                        <motion.div
                          key="recibo"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="p-3.5 rounded-xl bg-surface-container-lowest border border-dashed border-surface-container-high text-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between border-b border-surface-container-low pb-2">
                            <div className="flex items-center gap-2">
                              <FinPalLogo size={22} className="w-5 h-5 shrink-0" />
                              <span className="font-bold text-on-surface">Recibo Digital #FP-842</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                              Cobrado
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-on-surface-variant">Deudor:</span>
                              <span className="font-semibold text-on-surface">Carlos Ramírez</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-on-surface-variant">Concepto:</span>
                              <span className="font-semibold text-on-surface">Préstamo personal (Abono mensual)</span>
                            </div>
                            <div className="flex justify-between font-bold text-xs pt-1 border-t border-surface-container-low">
                              <span className="text-on-surface">Total cobrado:</span>
                              <span className="text-primary font-extrabold">$200.00</span>
                            </div>
                          </div>
                          <div className="pt-2 flex items-center justify-between text-[10px] text-on-surface-variant border-t border-surface-container-low">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <Check className="w-3 h-3" /> Formato digital listo para compartir o imprimir
                            </span>
                            <span className="font-mono">Folio verificado</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Mini pie de maqueta */}
                    <div className="pt-2 flex items-center justify-between text-[11px] text-on-surface-variant border-t border-surface-container-high/40">
                      <span>Espacio de trabajo: <b>Principal</b></span>
                      <span className="font-semibold text-primary">Sincronizado</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </div>

        {/* ─── CINTILLO DINÁMICO DE MÉTRICAS RÁPIDAS ─── */}
        <section className="w-full py-6 bg-surface-container-lowest border-b border-surface-container-high/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {metrics.map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="p-2 rounded-xl transition-colors hover:bg-surface-container-low/40"
                >
                  <p className={`font-heading text-xl sm:text-2xl font-extrabold ${metric.highlight ? "text-primary" : "text-on-surface"}`}>
                    {metric.value}
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECCIÓN: MINI-SIMULADOR EN VIVO (CON BARRA VISUAL DINÁMICA) ─── */}
        <motion.section
          className="w-full py-14 sm:py-16 bg-surface-container-low/40 border-b border-surface-container-high/40 scroll-mt-20"
          id="simulador"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-emerald text-xs font-semibold mb-2">
                <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Simulador en vivo</span>
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                Proyecta tu cobro en segundos
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5">
                Ajusta monto, tasa y plazo para ver tu ganancia al instante.
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-surface-container-high/80 rounded-3xl p-5 sm:p-7 shadow-lg grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Controles de Simulación */}
              <div className="md:col-span-7 space-y-4 sm:space-y-5">
                <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-low rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSimModalidad("solo_interes")}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                      simModalidad === "solo_interes"
                        ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Solo Interés Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimModalidad("frances")}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                      simModalidad === "frances"
                        ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Cuota Fija (Francés)
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-on-surface">Capital prestado:</span>
                    <span className="font-heading text-primary font-bold">${simMonto.toLocaleString("en-US")}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="50"
                    value={simMonto}
                    onChange={(e) => setSimMonto(Number(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg cursor-pointer"
                  />
                  {/* Presets rápidos de monto */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[500, 1000, 2500, 5000].map((preset) => (
                      <motion.button
                        key={preset}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSimMonto(preset)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                          simMonto === preset
                            ? "bg-primary text-on-primary font-bold"
                            : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        ${preset}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold mb-1.5">
                    <span className="text-on-surface">Tasa de interés mensual:</span>
                    <div className="flex items-center gap-2">
                      {simTasa <= 3 ? (
                        <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Tope legal Bolivia (≤ 3% mes)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3" />
                          &gt; 3% mes (Excede límite legal)
                        </span>
                      )}
                      <span className="font-heading text-primary font-extrabold text-sm">{simTasa}% mes</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={simTasa}
                    onChange={(e) => setSimTasa(Number(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg cursor-pointer"
                  />

                  {/* Aviso legal sintético y conciso (Bolivia Art. 409) */}
                  <AnimatePresence>
                    {simTasa > 3 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -4 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -4 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden mt-2.5"
                      >
                        <div className="rounded-xl p-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <p className="text-[11px] leading-snug">
                              <span className="font-bold">Límite legal en Bolivia:</span> El Art. 409 del Código Civil fija como tope máx. el <b>3% mensual</b>. FinPal solo calcula; tasas mayores son responsabilidad del usuario (
                              <button
                                type="button"
                                onClick={() => setLegalModal("terminos")}
                                className="underline font-bold hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                              >
                                Términos §2
                              </button>
                              ).
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSimTasa(3)}
                            className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 transition-colors cursor-pointer"
                          >
                            Fijar al 3%
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-on-surface mb-1.5">Plazo:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 6, 12, 24].map((meses) => (
                      <motion.button
                        key={meses}
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSimPlazo(meses)}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          simPlazo === meses
                            ? "bg-primary text-on-primary font-bold"
                            : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {meses} m
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resultados con barra dinámica de proporciones */}
              <div className="md:col-span-5 bg-surface-container-low p-4 sm:p-5 rounded-2xl border border-surface-container-high/60 space-y-3">
                <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/40">
                  <p className="text-[11px] text-on-surface-variant font-medium">{simResultado.cuotaLabel}</p>
                  <p className="font-heading text-2xl font-extrabold text-on-surface mt-0.5">
                    ${simResultado.cuota.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Interés total a ganar:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +${simResultado.interesTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-surface-container-high/40">
                    <span className="text-on-surface">Total a recuperar:</span>
                    <span className="text-primary">${simResultado.totalRecuperar.toFixed(2)}</span>
                  </div>
                </div>

                {/* Barra visual dinámica de proporción capital vs interés */}
                <div className="pt-1 space-y-1">
                  <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden flex">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(simMonto / simResultado.totalRecuperar) * 100}%` }}
                    />
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(simResultado.interesTotal / simResultado.totalRecuperar) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Cap: ${simMonto}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Int: +${simResultado.interesTotal.toFixed(0)}
                    </span>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/registrarse"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all cursor-pointer text-center mt-1"
                  >
                    <span>Registrar este préstamo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ─── SECCIÓN: VISTA DEL SISTEMA (CONCISA) ─── */}
        <motion.section
          className="w-full py-14 sm:py-16 scroll-mt-20"
          id="vista-sistema"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-surface-container-high/40 pb-5">
              <div>
                <span className="font-mono text-primary font-bold text-xs uppercase tracking-wider">
                  Tablero en vivo
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-on-surface mt-1">
                  Tu balance en un vistazo
                </h2>
              </div>
              <Link
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                href="/registrarse"
              >
                <span>Probar con tus datos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Tabla interactiva */}
              <div className="lg:col-span-8 bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-5 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-surface-container-low mb-3">
                  <div className="flex items-center gap-2">
                    <WalletCards className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="font-heading text-sm sm:text-base font-bold text-on-surface">
                      Préstamos y Cobros Recientes
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-on-surface-variant">
                    3 activos
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm min-w-[460px]">
                    <thead>
                      <tr className="bg-surface-container-low/60 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3 rounded-l-lg">Contacto</th>
                        <th className="py-2.5 px-3">Capital</th>
                        <th className="py-2.5 px-3">Interés</th>
                        <th className="py-2.5 px-3">Cobro</th>
                        <th className="py-2.5 px-3 rounded-r-lg text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                      {borrowers.map((borrower) => (
                        <tr key={borrower.name} className="hover:bg-surface-container-low/30 transition-colors">
                          <td className="py-3 px-3 flex items-center gap-2.5">
                            <ContactAvatar name={borrower.name} size={32} className="rounded-full shrink-0" />
                            <div>
                              <p className="font-semibold text-xs leading-tight">{borrower.name}</p>
                              <p className="text-[11px] text-on-surface-variant">{borrower.detail}</p>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-xs">{borrower.capital}</td>
                          <td className="py-3 px-3 font-mono text-xs text-primary">{borrower.interest}</td>
                          <td className={`py-3 px-3 text-xs ${borrower.late ? "text-error font-semibold" : "text-on-surface-variant"}`}>
                            {borrower.date}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${borrower.late ? "badge-atrasado" : "badge-al-dia"}`}>
                              {borrower.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lado derecho: Flujo y Cuentas */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase font-mono">
                    Cobros de {mesActualLanding}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading text-2xl font-extrabold text-on-surface">$2,154.50</span>
                    <span className="text-xs font-semibold text-primary">↑ Programado</span>
                  </div>

                  <div className="mt-3 h-12 w-full">
                    <svg className="w-full h-full text-primary" preserveAspectRatio="none" viewBox="0 0 300 70">
                      <path
                        d="M 0,55 Q 30,50 60,35 T 120,40 T 180,25 T 240,15 T 300,5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-on-surface pb-1 border-b border-surface-container-low">
                    <span>Cuentas de dinero</span>
                    <span className="text-[11px] font-mono text-primary font-normal">Impacto directo</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low/60">
                      <span className="flex items-center gap-2 text-on-surface font-medium">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Efectivo
                      </span>
                      <span className="font-mono font-bold">$380.00</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low/60">
                      <span className="flex items-center gap-2 text-on-surface font-medium">
                        <Landmark className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Banco Principal
                      </span>
                      <span className="font-mono font-bold">$2,840.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ─── SECCIÓN: DE LA DISPERSIÓN A UN SOLO SISTEMA (NEUTRO, SIN BORDES OSCUROS) ─── */}
        <section
          className="w-full py-14 sm:py-16 bg-surface-container-low/40 border-y border-surface-container-high/40 scroll-mt-20"
          id="centralizar"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-8 sm:mb-10"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-teal text-xs font-semibold mb-2">
                <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Nacido de una necesidad real</span>
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                ¿Cuentas y cobros repartidos en varias apps y notas?
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-xl mx-auto leading-relaxed">
                FinPal nació para resolver exactamente eso: dejar de saltar entre múltiples aplicaciones, hojas de cálculo y libretas para tener todo tu dinero bajo control en un solo lugar.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {/* Tarjeta 1: La dispersión habitual */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-surface-container-highest transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-surface-container-low">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="font-heading text-sm font-bold text-on-surface">El problema de tener todo disperso</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-full bg-rose-500/10">
                      Fragmentado
                    </span>
                  </div>
                  <div className="space-y-3 text-xs text-on-surface-variant">
                    <div className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                      <div>
                        <p className="font-semibold text-on-surface">Información fragmentada</p>
                        <p className="text-[11px]">Saldos en una app de banco, préstamos en notas y cobros en mensajes.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                      <div>
                        <p className="font-semibold text-on-surface">Riesgo de olvidos y descontrol</p>
                        <p className="text-[11px]">Fechas de pago que se pasan y cobros que se vuelven incómodos de reclamar.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                      <div>
                        <p className="font-semibold text-on-surface">Cálculos manuales y confusos</p>
                        <p className="text-[11px]">Recalcular intereses, abonos a capital y saldos pendientes a mano.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-surface-container-low text-[11px] text-on-surface-variant">
                  <span>Resultado: falta de claridad sobre cuánto tienes y cuánto te deben.</span>
                </div>
              </motion.div>

              {/* Tarjeta 2: La solución con FinPal (Sin borde oscuro, estilo natural y parejo) */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.1 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-surface-container-highest transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-surface-container-low">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-heading text-sm font-bold text-on-surface">Con FinPal: Todo unificado</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">
                      Centralizado
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-on-surface">Un solo tablero centralizado</p>
                        <p className="text-on-surface-variant text-[11px]">Cuentas de dinero, préstamos activos y movimientos en vivo.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-on-surface">Alertas automáticas de cobro</p>
                        <p className="text-on-surface-variant text-[11px]">Semáforo de puntualidad y días exactos de atraso sin tener que recordar.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-on-surface">Recálculo automático y recibos con folio</p>
                        <p className="text-on-surface-variant text-[11px]">Amortizaciones matemáticas y comprobantes digitales listos para compartir.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-surface-container-low text-xs flex items-center justify-between">
                  <span className="text-on-surface-variant text-[11px]">¿Tienes archivos previos (.xlsx o .csv)?</span>
                  <Link href="/registrarse" className="font-semibold text-primary hover:underline text-xs flex items-center gap-1">
                    <span>Usa el importador asistido</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── SECCIÓN: CARACTERÍSTICAS MODERNIZADAS (SIN RECUADROS ANTIGUOS) ─── */}
        <section className="w-full py-14 sm:py-16 scroll-mt-20" id="alcance">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              className="text-center max-w-xl mx-auto mb-10 sm:mb-12"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <span className="font-mono text-primary font-bold text-xs uppercase tracking-wider">
                Funciones clave
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-on-surface mt-1">
                Todo lo que necesitas, sin complicaciones
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className="group relative bg-surface-container-lowest/90 backdrop-blur-xs p-6 rounded-3xl shadow-xs border border-surface-container-high/60 hover:border-surface-container-highest transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                  >
                    <div>
                      {/* Aura flotante y moderna del icono (Adiós al recuadro tosco antiguo) */}
                      <div className="relative mb-5 flex items-center justify-between">
                        <div className="relative">
                          <div className={`absolute -inset-1 rounded-2xl ${feature.glowColor} blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                          <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.bgGradient} border ${feature.borderColor} ${feature.accentColor} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${feature.badgeBg}`}>
                          {feature.tag}
                        </span>
                      </div>

                      <h3 className="font-heading text-base font-bold text-on-surface mb-2 tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── SECCIÓN: PREGUNTAS FRECUENTES (CON ACORDEÓN ANIMADO FLUIDO) ─── */}
        <section
          className="w-full py-14 sm:py-16 bg-surface-container-low/60 border-t border-surface-container-high/40 scroll-mt-20"
          id="faq"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                Preguntas frecuentes
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                Respuestas directas sobre el uso de FinPal.
              </p>
            </motion.div>

            <div className="space-y-2.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={faq.pregunta}
                    className="bg-surface-container-lowest border border-surface-container-high/70 rounded-xl overflow-hidden transition-all shadow-2xs hover:border-surface-container-highest"
                  >
                    <button
                      type="button"
                      className="w-full px-4 sm:px-5 py-3.5 text-left flex items-center justify-between gap-3 cursor-pointer focus:outline-none"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span className="font-heading text-xs sm:text-sm font-bold text-on-surface pr-2">
                        {faq.pregunta}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isOpen
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 pb-4 pt-1 text-xs text-on-surface-variant leading-relaxed border-t border-surface-container-low">
                            {faq.respuesta}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Schema.org FAQPage para SEO */}
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

        {/* ─── BANNER FINAL (DIRECTO A LA ACCIÓN CON PULSO AMBIENTAL) ─── */}
        <motion.section
          className="w-full py-16 bg-surface-container relative overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-primary/10 blur-[90px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Toma el control de tus préstamos hoy
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-lg mx-auto">
              Empieza gratis en 30 segundos. Sin tarjetas ni compromisos.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
                  href="/registrarse"
                >
                  <span>Crear cuenta gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  className="px-5 py-3 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container font-semibold text-sm transition-colors border border-surface-container-high/70"
                  href="/iniciar-sesion"
                >
                  <span>Iniciar sesión</span>
                </Link>
              </motion.div>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-5">
              Software libre y transparente •{" "}
              <a href={githubWebUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                Código en GitHub
              </a>
            </p>
          </div>
        </motion.section>

        {/* ─── PIE DE PÁGINA COMPACTO ─── */}
        <section className="w-full py-10 bg-surface-container-lowest border-t border-surface-container-high/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface">FinPal</span>
              <span>© 2026 Josué Chacae.</span>
            </div>
            <div className="flex items-center gap-5 font-medium">
              <a className="hover:text-primary transition-colors" href="#simulador">
                Simulador
              </a>
              <a className="hover:text-primary transition-colors" href="#centralizar">
                Por qué FinPal
              </a>
              <button
                type="button"
                onClick={() => setLegalModal("terminos")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Términos
              </button>
              <button
                type="button"
                onClick={() => setLegalModal("privacidad")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Privacidad
              </button>
              <a
                className="hover:text-primary transition-colors flex items-center gap-1"
                href={githubWebUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── MODAL RÁPIDO: TÉRMINOS & PRIVACIDAD ─── */}
      <AnimatePresence>
        {legalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-6 relative text-on-surface max-h-[85vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-surface-container-low">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h3 className="font-heading text-base font-bold">
                    {legalModal === "terminos"
                      ? "Términos de Servicio"
                      : "Política de Privacidad"}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Versión {LEGAL_VERSION}
                  </p>
                </div>
              </div>

              {legalModal === "terminos" ? (
                <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
                  {TERMINOS_DE_SERVICIO.map((sec) => (
                    <div key={sec.id} className="space-y-1">
                      <p className="font-bold text-on-surface">{sec.titulo}</p>
                      {sec.parrafos.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
                  {POLITICA_DE_PRIVACIDAD.map((sec) => (
                    <div key={sec.id} className="space-y-1">
                      <p className="font-bold text-on-surface">{sec.titulo}</p>
                      {sec.parrafos.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-3 border-t border-surface-container-low flex items-center justify-between gap-3">
                <Link
                  href={legalModal === "terminos" ? "/terminos" : "/privacidad"}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  onClick={() => setLegalModal(null)}
                >
                  <span>Página dedicada</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Botón flotante para volver arriba */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            aria-label="Volver arriba"
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-primary text-on-primary shadow-xl hover:bg-primary-container transition-all flex items-center justify-center cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Code2,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileBarChart2,
  FolderOpen,
  HandCoins,
  Handshake,
  Info,
  Landmark,
  LayoutDashboard,
  LogOut,
  Mail,
  MoreHorizontal,
  Percent,
  Plus,
  ReceiptText,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Terminal,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { Contact, FinPalData, initialData, Loan, loanBalance, money, monthlyInterest, Movement, contactFor } from "@/lib/demo-data";
import { formatDateEs } from "@/lib/format-date";
import { FinPalLogo } from "@/components/finpal-logo";

export type PageName =
  | "inicio"
  | "contactos"
  | "prestamos"
  | "pagos"
  | "cuentas"
  | "movimientos"
  | "reportes"
  | "configuracion"
  | "espacios";

const navItems = [
  { label: "Inicio", path: "/inicio", key: "inicio", icon: LayoutDashboard },
  { label: "Contactos / Deudores", path: "/contactos", key: "contactos", icon: UsersRound },
  { label: "Préstamos", path: "/prestamos", key: "prestamos", icon: HandCoins, badge: "3" },
  { label: "Cobros", path: "/pagos", key: "pagos", icon: ReceiptText },
  { label: "Cuentas", path: "/cuentas", key: "cuentas", icon: WalletCards },
  { label: "Movimientos", path: "/movimientos", key: "movimientos", icon: ArrowLeftRight },
  { label: "Reportes", path: "/reportes", key: "reportes", icon: FileBarChart2 },
  { label: "Configuración", path: "/configuracion", key: "configuracion", icon: Settings },
] as const;

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function FinPalPage({ page }: { page: PageName }) {
  const [data, setData] = useState<FinPalData>(initialData);
  const [ready, setReady] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState("Personal");
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [modal, setModal] = useState<"contact" | "loan" | "payment" | "account" | "movement" | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem("finpal-demo-data");
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch {
          // Si falla la lectura del JSON guardado, se usan los datos iniciales
        }
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("finpal-demo-data", JSON.stringify(data));
  }, [data, ready]);

  const totals = useMemo(() => {
    const available = data.accounts.reduce((sum, account) => sum + account.balance, 0);
    const pending = data.loans.reduce((sum, loan) => sum + loanBalance(loan), 0);
    const interest = data.loans.reduce((sum, loan) => sum + monthlyInterest(loan), 0);
    const expenses = Math.abs(
      data.movements.filter((m) => m.kind === "Gasto").reduce((sum, m) => sum + m.amount, 0)
    );
    const lateCount = data.loans.filter((l) => l.status === "Con atraso").length;
    return { available, pending, interest, expenses, lateCount };
  }, [data]);

  const addContact = (form: FormData) => {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    const contact: Contact = {
      id: id(),
      name,
      phone: String(form.get("phone") ?? ""),
      avatar: name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase(),
    };
    setData((d) => ({ ...d, contacts: [...d.contacts, contact] }));
    setModal(null);
  };

  const addLoan = (form: FormData) => {
    const principal = Number(form.get("principal"));
    const contactId = String(form.get("contactId"));
    const accountId = String(form.get("accountId"));
    if (!principal || !contactId) return;
    const account = data.accounts.find((a) => a.id === accountId);
    const rawRate = Number(form.get("rate")) || 0;
    const wantsInterest = form.get("chargesInterest") === "on" || form.get("chargesInterest") === "true";
    const chargesInterest = wantsInterest && rawRate > 0;
    const loan: Loan = {
      id: id(),
      contactId,
      principal,
      paidPrincipal: 0,
      rate: chargesInterest ? rawRate : 0,
      chargesInterest,
      startDate: String(form.get("startDate")),
      paymentDay: Number(form.get("paymentDay")) || 1,
      status: "Al día",
    };
    setData((d) => ({
      ...d,
      loans: [...d.loans, loan],
      accounts: d.accounts.map((a) => (a.id === accountId ? { ...a, balance: a.balance - principal } : a)),
      movements: [
        ...d.movements,
        {
          id: id(),
          date: formatDateEs(new Date().toISOString()),
          description: `Préstamo entregado · ${contactFor(d, contactId)}`,
          category: "Préstamo",
          account: account?.name ?? "",
          amount: -principal,
          kind: "Movimiento",
        },
      ],
    }));
    setModal(null);
  };

  const addPayment = (form: FormData) => {
    const loanId = String(form.get("loanId"));
    const amount = Number(form.get("amount"));
    const principal = Number(form.get("principal"));
    const accountId = String(form.get("accountId"));
    if (!loanId || !amount || principal > amount) return;
    const loan = data.loans.find((l) => l.id === loanId);
    const account = data.accounts.find((a) => a.id === accountId);
    if (!loan) return;
    const applied = Math.min(principal, loanBalance(loan));
    setData((d) => ({
      ...d,
      loans: d.loans.map((l) =>
        l.id === loanId
          ? {
              ...l,
              paidPrincipal: l.paidPrincipal + applied,
              status: l.paidPrincipal + applied >= l.principal ? "Pagado" : l.status,
            }
          : l
      ),
      accounts: d.accounts.map((a) => (a.id === accountId ? { ...a, balance: a.balance + amount } : a)),
      movements: [
        ...d.movements,
        {
          id: id(),
          date: String(form.get("date")),
          description: `Pago de préstamo · ${contactFor(d, loan.contactId)}`,
          category: "Préstamo",
          account: account?.name ?? "",
          amount,
          kind: "Ingreso",
        },
      ],
    }));
    setModal(null);
  };

  const addAccount = (form: FormData) => {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    setData((d) => ({
      ...d,
      accounts: [
        ...d.accounts,
        {
          id: id(),
          name,
          type: String(form.get("type") ?? "Otra cuenta"),
          balance: Number(form.get("balance")) || 0,
          color: "mint",
        },
      ],
    }));
    setModal(null);
  };

  const addMovement = (form: FormData) => {
    const amount = Number(form.get("amount"));
    const accountId = String(form.get("accountId"));
    const kind = String(form.get("kind")) as Movement["kind"];
    const account = data.accounts.find((a) => a.id === accountId);
    if (!amount || !account) return;
    const signed = kind === "Gasto" ? -amount : amount;
    setData((d) => ({
      ...d,
      accounts: d.accounts.map((a) => (a.id === accountId ? { ...a, balance: a.balance + signed } : a)),
      movements: [
        ...d.movements,
        {
          id: id(),
          date: String(form.get("date")),
          description: String(form.get("description")) || kind,
          category: kind,
          account: account.name,
          amount: signed,
          kind,
        },
      ],
    }));
    setModal(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-on-surface antialiased flex selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* 1. Barra de navegación lateral (240px de ancho) */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-surface-container-lowest border-r border-surface-container-high/60 z-40 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col">
          {/* Marca superior y logotipo */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-surface-container-low">
            <Link href="/inicio" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <FinPalLogo size={32} className="w-8 h-8" />
              <div className="flex items-baseline tracking-tight font-heading text-lg">
                <span className="font-extrabold text-on-surface">Fin</span>
                <span className="font-extrabold text-primary">Pal</span>
              </div>
            </Link>
          </div>

          {/* Selector de espacio de trabajo */}
          <div className="px-4 py-3 relative">
            <button
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors border border-surface-container-high/40 text-xs font-semibold"
              type="button"
              onClick={() => setShowWorkspaceDropdown((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                <span>{currentWorkspace}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-on-surface-variant" />
            </button>

            {showWorkspaceDropdown && (
              <div className="absolute left-4 right-4 top-13 bg-surface-container-lowest border border-surface-container-high/80 rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                {["Personal", "Préstamos", "Negocio"].map((ws) => (
                  <button
                    key={ws}
                    type="button"
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setShowWorkspaceDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors ${
                      currentWorkspace === ws
                        ? "bg-secondary-container/40 text-primary"
                        : "text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    <span>{ws}</span>
                    {currentWorkspace === ws && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
                <div className="pt-1 border-t border-surface-container-low">
                  <Link
                    href="/espacios"
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-primary hover:bg-secondary-container/30 rounded-lg flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ver todos los espacios</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Main Navigation List */}
          <nav className="flex flex-col gap-0.5 px-3 mt-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = page === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
                    isActive
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span
                      className={`ml-auto text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? "bg-surface-container-lowest text-primary"
                          : "bg-secondary-container/60 text-on-secondary-container"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Repo Button */}
        <div className="p-3 border-t border-surface-container-low">
          <a
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors border border-surface-container-high/40 text-xs font-medium"
            href="https://github.com/chacaejosue/finpal.git"
            rel="noopener noreferrer"
            target="_blank"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-on-surface-variant" />
              <span>GitHub Repo</span>
            </div>
          </a>
        </div>
      </aside>

      {/* 2. Área principal de contenido */}
      <div className="pl-60 flex-1 flex flex-col min-w-0">
        {/* Barra de cabecera superior */}
        <header className="fixed top-0 left-60 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.03)] border-b border-surface-container-high/60 z-30 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-surface-container-high/40">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Viernes, 24 de Mayo 2024</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors border border-surface-container-high/60"
              href="https://github.com/chacaejosue/finpal.git"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Terminal className="w-4 h-4 text-primary" />
              <span>Ver en GitHub</span>
            </a>

            <button
              className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors relative"
              type="button"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-surface-container-low">
              <div className="w-8 h-8 rounded-full bg-on-surface text-surface-container-lowest flex items-center justify-center font-bold text-xs ring-2 ring-primary/20">
                JC
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-on-surface leading-tight">Josué Chacae</span>
                <span className="text-[11px] text-on-surface-variant leading-tight">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="w-full pt-20 px-8 pb-12 min-h-[calc(100vh-4rem)]">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto w-full flex flex-col gap-6"
          >
            {page === "inicio" && (
              <DashboardView
                data={data}
                totals={totals}
                openModal={(m) => setModal(m)}
              />
            )}
            {page === "contactos" && (
              <ContactsView
                data={data}
                openModal={() => setModal("contact")}
              />
            )}
            {page === "prestamos" && (
              <LoansView
                data={data}
                openModal={() => setModal("loan")}
              />
            )}
            {page === "pagos" && (
              <PaymentsView
                data={data}
                openModal={() => setModal("payment")}
              />
            )}
            {page === "cuentas" && (
              <AccountsView
                data={data}
                openModal={() => setModal("account")}
              />
            )}
            {page === "movimientos" && (
              <MovementsView
                data={data}
                openModal={() => setModal("movement")}
              />
            )}
            {page === "reportes" && <ReportsView data={data} totals={totals} />}
            {page === "configuracion" && (
              <SettingsView
                reset={() => {
                  setData(initialData);
                  localStorage.removeItem("finpal-demo-data");
                }}
              />
            )}
            {page === "espacios" && <SpacesView />}
          </motion.div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <ModalWrapper
            title={
              {
                contact: "Nuevo contacto",
                loan: "Nuevo préstamo",
                payment: "Registrar pago",
                account: "Nueva cuenta",
                movement: "Registrar movimiento",
              }[modal]
            }
            close={() => setModal(null)}
          >
            {modal === "contact" && <ContactForm submit={addContact} />}
            {modal === "loan" && <LoanForm data={data} submit={addLoan} />}
            {modal === "payment" && <PaymentForm data={data} submit={addPayment} />}
            {modal === "account" && <AccountForm submit={addAccount} />}
            {modal === "movement" && <MovementForm data={data} submit={addMovement} />}
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

{/* --- VIEW COMPONENTS --- */}

function DashboardView({
  data,
  totals,
  openModal,
}: {
  data: FinPalData;
  totals: Record<string, number>;
  openModal: (m: "loan" | "payment") => void;
}) {
  const upcoming = data.loans.filter((l) => l.status !== "Pagado").slice(0, 3);
  const flow = [
    { day: "Lun", income: 900, expense: 220 },
    { day: "Mar", income: 1200, expense: 360 },
    { day: "Mié", income: 760, expense: 180 },
    { day: "Jue", income: 1500, expense: 410 },
    { day: "Vie", income: 1000, expense: 250 },
    { day: "Sáb", income: 1300, expense: 300 },
    { day: "Dom", income: 920, expense: 180 },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera de bienvenida y barra de acciones */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-1">
            <span className="inline-flex items-center gap-1.5 text-primary bg-secondary-container/40 px-2.5 py-0.5 rounded-full border border-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Panel de control financiero
            </span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-on-surface tracking-tight">Hola, Josué</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Aquí tienes el resumen consolidado de tus finanzas y cartera de préstamos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold text-xs transition-all shadow-2xs"
            type="button"
            onClick={() => openModal("payment")}
          >
            <ReceiptText className="w-4 h-4 text-primary" />
            <span>Registrar cobro</span>
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-xs"
            type="button"
            onClick={() => openModal("loan")}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo préstamo</span>
          </button>
        </div>
      </div>

      {/* 4 Tarjetas de KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total en cuentas", value: totals.available, icon: WalletCards, colorClass: "bg-emerald-50 text-primary" },
          { label: "Préstamos pendientes", value: totals.pending, icon: HandCoins, colorClass: "bg-amber-50 text-amber-700" },
          { label: "Interés est. mensual", value: totals.interest, icon: Percent, colorClass: "bg-blue-50 text-blue-700" },
          { label: "Gastos registrados", value: totals.expenses, icon: ArrowLeftRight, colorClass: "bg-rose-50 text-error" },
        ].map((kpi, index) => {
          const Component = kpi.icon;
          return (
            <motion.div
              className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/70 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-mono">
                  {kpi.label}
                </span>
                <div className={`w-8 h-8 rounded-xl ${kpi.colorClass} flex items-center justify-center`}>
                  <Component className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="font-heading text-2xl font-extrabold text-on-surface tracking-tight">
                  {money(kpi.value)}
                </div>
                <div className="mt-2 pt-2 border-t border-surface-container-low text-[11px] text-on-surface-variant font-medium">
                  Actualizado con movimientos
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cuadrícula principal: Gráfico de flujo y próximos cobros */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico de flujo semanal (Ocupa 8 columnas) */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-surface-container-low mb-4">
            <h2 className="font-heading text-base font-bold text-on-surface">Flujo de Dinero (Semanal)</h2>
            <span className="text-xs font-semibold text-on-surface-variant font-mono">Ingresos vs Gastos</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flow} barGap={4}>
                <CartesianGrid vertical={false} stroke="#eaedff" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6d7a72" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "#f2f3ff" }}
                  contentStyle={{
                    border: "1px solid #e2e7ff",
                    borderRadius: 8,
                    fontSize: 12,
                    backgroundColor: "#ffffff",
                  }}
                />
                <Bar dataKey="income" fill="#006948" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="expense" fill="#ba1a1a" radius={[4, 4, 0, 0]} name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Payments (Span 4) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-low mb-4">
              <h2 className="font-heading text-base font-bold text-on-surface">Próximos cobros</h2>
              <Link href="/pagos" className="text-xs font-bold text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {upcoming.map((loan) => (
                <div
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high/30"
                  key={loan.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-xs flex items-center justify-center">
                      {contactFor(data, loan.contactId).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">{contactFor(data, loan.contactId)}</p>
                      <p className="text-[11px] text-on-surface-variant">Pago día {loan.paymentDay}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-primary">{money(monthlyInterest(loan))}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/prestamos"
            className="mt-4 inline-flex items-center justify-between p-3 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span>Ver cartera completa</span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ContactsView({ data, openModal }: { data: FinPalData; openModal: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Contactos &amp; Deudores</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Directorio de personas y seguimiento del estado de deuda.
          </p>
        </div>
        <button
          className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-2"
          onClick={openModal}
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo contacto</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <th className="py-3 px-4">Nombre</th>
              <th className="py-3 px-4">Teléfono</th>
              <th className="py-3 px-4">Préstamos</th>
              <th className="py-3 px-4">Saldo Pendiente</th>
              <th className="py-3 px-4 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {data.contacts.map((c) => {
              const loans = data.loans.filter((l) => l.contactId === c.id);
              const balance = loans.reduce((sum, l) => sum + loanBalance(l), 0);
              const isLate = loans.some((l) => l.status === "Con atraso");
              return (
                <tr key={c.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container font-bold text-xs flex items-center justify-center">
                      {c.avatar}
                    </div>
                    <span className="font-semibold text-sm">{c.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">{c.phone || "—"}</td>
                  <td className="py-3.5 px-4 text-xs font-semibold">{loans.length}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-sm">{money(balance)}</td>
                  <td className="py-3.5 px-4 text-right">
                    {balance ? (
                      isLate ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-atrasado inline-flex items-center">
                          Con atraso
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-al-dia inline-flex items-center">
                          Al día
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-saldado inline-flex items-center">
                        Sin deuda
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoansView({ data, openModal }: { data: FinPalData; openModal: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Préstamos Activos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Registro de préstamos con cálculo mensual de intereses.
          </p>
        </div>
        <button
          className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-2"
          onClick={openModal}
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo préstamo</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4">Monto Inicial</th>
              <th className="py-3 px-4">Saldo Pendiente</th>
              <th className="py-3 px-4">Interés Mensual</th>
              <th className="py-3 px-4">Día de Pago</th>
              <th className="py-3 px-4 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {data.loans.map((l) => (
              <tr key={l.id} className="hover:bg-surface-container-low/40 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-sm">{contactFor(data, l.contactId)}</td>
                <td className="py-3.5 px-4 font-mono font-medium text-xs">{money(l.principal)}</td>
                <td className="py-3.5 px-4 font-mono font-semibold text-sm">{money(loanBalance(l))}</td>
                <td className="py-3.5 px-4 font-mono text-xs text-primary font-semibold">
                  {l.chargesInterest ? `${l.rate}% (${money(monthlyInterest(l))})` : "Sin interés"}
                </td>
                <td className="py-3.5 px-4 text-xs font-medium text-on-surface-variant">Día {l.paymentDay}</td>
                <td className="py-3.5 px-4 text-right">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center ${
                      l.status === "Con atraso"
                        ? "badge-atrasado"
                        : "badge-al-dia"
                    }`}
                  >
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsView({ data, openModal }: { data: FinPalData; openModal: () => void }) {
  const movements = data.movements.filter((m) => m.category === "Préstamo");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Cobros recibidos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Histórico del dinero recibido y sus abonos de capital e interés.
          </p>
        </div>
        <button
          className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-2"
          onClick={openModal}
        >
          <Plus className="w-4 h-4" />
          <span>Registrar cobro</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Cuenta Receptora</th>
              <th className="py-3 px-4 text-right">Monto Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-surface-container-low/40 transition-colors">
                <td className="py-3.5 px-4 text-xs font-medium text-on-surface-variant">{m.date}</td>
                <td className="py-3.5 px-4 font-semibold text-sm">{m.description}</td>
                <td className="py-3.5 px-4 text-xs text-on-surface-variant">{m.account}</td>
                <td className="py-3.5 px-4 font-mono font-bold text-sm text-primary text-right">
                  + {money(Math.abs(m.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountsView({ data, openModal }: { data: FinPalData; openModal: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Cuentas de Dinero</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Efectivo, bancos y billeteras móviles consolidados.
          </p>
        </div>
        <button
          className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-2"
          onClick={openModal}
        >
          <Plus className="w-4 h-4" />
          <span>Nueva cuenta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.accounts.map((a) => (
          <div
            className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-5 shadow-2xs flex flex-col justify-between"
            key={a.id}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-on-surface">{a.name}</h3>
                  <p className="text-xs text-on-surface-variant">{a.type}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-container-low flex items-baseline justify-between">
              <span className="text-xs text-on-surface-variant font-medium">Saldo disponible</span>
              <span className="font-heading text-xl font-extrabold text-black dark:text-white font-mono">{money(a.balance)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MovementsView({ data, openModal }: { data: FinPalData; openModal: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Historial de Movimientos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Bitácora de ingresos, gastos y préstamos registrados.
          </p>
        </div>
        <button
          className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-2"
          onClick={openModal}
        >
          <Plus className="w-4 h-4" />
          <span>Registrar movimiento</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4">Cuenta</th>
              <th className="py-3 px-4 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {[...data.movements].reverse().map((m) => (
              <tr key={m.id} className="hover:bg-surface-container-low/40 transition-colors">
                <td className="py-3.5 px-4 text-xs font-medium text-on-surface-variant">{m.date}</td>
                <td className="py-3.5 px-4 font-semibold text-sm">{m.description}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-surface-container text-on-surface-variant">
                    {m.category}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-on-surface-variant">{m.account}</td>
                <td
                  className={`py-3.5 px-4 font-mono font-bold text-sm text-right ${
                    m.amount >= 0 ? "text-primary" : "text-error"
                  }`}
                >
                  {m.amount >= 0 ? "+ " : "− "}
                  {money(Math.abs(m.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsView({ data, totals }: { data: FinPalData; totals: Record<string, number> }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Reportes Financieros</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Consolidado general de ingresos, egresos y rendimiento.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-surface-container-high/70 p-5 rounded-2xl shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Ingresos Totales</span>
          <p className="font-heading text-2xl font-bold text-primary mt-1">
            {money(data.movements.filter((m) => m.amount > 0).reduce((s, m) => s + m.amount, 0))}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-surface-container-high/70 p-5 rounded-2xl shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Gastos Registrados</span>
          <p className="font-heading text-2xl font-bold text-error mt-1">{money(totals.expenses)}</p>
        </div>
        <div className="bg-surface-container-lowest border border-surface-container-high/70 p-5 rounded-2xl shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Balance Neto Disponible</span>
          <p className="font-heading text-2xl font-bold text-on-surface mt-1">{money(totals.available)}</p>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="pb-4 border-b border-surface-container-high/60">
        <h1 className="font-heading text-2xl font-extrabold text-on-surface">Configuración del Espacio</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Preferencias del sistema y datos locales.</p>
      </div>

      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Moneda Principal</label>
          <input
            defaultValue="Boliviano (Bs)"
            className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm font-medium text-on-surface"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Zona Horaria</label>
          <input
            defaultValue="America/La_Paz"
            className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm font-medium text-on-surface"
          />
        </div>

        <div className="pt-4 border-t border-surface-container-low">
          <h3 className="font-heading text-base font-bold text-on-surface mb-1">Datos de Demostración</h3>
          <p className="text-xs text-on-surface-variant mb-3">
            Esta demo opera localmente en tu navegador. Puedes restaurar los datos de ejemplo iniciales en cualquier momento.
          </p>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-xl border border-surface-container-high/80 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            Restablecer datos de prueba
          </button>
        </div>
      </div>
    </div>
  );
}

function SpacesView() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-surface-container-high/60">
        <h1 className="font-heading text-2xl font-extrabold text-on-surface">Espacios de Trabajo</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Selecciona o gestiona tus espacios independientes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/inicio"
          className="p-5 rounded-2xl border border-surface-container-high/70 bg-surface-container-lowest hover:border-primary/40 transition-all shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-primary flex items-center justify-center font-bold">
              <WalletCards className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-on-surface">Personal</h3>
              <span className="text-[11px] font-semibold text-primary">Activo</span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant">Gastos personales, préstamos familiares y ahorro.</p>
        </Link>
      </div>
    </div>
  );
}

{/* --- MODAL WRAPPER & FORMS --- */}

function ModalWrapper({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-xs p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={close}
    >
      <motion.div
        className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/80 shadow-2xl w-full max-w-md p-6 relative"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-heading text-xl font-bold text-on-surface mb-4">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ContactForm({ submit }: { submit: (f: FormData) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Nombre completo</label>
        <input
          name="name"
          required
          type="text"
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Teléfono</label>
        <input
          name="phone"
          placeholder="+591 ..."
          type="text"
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>
      <button
        type="submit"
        className="w-full h-10 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-xs transition-all"
      >
        Guardar Contacto
      </button>
    </form>
  );
}

function LoanForm({ data, submit }: { data: FinPalData; submit: (f: FormData) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Deudor</label>
        <select
          name="contactId"
          className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs font-medium"
        >
          {data.contacts.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Capital Prestado ($)</label>
        <input
          name="principal"
          type="number"
          min="1"
          required
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input name="chargesInterest" type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary" />
        <label className="text-xs font-semibold text-on-surface">Genera cobro de interés mensual (el deudor paga intereses)</label>
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Tasa mensual (%)</label>
        <input
          name="rate"
          type="number"
          min="0"
          step="0.1"
          defaultValue="3"
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Día esperado de pago mensual</label>
        <input
          name="paymentDay"
          type="number"
          min="1"
          max="31"
          defaultValue="15"
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Cuenta de entrega</label>
        <select
          name="accountId"
          className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs font-medium"
        >
          {data.accounts.map((a) => (
            <option value={a.id} key={a.id}>
              {a.name} ({money(a.balance)})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full h-10 mt-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-xs transition-all"
      >
        Guardar Préstamo
      </button>
    </form>
  );
}

function PaymentForm({ data, submit }: { data: FinPalData; submit: (f: FormData) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Préstamo</label>
        <select
          name="loanId"
          className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs font-medium"
        >
          {data.loans
            .filter((l) => l.status !== "Pagado")
            .map((l) => (
              <option value={l.id} key={l.id}>
                {contactFor(data, l.contactId)} · saldo {money(loanBalance(l))}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Monto Total Recibido ($)</label>
        <input
          name="amount"
          type="number"
          min="1"
          required
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Aplicado a Capital ($)</label>
        <input
          name="principal"
          type="number"
          min="0"
          defaultValue="0"
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Fecha de pago</label>
        <input
          name="date"
          type="text"
          defaultValue={formatDateEs(new Date().toISOString())}
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Cuenta Receptora</label>
        <select
          name="accountId"
          className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs font-medium"
        >
          {data.accounts.map((a) => (
            <option value={a.id} key={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full h-10 mt-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-xs transition-all"
      >
        Registrar Pago
      </button>
    </form>
  );
}

function AccountForm({ submit }: { submit: (f: FormData) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Nombre de la cuenta</label>
        <input
          name="name"
          required
          placeholder="Ej. Banco BNB, Efectivo..."
          type="text"
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Tipo</label>
        <select
          name="type"
          className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs font-medium"
        >
          <option>Efectivo</option>
          <option>Cuenta bancaria</option>
          <option>Billetera móvil</option>
          <option>Ahorros</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Saldo inicial ($)</label>
        <input
          name="balance"
          type="number"
          defaultValue="0"
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>
      <button
        type="submit"
        className="w-full h-10 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-xs transition-all"
      >
        Guardar Cuenta
      </button>
    </form>
  );
}

function MovementForm({ data, submit }: { data: FinPalData; submit: (f: FormData) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Tipo</label>
        <select
          name="kind"
          className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs font-medium"
        >
          <option value="Ingreso">Ingreso</option>
          <option value="Gasto">Gasto</option>
          <option value="Movimiento">Movimiento</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Descripción</label>
        <input
          name="description"
          required
          type="text"
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Monto ($)</label>
        <input
          name="amount"
          type="number"
          min="1"
          required
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Fecha</label>
        <input
          name="date"
          type="text"
          defaultValue={formatDateEs(new Date().toISOString())}
          className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Cuenta</label>
        <select
          name="accountId"
          className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs font-medium"
        >
          {data.accounts.map((a) => (
            <option value={a.id} key={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full h-10 mt-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-xs transition-all"
      >
        Guardar Movimiento
      </button>
    </form>
  );
}

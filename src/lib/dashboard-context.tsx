"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useEspacio } from "@/lib/espacio-context";
import { getContactos, crearContacto } from "@/app/(dashboard)/contactos/actions";
import { getCuentasConSaldo, crearCuenta } from "@/app/(dashboard)/cuentas/actions";
import { getPrestamos, crearPrestamo } from "@/app/(dashboard)/prestamos/actions";
import { getPagos, registrarPago } from "@/app/(dashboard)/pagos/actions";
import { getMovimientos, registrarMovimiento } from "@/app/(dashboard)/movimientos/actions";
import { getPreferencias, actualizarPreferencias } from "@/app/(dashboard)/configuracion/actions";
import { getSessionAccent, setSessionAccent, applyCustomAccent } from "@/lib/theme-utils";

export type Contacto = Awaited<ReturnType<typeof getContactos>>[number];
export type Cuenta = Awaited<ReturnType<typeof getCuentasConSaldo>>[number];
export type Prestamo = Awaited<ReturnType<typeof getPrestamos>>[number];
export type Pago = Awaited<ReturnType<typeof getPagos>>[number];
export type Movimiento = Awaited<ReturnType<typeof getMovimientos>>[number];
export type Preferencias = Awaited<ReturnType<typeof getPreferencias>>;

/**
 * Calcula el saldo deudor pendiente (capital activo).
 * Descuenta el capital devuelto acumulado del monto principal original, garantizando no negatividad.
 */
export const loanBalance = (p: Prestamo): number =>
  Math.max(0, Number(p.monto_principal) - Number(p.monto_capital_pagado));

/**
 * Calcula el rendimiento de interés mensual programado para un préstamo.
 * Si el préstamo está configurado sin interés (cobra_interes = false o tasa = 0), retorna 0.
 * En caso contrario, aplica la tasa porcentual mensual pactada sobre el saldo pendiente actual.
 */
export const monthlyInterest = (p: Prestamo): number =>
  p.cobra_interes ? loanBalance(p) * (Number(p.tasa_interes_mensual) / 100) : 0;

/**
 * Formatea valores numéricos en moneda local boliviana (Bs) con dos decimales y separador de miles.
 */
export const money = (v: number): string =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", minimumFractionDigits: 2 })
    .format(v)
    .replace("BOB", "Bs");

/**
 * Normaliza relaciones de PostgREST / Supabase.
 * En consultas con joins externos, Supabase puede devolver un objeto o un arreglo de 1 elemento.
 */
export function rel<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export type ModalType = "contact" | "loan" | "payment" | "account" | "movement" | null;

interface DashboardContextValue {
  contactos: Contacto[];
  cuentas: Cuenta[];
  prestamos: Prestamo[];
  pagos: Pago[];
  movimientos: Movimiento[];
  totals: {
    available: number;
    pending: number;
    collected: number;
    interest: number;
    expenses: number;
    incomes?: number;
    interestPaid?: number;
    lateCount: number;
    paidLoansCount: number;
    activeLoansCount: number;
  };
  loading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  modal: ModalType;
  openModal: (m: ModalType) => void;
  closeModal: () => void;
  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
  submitting: boolean;
  formError: string | null;
  successNotice: string | null;
  setSuccessNotice: (v: string | null) => void;
  handleSubmitModal: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  userEmail: string;
  isNavigating: boolean;
  setIsNavigating: (v: boolean) => void;
  preferencias: Preferencias;
  guardarPreferencias: (colorAcento: string, modoOscuro: boolean, tasaInteresPredeterminada: number) => Promise<string | null>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail: string;
}) {
  const router = useRouter();
  const { espacioId } = useEspacio();

  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalType>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [preferencias, setPreferencias] = useState<Preferencias>({
    colorAcento: "verde",
    modoOscuro: false,
    tasaInteresPredeterminada: 3,
  });

  useEffect(() => {
    const cachedAccent = getSessionAccent();
    const validAccents = ["verde", "azul", "violeta", "naranja", "rosa"];
    if (cachedAccent && validAccents.includes(cachedAccent) && cachedAccent !== "verde") {
      setPreferencias((prev) => ({
        ...prev,
        colorAcento: cachedAccent as Preferencias["colorAcento"],
      }));
      applyCustomAccent(cachedAccent);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!espacioId) return;
    setError(null);
    try {
      const [c, cu, p, pg, m, prefs] = await Promise.all([
        getContactos(espacioId),
        getCuentasConSaldo(espacioId),
        getPrestamos(espacioId),
        getPagos(espacioId),
        getMovimientos(espacioId),
        getPreferencias(),
      ]);

      setContactos(c);
      setCuentas(cu);
      setPrestamos(p);
      setPagos(pg);
      setMovimientos(m);
      setPreferencias(prefs);
      if (prefs?.colorAcento) {
        setSessionAccent(prefs.colorAcento);
        applyCustomAccent(prefs.colorAcento);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [espacioId]);

  const guardarPreferencias = useCallback(async (
    colorAcento: string,
    modoOscuro: boolean,
    tasaInteresPredeterminada: number,
  ) => {
    setSessionAccent(colorAcento);
    applyCustomAccent(colorAcento);
    const result = await actualizarPreferencias(colorAcento, modoOscuro, tasaInteresPredeterminada);
    if (result.error) return result.error;
    setPreferencias({ colorAcento: colorAcento as Preferencias["colorAcento"], modoOscuro, tasaInteresPredeterminada });
    return null;
  }, []);

  // Carga de preferencias globales del usuario (independiente de si hay espacioId seleccionado o no)
  useEffect(() => {
    getPreferencias()
      .then((prefs) => {
        if (prefs) {
          setPreferencias((prev) => ({
            ...prev,
            ...prefs,
          }));
          if (prefs.colorAcento) {
            setSessionAccent(prefs.colorAcento);
            applyCustomAccent(prefs.colorAcento);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!espacioId) {
      router.push("/espacios");
      return;
    }
    loadData();
  }, [espacioId, loadData, router]);

  /**
   * Agregación central de métricas financieras del espacio:
   * - available: liquidez disponible inmediata sumando saldos de cuentas de dinero.
   * - pending: capital vivo colocado en la calle (excluye préstamos liquidados o cancelados).
   * - interest: rendimiento mensual estimado proyectado según el saldo pendiente actual.
   * - interestPaid: utilidades totales percibidas por concepto de intereses.
   */
  const totals = useMemo(() => {
    const available = cuentas.reduce((sum, c) => sum + c.saldo, 0);
    const activeLoans = prestamos.filter((p) => p.estado === "activo" || p.estado === "atrasado");
    const pending = activeLoans.reduce((sum, p) => sum + loanBalance(p), 0);
    const interest = activeLoans.reduce((sum, p) => sum + monthlyInterest(p), 0);
    const expenses = movimientos
      .filter((m) => ["gasto", "transferencia_salida"].includes(m.tipo) || (m.tipo === "ajuste" && m.ajuste_sentido === "restar"))
      .reduce((sum, m) => sum + Number(m.monto), 0);
    const incomes = movimientos
      .filter((m) => ["ingreso", "transferencia_entrada"].includes(m.tipo) || (m.tipo === "ajuste" && m.ajuste_sentido === "sumar"))
      .reduce((sum, m) => sum + Number(m.monto), 0);
    const collected = pagos.reduce((sum, p) => sum + Number(p.monto_total), 0);
    const interestPaid = pagos.reduce((sum, p) => sum + Number(p.monto_interes), 0);
    const lateCount = prestamos.filter((p) => p.estado === "atrasado").length;
    const paidLoansCount = prestamos.filter((p) => p.estado === "pagado").length;
    const activeLoansCount = activeLoans.length;
    return { available, pending, collected, interest, interestPaid, expenses, incomes, lateCount, paidLoansCount, activeLoansCount };
  }, [cuentas, prestamos, movimientos, pagos]);

  const openModal = (m: ModalType) => {
    setFormError(null);
    setModal(m);
  };

  const closeModal = () => {
    setFormError(null);
    setModal(null);
  };

  async function handleSubmitModal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!espacioId || !modal) return;
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    setFormError(null);

    let result: { success?: boolean; error?: unknown } = {};
    if (modal === "contact") result = await crearContacto(espacioId, fd);
    else if (modal === "account") result = await crearCuenta(espacioId, fd);
    else if (modal === "loan") result = await crearPrestamo(espacioId, fd);
    else if (modal === "payment") result = await registrarPago(espacioId, fd);
    else if (modal === "movement") result = await registrarMovimiento(espacioId, fd);

    setSubmitting(false);
    if (result.error) {
      const errs = result.error as Record<string, string[]>;
      const firstError =
        errs._global?.[0] ??
        Object.values(errs).flat()[0] ??
        "Error al guardar. Revisa los campos obligatorios.";
      setFormError(firstError);
    } else {
      const msg =
        modal === "account"
          ? "¡Cuenta creada correctamente!"
          : modal === "contact"
          ? "¡Contacto guardado correctamente!"
          : modal === "loan"
          ? "¡Préstamo registrado correctamente!"
          : modal === "payment"
          ? "¡Cobro registrado correctamente!"
          : modal === "movement"
          ? "¡Movimiento registrado correctamente!"
          : "¡Guardado correctamente!";
      setSuccessNotice(msg);
      window.setTimeout(() => setSuccessNotice(null), 3500);
      closeModal();
      await loadData();
    }
  }

  return (
    <DashboardContext.Provider
      value={{
        contactos,
        cuentas,
        prestamos,
        pagos,
        movimientos,
        totals,
        loading,
        error,
        loadData,
        modal,
        openModal,
        closeModal,
        showImportModal,
        setShowImportModal,
        submitting,
        formError,
        successNotice,
        setSuccessNotice,
        handleSubmitModal,
        userEmail,
        isNavigating,
        setIsNavigating,
        preferencias,
        guardarPreferencias,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}

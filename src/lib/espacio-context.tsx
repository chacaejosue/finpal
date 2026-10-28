"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

let currentGlobalCurrency = "BOB";

export function getActiveCurrencyCode(): string {
  return currentGlobalCurrency || "BOB";
}

export function setActiveCurrencyCode(moneda: string) {
  currentGlobalCurrency = (moneda || "BOB").toUpperCase();
}

interface EspacioContextValue {
  espacioId: string | null;
  espacioNombre: string;
  zonaHoraria: string;
  codigoMoneda: string;
  setEspacio: (id: string, nombre: string, zonaHoraria?: string, codigoMoneda?: string) => void;
  setZonaHoraria: (zona: string) => void;
  setCodigoMoneda: (moneda: string) => void;
}

const EspacioContext = createContext<EspacioContextValue>({
  espacioId: null,
  espacioNombre: "",
  zonaHoraria: "America/La_Paz",
  codigoMoneda: "BOB",
  setEspacio: () => {},
  setZonaHoraria: () => {},
  setCodigoMoneda: () => {},
});

const STORAGE_KEY = "finpal-espacio-activo";

export function EspacioProvider({ children }: { children: ReactNode }) {
  const [espacioId, setEspacioId] = useState<string | null>(null);
  const [espacioNombre, setEspacioNombre] = useState("");
  const [zonaHoraria, setZonaHorariaState] = useState("America/La_Paz");
  const [codigoMoneda, setCodigoMonedaState] = useState("BOB");

  // Rehidratar desde localStorage al montar el componente
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { id, nombre, zonaHoraria: savedZona, codigoMoneda: savedMoneda } = JSON.parse(saved);
        setEspacioId(id);
        setEspacioNombre(nombre);
        if (savedZona) setZonaHorariaState(savedZona);
        if (savedMoneda) {
          setCodigoMonedaState(savedMoneda);
          setActiveCurrencyCode(savedMoneda);
        }
      }
    } catch {
      // Ignorar errores al parsear
    }
  }, []);

  function setEspacio(id: string, nombre: string, zona?: string, moneda?: string) {
    const finalZona = zona || zonaHoraria || "America/La_Paz";
    const finalMoneda = (moneda || codigoMoneda || "BOB").toUpperCase();
    setEspacioId(id);
    setEspacioNombre(nombre);
    setZonaHorariaState(finalZona);
    setCodigoMonedaState(finalMoneda);
    setActiveCurrencyCode(finalMoneda);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id, nombre, zonaHoraria: finalZona, codigoMoneda: finalMoneda }),
      );
    } catch {}
  }

  function setZonaHoraria(zona: string) {
    setZonaHorariaState(zona);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.zonaHoraria = zona;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {}
  }

  function setCodigoMoneda(moneda: string) {
    const norm = (moneda || "BOB").toUpperCase();
    setCodigoMonedaState(norm);
    setActiveCurrencyCode(norm);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.codigoMoneda = norm;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {}
  }

  return (
    <EspacioContext.Provider
      value={{
        espacioId,
        espacioNombre,
        zonaHoraria,
        codigoMoneda,
        setEspacio,
        setZonaHoraria,
        setCodigoMoneda,
      }}
    >
      {children}
    </EspacioContext.Provider>
  );
}

export function useEspacio() {
  return useContext(EspacioContext);
}

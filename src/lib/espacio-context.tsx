"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface EspacioContextValue {
  espacioId: string | null;
  espacioNombre: string;
  zonaHoraria: string;
  setEspacio: (id: string, nombre: string, zonaHoraria?: string) => void;
  setZonaHoraria: (zona: string) => void;
}

const EspacioContext = createContext<EspacioContextValue>({
  espacioId: null,
  espacioNombre: "",
  zonaHoraria: "America/La_Paz",
  setEspacio: () => {},
  setZonaHoraria: () => {},
});

const STORAGE_KEY = "finpal-espacio-activo";

export function EspacioProvider({ children }: { children: ReactNode }) {
  const [espacioId, setEspacioId] = useState<string | null>(null);
  const [espacioNombre, setEspacioNombre] = useState("");
  const [zonaHoraria, setZonaHorariaState] = useState("America/La_Paz");

  // Rehidratar desde localStorage al montar el componente
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { id, nombre, zonaHoraria: savedZona } = JSON.parse(saved);
        setEspacioId(id);
        setEspacioNombre(nombre);
        if (savedZona) setZonaHorariaState(savedZona);
      }
    } catch {
      // Ignorar errores al parsear
    }
  }, []);

  function setEspacio(id: string, nombre: string, zona?: string) {
    const finalZona = zona || zonaHoraria || "America/La_Paz";
    setEspacioId(id);
    setEspacioNombre(nombre);
    setZonaHorariaState(finalZona);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, nombre, zonaHoraria: finalZona }));
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

  return (
    <EspacioContext.Provider value={{ espacioId, espacioNombre, zonaHoraria, setEspacio, setZonaHoraria }}>
      {children}
    </EspacioContext.Provider>
  );
}

export function useEspacio() {
  return useContext(EspacioContext);
}


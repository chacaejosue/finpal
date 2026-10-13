"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface EspacioContextValue {
  espacioId: string | null;
  espacioNombre: string;
  setEspacio: (id: string, nombre: string) => void;
}

const EspacioContext = createContext<EspacioContextValue>({
  espacioId: null,
  espacioNombre: "",
  setEspacio: () => {},
});

const STORAGE_KEY = "finpal-espacio-activo";

export function EspacioProvider({ children }: { children: ReactNode }) {
  const [espacioId, setEspacioId] = useState<string | null>(null);
  const [espacioNombre, setEspacioNombre] = useState("");

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { id, nombre } = JSON.parse(saved);
        setEspacioId(id);
        setEspacioNombre(nombre);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  function setEspacio(id: string, nombre: string) {
    setEspacioId(id);
    setEspacioNombre(nombre);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, nombre }));
  }

  return (
    <EspacioContext.Provider value={{ espacioId, espacioNombre, setEspacio }}>
      {children}
    </EspacioContext.Provider>
  );
}

export function useEspacio() {
  return useContext(EspacioContext);
}

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { clearSessionAccent } from "@/lib/theme-utils";
import { LegalModal, ScrollTopButton } from "./faq-and-legal";

type LegalModalType = "terminos" | "privacidad" | null;

const LandingLegalContext = createContext<{
  openLegal: (type: "terminos" | "privacidad") => void;
}>({
  openLegal: () => {},
});

export function useLandingLegal() {
  return useContext(LandingLegalContext);
}

export function LandingLegalProvider({ children }: { children: ReactNode }) {
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  useEffect(() => {
    clearSessionAccent();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <LandingLegalContext.Provider value={{ openLegal: setLegalModal }}>
        {children}
        <LegalModal legalModal={legalModal} onClose={() => setLegalModal(null)} />
        <ScrollTopButton />
      </LandingLegalContext.Provider>
    </MotionConfig>
  );
}

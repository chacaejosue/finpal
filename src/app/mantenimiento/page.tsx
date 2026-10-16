import type { Metadata } from "next";
import { PantallaMantenimiento } from "@/components/pantalla-mantenimiento";

export const metadata: Metadata = {
  title: "Mantenimiento programado | FinPal",
  description: "Estamos optimizando FinPal para brindarte una mejor experiencia.",
};

export default function MantenimientoPage() {
  return <PantallaMantenimiento isPreview={true} />;
}

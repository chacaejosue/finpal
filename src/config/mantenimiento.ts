/**
 * Protocolo de Mantenimiento FinPal
 * 
 * Para activar el protocolo de mantenimiento en todo el sistema:
 * Cambia `MODO_MANTENIMIENTO = true;`
 * 
 * Para volver al modo normal de producción:
 * Cambia `MODO_MANTENIMIENTO = false;`
 */
export const MODO_MANTENIMIENTO = false;

export interface MantenimientoConfig {
  titulo: string;
  subtitulo: string;
  badge: string;
  tiempoEstimado: string;
  fases: Array<{
    titulo: string;
    descripcion: string;
    estado: "completado" | "en_progreso" | "pendiente";
  }>;
  contacto: {
    email: string;
    texto: string;
  };
}

export const MANTENIMIENTO_CONFIG: MantenimientoConfig = {
  titulo: "Estamos afinando los detalles",
  subtitulo: "Nos encontramos realizando labores de mantenimiento y actualización en FinPal para ofrecerte una plataforma más ágil, potente y segura.",
  badge: "Protocolo de mantenimiento activo",
  tiempoEstimado: "Pronto estaremos de vuelta",
  fases: [
    {
      titulo: "Respaldo y seguridad",
      descripcion: "Copias de seguridad verificadas y datos protegidos.",
      estado: "completado",
    },
    {
      titulo: "Despliegue de mejoras",
      descripcion: "Optimizaciones de velocidad y nuevas herramientas.",
      estado: "en_progreso",
    },
    {
      titulo: "Calibración final",
      descripcion: "Verificación de balances y sincronización.",
      estado: "pendiente",
    },
  ],
  contacto: {
    email: "soporte@finpal.app",
    texto: "¿Tienes alguna urgencia con tus registros? Escríbenos a",
  },
};

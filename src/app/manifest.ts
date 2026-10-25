import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinPal - Préstamos y Finanzas Personales",
    short_name: "FinPal",
    description:
      "Control inteligente de préstamos, cobros, intereses y finanzas personales con cifrado de grado bancario.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8ff",
    theme_color: "#0c5a45",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}

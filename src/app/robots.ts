import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://finpal-tan.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/iniciar-sesion", "/registrarse"],
        disallow: [
          "/inicio",
          "/contactos",
          "/prestamos",
          "/pagos",
          "/cuentas",
          "/movimientos",
          "/reportes",
          "/configuracion",
          "/espacios",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

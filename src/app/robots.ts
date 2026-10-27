import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://finpal-tan.vercel.app";

  return {
    rules: [
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "Google-Extended",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "CCBot",
          "Bytespider",
          "PerplexityBot",
          "Amazonbot",
          "FacebookBot",
          "Meta-ExternalAgent",
          "Diffbot",
          "Omgilibot",
          "ImagesiftBot",
          "AhrefsBot",
          "SemrushBot",
          "DotBot",
          "MJ12bot",
        ],
        disallow: ["/"],
      },
      {
        userAgent: "*",
        allow: ["/", "/iniciar-sesion", "/registrarse", "/terminos", "/privacidad"],
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

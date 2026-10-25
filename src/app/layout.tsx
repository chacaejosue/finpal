import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EspacioProvider } from "@/lib/espacio-context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "https://finpal-tan.vercel.app";

function getMetadataBase(): URL {
  const urlWithProtocol =
    SITE_URL.startsWith("http://") || SITE_URL.startsWith("https://")
      ? SITE_URL
      : `https://${SITE_URL}`;

  try {
    return new URL(urlWithProtocol);
  } catch {
    return new URL("https://finpal-tan.vercel.app");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "FinPal | Control Inteligente de Préstamos, Cobros y Finanzas Personales",
    template: "%s | FinPal",
  },
  description:
    "Sistema web integral y privado para control de préstamos personales, cobro mensual de intereses, amortizaciones de capital, registro de gastos y balance de cuentas.",
  applicationName: "FinPal",
  authors: [{ name: "Josué Chacae", url: "https://github.com/chacaejosue" }],
  generator: "Next.js",
  keywords: [
    "finpal",
    "control de préstamos",
    "cobro de intereses mensuales",
    "finanzas personales",
    "gestión de deudas",
    "flujo de caja",
    "registro de gastos e ingresos",
    "cuentas de dinero",
    "calculadora de préstamos",
    "amortización de préstamos",
    "control de cobros",
    "finanzas bolivia",
    "préstamos entre amigos",
    "reporte financiero ejecutivo",
    "billeteras digitales",
    "software financiero personal",
  ],
  creator: "FinPal",
  publisher: "FinPal",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_LA",
    url: SITE_URL,
    title: "FinPal | Control Inteligente de Préstamos, Cobros y Finanzas Personales",
    description:
      "Gestiona préstamos personales, cobro mensual de intereses, amortizaciones y cuentas de dinero con total privacidad y reportes ejecutivos.",
    siteName: "FinPal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "FinPal — Control Inteligente de Préstamos y Finanzas Personales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinPal | Control Inteligente de Préstamos y Finanzas",
    description:
      "Gestiona préstamos, cobros, cuentas e intereses con claridad y reportes ejecutivos.",
    images: ["/og-image.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-theme="light"
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
      className="min-h-full w-full max-w-full overflow-x-hidden antialiased bg-surface text-on-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <head>
        <meta name="theme-color" content="#faf8ff" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var d = localStorage.getItem('finpal-dark-mode') || localStorage.getItem('finora-dark-mode');
                var isDark = d === 'true' || (!d && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                  document.documentElement.classList.add('dark');
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (meta) meta.setAttribute('content', '#111827');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                  document.documentElement.classList.remove('dark');
                }

                // Carga ultrarrápida del color de acento de sesión antes de que pinte el DOM
                var pth = window.location.pathname;
                var isPub = pth === '/' || pth.startsWith('/iniciar-sesion') || pth.startsWith('/registro') || pth.startsWith('/recuperar');
                if (!isPub) {
                  var acc = localStorage.getItem('finpal_session_accent');
                  if (acc && acc !== 'verde') {
                    var pals = {
                      azul: { p: "#2563eb", c: "#1d4ed8", d: "#1e40af", dp: "#60a5fa", dc: "#3b82f6" },
                      violeta: { p: "#7c3aed", c: "#6d28d9", d: "#5b21b6", dp: "#a78bfa", dc: "#8b5cf6" },
                      naranja: { p: "#c2410c", c: "#ea580c", d: "#9a3412", dp: "#fb923c", dc: "#f97316" },
                      rosa: { p: "#e11d48", c: "#be123c", d: "#9f1239", dp: "#fb7185", dc: "#f43f5e" }
                    };
                    var item = pals[acc];
                    if (item) {
                      var prim = isDark ? item.dp : item.p;
                      var cont = isDark ? item.dc : item.c;
                      document.documentElement.style.setProperty('--color-primary', prim);
                      document.documentElement.style.setProperty('--color-primary-container', cont);
                      document.documentElement.style.setProperty('--primary', prim);
                      document.documentElement.style.setProperty('--primary-dark', item.d);
                    }
                  }
                }
              } catch(e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "@id": `${SITE_URL}/#webapp`,
                  name: "FinPal",
                  url: SITE_URL,
                  description:
                    "Software integral de gestión financiera personal, control de préstamos personales, cobro de intereses mensuales y cuentas de dinero.",
                  applicationCategory: "FinanceApplication",
                  operatingSystem: "All",
                  inLanguage: "es",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                  author: {
                    "@type": "Person",
                    name: "Josué Chacae",
                    url: "https://github.com/chacaejosue",
                  },
                  featureList: [
                    "Control de préstamos personales con interés mensual",
                    "Registro de abonos a capital y amortizaciones",
                    "Calendario y seguimiento de fechas esperadas de cobro",
                    "Aislamiento por espacios de trabajo con Row Level Security",
                    "Cuentas de dinero para efectivo, bancos y billeteras",
                    "Generación de reportes ejecutivos en PDF",
                  ],
                },
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: "FinPal",
                  url: SITE_URL,
                  logo: `${SITE_URL}/icon.png`,
                  sameAs: ["https://github.com/chacaejosue/finpal"],
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: SITE_URL,
                  name: "FinPal",
                  publisher: {
                    "@id": `${SITE_URL}/#organization`,
                  },
                  inLanguage: "es",
                },
              ],
            }),
          }}
        />
        <style>{`
          html, body, div, main, section, ::-webkit-scrollbar {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          ::-webkit-scrollbar {
            display: none !important;
            width: 0px !important;
            height: 0px !important;
            background: transparent !important;
          }
          ::-webkit-scrollbar-thumb,
          ::-webkit-scrollbar-track {
            display: none !important;
          }
        `}</style>
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen w-full max-w-full overflow-x-hidden bg-surface text-on-surface flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <EspacioProvider>{children}</EspacioProvider>
      </body>
    </html>
  );
}

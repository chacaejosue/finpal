import type { Metadata } from "next";
import "./globals.css";
import { EspacioProvider } from "@/lib/espacio-context";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://finpal.app"),
  title: {
    default: "FinPal | Control Inteligente de Préstamos, Cobros y Finanzas Personales",
    template: "%s | FinPal",
  },
  description:
    "Plataforma moderna y privada para gestionar préstamos personales, cobro de intereses mensuales, amortizaciones, cuentas de dinero y flujo de caja diario.",
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
    "finanzas bolivia",
    "préstamos entre amigos",
    "reporte financiero ejecutivo",
    "billeteras digitales",
    "software financiero personal",
  ],
  creator: "FinPal",
  publisher: "FinPal",
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
    url: "https://finpal.app",
    title: "FinPal | Control Inteligente de Préstamos, Cobros y Finanzas Personales",
    description:
      "Gestiona préstamos personales, cobros mensuales de intereses, cuentas de dinero y reportes financieros ejecutivos con máxima privacidad.",
    siteName: "FinPal",
    images: [
      {
        url: "/finpal-cover.svg",
        width: 1200,
        height: 630,
        alt: "FinPal Portada y Tablero Financiero",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinPal | Control Inteligente de Préstamos y Finanzas",
    description:
      "Gestiona préstamos, cobros, cuentas e intereses con claridad y reportes ejecutivos.",
    images: ["/finpal-cover.svg"],
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
      className="min-h-full antialiased bg-surface text-on-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <head>
        <meta name="theme-color" content="#faf8ff" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var d = localStorage.getItem('finpal-dark-mode') || localStorage.getItem('finora-dark-mode');
                if (d === 'true' || (!d && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
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
              } catch(e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "FinPal",
              url: "https://finpal.app",
              description:
                "Software integral de gestión financiera personal, control de préstamos, cálculo de intereses mensuales y cuentas de dinero.",
              applicationCategory: "FinanceApplication",
              operatingSystem: "All",
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
        className="min-h-screen bg-surface text-on-surface flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <EspacioProvider>{children}</EspacioProvider>
      </body>
    </html>
  );
}

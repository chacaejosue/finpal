import type { Metadata } from "next";
import "./globals.css";
import { EspacioProvider } from "@/lib/espacio-context";

export const metadata: Metadata = {
  title: "FinPal | Control claro de préstamos y cobros",
  description: "Controla préstamos, cobros, intereses y cuentas de dinero con claridad.",
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

import type { Metadata } from "next";
import "./globals.css";
import { EspacioProvider } from "@/lib/espacio-context";

export const metadata: Metadata = {
  title: "FinPal | Control claro de préstamos y cobros",
  description: "Controla préstamos, cobros, intereses y cuentas de dinero con claridad.",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.svg",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <head>
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
      <body className="min-h-full flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <EspacioProvider>{children}</EspacioProvider>
      </body>
    </html>
  );
}

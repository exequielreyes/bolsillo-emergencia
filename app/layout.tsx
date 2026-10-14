import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acceso de Emergencia",
  description: "Guía rápida para resolver imprevistos en la vía pública: llamadas de un toque y envío de ubicación.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Emergencia", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Atkinson+Hyperlegible+Mono:wght@400..700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

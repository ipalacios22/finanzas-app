import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mis Finanzas",
  description: "Calculadora de gastos colaborativa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
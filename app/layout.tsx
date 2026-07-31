import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://adapta-process.vercel.app"),
  title: {
    default: "Cristian Alfonso | Consultoría de procesos",
    template: "%s | Cristian Alfonso",
  },
  description:
    "Consultoría de procesos y herramientas digitales para construir operaciones claras, medibles y sostenibles.",
  keywords: [
    "consultoría de procesos",
    "mejora de procesos",
    "diseño organizacional",
    "Lancelot",
  ],
  openGraph: {
    title: "Cristian Alfonso | Consultoría de procesos",
    description:
      "Procesos claros, medibles y sostenibles, respaldados por herramientas digitales propias.",
    locale: "es_CO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

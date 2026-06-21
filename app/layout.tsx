import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from './components/footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "R&C Rent A Car",
  description: "Libertad para recorrer. Arica, Chile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-900 text-zinc-100 flex flex-col antialiased`}>
        
        {/* Contenedor dinámico que se expande */}
        <div className="flex-grow flex flex-col">
          {children}
        </div>

        {/* Único Footer global para toda la app */}
        <Footer />
        
      </body>
    </html>
  );
}
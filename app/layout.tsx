import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Onde Assisto",
  description: "Descubra quais filmes estão disponíveis nos streamings agora.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="px-4 py-4 sm:px-8">
          <Link href="/" className="text-2xl font-extrabold text-accent">
            Onde Assisto
          </Link>
        </header>
        {children}
        <Footer />
      </body>
    </html>
  );
}

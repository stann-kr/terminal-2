import type { Metadata } from "next";
import { Pacifico, Space_Mono } from "next/font/google";
import "./globals.css";
import "./crt.css";
import CRTWrapper from "@/components/CRTWrapper";
import PageTransition from "@/components/PageTransition";
import ParticleFieldDynamic from "@/components/ParticleFieldDynamic";

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-space-mono',
  preload: true,
});

export const metadata: Metadata = {
  title: "TERMINAL — Underground Techno Platform",
  description: "Access granted. Welcome to the underground.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <body className={`${pacifico.variable} ${spaceMono.variable} bg-[#0c0904] overflow-x-hidden`}>
        <CRTWrapper>
          <ParticleFieldDynamic />
          <PageTransition>
            {children}
          </PageTransition>
        </CRTWrapper>
      </body>
    </html>
  );
}

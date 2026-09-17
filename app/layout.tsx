import type { Metadata } from "next";
import "@/features/terminal/base.css";
import { TerminalFrame } from "@/features/terminal/shell/TerminalFrame";
import { LangProvider } from "@/lib/langContext";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: {
    default: "TERMINAL",
    template: "%s | TERMINAL",
  },
  description:
    "Seoul-based techno platform designing an industrial station where audio signals and data intersect.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <LangProvider detectBrowser>
            <TerminalFrame>{children}</TerminalFrame>
          </LangProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

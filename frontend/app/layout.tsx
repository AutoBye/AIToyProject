import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Code & Log Analyzer",
  description: "Production-ready AI analysis platform for source code and server logs"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

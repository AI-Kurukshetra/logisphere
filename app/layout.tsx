import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "./_components/site-header";
import { SiteFooter } from "./_components/site-footer";
import { ThemeProvider } from "@/src/providers/theme-provider";
import { PwaRegister } from "./_components/pwa-register";

export const metadata: Metadata = {
  title: {
    default: "Logisphere",
    template: "%s | Logisphere",
  },
  description:
    "Freight intelligence platform for teams managing carrier operations, invoice audits, shipment visibility, and freight planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased transition-colors">
        <ThemeProvider>
          <PwaRegister />
          <SiteHeader />
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}

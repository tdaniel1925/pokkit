import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokkit - Private World Simulation",
  description: "A sovereign world simulation platform with autonomous AI citizens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-neutral-950">
        {children}
      </body>
    </html>
  );
}

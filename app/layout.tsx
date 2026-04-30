import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artifact Gallery",
  description: "Neo-Industrial design ledger for curated artifacts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[color:var(--background)] text-[color:var(--foreground)]">
        {children}
      </body>
    </html>
  );
}

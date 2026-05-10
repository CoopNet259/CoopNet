import type { Metadata } from "next";
import "./globals.css";
import "./dashboard/shared-modern.css";

export const metadata: Metadata = {
  title: "CoopFlow AI",
  description: "Kooperatifler için yapay zeka destekli iş akışı ve görev yönetimi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

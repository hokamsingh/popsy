import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Popsy — no-code popup builder",
  description: "Compose any popup from generic primitives.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

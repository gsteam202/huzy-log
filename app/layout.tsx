import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Huzy Log",
  description: "PM2 project log collector and agent hook"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

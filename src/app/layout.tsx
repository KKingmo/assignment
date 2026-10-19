import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "./providers";
import { getSiteSeo } from "@/lib/seo/site";
import "./globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteSeo().origin),
  title: "Hidden Kice | 교재 스토어",
  description: "Hidden Kice 교재 스토어",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}

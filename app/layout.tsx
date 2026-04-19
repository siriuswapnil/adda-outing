import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Nav from "./Nav";
import PostHogProvider from "./PostHogProvider";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hangout Wrapped — Bangalore",
  description: "Your friend group's month, wrapped.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <PostHogProvider />
        </Suspense>
        <Nav />
        {children}
      </body>
    </html>
  );
}

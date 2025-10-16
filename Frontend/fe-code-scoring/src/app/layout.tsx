import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConfirmProvider } from "@/components/Confirm";
import { AlertProvider } from "@/components/Alert";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RubricScore – Code Scoring for Teachers",
  description: "Wizard to define questions and rubrics, upload code, and generate clear feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConfirmProvider>
          <AlertProvider>
            {children}
          </AlertProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}

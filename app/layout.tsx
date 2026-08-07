import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Eyebrow/label typeface — used for the section kickers on /producten. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kastenfabriek",
  description: "Custom furniture solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plexMono.variable} ${poppins.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <TooltipProvider delayDuration={400}>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

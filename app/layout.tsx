import type { Metadata, Viewport } from "next";
import { Italiana } from "next/font/google";
import "./globals.css";

const italiana = Italiana({
  weight: "400",
  variable: "--font-italiana",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Phantom — a 3D web concept",
  description:
    "Unofficial Devialet Phantom concept. Modelled in Blender, built with React Three Fiber.",
};

// viewport-fit=cover so the void bleeds under the notch / home indicator; the UI
// chrome reclaims its space with env(safe-area-inset-*). Black theme colour keeps
// the mobile browser chrome matched to the canvas.
export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${italiana.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-void text-white">
        {children}
      </body>
    </html>
  );
}

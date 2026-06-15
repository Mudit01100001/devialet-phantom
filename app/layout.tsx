import type { Metadata, Viewport } from "next";
import { Italiana } from "next/font/google";
import "./globals.css";

const italiana = Italiana({
  weight: "400",
  variable: "--font-italiana",
  subsets: ["latin"],
});

// metadataBase makes the auto-generated OG/Twitter image URLs absolute (required
// for link previews to resolve). Vercel injects the production domain at build;
// fall back to localhost in dev.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const description =
  "Unofficial Devialet Phantom concept. Modelled in Blender, built with React Three Fiber.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PHANTOM",
  description,
  // og:image / twitter:image are generated automatically from app/opengraph-image.png
  // and app/twitter-image.png (Next.js file conventions) — no need to list them here.
  openGraph: {
    title: "PHANTOM — a 3D web concept",
    description,
    siteName: "PHANTOM",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PHANTOM — a 3D web concept",
    description,
  },
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

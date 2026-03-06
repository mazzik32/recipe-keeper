import type { Metadata } from "next";
import { Inter, Playfair_Display, Dancing_Script } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
});

export const metadata: Metadata = {
  title: "Recipe Keeper - Preserve Family Recipes",
  description:
    "Digitalize and preserve your family recipes. Scan handwritten recipes, organize by category, and create beautiful recipe books.",
  keywords: [
    "recipe keeper",
    "family recipes",
    "digital cookbook",
    "recipe scanning",
    "AI supported",
    "scan from notes",
    "organize recipes",
  ],
  openGraph: {
    title: "Recipe Keeper - Preserve Family Recipes",
    description: "Digitalize and preserve your family recipes. Scan handwritten recipes, organize by category, and create beautiful recipe books.",
    url: "https://recipekeeper.org",
    siteName: "Recipe Keeper",
    images: [
      {
        url: "/assets/desktop-app-preview.jpg", // A great fallback image for social shares
        width: 1200,
        height: 630,
        alt: "Recipe Keeper Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recipe Keeper - Preserve Family Recipes",
    description: "Digitalize and preserve your family recipes. Scan handwritten recipes, organize by category, and create beautiful recipe books.",
    images: ["/assets/desktop-app-preview.jpg"],
  },
  icons: {
    icon: "/assets/RecipeKeeperLogo.png",
    apple: "/assets/RecipeKeeperLogo.png", // Good practice for iOS homescreen saves
  },
  metadataBase: new URL("https://recipekeeper.org"), // Fixes relative paths for OG images
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} ${dancing.variable} font-sans`}
      >
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}

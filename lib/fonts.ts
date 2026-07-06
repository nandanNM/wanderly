import { Archivo_Black, Space_Grotesk, Caveat } from "next/font/google";
import localFont from "next/font/local";

// All app fonts live here so layout (and anywhere else) can pull them from one
// place. Each exposes a CSS variable that globals.css maps onto Tailwind tokens.
// Local font files live in ./fonts.

/** Headings — RetroUI's bold neobrutalist display face. */
export const fontHead = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

/** Body / UI text. */
export const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Wanderly wordmark — the hand-drawn script kept from the original brand. */
export const fontLogo = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});

/** Geist Pixel (Square) — retro pixel accent for numbers/eyebrows (SIL OFL). */
export const fontPixel = localFont({
  src: "./fonts/GeistPixel-Square.woff2",
  variable: "--font-pixel",
  weight: "500",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

/** All font CSS-variable classes, ready to drop on <html>. */
export const fontVariables = `${fontHead.variable} ${fontSans.variable} ${fontLogo.variable} ${fontPixel.variable}`;

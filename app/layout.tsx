import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Wanderly — See the world, live the story",
  description:
    "Plan trips, invite your people, and collect every photo and video from the journey in one place you own.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

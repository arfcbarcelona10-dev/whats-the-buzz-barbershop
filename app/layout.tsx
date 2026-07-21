import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "Barber on the Mountain | Welches, Oregon Barbershop",
    description:
      "Precision haircuts, fades, kids' cuts, beard trims, and hot towel shaves in Welches, Oregon. Walk-ins and appointments welcome.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Barber on the Mountain",
      description: "Mountain town cuts. City-level finish. Walk-ins welcome in Welches, Oregon.",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: new URL("/og.png", origin).toString(),
          width: 1200,
          height: 630,
          alt: "Barber on the Mountain in Welches, Oregon",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Barber on the Mountain",
      description: "Classic craft. Modern finish. Right here on the mountain.",
      images: [new URL("/og.png", origin).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

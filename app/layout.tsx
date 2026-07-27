import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import "./booking.css";
import "./globals.css";
import "./alpine-app.css";

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
    title: "What's The Buzz? | Schofield, Wisconsin Barber Shop",
    description:
      "Friendly, consistent haircuts, fades, kids' cuts, beard trims, and hot towel service in Schofield, Wisconsin. Walk-ins and appointments welcome.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "What's The Buzz?",
      description: "Great cuts, friendly service, and fair prices in Schofield, Wisconsin.",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: new URL("/hero-barber.jpg", origin).toString(),
          width: 1200,
          height: 630,
          alt: "What's The Buzz? barber shop in Schofield, Wisconsin",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "What's The Buzz?",
      description: "Friendly service. Consistent craft. A cut above.",
      images: [new URL("/hero-barber.jpg", origin).toString()],
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

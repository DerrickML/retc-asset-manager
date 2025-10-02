import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import LayoutProvider from "../components/layout/layout-provider";
import QueryProvider from "../lib/providers/query-provider";
import "./globals.css";

export const metadata = {
  title: "RETC Asset Management",
  description: "Renewable Energy Training Center Asset Management System",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: "https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  },
  manifest: {
    name: "RETC Asset Management",
    short_name: "RETC Assets",
    description: "Renewable Energy Training Center Asset Management System",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
        />
        <link
          rel="shortcut icon"
          href="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
        />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <QueryProvider>
          <LayoutProvider>{children}</LayoutProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

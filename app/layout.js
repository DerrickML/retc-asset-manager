import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import LayoutProvider from "../components/layout/layout-provider";
import QueryProvider from "../lib/providers/query-provider";
import ErrorBoundary from "../components/error-boundary";
import { ToastProvider } from "../components/providers/toast-provider";
import { OrgThemeProvider } from "../components/providers/org-theme-provider";
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Handle chunk load errors
            window.addEventListener('error', function(e) {
              if (e.message && e.message.includes('Loading chunk')) {
                // Reload page for chunk load errors
                window.location.reload();
              }
            });
            
            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', function(e) {
              if (e.reason && e.reason.message && e.reason.message.includes('Loading chunk')) {
                // Reload page for chunk load errors
                window.location.reload();
              }
            });
          `,
          }}
        />
      </head>
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <ToastProvider>
              <OrgThemeProvider>
                <LayoutProvider>{children}</LayoutProvider>
              </OrgThemeProvider>
            </ToastProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

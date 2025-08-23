import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import LayoutProvider from "../components/layout/layout-provider"
import "./globals.css"

export const metadata = {
  title: "RETC Asset Management",
  description: "Renewable Energy Training Center Asset Management System",
  generator: "v0.app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <LayoutProvider>
          {children}
        </LayoutProvider>
      </body>
    </html>
  )
}
import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { GlobalHeader } from "@/components/global-header"
import { SemesterProvider } from "@/contexts/semester-context"
import { DemoModeProvider } from "@/contexts/demo-mode-context"
import { ViewAsProvider } from "@/contexts/view-as-context"
import { ViewAsBanner } from "@/components/view-as-banner"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "SHIN Dashboard",
  description: "SEED SHIN Dashboard for tracking student hours and client engagements",
  generator: "v0.app",
  icons: {
    icon: "/images/shin.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`}>
      <body className={`font-sans antialiased`}>
        <DemoModeProvider>
          <SemesterProvider>
            <ViewAsProvider>
              <GlobalHeader />
              <ViewAsBanner />
              {children}
            </ViewAsProvider>
          </SemesterProvider>
        </DemoModeProvider>
      </body>
    </html>
  )
}

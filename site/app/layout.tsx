import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, IBM_Plex_Sans } from 'next/font/google'
import { Courier_Prime } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"] });
const _ibmPlexSans = IBM_Plex_Sans({ weight: ["300", "400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Dronagiri (Gandhamadana) — Enterprise Hospital Operating System',
  description: 'Next-generation hospital management and clinical operating system powered by Dhanvantari, Ashwini Kumaras, and Sushruta protocols for real-time patient 360, surgical suites, and multi-facility intelligence.',
  keywords: ['Dronagiri', 'Gandhamadana', 'Hospital Management System', 'EMR', 'Patient 360', 'Clinical OS', 'Sushruta Surgery', 'Dhanvantari Health'],
  authors: [{ name: 'Dronagiri Health' }],
  openGraph: {
    title: 'Dronagiri (Gandhamadana) — Enterprise Hospital Operating System',
    description: 'Next-generation clinical operating system for real-time patient 360, surgical suites, and multi-facility intelligence.',
    type: 'website',
    url: 'https://dronagiri.health',
    siteName: 'Dronagiri (Gandhamadana)',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dronagiri (Gandhamadana) — Enterprise Hospital Operating System',
    description: 'Next-generation clinical operating system for real-time patient 360, surgical suites, and multi-facility intelligence.',
  },
  icons: {
    icon: [
      {
        url: '/icon-dark-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon-dark-32x32.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

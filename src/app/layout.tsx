import type { Metadata } from 'next'
import { Space_Grotesk, Geist_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Rig Base',
  description: 'Your personalized business management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono, Playfair, Playfair_Display } from 'next/font/google'
import { Providers } from '@/components/providers'
import { LOGO_MARK_SRC } from '@/lib/brand'
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const playfairStats = Playfair({
  variable: '--font-playfair-stats',
  subsets: ['latin'],
  axes: ['opsz'],
})

export const metadata: Metadata = {
  title: 'Rig Base',
  description: 'Your personalized business management platform',
  icons: {
    icon: [{ url: LOGO_MARK_SRC, type: 'image/png' }],
    apple: [{ url: LOGO_MARK_SRC, type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${playfair.variable} ${playfairStats.variable} dark`}>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

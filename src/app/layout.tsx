import type { Metadata } from 'next'
import { Lora, Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lora',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FindAHomeCare · Provider Portal',
  description:
    'Secure provider portal for Find A Home Care partner agencies — manage referrals, revenue, and your agency profile.',
  icons: {
    icon: '/logos/FavIcon-Find-A-HomeCare-e1765429165523-260x257.webp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

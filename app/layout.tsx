
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { AuthProvider } from '@/components/auth/auth-context'
import ChatbotScript from '@/components/ChatbotScript'

export const metadata: Metadata = {
  title: 'E-Waste Management',
  description: 'Created with v0',
  generator: 'v0.dev',
  icons: {
    icon: '/recycling.png',
    shortcut: '/recycling.png',
    apple: '/recycling.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
        <AuthProvider>
          {children}
          <ChatbotScript />
        </AuthProvider>
      </body>
    </html>
  )
}

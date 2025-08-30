import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { RealtimeProvider } from '@/contexts/realtime-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lead Management Dashboard',
  description: 'Comprehensive lead management and analytics dashboard',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RealtimeProvider>
          <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </RealtimeProvider>
      </body>
    </html>
  )
}
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { plusJakarta } from './fonts'

export const metadata: Metadata = {
  title: 'Naano | Connecter SaaS et Créateurs',
  description: 'La plateforme de mise en relation ultime pour les campagnes de marketing SaaS.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={plusJakarta.variable}>
      <body className="bg-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}


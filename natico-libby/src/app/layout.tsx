import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NATICO — Libby Live',
  description: 'Your intelligent legal and document workspace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

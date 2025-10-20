import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Interstellar Particle Simulation',
  description: 'Research-grade simulation of interstellar particles hitting our solar system',
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

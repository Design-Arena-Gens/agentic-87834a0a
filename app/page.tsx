'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import styles from './page.module.css'

const SimulationScene = dynamic(() => import('./components/SimulationScene'), {
  ssr: false,
  loading: () => <div className={styles.loading}>Loading simulation...</div>
})

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1>Interstellar Particle Simulation</h1>
        <p>Research-grade simulation of interstellar medium particles interacting with our solar system</p>
      </div>
      <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
        <SimulationScene />
      </Suspense>
    </main>
  )
}

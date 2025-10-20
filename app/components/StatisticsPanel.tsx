'use client'

import { useEffect, useState, useRef } from 'react'
import { ParticleSystem } from '../lib/ParticleSystem'
import { SolarSystem } from '../lib/SolarSystem'
import styles from './StatisticsPanel.module.css'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface StatisticsPanelProps {
  particleSystem: ParticleSystem
  solarSystem: SolarSystem
  playing: boolean
}

export default function StatisticsPanel({ particleSystem, solarSystem, playing }: StatisticsPanelProps) {
  const [stats, setStats] = useState({
    totalParticles: 0,
    activeParticles: 0,
    deflectedParticles: 0,
    capturedParticles: 0,
    averageVelocity: 0,
    energyDistribution: { low: 0, medium: 0, high: 0 },
    particleTypes: { hydrogen: 0, helium: 0, ions: 0, dust: 0 }
  })

  const [velocityHistory, setVelocityHistory] = useState<number[]>([])
  const [deflectionHistory, setDeflectionHistory] = useState<number[]>([])
  const [timeLabels, setTimeLabels] = useState<string[]>([])
  const frameCount = useRef(0)

  useEffect(() => {
    if (!playing) return

    const interval = setInterval(() => {
      const newStats = particleSystem.getStatistics()
      setStats(newStats)

      frameCount.current += 1

      if (frameCount.current % 10 === 0) {
        setVelocityHistory(prev => {
          const updated = [...prev, newStats.averageVelocity]
          return updated.slice(-30)
        })

        setDeflectionHistory(prev => {
          const updated = [...prev, newStats.deflectedParticles]
          return updated.slice(-30)
        })

        setTimeLabels(prev => {
          const updated = [...prev, `${Math.floor(frameCount.current / 10)}s`]
          return updated.slice(-30)
        })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [particleSystem, playing])

  const velocityChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Avg Velocity (km/s)',
        data: velocityHistory,
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const deflectionChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Deflected Particles',
        data: deflectionHistory,
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ccc',
        },
      },
    },
  }

  return (
    <div className={styles.panel}>
      <h3>Real-time Statistics</h3>

      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Total Particles</div>
          <div className={styles.statValue}>{stats.totalParticles.toLocaleString()}</div>
        </div>

        <div className={styles.statBox}>
          <div className={styles.statLabel}>Active</div>
          <div className={styles.statValue}>{stats.activeParticles.toLocaleString()}</div>
        </div>

        <div className={styles.statBox}>
          <div className={styles.statLabel}>Deflected</div>
          <div className={styles.statValue}>{stats.deflectedParticles.toLocaleString()}</div>
        </div>

        <div className={styles.statBox}>
          <div className={styles.statLabel}>Captured</div>
          <div className={styles.statValue}>{stats.capturedParticles.toLocaleString()}</div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Particle Composition</h4>
        <div className={styles.composition}>
          <div className={styles.compItem}>
            <span className={styles.compLabel}>H</span>
            <div className={styles.compBar}>
              <div
                className={styles.compFill}
                style={{
                  width: `${(stats.particleTypes.hydrogen / stats.totalParticles) * 100}%`,
                  background: '#667eea'
                }}
              />
            </div>
            <span className={styles.compValue}>{stats.particleTypes.hydrogen}</span>
          </div>

          <div className={styles.compItem}>
            <span className={styles.compLabel}>He</span>
            <div className={styles.compBar}>
              <div
                className={styles.compFill}
                style={{
                  width: `${(stats.particleTypes.helium / stats.totalParticles) * 100}%`,
                  background: '#ec4899'
                }}
              />
            </div>
            <span className={styles.compValue}>{stats.particleTypes.helium}</span>
          </div>

          <div className={styles.compItem}>
            <span className={styles.compLabel}>Ions</span>
            <div className={styles.compBar}>
              <div
                className={styles.compFill}
                style={{
                  width: `${(stats.particleTypes.ions / stats.totalParticles) * 100}%`,
                  background: '#10b981'
                }}
              />
            </div>
            <span className={styles.compValue}>{stats.particleTypes.ions}</span>
          </div>

          <div className={styles.compItem}>
            <span className={styles.compLabel}>Dust</span>
            <div className={styles.compBar}>
              <div
                className={styles.compFill}
                style={{
                  width: `${(stats.particleTypes.dust / stats.totalParticles) * 100}%`,
                  background: '#f59e0b'
                }}
              />
            </div>
            <span className={styles.compValue}>{stats.particleTypes.dust}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Average Velocity</h4>
        <div className={styles.chartContainer}>
          <Line data={velocityChartData} options={chartOptions} />
        </div>
      </div>

      <div className={styles.section}>
        <h4>Deflection Rate</h4>
        <div className={styles.chartContainer}>
          <Line data={deflectionChartData} options={chartOptions} />
        </div>
      </div>

      <div className={styles.section}>
        <h4>Energy Distribution</h4>
        <div className={styles.energyDist}>
          <div className={styles.energyItem}>
            <span>Low (&lt;100 keV)</span>
            <span className={styles.energyValue}>{stats.energyDistribution.low}</span>
          </div>
          <div className={styles.energyItem}>
            <span>Med (100-1000 keV)</span>
            <span className={styles.energyValue}>{stats.energyDistribution.medium}</span>
          </div>
          <div className={styles.energyItem}>
            <span>High (&gt;1000 keV)</span>
            <span className={styles.energyValue}>{stats.energyDistribution.high}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import styles from './SimulationScene.module.css'
import { ParticleSystem } from '../lib/ParticleSystem'
import { SolarSystem } from '../lib/SolarSystem'
import StatisticsPanel from './StatisticsPanel'

function Particles({ particleSystem, playing }: { particleSystem: ParticleSystem, playing: boolean }) {
  const meshRef = useRef<THREE.Points>(null)
  const [positions, setPositions] = useState<Float32Array>(new Float32Array())
  const [colors, setColors] = useState<Float32Array>(new Float32Array())

  useEffect(() => {
    const pos = particleSystem.getPositions()
    const col = particleSystem.getColors()
    setPositions(pos)
    setColors(col)
  }, [particleSystem])

  useFrame((state, delta) => {
    if (!playing) return

    particleSystem.update(delta)

    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position
      const colors = meshRef.current.geometry.attributes.color

      const newPos = particleSystem.getPositions()
      const newCol = particleSystem.getColors()

      for (let i = 0; i < newPos.length; i++) {
        positions.array[i] = newPos[i]
        colors.array[i] = newCol[i]
      }

      positions.needsUpdate = true
      colors.needsUpdate = true
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function Planets({ solarSystem }: { solarSystem: SolarSystem }) {
  return (
    <>
      {/* Sun */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2} distance={100} color="#FDB813" />

      {/* Mercury */}
      <mesh position={[5.8, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#8C7853" />
      </mesh>

      {/* Venus */}
      <mesh position={[10.8, 0, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#FFC649" />
      </mesh>

      {/* Earth */}
      <mesh position={[15, 0, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>

      {/* Mars */}
      <mesh position={[22.8, 0, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#CD5C5C" />
      </mesh>

      {/* Jupiter */}
      <mesh position={[77.8, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#C88B3A" />
      </mesh>

      {/* Saturn */}
      <mesh position={[143, 0, 0]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color="#FAD5A5" />
      </mesh>

      {/* Uranus */}
      <mesh position={[287, 0, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#4FD0E7" />
      </mesh>

      {/* Neptune */}
      <mesh position={[450, 0, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#4166F5" />
      </mesh>

      {/* Heliopause boundary */}
      <mesh>
        <sphereGeometry args={[500, 64, 64]} />
        <meshBasicMaterial
          color="#667eea"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          wireframe
        />
      </mesh>
    </>
  )
}

function Scene({ particleSystem, solarSystem, playing }: {
  particleSystem: ParticleSystem,
  solarSystem: SolarSystem,
  playing: boolean
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <Planets solarSystem={solarSystem} />
      <Particles particleSystem={particleSystem} playing={playing} />
      <Stars radius={1000} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={1000}
        minDistance={10}
      />
    </>
  )
}

export default function SimulationScene() {
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [particleCount, setParticleCount] = useState(5000)
  const [showStats, setShowStats] = useState(true)

  const particleSystem = useMemo(() => new ParticleSystem(particleCount), [particleCount])
  const solarSystem = useMemo(() => new SolarSystem(), [])

  useEffect(() => {
    particleSystem.setTimeScale(speed)
  }, [speed, particleSystem])

  const handleReset = () => {
    particleSystem.reset()
  }

  const handleParticleCountChange = (count: number) => {
    setParticleCount(count)
  }

  return (
    <div className={styles.container}>
      <div className={styles.canvas}>
        <Canvas camera={{ position: [50, 50, 50], fov: 60 }}>
          <Scene
            particleSystem={particleSystem}
            solarSystem={solarSystem}
            playing={playing}
          />
        </Canvas>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <button
            className={styles.button}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            className={styles.button}
            onClick={handleReset}
          >
            🔄 Reset
          </button>
          <button
            className={styles.button}
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? '📊 Hide Stats' : '📊 Show Stats'}
          </button>
        </div>

        <div className={styles.controlGroup}>
          <label>
            Speed: {speed.toFixed(1)}x
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className={styles.slider}
            />
          </label>
        </div>

        <div className={styles.controlGroup}>
          <label>
            Particles: {particleCount}
            <input
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={particleCount}
              onChange={(e) => handleParticleCountChange(parseInt(e.target.value))}
              className={styles.slider}
            />
          </label>
        </div>
      </div>

      {showStats && (
        <StatisticsPanel
          particleSystem={particleSystem}
          solarSystem={solarSystem}
          playing={playing}
        />
      )}

      <div className={styles.info}>
        <h3>Simulation Info</h3>
        <p><strong>Model:</strong> Interstellar medium particles entering heliosphere</p>
        <p><strong>Particle Types:</strong> Hydrogen, Helium, Heavier ions, Dust grains</p>
        <p><strong>Forces:</strong> Solar wind pressure, Magnetic deflection, Gravity</p>
        <p><strong>Scale:</strong> 1 unit ≈ 10 AU (1.5 billion km)</p>
      </div>
    </div>
  )
}

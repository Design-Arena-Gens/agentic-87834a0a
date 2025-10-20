import * as THREE from 'three'

export enum ParticleType {
  HYDROGEN = 0,
  HELIUM = 1,
  HEAVY_ION = 2,
  DUST = 3,
}

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  mass: number
  charge: number
  type: ParticleType
  active: boolean
  deflected: boolean
  age: number
  energy: number
}

export class ParticleSystem {
  private particles: Particle[] = []
  private maxParticles: number
  private timeScale: number = 1
  private sunPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  private heliopauseRadius: number = 500 // AU (scaled)

  // Physical constants (scaled for simulation)
  private readonly G = 0.001 // Gravitational constant (scaled)
  private readonly solarWindStrength = 0.5
  private readonly magneticFieldStrength = 0.3

  // Statistics
  private stats = {
    totalParticles: 0,
    activeParticles: 0,
    deflectedParticles: 0,
    capturedParticles: 0,
    averageVelocity: 0,
    energyDistribution: { low: 0, medium: 0, high: 0 },
    particleTypes: { hydrogen: 0, helium: 0, ions: 0, dust: 0 }
  }

  constructor(maxParticles: number = 5000) {
    this.maxParticles = maxParticles
    this.initializeParticles()
  }

  private initializeParticles(): void {
    this.particles = []

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle())
    }

    this.updateStatistics()
  }

  private createParticle(): Particle {
    // Determine particle type based on interstellar medium composition
    // H: 90%, He: 9%, Heavy ions: 0.8%, Dust: 0.2%
    const rand = Math.random()
    let type: ParticleType
    let mass: number
    let charge: number

    if (rand < 0.90) {
      type = ParticleType.HYDROGEN
      mass = 1.0
      charge = 1.0
    } else if (rand < 0.99) {
      type = ParticleType.HELIUM
      mass = 4.0
      charge = 2.0
    } else if (rand < 0.998) {
      type = ParticleType.HEAVY_ION
      mass = 12.0 + Math.random() * 40
      charge = 3.0 + Math.random() * 10
    } else {
      type = ParticleType.DUST
      mass = 1000.0 + Math.random() * 10000
      charge = 0
    }

    // Spawn particles at the heliopause boundary
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const r = this.heliopauseRadius * (0.95 + Math.random() * 0.1)

    const position = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    )

    // Interstellar medium velocity: ~26 km/s relative to Sun (Local Interstellar Cloud)
    // Direction: approximately toward constellation Ophiuchus
    const baseVelocity = new THREE.Vector3(0.3, -0.1, -0.4).normalize()
    const velocityMagnitude = 2.0 + Math.random() * 1.0 // Scaled velocity

    // Add some velocity dispersion (thermal motion)
    const thermalVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    )

    const velocity = baseVelocity.multiplyScalar(velocityMagnitude).add(thermalVelocity)

    // Calculate kinetic energy (in keV, scaled)
    const energy = 0.5 * mass * velocity.lengthSq() * 100

    return {
      position,
      velocity,
      mass,
      charge,
      type,
      active: true,
      deflected: false,
      age: 0,
      energy
    }
  }

  update(deltaTime: number): void {
    const dt = deltaTime * this.timeScale

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]

      if (!particle.active) {
        // Respawn particle
        Object.assign(particle, this.createParticle())
        continue
      }

      particle.age += dt

      // Calculate forces
      const force = new THREE.Vector3(0, 0, 0)

      // 1. Solar gravity
      const toSun = new THREE.Vector3().subVectors(this.sunPosition, particle.position)
      const distanceToSun = toSun.length()

      if (distanceToSun > 0) {
        const gravityMagnitude = (this.G * 1000 * particle.mass) / (distanceToSun * distanceToSun)
        const gravityForce = toSun.normalize().multiplyScalar(gravityMagnitude)
        force.add(gravityForce)
      }

      // 2. Solar wind pressure (radiation pressure)
      if (distanceToSun > 0 && distanceToSun < this.heliopauseRadius) {
        const solarWindMagnitude = this.solarWindStrength / (distanceToSun * distanceToSun + 1)
        const solarWindForce = particle.position.clone().normalize().multiplyScalar(solarWindMagnitude)
        force.add(solarWindForce)
      }

      // 3. Magnetic deflection (Lorentz force)
      // Simplified heliospheric magnetic field (Parker spiral approximation)
      if (particle.charge !== 0 && distanceToSun < this.heliopauseRadius) {
        const magneticField = this.calculateMagneticField(particle.position)
        const lorentzForce = new THREE.Vector3().crossVectors(particle.velocity, magneticField)
        lorentzForce.multiplyScalar(particle.charge * this.magneticFieldStrength / particle.mass)
        force.add(lorentzForce)

        if (lorentzForce.length() > 0.1) {
          particle.deflected = true
        }
      }

      // Apply acceleration
      const acceleration = force.divideScalar(particle.mass)
      particle.velocity.add(acceleration.multiplyScalar(dt))

      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(dt))

      // Check boundaries
      if (particle.position.length() < 2) {
        // Particle captured by Sun
        particle.active = false
      } else if (particle.position.length() > this.heliopauseRadius * 1.2) {
        // Particle exited simulation
        particle.active = false
      } else if (particle.age > 100) {
        // Particle too old
        particle.active = false
      }

      // Check planetary collisions (simplified)
      if (this.checkPlanetaryCollision(particle.position)) {
        particle.active = false
      }
    }

    this.updateStatistics()
  }

  private calculateMagneticField(position: THREE.Vector3): THREE.Vector3 {
    // Simplified Parker spiral magnetic field
    const r = position.length()
    const theta = Math.atan2(position.z, Math.sqrt(position.x * position.x + position.y * position.y))
    const phi = Math.atan2(position.y, position.x)

    // Radial and azimuthal components
    const Br = 0.1 / (r * r + 1)
    const Bphi = -0.05 * Math.sin(theta) / (r + 1)

    // Convert to Cartesian coordinates
    const sinPhi = Math.sin(phi)
    const cosPhi = Math.cos(phi)
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)

    return new THREE.Vector3(
      Br * sinTheta * cosPhi - Bphi * sinPhi,
      Br * sinTheta * sinPhi + Bphi * cosPhi,
      Br * cosTheta
    )
  }

  private checkPlanetaryCollision(position: THREE.Vector3): boolean {
    // Simplified planetary collision detection
    const planetPositions = [
      { pos: new THREE.Vector3(5.8, 0, 0), radius: 0.5 },   // Mercury
      { pos: new THREE.Vector3(10.8, 0, 0), radius: 0.8 },  // Venus
      { pos: new THREE.Vector3(15, 0, 0), radius: 0.8 },    // Earth
      { pos: new THREE.Vector3(22.8, 0, 0), radius: 0.6 },  // Mars
      { pos: new THREE.Vector3(77.8, 0, 0), radius: 2.0 },  // Jupiter
      { pos: new THREE.Vector3(143, 0, 0), radius: 1.5 },   // Saturn
      { pos: new THREE.Vector3(287, 0, 0), radius: 1.0 },   // Uranus
      { pos: new THREE.Vector3(450, 0, 0), radius: 1.0 },   // Neptune
    ]

    for (const planet of planetPositions) {
      if (position.distanceTo(planet.pos) < planet.radius) {
        return true
      }
    }

    return false
  }

  private updateStatistics(): void {
    let activeCount = 0
    let deflectedCount = 0
    let capturedCount = 0
    let totalVelocity = 0
    const types = { hydrogen: 0, helium: 0, ions: 0, dust: 0 }
    const energy = { low: 0, medium: 0, high: 0 }

    for (const particle of this.particles) {
      if (particle.active) {
        activeCount++
        totalVelocity += particle.velocity.length()

        if (particle.deflected) deflectedCount++

        // Count by type
        switch (particle.type) {
          case ParticleType.HYDROGEN:
            types.hydrogen++
            break
          case ParticleType.HELIUM:
            types.helium++
            break
          case ParticleType.HEAVY_ION:
            types.ions++
            break
          case ParticleType.DUST:
            types.dust++
            break
        }

        // Energy distribution
        if (particle.energy < 100) {
          energy.low++
        } else if (particle.energy < 1000) {
          energy.medium++
        } else {
          energy.high++
        }
      } else {
        capturedCount++
      }
    }

    this.stats = {
      totalParticles: this.particles.length,
      activeParticles: activeCount,
      deflectedParticles: deflectedCount,
      capturedParticles: capturedCount,
      averageVelocity: activeCount > 0 ? totalVelocity / activeCount : 0,
      energyDistribution: energy,
      particleTypes: types
    }
  }

  getPositions(): Float32Array {
    const positions = new Float32Array(this.particles.length * 3)

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]
      positions[i * 3] = particle.position.x
      positions[i * 3 + 1] = particle.position.y
      positions[i * 3 + 2] = particle.position.z
    }

    return positions
  }

  getColors(): Float32Array {
    const colors = new Float32Array(this.particles.length * 3)

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]
      let r = 1, g = 1, b = 1

      if (!particle.active) {
        r = g = b = 0
      } else {
        switch (particle.type) {
          case ParticleType.HYDROGEN:
            r = 0.4; g = 0.5; b = 0.9 // Blue
            break
          case ParticleType.HELIUM:
            r = 0.9; g = 0.3; b = 0.6 // Pink
            break
          case ParticleType.HEAVY_ION:
            r = 0.1; g = 0.9; b = 0.5 // Green
            break
          case ParticleType.DUST:
            r = 1.0; g = 0.6; b = 0.1 // Orange
            break
        }

        // Dim deflected particles slightly
        if (particle.deflected) {
          r *= 1.2
          g *= 1.2
          b *= 1.2
        }
      }

      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }

    return colors
  }

  getStatistics() {
    return { ...this.stats }
  }

  setTimeScale(scale: number): void {
    this.timeScale = scale
  }

  reset(): void {
    this.initializeParticles()
  }
}

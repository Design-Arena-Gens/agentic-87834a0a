import * as THREE from 'three'

interface Planet {
  name: string
  position: THREE.Vector3
  radius: number
  mass: number
  color: string
}

export class SolarSystem {
  private planets: Planet[] = []
  private sunMass: number = 1000

  constructor() {
    this.initializePlanets()
  }

  private initializePlanets(): void {
    // Distances are in scaled AU (1 unit ≈ 10 AU)
    // Masses are relative to Earth
    this.planets = [
      {
        name: 'Mercury',
        position: new THREE.Vector3(5.8, 0, 0),
        radius: 0.3,
        mass: 0.055,
        color: '#8C7853'
      },
      {
        name: 'Venus',
        position: new THREE.Vector3(10.8, 0, 0),
        radius: 0.6,
        mass: 0.815,
        color: '#FFC649'
      },
      {
        name: 'Earth',
        position: new THREE.Vector3(15, 0, 0),
        radius: 0.6,
        mass: 1.0,
        color: '#4A90E2'
      },
      {
        name: 'Mars',
        position: new THREE.Vector3(22.8, 0, 0),
        radius: 0.4,
        mass: 0.107,
        color: '#CD5C5C'
      },
      {
        name: 'Jupiter',
        position: new THREE.Vector3(77.8, 0, 0),
        radius: 1.5,
        mass: 317.8,
        color: '#C88B3A'
      },
      {
        name: 'Saturn',
        position: new THREE.Vector3(143, 0, 0),
        radius: 1.2,
        mass: 95.2,
        color: '#FAD5A5'
      },
      {
        name: 'Uranus',
        position: new THREE.Vector3(287, 0, 0),
        radius: 0.8,
        mass: 14.5,
        color: '#4FD0E7'
      },
      {
        name: 'Neptune',
        position: new THREE.Vector3(450, 0, 0),
        radius: 0.8,
        mass: 17.1,
        color: '#4166F5'
      }
    ]
  }

  getPlanets(): Planet[] {
    return this.planets
  }

  getSunMass(): number {
    return this.sunMass
  }

  getPlanetByName(name: string): Planet | undefined {
    return this.planets.find(p => p.name === name)
  }

  getGravitationalField(position: THREE.Vector3): THREE.Vector3 {
    // Calculate combined gravitational field from Sun and all planets
    const field = new THREE.Vector3(0, 0, 0)
    const G = 0.001 // Gravitational constant (scaled)

    // Sun's gravity
    const toSun = new THREE.Vector3(0, 0, 0).sub(position)
    const distanceToSun = toSun.length()
    if (distanceToSun > 0) {
      const sunGravity = toSun.normalize().multiplyScalar(
        (G * this.sunMass) / (distanceToSun * distanceToSun)
      )
      field.add(sunGravity)
    }

    // Planets' gravity (much smaller effect)
    for (const planet of this.planets) {
      const toPlanet = planet.position.clone().sub(position)
      const distanceToPlanet = toPlanet.length()
      if (distanceToPlanet > 0) {
        const planetGravity = toPlanet.normalize().multiplyScalar(
          (G * planet.mass) / (distanceToPlanet * distanceToPlanet)
        )
        field.add(planetGravity)
      }
    }

    return field
  }
}

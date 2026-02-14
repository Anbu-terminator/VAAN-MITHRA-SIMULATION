// Simulated telemetry data generator for ClimaAI MicroSat mission
// In production, replace with Socket.IO connection to Flask backend

export interface TelemetryData {
  time: number;
  lat: number;
  lon: number;
  alt: number;
  phase: 'PRELAUNCH' | 'LAUNCH' | 'ASCENT' | 'BURST' | 'DESCENT' | 'LANDED';
  wind_east: number;
  wind_north: number;
  verticalSpeed: number;
}

const LAUNCH_LAT = 12.2253;
const LAUNCH_LON = 79.0747;
const MAX_ALT = 35000; // meters
const BURST_ALT = MAX_ALT;

// Gaussian random
function gaussRandom(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function generateMonteCarlPoints(centerLat: number, centerLon: number, count: number = 200, radiusM: number = 500) {
  const points: Array<{ lat: number; lon: number }> = [];
  const mPerDegLat = 111320;
  const mPerDegLon = 111320 * Math.cos((centerLat * Math.PI) / 180);

  for (let i = 0; i < count; i++) {
    const dLat = gaussRandom(0, radiusM / 3) / mPerDegLat;
    const dLon = gaussRandom(0, radiusM / 3) / mPerDegLon;
    points.push({ lat: centerLat + dLat, lon: centerLon + dLon });
  }
  return points;
}

export class MissionSimulator {
  private time = 0;
  private phase: TelemetryData['phase'] = 'PRELAUNCH';
  private alt = 5;
  private lat = LAUNCH_LAT;
  private lon = LAUNCH_LON;
  private verticalSpeed = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private speedMultiplier = 1;
  private onTelemetry: ((data: TelemetryData) => void) | null = null;
  private driftLat = 0;
  private driftLon = 0;

  setSpeedMultiplier(m: number) {
    this.speedMultiplier = Math.max(1, Math.min(20, m));
  }

  start(callback: (data: TelemetryData) => void) {
    this.onTelemetry = callback;
    this.phase = 'LAUNCH';
    this.time = 0;
    this.alt = 5;
    this.lat = LAUNCH_LAT;
    this.lon = LAUNCH_LON;
    this.driftLat = 0;
    this.driftLon = 0;

    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      this.tick();
    }, 200); // 5 Hz update
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    const dt = 0.2 * this.speedMultiplier;
    this.time += dt;

    const windEast = 3 + 2 * Math.sin(this.time * 0.05) + gaussRandom(0, 0.5);
    const windNorth = -1 + 1.5 * Math.cos(this.time * 0.03) + gaussRandom(0, 0.5);
    const windMag = Math.sqrt(windEast * windEast + windNorth * windNorth);

    // Wind-driven drift
    const mPerDegLat = 111320;
    const mPerDegLon = 111320 * Math.cos((this.lat * Math.PI) / 180);

    switch (this.phase) {
      case 'LAUNCH':
        this.verticalSpeed = 5 * this.speedMultiplier;
        this.alt += this.verticalSpeed * 0.2;
        if (this.alt > 500) this.phase = 'ASCENT';
        break;

      case 'ASCENT':
        this.verticalSpeed = 5 + Math.min(8, this.alt / 5000) * this.speedMultiplier;
        this.alt += this.verticalSpeed * 0.2;
        // Drift from wind
        this.driftLat += (windNorth * 0.2 * 0.3) / mPerDegLat;
        this.driftLon += (windEast * 0.2 * 0.3) / mPerDegLon;
        this.lat = LAUNCH_LAT + this.driftLat;
        this.lon = LAUNCH_LON + this.driftLon;
        if (this.alt >= BURST_ALT) {
          this.phase = 'BURST';
        }
        break;

      case 'BURST':
        this.verticalSpeed = 0;
        this.phase = 'DESCENT';
        break;

      case 'DESCENT':
        this.verticalSpeed = -(3 + Math.min(5, (BURST_ALT - this.alt) / 3000)) * this.speedMultiplier;
        this.alt += this.verticalSpeed * 0.2;
        // More wind drift during descent
        this.driftLat += (windNorth * 0.2 * 0.8) / mPerDegLat;
        this.driftLon += (windEast * 0.2 * 0.8) / mPerDegLon;
        this.lat = LAUNCH_LAT + this.driftLat;
        this.lon = LAUNCH_LON + this.driftLon;
        if (this.alt <= 5) {
          this.alt = 5;
          this.verticalSpeed = 0;
          this.phase = 'LANDED';
        }
        break;

      case 'LANDED':
        this.verticalSpeed = 0;
        this.stop();
        break;
    }

    const telemetry: TelemetryData = {
      time: this.time,
      lat: this.lat,
      lon: this.lon,
      alt: this.alt,
      phase: this.phase,
      wind_east: windEast,
      wind_north: windNorth,
      verticalSpeed: this.verticalSpeed,
    };

    this.onTelemetry?.(telemetry);
  }
}

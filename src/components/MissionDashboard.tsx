import { TelemetryData } from '@/lib/missionSimulator';

interface MissionDashboardProps {
  telemetry: TelemetryData | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `T+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function phaseColor(phase: string): string {
  switch (phase) {
    case 'LAUNCH': return 'text-neon-amber glow-amber';
    case 'ASCENT': return 'text-neon-green glow-green';
    case 'BURST': return 'text-neon-red glow-red';
    case 'DESCENT': return 'text-neon-cyan glow-cyan';
    case 'LANDED': return 'text-neon-green glow-green';
    default: return 'text-muted-foreground';
  }
}

export default function MissionDashboard({ telemetry }: MissionDashboardProps) {
  const windSpeed = telemetry
    ? Math.sqrt(telemetry.wind_east ** 2 + telemetry.wind_north ** 2)
    : 0;

  return (
    <div className="panel-glass rounded-lg p-4 w-72 border-glow scanline">
      {/* Header */}
      <div className="border-b border-border/40 pb-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <h2 className="font-orbitron text-xs tracking-[0.3em] text-primary uppercase">
            HAB Mission Control
          </h2>
        </div>
        <p className="font-share-tech text-[10px] text-muted-foreground tracking-widest">
          Vaan Mithra • HAB-01
        </p>
      </div>

      {/* Telemetry Grid */}
      <div className="space-y-2 font-share-tech text-xs">
        <TelemetryRow label="ALTITUDE" value={telemetry ? `${telemetry.alt.toFixed(1)} m` : '---'} />
        <TelemetryRow label="V/SPEED" value={telemetry ? `${telemetry.verticalSpeed.toFixed(2)} m/s` : '---'} />
        <TelemetryRow label="LATITUDE" value={telemetry ? telemetry.lat.toFixed(6) + '°' : '---'} />
        <TelemetryRow label="LONGITUDE" value={telemetry ? telemetry.lon.toFixed(6) + '°' : '---'} />
        <TelemetryRow
          label="PHASE"
          value={telemetry?.phase ?? 'PRELAUNCH'}
          valueClass={telemetry ? phaseColor(telemetry.phase) : 'text-muted-foreground'}
        />
        <TelemetryRow label="WIND" value={telemetry ? `${windSpeed.toFixed(2)} m/s` : '---'} />
        <TelemetryRow label="MET" value={telemetry ? formatTime(telemetry.time) : 'T+00:00'} />
      </div>

      {/* Status bar */}
      <div className="mt-3 pt-3 border-t border-border/40">
        <div className="flex items-center justify-between">
          <span className="font-share-tech text-[10px] text-muted-foreground">TELEMETRY LINK</span>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${telemetry ? 'bg-primary animate-pulse-glow' : 'bg-muted-foreground'}`} />
            <span className="font-share-tech text-[10px] text-primary">
              {telemetry ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TelemetryRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground tracking-wider">{label}</span>
      <span className={`text-foreground glow-green ${valueClass ?? ''}`}>{value}</span>
    </div>
  );
}

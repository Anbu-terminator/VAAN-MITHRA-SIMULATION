import { TelemetryData } from '@/lib/missionSimulator';

interface SensorHUDProps {
  telemetry: TelemetryData | null;
}

export default function SensorHUD({ telemetry }: SensorHUDProps) {
  const maxAlt = 35000;
  const altPct = telemetry ? Math.min(100, (telemetry.alt / maxAlt) * 100) : 0;
  const windSpeed = telemetry
    ? Math.sqrt(telemetry.wind_east ** 2 + telemetry.wind_north ** 2)
    : 0;
  const isBurst = telemetry?.phase === 'BURST';

  return (
    <div className="panel-glass rounded-lg p-3 w-20 border-glow-cyan flex flex-col items-center gap-4">
      {/* Altitude Gauge */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-share-tech text-[8px] text-muted-foreground tracking-widest">ALT</span>
        <div className="w-4 h-32 bg-muted rounded-full overflow-hidden relative">
          <div
            className="absolute bottom-0 w-full gauge-bar rounded-full transition-all duration-200"
            style={{ height: `${altPct}%` }}
          />
        </div>
        <span className="font-share-tech text-[9px] text-foreground glow-green">
          {telemetry ? `${(telemetry.alt / 1000).toFixed(1)}k` : '0'}
        </span>
      </div>

      {/* V-Speed */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-share-tech text-[8px] text-muted-foreground tracking-widest">V/S</span>
        <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
          <span className="font-share-tech text-[9px] text-foreground glow-green">
            {telemetry ? telemetry.verticalSpeed.toFixed(1) : '0'}
          </span>
        </div>
      </div>

      {/* Wind */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-share-tech text-[8px] text-muted-foreground tracking-widest">WIND</span>
        <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
          <span className="font-share-tech text-[9px] text-neon-cyan glow-cyan">
            {windSpeed.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Burst Indicator */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-share-tech text-[8px] text-muted-foreground tracking-widest">BURST</span>
        <div
          className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
            isBurst
              ? 'bg-destructive border-destructive animate-pulse-glow shadow-[0_0_12px_hsl(0_85%_55%/0.6)]'
              : 'bg-muted border-border'
          }`}
        />
      </div>
    </div>
  );
}

interface ControlPanelProps {
  isRunning: boolean;
  onStart: () => void;
  onSpeedChange: (speed: number) => void;
  showNDVI: boolean;
  onToggleNDVI: () => void;
  showWind: boolean;
  onToggleWind: () => void;
  showMonteCarlo: boolean;
  onToggleMonteCarlo: () => void;
}

export default function ControlPanel({
  isRunning,
  onStart,
  onSpeedChange,
  showNDVI,
  onToggleNDVI,
  showWind,
  onToggleWind,
  showMonteCarlo,
  onToggleMonteCarlo,
}: ControlPanelProps) {
  return (
    <div className="panel-glass rounded-lg p-3 border-glow inline-flex items-center gap-3">
      {/* Start button */}
      <button
        onClick={onStart}
        disabled={isRunning}
        className={`font-orbitron text-[10px] tracking-widest px-4 py-2 rounded border transition-all
          ${isRunning
            ? 'bg-muted text-muted-foreground border-border cursor-not-allowed'
            : 'bg-primary/20 text-primary border-primary hover:bg-primary/30 hover:shadow-[0_0_12px_hsl(160_100%_45%/0.3)]'
          }`}
      >
        {isRunning ? 'MISSION ACTIVE' : 'START MISSION'}
      </button>

      {/* Speed */}
      <div className="flex items-center gap-1.5">
        <label className="font-share-tech text-[9px] text-muted-foreground tracking-widest">SPEED</label>
        <input
          type="number"
          min={1}
          max={20}
          defaultValue={1}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-10 bg-input border border-border rounded px-1 py-0.5 font-share-tech text-[10px] text-foreground text-center focus:outline-none focus:border-primary"
        />
        <span className="font-share-tech text-[9px] text-muted-foreground">x</span>
      </div>

      {/* Toggles */}
      <ToggleBtn label="NDVI" active={showNDVI} onClick={onToggleNDVI} />
      <ToggleBtn label="WIND" active={showWind} onClick={onToggleWind} />
      <ToggleBtn label="MC" active={showMonteCarlo} onClick={onToggleMonteCarlo} />
    </div>
  );
}

function ToggleBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`font-share-tech text-[9px] tracking-widest px-2.5 py-1.5 rounded border transition-all
        ${active
          ? 'bg-primary/20 text-primary border-primary'
          : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
        }`}
    >
      {label}
    </button>
  );
}

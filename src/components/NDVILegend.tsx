interface NDVILegendProps {
  visible: boolean;
}

export default function NDVILegend({ visible }: NDVILegendProps) {
  if (!visible) return null;

  return (
    <div className="panel-glass rounded-lg p-3 border-glow w-48">
      <h3 className="font-orbitron text-[9px] tracking-[0.2em] text-primary mb-2">NDVI OVERLAY</h3>
      <div className="ndvi-gradient h-3 rounded-sm mb-1" />
      <div className="flex justify-between font-share-tech text-[8px] text-muted-foreground">
        <span>Low Vegetation</span>
        <span>High Vegetation</span>
      </div>
    </div>
  );
}

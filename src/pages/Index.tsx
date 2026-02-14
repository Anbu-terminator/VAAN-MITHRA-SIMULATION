import { useState } from 'react';
import CesiumGlobe from '@/components/CesiumGlobe';
import MissionDashboard from '@/components/MissionDashboard';
import SensorHUD from '@/components/SensorHUD';
import ControlPanel from '@/components/ControlPanel';
import NDVILegend from '@/components/NDVILegend';
import { useMissionTelemetry } from '@/hooks/useMissionTelemetry';

const Index = () => {
  const { telemetry, isRunning, startMission, setSpeed } = useMissionTelemetry();
  const [showNDVI, setShowNDVI] = useState(false);
  const [showWind, setShowWind] = useState(true);
  const [showMonteCarlo, setShowMonteCarlo] = useState(true);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Cesium Globe */}
      <CesiumGlobe
        telemetry={telemetry}
        showWind={showWind}
        showMonteCarlo={showMonteCarlo}
      />

      {/* Top Control Panel */}
      <div className="absolute top-4 left-4 z-10">
        <ControlPanel
          isRunning={isRunning}
          onStart={startMission}
          onSpeedChange={setSpeed}
          showNDVI={showNDVI}
          onToggleNDVI={() => setShowNDVI(!showNDVI)}
          showWind={showWind}
          onToggleWind={() => setShowWind(!showWind)}
          showMonteCarlo={showMonteCarlo}
          onToggleMonteCarlo={() => setShowMonteCarlo(!showMonteCarlo)}
        />
      </div>

      {/* Left Dashboard */}
      <div className="absolute top-20 left-4 z-10">
        <MissionDashboard telemetry={telemetry} />
      </div>

      {/* Right HUD */}
      <div className="absolute top-20 right-4 z-10">
        <SensorHUD telemetry={telemetry} />
      </div>

      {/* NDVI Legend */}
      <div className="absolute bottom-20 left-4 z-10">
        <NDVILegend visible={showNDVI} />
      </div>

      {/* Mission Title Watermark */}
      <div className="absolute bottom-4 right-4 z-10 text-right">
        <p className="font-orbitron text-[10px] tracking-[0.4em] text-primary/30">
          CLIMAAI MICROSAT
        </p>
        <p className="font-share-tech text-[8px] text-muted-foreground/40">
          ISRO • HIGH ALTITUDE BALLOON • MISSION CONTROL v2.1
        </p>
      </div>
    </div>
  );
};

export default Index;

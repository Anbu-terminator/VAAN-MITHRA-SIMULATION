import { useCallback, useRef, useState } from 'react';
import { MissionSimulator, TelemetryData } from '@/lib/missionSimulator';

export function useMissionTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const simulatorRef = useRef(new MissionSimulator());

  const startMission = useCallback(() => {
    setIsRunning(true);
    simulatorRef.current.start((data) => {
      setTelemetry(data);
      if (data.phase === 'LANDED') {
        setIsRunning(false);
      }
    });
  }, []);

  const stopMission = useCallback(() => {
    simulatorRef.current.stop();
    setIsRunning(false);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    simulatorRef.current.setSpeedMultiplier(speed);
  }, []);

  return { telemetry, isRunning, startMission, stopMission, setSpeed };
}

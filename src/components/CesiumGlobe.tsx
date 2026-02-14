import { useEffect, useRef, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { TelemetryData, generateMonteCarlPoints } from '@/lib/missionSimulator';

const LAUNCH_LAT = 12.2253;
const LAUNCH_LON = 79.0747;

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiM2ZiYjRiZi1iNjE5LTRkMDYtYmI3ZC0xNmY2OTVhZGViMGEiLCJpZCI6Mzg1NTk3LCJpYXQiOjE3NzEwMDEzMjV9.4W7u5d48Ae1VQRx5KyPfKY4mjBKxR4fNmT2vlR2E8Sk';

interface CesiumGlobeProps {
  telemetry: TelemetryData | null;
  showWind: boolean;
  showMonteCarlo: boolean;
}

export default function CesiumGlobe({ telemetry, showWind, showMonteCarlo }: CesiumGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entityRef = useRef<Cesium.Entity | null>(null);
  const positionPropertyRef = useRef<Cesium.SampledPositionProperty | null>(null);
  const windEntitiesRef = useRef<Cesium.Entity[]>([]);
  const monteCarloEntitiesRef = useRef<Cesium.Entity[]>([]);
  const cepEntityRef = useRef<Cesium.Entity | null>(null);
  const lastPhaseRef = useRef<string>('PRELAUNCH');
  const monteCarloGeneratedRef = useRef(false);
  const startTimeRef = useRef<Cesium.JulianDate>(Cesium.JulianDate.now());

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    async function init() {
      if (destroyed || !containerRef.current) return;

      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: true,
        timeline: true,
        shouldAnimate: true,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        selectionIndicator: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        terrain: Cesium.Terrain.fromWorldTerrain(),
      });

      viewer.scene.globe.enableLighting = false;
      viewer.scene.skyAtmosphere.show = true;

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(LAUNCH_LON, LAUNCH_LAT, 500000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-60),
          roll: 0,
        },
      });

      const startTime = Cesium.JulianDate.now();
      startTimeRef.current = startTime;
      const positionProperty = new Cesium.SampledPositionProperty();
      positionProperty.setInterpolationOptions({
        interpolationDegree: 2,
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
      });

      const initialPos = Cesium.Cartesian3.fromDegrees(LAUNCH_LON, LAUNCH_LAT, 5);
      positionProperty.addSample(startTime, initialPos);
      positionPropertyRef.current = positionProperty;

      // Satellite entity using the uploaded .glb model
      const satellite = viewer.entities.add({
        name: 'ClimaAI MicroSat',
        position: positionProperty,
        model: {
          uri: '/assets/satellite.glb',
          minimumPixelSize: 64,
          maximumScale: 200,
        },
        path: {
          resolution: 1,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: Cesium.Color.fromHsl(0.44, 1.0, 0.55, 0.8),
          }),
          width: 3,
          leadTime: 0,
          trailTime: 600,
        },
        label: {
          text: 'HAB-01',
          font: '12px Orbitron',
          fillColor: Cesium.Color.fromHsl(0.44, 1.0, 0.65, 1.0),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -40),
          scaleByDistance: new Cesium.NearFarScalar(1000, 1, 100000, 0.4),
        },
      });

      entityRef.current = satellite;
      viewerRef.current = viewer;

      viewer.clock.startTime = startTime.clone();
      viewer.clock.currentTime = startTime.clone();
      viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;
      viewer.clock.multiplier = 1;
    }

    init();

    return () => {
      destroyed = true;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  const updateTelemetry = useCallback((data: TelemetryData) => {
    const viewer = viewerRef.current;
    const positionProperty = positionPropertyRef.current;
    if (!viewer || !positionProperty) return;

    const sampleTime = Cesium.JulianDate.addSeconds(
      startTimeRef.current, data.time, new Cesium.JulianDate()
    );
    const pos = Cesium.Cartesian3.fromDegrees(data.lon, data.lat, data.alt);
    positionProperty.addSample(sampleTime, pos);

    viewer.clock.currentTime = sampleTime.clone();
    viewer.clock.stopTime = Cesium.JulianDate.addSeconds(sampleTime, 10, new Cesium.JulianDate());
    viewer.clock.shouldAnimate = true;

    if (entityRef.current && !viewer.trackedEntity) {
      viewer.trackedEntity = entityRef.current;
    }

    // Switch to parachute billboard on DESCENT
    if (data.phase === 'DESCENT' && lastPhaseRef.current !== 'DESCENT' && entityRef.current) {
      entityRef.current.model = undefined as any;
      entityRef.current.billboard = new Cesium.BillboardGraphics({
        image: '/assets/parachute.png',
        width: 48,
        height: 48,
        scaleByDistance: new Cesium.NearFarScalar(1000, 1.5, 100000, 0.3),
      });
      (entityRef.current.label as any).text = new Cesium.ConstantProperty('🪂 HAB-01');
    }
    if (data.phase === 'BURST' && lastPhaseRef.current !== 'BURST' && entityRef.current) {
      // Flash effect at burst
      entityRef.current.model = undefined as any;
      entityRef.current.point = new Cesium.PointGraphics({
        pixelSize: 20,
        color: Cesium.Color.RED,
      });
    }

    if (data.phase === 'DESCENT' && !monteCarloGeneratedRef.current && showMonteCarlo) {
      generateMonteCarloCloud(data.lat, data.lon);
      monteCarloGeneratedRef.current = true;
    }

    if (showWind) updateWindVector(data);
    lastPhaseRef.current = data.phase;
  }, [showWind, showMonteCarlo]);

  useEffect(() => {
    if (telemetry) updateTelemetry(telemetry);
  }, [telemetry, updateTelemetry]);

  useEffect(() => {
    windEntitiesRef.current.forEach((e) => { e.show = showWind; });
  }, [showWind]);

  useEffect(() => {
    monteCarloEntitiesRef.current.forEach((e) => { e.show = showMonteCarlo; });
    if (cepEntityRef.current) cepEntityRef.current.show = showMonteCarlo;
  }, [showMonteCarlo]);

  function updateWindVector(data: TelemetryData) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    while (windEntitiesRef.current.length > 5) {
      const old = windEntitiesRef.current.shift();
      if (old) viewer.entities.remove(old);
    }
    const scale = 100;
    const endLat = data.lat + (data.wind_north * scale) / 111320;
    const endLon = data.lon + (data.wind_east * scale) / (111320 * Math.cos((data.lat * Math.PI) / 180));
    const windEntity = viewer.entities.add({
      billboard: {
        image: '/assets/arrow.png',
        width: 32,
        height: 32,
        rotation: -Math.atan2(data.wind_east, data.wind_north),
        color: Cesium.Color.CYAN,
      },
      position: Cesium.Cartesian3.fromDegrees(endLon, endLat, data.alt),
      show: showWind,
    });
    windEntitiesRef.current.push(windEntity);
  }

  function generateMonteCarloCloud(centerLat: number, centerLon: number) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const points = generateMonteCarlPoints(centerLat, centerLon, 200, 500);
    points.forEach((p) => {
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 5),
        point: {
          pixelSize: 4,
          color: Cesium.Color.fromHsl(0.13, 1.0, 0.55, 0.4),
          outlineColor: Cesium.Color.fromHsl(0.13, 1.0, 0.55, 0.2),
          outlineWidth: 1,
        },
        show: showMonteCarlo,
      });
      monteCarloEntitiesRef.current.push(entity);
    });
    const cep = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 5),
      ellipse: {
        semiMajorAxis: 500,
        semiMinorAxis: 350,
        height: 5,
        material: Cesium.Color.fromHsl(0.13, 1.0, 0.55, 0.1),
        outline: true,
        outlineColor: Cesium.Color.fromHsl(0.13, 1.0, 0.55, 0.6),
        outlineWidth: 2,
      },
      show: showMonteCarlo,
    });
    cepEntityRef.current = cep;
  }

  return <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />;
}

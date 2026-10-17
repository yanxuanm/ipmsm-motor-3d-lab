import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MotorScene } from './scene/MotorScene';
import { HUD } from './ui/HUD';
import { EncyclopediaModal } from './ui/EncyclopediaModal';
import { SimulationState, ElectricalValues } from './types/motor';
import { computeElectricalValues, stepPhysicsSimulation, DEFAULT_MOTOR_PARAMS } from './physics/focEngine';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const motorSceneRef = useRef<MotorScene | null>(null);

  // Simulation State
  const [state, setState] = useState<SimulationState>({
    rpm: 1000,
    loadAngle: 48, // MTPA angle for high efficiency and reluctance torque
    fluxWeakeningCurrent: 0,
    phaseCurrentMagnitude: 200,
    operatingMode: 'motoring',
    isPlaying: true,
    time: 0,
    theta_m: 0,
    theta_e: 0,
    explodedProgress: 0,
    cutawayEnabled: false,
    wireframeEnabled: false,
    showVectors: true,
    showFluxLines: true,
    showParticles: true,
    currentPreset: 'isometric',
    selectedPartId: null
  });

  const stateRef = useRef<SimulationState>(state);
  stateRef.current = state;

  const [electrical, setElectrical] = useState<ElectricalValues>(() =>
    computeElectricalValues(state, DEFAULT_MOTOR_PARAMS)
  );

  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);

  // Theme state ('dark' | 'light') with local persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('ipmsm_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore storage access restrictions
    }
    return 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ipmsm_theme', theme);
    } catch {}
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    if (motorSceneRef.current) {
      motorSceneRef.current.setTheme(theme);
    }
  }, [theme]);

  // Initialize MotorScene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new MotorScene(containerRef.current, {
      onSelectComponent: (partId) => {
        setState(prev => ({ ...prev, selectedPartId: partId }));
      },
      onHoverComponent: (partId) => {
        setHoveredPartId(partId);
      }
    });

    scene.setTheme(theme);
    motorSceneRef.current = scene;

    const handleResize = () => scene.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      motorSceneRef.current = null;
    };
  }, []);

  // Update Cutaway & Wireframe on state change
  useEffect(() => {
    if (!motorSceneRef.current) return;
    motorSceneRef.current.setCutaway(state.cutawayEnabled);
  }, [state.cutawayEnabled]);

  useEffect(() => {
    if (!motorSceneRef.current) return;
    motorSceneRef.current.setWireframe(state.wireframeEnabled);
  }, [state.wireframeEnabled]);

  // Main 60 FPS Physics & Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let lastUiSyncTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // Cap dt to avoid huge step
      lastTime = currentTime;

      const currentState = stateRef.current;
      const nextState = stepPhysicsSimulation(currentState, dt, DEFAULT_MOTOR_PARAMS);
      stateRef.current = nextState;

      const currentElectrical = computeElectricalValues(nextState, DEFAULT_MOTOR_PARAMS);

      // WebGL 3D Scene always runs full 60 FPS
      if (motorSceneRef.current) {
        motorSceneRef.current.update(nextState, currentElectrical, dt);
      }

      // Throttle React UI and oscilloscope re-renders to 50ms (~20 FPS) to eliminate DOM overhead
      if (currentTime - lastUiSyncTime >= 50) {
        setState(nextState);
        setElectrical(currentElectrical);
        lastUiSyncTime = currentTime;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleUpdateState = useCallback((updates: Partial<SimulationState>) => {
    setState(prev => {
      const updated = { ...prev, ...updates };
      stateRef.current = updated;
      return updated;
    });
  }, []);

  const handleSelectCameraPreset = useCallback((presetId: string) => {
    if (motorSceneRef.current) {
      motorSceneRef.current.setCameraPreset(presetId);
    }
  }, []);

  return (
    <div className={`relative w-screen h-screen overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'bg-[#eef2f6]' : 'bg-[#07090e]'}`}>
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Industrial Dark / Engineering Light HUD Overlay */}
      <HUD
        state={state}
        electrical={electrical}
        onUpdateState={handleUpdateState}
        onSelectCameraPreset={handleSelectCameraPreset}
        hoveredPartId={hoveredPartId}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Component Encyclopedia Inspection Card */}
      <EncyclopediaModal
        selectedId={state.selectedPartId}
        onClose={() => setState(prev => ({ ...prev, selectedPartId: null }))}
        theme={theme}
      />
    </div>
  );
};

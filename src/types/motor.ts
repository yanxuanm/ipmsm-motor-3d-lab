export interface MotorParameters {
  polePairs: number;         // p = 4 (8 poles)
  statorSlots: number;       // 48 slots
  statorOuterRadius: number; // 95 mm
  statorInnerRadius: number; // 65 mm
  rotorOuterRadius: number;  // 64.2 mm (air gap = 0.8 mm)
  rotorInnerRadius: number;  // 22 mm
  shaftRadius: number;       // 20 mm
  stackLength: number;       // 120 mm
  psi_pm: number;            // 0.082 Wb (PM flux linkage)
  L_d: number;               // 0.38 mH (d-axis inductance)
  L_q: number;               // 0.92 mH (q-axis inductance, Lq/Ld saliency ratio ~ 2.42)
  baseSpeedRpm: number;      // 4500 RPM
  maxSpeedRpm: number;       // 16000 RPM
  maxCurrent: number;        // 350 A
}

export type OperatingMode = 'motoring' | 'regen' | 'flux_weakening';

export interface SimulationState {
  rpm: number;
  loadAngle: number;         // Torque angle delta in degrees (-90 to +90)
  fluxWeakeningCurrent: number; // Id override (negative for manual field weakening, 0 for orthogonal delta control)
  phaseCurrentMagnitude: number; // Im in Amperes (10 to 350A)
  operatingMode: OperatingMode;
  isPlaying: boolean;
  time: number;
  theta_m: number;           // Mechanical angle in radians
  theta_e: number;           // Electrical angle in radians
  explodedProgress: number;  // 0.0 (assembled) to 1.0 (fully exploded)
  cutawayEnabled: boolean;   // Axial cutaway view
  wireframeEnabled: boolean;
  showVectors: boolean;      // 3D vector arrows
  showFluxLines: boolean;    // Dynamic flux lines
  showParticles: boolean;    // Electron flow particles
  currentPreset: string;
  selectedPartId: string | null;
}

export interface ElectricalValues {
  I_u: number;
  I_v: number;
  I_w: number;
  I_alpha: number;
  I_beta: number;
  I_d: number;
  I_q: number;
  T_pm: number;              // Permanent magnet alignment torque (Nm)
  T_rel: number;             // Reluctance torque from saliency (Nm)
  T_total: number;           // Combined electromagnetic torque (Nm)
  efficiency: number;        // Estimated efficiency %
  statorMMFAngle: number;    // Electrical angle of Fs vector
  rotorFluxAngle: number;    // Electrical angle of Fr vector
  deltaRad: number;          // Effective electrical angle between Fs and Fr in radians
  U_d: number;               // d-axis voltage (V)
  U_q: number;               // q-axis voltage (V)
  U_s: number;               // Stator phase voltage amplitude sqrt(Ud^2 + Uq^2) (V)
  U_max: number;             // Inverter voltage limit U_dc / sqrt(3) (V)
  E_back: number;            // Open-circuit back-EMF omega_e * psi_pm (V)
  isOverVoltage: boolean;    // True when U_s exceeds inverter voltage limit U_max
  copperLoss: number;        // 3-phase Joule copper loss P_cu = 1.5 * R_s * (Id^2 + Iq^2) (W)
  ironLoss: number;          // High-frequency silicon-steel core loss P_fe (W)
}

export interface ComponentInfo {
  id: string;
  name: string;
  category: '定子系统' | '转子系统' | '电磁绕组' | '机械与传感' | '冷却外壳';
  material: string;
  industrialStandard: string;
  keySpecs: string[];
  description: string;
  engineeringChallenges: string;
  solutionInEV: string;
  highSchoolBridge?: string;
}

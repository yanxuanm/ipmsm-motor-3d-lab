import { MotorParameters, SimulationState, ElectricalValues } from '../types/motor';

export const DEFAULT_MOTOR_PARAMS: MotorParameters = {
  polePairs: 4,              // 8 poles
  statorSlots: 48,
  statorOuterRadius: 95,
  statorInnerRadius: 65,
  rotorOuterRadius: 64.2,
  rotorInnerRadius: 22,
  shaftRadius: 20,
  stackLength: 120,
  psi_pm: 0.082,             // Wb
  L_d: 0.00038,              // 0.38 mH
  L_q: 0.00092,              // 0.92 mH
  baseSpeedRpm: 4500,
  maxSpeedRpm: 16000,
  maxCurrent: 350
};

/**
 * Computes instantaneous three-phase currents, Clarke/Park transforms,
 * amplitude-invariant orthogonal d-q axis decoupling, permanent magnet vs reluctance
 * torque decomposition, and inverter voltage limit ellipse telemetry.
 */
export function computeElectricalValues(
  state: SimulationState,
  params: MotorParameters = DEFAULT_MOTOR_PARAMS
): ElectricalValues {
  const p = params.polePairs;
  const deltaRad = (state.loadAngle * Math.PI) / 180;
  const theta_e = state.theta_e;
  const Im = state.phaseCurrentMagnitude;

  // Strictly amplitude-conserving orthogonal decomposition: sqrt(Id^2 + Iq^2) <= Im
  // When fluxWeakeningCurrent === 0 (normal torque-angle control):
  //   Id = -Im * cos(delta), Iq = Im * sin(delta) -> sqrt(Id^2 + Iq^2) === Im
  //   T_pm  = 1.5 * p * psi_pm * Im * sin(delta)
  //   T_rel = 0.75 * p * (L_q - L_d) * Im^2 * sin(2*delta)
  // When manual fluxWeakeningCurrent < 0 is set, Id is clamped to [-Im, 0] and
  // Iq envelope is bounded by sqrt(Im^2 - Id^2) so total current never exceeds Im.
  let Id: number;
  let Iq: number;

  if (state.fluxWeakeningCurrent === 0) {
    Id = -Im * Math.cos(deltaRad);
    Iq = Im * Math.sin(deltaRad);
  } else {
    Id = -Math.min(Im, Math.abs(state.fluxWeakeningCurrent));
    const iqEnvelope = Math.sqrt(Math.max(0, Im * Im - Id * Id));
    Iq = iqEnvelope * Math.sin(deltaRad);
  }

  // 1. Inverse Park Transform: d-q rotating frame -> alpha-beta stationary frame
  const cosTheta = Math.cos(theta_e);
  const sinTheta = Math.sin(theta_e);

  const I_alpha = Id * cosTheta - Iq * sinTheta;
  const I_beta  = Id * sinTheta + Iq * cosTheta;

  // 2. Inverse Clarke Transform (Amplitude-Invariant): alpha-beta -> (u, v, w)
  const sqrt3_2 = Math.sqrt(3) / 2;
  const I_u = I_alpha;
  const I_v = -0.5 * I_alpha + sqrt3_2 * I_beta;
  const I_w = -0.5 * I_alpha - sqrt3_2 * I_beta;

  // 3. Torque Decomposition:
  // T_pm  = 1.5 * p * psi_pm * Iq (Permanent magnet alignment torque)
  // T_rel = 1.5 * p * (L_d - L_q) * Id * Iq (Reluctance torque from saliency)
  const T_pm = 1.5 * p * params.psi_pm * Iq;
  const T_rel = 1.5 * p * (params.L_d - params.L_q) * Id * Iq;
  const T_total = T_pm + T_rel;

  // 4. Stator MMF and Rotor PM Vector Angles
  // Rotor direct axis (Fr) is aligned with theta_e
  const rotorFluxAngle = theta_e;
  // Effective electrical angle of Stator MMF (Fs) relative to Rotor d-axis
  // reflects both loadAngle and any manual Id flux-weakening phase deflection:
  const effectiveDeltaRad = (Math.abs(Iq) < 1e-4 && Math.abs(Id) < 1e-4)
    ? deltaRad
    : Math.atan2(Iq, -Id);
  const statorMMFAngle = theta_e + effectiveDeltaRad;

  // 5. Stator Terminal Voltage & Inverter Voltage Limit Ellipse
  const R_s = 0.045; // Stator phase resistance ~ 0.045 Ohm
  const omega_m = (2 * Math.PI * state.rpm) / 60;
  const omega_e = p * omega_m;
  const U_d = R_s * Id - omega_e * params.L_q * Iq;
  const U_q = R_s * Iq + omega_e * (params.psi_pm + params.L_d * Id);
  const U_s = Math.hypot(U_d, U_q);
  const E_back = omega_e * params.psi_pm;
  const U_max = 800.0 / Math.sqrt(3); // Inverter max phase voltage amplitude (800V SiC Bus / sqrt(3) ≈ 462V)
  const isOverVoltage = U_s > U_max;

  // 6. Efficiency estimation based on exact amplitude-invariant copper loss:
  // Since I_u^2 + I_v^2 + I_w^2 = 1.5 * I_peak^2 = 3 * I_rms^2,
  // total 3-phase copper loss P_cu = 3 * I_rms^2 * R_s = (I_u^2 + I_v^2 + I_w^2) * R_s
  const copperLoss = (I_u * I_u + I_v * I_v + I_w * I_w) * R_s;
  const ironLoss = Math.pow(state.rpm / 1000, 1.6) * 12.0;
  const mechPower = Math.abs(T_total * omega_m);
  const efficiency = mechPower > 0
    ? Math.min(97.8, Math.max(82.0, (mechPower / (mechPower + copperLoss + ironLoss + 10)) * 100))
    : 0;

  return {
    I_u,
    I_v,
    I_w,
    I_alpha,
    I_beta,
    I_d: Id,
    I_q: Iq,
    T_pm,
    T_rel,
    T_total,
    efficiency,
    statorMMFAngle,
    rotorFluxAngle,
    deltaRad: effectiveDeltaRad,
    U_d,
    U_q,
    U_s,
    U_max,
    E_back,
    isOverVoltage,
    copperLoss,
    ironLoss
  };
}

/**
 * Updates electrical and mechanical angles given elapsed delta time
 */
export function stepPhysicsSimulation(
  state: SimulationState,
  dt: number,
  params: MotorParameters = DEFAULT_MOTOR_PARAMS
): SimulationState {
  if (!state.isPlaying) return state;

  const omega_m = (2 * Math.PI * state.rpm) / 60; // rad/s mechanical
  const omega_e = params.polePairs * omega_m;     // rad/s electrical

  const nextThetaM = (state.theta_m + omega_m * dt) % (Math.PI * 2);
  const nextThetaE = (state.theta_e + omega_e * dt) % (Math.PI * 2);
  const nextTime = state.time + dt;

  return {
    ...state,
    theta_m: nextThetaM,
    theta_e: nextThetaE,
    time: nextTime
  };
}

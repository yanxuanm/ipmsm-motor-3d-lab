import React, { useEffect, useRef } from 'react';
import { ElectricalValues, SimulationState } from '../types/motor';
import { DEFAULT_MOTOR_PARAMS } from '../physics/focEngine';

interface OscilloscopeProps {
  electrical: ElectricalValues;
  state: SimulationState;
  theme?: 'dark' | 'light';
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ electrical, state, theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 800,
    height: 140,
    dpr: 1
  });

  // Track container dimensions & Retina devicePixelRatio via ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(300, Math.round(rect.width));
      const h = Math.max(100, Math.round(rect.height));
      if (
        canvas.width !== Math.round(w * dpr) ||
        canvas.height !== Math.round(h * dpr)
      ) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      sizeRef.current = { width: w, height: h, dpr };
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isLight = theme === 'light';
    const halfH = height / 2;

    // Clear background
    ctx.fillStyle = isLight ? '#f8fafc' : '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    // Grid lines (Engineering reticle)
    ctx.lineWidth = 1;
    ctx.strokeStyle = isLight ? 'rgba(100, 116, 139, 0.18)' : 'rgba(79, 172, 254, 0.08)';
    const gridCols = 16;
    const gridRows = 8;
    for (let c = 0; c <= gridCols; c++) {
      const x = (c / gridCols) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let r = 0; r <= gridRows; r++) {
      const y = (r / gridRows) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Midline axes
    ctx.strokeStyle = isLight ? 'rgba(71, 85, 105, 0.35)' : 'rgba(79, 172, 254, 0.22)';
    ctx.beginPath();
    ctx.moveTo(0, halfH / 2);
    ctx.lineTo(width, halfH / 2);
    ctx.moveTo(0, halfH + halfH / 2);
    ctx.lineTo(width, halfH + halfH / 2);
    ctx.stroke();

    // Divider line between Channel 1 and Channel 2
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.5)' : 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, halfH);
    ctx.lineTo(width, halfH);
    ctx.stroke();

    // Channel 1: Three-Phase Sinusoidal Current Waveforms (I_u, I_v, I_w)
    const ch1CenterY = halfH / 2 + 4;
    const ch1Amp = halfH * 0.35;
    const cycles = 3;
    const currentIm = Math.max(1, state.phaseCurrentMagnitude);

    // Channel 1 Indicator Cursor (t0)
    const cursorX = width * 0.35;

    // Synchronize phase so at x = cursorX, each phase wave matches its exact instantaneous current
    const currentAngle = Math.atan2(electrical.I_beta, electrical.I_alpha);
    const currentMagnitude = Math.hypot(electrical.I_alpha, electrical.I_beta);
    const stepPx = 4; // 4px step cuts trig evaluations by 75% with identical visual smoothness

    const drawSineWave = (color: string, phaseShift: number, lineWidth: number = 1.8) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (let x = 0; x <= width; x += stepPx) {
        const clampedX = Math.min(x, width);
        const theta = ((clampedX - cursorX) / width) * Math.PI * 2 * cycles + currentAngle + phaseShift;
        const currentVal = currentMagnitude * Math.cos(theta);
        const y = ch1CenterY - (currentVal / 350) * ch1Amp;
        if (x === 0) ctx.moveTo(clampedX, y);
        else ctx.lineTo(clampedX, y);
      }
      ctx.stroke();
    };

    // Phase U: Amber/Orange
    drawSineWave(isLight ? '#d97706' : '#f59e0b', 0);
    // Phase V: Emerald Green
    drawSineWave(isLight ? '#059669' : '#10b981', -(2 * Math.PI) / 3);
    // Phase W: Cyan/Blue
    drawSineWave(isLight ? '#0284c7' : '#00f2fe', (2 * Math.PI) / 3);

    ctx.strokeStyle = isLight ? 'rgba(71, 85, 105, 0.65)' : 'rgba(255, 255, 255, 0.55)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cursorX, 16);
    ctx.lineTo(cursorX, halfH - 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // Channel 1 Text Badges
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.fillText('CH 1: 3-PHASE CURRENT (A)', 12, 14);

    ctx.fillStyle = isLight ? '#d97706' : '#f59e0b';
    ctx.fillText(`I_u: ${electrical.I_u.toFixed(1)}A`, 185, 14);
    ctx.fillStyle = isLight ? '#059669' : '#10b981';
    ctx.fillText(`I_v: ${electrical.I_v.toFixed(1)}A`, 275, 14);
    ctx.fillStyle = isLight ? '#0284c7' : '#00f2fe';
    ctx.fillText(`I_w: ${electrical.I_w.toFixed(1)}A`, 365, 14);
    ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
    ctx.fillText(`|I_s|: ${currentMagnitude.toFixed(0)}A`, 460, 14);

    // Channel 2: Electromagnetic Torque vs Load Angle delta (-90° to +90°)
    const ch2CenterY = halfH + halfH / 2 + 4;
    const ch2Amp = halfH * 0.35;

    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.fillText('CH 2: TORQUE vs δ (-90°~+90°)', 12, halfH + 14);

    const tTotal = electrical.T_total;
    const tPm = electrical.T_pm;
    const tRel = electrical.T_rel;
    const absSum = Math.max(0.1, Math.abs(tPm) + Math.abs(tRel));
    const pmPercent = ((Math.abs(tPm) / absSum) * 100).toFixed(0);
    const relPercent = ((Math.abs(tRel) / absSum) * 100).toFixed(0);

    ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
    ctx.fillText(`Total: ${tTotal.toFixed(1)} Nm`, 210, halfH + 14);
    ctx.fillStyle = isLight ? '#dc2626' : '#ef4444';
    ctx.fillText(`T_pm (永磁): ${tPm.toFixed(1)} Nm (${pmPercent}%)`, 320, halfH + 14);
    ctx.fillStyle = isLight ? '#0284c7' : '#38bdf8';
    ctx.fillText(`T_rel (磁阻): ${tRel.toFixed(1)} Nm (${relPercent}%)`, 495, halfH + 14);

    const maxTorqueScale = 360;
    const p = DEFAULT_MOTOR_PARAMS.polePairs;
    const psi_pm = DEFAULT_MOTOR_PARAMS.psi_pm;
    const Ld = DEFAULT_MOTOR_PARAMS.L_d;
    const Lq = DEFAULT_MOTOR_PARAMS.L_q;

    const evaluateTorquesAtDelta = (deltaTest: number) => {
      let idTest: number;
      let iqTest: number;
      if (state.fluxWeakeningCurrent === 0) {
        idTest = -currentIm * Math.cos(deltaTest);
        iqTest = currentIm * Math.sin(deltaTest);
      } else {
        idTest = -Math.min(currentIm, Math.abs(state.fluxWeakeningCurrent));
        const iqEnv = Math.sqrt(Math.max(0, currentIm * currentIm - idTest * idTest));
        iqTest = iqEnv * Math.sin(deltaTest);
      }
      const torquePm = 1.5 * p * psi_pm * iqTest;
      const torqueRel = 1.5 * p * (Ld - Lq) * idTest * iqTest;
      return { torquePm, torqueRel, totalT: torquePm + torqueRel };
    };

    // 1. Permanent Magnet Torque curve (T_pm)
    ctx.strokeStyle = isLight ? 'rgba(220, 38, 38, 0.9)' : 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = 0; x <= width; x += stepPx) {
      const clampedX = Math.min(x, width);
      const deltaTest = ((clampedX / width) - 0.5) * Math.PI;
      const { torquePm } = evaluateTorquesAtDelta(deltaTest);
      const y = ch2CenterY - (torquePm / maxTorqueScale) * ch2Amp;
      if (x === 0) ctx.moveTo(clampedX, y);
      else ctx.lineTo(clampedX, y);
    }
    ctx.stroke();

    // 2. Reluctance Torque curve (T_rel) - peaks at +45 deg, returns to 0 at +90 deg
    ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.9)' : 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = 0; x <= width; x += stepPx) {
      const clampedX = Math.min(x, width);
      const deltaTest = ((clampedX / width) - 0.5) * Math.PI;
      const { torqueRel } = evaluateTorquesAtDelta(deltaTest);
      const y = ch2CenterY - (torqueRel / maxTorqueScale) * ch2Amp;
      if (x === 0) ctx.moveTo(clampedX, y);
      else ctx.lineTo(clampedX, y);
    }
    ctx.stroke();

    // 3. Combined Total Torque curve (T_total) - peaks at MTPA (~52-58 deg)
    ctx.strokeStyle = isLight ? '#0f172a' : '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    let maxTotalT = -Infinity;
    let peakX = width * 0.78;
    let peakY = ch2CenterY;
    for (let x = 0; x <= width; x += stepPx) {
      const clampedX = Math.min(x, width);
      const deltaTest = ((clampedX / width) - 0.5) * Math.PI;
      const { totalT } = evaluateTorquesAtDelta(deltaTest);
      const y = ch2CenterY - (totalT / maxTorqueScale) * ch2Amp;
      if (totalT > maxTotalT) {
        maxTotalT = totalT;
        peakX = clampedX;
        peakY = y;
      }
      if (x === 0) ctx.moveTo(clampedX, y);
      else ctx.lineTo(clampedX, y);
    }
    ctx.stroke();

    // Mark MTPA peak reference tick on total torque curve when in orthogonal mode
    if (state.fluxWeakeningCurrent === 0) {
      const peakDeg = (((peakX / width) - 0.5) * 180).toFixed(0);
      ctx.fillStyle = isLight ? 'rgba(5, 150, 105, 0.95)' : 'rgba(16, 185, 129, 0.9)';
      ctx.fillText(`MTPA Peak (~+${peakDeg}°)`, Math.min(width - 115, peakX - 35), Math.max(halfH + 26, peakY - 6));
    }

    // Mark current operating point on the torque curve
    const currentDeltaFrac = (state.loadAngle + 90) / 180;
    const opX = currentDeltaFrac * width;
    const opY = ch2CenterY - (tTotal / maxTorqueScale) * ch2Amp;

    ctx.fillStyle = isLight ? '#d97706' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(opX, opY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isLight ? '#0f172a' : '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

  }, [electrical, state, theme]);

  return (
    <div className={`w-full glass-panel rounded-lg p-2.5 flex flex-col gap-1 border shadow-2xl transition-colors ${theme === 'light' ? 'border-slate-300 shadow-slate-300/40' : 'border-cyan-500/20'}`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className={`text-xs font-mono font-semibold tracking-wider ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
            ENGINEERING DUAL-TRACE OSCILLOSCOPE // 实时双通道示波器
          </span>
        </div>
        <div className={`flex items-center gap-3 text-[10px] font-mono ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
          <span>U_s: <strong className={electrical.isOverVoltage ? 'text-rose-600 font-bold' : (theme === 'light' ? 'text-cyan-700 font-bold' : 'text-cyan-300')}>{electrical.U_s.toFixed(0)}V</strong> / {electrical.U_max.toFixed(0)}V</span>
          <span>SAMPLING: 20 kS/s</span>
          <span className={`${theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'} font-semibold`}>TRIG: AUTO</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className={`w-full h-[140px] rounded border block transition-colors ${theme === 'light' ? 'bg-[#f8fafc] border-slate-300' : 'bg-[#0a0d14] border-slate-800'}`}
      />
    </div>
  );
};

import React, { useState, useCallback } from 'react';
import { SimulationState, ElectricalValues, OperatingMode } from '../types/motor';
import { CAMERA_PRESETS } from '../scene/cameraManager';
import { Oscilloscope } from './Oscilloscope';
import { PhysicsGuideModal, PhysicsTopicId, GuideModalTab } from './PhysicsGuideModal';
import { LatexMath } from './LatexMath';
import {
  Play, Pause, StepForward, RotateCcw, Eye, Layers, Compass,
  Activity, Cpu, Sliders, ChevronDown, ChevronUp, Zap, BookOpen, GraduationCap
} from './Icons';

export function getComponentChineseName(id: string | null): string {
  if (!id) return '';
  if (id.startsWith('magnet_')) return 'V型内置钕铁硼永磁体 (NdFeB PM 磁钢)';
  if (id.includes('bearing')) return '高速低摩擦陶瓷/深沟球轴承 (Bearings)';
  const map: Record<string, string> = {
    stator_laminated_core: '定子铁芯叠压总成 (0.25mm 极薄硅钢片)',
    hairpin_phase_u: 'U 相发卡式扁铜线绕组 (扭头激光焊)',
    hairpin_phase_v: 'V 相发卡式扁铜线绕组 (120° 电气角移相)',
    hairpin_phase_w: 'W 相发卡式扁铜线绕组 (高槽满率 75%+)',
    hairpin_weld_beads: '发卡绕组激光焊接端头 (波绕跨槽焊点)',
    rotor_permanent_magnets: 'V 型内置钕铁硼永磁体 (N48UH 强抗退磁)',
    rotor_laminated_core: 'V 型转子铁芯总成 (带极窄隔磁微桥)',
    cooling_water_jacket: '螺旋水道冷却外壳 (铸铝乙二醇回路)',
    oil_cooling_system: '定转子直喷油冷与空心轴离心油路 (ATF 介电油)',
    aluminum_housing_jacket: '高刚性铸铝轻量机壳 (抗扭减振 NVH 优化)',
    front_end_shield: '驱动端精密压铸前端盖 (集成前轴承室)',
    rear_end_shield: '非驱动端集成后端盖 (集成旋变屏蔽腔)',
    splined_shaft_assembly: '渐开线花键传动轴 (空心轴内喷油设计)',
    front_bearing: '高速电机前深沟球轴承 (驱动端)',
    rear_bearing: '高速电机后深沟球轴承 (非驱动端)',
    bearing_assemblies: '高速低摩擦电机轴承总成',
    resolver_sensor: '无刷变磁阻旋变传感器 (高精度角度闭环)'
  };
  return map[id] || id;
}

interface HUDProps {
  state: SimulationState;
  electrical: ElectricalValues;
  onUpdateState: (updates: Partial<SimulationState>) => void;
  onSelectCameraPreset: (presetId: string) => void;
  hoveredPartId: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  electrical,
  onUpdateState,
  onSelectCameraPreset,
  hoveredPartId
}) => {
  const [showOscilloscope, setShowOscilloscope] = useState(true);
  const [vectorTab, setVectorTab] = useState<'vectors' | 'torque' | 'foc' | 'thermal'>('vectors');
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTopic, setGuideTopic] = useState<PhysicsTopicId>('load_angle_mtpa');
  const [guideTab, setGuideTab] = useState<GuideModalTab>('ladder');
  const [guideStepIndex, setGuideStepIndex] = useState<number>(1);

  const openPhysicsTopic = useCallback((topic: PhysicsTopicId) => {
    setGuideTopic(topic);
    setGuideTab('topics');
    setGuideOpen(true);
    // Close 3D part inspection card if open so modals don't overlap
    onUpdateState({ selectedPartId: null });
  }, [onUpdateState]);

  const openPhysicsLadder = useCallback((stepNum: number = 1) => {
    setGuideStepIndex(stepNum);
    setGuideTab('ladder');
    setGuideOpen(true);
    onUpdateState({ selectedPartId: null });
  }, [onUpdateState]);

  const handleCloseGuide = useCallback(() => {
    setGuideOpen(false);
  }, []);

  const handleApplyDemo = useCallback((updates: Partial<SimulationState>, cameraPreset?: string) => {
    const presetObj = cameraPreset ? CAMERA_PRESETS.find(p => p.id === cameraPreset) : undefined;
    if (cameraPreset === 'water_jacket') {
      setVectorTab('thermal');
    }
    onUpdateState({
      ...(presetObj?.stateOverrides || {}),
      ...updates,
      ...(cameraPreset ? { currentPreset: cameraPreset } : {}),
      selectedPartId: null
    });
    if (cameraPreset) {
      onSelectCameraPreset(cameraPreset);
    }
  }, [onUpdateState, onSelectCameraPreset]);

  // Mechanical and electrical frequency
  const p = 4;
  const f_e = (p * state.rpm) / 60;
  const omega_m = (2 * Math.PI * state.rpm) / 60;
  const p_mech = (electrical.T_total * omega_m) / 1000; // kW
  const effectiveDeltaDeg = (Math.atan2(electrical.I_q, -electrical.I_d) * 180) / Math.PI;

  const isMotoring = electrical.T_total >= 0;
  const absTotalTorque = Math.max(0.01, Math.abs(electrical.T_pm) + Math.abs(electrical.T_rel));
  const pmShare = Math.round((Math.abs(electrical.T_pm) / absTotalTorque) * 100);
  const relShare = 100 - pmShare;

  // Real-time Water Jacket Coolant & Thermal Balance Calculations
  const totalHeatLossW = electrical.copperLoss + electrical.ironLoss;
  const coolantFlowLpm = 8.5 + 7.5 * Math.min(1, state.rpm / 12000); // 8.5 ~ 16.0 L/min
  const inletTempC = 35.0;
  // Coolant temperature rise across 8-turn spiral channel + stator-to-coolant interface delta
  const outletTempC = inletTempC + (totalHeatLossW / (coolantFlowLpm * 165)) + (totalHeatLossW / 420);
  const statorHotspotTempC = outletTempC + (electrical.copperLoss / 155) + (electrical.ironLoss / 220);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* 1. TOP TELEMETRY BAR */}
      <header className="pointer-events-auto flex items-center justify-between glass-panel px-4 py-2.5 rounded-xl border border-cyan-500/25">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Cpu size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-white uppercase font-mono">
                IPMSM 永磁同步电机 3D 电磁原理解析实验室
              </h1>
              <button
                type="button"
                onClick={() => openPhysicsLadder(1)}
                className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-950 to-cyan-950 hover:from-emerald-900 hover:to-cyan-900 text-emerald-300 border border-emerald-400/50 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all cursor-pointer font-bold"
                title="点击进入高中物理平权阶梯导读（从安培力到 FOC 矢量控制）"
              >
                <GraduationCap size={13} className="text-emerald-400" />
                <span>🎓 高中物理平权导读 (5步搞懂电机)</span>
              </button>
              <button
                type="button"
                onClick={() => openPhysicsTopic('8p48s')}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-500/40 flex items-center gap-1 transition-colors cursor-pointer"
                title="点击查看什么是 8极48槽 (8P48S) 与发卡式扁线绕组"
              >
                <span>8P48S 发卡式扁线</span>
                <span className="text-cyan-300 font-bold">?</span>
              </button>
              <button
                type="button"
                onClick={() => openPhysicsTopic('load_angle_mtpa')}
                className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-gradient-to-r from-cyan-950 to-indigo-950 hover:from-cyan-900 hover:to-indigo-900 text-cyan-300 border border-cyan-400/50 flex items-center gap-1 shadow-[0_0_10px_rgba(0,242,254,0.2)] transition-all cursor-pointer"
              >
                <BookOpen size={11} />
                <span>📖 物理与电磁原理全解 (LaTeX)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>8极 (<LatexMath math="p=4" />) · 48槽定子 · V型内置钕铁硼转子 (<LatexMath math="L_q > L_d" /> 逆凸极效应) · FOC 矢量解耦控制</span>
            </p>
          </div>
        </div>

        {/* Real-time Telemetry Metrics */}
        <div className="flex items-center gap-3.5 text-xs font-mono">
          {/* Operating Mode Badge */}
          <button
            type="button"
            onClick={() => openPhysicsTopic(state.operatingMode === 'regen' || !isMotoring ? 'regen_braking' : state.fluxWeakeningCurrent < -10 ? 'dq_decoupling' : 'load_angle_mtpa')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 cursor-pointer transition-colors"
            title="点击查看当前工况物理原理"
          >
            <span className="text-slate-400 text-[10px]">MODE:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
              state.operatingMode === 'regen' || !isMotoring
                ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                : state.fluxWeakeningCurrent < -10
                ? 'bg-indigo-950 text-indigo-400 border border-indigo-500/40'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
            }`}>
              {state.operatingMode === 'regen' || !isMotoring
                ? 'REGEN BRAKING (动能回收发电)'
                : state.fluxWeakeningCurrent < -10
                ? 'FLUX WEAKENING (弱磁扩速)'
                : 'MOTORING (电动牵引驱动)'}
            </span>
          </button>

          {/* Speed */}
          <div className="flex flex-col items-end" title="机械转速 n (RPM)：转子每分钟实际旋转圈数">
            <span className="text-[10px] text-slate-400">机械转速 SPEED</span>
            <span className="text-cyan-400 font-bold text-sm tracking-wider">
              {state.rpm.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">RPM</span>
            </span>
          </div>

          {/* Electrical Frequency */}
          <div className="flex flex-col items-end" title="电频率 f_e = (p × RPM)/60：定子三相正弦交流电每秒交变周期数">
            <span className="text-[10px] text-slate-400">
              电频率 <LatexMath math="f_e = \frac{p \cdot n}{60}" />
            </span>
            <span className="text-slate-200 font-bold text-sm">
              {f_e.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">Hz</span>
            </span>
          </div>

          {/* Stator Terminal Voltage vs Inverter Limit */}
          <div
            className="flex flex-col items-end cursor-pointer"
            onClick={() => openPhysicsTopic('base_speed')}
            title="定子端电压 U_s = √(U_d² + U_q²) vs 逆变器最大相电压幅值 U_dc/√3 = 260V（点击查看电压椭圆原理）"
          >
            <span className="text-[10px] text-slate-400">
              端电压 <LatexMath math="U_s / U_{\max}" />
            </span>
            <span className={`font-bold text-sm ${electrical.isOverVoltage ? 'text-rose-400 animate-pulse' : 'text-indigo-300'}`}>
              {electrical.U_s.toFixed(0)}
              <span className="text-[10px] text-slate-400 font-normal">/{electrical.U_max.toFixed(0)}V</span>
            </span>
          </div>

          {/* Torque */}
          <div className="flex flex-col items-end" title="合成电磁转矩 T_e = 永磁转矩 T_pm + 磁阻转矩 T_rel">
            <span className="text-[10px] text-slate-400">
              合成转矩 <LatexMath math="T_e" />
            </span>
            <span className={`font-bold text-sm ${isMotoring ? 'text-amber-400' : 'text-rose-400'}`}>
              {electrical.T_total.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">Nm</span>
            </span>
          </div>

          {/* Power */}
          <div className="flex flex-col items-end" title="机械轴输出功率 P = T_e × ω_m">
            <span className="text-[10px] text-slate-400">
              机械功率 <LatexMath math="P_m" />
            </span>
            <span className="text-slate-100 font-bold text-sm">
              {p_mech.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">kW</span>
            </span>
          </div>

          {/* Efficiency */}
          <div className="flex flex-col items-end" title="考虑定子铜损与铁芯损耗后的实时效率 η">
            <span className="text-[10px] text-slate-400">
              综合效率 <LatexMath math="\eta" />
            </span>
            <span className="text-emerald-400 font-bold text-sm">
              {electrical.efficiency.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">%</span>
            </span>
          </div>
        </div>
      </header>

      {/* 3D VECTOR, TORQUE, FOC & WATER JACKET THERMAL REAL-TIME ANALYSIS CARD */}
      {(state.showVectors || state.currentPreset === 'water_jacket') && (
        <div className="pointer-events-auto absolute top-[72px] left-[354px] w-[392px] glass-panel rounded-xl p-3 border border-cyan-500/30 flex flex-col gap-2 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
              <Compass size={13} className="text-cyan-400" />
              <span>{vectorTab === 'thermal' ? '螺旋水冷热管理与损耗散热解析' : '3D 磁场矢量与转矩角解析'}</span>
            </div>
            <button
              type="button"
              onClick={() => openPhysicsTopic('8p48s')}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 cursor-pointer transition-colors"
            >
              8极 / 4对极 (<LatexMath math="p=4" />) ?
            </button>
          </div>

          {/* 4 Mini-Tabs inside Analysis Card */}
          <div className="grid grid-cols-4 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setVectorTab('vectors')}
              className={`py-1 rounded transition-colors cursor-pointer ${
                vectorTab === 'vectors'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. 矢量d-q
            </button>
            <button
              type="button"
              onClick={() => setVectorTab('torque')}
              className={`py-1 rounded transition-colors cursor-pointer ${
                vectorTab === 'torque'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. 双转矩
            </button>
            <button
              type="button"
              onClick={() => setVectorTab('foc')}
              className={`py-1 rounded transition-colors cursor-pointer ${
                vectorTab === 'foc'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. FOC变换
            </button>
            <button
              type="button"
              onClick={() => setVectorTab('thermal')}
              className={`py-1 rounded transition-colors cursor-pointer ${
                vectorTab === 'thermal'
                  ? 'bg-sky-950 text-sky-300 border border-sky-400/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4. 水油双冷
            </button>
          </div>

          {vectorTab === 'vectors' && (
            <>
              <div className="flex flex-col gap-1.5 text-xs">
                {/* Fr: Red */}
                <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-red-950/35 border border-red-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] shrink-0" />
                      <span className="text-red-300 font-bold">
                        <LatexMath math="\vec{F}_r" /> (转子永磁主磁通 · <LatexMath math="d" /> 轴)
                      </span>
                    </div>
                    <span className="text-slate-300 text-[10px]">
                      <LatexMath math="\psi_{\text{pm}} = 0.082\text{ Wb}" />
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-4 leading-snug">
                    直轴 (<LatexMath math="d" />轴) 锁定转子 N 极中心。直轴电流 <strong className="text-indigo-300 font-mono">I_d = {electrical.I_d.toFixed(0)} A</strong>（<LatexMath math="I_d < 0" /> 去磁弱磁）。
                  </p>
                </div>

                {/* Fs: Yellow */}
                <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-amber-950/35 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] shrink-0" />
                      <span className="text-amber-300 font-bold">
                        <LatexMath math="\vec{F}_s" /> (定子合成旋转磁势)
                      </span>
                    </div>
                    <span className="text-amber-200 text-[10px] font-mono font-bold">
                      {effectiveDeltaDeg >= 0 ? '超前' : '滞后'} {Math.abs(effectiveDeltaDeg).toFixed(1)}°
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-4 leading-snug">
                    由 <LatexMath math="(I_d, I_q)" /> 合成的旋转磁势矢量：超前 <LatexMath math="\vec{F}_r" /> 时牵引转子驱动，滞后时产生制动转矩发电。
                  </p>
                </div>

                {/* Iq: Green */}
                <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-emerald-950/35 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] shrink-0" />
                      <span className="text-emerald-300 font-bold">
                        <LatexMath math="I_q" /> (交轴转矩电流 · <LatexMath math="q" /> 轴)
                      </span>
                    </div>
                    <span className="text-emerald-200 text-[10px] font-mono font-bold">
                      {electrical.I_q.toFixed(1)} A ({electrical.I_q >= 0 ? '+q 电动' : '-q 发电'})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-4 leading-snug">
                    交轴 (<LatexMath math="q" />轴) 超前 <LatexMath math="d" /> 轴 <LatexMath math="90^\circ" /> 电角度（<LatexMath math="22.5^\circ" /> 空间角），专门产生切向洛伦兹推力。
                  </p>
                </div>
              </div>

              {/* Torque Angle Electrical vs Mechanical Mapping */}
              <div className="pt-1 border-t border-slate-800/80 flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between items-center text-slate-300 whitespace-nowrap">
                  <span className="text-slate-400">
                    电角度 <LatexMath math="\delta_e" /> vs 空间角 <LatexMath math="\delta_m = \frac{\delta_e}{4}" />:
                  </span>
                  <span className="font-mono">
                    <strong className={effectiveDeltaDeg >= 0 ? 'text-amber-400' : 'text-rose-400'}>
                      {effectiveDeltaDeg >= 0 ? '+' : ''}{effectiveDeltaDeg.toFixed(1)}°
                    </strong>
                    <span className="text-slate-500 mx-1">→</span>
                    <strong className="text-cyan-300">
                      {effectiveDeltaDeg >= 0 ? '+' : ''}{(effectiveDeltaDeg / 4).toFixed(2)}°
                    </strong>
                  </span>
                </div>
                <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                  💡 <strong>极对数映射</strong>：<LatexMath math="\theta_e = p \cdot \theta_m = 4\theta_m" />，故 <LatexMath math="90^\circ" /> 电角度在 3D 空间中严格对应 <LatexMath math="22.5^\circ" /> 机械夹角。
                </div>
              </div>
            </>
          )}

          {vectorTab === 'torque' && (
            <div className="flex flex-col gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-950/95 border border-amber-500/30">
                <div className="text-[10px] text-amber-300 font-bold mb-1">
                  IPMSM 双分量电磁转矩方程 (LaTeX)：
                </div>
                <div className="text-amber-200 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-center">
                  <LatexMath block math="T_e = \frac{3}{2} p \Bigl[ \psi_{\text{pm}} I_q + (L_d - L_q) I_d I_q \Bigr]" className="text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex flex-col">
                  <span className="text-[10px] text-cyan-300">
                    永磁转矩 <LatexMath math="T_{\text{pm}}" /> ({pmShare}%)
                  </span>
                  <span className="text-sm font-mono font-bold text-white mt-0.5">{electrical.T_pm.toFixed(1)} Nm</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    永磁磁场直接吸斥 (<LatexMath math="\propto \sin\delta" />)
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 flex flex-col">
                  <span className="text-[10px] text-purple-300">
                    磁阻转矩 <LatexMath math="T_{\text{rel}}" /> ({relShare}%)
                  </span>
                  <span className="text-sm font-mono font-bold text-white mt-0.5">{electrical.T_rel.toFixed(1)} Nm</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    逆凸极 <LatexMath math="L_q > L_d" /> 激发 (<LatexMath math="\propto \sin 2\delta" />)
                  </span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 leading-relaxed">
                🔍 <strong>逆凸极机理</strong>：V型磁钢槽阻碍 <LatexMath math="d" /> 轴磁路（<LatexMath math="L_d=0.38\text{ mH}" />），而 <LatexMath math="q" /> 轴沿硅钢片闭合（<LatexMath math="L_q=0.92\text{ mH}" />）。当注入 <LatexMath math="I_d < 0" /> 时，<LatexMath math="(L_d - L_q)I_d > 0" /> 产生额外磁阻转矩！
              </div>

              <button
                type="button"
                onClick={() => openPhysicsTopic('reluctance_torque')}
                className="w-full py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-[10px] font-bold cursor-pointer transition-colors"
              >
                📖 打开《永磁转矩 vs 凸极磁阻转矩》LaTeX 完整推导 →
              </button>
            </div>
          )}

          {vectorTab === 'foc' && (
            <div className="flex flex-col gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-950/95 border border-emerald-500/30 flex flex-col gap-1.5">
                <div className="text-[10px] text-emerald-300 font-bold">
                  1. 定子三相正弦交流电 <LatexMath math="(I_u, I_v, I_w)" />:
                </div>
                <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-mono">
                  <div className="p-1 rounded bg-red-950/50 border border-red-500/30 text-red-300">
                    I_u: <strong>{electrical.I_u.toFixed(0)}A</strong>
                  </div>
                  <div className="p-1 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">
                    I_v: <strong>{electrical.I_v.toFixed(0)}A</strong>
                  </div>
                  <div className="p-1 rounded bg-blue-950/50 border border-blue-500/30 text-blue-300">
                    I_w: <strong>{electrical.I_w.toFixed(0)}A</strong>
                  </div>
                </div>
                <div className="text-[10px] text-cyan-300 font-bold mt-0.5">
                  2. Clarke + Park 旋转变换 <LatexMath math="\to (I_d, I_q)" /> 直流解耦:
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-center text-[11px] font-mono">
                  <div className="p-1 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-200">
                    I_d: <strong>{electrical.I_d.toFixed(1)} A</strong>
                  </div>
                  <div className="p-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
                    I_q: <strong>{electrical.I_q.toFixed(1)} A</strong>
                  </div>
                </div>
              </div>

              <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center text-cyan-200">
                <LatexMath block math="\begin{bmatrix} I_d \\ I_q \end{bmatrix} = \mathbf{T}_{\text{Park}}(\theta_e) \cdot \mathbf{T}_{\text{Clarke}} \begin{bmatrix} I_u \\ I_v \\ I_w \end{bmatrix}" className="text-[11px]" />
              </div>

              <button
                type="button"
                onClick={() => openPhysicsTopic('clarke_park')}
                className="w-full py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold cursor-pointer transition-colors"
              >
                📖 打开《Clarke / Park 坐标变换矩阵》LaTeX 全解 →
              </button>
            </div>
          )}

          {vectorTab === 'thermal' && (
            <div className="flex flex-col gap-1.5 text-xs">
              {/* 1. Outer Spiral Water Jacket Bar */}
              <div className="p-2 rounded-lg bg-slate-950/95 border border-sky-500/35 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-cyan-300 font-bold">
                    🟦 外圈螺旋水路 (+Z {inletTempC.toFixed(0)}°C)
                  </span>
                  <span className="text-slate-400">
                    水流量 <strong className="text-sky-300">{coolantFlowLpm.toFixed(1)} L/m</strong>
                  </span>
                  <span className="text-orange-400 font-bold">
                    🟧 出水 {outletTempC.toFixed(1)}°C
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#00f2fe] via-[#10b981] to-[#ff5500] border border-slate-700/80" />
              </div>

              {/* 2. Inner Direct Oil-Spray Ring & Hollow-Shaft Oil Circuit */}
              <div className="p-2 rounded-lg bg-amber-950/35 border border-amber-500/40 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-300 font-bold">
                    🟨 内圈直喷油路 (32孔淋油环 + 空心轴甩油)
                  </span>
                  <span className="text-amber-200 font-bold">
                    {(6.5 + 5.5 * Math.min(1, state.rpm / 12000)).toFixed(1)} L/m
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  顶部黄铜油轨供油 → 前后双端喷油环直淋<strong>发卡冠部/焊点</strong> + <strong>空心轴离心甩油</strong>冷却磁钢 → 底部集油槽排油。
                </p>
              </div>

              {/* 3. Dual Thermal Loss Breakdown */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 flex flex-col">
                  <span className="text-[10px] text-amber-300 font-semibold">
                    绕组焦耳铜损 <LatexMath math="P_{\text{cu}}" />
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {(electrical.copperLoss / 1000).toFixed(2)} kW <span className="text-[9px] text-amber-300 font-normal">({electrical.copperLoss.toFixed(0)}W)</span>
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-sky-950/40 border border-sky-500/30 flex flex-col">
                  <span className="text-[10px] text-sky-300 font-semibold">
                    硅钢片高频铁损 <LatexMath math="P_{\text{fe}}" />
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {(electrical.ironLoss / 1000).toFixed(2)} kW <span className="text-[9px] text-sky-300 font-normal">({electrical.ironLoss.toFixed(0)}W)</span>
                  </span>
                </div>
              </div>

              {/* 4. Interactive Thermal Stress Scenarios */}
              <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
                <button
                  type="button"
                  onClick={() => onUpdateState({
                    phaseCurrentMagnitude: 140,
                    rpm: 1500,
                    fluxWeakeningCurrent: 0,
                    loadAngle: 48,
                    cutawayEnabled: true,
                    showParticles: true
                  })}
                  className="py-1 px-1 rounded bg-slate-900 hover:bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 cursor-pointer transition-colors"
                >
                  ❄️ 轻载低温巡航
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateState({
                    phaseCurrentMagnitude: 350,
                    rpm: 3500,
                    fluxWeakeningCurrent: 0,
                    loadAngle: 48,
                    cutawayEnabled: true,
                    showParticles: true
                  })}
                  className="py-1 px-1 rounded bg-slate-900 hover:bg-amber-950/80 text-amber-300 border border-amber-500/40 cursor-pointer transition-colors"
                >
                  🔥 350A 满载铜损
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateState({
                    phaseCurrentMagnitude: 280,
                    rpm: 12000,
                    fluxWeakeningCurrent: -130,
                    loadAngle: 48,
                    cutawayEnabled: true,
                    showParticles: true
                  })}
                  className="py-1 px-1 rounded bg-slate-900 hover:bg-rose-950/80 text-rose-300 border border-rose-500/40 cursor-pointer transition-colors"
                >
                  ⚡ 12000转甩油
                </button>
              </div>

              {/* 5. Dual Encyclopedia Inspection Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateState({ selectedPartId: 'cooling_water_jacket' })}
                  className="py-1.5 px-1.5 rounded-lg bg-sky-950/70 hover:bg-sky-900/70 border border-sky-400/40 text-sky-200 text-[9.5px] font-bold cursor-pointer transition-colors"
                >
                  🟦 螺旋水道结构百科 →
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateState({ selectedPartId: 'oil_cooling_system' })}
                  className="py-1.5 px-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/70 border border-amber-400/40 text-amber-200 text-[9.5px] font-bold cursor-pointer transition-colors"
                >
                  🟨 直喷油冷回路百科 →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MIDDLE WORKSPACE: LEFT CONTROL DECK & RIGHT PRESET DOCK */}
      <div className="flex-1 flex justify-between items-start my-2.5 overflow-hidden">
        {/* LEFT CONTROLS DECK */}
        <div className="pointer-events-auto w-[340px] glass-panel rounded-xl p-3 flex flex-col gap-3 max-h-[calc(100vh-235px)] overflow-y-auto">
          {/* Header Controls */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
              <Sliders size={14} />
              <span>物理参数与工况控制台</span>
            </div>
            {/* Play/Pause/Step Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateState({ isPlaying: !state.isPlaying })}
                className={`p-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                  state.isPlaying
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                }`}
                title={state.isPlaying ? "暂停仿真" : "继续运行"}
              >
                {state.isPlaying ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateState({
                    isPlaying: false,
                    theta_m: (state.theta_m + (10 * Math.PI) / 180) % (Math.PI * 2),
                    theta_e: (state.theta_e + (40 * Math.PI) / 180) % (Math.PI * 2)
                  });
                }}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="单步微调 (+10° 机械角 / +40° 电角度)"
              >
                <StepForward size={13} />
              </button>
              <button
                type="button"
                onClick={() => onUpdateState({ theta_m: 0, theta_e: 0, time: 0 })}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="重置相位角为 0°"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* 1. Speed (RPM) Slider */}
          <div className="flex flex-col gap-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs font-mono whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-semibold">机械转速 (<LatexMath math="n" />)</span>
                <button
                  type="button"
                  onClick={() => openPhysicsTopic('base_speed')}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 cursor-pointer shrink-0"
                >
                  ? 基速原理
                </button>
              </div>
              <span className="text-cyan-400 font-bold">{state.rpm} RPM</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              4500 RPM 为<strong>基速拐点</strong>：反电动势 <LatexMath math="E_0 = \omega_e \psi_{\text{pm}}" /> 触及母线电压上限，低于基速为<span className="text-cyan-300">恒转矩区</span>，高于基速进入<span className="text-indigo-300">恒功率弱磁区</span>。
            </p>
            <input
              type="range"
              min="1"
              max="16000"
              step="1"
              value={state.rpm}
              onChange={(e) => onUpdateState({ rpm: Number(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-0.5"
            />
            {/* Quick Speed Buttons */}
            <div className="grid grid-cols-4 gap-1 mt-0.5">
              {[
                { label: '1 RPM (慢镜)', val: 1 },
                { label: '1000', val: 1000 },
                { label: '4500 (基速)', val: 4500 },
                { label: '12000 (极速)', val: 12000 }
              ].map(item => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => onUpdateState({ rpm: item.val })}
                  className={`text-[9px] font-mono py-1 rounded border transition-colors cursor-pointer ${
                    state.rpm === item.val
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Load Angle delta Slider */}
          <div className="flex flex-col gap-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs font-mono whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-semibold">负载转矩角 (<LatexMath math="\delta" />)</span>
                <button
                  type="button"
                  onClick={() => openPhysicsTopic('load_angle_mtpa')}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/30 cursor-pointer shrink-0"
                >
                  ? MTPA原理
                </button>
              </div>
              <span className={`font-bold ${state.loadAngle >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {state.loadAngle >= 0 ? '+' : ''}{state.loadAngle}°
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              定子 <LatexMath math="\vec{F}_s" /> 超前转子 <LatexMath math="\vec{F}_r" /> 的电角度：<span className="text-amber-300">MTPA (+48°)</span> 下 <LatexMath math="\sin\delta" /> 与 <LatexMath math="\sin 2\delta" /> 合力最大；<LatexMath math="\delta < 0^\circ" /> 时切换为再生制动发电。
            </p>
            <input
              type="range"
              min="-90"
              max="90"
              step="1"
              value={state.loadAngle}
              onChange={(e) => {
                const val = Number(e.target.value);
                onUpdateState({
                  loadAngle: val,
                  operatingMode: val < 0 ? 'regen' : 'motoring'
                });
              }}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-0.5"
            />
            {/* Quick Angle Modes */}
            <div className="grid grid-cols-3 gap-1 mt-0.5">
              {[
                { label: 'MTPA (+48° 最优)', val: 48, mode: 'motoring' as OperatingMode },
                { label: '纯交轴 (+90°)', val: 90, mode: 'motoring' as OperatingMode },
                { label: '动能回收 (-45°)', val: -45, mode: 'regen' as OperatingMode }
              ].map(item => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => onUpdateState({ loadAngle: item.val, operatingMode: item.mode })}
                  className={`text-[9px] font-mono py-1 rounded border transition-colors cursor-pointer ${
                    state.loadAngle === item.val
                      ? 'bg-amber-950 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Flux Weakening Current Id */}
          <div className="flex flex-col gap-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs font-mono whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-semibold">直轴弱磁电流 (<LatexMath math="I_d" />)</span>
                <button
                  type="button"
                  onClick={() => openPhysicsTopic('dq_decoupling')}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 cursor-pointer shrink-0"
                >
                  ? 弱磁解耦
                </button>
              </div>
              <span className="text-indigo-400 font-bold">
                {state.fluxWeakeningCurrent === 0 ? `自动正交分解 (${electrical.I_d.toFixed(0)}A)` : `手动弱磁 ${state.fluxWeakeningCurrent} A`}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              沿 <LatexMath math="d" /> 轴注入负向去磁电流 <LatexMath math="I_d < 0" />，削弱合成磁链 <LatexMath math="\psi_d = \psi_{\text{pm}} + L_d I_d" />，抑制高速反电势并激发凸极磁阻转矩。
            </p>
            <input
              type="range"
              min="-150"
              max="0"
              step="5"
              value={state.fluxWeakeningCurrent}
              onChange={(e) => onUpdateState({ fluxWeakeningCurrent: Number(e.target.value) })}
              className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-0.5"
            />
            {electrical.isOverVoltage && (
              <div className="mt-1 p-1.5 rounded bg-rose-950/60 border border-rose-500/40 flex items-center justify-between gap-2 text-[10px] text-rose-200">
                <span>
                  ⚠️ 端电压 <strong className="font-mono">{electrical.U_s.toFixed(0)}V</strong> 超出 800V 母线极限 <strong className="font-mono">{electrical.U_max.toFixed(0)}V</strong>！
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateState({
                      fluxWeakeningCurrent: -145,
                      phaseCurrentMagnitude: 165,
                      loadAngle: 48
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold shrink-0 cursor-pointer transition-colors"
                >
                  一键弱磁降压
                </button>
              </div>
            )}
          </div>

          {/* 4. Phase Current Magnitude Im */}
          <div className="flex flex-col gap-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs font-mono whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-semibold">相电流幅值 (<LatexMath math="I_m" />)</span>
                <button
                  type="button"
                  onClick={() => openPhysicsTopic('clarke_park')}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 cursor-pointer shrink-0"
                >
                  ? 三相电流
                </button>
              </div>
              <span className="text-emerald-400 font-bold">{state.phaseCurrentMagnitude} A</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              逆变器注入 U/V/W 绕组的正弦电流幅值 <LatexMath math="I_m = \sqrt{I_d^2 + I_q^2}" />，直接决定定子合成磁势 <LatexMath math="\vec{F}_s" /> 与输出转矩。
            </p>
            <input
              type="range"
              min="10"
              max="350"
              step="5"
              value={state.phaseCurrentMagnitude}
              onChange={(e) => onUpdateState({ phaseCurrentMagnitude: Number(e.target.value) })}
              className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-0.5"
            />
          </div>

          {/* Axial Exploded View Slider */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300">轴向爆炸拆解 (Exploded View)</span>
              <span className="text-cyan-400 font-bold">{Math.round(state.explodedProgress * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.explodedProgress}
              onChange={(e) => onUpdateState({ explodedProgress: Number(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => onUpdateState({ explodedProgress: state.explodedProgress > 0.5 ? 0 : 1 })}
                className="flex-1 py-1 rounded text-[10px] font-mono font-semibold bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 transition-colors cursor-pointer"
              >
                {state.explodedProgress > 0.5 ? "一键复原组装" : "一键轴向爆炸分解"}
              </button>
            </div>
          </div>

          {/* Visual Toggles */}
          <div className="flex flex-col gap-2 pt-1.5 border-t border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
              可视化图层开关 (VISUAL LAYERS)
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => onUpdateState({ cutawayEnabled: !state.cutawayEnabled })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  state.cutawayEnabled
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Eye size={12} />
                <span>剖切透视 (Cutaway)</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateState({ showVectors: !state.showVectors })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  state.showVectors
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Compass size={12} />
                <span>3D 磁场矢量</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateState({ showFluxLines: !state.showFluxLines })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  state.showFluxLines
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Activity size={12} />
                <span>气隙磁力线</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateState({ showParticles: !state.showParticles })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  state.showParticles
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Zap size={12} />
                <span>绕组电流粒子</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateState({ wireframeEnabled: !state.wireframeEnabled })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors col-span-2 cursor-pointer ${
                  state.wireframeEnabled
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Layers size={12} />
                <span>硅钢片线框拓扑 (Wireframe)</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT CAMERA PRESETS DOCK */}
        <div className="pointer-events-auto w-[290px] glass-panel rounded-xl p-3 flex flex-col gap-2 max-h-[calc(100vh-235px)] overflow-y-auto">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 border-b border-slate-800 pb-2">
            <Compass size={14} />
            <span>10 大专业机位视角 (CAMERA PRESETS)</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {CAMERA_PRESETS.map((preset) => {
              const isSelected = state.currentPreset === preset.id;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => {
                    if (preset.id === 'water_jacket') {
                      setVectorTab('thermal');
                    } else if (vectorTab === 'thermal') {
                      setVectorTab('vectors');
                    }
                    onUpdateState({
                      ...preset.stateOverrides,
                      currentPreset: preset.id
                    });
                    onSelectCameraPreset(preset.id);
                  }}
                  className={`text-left p-2 rounded-lg border transition-all flex flex-col gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500/60 shadow-[0_0_12px_rgba(0,242,254,0.2)]'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-semibold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {preset.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {preset.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans line-clamp-1">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM OSCILLOSCOPE DOCK */}
      <footer className="pointer-events-auto flex flex-col gap-1 w-full max-w-[820px] mx-auto">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowOscilloscope(!showOscilloscope)}
            className="flex items-center gap-1 px-3 py-1 rounded-t-lg bg-slate-900/90 border-t border-x border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>{showOscilloscope ? '收起示波器' : '展开实时双波示波器'}</span>
            {showOscilloscope ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {showOscilloscope && (
          <Oscilloscope electrical={electrical} state={state} />
        )}
      </footer>

      {/* Hover tooltip for 3D parts */}
      {hoveredPartId && !guideOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-none px-3.5 py-1.5 rounded-lg glass-panel-glow text-xs font-mono text-cyan-300 flex items-center gap-2 border border-cyan-500/40 shadow-xl">
          <Activity size={13} className="text-cyan-400 animate-pulse" />
          <span>点击部件查看深度工程解析: <strong className="text-white font-bold">{getComponentChineseName(hoveredPartId)}</strong></span>
        </div>
      )}

      {/* Interactive Physics & Electromagnetic Theory Guide Modal */}
      <PhysicsGuideModal
        isOpen={guideOpen}
        initialTopicId={guideTopic}
        initialTab={guideTab}
        initialStepIndex={guideStepIndex}
        onClose={handleCloseGuide}
        onApplyDemo={handleApplyDemo}
      />
    </div>
  );
};

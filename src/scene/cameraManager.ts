import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SimulationState } from '../types/motor';

export interface CameraPreset {
  id: string;
  name: string;
  category: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  description: string;
  stateOverrides?: Partial<SimulationState>;
}

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'isometric',
    name: '全景透视 (Isometric)',
    category: '总览',
    position: new THREE.Vector3(280, 200, 310),
    target: new THREE.Vector3(0, 0, 0),
    description: '标准工业视角，完整展示铝机壳、端部发卡绕组、转轴花键与气隙结构',
    stateOverrides: {
      explodedProgress: 0,
      cutawayEnabled: false
    }
  },
  {
    id: 'airgap_vectors',
    name: '气隙与磁场矢量 (Air-Gap & Vectors)',
    category: '电磁',
    position: new THREE.Vector3(0, 0, 310),
    target: new THREE.Vector3(0, 0, 0),
    description: '正对横截面，观察定子合成磁势 Fs 与转子磁通 Fr 旋转同步与负载角 delta',
    stateOverrides: {
      explodedProgress: 0,
      cutawayEnabled: true,
      showVectors: true,
      showFluxLines: true
    }
  },
  {
    id: 'hairpin_end',
    name: '发卡绕组端部特写 (Hairpin Windings)',
    category: '绕组',
    position: new THREE.Vector3(70, 110, 160),
    target: new THREE.Vector3(0, 45, 60),
    description: '近距观察矩形铜扁线跨槽冠部与焊点立体交错结构',
    stateOverrides: {
      explodedProgress: 0,
      cutawayEnabled: true,
      showParticles: true
    }
  },
  {
    id: 'v_rotor_flux',
    name: 'V型转子磁路 (V-Rotor Barriers)',
    category: '转子',
    position: new THREE.Vector3(85, 42, 225),
    target: new THREE.Vector3(-14, -24, 35),
    description: '特写 8 极 V 型钕铁硼永磁体（内侧汇聚、外侧向气隙张开）、隔磁桥与聚磁效应',
    stateOverrides: {
      explodedProgress: 0,
      cutawayEnabled: true,
      showFluxLines: true,
      showVectors: false
    }
  },
  {
    id: 'exploded_view',
    name: '轴向爆炸全景 (Full Exploded View)',
    category: '机械',
    position: new THREE.Vector3(460, 260, 280),
    target: new THREE.Vector3(0, 0, 0),
    description: '全景广角机位，观察前后端盖、轴承、转子与定子沿轴向完整分离拉开',
    stateOverrides: {
      explodedProgress: 1.0,
      cutawayEnabled: false
    }
  },
  {
    id: 'resolver_shaft',
    name: '转轴花键与旋变 (Shaft & Resolver)',
    category: '机械',
    position: new THREE.Vector3(-145, 95, -150),
    target: new THREE.Vector3(0, 0, -185),
    description: '观察电机尾部高精度旋变角度传感器与轴承锁紧机构',
    stateOverrides: {
      explodedProgress: 0.35,
      cutawayEnabled: false
    }
  },
  {
    id: 'water_jacket',
    name: '水油双路冷却 (Water & Oil Cooling)',
    category: '冷却',
    position: new THREE.Vector3(285, 88, 255),
    target: new THREE.Vector3(-42, -26, 12),
    description: '外圈 8 匝冰青色螺旋水套 + 内圈顶部喷油淋浴、空心轴导油、轴承滚珠浸没油池与底部深层绕组/定转子浸没油池',
    stateOverrides: {
      explodedProgress: 0,
      cutawayEnabled: true,
      showParticles: true,
      showVectors: false,
      showFluxLines: false
    }
  },
  {
    id: 'stator_slots',
    name: '定子槽齿与气隙 (Stator Slot Teeth)',
    category: '定子',
    position: new THREE.Vector3(95, 55, 85),
    target: new THREE.Vector3(68, 0, 0),
    description: '观察 48 槽齿冠形状、绝缘层与 0.8mm 精密物理气隙',
    stateOverrides: {
      explodedProgress: 0,
      cutawayEnabled: true
    }
  },
  {
    id: 'flux_weakening',
    name: '弱磁扩速高转速 (Flux Weakening)',
    category: '工况',
    position: new THREE.Vector3(180, 140, 260),
    target: new THREE.Vector3(0, 0, 20),
    description: '高速工况下注入负 Id 抵消永磁体磁通，直击反电动势限制解除',
    stateOverrides: {
      explodedProgress: 0,
      cutawayEnabled: true,
      showVectors: true,
      rpm: 12000,
      fluxWeakeningCurrent: -110,
      operatingMode: 'flux_weakening'
    }
  },
  {
    id: 'regen_braking',
    name: '动能回收制动 (Regen Braking)',
    category: '工况',
    position: new THREE.Vector3(-190, 130, 260),
    target: new THREE.Vector3(0, 0, 0),
    description: '转矩角反转为负值，定子磁场拖拽转子发电，能量流反向',
    stateOverrides: {
      explodedProgress: 0,
      cutawayEnabled: true,
      showVectors: true,
      loadAngle: -45,
      operatingMode: 'regen'
    }
  }
];

export class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isTransitioning: boolean = false;
  private startPos: THREE.Vector3 = new THREE.Vector3();
  private endPos: THREE.Vector3 = new THREE.Vector3();
  private startTarget: THREE.Vector3 = new THREE.Vector3();
  private endTarget: THREE.Vector3 = new THREE.Vector3();
  private startSpherical: THREE.Spherical = new THREE.Spherical();
  private endSpherical: THREE.Spherical = new THREE.Spherical();
  private currentSpherical: THREE.Spherical = new THREE.Spherical();
  private tempOffset: THREE.Vector3 = new THREE.Vector3();
  private useSphericalInterp: boolean = false;
  private transitionProgress: number = 0;
  private transitionDuration: number = 1.0; // seconds
  private readonly onControlsStart: () => void;

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;

    // Immediately yield camera control to the user when manual pan/rotate/zoom begins
    this.onControlsStart = () => {
      this.isTransitioning = false;
    };
    this.controls.addEventListener('start', this.onControlsStart);
  }

  public setPreset(presetId: string, duration: number = 1.0): void {
    const preset = CAMERA_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    this.startPos.copy(this.camera.position);
    this.endPos.copy(preset.position);
    this.startTarget.copy(this.controls.target);
    this.endTarget.copy(preset.target);

    // Compute spherical coordinates relative to respective targets
    const startOffset = this.tempOffset.subVectors(this.startPos, this.startTarget);
    this.startSpherical.setFromVector3(startOffset);

    const endOffset = this.tempOffset.subVectors(this.endPos, this.endTarget);
    this.endSpherical.setFromVector3(endOffset);

    // Check if linear midpoint would pass inside the 180mm safety envelope or sweep a wide angle
    const midX = (this.startPos.x + this.endPos.x) * 0.5;
    const midY = (this.startPos.y + this.endPos.y) * 0.5;
    const midZ = (this.startPos.z + this.endPos.z) * 0.5;
    const midTargetX = (this.startTarget.x + this.endTarget.x) * 0.5;
    const midTargetY = (this.startTarget.y + this.endTarget.y) * 0.5;
    const midTargetZ = (this.startTarget.z + this.endTarget.z) * 0.5;
    const midDistToTarget = Math.hypot(midX - midTargetX, midY - midTargetY, midZ - midTargetZ);
    const midDistToOrigin = Math.hypot(midX, midY, midZ);

    let deltaTheta = this.endSpherical.theta - this.startSpherical.theta;
    if (deltaTheta > Math.PI) deltaTheta -= Math.PI * 2;
    if (deltaTheta < -Math.PI) deltaTheta += Math.PI * 2;
    const deltaPhi = Math.abs(this.endSpherical.phi - this.startSpherical.phi);

    this.useSphericalInterp =
      midDistToTarget < 180 ||
      midDistToOrigin < 180 ||
      Math.abs(deltaTheta) > 0.9 ||
      deltaPhi > 0.7;

    this.transitionDuration = duration;
    this.transitionProgress = 0;
    this.isTransitioning = true;
  }

  public update(dt: number): void {
    if (!this.isTransitioning) return;

    this.transitionProgress += dt / this.transitionDuration;
    if (this.transitionProgress >= 1.0) {
      this.transitionProgress = 1.0;
      this.isTransitioning = false;
    }

    // Smooth cubic in-out easing
    const t = this.transitionProgress;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    this.controls.target.lerpVectors(this.startTarget, this.endTarget, ease);

    if (this.useSphericalInterp) {
      let deltaTheta = this.endSpherical.theta - this.startSpherical.theta;
      if (deltaTheta > Math.PI) deltaTheta -= Math.PI * 2;
      if (deltaTheta < -Math.PI) deltaTheta += Math.PI * 2;

      // If azimuth change is near 180 deg and polar angle is similar, nudge polar angle slightly to avoid pole singularity
      const baseRadius = THREE.MathUtils.lerp(this.startSpherical.radius, this.endSpherical.radius, ease);
      const minSafeRadius = 185;
      const arcBoost = Math.sin(ease * Math.PI) * Math.max(0, minSafeRadius - baseRadius);

      this.currentSpherical.radius = baseRadius + arcBoost;
      this.currentSpherical.phi = THREE.MathUtils.clamp(
        THREE.MathUtils.lerp(this.startSpherical.phi, this.endSpherical.phi, ease),
        0.08,
        Math.PI - 0.08
      );
      this.currentSpherical.theta = this.startSpherical.theta + deltaTheta * ease;

      this.tempOffset.setFromSpherical(this.currentSpherical);
      this.camera.position.addVectors(this.controls.target, this.tempOffset);
    } else {
      this.camera.position.lerpVectors(this.startPos, this.endPos, ease);
    }
  }

  public dispose(): void {
    this.controls.removeEventListener('start', this.onControlsStart);
  }
}

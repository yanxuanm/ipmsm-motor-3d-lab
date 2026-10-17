import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createStatorCoreGeometry } from '../geometry/statorGeometry';
import { createHairpinWindings, HairpinPhaseMeshes } from '../geometry/hairpinWindings';
import { createVTypeRotor, RotorAssembly } from '../geometry/rotorGeometry';
import { createMotorHousing, HousingAssembly } from '../geometry/housingGeometry';
import { createVectorVisualizer, VectorVisualizer } from './vectorVisualizer';
import { CameraManager } from './cameraManager';
import { SimulationState, ElectricalValues } from '../types/motor';

export interface MotorSceneCallbacks {
  onSelectComponent: (componentId: string | null) => void;
  onHoverComponent: (componentId: string | null) => void;
}

const LUT_STEPS = 64;
const COOLANT_LUT_STEPS = 320;

interface PhaseParticles {
  points: THREE.Points;
  material: THREE.PointsMaterial;
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
  progress: Float32Array;
  curveIndices: Uint16Array;
  curveLUT: Float32Array; // Pre-sampled [curveIdx * LUT_STEPS * 3] lookup table
}

interface CoolantParticles {
  points: THREE.Points;
  material: THREE.PointsMaterial;
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
  colors: Float32Array;
  progress: Float32Array;
  radialOffsets: Float32Array;
  curveLUT: Float32Array; // Pre-sampled [COOLANT_LUT_STEPS * 3] lookup table
}

export class MotorScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private cameraManager: CameraManager;

  // Assemblies
  private statorMesh: THREE.Mesh;
  private hairpins: HairpinPhaseMeshes;
  private rotor: RotorAssembly;
  private housing: HousingAssembly;
  private vectors: VectorVisualizer;

  // Winding Current Particles, Water Jacket Coolant & Direct Oil-Spray Droplets
  private particlesGroup: THREE.Group;
  private particlesU!: PhaseParticles;
  private particlesV!: PhaseParticles;
  private particlesW!: PhaseParticles;
  private coolantParticles!: CoolantParticles;
  private oilParticles!: PhaseParticles;
  private lastThermalRatio: number = -1;

  // Interactive Groups for Exploded View
  private explodedGroups = {
    frontEnd: new THREE.Group(),
    frontBearing: new THREE.Group(),
    rotorAssembly: new THREE.Group(),
    statorAssembly: new THREE.Group(),
    housingAssembly: new THREE.Group(),
    rearBearing: new THREE.Group(),
    resolver: new THREE.Group(),
    rearEnd: new THREE.Group()
  };

  // Clipping Planes for Cutaway
  private cutawayPlane: THREE.Plane;
  private waterCutawayPlane: THREE.Plane;
  private hairpinCutawayPlane: THREE.Plane;

  // Raycasting & Hover Highlighting
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private callbacks: MotorSceneCallbacks;
  private hoveredMesh: THREE.Mesh | null = null;
  private interactiveMeshes: THREE.Object3D[] = [];
  private cleanupEvents: (() => void) | null = null;

  // Lighting references for theme switching
  private ambientLight!: THREE.AmbientLight;
  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private bottomLight!: THREE.PointLight;
  private currentTheme: 'dark' | 'light' = 'dark';

  constructor(container: HTMLElement, callbacks: MotorSceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);
    this.scene.fog = new THREE.FogExp2(0x07090e, 0.0016);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 2000);
    this.camera.position.set(280, 200, 310);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.localClippingEnabled = true;
    container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 600;
    this.controls.minDistance = 30;
    this.controls.target.set(0, 0, 0);

    this.cameraManager = new CameraManager(this.camera, this.controls);

    // 5. Lighting
    this.setupLighting();

    // 6. Clipping Planes for Cutaway:
    // - cutawayPlane (Y = 0) slices upper half of stator, rotor core, V-magnets, hollow shaft & bearing races
    // - waterCutawayPlane peels open the front-right & lower-front side of the housing and spiral water jacket
    //   all the way down to the bottom oil sump (Y = -112 mm) so the Oil Immersion Bath is 100% unobstructed,
    //   while keeping the left/rear spiral water jacket and upper-left nozzles completely intact!
    // - hairpinCutawayPlane opens a 112° front-right window (θ ∈ [-24°, +88°]) in the hairpin cage so you
    //   can see the hollow shaft, V-rotor, bearing oil bath, and bottom oil immersion bath, while keeping
    //   both the top hairpin crown (88°..140°) and the oil-submerged bottom hairpin crown (180°..336°) intact!
    this.cutawayPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    this.waterCutawayPlane = new THREE.Plane(new THREE.Vector3(-0.82, -0.12, -0.56).normalize(), 12);
    this.hairpinCutawayPlane = new THREE.Plane(new THREE.Vector3(-0.85, -0.53, 0).normalize(), 42);

    // 7. Initialize Assemblies
    const statorGeo = createStatorCoreGeometry();
    const statorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.82,
      roughness: 0.35
    });
    this.statorMesh = new THREE.Mesh(statorGeo, statorMat);
    this.statorMesh.name = "stator_laminated_core";

    this.hairpins = createHairpinWindings();
    this.rotor = createVTypeRotor();
    this.housing = createMotorHousing();
    this.vectors = createVectorVisualizer();

    // Winding Current Electron Particles (with pre-computed LUT)
    this.particlesGroup = new THREE.Group();
    this.particlesGroup.name = "winding_electron_particles";
    this.particlesU = this.createPhaseParticles(this.hairpins.phaseCurves.phaseUCurves, 0xffb703, 8);
    this.particlesV = this.createPhaseParticles(this.hairpins.phaseCurves.phaseVCurves, 0x10b981, 8);
    this.particlesW = this.createPhaseParticles(this.hairpins.phaseCurves.phaseWCurves, 0x00f2fe, 8);
    this.particlesGroup.add(this.particlesU.points);
    this.particlesGroup.add(this.particlesV.points);
    this.particlesGroup.add(this.particlesW.points);

    // Spiral Water Jacket Coolant Fluid Particles (with pre-computed LUT)
    this.coolantParticles = this.createCoolantParticles(this.housing.spiralCurve, 340);

    // Direct Oil-Spray & Hollow-Shaft Oil Droplet Particles (with pre-computed LUT)
    this.oilParticles = this.createPhaseParticles(this.housing.oilCurves, 0xfbbf24, 16);
    this.oilParticles.points.name = "oil_spray_droplet_particles";

    this.setupExplodedHierarchy();

    // 8. Raycasting Setup
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-1000, -1000);

    this.registerInteractiveMeshes();
    this.setupEvents();
  }

  private setupLighting(): void {
    this.ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xf8fafc, 2.6);
    this.keyLight.position.set(160, 220, 180);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    this.fillLight.position.set(-180, -120, 140);
    this.scene.add(this.fillLight);

    this.rimLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    this.rimLight.position.set(0, 160, -200);
    this.scene.add(this.rimLight);

    this.bottomLight = new THREE.PointLight(0x00f2fe, 1.2, 500);
    this.bottomLight.position.set(0, -180, 0);
    this.scene.add(this.bottomLight);
  }

  private setupExplodedHierarchy(): void {
    this.explodedGroups.statorAssembly.add(this.statorMesh);
    this.explodedGroups.statorAssembly.add(this.hairpins.group);
    this.explodedGroups.statorAssembly.add(this.particlesGroup);

    this.explodedGroups.rotorAssembly.add(this.rotor.rotorCore);
    this.explodedGroups.rotorAssembly.add(this.rotor.magnetsGroup);
    this.explodedGroups.rotorAssembly.add(this.rotor.shaft);

    this.explodedGroups.frontBearing.add(this.rotor.bearings.children[0]);
    this.explodedGroups.rearBearing.add(this.rotor.bearings.children[1] || this.rotor.bearings.children[0]);

    this.explodedGroups.resolver.add(this.rotor.resolver);

    this.explodedGroups.frontEnd.add(this.housing.frontEndShield);
    this.explodedGroups.rearEnd.add(this.housing.rearEndShield);
    this.explodedGroups.housingAssembly.add(this.housing.housingMesh);
    this.explodedGroups.housingAssembly.add(this.housing.waterJacketMesh);
    this.explodedGroups.housingAssembly.add(this.housing.oilCoolingGroup);
    this.explodedGroups.housingAssembly.add(this.coolantParticles.points);
    this.explodedGroups.housingAssembly.add(this.oilParticles.points);

    Object.values(this.explodedGroups).forEach(grp => this.scene.add(grp));
    this.scene.add(this.vectors.group);
  }

  private registerInteractiveMeshes(): void {
    this.interactiveMeshes = [
      this.statorMesh,
      this.hairpins.phaseU,
      this.hairpins.phaseV,
      this.hairpins.phaseW,
      this.hairpins.weldBeads,
      this.rotor.rotorCore,
      this.rotor.shaft,
      this.rotor.bearings,
      this.rotor.resolver,
      this.housing.housingMesh,
      this.housing.waterJacketMesh,
      this.housing.oilCoolingGroup,
      this.housing.frontEndShield,
      this.housing.rearEndShield,
      this.rotor.magnetsGroup
    ];

    for (const obj of this.interactiveMeshes) {
      obj.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.computeBoundingBox();
            child.geometry.computeBoundingSphere();
          }
          const mat = child.material;
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
            child.userData.baseEmissiveHex = mat.emissive.getHex();
            child.userData.baseEmissiveIntensity = mat.emissiveIntensity;
          }
        }
      });
    }
  }

  private createPhaseParticles(
    curves: THREE.CatmullRomCurve3[],
    color: number,
    particlesPerCurve: number = 8
  ): PhaseParticles {
    const count = curves.length * particlesPerCurve;
    const positions = new Float32Array(count * 3);
    const progress = new Float32Array(count);
    const curveIndices = new Uint16Array(count);

    // Pre-sample all curves into a flat Float32Array LUT (zero spline math during 60FPS loop)
    const curveLUT = new Float32Array(curves.length * LUT_STEPS * 3);
    for (let c = 0; c < curves.length; c++) {
      const pts = curves[c].getSpacedPoints(LUT_STEPS - 1);
      const baseOffset = c * LUT_STEPS * 3;
      for (let s = 0; s < LUT_STEPS; s++) {
        curveLUT[baseOffset + s * 3 + 0] = pts[s].x;
        curveLUT[baseOffset + s * 3 + 1] = pts[s].y;
        curveLUT[baseOffset + s * 3 + 2] = pts[s].z;
      }
    }

    let idx = 0;
    for (let c = 0; c < curves.length; c++) {
      const baseOffset = c * LUT_STEPS * 3;
      for (let p = 0; p < particlesPerCurve; p++) {
        const t = p / particlesPerCurve;
        progress[idx] = t;
        curveIndices[idx] = c;
        const sIdx = Math.min(LUT_STEPS - 1, Math.floor(t * (LUT_STEPS - 1)));
        positions[idx * 3 + 0] = curveLUT[baseOffset + sIdx * 3 + 0];
        positions[idx * 3 + 1] = curveLUT[baseOffset + sIdx * 3 + 1];
        positions[idx * 3 + 2] = curveLUT[baseOffset + sIdx * 3 + 2];
        idx++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color,
      size: 3.5,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    return { points, material, geometry, positions, progress, curveIndices, curveLUT };
  }

  private updatePhaseParticles(phase: PhaseParticles, current: number, dt: number): void {
    const speed = (current / 350) * 0.45;
    const absRatio = Math.min(1.0, Math.abs(current) / 350);
    phase.material.opacity = 0.25 + absRatio * 0.7;
    phase.material.size = 2.2 + absRatio * 2.4;

    const count = phase.progress.length;
    const lut = phase.curveLUT;
    const maxStep = LUT_STEPS - 1;

    for (let i = 0; i < count; i++) {
      let t = phase.progress[i] + speed * dt;
      if (t < 0) t = (t % 1) + 1;
      else if (t >= 1) t = t % 1;
      phase.progress[i] = t;

      const cIdx = phase.curveIndices[i];
      const fIdx = t * maxStep;
      const idx0 = fIdx | 0;
      const idx1 = idx0 < maxStep ? idx0 + 1 : maxStep;
      const frac = fIdx - idx0;

      const offset0 = (cIdx * LUT_STEPS + idx0) * 3;
      const offset1 = (cIdx * LUT_STEPS + idx1) * 3;

      phase.positions[i * 3 + 0] = lut[offset0 + 0] + (lut[offset1 + 0] - lut[offset0 + 0]) * frac;
      phase.positions[i * 3 + 1] = lut[offset0 + 1] + (lut[offset1 + 1] - lut[offset0 + 1]) * frac;
      phase.positions[i * 3 + 2] = lut[offset0 + 2] + (lut[offset1 + 2] - lut[offset0 + 2]) * frac;
    }
    phase.geometry.attributes.position.needsUpdate = true;
  }

  private createCoolantParticles(
    spiralCurve: THREE.CatmullRomCurve3,
    count: number = 340
  ): CoolantParticles {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const progress = new Float32Array(count);
    const radialOffsets = new Float32Array(count * 3);

    // Pre-sample the 8-turn spiral curve into a flat Float32Array LUT
    const curveLUT = new Float32Array(COOLANT_LUT_STEPS * 3);
    const pts = spiralCurve.getSpacedPoints(COOLANT_LUT_STEPS - 1);
    for (let s = 0; s < COOLANT_LUT_STEPS; s++) {
      curveLUT[s * 3 + 0] = pts[s].x;
      curveLUT[s * 3 + 1] = pts[s].y;
      curveLUT[s * 3 + 2] = pts[s].z;
    }

    for (let i = 0; i < count; i++) {
      const t = i / count;
      progress[i] = t;

      //Deterministic volumetric offset inside the 3.8mm tube cross-section
      const goldenAngle = i * 2.3999632;
      const rJitter = 1.65 * Math.sqrt((i % 17) / 17);
      radialOffsets[i * 3 + 0] = rJitter * Math.cos(goldenAngle);
      radialOffsets[i * 3 + 1] = rJitter * Math.sin(goldenAngle);
      radialOffsets[i * 3 + 2] = rJitter * Math.sin(goldenAngle * 0.5) * 0.6;

      const sIdx = Math.min(COOLANT_LUT_STEPS - 1, Math.floor(t * (COOLANT_LUT_STEPS - 1)));
      positions[i * 3 + 0] = curveLUT[sIdx * 3 + 0] + radialOffsets[i * 3 + 0];
      positions[i * 3 + 1] = curveLUT[sIdx * 3 + 1] + radialOffsets[i * 3 + 1];
      positions[i * 3 + 2] = curveLUT[sIdx * 3 + 2] + radialOffsets[i * 3 + 2];

      colors[i * 3 + 0] = 0.0;
      colors[i * 3 + 1] = 0.95;
      colors[i * 3 + 2] = 1.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'coolant_fluid_particles';
    return { points, material, geometry, positions, colors, progress, radialOffsets, curveLUT };
  }

  private updateCoolantParticles(
    rpm: number,
    thermalRatio: number,
    isWaterJacketView: boolean,
    dt: number
  ): void {
    const c = this.coolantParticles;
    // Pump flow speed scales with motor RPM and thermal dissipation demand
    const flowSpeed = 0.11 + 0.12 * Math.min(1, rpm / 10000) + 0.08 * thermalRatio;
    c.material.size = isWaterJacketView ? 4.8 : 3.6;
    c.material.opacity = isWaterJacketView ? 0.95 : 0.72;

    const count = c.progress.length;
    const lut = c.curveLUT;
    const maxStep = COOLANT_LUT_STEPS - 1;

    //Outlet warm color shifts from deep ocean azure (#0284c7) to bright electric indigo-violet (#6366f1 / #8b5cf6)
    // Strictly cool blue/cyan/violet spectrum so Water NEVER clashes with Golden-Amber ATF Oil!
    const warmR = 0.15 + 0.35 * Math.max(0.35, thermalRatio);
    const warmG = 0.52 - 0.16 * thermalRatio;
    const warmB = 0.96;

    for (let i = 0; i < count; i++) {
      let t = c.progress[i] + flowSpeed * dt;
      if (t >= 1) t = t % 1;
      c.progress[i] = t;

      const fIdx = t * maxStep;
      const idx0 = fIdx | 0;
      const idx1 = idx0 < maxStep ? idx0 + 1 : maxStep;
      const frac = fIdx - idx0;

      const offset0 = idx0 * 3;
      const offset1 = idx1 * 3;

      c.positions[i * 3 + 0] =
        lut[offset0 + 0] + (lut[offset1 + 0] - lut[offset0 + 0]) * frac + c.radialOffsets[i * 3 + 0];
      c.positions[i * 3 + 1] =
        lut[offset0 + 1] + (lut[offset1 + 1] - lut[offset0 + 1]) * frac + c.radialOffsets[i * 3 + 1];
      c.positions[i * 3 + 2] =
        lut[offset0 + 2] + (lut[offset1 + 2] - lut[offset0 + 2]) * frac + c.radialOffsets[i * 3 + 2];

      // Axial thermal gradient: Cold Inlet (+Z, t=0: Ice Cyan #00f2fe) -> Mid (Ocean Azure #0284c7) -> Warm Outlet (-Z, Indigo-Blue)
      if (t < 0.5) {
        const u = t * 2;
        c.colors[i * 3 + 0] = 0.0 + 0.04 * u;
        c.colors[i * 3 + 1] = 0.95 - 0.32 * u;
        c.colors[i * 3 + 2] = 1.0 - 0.08 * u;
      } else {
        const u = (t - 0.5) * 2;
        c.colors[i * 3 + 0] = 0.04 + (warmR - 0.04) * u;
        c.colors[i * 3 + 1] = 0.63 + (warmG - 0.63) * u;
        c.colors[i * 3 + 2] = 0.92 + (warmB - 0.92) * u;
      }
    }

    c.geometry.attributes.position.needsUpdate = true;
    c.geometry.attributes.color.needsUpdate = true;
  }

  private updateWaterJacketThermalGradient(thermalRatio: number): void {
    // Only recompute tube vertex colors when thermal load changes by > 2%
    if (Math.abs(thermalRatio - this.lastThermalRatio) < 0.02) return;
    this.lastThermalRatio = thermalRatio;

    const geo = this.housing.waterJacketMesh.geometry;
    const axialT = geo.userData.axialT as Float32Array | undefined;
    const colorAttr = geo.attributes.color as THREE.BufferAttribute | undefined;
    if (!axialT || !colorAttr) return;

    const arr = colorAttr.array as Float32Array;
    const heatFactor = Math.max(0.40, thermalRatio);
    // Warm water outlet color: Electric Azure-Indigo (#3b82f6 -> #6366f1), completely distinct from Golden-Amber Oil!
    const outR = 0.22 + 0.28 * heatFactor;
    const outG = 0.48 - 0.14 * heatFactor;
    const outB = 0.96;

    for (let i = 0; i < axialT.length; i++) {
      const t = axialT[i];
      if (t < 0.48) {
        // Cold Inlet (+Z): Ice Cyan (#00f2fe) -> Deep Ocean Blue (#0284c7)
        const u = t / 0.48;
        arr[i * 3 + 0] = 0.0 + 0.04 * u;
        arr[i * 3 + 1] = 0.95 - 0.38 * u;
        arr[i * 3 + 2] = 1.0 - 0.12 * u;
      } else {
        // Mid-channel to Warm Outlet (-Z): Deep Ocean Blue -> Electric Indigo-Blue
        const u = (t - 0.48) / 0.52;
        arr[i * 3 + 0] = 0.04 + (outR - 0.04) * u;
        arr[i * 3 + 1] = 0.57 + (outG - 0.57) * u;
        arr[i * 3 + 2] = 0.88 + (outB - 0.88) * u;
      }
    }
    colorAttr.needsUpdate = true;
  }

  private updateOilParticles(
    rpm: number,
    thermalRatio: number,
    isCoolingFocus: boolean,
    dt: number
  ): void {
    const oil = this.oilParticles;
    const speed = 0.24 + 0.18 * Math.min(1, rpm / 10000) + 0.10 * thermalRatio;
    oil.material.size = isCoolingFocus ? 4.4 : 3.2;
    oil.material.opacity = isCoolingFocus ? 0.94 : 0.65;

    const count = oil.progress.length;
    const lut = oil.curveLUT;
    const maxStep = LUT_STEPS - 1;

    for (let i = 0; i < count; i++) {
      let t = oil.progress[i] + speed * dt;
      if (t >= 1) t = t % 1;
      oil.progress[i] = t;

      const cIdx = oil.curveIndices[i];
      const fIdx = t * maxStep;
      const idx0 = fIdx | 0;
      const idx1 = idx0 < maxStep ? idx0 + 1 : maxStep;
      const frac = fIdx - idx0;

      const offset0 = (cIdx * LUT_STEPS + idx0) * 3;
      const offset1 = (cIdx * LUT_STEPS + idx1) * 3;

      oil.positions[i * 3 + 0] = lut[offset0 + 0] + (lut[offset1 + 0] - lut[offset0 + 0]) * frac;
      oil.positions[i * 3 + 1] = lut[offset0 + 1] + (lut[offset1 + 1] - lut[offset0 + 1]) * frac;
      oil.positions[i * 3 + 2] = lut[offset0 + 2] + (lut[offset1 + 2] - lut[offset0 + 2]) * frac;
    }
    oil.geometry.attributes.position.needsUpdate = true;
  }

  private resolveComponent(object: THREE.Object3D | null): { name: string; mesh: THREE.Mesh } | null {
    let curr: THREE.Object3D | null = object;
    let targetMesh: THREE.Mesh | null = (object instanceof THREE.Mesh) ? object : null;
    while (curr && curr !== this.scene) {
      if (curr.name) {
        if (
          curr.name === 'stator_laminated_core' ||
          curr.name.startsWith('hairpin_') ||
          curr.name.startsWith('magnet_') ||
          curr.name === 'rotor_permanent_magnets' ||
          curr.name === 'rotor_laminated_core' ||
          curr.name === 'cooling_water_jacket' ||
          curr.name === 'oil_cooling_system' ||
          curr.name === 'aluminum_housing_jacket' ||
          curr.name === 'front_end_shield' ||
          curr.name === 'rear_end_shield' ||
          curr.name === 'splined_shaft_assembly' ||
          curr.name.includes('bearing') ||
          curr.name === 'resolver_sensor'
        ) {
          return { name: curr.name, mesh: targetMesh || (curr as THREE.Mesh) };
        }
      }
      curr = curr.parent;
    }
    return null;
  }

  private restoreMeshBaseEmissive(mesh: THREE.Mesh | null): void {
    if (!mesh) return;
    const mat = mesh.material;
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      if (mesh.userData.baseEmissiveHex !== undefined) {
        mat.emissive.setHex(mesh.userData.baseEmissiveHex);
        mat.emissiveIntensity = mesh.userData.baseEmissiveIntensity;
      }
    }
  }

  private setHoveredMesh(mesh: THREE.Mesh | null): void {
    if (this.hoveredMesh && this.hoveredMesh !== mesh) {
      this.restoreMeshBaseEmissive(this.hoveredMesh);
    }
    this.hoveredMesh = mesh;
  }

  private setupEvents(): void {
    let lastRaycastTime = 0;
    let downX = 0;
    let downY = 0;

    const onMouseDown = (e: MouseEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons !== 0 || e.target !== this.renderer.domElement) {
        return;
      }

      const now = performance.now();
      if (now - lastRaycastTime < 75) {
        return;
      }
      lastRaycastTime = now;

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);

      if (intersects.length > 0) {
        const resolved = this.resolveComponent(intersects[0].object);
        if (resolved) {
          this.setHoveredMesh(resolved.mesh);
          this.callbacks.onHoverComponent(resolved.name);
          this.container.style.cursor = 'pointer';
        } else {
          this.setHoveredMesh(null);
          this.callbacks.onHoverComponent(null);
          this.container.style.cursor = 'default';
        }
      } else {
        this.setHoveredMesh(null);
        this.callbacks.onHoverComponent(null);
        this.container.style.cursor = 'default';
      }
    };

    const onClick = (e: MouseEvent) => {
      if (e.target !== this.renderer.domElement) return;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);

      if (intersects.length > 0) {
        const resolved = this.resolveComponent(intersects[0].object);
        this.callbacks.onSelectComponent(resolved ? resolved.name : null);
      } else {
        this.callbacks.onSelectComponent(null);
      }
    };

    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('click', onClick);

    this.cleanupEvents = () => {
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('click', onClick);
    };
  }

  public setCameraPreset(presetId: string): void {
    this.cameraManager.setPreset(presetId);
  }

  public setTheme(theme: 'dark' | 'light'): void {
    this.currentTheme = theme;
    if (theme === 'light') {
      // Crisp industrial CAD studio lighting & background (like Siemens NX / SolidWorks)
      this.scene.background = new THREE.Color(0xeef2f6);
      this.scene.fog = new THREE.FogExp2(0xeef2f6, 0.0014);

      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 1.9;
      }
      if (this.keyLight) {
        this.keyLight.color.setHex(0xffffff);
        this.keyLight.intensity = 2.4;
      }
      if (this.fillLight) {
        this.fillLight.color.setHex(0xb0c4de);
        this.fillLight.intensity = 1.2;
      }
      if (this.rimLight) {
        this.rimLight.color.setHex(0x94a3b8);
        this.rimLight.intensity = 1.0;
      }
      if (this.bottomLight) {
        this.bottomLight.color.setHex(0x38bdf8);
        this.bottomLight.intensity = 0.6;
      }
    } else {
      // Cyberpunk deep-space industrial dark mode
      this.scene.background = new THREE.Color(0x07090e);
      this.scene.fog = new THREE.FogExp2(0x07090e, 0.0016);

      if (this.ambientLight) {
        this.ambientLight.color.setHex(0x1e293b);
        this.ambientLight.intensity = 1.4;
      }
      if (this.keyLight) {
        this.keyLight.color.setHex(0xf8fafc);
        this.keyLight.intensity = 2.6;
      }
      if (this.fillLight) {
        this.fillLight.color.setHex(0x38bdf8);
        this.fillLight.intensity = 1.5;
      }
      if (this.rimLight) {
        this.rimLight.color.setHex(0xf59e0b);
        this.rimLight.intensity = 1.8;
      }
      if (this.bottomLight) {
        this.bottomLight.color.setHex(0x00f2fe);
        this.bottomLight.intensity = 1.2;
      }
    }
  }

  public setCutaway(enabled: boolean): void {
    const planes = enabled ? [this.cutawayPlane] : [];
    const waterPlanes = enabled ? [this.waterCutawayPlane] : [];
    const hairpinPlanes = enabled ? [this.hairpinCutawayPlane] : [];
    const shaftCoreMesh = this.rotor.shaft.children[0] as THREE.Mesh | undefined;

    const cutawayMaterials: THREE.Material[] = [
      this.statorMesh.material as THREE.Material,
      this.rotor.rotorCore.material as THREE.Material
    ];
    if (shaftCoreMesh && shaftCoreMesh.material instanceof THREE.Material) {
      cutawayMaterials.push(shaftCoreMesh.material);
    }

    // Clip upper half (Y > 0) of V-magnets so they sit flush with rotorCore at Y = 0 and never block the hollow shaft!
    this.rotor.magnetsGroup.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
        if (!cutawayMaterials.includes(child.material)) {
          cutawayMaterials.push(child.material);
        }
      }
    });

    // Clip upper half (Y > 0) of Front & Rear Bearing races so the chrome steel balls submerged in the lower oil bath are exposed!
    [this.explodedGroups.frontBearing, this.explodedGroups.rearBearing].forEach(grp => {
      grp.traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
          if (child.material.userData?.clipInCutaway && !cutawayMaterials.includes(child.material)) {
            cutawayMaterials.push(child.material);
          }
        }
      });
    });

    cutawayMaterials.forEach(mat => {
      mat.clippingPlanes = planes;
      mat.clipShadows = true;
      mat.side = enabled ? THREE.DoubleSide : THREE.FrontSide;
      mat.needsUpdate = true;
    });

    // Open a clean front-right window (θ ∈ [-24°, +88°]) in the hairpin cage so you can look straight into
    // the hollow shaft, V-rotor, bearing oil bath, and bottom oil immersion bath, while keeping both the
    // top crown (88°..140° under the oil shower) and the bottom crown (submerged in the oil bath) intact!
    [
      this.hairpins.phaseU.material as THREE.Material,
      this.hairpins.phaseV.material as THREE.Material,
      this.hairpins.phaseW.material as THREE.Material,
      this.hairpins.weldBeads.material as THREE.Material
    ].forEach(mat => {
      mat.clippingPlanes = hairpinPlanes;
      mat.clipShadows = true;
      mat.side = enabled ? THREE.DoubleSide : THREE.FrontSide;
      mat.needsUpdate = true;
    });
    [this.particlesU.material, this.particlesV.material, this.particlesW.material].forEach(mat => {
      mat.clippingPlanes = hairpinPlanes;
      mat.needsUpdate = true;
    });

    // Peel open the front-right & lower-front side of both the cast-aluminum housing and spiral water jacket
    // all the way down to the bottom oil sump (Y = -112 mm) so the Oil Immersion Bath is 100% unobstructed,
    // while keeping 240°+ of the left/rear spiral water jacket and upper-left nozzles completely visible!
    [
      this.housing.housingMesh.material as THREE.Material,
      this.housing.waterJacketMesh.material as THREE.Material
    ].forEach(mat => {
      mat.clippingPlanes = waterPlanes;
      mat.clipShadows = true;
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
    });

    this.coolantParticles.material.clippingPlanes = waterPlanes;
    this.coolantParticles.material.needsUpdate = true;

    this.housing.frontEndShield.visible = !enabled;
    this.renderer.clippingPlanes = [];
  }

  public setWireframe(enabled: boolean): void {
    [
      this.statorMesh.material,
      this.housing.housingMesh.material,
      this.rotor.rotorCore.material
    ].forEach(mat => {
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.wireframe = enabled;
      }
    });
  }

  public update(state: SimulationState, electrical: ElectricalValues, dt: number): void {
    // 1. Camera Animation
    this.cameraManager.update(dt);
    this.controls.update();

    // 2. Rotor Mechanical Rotation
    this.rotor.rotorCore.rotation.z = state.theta_m;
    this.rotor.magnetsGroup.rotation.z = state.theta_m;
    this.rotor.shaft.rotation.z = state.theta_m;
    this.rotor.resolver.rotation.z = state.theta_m;

    // 3. Determine if we are in Water & Oil Cooling Thermal Inspection Mode
    const isWaterJacketFocus =
      state.currentPreset === 'water_jacket' ||
      state.selectedPartId === 'cooling_water_jacket' ||
      state.selectedPartId === 'oil_cooling_system' ||
      this.hoveredMesh === this.housing.waterJacketMesh;

    const totalThermalLoss = electrical.copperLoss + electrical.ironLoss; // Watts
    const thermalRatio = Math.min(1.0, totalThermalLoss / 5500);

    // 4. Dynamic Hairpin Phase Windings Material:
    //    - In Water & Oil Cooling Focus Mode: render hairpins as Authentic Physical Enamel-Copper (#b87333)
    //      with warm Joule-heat glow so Cyan Water (#00f2fe) and Golden-Amber Oil (#fbbf24) NEVER clash with
    //      neon W-phase cyan or U-phase yellow wires!
    //    - In Electromagnetic Modes: render 3-phase U (Orange), V (Emerald), W (Cyan) dynamic current glow.
    const matU = this.hairpins.phaseU.material as THREE.MeshStandardMaterial;
    const matV = this.hairpins.phaseV.material as THREE.MeshStandardMaterial;
    const matW = this.hairpins.phaseW.material as THREE.MeshStandardMaterial;

    if (isWaterJacketFocus) {
      const copperBase = 0xb87333;
      const copperEmissive = 0x7c2d12;
      const copperInt = 0.22 + 0.35 * thermalRatio;

      matU.color.setHex(copperBase);
      matU.emissive.setHex(copperEmissive);
      matU.emissiveIntensity = copperInt;
      this.hairpins.phaseU.userData.baseEmissiveHex = copperEmissive;
      this.hairpins.phaseU.userData.baseEmissiveIntensity = copperInt;

      matV.color.setHex(copperBase);
      matV.emissive.setHex(copperEmissive);
      matV.emissiveIntensity = copperInt;
      this.hairpins.phaseV.userData.baseEmissiveHex = copperEmissive;
      this.hairpins.phaseV.userData.baseEmissiveIntensity = copperInt;

      matW.color.setHex(copperBase);
      matW.emissive.setHex(copperEmissive);
      matW.emissiveIntensity = copperInt;
      this.hairpins.phaseW.userData.baseEmissiveHex = copperEmissive;
      this.hairpins.phaseW.userData.baseEmissiveIntensity = copperInt;
    } else {
      const maxI = 350;
      const absU = Math.min(1.0, Math.abs(electrical.I_u) / maxI);
      const absV = Math.min(1.0, Math.abs(electrical.I_v) / maxI);
      const absW = Math.min(1.0, Math.abs(electrical.I_w) / maxI);

      const intU = 0.15 + absU * 1.25;
      const intV = 0.15 + absV * 1.25;
      const intW = 0.15 + absW * 1.25;
      const colU = electrical.I_u >= 0 ? 0xffaa00 : 0xff3300;
      const colV = electrical.I_v >= 0 ? 0x10b981 : 0x047857;
      const colW = electrical.I_w >= 0 ? 0x00f2fe : 0x3b82f6;

      matU.color.setHex(0xe67e22);
      matU.emissive.setHex(colU);
      matU.emissiveIntensity = intU;
      this.hairpins.phaseU.userData.baseEmissiveHex = colU;
      this.hairpins.phaseU.userData.baseEmissiveIntensity = intU;

      matV.color.setHex(0x10b981);
      matV.emissive.setHex(colV);
      matV.emissiveIntensity = intV;
      this.hairpins.phaseV.userData.baseEmissiveHex = colV;
      this.hairpins.phaseV.userData.baseEmissiveIntensity = intV;

      matW.color.setHex(0x00f2fe);
      matW.emissive.setHex(colW);
      matW.emissiveIntensity = intW;
      this.hairpins.phaseW.userData.baseEmissiveHex = colW;
      this.hairpins.phaseW.userData.baseEmissiveIntensity = intW;
    }

    // 5. Water Jacket & Oil Cooling Thermal Gradient, X-Ray Cast Aluminum Housing & Fluid Flow
    const housingMat = this.housing.housingMesh.material as THREE.MeshStandardMaterial;
    const targetHousingOpacity = isWaterJacketFocus ? 0.24 : 1.0;
    const wantTransparent = targetHousingOpacity < 0.99;
    if (housingMat.transparent !== wantTransparent || Math.abs(housingMat.opacity - targetHousingOpacity) > 0.01) {
      housingMat.transparent = wantTransparent;
      housingMat.opacity = targetHousingOpacity;
      housingMat.depthWrite = !wantTransparent;
      housingMat.needsUpdate = true;
    }

    this.updateWaterJacketThermalGradient(thermalRatio);

    const wjMat = this.housing.waterJacketMesh.material as THREE.MeshPhysicalMaterial;
    const wjInt = (isWaterJacketFocus ? 0.26 : 0.18) + 0.08 * Math.sin(state.time * 4.0);
    wjMat.emissive.setHex(0x1e293b);
    wjMat.emissiveIntensity = wjInt;
    wjMat.opacity = isWaterJacketFocus ? 0.92 : 0.84;
    this.housing.waterJacketMesh.userData.baseEmissiveHex = 0x1e293b;
    this.housing.waterJacketMesh.userData.baseEmissiveIntensity = wjInt;

    // 6. Apply active hover highlight AFTER all dynamic emissive updates so it never flickers
    if (this.hoveredMesh) {
      const hMat = this.hoveredMesh.material;
      if (hMat instanceof THREE.MeshStandardMaterial || hMat instanceof THREE.MeshPhysicalMaterial) {
        hMat.emissive.setHex(0x00f2fe);
        hMat.emissiveIntensity = 0.9;
      }
    }

    // 7. Update 3D Electromagnetic Vectors & Air-Gap Flux Lines
    if (state.showVectors) {
      this.vectors.setVisible(true);
      this.vectors.setFluxLinesVisible(state.showFluxLines);
      this.vectors.update(electrical, state);
    } else {
      this.vectors.setVisible(false);
    }

    // 8. Update Winding Current Electron Flow (hidden during Water/Oil Cooling focus so only Water & Oil flow!)
    if (state.showParticles && !isWaterJacketFocus) {
      this.particlesGroup.visible = true;
      this.updatePhaseParticles(this.particlesU, electrical.I_u, dt);
      this.updatePhaseParticles(this.particlesV, electrical.I_v, dt);
      this.updatePhaseParticles(this.particlesW, electrical.I_w, dt);
    } else {
      this.particlesGroup.visible = false;
    }

    // Always animate water coolant & oil spray particles when water_jacket is selected or showParticles is enabled
    const showCoolant = state.showParticles || isWaterJacketFocus;
    this.coolantParticles.points.visible = showCoolant;
    this.oilParticles.points.visible = showCoolant;
    if (showCoolant) {
      this.updateCoolantParticles(state.rpm, thermalRatio, isWaterJacketFocus, dt);
      this.updateOilParticles(state.rpm, thermalRatio, isWaterJacketFocus, dt);
    }

    // 8. Update Axial Exploded View Positions
    const p = state.explodedProgress;
    this.explodedGroups.frontEnd.position.z = 240 * p;
    this.explodedGroups.frontBearing.position.z = 160 * p;
    this.explodedGroups.rotorAssembly.position.z = 80 * p;
    this.explodedGroups.statorAssembly.position.z = 0; // anchor
    this.explodedGroups.housingAssembly.position.z = -70 * p;
    this.explodedGroups.rearBearing.position.z = -150 * p;
    this.explodedGroups.resolver.position.z = -200 * p;
    this.explodedGroups.rearEnd.position.z = -340 * p;

    // 9. Render
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    if (this.cleanupEvents) {
      this.cleanupEvents();
      this.cleanupEvents = null;
    }

    this.cameraManager.dispose();
    this.controls.dispose();

    // Traverse and free all geometries, materials, and textures
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points || obj instanceof THREE.Sprite) {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        const mat = obj.material;
        if (Array.isArray(mat)) {
          mat.forEach(m => {
            if ('map' in m && m.map) m.map.dispose();
            m.dispose();
          });
        } else if (mat) {
          if ('map' in mat && mat.map) (mat.map as THREE.Texture).dispose();
          mat.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

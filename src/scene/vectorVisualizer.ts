import * as THREE from 'three';
import { ElectricalValues, SimulationState } from '../types/motor';

export interface VectorVisualizer {
  group: THREE.Group;
  update: (values: ElectricalValues, state: SimulationState) => void;
  setVisible: (visible: boolean) => void;
  setFluxLinesVisible: (visible: boolean) => void;
}

/**
 * Creates 3D Vector Arrows and Dynamic Electromagnetic Visualizations:
 * - F_s (Stator MMF Vector, Amber/Cyan)
 * - F_r (Rotor PM d-axis Flux Vector, Red)
 * - I_q (q-axis Torque Current Vector, Emerald)
 * - Torque Angle Arc (delta)
 * - Dynamic Air-Gap Magnetic Field Streamlines
 */
export function createVectorVisualizer(): VectorVisualizer {
  const group = new THREE.Group();
  group.name = "electromagnetic_vector_visualizer";
  group.position.z = 148; // Position in front of the splined shaft tip (Z ~ 140)

  // Helper to create glowing 3D arrow with depthTest=false and renderOrder=50
  const createArrow = (color: number, emissiveColor: number, length: number, radius: number = 2.2) => {
    const arrowGroup = new THREE.Group();
    const shaftGeo = new THREE.CylinderGeometry(radius, radius, length * 0.78, 16);
    const headGeo = new THREE.ConeGeometry(radius * 2.4, length * 0.22, 16);

    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: emissiveColor,
      emissiveIntensity: 0.85,
      metalness: 0.4,
      roughness: 0.2,
      depthTest: false
    });

    const shaft = new THREE.Mesh(shaftGeo, mat);
    shaft.position.y = (length * 0.78) / 2;
    shaft.renderOrder = 50;
    arrowGroup.add(shaft);

    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = length * 0.78 + (length * 0.22) / 2;
    head.renderOrder = 50;
    arrowGroup.add(head);

    // Initial orientation: along +Y, rotated to point along +X
    arrowGroup.rotation.z = -Math.PI / 2;
    return { arrowGroup, mat, shaft, head };
  };

  // Helper to create high-DPI 3D Billboard Text Sprite floating at arrow tips
  const createTextSprite = (text: string, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 512, 128);
      ctx.fillStyle = 'rgba(7, 9, 14, 0.9)';
      ctx.beginPath();
      ctx.roundRect(8, 8, 496, 112, 20);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.font = 'bold 42px "JetBrains Mono", "PingFang SC", monospace, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(20, 5, 1);
    sprite.renderOrder = 60;
    return sprite;
  };

  const arrowLength = 56;

  // 1. F_s: Stator MMF Rotating Vector (Gold / Amber) - slightly longer radius so label never overlaps Fr
  const arrowFs = createArrow(0xf59e0b, 0xffb703, arrowLength + 6, 2.3);
  arrowFs.arrowGroup.name = "vector_Fs_stator_mmf";
  const spriteFs = createTextSprite("Fs (定子磁势)", "#fbbf24");
  spriteFs.position.set(0, arrowLength + 15, 0);
  arrowFs.arrowGroup.add(spriteFs);
  group.add(arrowFs.arrowGroup);

  // 2. F_r: Rotor PM Main Flux Vector (Red, d-axis)
  const arrowFr = createArrow(0xef4444, 0xdc2626, arrowLength - 2, 2.2);
  arrowFr.arrowGroup.name = "vector_Fr_rotor_d_axis";
  const spriteFr = createTextSprite("Fr (转子d轴)", "#f87171");
  spriteFr.position.set(0, arrowLength + 4, 0);
  arrowFr.arrowGroup.add(spriteFr);
  group.add(arrowFr.arrowGroup);

  // 3. I_q: Torque producing current vector (Emerald Green, q-axis)
  const iqBaseLength = arrowLength * 0.86;
  const arrowIq = createArrow(0x10b981, 0x059669, iqBaseLength, 2.0);
  arrowIq.arrowGroup.name = "vector_Iq_torque";
  const spriteIq = createTextSprite("Iq (交轴电流)", "#34d399");
  spriteIq.position.set(0, iqBaseLength + 8, 0);
  arrowIq.arrowGroup.add(spriteIq);
  group.add(arrowIq.arrowGroup);

  // 4. Center hub ring (depthTest=false, renderOrder=50)
  const hubGeo = new THREE.TorusGeometry(8, 1.2, 12, 32);
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.5,
    depthTest: false
  });
  const hubMesh = new THREE.Mesh(hubGeo, hubMat);
  hubMesh.renderOrder = 50;
  group.add(hubMesh);

  // 5. Dynamic Torque Angle Arc (delta) (depthTest=false, renderOrder=50)
  const arcRadius = 38;
  const arcPointsCount = 32;
  const arcGeo = new THREE.BufferGeometry();
  const arcPositions = new Float32Array(arcPointsCount * 3);
  arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));

  const arcMat = new THREE.LineBasicMaterial({
    color: 0xffe600,
    linewidth: 3,
    transparent: true,
    opacity: 0.95,
    depthTest: false
  });
  const arcLine = new THREE.Line(arcGeo, arcMat);
  arcLine.renderOrder = 50;
  arcLine.name = "torque_angle_arc";
  group.add(arcLine);

  // 6. Dynamic Air-Gap Flux Streamlines
  // 16 flux loop lines crossing between stator teeth and rotor poles
  const fluxLoopsCount = 16;
  const fluxLinePointsCount = 13; // curve.getPoints(12) produces 13 points
  const fluxLinesGroup = new THREE.Group();
  fluxLinesGroup.name = "air_gap_flux_streamlines";
  const fluxLines: THREE.Line[] = [];

  const fluxLineMat = new THREE.LineBasicMaterial({
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.75
  });

  const pRotorArr: THREE.Vector3[] = [];
  const pGapArr: THREE.Vector3[] = [];
  const pStatorArr: THREE.Vector3[] = [];
  const curveArr: THREE.QuadraticBezierCurve3[] = [];

  for (let f = 0; f < fluxLoopsCount; f++) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(fluxLinePointsCount * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const line = new THREE.Line(geo, fluxLineMat);
    fluxLines.push(line);
    fluxLinesGroup.add(line);

    const pr = new THREE.Vector3();
    const pg = new THREE.Vector3();
    const ps = new THREE.Vector3();
    pRotorArr.push(pr);
    pGapArr.push(pg);
    pStatorArr.push(ps);
    curveArr.push(new THREE.QuadraticBezierCurve3(pr, pg, ps));
  }
  group.add(fluxLinesGroup);

  const update = (values: ElectricalValues, state: SimulationState) => {
    // Mechanical rotor angle (since 8 poles -> 4 pole pairs, 1 mech rad = 4 elect rad)
    // For 3D visualization, convert electrical vector angles back to mechanical display space:
    const p = 4; // pole pairs
    const thetaMechRotor = state.theta_m;
    const deltaMech = values.deltaRad / p;
    const thetaMechFs = thetaMechRotor + deltaMech;
    const iqSign = values.I_q >= 0 ? 1 : -1;
    const thetaMechIq = thetaMechRotor + iqSign * (Math.PI / 2) / p;

    // Keep vector group in front of rotor even during exploded view
    group.position.z = 148 + 80 * state.explodedProgress;

    // Update F_s (Stator MMF vector)
    arrowFs.arrowGroup.rotation.z = thetaMechFs - Math.PI / 2;

    // Update F_r (Rotor PM d-axis)
    arrowFr.arrowGroup.rotation.z = thetaMechRotor - Math.PI / 2;

    // Update I_q (Torque vector)
    arrowIq.arrowGroup.rotation.z = thetaMechIq - Math.PI / 2;
    // Scale Iq arrow length (keep at least 0.55 so arrow and label stay outside center hub ring)
    const iqScale = 0.55 + 0.45 * Math.min(1.0, Math.abs(values.I_q) / 350);
    arrowIq.arrowGroup.scale.set(1, iqScale, 1);
    spriteIq.scale.set(20, 5 / iqScale, 1);

    // Update Dynamic Torque Angle Arc
    const startAngle = thetaMechRotor;
    const spanAngle = deltaMech;
    const pos = arcGeo.attributes.position.array as Float32Array;

    for (let i = 0; i < arcPointsCount; i++) {
      const frac = i / (arcPointsCount - 1);
      const a = startAngle + frac * spanAngle;
      pos[i * 3 + 0] = arcRadius * Math.cos(a);
      pos[i * 3 + 1] = arcRadius * Math.sin(a);
      pos[i * 3 + 2] = 0;
    }
    arcGeo.attributes.position.needsUpdate = true;

    // If regen braking (delta < 0), tint arc with magenta/red warning color
    if (values.deltaRad < 0) {
      arcMat.color.setHex(0xf43f5e);
    } else {
      arcMat.color.setHex(0xffe600);
    }

    // Update flux lines in the air gap (ZERO allocation)
    for (let f = 0; f < fluxLoopsCount; f++) {
      const basePoleAngle = (f / fluxLoopsCount) * Math.PI * 2 + thetaMechRotor;
      const statorDistort = basePoleAngle + deltaMech * 0.6;

      pRotorArr[f].set(56 * Math.cos(basePoleAngle), 56 * Math.sin(basePoleAngle), 0);
      pGapArr[f].set(64.6 * Math.cos((basePoleAngle + statorDistort) / 2), 64.6 * Math.sin((basePoleAngle + statorDistort) / 2), 0);
      pStatorArr[f].set(76 * Math.cos(statorDistort), 76 * Math.sin(statorDistort), 0);

      const pos = fluxLines[f].geometry.attributes.position.array as Float32Array;
      const rx = pRotorArr[f].x;
      const ry = pRotorArr[f].y;
      const gx = pGapArr[f].x;
      const gy = pGapArr[f].y;
      const sx = pStatorArr[f].x;
      const sy = pStatorArr[f].y;

      for (let pIdx = 0; pIdx < fluxLinePointsCount; pIdx++) {
        const t = pIdx / (fluxLinePointsCount - 1);
        const invT = 1.0 - t;
        const b0 = invT * invT;
        const b1 = 2.0 * invT * t;
        const b2 = t * t;
        pos[pIdx * 3 + 0] = b0 * rx + b1 * gx + b2 * sx;
        pos[pIdx * 3 + 1] = b0 * ry + b1 * gy + b2 * sy;
        pos[pIdx * 3 + 2] = 0;
      }
      fluxLines[f].geometry.attributes.position.needsUpdate = true;
    }
  };

  const setVisible = (visible: boolean) => {
    group.visible = visible;
  };

  const setFluxLinesVisible = (visible: boolean) => {
    fluxLinesGroup.visible = visible;
  };

  return {
    group,
    update,
    setVisible,
    setFluxLinesVisible
  };
}

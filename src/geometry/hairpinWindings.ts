import * as THREE from 'three';

export interface HairpinOptions {
  slots?: number;           // 48 slots
  stackLength?: number;     // 120 mm
  innerRadius?: number;     // Inner layer radius ~ 71 mm
  outerRadius?: number;     // Outer layer radius ~ 79 mm
  coilPitch?: number;       // 6 slots (full-pitch wave winding for 8P48S)
  tubeRadius?: number;      // Hairpin conductor radius ~ 1.35 mm
}

export interface HairpinPhaseMeshes {
  phaseU: THREE.Mesh;
  phaseV: THREE.Mesh;
  phaseW: THREE.Mesh;
  weldBeads: THREE.Mesh;
  group: THREE.Group;
  phaseCurves: {
    phaseUCurves: THREE.CatmullRomCurve3[];
    phaseVCurves: THREE.CatmullRomCurve3[];
    phaseWCurves: THREE.CatmullRomCurve3[];
  };
}

/**
 * Procedurally generates 3D Hairpin Copper Windings with authentic open-loop
 * wave-winding topology: each U-pin spans from slot `s` (inner layer) across the
 * Crown End (+Z) to slot `s + pitch` (outer layer), while at the Twist/Weld End (-Z)
 * the two legs twist outward in opposite directions (-pitch/2 and +pitch/2) to
 * laser-weld with adjacent coils rather than self-shorting.
 */
export function createHairpinWindings(options: HairpinOptions = {}): HairpinPhaseMeshes {
  const slots = options.slots || 48;
  const L = options.stackLength || 120;
  const halfL = L / 2;
  const R_in = options.innerRadius || 71;
  const R_out = options.outerRadius || 79;
  const pitch = options.coilPitch || 6;
  const wireRadius = options.tubeRadius || 1.35;

  const slotAngle = (Math.PI * 2) / slots;
  const crownHeight = 22; // Height of hairpin crown arch above core (+Z)
  const twistHeight = 20; // Height of twisted weld tips below core (-Z)
  const halfPitchAngle = (pitch / 2) * slotAngle;
  const weldRadius = (R_in + R_out) / 2;

  const phaseUGeometries: THREE.BufferGeometry[] = [];
  const phaseVGeometries: THREE.BufferGeometry[] = [];
  const phaseWGeometries: THREE.BufferGeometry[] = [];
  const weldBeadGeometries: THREE.BufferGeometry[] = [];

  const phaseUCurves: THREE.CatmullRomCurve3[] = [];
  const phaseVCurves: THREE.CatmullRomCurve3[] = [];
  const phaseWCurves: THREE.CatmullRomCurve3[] = [];

  const sphereBeadGeo = new THREE.SphereGeometry(wireRadius * 1.65, 8, 8);

  for (let s = 0; s < slots; s++) {
    // Determine Phase assignment for 48-slot, 8-pole 3-phase motor (q = 2 slots/pole/phase)
    const phaseGroup = Math.floor(s / 2) % 3; // 0 = U, 1 = V, 2 = W

    const slotFrom = s;
    const slotTo = (s + pitch) % slots;

    const angleFrom = slotFrom * slotAngle;
    const angleTo = (slotFrom + pitch) * slotAngle; // continuous angle without wrap jump
    const angleMid = (angleFrom + angleTo) * 0.5;

    // Wave-winding Twist End (-Z):
    // Inner leg from slot `s` twists backward (-pitch/2) to weld with coil from `s - pitch`
    // Outer leg from slot `s + pitch` twists forward (+pitch/2) to weld with coil at `s + 2*pitch`
    const angleWeldStart = angleFrom - halfPitchAngle;
    const angleWeldEnd = angleTo + halfPitchAngle;

    const pWeldStart = new THREE.Vector3(
      weldRadius * Math.cos(angleWeldStart),
      weldRadius * Math.sin(angleWeldStart),
      -halfL - twistHeight
    );

    const pTwistInMid = new THREE.Vector3(
      R_in * Math.cos(angleFrom - halfPitchAngle * 0.5),
      R_in * Math.sin(angleFrom - halfPitchAngle * 0.5),
      -halfL - twistHeight * 0.48
    );

    // Straight In-Slot Conductors (Inner Layer in slotFrom, Outer Layer in slotTo)
    const pBottomFrom = new THREE.Vector3(R_in * Math.cos(angleFrom), R_in * Math.sin(angleFrom), -halfL);
    const pMidSlotFrom = new THREE.Vector3(R_in * Math.cos(angleFrom), R_in * Math.sin(angleFrom), 0);
    const pTopFrom = new THREE.Vector3(R_in * Math.cos(angleFrom), R_in * Math.sin(angleFrom), halfL);

    // Crown Arch (Top side +Z): U-bend bridging inner layer (slot s) to outer layer (slot s + pitch)
    const pTopMid = new THREE.Vector3(
      weldRadius * Math.cos(angleMid),
      weldRadius * Math.sin(angleMid),
      halfL + crownHeight
    );

    const pTopTo = new THREE.Vector3(R_out * Math.cos(angleTo), R_out * Math.sin(angleTo), halfL);
    const pMidSlotTo = new THREE.Vector3(R_out * Math.cos(angleTo), R_out * Math.sin(angleTo), 0);
    const pBottomTo = new THREE.Vector3(R_out * Math.cos(angleTo), R_out * Math.sin(angleTo), -halfL);

    const pTwistOutMid = new THREE.Vector3(
      R_out * Math.cos(angleTo + halfPitchAngle * 0.5),
      R_out * Math.sin(angleTo + halfPitchAngle * 0.5),
      -halfL - twistHeight * 0.48
    );

    const pWeldEnd = new THREE.Vector3(
      weldRadius * Math.cos(angleWeldEnd),
      weldRadius * Math.sin(angleWeldEnd),
      -halfL - twistHeight
    );

    // Build open-ended wave-winding hairpin spline from pWeldStart -> Crown -> pWeldEnd
    const curvePoints = [
      pWeldStart,
      pTwistInMid,
      pBottomFrom,
      pMidSlotFrom,
      pTopFrom,
      pTopMid,
      pTopTo,
      pMidSlotTo,
      pBottomTo,
      pTwistOutMid,
      pWeldEnd
    ];

    const spline = new THREE.CatmullRomCurve3(curvePoints, false, 'centripetal', 0.5);
    const tubeGeo = new THREE.TubeGeometry(spline, 40, wireRadius, 8, false);

    if (phaseGroup === 0) {
      phaseUGeometries.push(tubeGeo);
      phaseUCurves.push(spline);
    } else if (phaseGroup === 1) {
      phaseVGeometries.push(tubeGeo);
      phaseVCurves.push(spline);
    } else {
      phaseWGeometries.push(tubeGeo);
      phaseWCurves.push(spline);
    }

    // Add laser-welded junction bead at each weld node (pWeldStart) where two adjacent hairpins meet
    const bead = sphereBeadGeo.clone();
    bead.translate(pWeldStart.x, pWeldStart.y, pWeldStart.z);
    weldBeadGeometries.push(bead);
  }
  sphereBeadGeo.dispose();

  // Merge geometries for single-draw-call WebGL efficiency
  const mergeGeos = (geos: THREE.BufferGeometry[]): THREE.BufferGeometry => {
    let totalVertices = 0;
    let totalIndices = 0;
    for (const g of geos) {
      totalVertices += g.attributes.position.count;
      if (g.index) totalIndices += g.index.count;
    }

    const posArray = new Float32Array(totalVertices * 3);
    const normalArray = new Float32Array(totalVertices * 3);
    const indexArray = new Uint32Array(totalIndices);

    let vOffset = 0;
    let iOffset = 0;

    for (const g of geos) {
      const p = g.attributes.position.array as Float32Array;
      const n = g.attributes.normal.array as Float32Array;
      posArray.set(p, vOffset * 3);
      normalArray.set(n, vOffset * 3);

      if (g.index) {
        const idx = g.index.array;
        for (let j = 0; j < idx.length; j++) {
          indexArray[iOffset + j] = idx[j] + vOffset;
        }
        iOffset += idx.length;
      }
      vOffset += g.attributes.position.count;
      g.dispose();
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normalArray, 3));
    merged.setIndex(new THREE.BufferAttribute(indexArray, 1));
    return merged;
  };

  const geoU = mergeGeos(phaseUGeometries);
  const geoV = mergeGeos(phaseVGeometries);
  const geoW = mergeGeos(phaseWGeometries);
  const geoBeads = mergeGeos(weldBeadGeometries);

  const matU = new THREE.MeshStandardMaterial({
    color: 0xe67e22, // Phase U: Copper Amber
    metalness: 0.88,
    roughness: 0.25,
    emissive: 0xff6600,
    emissiveIntensity: 0.2
  });

  const matV = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Phase V: Emerald Green
    metalness: 0.88,
    roughness: 0.25,
    emissive: 0x00ff88,
    emissiveIntensity: 0.2
  });

  const matW = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // Phase W: Electric Blue
    metalness: 0.88,
    roughness: 0.25,
    emissive: 0x00ccff,
    emissiveIntensity: 0.2
  });

  const matBeads = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Laser-welded copper tip
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0xff8800,
    emissiveIntensity: 0.3
  });

  const meshU = new THREE.Mesh(geoU, matU);
  const meshV = new THREE.Mesh(geoV, matV);
  const meshW = new THREE.Mesh(geoW, matW);
  const meshBeads = new THREE.Mesh(geoBeads, matBeads);

  meshU.name = "hairpin_phase_u";
  meshV.name = "hairpin_phase_v";
  meshW.name = "hairpin_phase_w";
  meshBeads.name = "hairpin_weld_beads";

  const group = new THREE.Group();
  group.name = "stator_hairpin_windings";
  group.add(meshU);
  group.add(meshV);
  group.add(meshW);
  group.add(meshBeads);

  return {
    phaseU: meshU,
    phaseV: meshV,
    phaseW: meshW,
    weldBeads: meshBeads,
    group,
    phaseCurves: {
      phaseUCurves,
      phaseVCurves,
      phaseWCurves
    }
  };
}

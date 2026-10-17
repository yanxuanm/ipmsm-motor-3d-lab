import * as THREE from 'three';

export interface RotorGeometryOptions {
  poles?: number;           // 8 poles (4 pole pairs)
  outerRadius?: number;     // 64.2 mm (air gap = 0.8 mm)
  innerRadius?: number;     // 22 mm (shaft bore)
  stackLength?: number;     // 120 mm
  magnetWidth?: number;     // 14 mm
  magnetThickness?: number; // 3.8 mm
  vAngleDeg?: number;       // 120 degrees
}

export interface RotorAssembly {
  rotorCore: THREE.Mesh;
  magnetsGroup: THREE.Group;
  shaft: THREE.Group;
  bearings: THREE.Group;
  resolver: THREE.Group;
  group: THREE.Group;
}

/**
 * Creates the complete V-Type Interior Permanent Magnet Rotor assembly,
 * including laminated rotor core with V-shaped flux barriers, alternating
 * N/S colored NdFeB magnets, splined shaft, precision ball bearings, and resolver.
 */
export function createVTypeRotor(options: RotorGeometryOptions = {}): RotorAssembly {
  const poles = options.poles || 8;
  const R_out = options.outerRadius || 64.2;
  const R_in = options.innerRadius || 22;
  const L = options.stackLength || 120;
  const halfL = L / 2;

  const poleAngle = (Math.PI * 2) / poles;

  // 1. Build Rotor Core 2D Shape with V-Slots as holes
  const rotorShape = new THREE.Shape();
  // Outer circle of rotor core
  const outerCircleSteps = 96;
  for (let i = 0; i <= outerCircleSteps; i++) {
    const a = (i / outerCircleSteps) * Math.PI * 2;
    const x = R_out * Math.cos(a);
    const y = R_out * Math.sin(a);
    if (i === 0) rotorShape.moveTo(x, y);
    else rotorShape.lineTo(x, y);
  }

  // Inner shaft bore hole
  const shaftHole = new THREE.Path();
  const innerSteps = 48;
  for (let i = 0; i <= innerSteps; i++) {
    const a = (i / innerSteps) * Math.PI * 2;
    // Add small spline keyway notches
    const splineOffset = (i % 4 === 1 || i % 4 === 2) ? 1.0 : 0.0;
    const r = R_in + splineOffset;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    if (i === 0) shaftHole.moveTo(x, y);
    else shaftHole.lineTo(x, y);
  }
  shaftHole.closePath();
  rotorShape.holes.push(shaftHole);

  // V-Shape Flux Barrier & Magnet Geometry parameters
  const magnetW = options.magnetWidth || 17.0;
  const magnetT = options.magnetThickness || 3.6;
  const magnetL = L - 2.0; // slightly recessed in stack
  const vSpreadAngle = 0.34; // Radians separation between the midpoints of the two arms of the V
  const R_apex = 35.0;       // Radius where the V converges inward near the shaft
  const R_wing = 58.5;       // Radius where the V wings extend outward toward air gap

  const magnetBoxGeo = new THREE.BoxGeometry(magnetW, magnetT, magnetL);
  magnetBoxGeo.computeVertexNormals();

  const magnetsGroup = new THREE.Group();
  magnetsGroup.name = "rotor_permanent_magnets";

  const matN = new THREE.MeshStandardMaterial({
    color: 0xef4444, // N-pole: Bright Red
    metalness: 0.85,
    roughness: 0.28,
    emissive: 0x991b1b,
    emissiveIntensity: 0.25
  });

  const matS = new THREE.MeshStandardMaterial({
    color: 0x3b82f6, // S-pole: Bright Blue
    metalness: 0.85,
    roughness: 0.28,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.25
  });

  // Generate 8 poles: V-slots and magnets
  for (let p = 0; p < poles; p++) {
    const centerA = p * poleAngle;
    const isNorth = p % 2 === 0;
    const magnetMat = isNorth ? matN : matS;

    // Left and Right arm angles of the V
    const a_left = centerA - vSpreadAngle * 0.5;
    const a_right = centerA + vSpreadAngle * 0.5;

    // Midpoints of left and right magnet slots
    const r_mid = (R_apex + R_wing) / 2;

    // Create 2D V-slot holes in the rotor lamination shape
    const makeVSlotPath = (armAngle: number, tilt: number) => {
      const path = new THREE.Path();
      const hw = (magnetW + 1.2) / 2;
      const ht = (magnetT + 1.0) / 2;
      const cx = r_mid * Math.cos(armAngle);
      const cy = r_mid * Math.sin(armAngle);

      // Local transformed 4 corners
      const corners = [
        new THREE.Vector2(-hw, -ht),
        new THREE.Vector2(hw, -ht),
        new THREE.Vector2(hw, ht),
        new THREE.Vector2(-hw, ht)
      ];

      const rot = armAngle + tilt;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      const transformed = corners.map(c => new THREE.Vector2(
        cx + (c.x * cosR - c.y * sinR),
        cy + (c.x * sinR + c.y * cosR)
      ));

      path.moveTo(transformed[0].x, transformed[0].y);
      for (let k = 1; k < transformed.length; k++) {
        path.lineTo(transformed[k].x, transformed[k].y);
      }
      path.closePath();
      return path;
    };

    rotorShape.holes.push(makeVSlotPath(a_left, -0.45));
    rotorShape.holes.push(makeVSlotPath(a_right, 0.45));

    // Place 3D permanent magnets inside the slots
    // Left magnet (inner apex converges toward pole centerline, outer wing flares toward air-gap)
    const meshLeft = new THREE.Mesh(magnetBoxGeo, magnetMat);
    const cx_l = r_mid * Math.cos(a_left);
    const cy_l = r_mid * Math.sin(a_left);
    meshLeft.position.set(cx_l, cy_l, 0);
    meshLeft.rotation.z = a_left - 0.45;
    meshLeft.name = `magnet_p${p}_left_${isNorth ? 'N' : 'S'}`;
    magnetsGroup.add(meshLeft);

    // Right magnet (inner apex converges toward pole centerline, outer wing flares toward air-gap)
    const meshRight = new THREE.Mesh(magnetBoxGeo, magnetMat);
    const cx_r = r_mid * Math.cos(a_right);
    const cy_r = r_mid * Math.sin(a_right);
    meshRight.position.set(cx_r, cy_r, 0);
    meshRight.rotation.z = a_right + 0.45;
    meshRight.name = `magnet_p${p}_right_${isNorth ? 'N' : 'S'}`;
    magnetsGroup.add(meshRight);
  }

  // Extrude Rotor Core
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: L,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelSegments: 2,
    curveSegments: 2
  };

  const rotorCoreGeo = new THREE.ExtrudeGeometry(rotorShape, extrudeSettings);
  rotorCoreGeo.center();
  rotorCoreGeo.computeVertexNormals();

  const rotorCoreMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Silicon steel grey
    metalness: 0.82,
    roughness: 0.38
  });

  const rotorCore = new THREE.Mesh(rotorCoreGeo, rotorCoreMat);
  rotorCore.name = "rotor_laminated_core";

  // 2. Central Hollow Splined Shaft (supports internal oil lance & centrifugal oil cooling)
  const shaftGroup = new THREE.Group();
  shaftGroup.name = "splined_shaft_assembly";

  const shaftTotalLength = 280;
  const shaftShape = new THREE.Shape();
  shaftShape.absarc(0, 0, R_in - 0.2, 0, Math.PI * 2, false);
  const shaftInnerBore = new THREE.Path();
  shaftInnerBore.absarc(0, 0, 11.2, 0, Math.PI * 2, true); // 22.4mm hollow internal oil cooling bore
  shaftShape.holes.push(shaftInnerBore);

  const shaftCoreGeo = new THREE.ExtrudeGeometry(shaftShape, {
    depth: shaftTotalLength,
    bevelEnabled: true,
    bevelThickness: 0.8,
    bevelSize: 0.8,
    bevelSegments: 2,
    curveSegments: 36
  });
  shaftCoreGeo.center();
  shaftCoreGeo.computeVertexNormals();

  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Polished high-strength alloy steel
    metalness: 0.92,
    roughness: 0.22,
    side: THREE.DoubleSide
  });
  const shaftCore = new THREE.Mesh(shaftCoreGeo, shaftMat);
  shaftCore.name = "hollow_shaft_core";
  shaftGroup.add(shaftCore);

  // Torque transmission splines on the output shaft end (+Z)
  const splineCount = 16;
  const splineToothGeo = new THREE.BoxGeometry(2.0, 1.4, 45);
  for (let s = 0; s < splineCount; s++) {
    const a = (s / splineCount) * Math.PI * 2;
    const tooth = new THREE.Mesh(splineToothGeo, shaftMat);
    tooth.position.set((R_in + 0.5) * Math.cos(a), (R_in + 0.5) * Math.sin(a), halfL + 65);
    tooth.rotation.z = a;
    shaftGroup.add(tooth);
  }

  // 3. Deep Groove Ball Bearings (Front & Rear)
  const bearingsGroup = new THREE.Group();
  bearingsGroup.name = "bearing_assemblies";

  const createBearing = (zPos: number, label: string) => {
    const bearingGroup = new THREE.Group();
    bearingGroup.name = label;

    const rInner = R_in;
    const rOuter = R_in + 18;
    const rMid = (rInner + rOuter) / 2;
    const bWidth = 14;

    const makeRingGeo = (rIn: number, rOut: number, width: number) => {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, rOut, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: width,
        bevelEnabled: true,
        bevelThickness: 0.4,
        bevelSize: 0.4,
        bevelSegments: 2,
        curveSegments: 36
      });
      geo.translate(0, 0, -width / 2);
      geo.computeVertexNormals();
      return geo;
    };

    // Outer race ring (R = 35.2..38.2 mm; upper half sliced open in cutaway mode to expose the steel balls!)
    const outerRaceMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.94,
      roughness: 0.14,
      side: THREE.DoubleSide
    });
    outerRaceMat.userData = { clipInCutaway: true };
    const outerMesh = new THREE.Mesh(makeRingGeo(rOuter - 2.8, rOuter + 0.2, bWidth), outerRaceMat);
    bearingGroup.add(outerMesh);

    // Inner race ring (R = 20.0..22.8 mm)
    const innerRaceMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.18,
      side: THREE.DoubleSide
    });
    innerRaceMat.userData = { clipInCutaway: true };
    const innerMesh = new THREE.Mesh(makeRingGeo(rInner, rInner + 2.8, bWidth), innerRaceMat);
    bearingGroup.add(innerMesh);

    // Rolling balls
    const ballCount = 10;
    const ballGeo = new THREE.SphereGeometry(3.6, 12, 12);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.05 });
    for (let b = 0; b < ballCount; b++) {
      const a = (b / ballCount) * Math.PI * 2;
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(rMid * Math.cos(a), rMid * Math.sin(a), 0);
      bearingGroup.add(ball);
    }

    bearingGroup.position.z = zPos;
    return bearingGroup;
  };

  const frontBearing = createBearing(halfL + 25, "front_bearing");
  const rearBearing = createBearing(-halfL - 25, "rear_bearing");
  bearingsGroup.add(frontBearing);
  bearingsGroup.add(rearBearing);

  // 4. Resolver (Angle sensor mounted at shaft tail -Z)
  const resolverGroup = new THREE.Group();
  resolverGroup.name = "resolver_sensor";
  const resolverRotorGeo = new THREE.CylinderGeometry(R_in + 7, R_in + 7, 10, 16);
  const resolverMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.3 });
  const resolverRotor = new THREE.Mesh(resolverRotorGeo, resolverMat);
  resolverRotor.rotation.x = Math.PI / 2;
  resolverGroup.add(resolverRotor);

  // Pickup coils ring on resolver stator
  const coilRingGeo = new THREE.TorusGeometry(R_in + 12, 2.5, 8, 24);
  const coilMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.25 });
  const coilRing = new THREE.Mesh(coilRingGeo, coilMat);
  resolverGroup.add(coilRing);
  resolverGroup.position.z = -halfL - 55;

  // Composite Master Rotor Group
  const masterGroup = new THREE.Group();
  masterGroup.name = "ipmsm_rotor_assembly";
  masterGroup.add(rotorCore);
  masterGroup.add(magnetsGroup);
  masterGroup.add(shaftGroup);
  masterGroup.add(bearingsGroup);
  masterGroup.add(resolverGroup);

  return {
    rotorCore,
    magnetsGroup,
    shaft: shaftGroup,
    bearings: bearingsGroup,
    resolver: resolverGroup,
    group: masterGroup
  };
}

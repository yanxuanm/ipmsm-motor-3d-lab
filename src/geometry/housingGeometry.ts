import * as THREE from 'three';

export interface HousingOptions {
  outerRadius?: number;     // 112 mm
  innerRadius?: number;     // 98.5 mm
  length?: number;          // 170 mm
  spiralTurns?: number;     // 8.18 spiral loops
}

export interface HousingAssembly {
  housingMesh: THREE.Mesh;
  waterJacketMesh: THREE.Mesh;
  oilCoolingGroup: THREE.Group;
  spiralCurve: THREE.CatmullRomCurve3;
  oilCurves: THREE.CatmullRomCurve3[];
  frontEndShield: THREE.Group;
  rearEndShield: THREE.Group;
  group: THREE.Group;
}

/**
 * Creates the EV motor cast aluminum housing with axial cooling ribs,
 * integrated 8-turn spiral water cooling jacket, AND internal direct oil-spray
 * cooling system (top oil feed rail, front/rear hairpin end-winding spray rings,
 * hollow-shaft internal oil lance with centrifugal slingers, and bottom oil sump).
 */
export function createMotorHousing(options: HousingOptions = {}): HousingAssembly {
  const R_out = options.outerRadius || 112;
  const R_in = options.innerRadius || 98.5;
  const L = options.length || 170;
  const halfL = L / 2; // 85 mm
  const spiralTurns = options.spiralTurns || 8.18;

  // ============================================================================
  // 1. 360° Mirror-Smooth Precision Cast-Aluminum Water-Jacket Housing Shell
  //    Built with LatheGeometry (96 radial segments) so circumferential normals
  //    are 100% smooth with zero polygonal facet stripes or gear-tooth artifacts.
  // ============================================================================
  const housingProfile = [
    new THREE.Vector2(R_in, -halfL),
    new THREE.Vector2(R_out - 1.4, -halfL),
    new THREE.Vector2(R_out, -halfL + 1.4),
    new THREE.Vector2(R_out, -halfL + 1.8),
    new THREE.Vector2(R_out, halfL - 1.8),
    new THREE.Vector2(R_out, halfL - 1.4),
    new THREE.Vector2(R_out - 1.4, halfL),
    new THREE.Vector2(R_in, halfL),
    new THREE.Vector2(R_in, halfL - 0.5),
    new THREE.Vector2(R_in, -halfL + 0.5),
    new THREE.Vector2(R_in, -halfL)
  ];
  const housingGeo = new THREE.LatheGeometry(housingProfile, 96);
  housingGeo.rotateX(Math.PI / 2);
  housingGeo.computeVertexNormals();

  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Matte anodized cast aluminum
    metalness: 0.78,
    roughness: 0.34,
    side: THREE.DoubleSide
  });
  const housingMesh = new THREE.Mesh(housingGeo, housingMat);
  housingMesh.name = 'aluminum_housing_jacket';

  // ============================================================================
  // 2. Outer Spiral Water Cooling Jacket (Strictly Cool Cyan-Blue Palette)
  //    Mounted inside the housing wall (R = 105.25 mm), with Inlet/Outlet ports
  //    on the upper-left (-X, +Y, ~148°) so they NEVER clash with the top/right oil circuit
  // ============================================================================
  const spiralPoints: THREE.Vector3[] = [];
  const pointsPerTurn = 40;
  const totalHelixPoints = Math.round(spiralTurns * pointsPerTurn);
  const R_spiral = (R_in + R_out) * 0.5; // 105.25 mm inside housing wall
  const zStart = halfL * 0.76;           // +64.6 mm (Front / Cold Water Inlet +Z)
  const zEnd = -halfL * 0.76;            // -64.6 mm (Rear / Warm Water Outlet -Z)
  const startAngle = Math.PI * 0.68;     // ~122.4 deg (Upper-Left-Top, clearly visible in open viewport)

  // Radial inlet lead-in from outer nozzle into spiral channel (+Z front side)
  const inletDirX = Math.cos(startAngle);
  const inletDirY = Math.sin(startAngle);
  spiralPoints.push(new THREE.Vector3((R_out + 20) * inletDirX, (R_out + 20) * inletDirY, zStart));
  spiralPoints.push(new THREE.Vector3((R_out + 9) * inletDirX, (R_out + 9) * inletDirY, zStart));

  // Helical path from +Z (cold inlet) to -Z (warm outlet)
  for (let i = 0; i <= totalHelixPoints; i++) {
    const fraction = i / totalHelixPoints;
    const angle = startAngle + fraction * Math.PI * 2 * spiralTurns;
    const z = zStart + fraction * (zEnd - zStart);
    spiralPoints.push(
      new THREE.Vector3(
        R_spiral * Math.cos(angle),
        R_spiral * Math.sin(angle),
        z
      )
    );
  }

  // Radial outlet lead-out from spiral channel to outer nozzle (-Z rear side)
  const endAngle = startAngle + Math.PI * 2 * spiralTurns;
  const outletDirX = Math.cos(endAngle);
  const outletDirY = Math.sin(endAngle);
  spiralPoints.push(new THREE.Vector3((R_out + 9) * outletDirX, (R_out + 9) * outletDirY, zEnd));
  spiralPoints.push(new THREE.Vector3((R_out + 20) * outletDirX, (R_out + 20) * outletDirY, zEnd));

  const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints, false, 'catmullrom', 0.35);
  const tabularSegments = 320;
  const radialSegments = 14;
  const tubeRadius = 3.8;
  const spiralGeo = new THREE.TubeGeometry(spiralCurve, tabularSegments, tubeRadius, radialSegments, false);

  // Compute vertex colors along the water tube using a strictly COOL-BLUE / CYAN-VIOLET palette
  // so the Water Jacket (Blue/Cyan) NEVER clashes visually with the Golden-Amber ATF Oil!
  const posAttr = spiralGeo.attributes.position;
  const vertexCount = posAttr.count;
  const colors = new Float32Array(vertexCount * 3);
  const coldColor = new THREE.Color(0x00f2fe); // Ice Cyan (+Z inlet)
  const midColor = new THREE.Color(0x0284c7);  // Deep Ocean Azure (mid-housing)
  const warmColor = new THREE.Color(0x6366f1); // Warmed Coolant Indigo-Violet (-Z outlet)
  const tempColor = new THREE.Color();

  const axialT = new Float32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    const z = posAttr.getZ(i);
    const t = THREE.MathUtils.clamp((zStart - z) / (zStart - zEnd), 0, 1);
    axialT[i] = t;
    if (t < 0.5) {
      tempColor.lerpColors(coldColor, midColor, t / 0.5);
    } else {
      tempColor.lerpColors(midColor, warmColor, (t - 0.5) / 0.5);
    }
    colors[i * 3 + 0] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }
  spiralGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  spiralGeo.userData.axialT = axialT;

  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    metalness: 0.05,
    roughness: 0.15,
    transmission: 0.25,
    opacity: 0.88,
    transparent: true,
    emissive: 0x0f172a,
    emissiveIntensity: 0.20,
    side: THREE.DoubleSide
  });

  // Helper to build industrial CNC-machined inlet/outlet flange fitting
  const createPortNozzle = (
    angle: number,
    zPos: number,
    ringHex: number,
    emissiveHex: number,
    radiusBase: number = R_out + 1.5
  ): THREE.Group => {
    const portGroup = new THREE.Group();
    const dir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);

    const flangeGeo = new THREE.CylinderGeometry(7.8, 8.8, 5, 24);
    const flangeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.22
    });
    const flangeMesh = new THREE.Mesh(flangeGeo, flangeMat);

    const ringGeo = new THREE.CylinderGeometry(6.0, 6.0, 5.5, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: ringHex,
      emissive: emissiveHex,
      emissiveIntensity: 0.6,
      metalness: 0.65,
      roughness: 0.25
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 4.8;

    const tipGeo = new THREE.CylinderGeometry(4.8, 5.2, 7.5, 24);
    const tipMesh = new THREE.Mesh(tipGeo, flangeMat);
    tipMesh.position.y = 10.2;

    portGroup.add(flangeMesh, ringMesh, tipMesh);

    const up = new THREE.Vector3(0, 1, 0);
    portGroup.quaternion.setFromUnitVectors(up, dir);
    portGroup.position.set(dir.x * radiusBase, dir.y * radiusBase, zPos);
    return portGroup;
  };

  const waterJacketMesh = new THREE.Mesh(spiralGeo, waterMat);
  waterJacketMesh.name = 'cooling_water_jacket';

  const inletNozzle = createPortNozzle(startAngle, zStart, 0x00f2fe, 0x0284c7);
  const outletNozzle = createPortNozzle(endAngle, zEnd, 0x38bdf8, 0x4f46e5);
  waterJacketMesh.add(inletNozzle);
  waterJacketMesh.add(outletNozzle);

  // ============================================================================
  // 3. INTERNAL ATF OIL IMMERSION COOLING & BEARING LUBRICATION SYSTEM
  //    True Continuous 3D Liquid Immersion & Lubrication Architecture:
  //    - Hardware Manifold Pipes use Dark Anodized Bronze/Titanium (#78350f / #92400e)
  //      so they NEVER look like yellow U-phase hairpin copper wires!
  //    - Liquid ATF Oil uses a two-tone Honey-Amber Orange volume (`oilBathVolumeMat`)
  //      paired with a high-visibility Horizontal Liquid Surface Plane (`oilSurfacePlaneMat`)
  //      so the flat liquid level submerging the parts is 100% unmistakable!
  //    - Four Connected Liquid Immersion & Lubrication Regions:
  //      1) Hollow-Shaft Internal Liquid Oil Trough (Y <= -1.2 mm, Z = -112..+112 mm)
  //      2) Front & Rear Ball Bearing Raceway Oil Baths (Z = ±85 mm, Y <= -11.5 mm)
  //         submerging the lower rolling steel balls + Liquid Waterfall Overflow Curtains
  //      3) Top-Arc Hairpin Shower Manifolds + Continuous Translucent Liquid Oil Film
  //         Sheaths wrapping over the Front (+Z) & Rear (-Z) Hairpin Copper Crowns
  //      4) Deep Bottom Stator / Hairpin / Rotor Rim Oil Immersion Bath (Y <= -50.0 mm)
  //         with a glowing horizontal liquid surface plane submerging the lower 40% of
  //         the Hairpin Windings, Stator Teeth, and V-Type Rotor Magnets!
  // ============================================================================
  const oilCoolingGroup = new THREE.Group();
  oilCoolingGroup.name = 'oil_cooling_system';

  // Dark anodized bronze-titanium manifold pipe material (distinct from yellow U-phase copper wires!)
  const oilManifoldMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    emissive: 0x78350f,
    emissiveIntensity: 0.35,
    metalness: 0.82,
    roughness: 0.25,
    side: THREE.DoubleSide
  });

  // Submerged 3D Liquid Oil Bath Volume Material (rich translucent golden-amber)
  const oilBathVolumeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.56,
    metalness: 0.12,
    roughness: 0.08,
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  // Horizontal Top Liquid Surface Meniscus Plane Material (bright glowing golden liquid surface)
  const oilSurfacePlaneMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.82,
    metalness: 0.15,
    roughness: 0.05,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  // Crisp Glowing Golden Waterline Meniscus Rim Material (marks exact liquid surface boundary!)
  const oilWaterlineRimMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfbbf24,
    emissiveIntensity: 1.05,
    metalness: 0.20,
    roughness: 0.10
  });

  // Flowing Liquid Oil Film / Waterfall Curtain Material (coats hairpins & bearing overflows)
  const oilCurtainMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.62,
    metalness: 0.10,
    roughness: 0.08,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  // ----------------------------------------------------------------------------
  // REGION 1: Hollow-Shaft Internal Liquid Oil Trough (空心花键轴剖面液态导油槽)
  //           Horizontal liquid surface at Y = -0.5 mm inside the R = 11.2 mm shaft bore
  // ----------------------------------------------------------------------------
  const rShaftOil = 10.9;
  const yShaftOil = -0.5;
  const aShaftR = Math.asin(yShaftOil / rShaftOil);
  const aShaftL = -Math.PI - aShaftR;

  const shaftTroughShape = new THREE.Shape();
  shaftTroughShape.absarc(0, 0, rShaftOil, aShaftR, aShaftL, true);
  shaftTroughShape.closePath();

  const shaftTroughDepth = 224; // Spans Z = -112..+112 mm through the hollow shaft
  const shaftTroughGeo = new THREE.ExtrudeGeometry(shaftTroughShape, {
    depth: shaftTroughDepth,
    bevelEnabled: false,
    curveSegments: 36
  });
  shaftTroughGeo.translate(0, 0, -shaftTroughDepth / 2);
  shaftTroughGeo.computeVertexNormals();
  oilCoolingGroup.add(new THREE.Mesh(shaftTroughGeo, oilBathVolumeMat));

  // Flat horizontal glowing liquid surface strip inside the sliced hollow shaft (Y = -0.42 mm)
  const xShaftMeniscus = Math.sqrt(rShaftOil * rShaftOil - yShaftOil * yShaftOil);
  const shaftSurfaceGeo = new THREE.PlaneGeometry(xShaftMeniscus * 2, shaftTroughDepth);
  shaftSurfaceGeo.rotateX(-Math.PI / 2);
  const shaftSurfaceMesh = new THREE.Mesh(shaftSurfaceGeo, oilSurfacePlaneMat);
  shaftSurfaceMesh.position.set(0, yShaftOil + 0.08, 0);
  oilCoolingGroup.add(shaftSurfaceMesh);

  // Crisp glowing waterline edges along the sliced hollow shaft liquid surface
  for (const sx of [-1, 1]) {
    const shaftRimMesh = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.LineCurve3(
          new THREE.Vector3(sx * xShaftMeniscus, yShaftOil + 0.12, -112),
          new THREE.Vector3(sx * xShaftMeniscus, yShaftOil + 0.12, 112)
        ),
        12,
        0.55,
        8,
        false
      ),
      oilWaterlineRimMat
    );
    oilCoolingGroup.add(shaftRimMesh);
  }

  // ----------------------------------------------------------------------------
  // REGION 2: Front (+85 mm) & Rear (-85 mm) Ball Bearing Raceway Oil Immersion Baths
  //           Submerges the lower 5 chrome steel balls (at R = 29 mm) inside an annular
  //           golden oil pool (R_in = 22.6 mm, R_out = 35.4 mm, waterline at Y = -11.0 mm)
  //           + Continuous Liquid Waterfall Curtain overflowing into the Bottom Oil Bath!
  // ----------------------------------------------------------------------------
  const rBearIn = 22.5;
  const rBearOut = 35.5;
  const yBearOil = -11.0; // Submerges the lower 5 rolling steel balls (which sit at R = 29 mm)
  const aBearOutR = Math.asin(yBearOil / rBearOut);
  const aBearOutL = -Math.PI - aBearOutR;
  const aBearInR = Math.asin(yBearOil / rBearIn);
  const aBearInL = -Math.PI - aBearInR;

  const bearingBathShape = new THREE.Shape();
  bearingBathShape.absarc(0, 0, rBearOut, aBearOutR, aBearOutL, true);
  bearingBathShape.lineTo(rBearIn * Math.cos(aBearInL), yBearOil);
  bearingBathShape.absarc(0, 0, rBearIn, aBearInL, aBearInR, false);
  bearingBathShape.closePath();

  const bearingBathGeo = new THREE.ExtrudeGeometry(bearingBathShape, {
    depth: 13.6,
    bevelEnabled: false,
    curveSegments: 48
  });
  bearingBathGeo.translate(0, 0, -6.8);
  bearingBathGeo.computeVertexNormals();

  const xBearOut = Math.sqrt(rBearOut * rBearOut - yBearOil * yBearOil);
  const xBearIn = Math.sqrt(rBearIn * rBearIn - yBearOil * yBearOil);

  for (const bz of [85, -85]) {
    const signZ = bz >= 0 ? 1 : -1;

    // 1. Annular liquid oil pool inside the bearing raceway submerging the lower steel balls
    const bPoolMesh = new THREE.Mesh(bearingBathGeo, oilBathVolumeMat);
    bPoolMesh.position.z = bz;
    oilCoolingGroup.add(bPoolMesh);

    // 2. Horizontal glowing liquid surface planes on the left & right sides of the Bearing Oil Bath (Y = -10.9 mm)
    for (const sideSign of [-1, 1]) {
      const wStrip = xBearOut - xBearIn;
      const bSurfGeo = new THREE.PlaneGeometry(wStrip, 13.6);
      bSurfGeo.rotateX(-Math.PI / 2);
      const bSurfMesh = new THREE.Mesh(bSurfGeo, oilSurfacePlaneMat);
      bSurfMesh.position.set(sideSign * (xBearIn + wStrip * 0.5), yBearOil + 0.1, bz);
      oilCoolingGroup.add(bSurfMesh);

      // Crisp golden waterline meniscus bar across the bearing oil level
      const bLevelRim = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.LineCurve3(
            new THREE.Vector3(sideSign * xBearIn, yBearOil + 0.15, bz + signZ * 6.8),
            new THREE.Vector3(sideSign * xBearOut, yBearOil + 0.15, bz + signZ * 6.8)
          ),
          4,
          0.65,
          8,
          false
        ),
        oilWaterlineRimMat
      );
      oilCoolingGroup.add(bLevelRim);
    }

    // 3. Radial lubrication oil sheet flowing from the Hollow-Shaft Oil Trough (R = 10.5 mm)
    //    down through the lower shaft lubrication holes into the Bearing Oil Bath (R = 23 mm)
    const shaftFeedRibbonGeo = new THREE.CylinderGeometry(23.0, 10.5, 8.5, 24, 1, true, Math.PI * 0.65, Math.PI * 0.70);
    shaftFeedRibbonGeo.rotateX(Math.PI / 2);
    const shaftFeedRibbon = new THREE.Mesh(shaftFeedRibbonGeo, oilSurfacePlaneMat);
    shaftFeedRibbon.position.z = bz;
    oilCoolingGroup.add(shaftFeedRibbon);
  }

  // ----------------------------------------------------------------------------
  // REGION 3: Top-Arc Hairpin Shower Manifolds & Downward Liquid Fan Cones
  //           Spraying onto the Front (+Z) & Rear (-Z) Hairpin Copper Crowns
  // ----------------------------------------------------------------------------
  const R_dripRing = 86.0;
  const zCrownFront = 71.5;
  const zCrownRear = -70.5;
  const topOilAngle = Math.PI * 0.52; // ~93.6 deg (top center)

  const topOilInletNozzle = createPortNozzle(topOilAngle, 0, 0xfbbf24, 0xd97706, R_out + 1.5);
  oilCoolingGroup.add(topOilInletNozzle);

  const railX = R_dripRing * Math.cos(topOilAngle);
  const railY = R_dripRing * Math.sin(topOilAngle);

  const radialDropMesh = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.LineCurve3(
        new THREE.Vector3((R_out + 10) * Math.cos(topOilAngle), (R_out + 10) * Math.sin(topOilAngle), 0),
        new THREE.Vector3(railX, railY, 0)
      ),
      8,
      2.4,
      12,
      false
    ),
    oilManifoldMat
  );
  oilCoolingGroup.add(radialDropMesh);

  const axialRailMesh = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.LineCurve3(
        new THREE.Vector3(railX, railY, zCrownRear),
        new THREE.Vector3(railX, railY, zCrownFront)
      ),
      20,
      2.2,
      12,
      false
    ),
    oilManifoldMat
  );
  oilCoolingGroup.add(axialRailMesh);

  const buildHairpinShowerHeader = (zRing: number) => {
    const zoneGroup = new THREE.Group();

    // 1. Dark-bronze Top-Arc Oil Shower Manifold (θ = 76°..136°, directly above the intact upper Hairpin Crown)
    const arcPts: THREE.Vector3[] = [];
    const arcSteps = 20;
    const aStart = (76 * Math.PI) / 180;
    const aEnd = (136 * Math.PI) / 180;
    for (let i = 0; i <= arcSteps; i++) {
      const a = aStart + (i / arcSteps) * (aEnd - aStart);
      arcPts.push(new THREE.Vector3(R_dripRing * Math.cos(a), R_dripRing * Math.sin(a), zRing));
    }
    const headerCurve = new THREE.CatmullRomCurve3(arcPts);
    const headerMesh = new THREE.Mesh(
      new THREE.TubeGeometry(headerCurve, 24, 2.0, 12, false),
      oilManifoldMat
    );
    zoneGroup.add(headerMesh);

    // 2. 6 Downward Oil Nozzles & Liquid Fan Cones hitting the intact upper Hairpin Crowns
    const nozzleGeo = new THREE.CylinderGeometry(1.0, 1.3, 3.8, 10);
    const coneJetGeo = new THREE.ConeGeometry(3.6, 11.5, 12, 1, true);
    for (let j = 0; j < 6; j++) {
      const a = ((80 + j * 10.4) * Math.PI) / 180;
      const nx = (R_dripRing - 1.8) * Math.cos(a);
      const ny = (R_dripRing - 1.8) * Math.sin(a);

      const nozzle = new THREE.Mesh(nozzleGeo, oilManifoldMat);
      nozzle.position.set(nx, ny, zRing);
      nozzle.rotation.z = a - Math.PI / 2;
      zoneGroup.add(nozzle);

      const jetCone = new THREE.Mesh(coneJetGeo, oilCurtainMat);
      jetCone.position.set((R_dripRing - 7.5) * Math.cos(a), (R_dripRing - 7.5) * Math.sin(a), zRing);
      jetCone.rotation.z = a + Math.PI / 2;
      zoneGroup.add(jetCone);
    }

    return zoneGroup;
  };

  oilCoolingGroup.add(buildHairpinShowerHeader(zCrownFront));
  oilCoolingGroup.add(buildHairpinShowerHeader(zCrownRear));

  // ----------------------------------------------------------------------------
  // REGION 4: Deep Bottom Liquid Oil Immersion Bath (底部定转子与发卡绕组深层浸没液态油池)
  //           Horizontal liquid surface at Y = -28.0 mm (R_sump = 100.8 mm, Z = -83..+83 mm)
  //           visibly submerges ("浸没"):
  //           - The bottom 66% of the Front & Rear Hairpin Copper End-Windings (R = 68.5..83.5 mm)
  //           - The bottom 70% of the Stator Core Teeth & Slots (R = 65..98.5 mm)
  //           - The bottom 56% of the V-Type Rotor Core & Permanent Magnets (R = 45..64.2 mm)
  //           - The lower rim of the Front & Rear Ball Bearings (R = 20..38 mm)
  // ----------------------------------------------------------------------------
  const R_sump = 100.8; // Exceeds Stator R_out (98.5 mm) so the bottom oil bath is never occluded by the stator!
  const yOilLevel = -28.0; // Deep horizontal oil immersion level!
  const thetaRight = Math.asin(yOilLevel / R_sump); // ~ -0.281 rad (-16.1 deg)
  const thetaLeft = -Math.PI - thetaRight;          // ~ -2.860 rad (-163.9 deg)

  const sumpPoolShape = new THREE.Shape();
  sumpPoolShape.absarc(0, 0, R_sump, thetaRight, thetaLeft, true);
  sumpPoolShape.closePath();

  const zSumpRear = -83.0;
  const zSumpFront = 83.0;
  const sumpDepth = zSumpFront - zSumpRear; // 166 mm (sits cleanly between Front & Rear Bearings at Z = ±85 mm!)
  const zSumpCenter = 0.0;

  const sumpPoolGeo = new THREE.ExtrudeGeometry(sumpPoolShape, {
    depth: sumpDepth,
    bevelEnabled: false,
    curveSegments: 64
  });
  sumpPoolGeo.translate(0, 0, zSumpRear);
  sumpPoolGeo.computeVertexNormals();

  const sumpPoolMesh = new THREE.Mesh(sumpPoolGeo, oilBathVolumeMat);
  oilCoolingGroup.add(sumpPoolMesh);

  // Flat Horizontal Glowing Liquid Surface Plane at Y = -31.9 mm (makes the liquid immersion level 100% clear!)
  const xMeniscus = Math.sqrt(R_sump * R_sump - yOilLevel * yOilLevel); // ~ 95.6 mm
  const mainLiquidSurfaceGeo = new THREE.PlaneGeometry(xMeniscus * 2, sumpDepth);
  mainLiquidSurfaceGeo.rotateX(-Math.PI / 2);
  const mainLiquidSurfaceMesh = new THREE.Mesh(mainLiquidSurfaceGeo, oilSurfacePlaneMat);
  mainLiquidSurfaceMesh.position.set(0, yOilLevel + 0.1, zSumpCenter);
  oilCoolingGroup.add(mainLiquidSurfaceMesh);

  // Crisp Glowing Golden Waterline Meniscus Rim around the horizontal liquid surface (Y = -31.85 mm)
  // and front/rear semicircular oil bath walls so the aquarium cutaway of the oil bath is unmistakable!
  const meniscusRimPts = [
    new THREE.Vector3(-xMeniscus, yOilLevel + 0.15, zSumpRear),
    new THREE.Vector3(xMeniscus, yOilLevel + 0.15, zSumpRear),
    new THREE.Vector3(xMeniscus, yOilLevel + 0.15, zSumpFront),
    new THREE.Vector3(-xMeniscus, yOilLevel + 0.15, zSumpFront),
    new THREE.Vector3(-xMeniscus, yOilLevel + 0.15, zSumpRear)
  ];
  for (let m = 0; m < 4; m++) {
    const segCurve = new THREE.LineCurve3(meniscusRimPts[m], meniscusRimPts[m + 1]);
    const segMesh = new THREE.Mesh(
      new THREE.TubeGeometry(segCurve, 12, 0.95, 10, false),
      oilWaterlineRimMat
    );
    oilCoolingGroup.add(segMesh);
  }

  for (const zFace of [zSumpFront, zSumpRear]) {
    const arcWallPts: THREE.Vector3[] = [];
    const wallSteps = 36;
    for (let w = 0; w <= wallSteps; w++) {
      const a = thetaRight + (w / wallSteps) * (thetaLeft - thetaRight);
      arcWallPts.push(new THREE.Vector3(R_sump * Math.cos(a), R_sump * Math.sin(a), zFace));
    }
    const arcWallCurve = new THREE.CatmullRomCurve3(arcWallPts);
    const arcWallRim = new THREE.Mesh(
      new THREE.TubeGeometry(arcWallCurve, 36, 0.90, 10, false),
      oilWaterlineRimMat
    );
    oilCoolingGroup.add(arcWallRim);
  }

  // Bottom Scavenge Drain Port & Return Pipe (-Y bottom of housing at Z = -20 mm)
  const bottomDrainNozzle = createPortNozzle(-Math.PI / 2, -20, 0xf59e0b, 0xd97706, R_out + 1.5);
  oilCoolingGroup.add(bottomDrainNozzle);

  const bottomDrainPipe = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.LineCurve3(
        new THREE.Vector3(0, -82, -20),
        new THREE.Vector3(0, -(R_out + 12), -20)
      ),
      8,
      3.0,
      12,
      false
    ),
    oilManifoldMat
  );
  oilCoolingGroup.add(bottomDrainPipe);

  // ----------------------------------------------------------------------------
  // 3e. Build 3D Dynamic Oil Flow Curves (`oilCurves`) connecting all Baths:
  //     - Top Oil Shower -> Cascading along Hairpin Copper Crowns -> Bottom Oil Bath
  //     - Hollow-Shaft Oil Trough -> Front & Rear Bearing Oil Baths -> Bottom Oil Bath
  //     - Hollow-Shaft Oil Trough -> Lower Rotor V-Magnets -> Bottom Oil Bath
  // ----------------------------------------------------------------------------
  const oilCurves: THREE.CatmullRomCurve3[] = [];

  // 1. Top Shower -> Cascading over Hairpin End-Windings -> Submerging in Bottom Oil Bath (Y <= -32 mm)
  const cascadeAngles = [
    Math.PI * 0.46,
    Math.PI * 0.56,
    Math.PI * 0.66,
    Math.PI * 0.74
  ];
  for (const zRing of [zCrownFront, zCrownRear]) {
    const signZ = zRing >= 0 ? 1 : -1;
    for (const startA of cascadeAngles) {
      const pts = [
        new THREE.Vector3((R_out + 14) * Math.cos(topOilAngle), (R_out + 14) * Math.sin(topOilAngle), 0),
        new THREE.Vector3(railX, railY, 0),
        new THREE.Vector3(railX, railY, zRing),
        new THREE.Vector3(R_dripRing * Math.cos(startA), R_dripRing * Math.sin(startA), zRing),
        // Impinge onto top of Hairpin Copper Crown (R = 75 mm)
        new THREE.Vector3(75 * Math.cos(startA), 75 * Math.sin(startA), signZ * 75),
        // Flow around the Hairpin Copper Bundle down into the Bottom Oil Bath (Y = -32..-85 mm)
        new THREE.Vector3(75 * Math.cos(Math.PI * 0.95), 75 * Math.sin(Math.PI * 0.95), signZ * 77),
        new THREE.Vector3(75 * Math.cos(Math.PI * 1.25), 75 * Math.sin(Math.PI * 1.25), signZ * 74),
        new THREE.Vector3(0, -76, signZ * 66),
        new THREE.Vector3(0, -90, -20),
        new THREE.Vector3(0, -(R_out + 14), -20)
      ];
      oilCurves.push(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35));
    }
  }

  // 2. Hollow-Shaft Trough -> Front & Rear Bearing Oil Baths (Z = ±85 mm) -> Overflow into Bottom Oil Bath
  for (const bz of [85, -85]) {
    for (const bAngle of [-Math.PI * 0.22, -Math.PI * 0.50, -Math.PI * 0.78]) {
      const pts = [
        new THREE.Vector3(0, -3, -108),
        new THREE.Vector3(0, -3, bz),
        // Enter Bearing Raceway Oil Bath (R = 29 mm, Y <= -11.0 mm)
        new THREE.Vector3(29 * Math.cos(bAngle), 29 * Math.sin(bAngle), bz),
        new THREE.Vector3(0, -34, bz),
        // Overflow into Bottom Oil Immersion Bath
        new THREE.Vector3(0, -64, bz * 0.88),
        new THREE.Vector3(0, -90, -20),
        new THREE.Vector3(0, -(R_out + 14), -20)
      ];
      oilCurves.push(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35));
    }
  }

  // 3. Hollow-Shaft Trough -> Lower Rotor V-Magnet Slots -> Bottom Oil Immersion Bath
  for (const mAngle of [-Math.PI * 0.25, -Math.PI * 0.42, -Math.PI * 0.58, -Math.PI * 0.75]) {
    for (const signZ of [1, -1]) {
      const pts = [
        new THREE.Vector3(0, -3, 0),
        new THREE.Vector3(46.2 * Math.cos(mAngle), 46.2 * Math.sin(mAngle), 0),
        new THREE.Vector3(46.2 * Math.cos(mAngle), 46.2 * Math.sin(mAngle), signZ * 58),
        new THREE.Vector3(68.0 * Math.cos(mAngle), 68.0 * Math.sin(mAngle), signZ * 70),
        new THREE.Vector3(35.0 * Math.cos(mAngle), -76, signZ * 64),
        new THREE.Vector3(0, -90, -20)
      ];
      oilCurves.push(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35));
    }
  }

  // 4. Front End Shield (Transmission side +Z)
  const frontEndGroup = new THREE.Group();
  frontEndGroup.name = 'front_end_shield';

  const buildEndShieldGeo = (boreR: number) => {
    const profile = [
      new THREE.Vector2(boreR, 0),
      new THREE.Vector2(R_out - 1.5, 0),
      new THREE.Vector2(R_out, 1.5),
      new THREE.Vector2(R_out, 10.5),
      new THREE.Vector2(R_out - 1.5, 12.0),
      new THREE.Vector2(boreR, 12.0),
      new THREE.Vector2(boreR, 0)
    ];
    const geo = new THREE.LatheGeometry(profile, 96);
    geo.rotateX(Math.PI / 2);
    geo.computeVertexNormals();
    return geo;
  };

  const endShieldMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.80,
    roughness: 0.36
  });

  const frontShieldMesh = new THREE.Mesh(buildEndShieldGeo(40), endShieldMat);
  frontEndGroup.add(frontShieldMesh);

  const boltCount = 8;
  const boltGeo = new THREE.CylinderGeometry(2.8, 2.8, 8, 6);
  const boltMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.95, roughness: 0.15 });

  for (let b = 0; b < boltCount; b++) {
    const a = (b / boltCount) * Math.PI * 2;
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set((R_out - 7) * Math.cos(a), (R_out - 7) * Math.sin(a), 14);
    frontEndGroup.add(bolt);
  }
  frontEndGroup.position.z = halfL;

  // 5. Rear End Shield (Resolver side -Z)
  const rearEndGroup = new THREE.Group();
  rearEndGroup.name = 'rear_end_shield';

  const rearShieldMesh = new THREE.Mesh(buildEndShieldGeo(32), endShieldMat);
  rearEndGroup.add(rearShieldMesh);

  for (let b = 0; b < boltCount; b++) {
    const a = (b / boltCount) * Math.PI * 2;
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set((R_out - 7) * Math.cos(a), (R_out - 7) * Math.sin(a), -2);
    rearEndGroup.add(bolt);
  }
  rearEndGroup.position.z = -halfL - 12;

  // Assembly group
  const group = new THREE.Group();
  group.name = 'housing_and_cooling_assembly';
  group.add(housingMesh);
  group.add(waterJacketMesh);
  group.add(oilCoolingGroup);
  group.add(frontEndGroup);
  group.add(rearEndGroup);

  return {
    housingMesh,
    waterJacketMesh,
    oilCoolingGroup,
    spiralCurve,
    oilCurves,
    frontEndShield: frontEndGroup,
    rearEndShield: rearEndGroup,
    group
  };
}

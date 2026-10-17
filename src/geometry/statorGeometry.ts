import * as THREE from 'three';

export interface StatorGeometryOptions {
  slots?: number;           // Number of stator slots (e.g. 48)
  outerRadius?: number;     // Outer radius in mm (e.g. 95)
  innerRadius?: number;     // Bore radius at tooth tip (e.g. 65)
  slotBottomRadius?: number;// Slot bottom / yoke inner radius (e.g. 85)
  stackLength?: number;     // Axial length in mm (e.g. 120)
  coolingFins?: number;     // Number of outer cooling fins (e.g. 24)
}

/**
 * Creates the high-precision laminated stator core geometry with realistic teeth,
 * slot shoes, slot openings, and silicon steel lamination stack aesthetics.
 */
export function createStatorCoreGeometry(options: StatorGeometryOptions = {}): THREE.BufferGeometry {
  const slots = options.slots || 48;
  const R_out = options.outerRadius || 95;
  const R_in = options.innerRadius || 65;
  const R_bottom = options.slotBottomRadius || 85;
  const stackLength = options.stackLength || 120;
  const finsCount = options.coolingFins || 48;

  // 1. Build the outer perimeter shape with cooling fin notches/ribs
  const outerShape = new THREE.Shape();
  const finDepth = 3.5;
  const totalOuterPoints = finsCount * 4;

  for (let i = 0; i <= totalOuterPoints; i++) {
    const angle = (i / totalOuterPoints) * Math.PI * 2;
    const finIndex = i % 4;
    // Alternate between fin crest and fin root
    const r = (finIndex === 1 || finIndex === 2) ? R_out + finDepth : R_out;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) {
      outerShape.moveTo(x, y);
    } else {
      outerShape.lineTo(x, y);
    }
  }

  // 2. Build the inner bore hole with 48 realistic stator teeth and slot shoes
  const innerHole = new THREE.Path();
  const toothPoints: THREE.Vector2[] = [];

  const slotPitch = (Math.PI * 2) / slots;
  const shoeThickness = 1.6;
  const R_shoeTop = R_in + shoeThickness;
  const slotOpeningAngle = slotPitch * 0.22; // Slot mouth opening
  const toothWidthAngle = slotPitch * 0.48;  // Tooth core body width
  const slotBodyAngle = slotPitch - toothWidthAngle;

  for (let i = 0; i < slots; i++) {
    const centerAngle = i * slotPitch;

    // Key angular points within one slot pitch
    const a_openingLeft = centerAngle - slotOpeningAngle * 0.5;
    const a_shoeLeft = centerAngle - slotPitch * 0.44;
    const a_toothLeft = centerAngle - toothWidthAngle * 0.5;

    const a_toothRight = centerAngle + toothWidthAngle * 0.5;
    const a_shoeRight = centerAngle + slotPitch * 0.44;
    const a_openingRight = centerAngle + slotOpeningAngle * 0.5;

    // 1. Tooth shoe tip left
    toothPoints.push(new THREE.Vector2(R_in * Math.cos(a_openingLeft), R_in * Math.sin(a_openingLeft)));
    // 2. Tooth shoe undercut left
    toothPoints.push(new THREE.Vector2(R_shoeTop * Math.cos(a_shoeLeft), R_shoeTop * Math.sin(a_shoeLeft)));
    // 3. Slot bottom left
    toothPoints.push(new THREE.Vector2(R_bottom * Math.cos(a_toothLeft), R_bottom * Math.sin(a_toothLeft)));
    // 4. Slot bottom right
    toothPoints.push(new THREE.Vector2(R_bottom * Math.cos(a_toothRight), R_bottom * Math.sin(a_toothRight)));
    // 5. Tooth shoe undercut right
    toothPoints.push(new THREE.Vector2(R_shoeTop * Math.cos(a_shoeRight), R_shoeTop * Math.sin(a_shoeRight)));
    // 6. Tooth shoe tip right
    toothPoints.push(new THREE.Vector2(R_in * Math.cos(a_openingRight), R_in * Math.sin(a_openingRight)));
  }

  // Connect inner hole vertices in counter-clockwise order for hole definition
  innerHole.moveTo(toothPoints[0].x, toothPoints[0].y);
  for (let i = 1; i < toothPoints.length; i++) {
    innerHole.lineTo(toothPoints[i].x, toothPoints[i].y);
  }
  innerHole.closePath();

  outerShape.holes.push(innerHole);

  // 3. Extrude the 2D cross-section into a 3D laminated stator core
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: stackLength,
    bevelEnabled: true,
    bevelThickness: 0.8,
    bevelSize: 0.8,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 1
  };

  const geometry = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
  // Center along Z axis
  geometry.center();
  geometry.computeVertexNormals();

  return geometry;
}


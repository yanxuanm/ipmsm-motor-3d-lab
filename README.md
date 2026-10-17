# IPMSM 3D Electromagnetic & Thermal Simulation Lab
### 内置式永磁同步电机（8极48槽 V型拓扑）三维电磁与热流多物理场仿真实验室

An interactive, high-fidelity 3D digital twin and multi-physics simulation lab for an 8-Pole 48-Slot Interior Permanent Magnet Synchronous Motor (IPMSM) commonly used in modern electric vehicles (EV traction powertrains). Built with **React 18**, **Three.js**, **TypeScript**, **Tailwind CSS**, and **KaTeX**.

---

## 🚀 Key Features

### 1. High-Fidelity 3D Physical Geometry (Three.js)
- **8-Pole 48-Slot V-Topology Rotor**:
  - Accurate V-shaped permanent magnet arrangement (NdFeB, convergent apex near shaft, divergent wings towards air-gap).
  - Detailed magnetic flux barriers and bridge geometry.
  - Dynamic rotating magnetic flux lines synchronized with rotor electrical angle $\theta_e$.
  - Hollow spline drive shaft with radial oil injection holes.
- **8-Layer Hairpin Wave Winding (发卡式扁线绕组)**:
  - Full 48-slot wave winding distribution across three phases ($U, V, W$).
  - Distinct crown (insertion) end and welded end geometries.
  - 8 radial layers per slot with realistic rectangular flat wire cross-sections.
- **Advanced Thermal Management System**:
  - **Spiral Water Jacket**: Helical cooling channel embedded between stator yoke and housing shell.
  - **Dual-Circuit Direct Oil Cooling**:
    - Dual top spray manifolds directly showering hairpin end-turns.
    - Hollow shaft radial centrifugal oil jets lubricating and cooling the rotor core and bearings.
    - Bottom oil sump with dynamic liquid wave animations and drainage recirculation port.
- **Mechanical Assemblies**:
  - Variable-reluctance rotary resolver (旋变传感器) mounted at the shaft end.
  - Front & rear aluminum die-cast end shields and high-speed ceramic/steel ball bearings.
  - Dynamic axial exploded disassembly view ($p \in [0, 1]$).
  - Real-time half-section cutaway clipping plane showing internal components without artifact clipping.
- **10 Synchronized Camera Presets**:
  - Seamless animated transitions between Isometric, Air Gap & Vectors, Hairpin Ends, V-Rotor Flux, Stator Slots, Water Jacket, Resolver Shaft, Full Exploded View, Flux Weakening, and Regen Braking.

---

### 2. Real-Time Multiphysics & FOC Vector Control Engine
- **Field-Oriented Control (FOC)**:
  - Amplitude-invariant Clarke & Park transformations ($abc \leftrightarrow \alpha\beta \leftrightarrow dq$).
  - Amplitude-conserved current vector decomposition: $I_q = I_m \sin\delta$, $I_d = -I_m \cos\delta$ (or user-tuned flux weakening).
  - Accurate torque calculation decomposed into:
    $$\begin{aligned}
    T_e &= T_{\text{pm}} + T_{\text{rel}} \\
    &= \frac{3}{2} p \left[ \psi_{\text{pm}} I_q + (L_d - L_q) I_d I_q \right]
    \end{aligned}$$
- **MTPA (Maximum Torque Per Ampere) Trajectory**:
  - Optimal load angle tracking ($\delta \approx 48^\circ \sim 52^\circ$) utilizing rotor saliency ($L_q > L_d$).
- **High-Speed Field Weakening (弱磁扩速)**:
  - Injected negative $d$-axis demagnetizing current ($I_d < 0$) to constrain back-EMF within inverter DC voltage bus limits ($\sqrt{V_d^2 + V_q^2} \le V_{\text{max}}$).
  - Overvoltage alarm triggers when back-EMF exceeds DC-link voltage capacity ($V_{\text{bus}} / \sqrt{3}$).
- **Energy Loss & Thermal Network**:
  - Copper loss: $P_{\text{cu}} = (I_u^2 + I_v^2 + I_w^2) R_s = 1.5 I_m^2 R_s$.
  - Steinmetz core iron loss: $P_{\text{fe}} = k_h f B^2 + k_e f^2 B^2$.
  - Multi-node thermal equilibrium model tracking temperatures of winding copper, stator teeth, rotor magnets, water jacket, and cooling oil.

---

### 3. Interactive Instruments & Engineering Documentation
- **3D Spatial Vector Visualizer**:
  - Real-time rendering of Stator MMF ($\vec{F}_s$), Rotor PM Flux ($\vec{\psi}_f$), Combined Current Vector ($\vec{I}_s$), and rotating $d$-$q$ coordinate frame.
- **Dual-Channel Digital Oscilloscope**:
  - Time-domain multi-phase waveform display (Phase currents $I_u, I_v, I_w$, $d$-$q$ currents, voltage, torque).
  - Live MTPA $T(\delta)$ torque-angle curve with real-time operating point marker.
- **KaTeX Formula Modal & Engineering Encyclopedia**:
  - Complete derivation of FOC vector control, MTPA condition, flux-weakening boundary, and thermal resistance networks.
  - Dedicated EV cooling encyclopedia covering water vs. oil cooling trade-offs, ATF dielectric oil properties, and heat transfer equations.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **3D Graphics Engine**: [Three.js](https://threejs.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Math & Typography**: [KaTeX](https://katex.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 💻 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `pnpm` or `yarn`

### Installation
```bash
# Clone the repository
git clone https://github.com/yanxuanm/ipmsm-motor-3d-lab.git
cd ipmsm-motor-3d-lab

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Building for Production
```bash
npm run build
npm run preview
```

---

## 📄 License

MIT License. Designed and developed for advanced motor engineering research and interactive electric powertrain visualization.

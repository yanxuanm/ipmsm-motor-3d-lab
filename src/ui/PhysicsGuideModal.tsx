import React, { useEffect } from 'react';
import { SimulationState } from '../types/motor';
import { X, Cpu, Zap, Compass, Activity, Layers } from './Icons';
import { LatexMath, MathText } from './LatexMath';

export type PhysicsTopicId =
  | '8p48s'
  | 'base_speed'
  | 'load_angle_mtpa'
  | 'dq_decoupling'
  | 'reluctance_torque'
  | 'regen_braking'
  | 'clarke_park';

interface PhysicsTopic {
  id: PhysicsTopicId;
  badge: string;
  title: string;
  subtitle: string;
  formulaLatex: string;
  secondaryFormulaLatex?: string;
  formulaDesc: string;
  analogy: string;
  keyPoints: { label: string; detail: string }[];
  demoPreset: {
    label: string;
    stateUpdates: Partial<SimulationState>;
    cameraPreset?: string;
  };
}

export const PHYSICS_TOPICS: PhysicsTopic[] = [
  {
    id: '8p48s',
    badge: '极槽拓扑 & 电角度',
    title: '8极48槽 (8P48S) 拓扑与电角度/空间角映射',
    subtitle: '为什么 $90^\\circ$ 电角度在 3D 空间里只对应 $22.5^\\circ$ 机械夹角？',
    formulaLatex: '\\theta_e = p \\cdot \\theta_m = 4\\theta_m \\quad , \\quad f_e = \\frac{p \\cdot n}{60} \\quad , \\quad q = \\frac{Z}{2p \\cdot m} = \\frac{48}{8 \\times 3} = 2',
    formulaDesc: '其中 $p = 4$ 为极对数（$2p = 8$ 个永磁磁极）；$\\theta_e$ 为电角度，$\\theta_m$ 为空间机械角度，$Z=48$ 为定子槽数，$q=2$ 为每极每相槽数。',
    analogy: '直观理解：转子上有 $4$ 对 N-S 磁极交替排布。转子在三维空间里每转过 $1/4$ 圈（$\\theta_m = 90^\\circ$ 机械角），定子线圈就已经完整经历了一轮 N 极与 S 极的电磁交替（$\\theta_e = 360^\\circ$ 电角度）。',
    keyPoints: [
      {
        label: '8极转子 ($2p=8, p=4$) 与空间角缩放',
        detail: '转子内嵌 $8$ 组 V 型钕铁硼永磁体（$4$ 个 N 极红块 + $4$ 个 S 极蓝块交替）。因此定子磁场与转子磁极之间 $\\delta_e = 90^\\circ$ 的极限电角度，在三维几何空间中严格对应 $\\delta_m = \\frac{\\delta_e}{p} = \\frac{90^\\circ}{4} = 22.5^\\circ$ 机械夹角。'
      },
      {
        label: '48槽定子 ($Z=48, q=2$) 谐波抑制机理',
        detail: '定子硅钢片内圆均布 $48$ 个齿槽，每极每相槽数 $q = \\frac{48}{8 \\times 3} = 2$。整距分布式绕组配合斜极/短距设计，能有效削弱气隙中的 $5$ 次、$7$ 次空间谐波磁势，大幅降低转矩脉动（Torque Ripple）与电磁啸叫（NVH）。'
      },
      {
        label: '发卡式扁线 (Hairpin Windings) 优势',
        detail: '采用矩形截面无氧铜扁线预成型为“发卡”状轴向插入槽内，端部扭头后激光焊接。槽满率从传统圆线的 $\\sim 45\\%$ 跃升至 $75\\%$ 以上，直流电阻 $R_s$ 降低约 $30\\%$，铜耗 $P_{\\text{cu}} = 3 I_{\\text{rms}}^2 R_s$ 显著下降。'
      }
    ],
    demoPreset: {
      label: '切入气隙与磁极横截面观察 (22.5° 空间夹角)',
      stateUpdates: { rpm: 15, loadAngle: 90, fluxWeakeningCurrent: 0, phaseCurrentMagnitude: 200, operatingMode: 'motoring', showVectors: true, cutawayEnabled: true },
      cameraPreset: 'airgap_vectors'
    }
  },
  {
    id: 'base_speed',
    badge: '转速 & 基速分界',
    title: '基速 (Base Speed 4500 RPM) 与反电动势电压极限',
    subtitle: '为什么 $4500\\text{ RPM}$ 被标注为“基速”？恒转矩区与恒功率区是如何划分的？',
    formulaLatex: 'U_s = \\sqrt{(R_s I_d - \\omega_e L_q I_q)^2 + \\bigl(R_s I_q + \\omega_e (\\psi_{\\text{pm}} + L_d I_d)\\bigr)^2} \\le \\frac{U_{\\text{dc}}}{\\sqrt{3}}',
    secondaryFormulaLatex: 'E_0 = \\omega_e \\psi_{\\text{pm}} = \\frac{2\\pi p \\cdot n}{60} \\psi_{\\text{pm}}',
    formulaDesc: '当转速 $n$（电角速度 $\\omega_e$）升高时，旋转磁链切割定子线圈产生的反电动势 $E_0 = \\omega_e \\psi_{\\text{pm}}$ 随转速线性暴涨，受限于电池逆变器最大相电压幅值 $\\frac{U_{\\text{dc}}}{\\sqrt{3}}$。',
    analogy: '直观理解：反电动势 $E_0$ 就像电机旋转时自己产生的“反向水压”。转速越快，反向水压越高；当达到 $4500\\text{ RPM}$（基速）时，反向水压已经顶到了电池母线电压 $U_{\\text{dc}}$ 的天花板，如果不采取弱磁措施，定子电流就再也灌不进去了。',
    keyPoints: [
      {
        label: '恒转矩区 ($0 \\sim 4500\\text{ RPM}$ 基速以下)',
        detail: '反电动势 $E_0$ 尚未触及逆变器母线电压椭圆极限 $\\frac{U_{\\text{dc}}}{\\sqrt{3}}$，逆变器可以灌入峰值相电流 $I_m$，沿着 MTPA 轨迹持续输出峰值转矩 $T_{\\max}$（用于弹射起步与重载爬坡）。'
      },
      {
        label: '基速拐点 ($n_{\\text{base}} = 4500\\text{ RPM}$)',
        detail: '在额定最大电流下，定子端电压 $U_s$ 刚好达到逆变器最大输出电压 $\\frac{U_{\\text{dc}}}{\\sqrt{3}}$ 的临界转速点。此时电机同时达到最大转矩与额定峰值机械功率 $P_{\\max} = T_{\\max} \\cdot \\omega_{\\text{base}}$。'
      },
      {
        label: '恒功率弱磁区 ($4500 \\sim 16000\\text{ RPM}$)',
        detail: '超过基速后 $\\omega_e$ 继续增大，为满足 $\\omega_e |\\psi_d| \\le \\frac{U_{\\text{dc}}}{\\sqrt{3}}$，必须主动注入负直轴电流 $I_d < 0$ 使直轴磁链 $\\psi_d = \\psi_{\\text{pm}} + L_d I_d$ 减小，以牺牲峰值转矩 $T_e \\propto \\frac{1}{\\omega_e}$ 换取高达 $16000\\text{ RPM}$ 的极速巡航能力。'
      }
    ],
    demoPreset: {
      label: '切入 4500 RPM 基速临界工况',
      stateUpdates: { rpm: 4500, loadAngle: 48, fluxWeakeningCurrent: 0, phaseCurrentMagnitude: 280, operatingMode: 'motoring' }
    }
  },
  {
    id: 'load_angle_mtpa',
    badge: '负载转矩角 δ & MTPA',
    title: '负载转矩角 (δ) 与 MTPA 最大转矩电流比 (+48°)',
    subtitle: '为什么电动车内置式永磁电机最佳效率点在 $+48^\\circ$ 左右，而不是 $+90^\\circ$？',
    formulaLatex: 'T_{\\text{total}}(\\delta) = \\underbrace{\\frac{3}{2} p \\psi_{\\text{pm}} I_m \\sin\\delta}_{T_{\\text{pm}}\\text{ (永磁转矩)}} - \\underbrace{\\frac{3}{4} p (L_d - L_q) I_m^2 \\sin(2\\delta)}_{T_{\\text{rel}}\\text{ (凸极磁阻转矩, } L_d < L_q\\text{)}}',
    secondaryFormulaLatex: 'I_d = -I_m \\cos\\delta \\quad , \\quad I_q = I_m \\sin\\delta \\quad , \\quad \\left.\\frac{\\partial T_{\\text{total}}}{\\partial \\delta}\\right|_{\\delta = \\delta_{\\text{MTPA}}} = 0',
    formulaDesc: '第一项为永磁转矩 $T_{\\text{pm}}$（按 $\\sin\\delta$ 变化，$\\delta = 90^\\circ$ 达峰）；第二项为凸极磁阻转矩 $T_{\\text{rel}}$（按 $\\sin(2\\delta)$ 变化，$\\delta = 45^\\circ$ 达峰）。',
    analogy: '直观理解：定子旋转磁场 $\\vec{F}_s$ 就像在前面拉车的马，转子 $\\vec{F}_r$ 是后面的车，两者之间的超前电角度就是负载角 $\\delta$。由于 V 型转子不仅有磁铁吸力（$90^\\circ$ 最强），还有硅钢片磁阻拉力（$45^\\circ$ 最强），两股力叠加后在 $+48^\\circ \\sim +55^\\circ$ 附近合力最大！',
    keyPoints: [
      {
        label: '什么是负载转矩角 (Load Angle $\\delta$)？',
        detail: '定子合成磁动势矢量 $\\vec{F}_s$（黄箭头）超前于转子永磁体主磁通 $d$ 轴 $\\vec{F}_r$（红箭头）的电角度。当 $\\delta = 0^\\circ$ 时两磁场完全对齐，$\\sin(0^\\circ) = 0$，只有径向吸力而无切向旋转转矩。'
      },
      {
        label: 'MTPA ($+48^\\circ$ 最大转矩电流比)',
        detail: 'Maximum Torque Per Ampere：在给定相电流幅值 $I_m = \\sqrt{I_d^2 + I_q^2}$ 下，将负载角控制在 $\\delta \\approx +48^\\circ \\sim +55^\\circ$ 时，负向 $I_d = -I_m \\cos\\delta$ 激发出的二倍角磁阻转矩 $\\sin(2\\delta)$ 与永磁转矩 $\\sin\\delta$ 完美叠加，用最小的相电流产生最大的总转矩，定子铜损 $I^2 R_s$ 最低。'
      },
      {
        label: '纯交轴励磁 ($\\delta = +90^\\circ$)',
        detail: '当 $\\delta = +90^\\circ$ 时，电流全部在 $q$ 轴（$I_d = 0, I_q = I_m$），此时二倍角项 $\\sin(180^\\circ) = 0$，宝贵的凸极磁阻转矩 $T_{\\text{rel}} = 0$ 被完全浪费，总转矩反而低于 MTPA 工况（可在底部示波器 CH2 曲线直观看到白色总转矩峰值在 $\\sim 52^\\circ$）。'
      }
    ],
    demoPreset: {
      label: '切入 MTPA (+48°) 最佳转矩电流比工况',
      stateUpdates: { rpm: 1000, loadAngle: 48, fluxWeakeningCurrent: 0, phaseCurrentMagnitude: 280, operatingMode: 'motoring', showVectors: true }
    }
  },
  {
    id: 'dq_decoupling',
    badge: 'd-q 轴解耦 & 弱磁',
    title: 'd-q 轴正交解耦与弱磁扩速 (Id Weakening < 0)',
    subtitle: '什么是直轴 ($d$ 轴) 与交轴 ($q$ 轴)？注入负 $I_d$ 电流是如何给永磁体“削磁”的？',
    formulaLatex: '\\psi_d = \\psi_{\\text{pm}} + L_d I_d \\quad (I_d < 0 \\implies \\psi_d < \\psi_{\\text{pm}}) \\quad , \\quad \\psi_q = L_q I_q',
    formulaDesc: '$d$ 轴（Direct Axis，直轴）锁定在转子永磁体 N 极中心线上；$q$ 轴（Quadrature Axis，交轴）超前 $d$ 轴 $90^\\circ$ 电角度。',
    analogy: '直观理解：FOC 把定子电流拆成两个互相垂直的分工小队——$d$ 轴电流 $I_d$ 专门负责“调节磁铁强弱”（沿着红色箭头 $\\vec{F}_r$ 方向），$q$ 轴电流 $I_q$ 专门负责“横向推转子做功”（沿着绿色箭头 $I_q$ 方向）。',
    keyPoints: [
      {
        label: '$d$ 轴 (直轴 / 励磁轴)',
        detail: '与转子永磁体主磁通方向（红色箭头 $\\vec{F}_r$）完全重合。由于钕铁硼永磁体自带恒定强磁链 $\\psi_{\\text{pm}} = 0.082\\text{ Wb}$，平时无需注入正 $I_d$ 增磁；相反，在 IPMSM 中我们总是注入负直轴电流 $I_d < 0$。'
      },
      {
        label: '$q$ 轴 (交轴 / 转矩轴)',
        detail: '空间上垂直于转子主磁通方向（超前 $d$ 轴 $90^\\circ$ 电角度，对应 $22.5^\\circ$ 机械角，绿色箭头 $I_q$）。根据安培力定律 $\\vec{F} = I \\vec{L} \\times \\vec{B}$，只有垂直于磁场的交轴电流 $I_q$ 才能产生切向电磁推力。'
      },
      {
        label: '弱磁电流 ($I_d \\in [-150\\text{ A}, 0\\text{ A}]$)',
        detail: '高速行驶时（如 $12000\\text{ RPM}$），主动向定子注入负的直轴电流（例如 $I_d = -110\\text{ A}$），产生与转子永磁体相反的电枢反应磁通 $L_d I_d < 0$，抵消一部分 $\\psi_{\\text{pm}}$，防止反电动势 $\\omega_e \\psi_d$ 击穿逆变器，同时激发磁阻转矩！'
      }
    ],
    demoPreset: {
      label: '切入 12000 RPM 高速弱磁扩速工况 (Id = -110A)',
      stateUpdates: { rpm: 12000, loadAngle: 65, fluxWeakeningCurrent: -110, phaseCurrentMagnitude: 300, operatingMode: 'motoring', showVectors: true },
      cameraPreset: 'flux_weakening'
    }
  },
  {
    id: 'reluctance_torque',
    badge: '双转矩分量 & 凸极效应',
    title: '永磁转矩 (T_pm) vs. 凸极磁阻转矩 (T_rel)',
    subtitle: '为什么转子磁铁要排成“V 字型”？什么是逆凸极效应 ($L_q > L_d$)？',
    formulaLatex: 'T_e = \\frac{3}{2} p \\Bigl[ \\underbrace{\\psi_{\\text{pm}} I_q}_{\\text{永磁项}} + \\underbrace{(L_d - L_q) I_d I_q}_{\\text{凸极磁阻项}} \\Bigr] = T_{\\text{pm}} + T_{\\text{rel}}',
    secondaryFormulaLatex: 'L_d = 0.38\\text{ mH} < L_q = 0.92\\text{ mH} \\implies \\rho = \\frac{L_q}{L_d} \\approx 2.42 \\quad (\\text{逆凸极比})',
    formulaDesc: '本电机物理参数：极对数 $p=4$，永磁磁链 $\\psi_{\\text{pm}} = 0.082\\text{ Wb}$，直轴电感 $L_d = 0.38\\text{ mH}$，交轴电感 $L_q = 0.92\\text{ mH}$。',
    analogy: '直观理解：把一根椭圆形铁块放在磁场里，哪怕铁块本身没有永磁性，它也会自动扭转对齐到磁阻最小（导磁最顺畅）的方向——这就是“磁阻转矩” $T_{\\text{rel}}$。V 型转子故意让 $d$ 轴和 $q$ 轴的导磁能力相差 $2.4$ 倍，从而白嫖出这股强大的扭力！',
    keyPoints: [
      {
        label: '为什么交轴电感 $L_q (0.92\\text{ mH}) >$ 直轴电感 $L_d (0.38\\text{ mH})$？',
        detail: '$d$ 轴磁路必须穿透两层厚厚的 V 型永磁体与空气隔磁槽（钕铁硼回复磁导率近似空气 $\\mu_r \\approx 1.05$，磁阻极大，故电感 $L_d$ 很小）；而 $q$ 轴磁路全部沿着高导磁率的硅钢片通道闭合（$\\mu_r > 4000$，磁阻极小，故电感 $L_q$ 很大）。'
      },
      {
        label: '永磁转矩 $T_{\\text{pm}} = \\frac{3}{2} p \\psi_{\\text{pm}} I_q$ (示波器青色曲线)',
        detail: '由定子交轴电流 $I_q$ 与转子永磁体磁链 $\\psi_{\\text{pm}}$ 直接吸引/排斥产生，在 $\\delta = 90^\\circ$ 时达到最大值。'
      },
      {
        label: '磁阻转矩 $T_{\\text{rel}} = \\frac{3}{2} p (L_d - L_q) I_d I_q$ (示波器紫色曲线)',
        detail: '因为 $L_d - L_q < 0$，当注入负直轴电流 $I_d < 0$ 且 $I_q > 0$ 时，$(L_d - L_q) I_d I_q > 0$！在现代电动车 IPMSM 中，磁阻转矩可贡献高达 $35\\% \\sim 45\\%$ 的总动力，大幅减少昂贵重稀土钕铁硼的用量。'
      }
    ],
    demoPreset: {
      label: '观察 V 型转子磁障剖面与双转矩曲线',
      stateUpdates: { rpm: 600, loadAngle: 52, fluxWeakeningCurrent: 0, phaseCurrentMagnitude: 320, operatingMode: 'motoring', cutawayEnabled: true },
      cameraPreset: 'v_rotor_flux'
    }
  },
  {
    id: 'regen_braking',
    badge: '动能回收发电模式',
    title: '动能回收制动 (Regenerative Braking, δ < 0°)',
    subtitle: '松开电门或踩刹车时，电机是如何瞬间变成发电机给电池反向充电的？',
    formulaLatex: '\\delta < 0^\\circ \\implies I_q < 0 \\implies T_e < 0\\text{ N}\\cdot\\text{m} \\implies P_{\\text{mech}} = T_e \\omega_m < 0\\text{ kW}',
    formulaDesc: '转子在车轮惯性带动下继续正向旋转（$\\omega_m > 0$），但定子合成磁场 $\\vec{F}_s$ 切换为滞后于转子 $d$ 轴 $\\vec{F}_r$（$\\delta < 0^\\circ$）。',
    analogy: '直观理解：电动牵引模式（$\\delta > 0^\\circ$）是定子磁场 $\\vec{F}_s$ 跑在前面“拽着”转子跑；动能回收模式（$\\delta < 0^\\circ$）则是车轮推着转子 $\\vec{F}_r$ 跑在前面，定子磁场 $\\vec{F}_s$ 在后面“往回拉”转子，把车辆的动能转化成三相电能充进动力电池！',
    keyPoints: [
      {
        label: '绿色箭头 $I_q$ 瞬间反向 ($-q$ 轴)',
        detail: '切换到动能回收（如 $\\delta = -45^\\circ$）时，观察 3D 气隙中心：黄色箭头 $\\vec{F}_s$ 落到了红色箭头 $\\vec{F}_r$ 的后方，绿色交轴电流箭头 $I_q$ 同步翻转 $180^\\circ$ 指向滞后的 $-q$ 轴方向，转矩角圆弧变为玫红色发电状态。'
      },
      {
        label: '对称的负向磁阻制动转矩增益',
        detail: '在发电模式下，FOC 控制器依然保持负直轴电流 $I_d < 0$，此时 $I_q < 0$，使得 $T_{\\text{rel}} = \\frac{3}{2} p (L_d - L_q) I_d I_q < 0$ 与永磁转矩 $T_{\\text{pm}} < 0$ 同号叠加，提供强劲且平顺的单踏板能量回收减速体验。'
      }
    ],
    demoPreset: {
      label: '切入动能回收发电工况 (δ = -45°, I_q < 0)',
      stateUpdates: { rpm: 1500, loadAngle: -45, fluxWeakeningCurrent: 0, phaseCurrentMagnitude: 260, operatingMode: 'regen', showVectors: true },
      cameraPreset: 'regen_braking'
    }
  },
  {
    id: 'clarke_park',
    badge: 'FOC 坐标变换核心',
    title: 'FOC 磁场定向控制：Clarke 与 Park 坐标变换',
    subtitle: '如何把高速交变的 U/V/W 三相正弦交流电，变成像直流电机一样温顺的 $I_d, I_q$？',
    formulaLatex: '\\begin{bmatrix} I_d \\\\ I_q \\end{bmatrix} = \\underbrace{\\begin{bmatrix} \\cos\\theta_e & \\sin\\theta_e \\\\ -\\sin\\theta_e & \\cos\\theta_e \\end{bmatrix}}_{\\text{Park 旋转变换}} \\cdot \\underbrace{\\frac{2}{3} \\begin{bmatrix} 1 & -\\frac{1}{2} & -\\frac{1}{2} \\\\ 0 & \\frac{\\sqrt{3}}{2} & -\\frac{\\sqrt{3}}{2} \\end{bmatrix}}_{\\text{Clarke 等幅值变换}} \\begin{bmatrix} I_u \\\\ I_v \\\\ I_w \\end{bmatrix}',
    secondaryFormulaLatex: '\\begin{cases} I_u(t) = I_m \\cos(\\theta_e + \\phi) \\\\ I_v(t) = I_m \\cos(\\theta_e + \\phi - \\frac{2\\pi}{3}) \\\\ I_w(t) = I_m \\cos(\\theta_e + \\phi + \\frac{2\\pi}{3}) \\end{cases}',
    formulaDesc: 'Clarke 变换将互差 $120^\\circ$ 的三相静止轴系 $(u,v,w)$ 映射为正交两相静止轴系 $(\\alpha,\\beta)$；Park 变换将其旋转到随转子同步旋转的 $(d,q)$ 坐标系。',
    analogy: '直观理解：站在地面上看旋转木马上的三个孩子（三相正弦交流电 $I_u, I_v, I_w$），他们的位置每秒钟都在飞速正弦变化；但如果你也跳上旋转木马和转子一起同步旋转（Park 变换乘上旋转矩阵 $e^{-j\\theta_e}$），在你眼里他们就是静止不动的直流量（$I_d, I_q$）！',
    keyPoints: [
      {
        label: '三相对称正弦电流 ($I_u, I_v, I_w$)',
        detail: '定子 U（琥珀红）、V（翠绿）、W（电光蓝）三相绕组在空间互差 $120^\\circ$ 电角度，通入相位互差 $\\frac{2\\pi}{3}$ 的三相对称交流电，在气隙中合成出一个幅值恒定、以角速度 $\\omega_e$ 匀速旋转的圆形磁动势矢量 $\\vec{F}_s$。'
      },
      {
        label: '无刷旋变传感器 (Resolver) 的闭环作用',
        detail: '安装在花键轴尾端的旋变传感器以微秒级延迟实时解算转子绝对机械角 $\\theta_m$ 与电角度 $\\theta_e = 4\\theta_m$，为 Park 正/逆变换提供精确的坐标旋转基准角 $\\theta_e$。'
      },
      {
        label: '实时双通道示波器与 3D 铜线发光同步',
        detail: '底部示波器 CH1 实时绘制 $I_u, I_v, I_w$ 三相正弦波与当前电角度 $\\theta_e$ 采样游标，其瞬时电流值直接驱动 3D 场景中三相发卡铜线的冷暖发光强度与粒子流动速度。'
      }
    ],
    demoPreset: {
      label: '慢速教学观察：三相正弦电流交替与粒子流动',
      stateUpdates: { rpm: 15, loadAngle: 48, phaseCurrentMagnitude: 300, showParticles: true, showVectors: true }
    }
  }
];

interface PhysicsGuideModalProps {
  isOpen: boolean;
  initialTopicId?: PhysicsTopicId;
  onClose: () => void;
  onApplyDemo: (updates: Partial<SimulationState>, cameraPreset?: string) => void;
}

export const PhysicsGuideModal: React.FC<PhysicsGuideModalProps> = React.memo(({
  isOpen,
  initialTopicId = 'load_angle_mtpa',
  onClose,
  onApplyDemo
}) => {
  const [selectedId, setSelectedId] = React.useState<PhysicsTopicId>(initialTopicId);

  useEffect(() => {
    if (initialTopicId) {
      setSelectedId(initialTopicId);
    }
  }, [initialTopicId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeTopic = PHYSICS_TOPICS.find(t => t.id === selectedId) || PHYSICS_TOPICS[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-slate-950/88 p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl border border-cyan-500/40 bg-[#0b101b] shadow-[0_0_40px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Compass size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono tracking-wide flex items-center gap-2">
                <span>IPMSM 电机物理与电磁控制原理全解</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  LaTeX 公式与交互式教学百科
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                点击左侧核心物理概念词条（或按 ESC / 点击空白处关闭），深入理解面板参数背后的电磁方程与 FOC 控制机理
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors flex items-center gap-1 text-xs font-mono cursor-pointer"
            title="关闭百科面板 (ESC)"
          >
            <span>关闭</span>
            <X size={15} />
          </button>
        </div>

        {/* Modal Body: Left Sidebar + Right Detail Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Topic Navigation */}
          <div className="w-[260px] border-r border-slate-800 bg-slate-950/60 p-3 flex flex-col gap-1.5 overflow-y-auto">
            <div className="text-[10px] font-mono text-slate-400 font-semibold uppercase px-1 pb-1">
              核心物理与控制概念 (7)
            </div>
            {PHYSICS_TOPICS.map((topic, idx) => {
              const isSelected = topic.id === selectedId;
              return (
                <button
                  type="button"
                  key={topic.id}
                  onClick={() => setSelectedId(topic.id)}
                  className={`text-left p-2.5 rounded-xl border transition-colors flex flex-col gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/90 border-cyan-400/70 shadow-[0_0_12px_rgba(0,242,254,0.18)]'
                      : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 border border-cyan-500/25">
                      0{idx + 1} · {topic.badge}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold leading-snug ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {topic.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Topic Details */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
            {/* Title & Subtitle */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full mb-2">
                <Zap size={12} />
                <span>{activeTopic.badge}</span>
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">
                {activeTopic.title}
              </h3>
              <p className="text-xs text-amber-300/95 mt-1.5 font-medium">
                💡 核心问题：<MathText text={activeTopic.subtitle} />
              </p>
            </div>

            {/* Mathematical Formula Box (Rendered with KaTeX LaTeX) */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/35 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  核心物理控制方程 (LATEX GOVERNING EQUATION)
                </span>
                <Cpu size={13} className="text-cyan-400" />
              </div>
              <div className="text-amber-300 bg-slate-900/95 px-4 py-2.5 rounded-lg border border-slate-800 flex flex-col gap-1 items-center justify-center">
                <LatexMath block math={activeTopic.formulaLatex} className="text-sm" />
                {activeTopic.secondaryFormulaLatex && (
                  <div className="border-t border-slate-800/80 pt-1.5 w-full text-center text-cyan-200">
                    <LatexMath block math={activeTopic.secondaryFormulaLatex} className="text-xs" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <MathText text={activeTopic.formulaDesc} />
              </p>
            </div>

            {/* Intuitive Physical Analogy */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-100 leading-relaxed">
              <strong className="text-emerald-400 font-bold">🎯 物理直觉类比：</strong>
              <MathText text={activeTopic.analogy} />
            </div>

            {/* Detailed Breakdown Cards */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Layers size={13} className="text-cyan-400" />
                <span>深度工程原理解析</span>
              </span>
              {activeTopic.keyPoints.map((pt, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1"
                >
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono flex items-center justify-center text-cyan-300 shrink-0">
                      {i + 1}
                    </span>
                    <MathText text={pt.label} />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-6">
                    <MathText text={pt.detail} />
                  </p>
                </div>
              ))}
            </div>

            {/* Interactive 3D Demo Trigger */}
            <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                想在 3D 实验室中直观观察这一物理现象？
              </span>
              <button
                type="button"
                onClick={() => {
                  onApplyDemo(activeTopic.demoPreset.stateUpdates, activeTopic.demoPreset.cameraPreset);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Activity size={14} />
                <span>⚡ {activeTopic.demoPreset.label}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

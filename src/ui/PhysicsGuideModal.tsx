import React, { useState, useEffect } from 'react';
import { SimulationState } from '../types/motor';
import {
  X, Cpu, Zap, Compass, Activity, Layers, GraduationCap,
  ArrowRight, Sparkles, BookOpen, CheckCircle2, ShieldAlert
} from './Icons';
import { LatexMath, MathText } from './LatexMath';

export type PhysicsTopicId =
  | '8p48s'
  | 'base_speed'
  | 'load_angle_mtpa'
  | 'dq_decoupling'
  | 'reluctance_torque'
  | 'regen_braking'
  | 'clarke_park';

export type GuideModalTab = 'ladder' | 'topics';

export interface DerivationStepItem {
  stepName: string;
  latex: string;
  explanation: string;
  hsRuleTag: string;
}

export interface MathematicalDerivation {
  title: string;
  steps: DerivationStepItem[];
  conclusionLatex: string;
  conclusionNote: string;
}

export interface IndustryCaseStudy {
  vehicle: string;
  headline: string;
  analysis: string;
}

export interface InteractiveMission {
  missionGoal: string;
  actionSteps: string[];
  expectedObservation: string;
}

export interface KnowledgeLadderStep {
  stepNum: number;
  badge: string;
  title: string;
  tagline: string;
  highSchoolFoundation: {
    textbookTopic: string;
    corePrinciples: string[];
    formulaLatex: string;
    formulaDesc: string;
    intuition: string;
  };
  mathematicalDerivation: MathematicalDerivation;
  engineeringBridge: {
    bridgeTitle: string;
    coreInsight: string;
    formulaLatex: string;
    formulaDesc: string;
    breakdownPoints: { title: string; desc: string }[];
  };
  analogy: {
    title: string;
    body: string;
  };
  faq: {
    question: string;
    answer: string;
  };
  industryCase: IndustryCaseStudy;
  interactiveMission: InteractiveMission;
  linkedTopicId: PhysicsTopicId;
  demoPreset: {
    label: string;
    stateUpdates: Partial<SimulationState>;
    cameraPreset?: string;
  };
}

export const KNOWLEDGE_LADDER_STEPS: KnowledgeLadderStep[] = [
  {
    stepNum: 1,
    badge: '台阶 1 · 安培力到定子槽',
    title: '从“通电导线受力 (F=BIL)”到“电动机转动”',
    tagline: '单根悬空导线的微弱安培力，如何通过 48 槽定子铁芯与发卡扁线合成在空间中飞速旋转的磁动势？',
    highSchoolFoundation: {
      textbookTopic: '高中物理选修 3-1 第四章《磁场》· 洛伦兹力、安培力定律与左手定则',
      corePrinciples: [
        '微观洛伦兹力：磁场对运动电荷施加垂直于运动方向的洛伦兹力 $f = qvB\\sin\\theta$。',
        '宏观安培力定律：通电直导线中亿万定向移动电子所受洛伦兹力的集体宏观表现，即为安培力 $F = BIL\\sin\\theta$。',
        '左手定则：伸开左手，使大拇指与四指垂直并在同一平面内。磁感线穿入手心，四指指向电流方向，大拇指所指即为安培力方向。',
        '旋转力矩萌芽：若将导线绕成闭合矩形线圈置于匀强磁场中，左右两边电流相反，安培力反向，构成旋转力偶矩 $M = F \\cdot d = B I S$。'
      ],
      formulaLatex: 'F = B I L \\sin\\theta \\quad , \\quad M = B I S \\cos\\alpha',
      formulaDesc: '其中 $B$ 为磁感应强度，$I$ 为导线电流，$L$ 为导线有效长度；$S$ 为矩形线圈面积，$M$ 为电磁力矩。',
      intuition: '高中物理模型假设磁场是外界给定的恒定匀强磁场，导线孤零零放在空气中。单线圈转过 90° 后力矩就会归零甚至反向，必须靠初中学的机械电刷换向器倒换电流才能勉强转起来。'
    },
    mathematicalDerivation: {
      title: '从单根导线微元受力到 48 槽定子磁动势与电磁力矩积分',
      steps: [
        {
          stepName: '第 1 步：微元安培力积分与槽导体受力',
          latex: 'd\\vec{F} = I d\\vec{l} \\times \\vec{B} \\implies F_{\\text{slot}} = 8 \\cdot I_{\\text{cond}} \\cdot L_{\\text{iron}} \\cdot B_{\\text{gap}}',
          explanation: '每个定子槽内嵌 8 根矩形发卡扁线，每根导体通入瞬时电流 $I_{\\text{cond}}$。在气隙磁密 $B_{\\text{gap}}$ 作用下，单槽 8 根导体受到的总安培力为单根导线的 8 倍。',
          hsRuleTag: '高中选修 3-1 安培力微元积分'
        },
        {
          stepName: '第 2 步：力偶臂乘以半径得到槽电磁力矩',
          latex: 'T_{\\text{slot}} = F_{\\text{slot}} \\cdot R_{\\text{stator, in}} = 8 \\cdot I_{\\text{cond}} \\cdot L_{\\text{iron}} \\cdot B_{\\text{gap}} \\cdot R_{\\text{stator, in}}',
          explanation: '定子铁芯内圆半径为 $R_{\\text{stator, in}} = 65\\text{ mm}$。安培力通过定子齿靴切向传递，产生驱动转子旋转的基础旋转力矩。',
          hsRuleTag: '高一物理力矩公式 M = F · R'
        },
        {
          stepName: '第 3 步：48 槽圆周空间正弦谐波积分合成',
          latex: '\\vec{F}_s(t) = \\sum_{k=1}^{48} N_k i_k(t) e^{j \\theta_k} = \\frac{3}{\\pi} \\frac{N_{\\text{turns}} k_w}{p} I_m e^{j(\\omega_e t + \\delta)}',
          explanation: '定子 48 个槽在圆周上均匀排布，槽间距电角度为 $\\gamma_e = \\frac{p \\cdot 360^\\circ}{Z} = \\frac{4 \\times 360^\\circ}{48} = 30^\\circ$。三相发卡绕组在空间互补叠加，微观齿槽脉动被削弱 98% 以上，合成为平滑的宏观旋转磁矢 $\\vec{F}_s$。',
          hsRuleTag: '高中平面向量和差与正弦交流电叠加'
        }
      ],
      conclusionLatex: 'T_e = \\frac{3}{2} p \\cdot \\vec{\\psi}_s \\times \\vec{I}_s = \\frac{3}{2} p (\\psi_d I_q - \\psi_q I_d)',
      conclusionNote: '48 槽分布式发卡拓扑将散乱的导线受力升华为平稳的旋转力偶，消除转矩脉动，实现毫秒级静音平顺驱动。'
    },
    engineeringBridge: {
      bridgeTitle: '现代纯电动车电机的工程进化：48槽高导磁定子铁芯与发卡扁线',
      coreInsight: '为什么纯电汽车不能像高中实验室那样只放几匝悬空铜线？空气磁阻极大，必须用硅钢片引导并汇聚磁场！',
      formulaLatex: '\\vec{F}_s(t) = \\sum_{k=1}^{48} \\vec{f}_{\\text{slot}, k}(t) = \\frac{3}{2} N_{\\text{phase}} I_m \\cdot e^{j(\\omega_e t + \\delta)}',
      formulaDesc: '48 槽定子发卡扁线通入对称三相电流后，槽内安培力在 0.8mm 极窄气隙中无缝拼接，合成出一个宏观平滑旋转的定子磁动势矢量 $\\vec{F}_s$。',
      breakdownPoints: [
        {
          title: '48 个定子齿槽 (Stator Slots) 的磁聚焦功能',
          desc: '空气的导磁率极低（$\\mu_0 = 4\\pi \\times 10^{-7}\\text{ H/m}$），磁感线极易发散。现代电机用 0.25mm 极薄硅钢片（$\\mu_r > 4000$）叠压成定子铁芯，并精密切割出 48 个齿槽，把磁场像高压水枪一样聚焦喷向仅有 0.8mm 的极窄气隙，磁场强度被放大数千倍！'
        },
        {
          title: '8层发卡式扁线 (Hairpin Flat-Wire) 革命',
          desc: '传统电机用乱绕细圆铜线，线间空隙充满空气，槽满率仅 45%；本项目采用矩形截面无氧纯铜扁线，像积木一样紧密嵌满 8 层，槽满率跃升至 75% 以上！导线电阻 $R_s$ 骤降 30%，产生数倍于传统电机的澎湃安培力。'
        },
        {
          title: '从单线圈力矩到连续旋转磁动势矢量 $\\vec{F}_s$',
          desc: '48 个槽内的导线不是孤立的，而是按照空间拓扑严格分配给 U、V、W 三相。当三相正弦电流注入时，48 个槽产生的微观安培力在气隙圆周无缝拼接，合成出一个幅值恒定、连续旋转的宏观黄色磁矢 $\\vec{F}_s$！'
        }
      ]
    },
    analogy: {
      title: '生活通俗类比：从一根筷子划水，到 48 人龙舟方阵与高压聚能水枪',
      body: '高中物理实验就像拿一根筷子在开阔的游泳池里划水，水花四溅但推力微弱；而现代 EV 电机则是 48 个人坐在同一艘流线型龙舟里（48槽定子），握着极粗的矩形船桨（8层发卡扁线），在两岸高导磁硅钢片构成的狭窄聚流峡谷（0.8mm 气隙）中，整齐划一地合力划桨，把散乱的水流汇聚成一道势不可挡的强劲旋转激流！'
    },
    faq: {
      question: '几十牛·米甚至上百牛·米的巨大扭矩，会不会把脆弱的绝缘漆包铜线直接剪断撕裂？',
      answer: '这是电机工程中最惊艳的物理事实之一！绝大部分人以为安培力是直接拉扯铜线，其实不然：因为硅钢片的导磁率是空气和铜的数千倍，磁感线绝大部分都会拐弯钻进定子齿部（Teeth）中，槽内铜线处的磁场反而很弱。真实的切向电磁推力有 90% 以上直接作用在极其结实的定子硅钢片齿靴上，铁芯替铜线承受了绝大部分机械撕扯力！铜线只需要安心导电即可。'
    },
    industryCase: {
      vehicle: '保时捷 Taycan & 特斯拉 Model 3/Y',
      headline: '从细圆铜线到 8 层发卡扁线（Hairpin）的工业进化',
      analysis: '早期电动车采用细圆铜线乱绕，槽内充满空气间隙，槽满率仅 40%~45%。特斯拉与保时捷率先在大批量生产中引入 8 层矩形发卡扁线，通过六轴机器人将预成型的 U 型扁线插入 48 个齿槽，激光精准熔焊焊端。槽满率提升至 75% 以上，端部跨距缩短 20mm，铜耗降低 30%，功率密度突破 3.5 kW/kg。'
    },
    interactiveMission: {
      missionGoal: '直视 48 槽发卡扁线端部皇冠与电流粒子流向',
      actionSteps: [
        '点击下方【⚡ 3D 实机体验】按钮，视角自动切入发卡绕组端部并开启剖切',
        '观察 8 层铜线在定子槽内的精密层叠（内层至外层紧密贴合）',
        '调节转速至慢速 15 RPM，肉眼观察 U（黄）、V（绿）、W（蓝）三相交替点亮的发光波澜'
      ],
      expectedObservation: '你将清晰直视 48 个定子齿槽中的发卡矩形铜线截面，电流粒子在三相之间交替流动，推动外部旋转矢量匀速运转。'
    },
    linkedTopicId: '8p48s',
    demoPreset: {
      label: '观察发卡扁线端部结构与电流粒子流',
      stateUpdates: { rpm: 20, loadAngle: 48, showParticles: true, showVectors: true, cutawayEnabled: true },
      cameraPreset: 'hairpin_end'
    }
  },
  {
    stepNum: 2,
    badge: '台阶 2 · 旋转磁场与极对数',
    title: '从“单相交流电”到“旋转磁场”与“极对数 (p=4)”',
    tagline: '时间相差 120° 的三相对称电流，如何在空间中像齿轮咬合一样推动转子？为什么机械转一圈电场交变 4 圈？',
    highSchoolFoundation: {
      textbookTopic: '高中物理选修 3-2 第五章《交变电流》· 正弦交流电、相位差与三相电源',
      corePrinciples: [
        '正弦交流电三要素：幅值 $I_m$、角频率 $\\omega$、初相位 $\\phi$。高中单相交变电流 $i(t) = I_m \\sin(\\omega t)$ 随时间周期性反向振荡。',
        '三相交流电概念：由三个频率相同、振幅相等、但在时间相位上互差 $120^\\circ$（$\\frac{2\\pi}{3}$）的正弦交流电组成：$i_u = I_m \\cos(\\omega t)$、$i_v = I_m \\cos(\\omega t - \\frac{2\\pi}{3})$、$i_w = I_m \\cos(\\omega t + \\frac{2\\pi}{3})$。',
        '瞬时平衡性：三相对称交流电在任意瞬时的代数和恒为零：$i_u(t) + i_v(t) + i_w(t) = 0$。'
      ],
      formulaLatex: 'i_u(t) + i_v(t) + i_w(t) = 0 \\quad , \\quad \\Delta\\phi = \\frac{2\\pi}{3} = 120^\\circ',
      formulaDesc: '三相电流互差 1/3 个周期（120° 电角度），在时间上形成轮流达到峰值的完美节拍。',
      intuition: '很多同学不理解：单相交流电接上线圈只能在原地产生忽强忽弱、忽上忽下的“脉振磁场”，就像单手拍球原地上下跳，根本无法让电机旋转（转子不知该顺时针还是逆时针转）。三相电凭什么能“转”起来？'
    },
    mathematicalDerivation: {
      title: '高中三角函数和差化积：三相交流电合成匀速圆形旋转磁场的严密证明',
      steps: [
        {
          stepName: '第 1 步：空间相隔 120° 的三相脉振磁场表达',
          latex: '\\begin{cases} b_u(\\theta, t) = B_m \\cos(\\omega_e t) \\cos(\\theta) \\\\ b_v(\\theta, t) = B_m \\cos(\\omega_e t - 120^\\circ) \\cos(\\theta - 120^\\circ) \\\\ b_w(\\theta, t) = B_m \\cos(\\omega_e t + 120^\\circ) \\cos(\\theta + 120^\\circ) \\end{cases}',
          explanation: '定子三相绕组在定子圆周物理空间上各自相差 120° 角度，各自通入时间相位互差 120° 的交变电流。',
          hsRuleTag: '高中选修 3-2 正弦交变电场表达式'
        },
        {
          stepName: '第 2 步：应用高中积化和差公式展开',
          latex: '\\cos A \\cos B = \\frac{1}{2}\\left[\\cos(A - B) + \\cos(A + B)\\right]',
          explanation: '利用高一三角公式展开每一相：得到一个“同向旋转波 $\\cos(\\omega_e t - \\theta)$”与一个“反向脉振波 $\\cos(\\omega_e t + \\theta \\pm 120^\\circ)$”。',
          hsRuleTag: '高一必修四三角函数积化和差'
        },
        {
          stepName: '第 3 步：反向分量抵消，正向分量完美叠加',
          latex: '\\cos(\\omega_e t + \\theta) + \\cos(\\omega_e t + \\theta - 240^\\circ) + \\cos(\\omega_e t + \\theta + 240^\\circ) \\equiv 0',
          explanation: '后半部分三个反向分量是相位互差 120° 的对称三相，其矢量和在任意瞬时恒等于 0，自然湮灭！而前半部分三个同向波相位完全一致，三者相加得：$\\frac{1}{2} B_m \\times 3 = \\frac{3}{2} B_m$！',
          hsRuleTag: '高中三角恒等变形与矢量合成'
        }
      ],
      conclusionLatex: '\\vec{B}_{\\text{total}}(\\theta, t) = \\frac{3}{2} B_m \\left[ \\cos(\\omega_e t) \\hat{x} + \\sin(\\omega_e t) \\hat{y} \\right] \\quad , \\quad \\theta_e = p \\cdot \\theta_m = 4\\theta_m',
      conclusionNote: '数学证明完美闭环！大小恒定为 1.5 倍峰值的圆形旋转磁场跃然纸上，无需任何机械电刷即可平滑推着转子奔跑。'
    },
    engineeringBridge: {
      bridgeTitle: '时间差与空间差的奇妙交织：圆形旋转磁场的空间合成与极对数',
      coreInsight: '空间物理上互差 120° 的三个绕组 + 时间上互差 120° 的三相电流 = 匀速旋转的磁场！',
      formulaLatex: '\\vec{B}_{\\text{total}}(\\theta, t) = B_u + B_v + B_w = \\frac{3}{2} B_m \\left[ \\cos(\\omega_e t) \\hat{x} + \\sin(\\omega_e t) \\hat{y} \\right]',
      formulaDesc: '利用高中三角函数和差化积展开：三相脉振磁场在空间和时间上完美叠加，多余的反向分量彼此抵消，最终合成为一个幅值恒定为 $\\frac{3}{2} B_m$、以角速度 $\\omega_e$ 匀速旋转的圆形矢量！',
      breakdownPoints: [
        {
          title: '时间 120° 与空间 120° 的接力推背',
          desc: '定子 U、V、W 三相在圆周物理空间上各占 120° 角度。当 U 相电流达正峰值时，定子顶部磁场最强；1/3 周期后 V 相电流达峰值，最强磁场顺滑平移到 120° 位置；再过 1/3 周期 W 相接力。三个线圈在时间与空间上交相呼应，如同三人轮流推磨！'
        },
        {
          title: '极对数 $p=4$（8极）的本质：机械角 vs 电角度',
          desc: '转子圆周上并不是只有一对 N-S 极，而是均匀分布着 8 个磁极（4 对 N-S 极，$p=4$）。这就意味着，转子在空间机械上只转了 1/4 圈（$\\theta_m = 90^\\circ$ 机械角），定子线圈就已经完整经历了一整轮 N 极到 S 极的电磁周期（$\\theta_e = 360^\\circ$ 电角度）！'
        },
        {
          title: '公式映射：$\\theta_e = p \\cdot \\theta_m = 4\\theta_m$',
          desc: '这就是为什么示波器和控制算法中的电角度频率 $f_e = \\frac{p \\cdot n}{60}$ 是机械转速频率的 4 倍！在 3D 电磁矢量图里直交的 $90^\\circ$ 电角度，投射到转子真实横截面上只有 $\\frac{90^\\circ}{4} = 22.5^\\circ$ 机械夹角。'
        }
      ]
    },
    analogy: {
      title: '生活通俗类比：三人轮流推旋转木马与齿轮啮合',
      body: '想象三个好朋友（U、V、W）站在圆形木马周围：第一个人推一把，第二个人紧接着在下个弧度接力推一把，第三个人在再下个位置推一把……木马就被源源不断地推着匀速旋转起来！而转子的 8 极结构就像一个小齿轮在里面严丝合缝地咬合，定子电场每转过 4 圈电周期，转子机械转轴才转动一整圈，齿比恰好是 4:1。'
    },
    faq: {
      question: '为什么电机不设计成最简单的 2 极（$p=1$），反而要做成复杂的 8 极（$p=4$）？',
      answer: '极对数 $p$ 越多，在相同的电机外径下，每个磁极的跨度越短，定子背部所需的硅钢片磁轭厚度就可以做得更薄，铜线端部跨度大幅缩短，电机的总重量和体积大幅降低，功率密度成倍暴涨！现代电动车（如特斯拉 Model 3/Y、比亚迪汉 EV）无一例外采用 6 极或 8 极高密度拓扑。'
    },
    industryCase: {
      vehicle: '特斯拉 Model 3 / 比亚迪 汉EV',
      headline: '为什么纯电动汽车几乎清一色采用 8 极（4 对极）拓扑？',
      analysis: '在 12000 RPM 极速下，8 极电机的基波频率达到 800 Hz（$f_e = 4 \\times 12000 / 60 = 800\\text{ Hz}$）。现代第三代宽禁带 SiC（碳化硅）功率半导体具备 20kHz+ 的开关频率，能够轻松平滑控制 800Hz 交流波形，使得 8 极拓扑极短端部与超薄磁轭的轻量化优势发挥到极致。'
    },
    interactiveMission: {
      missionGoal: '验证电角度与机械角度的 4:1 缩放映射关系',
      actionSteps: [
        '点击下方【⚡ 3D 实机体验】，切入气隙与矢量截面',
        '在控制台将转速设为 15 RPM，观察定子黄色磁场矢量 $\\vec{F}_s$ 的飞速转动',
        '观察转子上的永磁红块：转子机械转动 90° 机械角时，电磁矢量图已走满 360° 整圈！'
      ],
      expectedObservation: '你会直观领悟为什么电磁矢量图里的直交 90° 在 3D 电机物理截面上看起来只有 22.5° 的锐角。'
    },
    linkedTopicId: '8p48s',
    demoPreset: {
      label: '慢速观察旋转磁场与 22.5° 机械空间夹角',
      stateUpdates: { rpm: 15, loadAngle: 48, showVectors: true, showFluxLines: true, cutawayEnabled: true },
      cameraPreset: 'airgap_vectors'
    }
  },
  {
    stepNum: 3,
    badge: '台阶 3 · 永磁转矩与转矩角',
    title: '永磁同步电机（PMSM）与“转矩角 (δ)”的本质',
    tagline: '同名磁极相斥、异名磁极相吸的微观本质：定子磁场为什么像奔跑的胡萝卜一样拽着转子跑？',
    highSchoolFoundation: {
      textbookTopic: '高中物理选修 3-1 第一/四章 · 磁极相互作用与磁矩取向',
      corePrinciples: [
        '磁极相互作用：自然界中磁单极子不存在，N 极与 S 极永远成对出现；同名磁极相斥，异名磁极相吸。',
        '磁针在磁场中的自发对齐：把一枚自由旋转的小磁针放在外磁场中，小磁针必然顺着外磁场的磁感线方向对齐。',
        '磁力偶矩与偏角：若外力将小磁针扭偏一个角度 $\\theta$，外磁场就会产生一个使其恢复对齐的磁力矩 $M = p_m B \\sin\\theta$；$\\theta=0^\\circ$ 时势能最低最稳定。'
      ],
      formulaLatex: 'M = p_m \\cdot B \\sin\\theta \\quad , \\quad E_p = -\\vec{p}_m \\cdot \\vec{B} = -p_m B \\cos\\theta',
      formulaDesc: '$p_m$ 为小磁针的磁偶极矩，$B$ 为外磁场强度，$\\theta$ 为小磁针与外磁场的偏角；偏离越大，回正扭矩越大。',
      intuition: '在高中我们知道磁铁被拉偏后想转回来。那么在现代电动车里，到底谁是外磁场，谁是小磁针？二者怎样保持同速旋转？'
    },
    mathematicalDerivation: {
      title: '虚位移与磁场共能导数：永磁电磁转矩正弦规律的严密物理推导',
      steps: [
        {
          stepName: '第 1 步：转子永磁体与定子磁势的相互作用能',
          latex: 'W_{\\text{pm}} = \\vec{\\psi}_{\\text{pm}} \\cdot \\vec{I}_s = \\psi_{\\text{pm}} I_m \\cos(90^\\circ - \\delta) = \\psi_{\\text{pm}} I_m \\sin\\delta',
          explanation: '转子永磁体磁链矢量 $\\vec{\\psi}_{\\text{pm}}$ 锁定在 $d$ 轴，定子合成磁势矢量 $\\vec{F}_s$ 超前 $d$ 轴 $\\delta$ 电角度。两者点积反映磁场相互作用共能。',
          hsRuleTag: '高中物理选修 3-1 磁场势能 E_p = -μ · B'
        },
        {
          stepName: '第 2 步：虚位移原理（力矩为共能对机械角的导数）',
          latex: 'T_{\\text{pm}} = \\frac{\\partial W_{\\text{pm}}}{\\partial \\theta_m} = \\frac{\\partial W_{\\text{pm}}}{\\partial \\delta} \\frac{d\\delta}{d\\theta_m} = p \\cdot \\frac{\\partial W_{\\text{pm}}}{\\partial \\delta}',
          explanation: '根据分析力学虚功原理，力矩等于系统储能随转子空间转角的变化率。结合三相系数 $\\frac{3}{2}$，得到纯正弦形式的永磁转矩。',
          hsRuleTag: '高一物理虚位移原理与求导法则'
        },
        {
          stepName: '第 3 步：稳定工作区与临界失步角',
          latex: '\\frac{\\partial T_{\\text{pm}}}{\\partial \\delta} = \\frac{3}{2} p \\psi_{\\text{pm}} I_m \\cos\\delta > 0 \\iff \\delta \\in [0^\\circ, 90^\\circ]',
          explanation: '当 $\\delta \\in [0, 90^\\circ]$ 时，阻力增大时角度自发变大提供更大拉力，系统自稳定；当 $\\delta > 90^\\circ$ 时导数为负，拉力随阻力增大反而减小，发生剧烈失步滑差。',
          hsRuleTag: '高一函数极值与力学平衡状态稳定性'
        }
      ],
      conclusionLatex: 'T_{\\text{pm}}(\\delta) = \\frac{3}{2} p \\psi_{\\text{pm}} I_m \\sin\\delta \\quad (\\delta = 90^\\circ \\implies T_{\\text{pm, max}} = \\frac{3}{2} p \\psi_{\\text{pm}} I_m)',
      conclusionNote: '永磁转矩本质上是转子磁极为了与定子旋转磁场对齐而产生的恢复拉力，在 90° 处拉紧达到极限。'
    },
    engineeringBridge: {
      bridgeTitle: '同步电机的本质：转子小磁针死死咬住定子奔跑磁场',
      coreInsight: '转子永磁体 = 强力小磁针；定子旋转磁动势 $\\vec{F}_s$ = 奔跑的引力源。',
      formulaLatex: 'T_{\\text{pm}}(\\delta) = \\frac{3}{2} p \\psi_{\\text{pm}} I_m \\sin\\delta \\quad (\\text{在 } \\delta = 90^\\circ \\text{ 处达峰})',
      formulaDesc: '$\\psi_{\\text{pm}}$ 为转子钕铁硼永磁体主磁链，$I_m$ 为定子电流幅值，$\\delta$ 为定子磁场 $\\vec{F}_s$ 超前于转子磁针 $\\vec{F}_r$ 的负载转矩角。',
      breakdownPoints: [
        {
          title: '什么是“同步”（Synchronous）？',
          desc: '定子三相电流合成的旋转磁场 $\\vec{F}_s$ 以转速 $n = \\frac{60 f_e}{p}$ 在前面旋转；转子上的强力永磁铁被牢牢吸引，以分毫不差的相同转速跟着旋转，两者之间没有异步电机的转差率（Slip），故称“永磁同步电机”。'
        },
        {
          title: '负载角 $\\delta$：像拉伸一根强力橡胶弹簧',
          desc: '空载运转时，定子磁场与转子磁针完全重合（$\\delta = 0^\\circ$），磁感线笔直穿过气隙，只有径向压力而没有切向转矩；当踩下油门提速时，车轮阻力将转子拉后，定子磁场超前于转子一个角度 $\\delta$。气隙中的磁感线被严重拉长倾斜，如同被拉紧的橡胶弹簧，爆发强劲的切向拉力！'
        },
        {
          title: '为什么不能无限拉大 $\\delta$？',
          desc: '永磁转矩正比于 $\\sin\\delta$。当 $\\delta = 90^\\circ$ 时弹簧拉力达到峰值；如果外部负载过重，迫使 $\\delta > 90^\\circ$，$\\sin\\delta$ 下降，弹簧瞬间崩断，电机就会剧烈震颤甚至彻底失速（失步故障）。'
        }
      ]
    },
    analogy: {
      title: '生活通俗类比：奔跑的胡萝卜与小毛驴，拉伸的强力弹簧绳',
      body: '定子旋转磁场就像骑手拿竹竿吊在毛驴（转子）鼻尖前面的胡萝卜，以特定速度往前跑；毛驴为了吃到胡萝卜拼命往前追。胡萝卜和毛驴之间的距离就是转矩角 $\\delta$！车上坐的人越多（负载越大），毛驴离胡萝卜就稍微拉开一点距离（$\\delta$ 增大），拉车力矩就越大。'
    },
    faq: {
      question: '既然 $\\sin(90^\\circ)=1$ 永磁拉力最大，为什么纯电动车最佳效率点不在 $90^\\circ$ 而是 $+48^\\circ$？',
      answer: '因为这台电机是内置式（IPMSM）！除了永磁体的吸力之外，它的转子铁芯还藏着一个更神奇、完全不消耗永磁体的“第二扭矩引擎”——凸极磁阻转矩！请看下一个台阶的精彩揭秘！'
    },
    industryCase: {
      vehicle: '日产聆风（早发表贴 SPM）vs 特斯拉 Model 3（内置 IPMSM）',
      headline: '从死板的 90° 驱动到多物理场协同的 48° MTPA 最佳效率点',
      analysis: '早期纯电车采用表贴式永磁电机（SPM），磁铁贴在转子外表面，直轴与交轴磁阻相同（$L_d = L_q$），完全没有磁阻转矩，控制器只能死板地运行在 $\\delta = 90^\\circ$。现代电动车将磁铁深埋制成 V 型槽，激发出高达 40% 的磁阻转矩，控制角移至 48°，同样电量跑出更远续航。'
    },
    interactiveMission: {
      missionGoal: '观察气隙中黄色磁矢与红色磁极的拉角变化',
      actionSteps: [
        '在控制台拖拽【负载转矩角 ($\\delta$)】滑块，由 0° 慢慢拉大到 +48°',
        '观察 3D 气隙正上方黄色箭头 $\\vec{F}_s$ 与红色主磁链 $\\vec{F}_r$ 的相对超前夹角',
        '观察示波器 CH2 白色转矩曲线在 +48° 处达到全局峰值'
      ],
      expectedObservation: '你会观察到两矢量夹角像一根被逐渐拉紧的弹簧，扭矩数字同步暴增。'
    },
    linkedTopicId: 'load_angle_mtpa',
    demoPreset: {
      label: '进入 3D 气隙观察黄红矢量夹角 $\\delta$',
      stateUpdates: { rpm: 600, loadAngle: 48, showVectors: true, phaseCurrentMagnitude: 280, operatingMode: 'motoring' },
      cameraPreset: 'airgap_vectors'
    }
  },
  {
    stepNum: 4,
    badge: '台阶 4 · 磁阻最小与免费转矩',
    title: '内置式（IPMSM）独有的“磁阻转矩 (T_rel)”（高中磁介质延伸）',
    tagline: '大自然的本能：磁感线永远想走磁阻最小的路！V型转子如何靠几何结构“白嫖” 35%~45% 的强劲动力？',
    highSchoolFoundation: {
      textbookTopic: '高中物理选修 3-1 第四章 · 磁介质与磁化现象，能量最低原理',
      corePrinciples: [
        '铁磁性物质的磁化：铁、钴、镍等铁磁性物质具有极高的相对磁导率（$\\mu_r > 4000$）。在外磁场作用下，铁棒内部磁畴转向，产生强大的感应磁场，被磁铁紧紧吸住。',
        '磁阻概念与能量最低原理：磁通穿透介质受到的阻碍称为磁阻 $R_m = \\frac{l}{\\mu S}$。物理系统永远自发演化向势能最低、总磁阻最小的状态。',
        '趋利避害的磁感线：磁感线极度讨厌空气（$\\mu_0$ 小、磁阻极大），极度喜欢钻进高导磁硅钢片中（$\\mu_r$ 大、磁阻极小）。'
      ],
      formulaLatex: 'R_m = \\frac{l}{\\mu A} \\quad , \\quad W_m = \\frac{1}{2} L I^2 = \\frac{1}{2} \\frac{\\Phi^2}{R_m}',
      formulaDesc: '$l$ 为磁路长度，$A$ 为截面积，$\\mu$ 为磁导率；磁阻越小，磁场储存能量与系统稳定性越高。',
      intuition: '如果把一根没有任何永磁性的普通软铁棒斜着扔进磁场中，铁棒会不会转动？会！它会拼命扭正，直到把自己最长、最容易导磁的轴向对齐到磁力线上，以减小整个回路的总磁阻！'
    },
    mathematicalDerivation: {
      title: '高中磁介质储能与倍角公式：二倍角磁阻转矩 sin(2δ) 的手把手严谨推导',
      steps: [
        {
          stepName: '第 1 步：各向异性磁场共能的代数表达',
          latex: 'W_{\\text{mag}} = \\frac{1}{2} L_d I_d^2 + \\frac{1}{2} L_q I_q^2 = \\frac{1}{2} I_m^2 \\left[ L_d \\cos^2\\delta + L_q \\sin^2\\delta \\right]',
          explanation: '代入直轴与交轴电流分量 $I_d = -I_m \\cos\\delta$ 和 $I_q = I_m \\sin\\delta$。',
          hsRuleTag: '高中选修 3-2 自感线圈磁场储能'
        },
        {
          stepName: '第 2 步：应用高一三角函数降幂倍角公式',
          latex: '\\cos^2\\delta = \\frac{1 + \\cos(2\\delta)}{2} \\quad , \\quad \\sin^2\\delta = \\frac{1 - \\cos(2\\delta)}{2}',
          explanation: '代入后合并同类项，磁场储能神奇地拆分出了一个与二倍角 $\\cos(2\\delta)$ 相关的周期波动项：$\\frac{1}{4} I_m^2 (L_d - L_q) \\cos(2\\delta)$。',
          hsRuleTag: '高一必修四三角函数降幂倍角公式'
        },
        {
          stepName: '第 3 步：对负载角求导得到二倍角磁阻转矩',
          latex: 'T_{\\text{rel}} = \\frac{3}{2} p \\frac{\\partial W_{\\text{mag}}}{\\partial \\delta} = \\frac{3}{4} p (L_q - L_d) I_m^2 \\sin(2\\delta)',
          explanation: '因为 $L_q > L_d$（逆凸极效应），求导负负得正！二倍角正弦波 $\\sin(2\\delta)$ 在 $\\delta = 45^\\circ$ 处达到最大峰值！',
          hsRuleTag: '高一三角函数求导与极值分析'
        },
        {
          stepName: '第 4 步：联立双转矩求解 MTPA 最佳角度（高中求根公式）',
          latex: '\\frac{\\partial T_{\\text{total}}}{\\partial \\delta} = 0 \\implies 2(L_q - L_d) I_m \\cos^2\\delta + \\psi_{\\text{pm}} \\cos\\delta - (L_q - L_d) I_m = 0',
          explanation: '令总转矩对 $\\delta$ 导数为 0，得到关于 $\\cos\\delta$ 的一元二次方程！利用高中求根公式代入本项目实测参数（$\\psi_{\\text{pm}}=0.082\\text{ Wb}, L_q-L_d=0.54\\text{ mH}, I_m=280\\text{ A}$），完美算得 $\\delta_{\\text{MTPA}} \\approx 48.4^\\circ$！',
          hsRuleTag: '高一一元二次方程求根公式'
        }
      ],
      conclusionLatex: '\\delta_{\\text{MTPA}} = \\arccos\\left( \\frac{-\\psi_{\\text{pm}} + \\sqrt{\\psi_{\\text{pm}}^2 + 8(L_q - L_d)^2 I_m^2}}{4(L_q - L_d) I_m} \\right) \\approx 48.4^\\circ',
      conclusionNote: '高中一元二次方程求根公式直通纯电动汽车控制代码核心！这正是工程算法的魅力所在。'
    },
    engineeringBridge: {
      bridgeTitle: '工程神作：为什么新能源车要把磁铁做成“V 字型”埋在铁芯内部？',
      coreInsight: '利用硅钢片与永磁体的导磁率巨大差异，制造“逆凸极效应” $L_q > L_d$。',
      formulaLatex: 'T_{\\text{total}}(\\delta) = \\underbrace{\\frac{3}{2} p \\psi_{\\text{pm}} I_m \\sin\\delta}_{T_{\\text{pm}} (\\delta=90^\\circ \\text{达峰})} + \\underbrace{\\frac{3}{4} p (L_q - L_d) I_m^2 \\sin(2\\delta)}_{T_{\\text{rel}} (\\delta=45^\\circ \\text{达峰})}',
      formulaDesc: '$L_d = 0.38\\text{ mH}$（直轴电感），$L_q = 0.92\\text{ mH}$（交轴电感），逆凸极比 $\\rho = \\frac{L_q}{L_d} \\approx 2.42$；二倍角 $\\sin(2\\delta)$ 产生磁阻转矩。',
      breakdownPoints: [
        {
          title: '惊人事实：强磁铁本身居然是“导磁绝缘体”！',
          desc: '烧结钕铁硼永磁体虽然自带强磁性，但对外界交变磁通而言，其回复磁导率极低（$\\mu_r \\approx 1.05$），导磁性能几乎和空气一模一样！因此，直接穿过磁铁的直轴（$d$ 轴）相当于穿过了厚厚的外加空气层，磁阻极大，电感很小（$L_d = 0.38\\text{ mH}$）。'
        },
        {
          title: '交轴（$q$ 轴）的高速公路与逆凸极效应',
          desc: '而在两块 V 型磁铁之间的铁芯区域（$q$ 轴），全由高导磁冷轧硅钢片（$\\mu_r > 4000$）铺就，是一条畅通无阻的磁通高速公路，磁阻极小，电感极大（$L_q = 0.92\\text{ mH}$）！交轴导磁能力是直轴的 2.42 倍！'
        },
        {
          title: 'MTPA 最大转矩电流比的最佳夹角（+48°）',
          desc: '永磁转矩按 $\\sin\\delta$ 变化（$90^\\circ$ 达峰）；磁阻转矩按二倍角 $\\sin(2\\delta)$ 变化（$45^\\circ$ 达峰）。将两股力量叠加在一起，总转矩的最大峰值恰好出现在 $\\delta \\approx 48^\\circ \\sim 52^\\circ$！在这个角度下，同样灌入 200A 电流，能多榨出 35%~45% 的纯结构免费扭矩！'
        }
      ]
    },
    analogy: {
      title: '生活通俗类比：铁棒自发顺水流对齐，白嫖大自然的几何红利',
      body: '想象在湍急的水流中斜放一根扁铁板，水流会产生巨大的扭矩将铁板顺着水流冲平——转子铁芯为了让磁感线走得最顺畅，自发爆发出的这股纯几何扭力就是磁阻转矩！电车工程师不用花额外一分钱买稀土磁铁，单靠在转子上巧夺天工地挖出 V 型槽，就白嫖了将近一半的总动力！'
    },
    faq: {
      question: '既然磁阻转矩这么香，为什么不干脆把磁铁全扔掉，做成纯开关磁阻电机？',
      answer: '纯磁阻电机没有永磁体提供基础偏置磁通，启动时转矩脉动大、电磁啸叫（NVH 噪音）极其刺耳，且低速扭矩不足。IPMSM 的绝妙之处正是将“温润强劲的永磁转矩”与“爆发力极高的磁阻转矩”完美融于一体，刚柔并济。'
    },
    industryCase: {
      vehicle: '特斯拉 Model 3 Performance & 比亚迪 仰望 U8',
      headline: '35%~45% 动力纯靠几何结构：逆凸极率 $\\rho = L_q / L_d$ 的工业军备竞赛',
      analysis: '稀土重金属元素镝（Dy）、铽（Tb）极为稀缺昂贵。特斯拉与比亚迪工程师通过高精度冲模在转子上打出双层 V 型空气隔磁桥，将直轴电感压到 0.38mH，交轴电感做大到 0.92mH，凸极比高达 2.42！不仅稀土用量减少 30%，更在 0-100km/h 弹射起步时输出摧枯拉朽的爆发力。'
    },
    interactiveMission: {
      missionGoal: '在示波器 CH2 实测验证双转矩二倍角曲线',
      actionSteps: [
        '点击下方【⚡ 3D 实机体验】，切入 V 型转子磁障剖面视角',
        '观察示波器 CH2 曲线：青色为永磁转矩（单峰 $\\sin\\delta$），紫色为磁阻转矩（双峰 $\\sin 2\\delta$）',
        '在控制台将负载角滑块精准调到 48°，观察黄色游标点稳居白色总转矩曲线之巅'
      ],
      expectedObservation: '你会亲眼验证 $45^\\circ$ 达峰的紫色磁阻曲线与 $90^\\circ$ 达峰的青色永磁曲线，在 $48.4^\\circ$ 处形成最高合力峰值。'
    },
    linkedTopicId: 'reluctance_torque',
    demoPreset: {
      label: '观察 V 型转子隔磁槽与双转矩合成曲线',
      stateUpdates: { rpm: 600, loadAngle: 50, fluxWeakeningCurrent: 0, phaseCurrentMagnitude: 320, operatingMode: 'motoring', cutawayEnabled: true },
      cameraPreset: 'v_rotor_flux'
    }
  },
  {
    stepNum: 5,
    badge: '台阶 5 · 坐标变换与弱磁',
    title: '高级控制基石——Clarke/Park 坐标变换与弱磁（Flux Weakening）',
    tagline: '如何把疯狂旋转的交流电化繁为简变成两个直流分量？转速超 4500 RPM 后为什么要主动“削磁”保命？',
    highSchoolFoundation: {
      textbookTopic: '高中物理必修一《力的合成与分解》+ 选修3-2《动生电动势》与闭合电路欧姆定律',
      corePrinciples: [
        '矢量的正交分解思想：平面上的任何倾斜矢量都可以分解为沿 $x$ 轴与 $y$ 轴的两个正交投影分量。两分量互相垂直、互不干涉，可以独立研究和控制。',
        '动生反电动势定律：导线在磁场中运动时产生动生电动势 $E = BLv$；线圈在交变磁场中感应出反电动势 $e = -N \\frac{\\Delta\\Phi}{\\Delta t}$。速度越快，感应反电压越高！',
        '电路闭合极限：电源输出端电压有上限（如动力电池母线电压 $U_{\\text{dc}}$）。当电机的反电动势逼近甚至超过母线电压时，外部电流再也无法注入，且过高反压会击穿逆变器半导体功率芯片。'
      ],
      formulaLatex: 'E_0 = \\omega_e \\psi_{\\text{pm}} = \\frac{2\\pi p n}{60} \\psi_{\\text{pm}} \\quad , \\quad U_{\\max} = \\frac{U_{\\text{dc}}}{\\sqrt{3}}',
      formulaDesc: '反电动势 $E_0$ 随转速 $n$ 线性暴涨；$U_{\\max}$ 为逆变器能输出的最大相电压幅值极限。',
      intuition: '三相交流电每秒钟正弦振荡上千次，控制器直接算正弦波根本来不及。高一学的相对运动与正交分解，在现代电车中是如何大显神通的？'
    },
    mathematicalDerivation: {
      title: '坐标轴旋转投影与电压椭圆方程：高速弱磁防击穿的高中解析几何解析',
      steps: [
        {
          stepName: '第 1 步：Clarke 等幅值变换系数 2/3 的几何证明',
          latex: 'I_\\alpha = \\frac{2}{3}\\left( I_a - \\frac{1}{2} I_b - \\frac{1}{2} I_c \\right) \\quad , \\quad I_\\beta = \\frac{2}{3}\\left( \\frac{\\sqrt{3}}{2} I_b - \\frac{\\sqrt{3}}{2} I_c \\right)',
          explanation: '三相轴线互差 120°。当 $I_a = I_m$ 时，对称三相电流满足 $I_b = I_c = -0.5 I_m$。括号内求和等于 $1.5 I_m$，因此前方必须乘以 $\\frac{2}{3}$ 才能保持合成矢量幅值严格守恒。',
          hsRuleTag: '高一必修四平面向量正交基底投影'
        },
        {
          stepName: '第 2 步：Park 旋转变换将高频交流化为直流静止',
          latex: '\\begin{bmatrix} I_d \\\\ I_q \\end{bmatrix} = \\begin{bmatrix} \\cos\\theta_e & \\sin\\theta_e \\\\ -\\sin\\theta_e & \\cos\\theta_e \\end{bmatrix} \\begin{bmatrix} I_\\alpha \\\\ I_\\beta \\end{bmatrix} = \\begin{bmatrix} I_m \\\\ 0 \\end{bmatrix}',
          explanation: '跳上以电角速度 $\\omega_e$ 同步旋转的旋转木马！交变角 $\\theta_e$ 被旋转矩阵对消，飞速旋转的交流电奇迹般变为静止的恒定直流量！',
          hsRuleTag: '高一相对运动与平面旋转坐标系'
        },
        {
          stepName: '第 3 步：高速稳态电压极限椭圆方程推导',
          latex: 'V_s^2 = V_d^2 + V_q^2 = \\omega_e^2 \\left[ (L_q I_q)^2 + (\\psi_{\\text{pm}} + L_d I_d)^2 \\right] \\le V_{\\max}^2',
          explanation: '在高速下忽略微小电阻压降 $R_s$。电压模长必须受限于电池逆变器直流母线最大相电压极限 $V_{\\max} = \\frac{U_{\\text{dc}}}{\\sqrt{3}}$。',
          hsRuleTag: '高二解析几何标准椭圆方程'
        },
        {
          stepName: '第 4 步：椭圆萎缩与负直轴去磁电流的必然性',
          latex: '\\lim_{\\omega_e \\to \\infty} \\left( I_d + \\frac{\\psi_{\\text{pm}}}{L_d} \\right) = 0 \\implies I_{d, \\text{weak}} = -\\frac{\\psi_{\\text{pm}}}{L_d} \\approx -215.8\\text{ A}',
          explanation: '椭圆中心位于负直轴坐标点 $(-\\frac{\\psi_{\\text{pm}}}{L_d}, 0)$。转速 $\\omega_e$ 越高，椭圆半轴 $\\frac{V_{\\max}}{\\omega_e}$ 越急剧萎缩向中心收敛！若不注入负直轴电流 $I_d < 0$，工作点必将跌出椭圆，反电动势失控过压击穿逆变器！',
          hsRuleTag: '高二解析几何椭圆退化与极限定理'
        }
      ],
      conclusionLatex: '\\frac{\\left(I_d + \\frac{\\psi_{\\text{pm}}}{L_d}\\right)^2}{\\left(\\frac{V_{\\max}}{\\omega_e L_d}\\right)^2} + \\frac{I_q^2}{\\left(\\frac{V_{\\max}}{\\omega_e L_q}\\right)^2} \\le 1',
      conclusionNote: '弱磁控制（Id < 0）是纯电汽车以 150km/h 极速巡航时的“反电动势安全泄压阀”，没有弱磁，电机高转速就会瞬间自毁。'
    },
    engineeringBridge: {
      bridgeTitle: 'FOC 磁场定向控制与负 $d$ 轴弱磁救险',
      coreInsight: '跳上旋转木马（Park 变换）将交流变直流；注入负直轴电流 $I_d < 0$ 强行去磁防击穿。',
      formulaLatex: '\\begin{bmatrix} I_d \\\\ I_q \\end{bmatrix} = \\mathbf{P}(\\theta_e) \\mathbf{C} \\begin{bmatrix} I_u \\\\ I_v \\\\ I_w \\end{bmatrix} \\quad , \\quad \\psi_d = \\psi_{\\text{pm}} + L_d I_d \\quad (I_d < 0 \\implies \\psi_d < \\psi_{\\text{pm}})',
      formulaDesc: '$I_d$（直轴电流，沿磁铁方向负责削磁增磁），$I_q$（交轴电流，垂直磁铁方向负责做功推车）；$I_d < 0$ 抵消部分永磁磁通。',
      breakdownPoints: [
        {
          title: 'Clarke & Park 变换：从地面看 vs 跳上旋转木马',
          desc: '站在地面上看旋转木马上的三个人（$I_u, I_v, I_w$），他们在飞速旋转；但如果你也跳上旋转木马和转子一起转动（Park 变换乘以旋转角 $\\theta_e$），在你的眼里，这两个分量（$I_d, I_q$）就变成了纹丝不动的纯直流量！复杂的交流电机控制瞬间降维成了初中直流电机一样简单！'
        },
        {
          title: '4500 RPM 基速危机：反电动势顶到电池天花板',
          desc: '当电车在高速公路上极速飞驰时，转速突破 4500 RPM。强磁铁飞速切割线圈，产生的反电动势 $E_0 = \\omega_e \\psi_{\\text{pm}}$ 达到几百甚至上千伏，死死顶住动力电池的供电电压。如果不做处理，逆变器将被倒灌过压击穿！'
        },
        {
          title: '弱磁扩速（Flux Weakening）：以毒攻毒的“反向去磁”',
          desc: '永磁体固定在转子里没法拆，但我们可以主动向定子灌入负的直轴电流（$I_d = -110\\text{ A}$）！这股负电流产生一个与永磁体恰好相反的反向磁场，类似电磁铁反接去磁，强行把总磁链压低（$\\psi_d = \\psi_{\\text{pm}} + L_d I_d$），反电动势应声回落，电车得以安全突破 12000+ RPM 极限极速！'
        }
      ]
    },
    analogy: {
      title: '生活通俗类比：旋转木马上的相对静止，高压锅上的安全泄压阀',
      body: 'Park 变换就是让你坐进转子的主驾驶室，一切高频变动的混乱交流电立刻变得风平浪静；而弱磁控制就像高压锅顶部的安全泄压阀：锅内转速气压越狂暴，泄压阀放出的负电流气体就越多，巧妙化解粉身碎骨的炸锅危机，让电车在极速下依然稳健如初！'
    },
    faq: {
      question: '负电流 $I_d < 0$ 会把永磁体的磁性彻底搞丢（不可逆退磁）吗？',
      answer: '这正是电机工程师最关心的问题！现代车规级钕铁硼磁铁掺入了镝（Dy）、铽（Tb）等稀土重元素，拥有极其坚韧的内禀矫顽力（$H_{cj} \\ge 25\\text{ kOe}$）。在设计弱磁控制时，工程师会严格计算安全退磁极限线，只要温度不超过 180°C 且去磁电流在阈值内，断电后永磁体会 100% 恢复原有磁性，毫发无损！'
    },
    industryCase: {
      vehicle: '特斯拉 Model S Plaid & 保时捷 Taycan Turbo S',
      headline: '碳纤维转子包裹套筒与 20000 RPM 极限弱磁扩速',
      analysis: '特斯拉 Plaid 版本为了实现 322 km/h 极速，电机转速高达 20000 RPM。若不深度弱磁，电机反电动势将超过 1600V，瞬间引爆 400V 电池包和 SiC 逆变器！工程师在转子外层碳纤维预应力紧箍保护下，灌入超过 -150A 的极端负弱磁电流，将反电动势死死压制在母线之内。'
    },
    interactiveMission: {
      missionGoal: '在 12000 RPM 下观察反电动势母线过压告警与弱磁恢复',
      actionSteps: [
        '在左侧控制台将转速滑块直接拉至 12000 RPM 高速区',
        '将【直轴弱磁电流】滑块推回 0A，观察 HUD 顶部立即弹出鲜红的【母线过压击穿报警】',
        '点击下方【⚡ 3D 实机体验 (Id = -110A)】，观察负弱磁电流注入后，报警瞬间解除，电压重回安全绿区！'
      ],
      expectedObservation: '你会观察到负电流箭头 $I_d$ 指向 $-d$ 轴，像高压泄压阀一样将过压红线扑灭。'
    },
    linkedTopicId: 'dq_decoupling',
    demoPreset: {
      label: '切入 12000 RPM 弱磁工况 (Id = -110A)',
      stateUpdates: { rpm: 12000, loadAngle: 65, fluxWeakeningCurrent: -110, phaseCurrentMagnitude: 300, operatingMode: 'motoring', showVectors: true },
      cameraPreset: 'flux_weakening'
    }
  }
];

export interface PhysicsTopic {
  id: PhysicsTopicId;
  badge: string;
  title: string;
  subtitle: string;
  highSchoolAnchor: {
    topic: string;
    principle: string;
    bridgeInsight: string;
  };
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
    highSchoolAnchor: {
      topic: '高中物理选修 3-1 安培力与空间定则 + 选修 3-2 交流电周期',
      principle: '通电导线在匀强磁场中受安培力 $F=BIL$；线圈转动周期与交流电交变频率严格一一对应。',
      bridgeInsight: '工程将单根导线升级为 48 槽定子铁芯与发卡扁线，8 极（4 对极）使得机械每转 1/4 圈，电气交变一个整周期（$\\theta_e = 4\\theta_m$），直角电角度对应 22.5° 机械几何角。'
    },
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
    highSchoolAnchor: {
      topic: '高中物理选修 3-2 法拉第电磁感应定律与反电动势',
      principle: '动生电动势 $E = BLv$，转速越高感应电动势越大；闭合回路中外加电压必须大于反电动势才能注入电流。',
      bridgeInsight: '在 4500 RPM 基速点，线圈反电动势 $E_0 = \\omega_e \\psi_{\\text{pm}}$ 达到逆变器直流母线电压上限 $\\frac{U_{\\text{dc}}}{\\sqrt{3}}$，成为恒转矩区与弱磁恒功率区的物理分水岭。'
    },
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
    highSchoolAnchor: {
      topic: '高中物理选修 3-1 磁极对齐力矩 + 必修一力学力的合成与极值',
      principle: '小磁针顺磁感线方向对齐；合力的大小不仅取决于分力大小，还取决于两者的夹角与正弦变化关系。',
      bridgeInsight: '定子旋转磁场超前于转子磁针的角度即为负载角 $\\delta$。由于 V 型转子同时具备永磁力（$\\sin\\delta$）与磁阻力（$\\sin 2\\delta$），合力在 $+48^\\circ$ 达峰（MTPA），用最少电费产出最大扭矩。'
    },
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
    highSchoolAnchor: {
      topic: '高中物理必修一矢量的正交分解与相对运动',
      principle: '倾斜矢量分解为水平和竖直两个独立正交分量；站在相对运动的旋转参考系中观察运动物体。',
      bridgeInsight: '以转子旋转速度建立同步坐标系，将三相正交拆分为 $d$ 轴（沿磁极调磁通）与 $q$ 轴（垂直磁极推转子），并在高速下注入负 $I_d < 0$ 实施弱磁去磁。'
    },
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
    highSchoolAnchor: {
      topic: '高中物理选修 3-1 铁磁介质磁化与能量最低原理',
      principle: '铁磁材料易被磁化且磁导率极高；磁通优先走低磁阻路径，系统自发扭正以最小化总磁阻。',
      bridgeInsight: '永磁体透磁率低如空气（$L_d = 0.38\\text{ mH}$），铁芯通道透磁率极高（$L_q = 0.92\\text{ mH}$），形成逆凸极比 $\\rho \\approx 2.42$，带来占总扭矩 35%~45% 的免费磁阻动力。'
    },
    formulaLatex: 'T_e = \\frac{3}{2} p \\Bigl[ \\underbrace{\\psi_{\\text{pm}} I_q}_{\\text{永磁项}} + \\underbrace{(L_d - L_q) I_d I_q}_{\\text{凸极磁阻项}} \\Bigr] = T_{\\text{pm}} + T_{\\text{rel}}',
    secondaryFormulaLatex: 'L_d = 0.38\\text{ mH} < L_q = 0.92\\text{ mH} \\implies \\rho = \\frac{L_q}{L_d} \\approx 2.42 \\quad (\\text{逆凸极比})',
    formulaDesc: '本电机物理参数：极对数 $p=4$，永磁磁链 $\\psi_{\\text{pm}} = 0.082\\text{ Wb}$，直轴电感 $L_d = 0.38\\text{ mH}$，交轴电感 $L_q = 0.92\\text{ mH}$。',
    analogy: '直观理解：把一根椭圆形铁块放在磁场里，哪怕铁块本身没有永磁性，它也会自动扭转对齐到磁阻最小（导磁最顺畅）的方向——这就是“磁阻转矩” $T_{\\text{rel}}$。V 型转子故意让 $d$ 轴和 $q$ 轴的导磁能力相差 $2.4$ 倍，从而白嫖出这股强大的扭力！',
    keyPoints: [
      {
        label: '为什么交轴电感 $L_q (0.92\\text{ mH}) >$ 直轴电感 $L_d (0.38\\text{ mH})$？',
        detail: '$d$ 轴磁路必须穿透两层厚厚的 V 型永磁体与空气隔磁槽（钕铁硼回复磁导率近似空气 $\\mu_r \\approx 1.05$），磁阻极大，故电感 $L_d$ 很小；而 $q$ 轴磁路全部沿着高导磁率的硅钢片通道闭合（$\\mu_r > 4000$，磁阻极小，故电感 $L_q$ 很大）。'
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
    highSchoolAnchor: {
      topic: '高中物理必修二机械能守恒定律 + 选修 3-2 发电机原理与楞次定律',
      principle: '发电机把机械动能转化为电能；楞次定律表明感应电流的磁场总是阻碍引起感应的原运动（安培反推阻力）。',
      bridgeInsight: '负载角转为负值（$\\delta < 0^\\circ$），定子磁场拖在转子后方施加安培阻力，车轮机械动能被反向转化为三相交流电灌回动力电池。'
    },
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
    highSchoolAnchor: {
      topic: '高中数学三角函数投影与和差化积 + 物理相对运动思想',
      principle: '空间向量在不同坐标系下的基底变换与正交投影；以匀速转动的物体为参考系，转动物体相对静止。',
      bridgeInsight: 'Clarke 变换将 3 轴（$120^\\circ$）降为 2 轴（$90^\\circ$），Park 变换乘以旋转矩阵消除时间交变项，将三相高频正弦波变为平稳直流量。'
    },
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
  initialTab?: GuideModalTab;
  initialStepIndex?: number;
  onClose: () => void;
  onApplyDemo: (updates: Partial<SimulationState>, cameraPreset?: string) => void;
  theme?: 'dark' | 'light';
}

export const PhysicsGuideModal: React.FC<PhysicsGuideModalProps> = React.memo(({
  isOpen,
  initialTopicId = 'load_angle_mtpa',
  initialTab = 'ladder',
  initialStepIndex = 1,
  onClose,
  onApplyDemo,
  theme = 'dark'
}) => {
  const [activeTab, setActiveTab] = useState<GuideModalTab>(initialTab);
  const [currentStepNum, setCurrentStepNum] = useState<number>(initialStepIndex);
  const [selectedTopicId, setSelectedTopicId] = useState<PhysicsTopicId>(initialTopicId);
  const [showDerivation, setShowDerivation] = useState<boolean>(true);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialTopicId) {
      setSelectedTopicId(initialTopicId);
    }
  }, [initialTopicId]);

  useEffect(() => {
    if (initialStepIndex) {
      setCurrentStepNum(initialStepIndex);
    }
  }, [initialStepIndex]);

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

  const currentStep = KNOWLEDGE_LADDER_STEPS.find(s => s.stepNum === currentStepNum) || KNOWLEDGE_LADDER_STEPS[0];
  const activeTopic = PHYSICS_TOPICS.find(t => t.id === selectedTopicId) || PHYSICS_TOPICS[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-slate-950/88 p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl rounded-2xl border border-cyan-500/40 bg-[#0b101b] shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-950 to-indigo-950 border border-cyan-500/40 text-cyan-400">
              <Compass size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono tracking-wide flex items-center gap-2">
                  <span>IPMSM 电磁物理与 FOC 控制保姆级科普</span>
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-bold">
                  <GraduationCap size={12} />
                  <span>高中物理知识平权全景工程</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                从高中电磁学、积化和差与解析几何，手把手推导至现代电动车 8P48S、逆凸极磁阻转矩与 20000 RPM 弱磁控制
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher Pills */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('ladder')}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ladder'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap size={13} />
                <span>🎓 5步知识平权阶梯</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('topics')}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'topics'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen size={13} />
                <span>⚡ 7大工程深度专题</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors flex items-center justify-center cursor-pointer"
              title="关闭科普百科 (ESC)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ================= TAB 1: 5-STEP HIGH SCHOOL KNOWLEDGE LADDER ================= */}
        {activeTab === 'ladder' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Step Selector Horizontal Rail */}
            <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
              <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase shrink-0 flex items-center gap-1 mr-1">
                <Sparkles size={13} />
                <span>认知跃迁台阶：</span>
              </div>
              {KNOWLEDGE_LADDER_STEPS.map((step) => {
                const isActive = step.stepNum === currentStepNum;
                return (
                  <button
                    key={step.stepNum}
                    type="button"
                    onClick={() => setCurrentStepNum(step.stepNum)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,242,254,0.25)] font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                      isActive ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {step.stepNum}
                    </span>
                    <span>{step.badge.split('·')[1]?.trim() || step.badge}</span>
                  </button>
                );
              })}
            </div>

            {/* Step Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {/* Step Header Banner */}
              <div className="flex flex-col gap-1 border-b border-slate-800/70 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                    认知台阶 {currentStep.stepNum} / 5
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentStep.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-1">
                  <span>{currentStep.title}</span>
                </h3>
                <p className="text-xs text-amber-300/90 font-medium leading-relaxed">
                  💡 核心突破：<MathText text={currentStep.tagline} />
                </p>
              </div>

              {/* Two Column Grid: High School Physics vs Modern EV Engineering */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Card: High School Physics Foundation */}
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 flex flex-col gap-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                    <span className="text-xs font-mono text-indigo-300 font-bold flex items-center gap-1.5 uppercase">
                      <GraduationCap size={15} className="text-indigo-400" />
                      <span>高中物理基础回顾</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                      课本锚点
                    </span>
                  </div>

                  <div className="text-[11px] text-indigo-200 bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/20 leading-snug">
                    📖 <strong>知识点出处：</strong><MathText text={currentStep.highSchoolFoundation.textbookTopic} />
                  </div>

                  {/* High School Formulas */}
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-mono text-slate-400 mb-1">高中课本经典公式</span>
                    <LatexMath block math={currentStep.highSchoolFoundation.formulaLatex} className="text-sm text-indigo-300" />
                    <p className="text-[10px] text-slate-400 mt-1">
                      <MathText text={currentStep.highSchoolFoundation.formulaDesc} />
                    </p>
                  </div>

                  {/* Bullet points */}
                  <div className="flex flex-col gap-2">
                    {currentStep.highSchoolFoundation.corePrinciples.map((cp, idx) => (
                      <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span><MathText text={cp} /></span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed italic">
                    <MathText text={currentStep.highSchoolFoundation.intuition} />
                  </div>
                </div>

                {/* Right Card: Modern EV Engineering Bridge */}
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 flex flex-col gap-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                    <span className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-1.5 uppercase">
                      <Zap size={15} className="text-cyan-400" />
                      <span>现代纯电车工程跃迁</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                      8P48S IPMSM
                    </span>
                  </div>

                  <div className="text-[11px] text-cyan-200 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/20 leading-snug">
                    🚀 <strong>工程突破目标：</strong><MathText text={currentStep.engineeringBridge.coreInsight} />
                  </div>

                  {/* Engineering Formula */}
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-mono text-cyan-400 mb-1">工程多物理场控制方程</span>
                    <LatexMath block math={currentStep.engineeringBridge.formulaLatex} className="text-sm text-cyan-300" />
                    <p className="text-[10px] text-slate-400 mt-1">
                      <MathText text={currentStep.engineeringBridge.formulaDesc} />
                    </p>
                  </div>

                  {/* Engineering Breakdown points */}
                  <div className="flex flex-col gap-2.5">
                    {currentStep.engineeringBridge.breakdownPoints.map((bp, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 flex flex-col gap-1">
                        <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-cyan-950 text-[10px] font-mono flex items-center justify-center text-cyan-300 border border-cyan-500/30 shrink-0">
                            {idx + 1}
                          </span>
                          <MathText text={bp.title} />
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed pl-5.5">
                          <MathText text={bp.desc} />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Mathematical Derivation (Accordion Box) */}
              <div className="rounded-xl border border-blue-500/35 bg-slate-950 overflow-hidden shadow-lg">
                <button
                  type="button"
                  onClick={() => setShowDerivation(!showDerivation)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-950/60 to-slate-950 border-b border-blue-500/20 flex items-center justify-between text-left cursor-pointer hover:bg-blue-900/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-blue-900/80 text-blue-300 border border-blue-400/30 text-xs">
                      📐
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-200">
                      【手把手逐行严格数学推导】{currentStep.mathematicalDerivation.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-blue-400 flex items-center gap-1">
                    <span>{showDerivation ? '收起推导' : '展开详细推导'}</span>
                    <span>{showDerivation ? '▲' : '▼'}</span>
                  </span>
                </button>

                {showDerivation && (
                  <div className="p-4 flex flex-col gap-3.5 bg-slate-950/80">
                    {currentStep.mathematicalDerivation.steps.map((st, sIdx) => (
                      <div key={sIdx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-cyan-950 text-[10px] font-mono flex items-center justify-center text-cyan-300 border border-cyan-500/30">
                              {sIdx + 1}
                            </span>
                            <MathText text={st.stepName} />
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                            {st.hsRuleTag}
                          </span>
                        </div>

                        <div className="my-1 py-1.5 px-3 rounded bg-slate-950 border border-slate-800/80 text-center text-amber-300">
                          <LatexMath block math={st.latex} className="text-xs" />
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
                          <MathText text={st.explanation} />
                        </p>
                      </div>
                    ))}

                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex flex-col items-center justify-center text-center gap-1">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">推导终极结论方程</span>
                      <LatexMath block math={currentStep.mathematicalDerivation.conclusionLatex} className="text-xs text-white font-bold" />
                      <p className="text-[11px] text-cyan-200 mt-1">
                        <MathText text={currentStep.mathematicalDerivation.conclusionNote} />
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Intuitive Life Analogy (Green Box) */}
              <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/35 flex flex-col gap-1.5 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
                  <Sparkles size={15} />
                  <span>{currentStep.analogy.title}</span>
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
                  <MathText text={currentStep.analogy.body} />
                </p>
              </div>

              {/* High School Engineering FAQ (Amber Box) */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col gap-1.5 shadow-md">
                <div className="text-xs font-bold text-amber-400 dark:text-amber-300 font-mono flex items-center gap-2">
                  <span>❓ 高中生深度疑问：</span>
                  <MathText text={currentStep.faq.question} />
                </div>
                <div className="text-xs text-amber-950 dark:text-amber-100/90 leading-relaxed pl-4 border-l-2 border-amber-500/50 mt-1 font-medium">
                  <strong className="text-amber-900 dark:text-amber-300 font-bold">💡 工程揭秘：</strong>
                  <MathText text={currentStep.faq.answer} />
                </div>
              </div>

              {/* EV Industry Practice Case Study (Purple/Blue Box) */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col gap-1.5 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-purple-400 dark:text-purple-300 font-mono">
                  <span className="flex items-center gap-2">
                    <span>🏎️ 工业实战案例：</span>
                    <span><MathText text={currentStep.industryCase.headline} /></span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 border border-purple-500/30 text-purple-300 font-mono">
                    {currentStep.industryCase.vehicle}
                  </span>
                </div>
                <p className="text-xs text-purple-950 dark:text-purple-100/90 leading-relaxed mt-1 font-medium">
                  <MathText text={currentStep.industryCase.analysis} />
                </p>
              </div>

              {/* 3D Hands-on Interactive Mission Checklist (Dark Teal Box) */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Activity size={14} className="text-cyan-400" />
                    <span>🎮 3D 实验室动手探索任务：{currentStep.interactiveMission.missionGoal}</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">交互指南</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                  {currentStep.interactiveMission.actionSteps.map((act, aIdx) => (
                    <div key={aIdx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
                      <span className="text-cyan-400 font-bold font-mono">0{aIdx + 1}.</span>
                      <span><MathText text={act} /></span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20 mt-1 flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span><strong>预期观察效果：</strong><MathText text={currentStep.interactiveMission.expectedObservation} /></span>
                </div>
              </div>

              {/* Step Navigation & 3D Interactive Action Bar */}
              <div className="mt-2 pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  {currentStepNum > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStepNum(currentStepNum - 1)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition-colors cursor-pointer"
                    >
                      ← 上一阶 (台阶 {currentStepNum - 1})
                    </button>
                  )}
                  {currentStepNum < 5 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStepNum(currentStepNum + 1)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <span>下一阶 (台阶 {currentStepNum + 1})</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopicId(currentStep.linkedTopicId);
                      setActiveTab('topics');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer ml-1"
                  >
                    <BookOpen size={13} />
                    <span>查看关联工程专题</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onApplyDemo(currentStep.demoPreset.stateUpdates, currentStep.demoPreset.cameraPreset);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  <Activity size={14} />
                  <span>⚡ 3D 实机体验：{currentStep.demoPreset.label}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: 7 IN-DEPTH ENGINEERING TOPICS ================= */}
        {activeTab === 'topics' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Topic Navigation */}
            <div className="w-[260px] border-r border-slate-800 bg-slate-950/60 p-3 flex flex-col gap-1.5 overflow-y-auto shrink-0">
              <div className="text-[10px] font-mono text-slate-400 font-semibold uppercase px-1 pb-1 flex items-center justify-between">
                <span>核心工程专题 (7)</span>
                <span className="text-[9px] text-cyan-400">LATEX 公式</span>
              </div>
              {PHYSICS_TOPICS.map((topic, idx) => {
                const isSelected = topic.id === selectedTopicId;
                return (
                  <button
                    type="button"
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
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

              {/* High School Physics Anchor Card */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/35 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-indigo-300">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-indigo-400" />
                    <span>🎓 高中物理认知平权锚点</span>
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    {activeTopic.highSchoolAnchor.topic}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>课本基础：</strong><MathText text={activeTopic.highSchoolAnchor.principle} />
                </p>
                <p className="text-xs text-indigo-200 leading-relaxed border-t border-indigo-500/20 pt-1.5">
                  <strong>思维跃迁：</strong><MathText text={activeTopic.highSchoolAnchor.bridgeInsight} />
                </p>
              </div>

              {/* Mathematical Formula Box (KaTeX) */}
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
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
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
        )}
      </div>
    </div>
  );
});

import { ComponentInfo } from '../types/motor';
import { X, Cpu, ShieldAlert, CheckCircle2, Layers, Zap, GraduationCap } from './Icons';
import { MathText } from './LatexMath';

const COMPONENT_DATABASE: Record<string, ComponentInfo> = {
  stator_laminated_core: {
    id: 'stator_laminated_core',
    name: '定子铁芯叠压总成 (Laminated Stator Core)',
    category: '定子系统',
    material: '0.25mm 无取向高磁导率极薄硅钢片 (Grade 25H1200 / 20JN1200)',
    industrialStandard: 'IEC 60034-1 / GB/T 2521-2008',
    keySpecs: [
      '槽数：48 槽极坐标精密开模',
      '外径：190 mm / 内径：130 mm',
      '叠片系数：98.2% 激光精密自粘胶固化',
      '磁极对数：4 对极 (8 极结构)'
    ],
    description: '采用高牌号低铁损冷轧无取向硅钢片叠压而成，齿部内收形成齿靴以均匀气隙磁通密度。薄片化叠片可切断感应涡流回路，极大降低高速运转（15000+ RPM）下的高频涡流损耗。',
    engineeringChallenges: '高速旋转时定子经历高达 1000Hz+ 的交变励磁，涡流损耗与磁滞损耗激增，若叠片间绝缘破损会导致严重铁芯局部过热烧结。',
    solutionInEV: '采用 0.20~0.25mm 级极薄硅钢片，双面涂覆纳米级绝缘膜，并应用无冲压应力自粘接点焊技术，降低边缘应力引起的导磁率劣化。',
    highSchoolBridge: '【高中选修 3-2 法拉第电磁感应与涡流热效应】为什么变压器和电机铁芯必须用几十万片相互绝缘的薄硅钢片叠压，而绝不能用整块实心生铁？当三相交变磁场高速穿过铁芯时，根据法拉第定律 $E = -\\frac{\\Delta \\Phi}{\\Delta t}$，铁芯自身会感应出闭合环形涡流（$I = E/R$）。整块生铁电阻极小，焦耳热 $Q = I^2 R t$ 会瞬间将铁芯烧熔！叠片将大环流切碎为微小高阻回路，且涡流损耗与单片厚度平方成正比（$P_{\\text{eddy}} \\propto d^2$）。厚度从 0.5mm 降至 0.25mm，涡流损耗骤降 75%！'
  },
  hairpin_phase_u: {
    id: 'hairpin_phase_u',
    name: 'U相发卡式扁线绕组 (Phase U Hairpin Winding)',
    category: '电磁绕组',
    material: '无氧铜矩形导线 (Oxygen-Free Copper C10200) + PAI/PEEK 复合聚酰亚胺耐电晕漆包层',
    industrialStandard: 'Class H / Class 220 级绝缘认证 (UL 1446)',
    keySpecs: [
      '导线截面：3.2 mm × 1.8 mm 扁平矩形',
      '槽满率：高达 75% ~ 82% (相比传统圆线 45% 大幅提升)',
      '导热系数：398 W/(m·K)',
      '额定耐温：220°C 持续运行'
    ],
    description: '现代高性能纯电动汽车（如保时捷 Taycan、特斯拉 Model 3/Y、比亚迪刀片系统）标配技术。成型的发卡形（U-shape）扁铜线穿入定子铁芯槽内，在端部通过自动扭头（Twist）并由激光精准焊接成相。',
    engineeringChallenges: '高频交流电流通过导体时，由于自感应电磁反电势，电流向导体表面聚集（集肤效应 Skin Effect）并在槽内产生邻近效应（Proximity Effect），使交流电阻大幅激增。',
    solutionInEV: '合理分层（4层、6层或8层发卡方案）与跨槽换位（Transposition），并在端部优化扭线角度以均布各层电抗，显著降低 AC/DC 交流电阻比。',
    highSchoolBridge: '【高中选修 3-1 闭合电路欧姆定律与焦耳定律】电驱电机需灌入高达 350A 的峰值相电流。根据焦耳定律 $P = I^2 R$，铜线哪怕只有毫欧级微小电阻，发热量也会随电流平方暴增！传统细圆铜线塞进槽里像“一把筷子插进圆筒”，空隙充满导热极差的空气，槽满率仅 40%；而发卡式扁铜线如同严丝合缝堆叠的乐高积木，槽满率跃升至 80%，横截面积翻倍、直流电阻直降 30%，相同发热下可多释放近一倍的安培动力！'
  },
  hairpin_phase_v: {
    id: 'hairpin_phase_v',
    name: 'V相发卡式扁线绕组 (Phase V Hairpin Winding)',
    category: '电磁绕组',
    material: '无氧铜矩形导线 (Oxygen-Free Copper C10200) + PAI/PEEK 绝缘层',
    industrialStandard: 'Class 220 绝缘等级',
    keySpecs: [
      '导线尺寸：3.2 mm × 1.8 mm',
      '相角空间差：120° 电气角移相',
      '焊接方式：激光高速视觉对焦焊 (TIG/Laser)'
    ],
    description: '与 U 相、W 相在空间和电气上呈严格 120° 互补相位，形成对称的三相旋转磁势空间矢量。',
    engineeringChallenges: '800V 高压平台下，逆变器 SiC 高频 PWM 开关（15~20kHz）产生极陡的电压变化率（du/dt > 10kV/μs），极易诱发局部放电（Partial Discharge）与端部电晕击穿。',
    solutionInEV: '采用耐电晕 PEEK/PAI 复合绝缘漆膜，结合槽内精密绝缘纸（Nomex 间位芳纶），提升局部放电起始电压（PDIV > 1500V）。',
    highSchoolBridge: '【高中选修 3-2 正弦交变电流与三相相位差】与 U 相、W 相在空间物理位置和时间相位上互差 120°（$\\frac{2\\pi}{3}$）。高中课本证明过三个相位互差 120° 的对称正弦波满足 $I_u + I_v + I_w \\equiv 0$ 瞬时平衡；在空间上，这三相绕组轮流激发磁场，像三个好友轮流推旋转木马，合力创造出大小恒定为 $1.5 B_m$、以角速度 $\\omega_e$ 平滑旋转的圆形磁场！'
  },
  hairpin_phase_w: {
    id: 'hairpin_phase_w',
    name: 'W相发卡式扁线绕组 (Phase W Hairpin Winding)',
    category: '电磁绕组',
    material: '无氧铜矩形导线 (Oxygen-Free Copper C10200)',
    industrialStandard: 'Class 220 绝缘等级',
    keySpecs: [
      '相角空间差：240° 电气角移相',
      '铜耗优化：相比圆铜线直流电阻降低 30%'
    ],
    description: '三相发卡绕组端部高度比圆线缩短 15~25mm，极大减小端部漏感与电机整体轴向尺寸，提升整机功率密度。',
    engineeringChallenges: '扁铜线刚度大，自动化穿线、扩口与扭头工艺极易划伤表面微米级绝缘膜，导致相间短路。',
    solutionInEV: '采用六轴工业机器人高精度视觉引导下模组化整圈压装，全流程 100% 漏电流与耐压检测。',
    highSchoolBridge: '【高中必修一空间几何向量与电感储能】W 相将电角度推向 240°，完成三相空间闭环。发卡扁线端部高度比圆线缩短 20mm 以上，根据螺线管自感公式 $L \\approx \\frac{\\mu N^2 S}{l}$，端部多余的空气漏磁通与无效铜重被大幅压缩，既节约珍贵紫铜，又降低了逆变器高速换相时的无功能量冲击。'
  },
  hairpin_weld_beads: {
    id: 'hairpin_weld_beads',
    name: '发卡绕组激光焊接端头 (Laser-Welded Hairpin Ends)',
    category: '电磁绕组',
    material: '高纯无氧铜熔池焊点 (Laser Welded Copper Joint) + 环氧粉末涂敷绝缘',
    industrialStandard: 'ISO 13919-2 激光束焊接质量 B 级 (最高级)',
    keySpecs: [
      '焊点数量：96 处跨槽波绕配对焊点',
      '激光波长：515 nm 绿光 / 1030 nm 蓝红复合光纤激光',
      '单点焊接耗时：≤ 80 ms 机器视觉自动寻位',
      '接触电阻：≤ 5 μΩ 超低连接阻抗'
    ],
    description: '发卡扁铜线穿入定子铁芯并在非插入端（焊接端 -Z）经过扩口、扭头（Twisting）跨过 6 个定子齿距后，相邻层导体端头对齐并通过高功率激光瞬间熔融形成球状无氧铜焊珠，构成连续的波绕（Wave Winding）串联回路。',
    engineeringChallenges: '紫铜对传统红外激光反射率极高（>90%），极易产生焊接飞溅（Spatter）、气孔及虚焊；高速振动与冷热冲击下焊点疲劳开裂会导致整相开路。',
    solutionInEV: '采用绿光/蓝光复合双光束环形摆动激光焊（Wobble Welding），配合 AI 3D 视觉定位与焊后环氧树脂浸渍涂覆，确保零飞溅与高机械抗拉强度。',
    highSchoolBridge: '【高中选修 3-1 接触电阻与金属熔融】两根刚性铜线对接处若靠螺栓机械夹紧，微观接触面粗糙，接触电阻会产生数十千瓦局部高热烧断。采用激光焊接，光能瞬间将无氧铜加热至 1083°C 熔点熔合成均匀的铜熔池焊珠，将接触电阻压低至微欧（$\\le 5\\mu\\Omega$）级别，承受高频交变大电流而安然无恙。'
  },
  rotor_permanent_magnets: {
    id: 'rotor_permanent_magnets',
    name: 'V型内置钕铁硼永磁体 (NdFeB IPM Magnets)',
    category: '转子系统',
    material: '烧结钕铁硼强磁合金 (Grade N48UH / N50SH)',
    industrialStandard: 'GB/T 13560-2017 / ASTM A977',
    keySpecs: [
      '剩磁 Br：1.38 ~ 1.43 Tesla',
      '内禀矫顽力 Hcj：≥ 25 kOe (超强抗退磁能力)',
      '最大磁能积 (BH)max：46 ~ 49 MGOe',
      '最高工作结温：180°C 持续运行'
    ],
    description: '转子内部每对极由两块矩形磁钢呈 V 字形排布，形成集磁效应（Flux Concentration）。V 型磁钢间的铁芯构成 $q$ 轴磁路通道，实现显著的凸极比（$L_q > L_d$），使电机具备强大的磁阻转矩输出能力。',
    engineeringChallenges: '高速高温（150°C+）且遭遇定子强反向弱磁去磁磁场冲击时，永磁体极易发生不可逆热退磁；此外高频漏磁通在磁钢内部引起涡流发热。',
    solutionInEV: '在晶界扩散添加重稀土元素（镝 Dy / 铽 Tb），将磁钢轴向细分切片并进行环氧绝缘隔离，阻断涡流回路，大幅提升抗去磁裕度。',
    highSchoolBridge: '【高中选修 3-1 安培分子电流假说与磁铁对齐力矩】钕铁硼（NdFeB）被誉为现代“磁王”，其微观未成对电子自旋高度平行取向，产生高达 1.4 Tesla 的外磁感应强度 $\\vec{B}$。两块磁铁排成 V 字型，利用铁芯高导磁率像水流漏斗一样把磁感线向外侧气隙汇聚收拢（聚磁效应），产生无需持续消耗电能即可输出的永磁对齐力矩！'
  },
  rotor_laminated_core: {
    id: 'rotor_laminated_core',
    name: 'V型转子铁芯总成 (IPM Rotor Core)',
    category: '转子系统',
    material: '高抗拉屈服强度硅钢片 (Grade 30JN1500 / 35H250)',
    industrialStandard: 'ISO 6892 屈服强度 ≥ 450 MPa',
    keySpecs: [
      '极数：8 极 (4 对极)',
      '外径：128.4 mm (气隙 0.8 mm)',
      '极限转速：18000 RPM (线速度 > 120 m/s)',
      '隔磁桥厚度：1.2 mm 极限轻量化设计'
    ],
    description: '转子铁芯内置 V 型隔磁槽。为了抑制漏磁并承受超高速离心力，磁槽外侧与转子外圆之间设计了极其精准的“隔磁微桥（Flux Barrier Bridges）”。',
    engineeringChallenges: '隔磁桥越薄，磁漏越少，电机电磁性能越好；但转速达到 16000 RPM 时，转子承受巨大离心应力，隔磁桥处于塑性变形与断裂边缘。',
    solutionInEV: '采用电磁-机械应力多物理场拓扑优化设计，配合高屈服强度硅钢片与转子碳纤维环绑扎（Carbon Sleeve）复合加固。',
    highSchoolBridge: '【高中必修一圆周运动向心力与选修 3-1 磁阻能量最低原理】转子以 16000 RPM 旋转时，外圆边缘线速度超 120 m/s，向心加速度 $a = \\omega^2 r$ 达数千倍重力加速度 $g$！硅钢片不仅要承受超强机械撕扯力，更在几何上雕刻出 V 型槽。由于硅钢片极易导磁而磁铁磁阻极大，转子铁芯永远想顺着外磁场转动以减小总磁阻，产生占整车近半动力的纯结构“磁阻转矩”！'
  },
  cooling_water_jacket: {
    id: 'cooling_water_jacket',
    name: '螺旋水道冷却外壳 (Spiral Cooling Water Jacket)',
    category: '冷却外壳',
    material: '低压压铸铝合金 (Die-Cast Aluminum A380 / AlSi9Cu3)',
    industrialStandard: 'IP67 / IP6K9K 密封与防尘防水',
    keySpecs: [
      '冷却介质：50% 乙二醇 + 50% 纯净水防冻液',
      '流量：12 ~ 18 L/min',
      '压降：≤ 35 kPa @ 15 L/min',
      '最大散热功率：15 kW 持续热负载'
    ],
    description: '采用双层一体式铸铝机壳，内胆与外壳之间嵌合出多圈螺旋导流槽。冷却液自驱动端注入，沿螺旋流道充分包覆定子铁芯外圆，将定子铜耗与铁耗迅速带走至车头散热水箱。',
    engineeringChallenges: '长期流动下乙二醇高温氧化可能腐蚀铝质水道壁面，产生水垢沉淀导致热阻上升，甚至渗漏侵入高压定子腔体。',
    solutionInEV: '内壁阳极氧化处理防腐蚀，配合双道氟橡胶 O 形圈阶梯密封，外壳加装泄露监测呼吸阀。',
    highSchoolBridge: '【高一热学比热容公式 Q = cmΔT 与对流换热】水和乙二醇混合冷却液具有极高比热容（$\\sim 4.2 \\times 10^3\\text{ J/(kg}\\cdot^\\circ\\text{C)}$）。螺旋形密闭水套强迫冷却液贴紧机壳外壁做高速圆周对流运动，扩大接触雷诺数与换热面积，源源不断将定子产生的数千瓦焦耳热搬运至车头散热器，防止漆包绝缘过热老化。'
  },
  oil_cooling_system: {
    id: 'oil_cooling_system',
    name: '定转子直喷油冷与空心轴离心油路 (Direct Oil Spray & Hollow-Shaft Oil Circuit)',
    category: '冷却外壳',
    material: '超低粘度全合成介电冷却油 (ATF/EV Fluid) + 精密黄铜/不锈钢微孔阵列喷油环',
    industrialStandard: 'IEC 60296 绝缘介电强度 ≥ 45 kV / SAE J3200 EV 油冷规范',
    keySpecs: [
      '喷油结构：前后双端 32 孔微射流喷油环 (覆盖发卡冠部与激光焊点)',
      '转子内冷：空心轴中心枪钻油道 + 16 孔径向离心甩油通道',
      '油液流量：8.0 ~ 14.0 L/min (电子油泵 EOP 按结温闭环调速)',
      '换热提升：相比纯水套冷却，定子端部热点降温 35°C+，持续功率提升 40%'
    ],
    description: '现代 800V 高功率密度电驱（如特斯拉 Plaid、比亚迪八合一、华为 DriveONE）的核心热管理技术。由于定子槽绝缘纸存在热阻且发卡绕组端部悬空无法接触水套，水油复合系统通过顶部高压进油歧管向前后双端喷油环供油，32 束微射流直接喷淋冲刷发卡铜线冠部与激光焊点；同时部分冷却油经空心花键轴内孔注入，利用转子高速旋转的离心力（$\\omega_m^2 r$）从径向甩油孔飞溅冷却 V 型钕铁硼磁钢，最终受重力汇入底部集油槽经油水板式换热器（Oil-to-Water Heat Exchanger）循环降温。',
    engineeringChallenges: '低温（-30°C）下油液粘度激增导致电子油泵功耗飙升；且若过量冷却油涌入 0.8mm 定转子气隙，在 15000 RPM 超高速下会产生剧烈的气隙搅拌风阻/油摩损耗（Oil Churning Loss）。',
    solutionInEV: '定制超低运动粘度（40°C 下 ≤ 12 cSt）耐高压合成电驱油，并在转子两端设计迷宫式导油挡环与干式油底壳主动抽吸泵（Dry-Sump Scavenge），防止油液倒灌气隙。',
    highSchoolBridge: '【高中选修 3-1 介质绝缘击穿 + 必修一圆周运动向心力】普通水导电，若直接淋在 800V 裸铜焊点上会引发灾难性短路；全合成介电电驱油耐高压（介电击穿电压 $> 45\\text{ kV}$），可直接淋在铜线上！同时利用转子高速自转的向心加速度 $a = \\omega^2 r$，像离心甩干机一样将空心轴内注入的冷油从径向微孔强力甩出成飞溅油雾，精准浸润钕铁硼永磁体！'
  },
  aluminum_housing_jacket: {
    id: 'aluminum_housing_jacket',
    name: '高刚性铸铝轻量机壳 (Aluminum Stator Housing)',
    category: '冷却外壳',
    material: '铝合金 6061-T6 / AlSi10Mg',
    industrialStandard: 'ISO 1940 动平衡等级 G1.0',
    keySpecs: [
      '外径：224 mm / 长度：170 mm',
      '壁厚：4.5 mm 轻量化薄壁结构',
      '静态扭转刚度：≥ 15,000 N·m/deg'
    ],
    description: '为整台驱动电机提供结构支撑与安装固定，与减速器箱体一体化直连。',
    engineeringChallenges: '承受高达 400+ N·m 的电磁反扭矩冲击，并必须有效衰减定转子齿槽谐波引发的高频电磁噪声（NVH 振动啸叫）。',
    solutionInEV: '外壳分布拓扑优化加强肋筋（Stiffening Ribs），避开 1000~4000 Hz 人耳敏感频段的结构共振。',
    highSchoolBridge: '【高中必修一牛顿第三定律（作用力与反作用力）】转子输出 400 N·m 的狂暴电磁转矩推车飞驰；根据牛顿第三定律，定子机壳就会承受大小相等、方向相反的 400 N·m 反向旋转扭力！高刚性铸铝机壳配合拓扑优化加强肋，将巨大的电磁反力牢牢锚定在副车架上，同时吸收抑制定转子齿槽谐波引发的高频 NVH 啸叫共振。'
  },
  front_end_shield: {
    id: 'front_end_shield',
    name: '驱动端精密压铸前端盖 (Drive-End Front Shield)',
    category: '冷却外壳',
    material: '高压压铸铝合金 (AlSi12Cu1(Fe)) + 精密数控镗孔轴承室',
    industrialStandard: 'ISO 2768-mK 精密机加工公差 / IP6K9K',
    keySpecs: [
      '同轴度公差：≤ 0.015 mm (确保 0.8mm 均匀气隙)',
      '紧固结构：8 颗 M8×1.25 高强度法兰螺栓周向均布',
      '集成功能：内置前轴承刚性支撑座与高速 PTFE 旋转唇形油封'
    ],
    description: '位于电机输出轴侧（驱动端 +Z），通过止口定位与机壳精密配合，承载前高速轴承径向与轴向载荷，并将电机气隙严格锁定在 0.8mm 同心度以内。',
    engineeringChallenges: '温度在 -40°C 至 +140°C 剧烈交变时，铝合金端盖与钢制轴承外圈热膨胀系数不一致，易造成轴承外圈跑圈（Creep）或端盖应力开裂。',
    solutionInEV: '在铝合金端盖内镶嵌高强度铸铁/钢制轴承衬套（Steel Insert Ring），并通过有限元模态分析布置放射状加强筋抑制端盖鼓膜振动噪声。',
    highSchoolBridge: '【高中必修一刚体同轴约束与微小形变】定子和转子之间只有 0.8mm 极其狭窄的缝隙（气隙）。若前端盖轴承室同轴度偏差超过 0.03mm，转子就会在强大单边磁拉力（$F_{\\text{ump}} \\propto \\frac{B^2}{\\delta^2}$）下失稳，直接与定子铁芯剧烈刮擦碰撞（扫膛事故）！精密前端盖通过 8 颗高强螺栓，将同轴度死死锁定在微米级公差内。'
  },
  rear_end_shield: {
    id: 'rear_end_shield',
    name: '非驱动端集成后端盖 (Non-Drive-End Rear Shield)',
    category: '冷却外壳',
    material: '高压压铸铝合金 + 电磁屏蔽腔体设计',
    industrialStandard: 'CISPR 25 Class 5 车载 EMC 电磁兼容标准',
    keySpecs: [
      '同轴度公差：≤ 0.015 mm',
      '集成接口：内置旋变传感器定子安装座与低压信号航空插头通道',
      '接地防护：集成轴电流碳刷接地环安装腔'
    ],
    description: '位于电机非驱动端（-Z），除支撑后轴承外，还为尾轴无刷旋变传感器（Resolver）提供全密封防尘、防油及抗强电磁干扰（EMC）的独立屏蔽腔室。',
    engineeringChallenges: '发卡绕组焊接端头近在咫尺，高频 PWM 开关共模噪声极易耦合进后端盖内的微弱旋变正余弦模拟信号。',
    solutionInEV: '后端盖内壁增设涡流屏蔽隔板，并对后轴承室采用陶瓷绝缘涂层或绝缘套设计，彻底阻断高频轴电流回路。',
    highSchoolBridge: '【高中选修 3-1 静电屏蔽与法拉第电磁屏蔽】逆变器每秒开关 20,000 次数百安培的大电流，向周围辐射强烈的电磁杂波脉冲（EMI）。后端盖形成一个导电金属法拉第笼（Faraday Cage），把外界电磁浪涌拦截导入地线，保护腔体内娇贵的尾轴旋变微弱信号不被杂波干扰失真。'
  },
  splined_shaft_assembly: {
    id: 'splined_shaft_assembly',
    name: '渐开线花键传动轴 (Splined Transmission Shaft)',
    category: '机械与传感',
    material: '高强度渗碳合金钢 40CrNiMoA / 20CrMnTi',
    industrialStandard: 'DIN 5480 渐开线花键标准',
    keySpecs: [
      '输出花键模数：m = 1.25, 齿数 z = 16',
      '热处理：渗碳淬火 表面硬度 HRC 58~62',
      '中空内孔：支持空心轴内冷喷油技术'
    ],
    description: '负责将转子产生的巨大电磁转矩高速传递给电动车单级减速器。现代先进电机多采用空心轴结构，内部通冷却油直接喷射冷却转子磁钢与绕组端部。',
    engineeringChallenges: '急加速/急减速时承受极高冲击扭矩与交变疲劳载荷，花键齿根部易产生微动磨损（Freting Fatigue）。',
    solutionInEV: '花键齿面高频感应淬火配合深冷处理，齿根采用滚压强化工艺消除微裂纹隐患。',
    highSchoolBridge: '【高一物理力矩公式 M = F · r 与剪切应力】若输出轴只用单根定位销或平键传动，400 N·m 的瞬时暴击扭矩会把接触面瞬间剪断。渐开线花键将圆周均匀切成 16 个高强度渐开线齿形，将剪切推力平摊到 16 个接触面上，让每一处材料受力都在弹性形变安全范围之内。'
  },
  resolver_sensor: {
    id: 'resolver_sensor',
    name: '无刷变磁阻旋变传感器 (Variable Reluctance Resolver)',
    category: '机械与传感',
    material: '软磁合金极薄片 + 精密铜线绕组',
    industrialStandard: 'AEC-Q200 车规级可靠性认证',
    keySpecs: [
      '极对数：4X 对极与电机转子严格同步',
      '角位置精度：≤ ±10 角分 (Arcmin)',
      '耐温范围：-40°C ~ +150°C',
      '接口：正弦/余弦模拟量差分输出'
    ],
    description: '安装在电机尾轴，用于实时检测转子绝对机械角与电气角 $\\theta_e$。FOC 矢量控制算法依赖该角度进行精确的帕克坐标变换与三相电流闭环控制。',
    engineeringChallenges: '纯电动汽车底盘电磁环境极其恶劣，几百安培的高频开关电流产生强大的空间电磁干扰（EMI），光电编码器耐高温抗振能力差。',
    solutionInEV: '采用全无刷变磁阻结构，无任何敏感电子元器件，耐强磁场干扰、耐剧烈振动且寿命与整车同寿。',
    highSchoolBridge: '【高中选修 3-2 法拉第电磁感应与交流发电机原理】初中学过线圈切割磁感线产生感应电流。旋变传感器的定子线圈通入高频正弦励磁电，转子偏心凸极随轴旋转，改变气隙磁阻，使正交的副边线圈感应出 $V_{\\sin} \\propto \\sin\\theta$ 与 $V_{\\cos} \\propto \\cos\\theta$ 的信号。微处理器拿正弦除以余弦做反正切 $\\arctan$，就能在微秒级时间内无触点精确定位转子转到了哪一度！'
  }
};

interface EncyclopediaModalProps {
  selectedId: string | null;
  onClose: () => void;
}

export const EncyclopediaModal: React.FC<EncyclopediaModalProps> = ({ selectedId, onClose }) => {
  if (!selectedId) return null;

  // Normalize ID lookup
  let info = COMPONENT_DATABASE[selectedId];
  if (!info) {
    // Try prefix matching (e.g. magnet_p0_left_N -> rotor_permanent_magnets)
    if (selectedId.startsWith('magnet_')) {
      info = COMPONENT_DATABASE['rotor_permanent_magnets'];
    } else if (selectedId.startsWith('hairpin_')) {
      info = COMPONENT_DATABASE['hairpin_phase_u'];
    } else if (selectedId.includes('bearing')) {
      info = {
        id: 'bearing_assembly',
        name: '高速低摩擦陶瓷/深沟球轴承 (High-Speed Motor Bearings)',
        category: '机械与传感',
        material: '氮化硅陶瓷球 (Si3N4) + 高碳铬轴承钢 (GCr15) 套圈',
        industrialStandard: 'ABEC-7 / ISO P4 级超精密公差',
        keySpecs: ['极限转速：20,000 RPM', '润滑方式：高温全合成耐电蚀润滑脂', '陶瓷绝缘击穿电压：> 2.5 kV'],
        description: '支撑转轴平稳超高速运转。混合陶瓷轴承具备优异的绝缘性，彻底避免变频器高频共模电压导致的“轴电流（Shaft Voltage）”电腐蚀麻点缺陷。',
        engineeringChallenges: '超高速运转下的发热磨损与 PWM 轴电压引起的微小电弧放电导致轴承早期失效跑死。',
        solutionInEV: '采用陶瓷滚动体切断回路，并在轴端加装碳纤维接地碳刷（Shaft Grounding Ring）。',
        highSchoolBridge: '【高中选修 3-1 电势差与绝缘介质击穿】变频器高频开关会在转轴两端感应出几十伏的‘轴电压’。普通钢球轴承中油膜一旦被击穿，微小电弧放电会像电焊一样把滚珠表面蚀出无数麻坑（电蚀跑死）。换用氮化硅陶瓷球（Si3N4），利用陶瓷超强绝缘性彻底切断电流回路，实现 20,000 RPM 超高速静音长寿命运行。'
      };
    } else {
      return null;
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] max-w-[90vw] z-50 p-4 flex flex-col pointer-events-auto animate-in slide-in-from-right duration-300">
      <div className="flex-1 glass-panel-glow rounded-xl p-5 flex flex-col gap-4 overflow-y-auto text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                {info.category}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {info.industrialStandard}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1.5 leading-snug">
              {info.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Material & Standards */}
        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono font-semibold">
            <Layers size={14} />
            <span>核心材料与工艺规范</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {info.material}
          </p>
        </div>

        {/* Key Specs */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider">
            KEY PARAMETERS // 关键工程参数
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {info.keySpecs.map((spec, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-900/40 px-2.5 py-1.5 rounded border border-slate-800/80">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                <span><MathText text={spec} /></span>
              </div>
            ))}
          </div>
        </div>

        {/* Function Description */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider">
            WORKING PRINCIPLE // 电磁与结构机理
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            <MathText text={info.description} />
          </p>
        </div>

        {/* High School Physics Bridge */}
        {info.highSchoolBridge && (
          <div className="bg-emerald-950/25 border border-emerald-500/35 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
              <GraduationCap size={15} />
              <span>高中物理认知平权直觉映射 (High School Bridge)</span>
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              <MathText text={info.highSchoolBridge} />
            </p>
          </div>
        )}

        {/* Engineering Challenge */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold font-mono">
            <ShieldAlert size={14} />
            <span>现代 EV 核心设计痛点 (Challenge)</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            <MathText text={info.engineeringChallenges} />
          </p>
        </div>

        {/* EV Solution */}
        <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold font-mono">
            <Zap size={14} />
            <span>工程对策与技术演进 (EV Solution)</span>
          </div>
          <p className="text-xs text-cyan-200/90 leading-relaxed">
            <MathText text={info.solutionInEV} />
          </p>
        </div>
      </div>
    </div>
  );
};

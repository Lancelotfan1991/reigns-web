/**
 * 崇祯朝改革方案浏览数据
 *
 * 基于《崇祯朝改革方案总览》文档，整理10项可能改革的详细信息，用于改革方案浏览页面。
 */

export interface ReformStep {
  /** 步骤名称 */
  name: string
  /** 步骤描述 */
  description: string
  /** 财力耗费（白银两） */
  costGold: number
  /** 人力需求（人数） */
  costManpower: number
  /** 所需时间（年） */
  duration: number
  /** 基础成功率（0-100） */
  successRate: number
  /** 提升成功率的条件 */
  boostConditions: string[]
  /** 实施人员要求 */
  requiredRoles: string[]
}

export interface Reform {
  /** 改革ID */
  id: string
  /** 改革名称 */
  name: string
  /** 改革类别 */
  category: '财政' | '军事' | '人事' | '农业' | '工业' | '监察'
  /** 可能的发生时间 */
  possibleYears: string
  /** 历史提出人 */
  proposers: string[]
  /** 总持续时间（年） */
  totalDuration: number
  /** 改革内容概述 */
  summary: string
  /** 实施步骤 */
  steps: ReformStep[]
  /** 前置条件 */
  prerequisites: string[]
  /** 深层挑战 */
  challenges: string[]
  /** 失败触发条件 */
  failureConditions: string[]
  /** 失败后果 */
  failureConsequences: string[]
  /** 预期收益 */
  expectedBenefits: string
}

export const REFORM_BROWSE_DATA: Reform[] = [
  {
    id: 'open-maritime',
    name: '开海禁',
    category: '财政',
    possibleYears: '崇祯元年-五年（1628-1632）',
    proposers: ['熊文灿', '邹维琏'],
    totalDuration: 2,
    summary: '开放海禁，允许民间商船出海贸易，在沿海港口设立海关，征收海税。',
    steps: [
      {
        name: '设立海关',
        description: '在漳州月港、泉州、广州等地设立海关，制定海税则例。',
        costGold: 100000,
        costManpower: 100,
        duration: 0.5,
        successRate: 80,
        boostConditions: ['获得地方官员支持', '郑芝龙合作'],
        requiredRoles: ['户部侍郎', '福建巡抚'],
      },
      {
        name: '发放船引',
        description: '制定出海许可证制度，控制出海船只数量和规模。',
        costGold: 50000,
        costManpower: 50,
        duration: 0.5,
        successRate: 70,
        boostConditions: ['建立登记制度', '打击走私'],
        requiredRoles: ['海关官员'],
      },
      {
        name: '建立水师',
        description: '招募水师巡逻，打击海盗，保护商船。',
        costGold: 150000,
        costManpower: 1000,
        duration: 1,
        successRate: 60,
        boostConditions: ['利用郑芝龙水师', '料罗湾海战胜利'],
        requiredRoles: ['水师将领'],
      },
    ],
    prerequisites: [
      '沿海局势相对稳定',
      '朝廷有决心推行',
      '压制保守派反对',
    ],
    challenges: [
      '荷兰东印度公司威胁',
      '保守派反对（担心倭寇复起）',
      '走私利益集团阻挠',
    ],
    failureConditions: [
      '沿海发生大规模海盗袭击',
      '保守派强力阻挠',
      '走私反而加剧',
    ],
    failureConsequences: [
      '海禁依旧，走私猖獗',
      '沿海百姓失去生计',
      '国库继续依赖加派田赋',
    ],
    expectedBenefits: '岁入100-200万两/年',
  },
  {
    id: 'land-survey',
    name: '清查隐田',
    category: '财政',
    possibleYears: '崇祯八年-十年（1635-1637）',
    proposers: ['毕自严', '倪元璐'],
    totalDuration: 4,
    summary: '清查士绅豪强隐匿的土地，重新登记造册，按亩征税。',
    steps: [
      {
        name: '培训测量人员',
        description: '引入西方测量技术，培训专业清丈官员。',
        costGold: 50000,
        costManpower: 200,
        duration: 1,
        successRate: 70,
        boostConditions: ['传教士技术支持', '建立培训体系'],
        requiredRoles: ['户部官员', '传教士'],
      },
      {
        name: '试点清丈',
        description: '先在江南、福建等土地隐匿严重地区试点。',
        costGold: 100000,
        costManpower: 500,
        duration: 1.5,
        successRate: 50,
        boostConditions: ['地方官员配合', '建立举报奖励'],
        requiredRoles: ['巡抚', '御史'],
      },
      {
        name: '编制鱼鳞图册',
        description: '登记土地所有者、面积、质量，编制新册。',
        costGold: 150000,
        costManpower: 1000,
        duration: 1.5,
        successRate: 40,
        boostConditions: ['暂不触动宗室土地', '给予主动申报者宽大'],
        requiredRoles: ['清丈官员', '书吏'],
      },
    ],
    prerequisites: [
      '朝廷有铁腕决心',
      '有得力官员主持',
      '有准确的测量方法',
    ],
    challenges: [
      '士绅豪强强烈反对',
      '地方官多出身士绅，执行阻力大',
      '清丈流于形式',
    ],
    failureConditions: [
      '士绅集体抗税',
      '发生民变或骚乱',
      '主持官员被弹劾',
    ],
    failureConsequences: [
      '隐田依旧',
      '士绅与朝廷离心',
      '田赋负担继续压在自耕农身上',
    ],
    expectedBenefits: '新增田赋100-300万两/年',
  },
  {
    id: 'salt-reform',
    name: '整顿盐政',
    category: '财政',
    possibleYears: '崇祯五年-八年（1632-1635）',
    proposers: ['毕自严'],
    totalDuration: 3,
    summary: '整顿盐业专卖制度，打击私盐，增加盐税收入。',
    steps: [
      {
        name: '清理盐引',
        description: '清理盐业经营许可证，裁撤冗余盐官。',
        costGold: 50000,
        costManpower: 100,
        duration: 1,
        successRate: 60,
        boostConditions: ['朝廷支持', '打击盐商垄断'],
        requiredRoles: ['两淮盐运使', '户部侍郎'],
      },
      {
        name: '加强盐场管理',
        description: '加强盐场管理，防止盐课流失。',
        costGold: 100000,
        costManpower: 500,
        duration: 1,
        successRate: 50,
        boostConditions: ['建立巡查制度', '严惩贪腐'],
        requiredRoles: ['盐场官员'],
      },
      {
        name: '打击私盐',
        description: '增设盐务巡兵，严厉打击私盐贩运。',
        costGold: 150000,
        costManpower: 2000,
        duration: 1,
        successRate: 40,
        boostConditions: ['利用保甲制度', '降低官盐价格'],
        requiredRoles: ['巡兵', '地方官'],
      },
    ],
    prerequisites: [
      '有得力盐务官员',
      '有足够巡兵打击私盐',
      '朝廷支持',
    ],
    challenges: [
      '盐商与官员勾结深',
      '私盐网络庞大',
      '盐务腐败',
    ],
    failureConditions: [
      '盐商向朝廷施压',
      '巡兵被收买',
      '盐务官员贪腐',
    ],
    failureConsequences: [
      '盐税依旧流失',
      '盐商继续垄断暴利',
      '百姓食盐价格居高不下',
    ],
    expectedBenefits: '新增盐税50-100万两/年',
  },
  {
    id: 'reduce-clan',
    name: '裁减宗室俸禄',
    category: '财政',
    possibleYears: '崇祯元年-三年（1628-1630）',
    proposers: ['崇祯帝', '韩爌'],
    totalDuration: 2,
    summary: '裁减宗室（朱姓皇族）的俸禄，减轻财政负担。',
    steps: [
      {
        name: '削减远支俸禄',
        description: '先削减远支宗室俸禄，暂不触动近支。',
        costGold: 0,
        costManpower: 0,
        duration: 1,
        successRate: 50,
        boostConditions: ['争取士大夫支持', '给予过渡期'],
        requiredRoles: ['宗人府令', '户部尚书'],
      },
      {
        name: '允许自谋生计',
        description: '允许宗室子弟参加科举、经商。',
        costGold: 0,
        costManpower: 0,
        duration: 0.5,
        successRate: 40,
        boostConditions: ['设立过渡期', '给予补偿金'],
        requiredRoles: ['礼部官员'],
      },
      {
        name: '逐步推广',
        description: '在试点成功基础上，逐步推广至全国宗室。',
        costGold: 100000,
        costManpower: 100,
        duration: 0.5,
        successRate: 30,
        boostConditions: ['军事力量镇压叛乱', '安置底层宗室'],
        requiredRoles: ['内阁首辅', '各省巡抚'],
      },
    ],
    prerequisites: [
      '朝廷有极强决心',
      '有足够军事力量镇压叛乱',
      '有替代方案安置底层宗室',
    ],
    challenges: [
      '宗室是皇族，朝廷难以强硬',
      '宗室可能煽动叛乱',
      '礼部以祖制相抗',
    ],
    failureConditions: [
      '宗室亲王集体抗旨',
      '发生宗室叛乱',
      '礼部弹劾主持官员',
    ],
    failureConsequences: [
      '宗室与朝廷决裂',
      '俸禄依旧，财政负担不减',
      '朝廷威信受损',
    ],
    expectedBenefits: '节省200-500万两/年',
  },
  {
    id: 'verify-troops',
    name: '实兵实饷',
    category: '军事',
    possibleYears: '崇祯七年-十年（1634-1637）',
    proposers: ['杨嗣昌', '熊文灿'],
    totalDuration: 3,
    summary: '清查军队虚额（吃空饷），按实际兵数发放军饷。',
    steps: [
      {
        name: '精锐试点',
        description: '先在京营、关宁铁骑等精锐部队试点。',
        costGold: 50000,
        costManpower: 100,
        duration: 1,
        successRate: 60,
        boostConditions: ['朝廷直接派员监督', '建立奖惩机制'],
        requiredRoles: ['兵部尚书', '户部侍郎'],
      },
      {
        name: '建立核查制度',
        description: '建立三册核对制度（名册、饷凭、仓单）。',
        costGold: 80000,
        costManpower: 200,
        duration: 1,
        successRate: 50,
        boostConditions: ['粮饷直接发放', '绕过将领'],
        requiredRoles: ['核查官员', '御史'],
      },
      {
        name: '全国推广',
        description: '在试点成功基础上，推广至全国军队。',
        costGold: 150000,
        costManpower: 500,
        duration: 1,
        successRate: 40,
        boostConditions: ['给予将领合法津贴', '保留灵活军费'],
        requiredRoles: ['各省巡抚', '将领'],
      },
    ],
    prerequisites: [
      '政治稳定，朝廷有足够权威',
      '军事形势可控，无紧迫大战',
      '有替代资金来源',
      '有可信文官主持',
      '至少2-3年稳定期',
    ],
    challenges: [
      '吃空饷已是潜规则，利益根深蒂固',
      '裁撤虚额易引发兵变或投敌',
      '朝廷缺乏可信监督体系',
      '财政危机下往往选择加派而非清查',
    ],
    failureConditions: [
      '将领集体抵制，以兵变相威胁',
      '核查官员被收买或威胁',
      '裁撤后实兵饷银仍未增加',
    ],
    failureConsequences: [
      '虚额依旧，军饷继续流失',
      '将领与朝廷离心',
      '实兵士气低落',
    ],
    expectedBenefits: '节省100-300万两/年',
  },
  {
    id: 'firearms',
    name: '火器精进',
    category: '军事',
    possibleYears: '崇祯二年-五年（1629-1632）',
    proposers: ['徐光启', '孙元化'],
    totalDuration: 4,
    summary: '引进西方火器技术，改良明军火器，提升战斗力。',
    steps: [
      {
        name: '设立炮局',
        description: '在登莱设立炮局，仿制红夷大炮。',
        costGold: 200000,
        costManpower: 500,
        duration: 1,
        successRate: 70,
        boostConditions: ['传教士技术支持', '安全环境'],
        requiredRoles: ['登莱巡抚', '传教士'],
      },
      {
        name: '训练火器部队',
        description: '培训专业火器操作人员，制定火器战术。',
        costGold: 300000,
        costManpower: 5000,
        duration: 1.5,
        successRate: 60,
        boostConditions: ['建立火器编制', '编写使用手册'],
        requiredRoles: ['火器将领', '教官'],
      },
      {
        name: '分发边军',
        description: '向辽东边军分发新式火器，集中使用。',
        costGold: 500000,
        costManpower: 10000,
        duration: 1.5,
        successRate: 50,
        boostConditions: ['边军将领配合', '火药供应稳定'],
        requiredRoles: ['兵部侍郎', '边将'],
      },
    ],
    prerequisites: [
      '安全环境：生产基地远离战线',
      '人事稳定：主持官员在位',
      '财政持续：5-10年持续投入',
      '技术保密：防止技术落入敌手',
      '军事配合：边军愿意接受新式火器',
      '供应链保障：铁料、火药稳定供应',
      '至少3-5年和平期',
    ],
    challenges: [
      '火器研发是长期投入，朝廷往往急于求成',
      '技术人才稀缺，核心团队难以维持',
      '保守派随时可能弹劾主持官员',
      '火器部队训练周期长，战事紧迫时仓促上阵',
      '技术泄露风险极高',
    ],
    failureConditions: [
      '登莱炮营发生兵变（如吴桥兵变）',
      '火器技术落入敌手',
      '朝廷因短期无效果而中断投入',
    ],
    failureConsequences: [
      '火器技术流失',
      '投入银两打水漂',
      '后金获得火器，明军优势丧失',
    ],
    expectedBenefits: '明军火器射程、精度大幅提升',
  },
  {
    id: 'exam-reform',
    name: '实学科考',
    category: '人事',
    possibleYears: '崇祯十年-十二年（1637-1639）',
    proposers: ['徐光启门生', '方以智'],
    totalDuration: 8,
    summary: '在科举考试中增加实学内容（如算学、农政、兵法、水利），而非只考八股文。',
    steps: [
      {
        name: '增设实学科目',
        description: '在乡试、会试中增设算学、地理、兵法等实学科目。',
        costGold: 50000,
        costManpower: 100,
        duration: 2,
        successRate: 50,
        boostConditions: ['保留八股但降低比重', '设立特科'],
        requiredRoles: ['礼部尚书', '内阁首辅'],
      },
      {
        name: '建立新式学堂',
        description: '建立历局、钦天监培训班等新式学堂。',
        costGold: 100000,
        costManpower: 200,
        duration: 3,
        successRate: 40,
        boostConditions: ['邀请传教士讲授', '翻译西方科技书籍'],
        requiredRoles: ['国子监祭酒', '传教士'],
      },
      {
        name: '推广实学教育',
        description: '在地方试点实学教育，积累经验后推广。',
        costGold: 150000,
        costManpower: 500,
        duration: 3,
        successRate: 30,
        boostConditions: ['给予实学人才同等待遇', '不立即废除八股'],
        requiredRoles: ['各省学政', '地方官'],
      },
    ],
    prerequisites: [
      '朝廷有决心',
      '有实学背景的考官',
      '有配套任用制度',
    ],
    challenges: [
      '士子习惯八股，转型困难',
      '保守派反对（认为背离祖制）',
      '实学人才出路有限',
    ],
    failureConditions: [
      '保守派强力阻挠',
      '士子集体抵制',
      '实学人才无合适衙门安置',
    ],
    failureConsequences: [
      '科举依旧考八股',
      '官员继续缺乏实务能力',
      '改革流于形式',
    ],
    expectedBenefits: '培养一批有实务能力的官员',
  },
  {
    id: 'agriculture',
    name: '分地试种',
    category: '农业',
    possibleYears: '崇祯五年-八年（1632-1635）',
    proposers: ['徐光启', '徐光启门生'],
    totalDuration: 4,
    summary: '在不同土壤、气候条件下试种甘薯、旱稻、玉米等新作物，推广种植技术。',
    steps: [
      {
        name: '引进新作物',
        description: '引进美洲作物（玉米、甘薯、马铃薯）。',
        costGold: 50000,
        costManpower: 100,
        duration: 1,
        successRate: 80,
        boostConditions: ['徐光启技术指导', '建立试验田'],
        requiredRoles: ['户部侍郎', '农技人员'],
      },
      {
        name: '设立样田',
        description: '在京畿、河南、陕西等地设立样田试种。',
        costGold: 100000,
        costManpower: 200,
        duration: 1.5,
        successRate: 70,
        boostConditions: ['记录生长数据', '对比产量'],
        requiredRoles: ['地方官', '农民'],
      },
      {
        name: '推广种植',
        description: '先在官田试种成功后，推广至民田。',
        costGold: 150000,
        costManpower: 500,
        duration: 1.5,
        successRate: 60,
        boostConditions: ['给予税收优惠', '编写技术手册'],
        requiredRoles: ['各省巡抚', '农技人员'],
      },
    ],
    prerequisites: [
      '有农技专家主持',
      '有样田作为示范',
      '朝廷持续投入',
    ],
    challenges: [
      '农民保守，不愿尝试新作物',
      '徐光启去世后无人主持',
      '饥荒紧急时中断长期投入',
    ],
    failureConditions: [
      '核心农技专家去世',
      '农民拒绝尝试',
      '朝廷中断投入',
    ],
    failureConsequences: [
      '新作物推广失败',
      '饥荒依旧',
      '投入银两浪费',
    ],
    expectedBenefits: '提高粮食产量，缓解饥荒',
  },
  {
    id: 'tech-institute',
    name: '开设器院',
    category: '工业',
    possibleYears: '崇祯八年-十一年（1635-1638）',
    proposers: ['徐光启门生', '孙元化'],
    totalDuration: 8,
    summary: '设立专门机构，研究农具、水利、火器等技术，记录试验过程，推广成功技术。',
    steps: [
      {
        name: '设立总院',
        description: '在北京设立器院总院，招募工匠、技术人员。',
        costGold: 200000,
        costManpower: 200,
        duration: 2,
        successRate: 60,
        boostConditions: ['给予技术人员官职', '与传教士合作'],
        requiredRoles: ['工部侍郎', '传教士'],
      },
      {
        name: '设立分院',
        description: '在地方设立分院（如福建火器院、江南机械院）。',
        costGold: 300000,
        costManpower: 500,
        duration: 3,
        successRate: 50,
        boostConditions: ['培养本土技术人才', '翻译西方科技书籍'],
        requiredRoles: ['地方官', '技术人员'],
      },
      {
        name: '推广技术',
        description: '刊印图册，公开基础工艺，推广成功技术。',
        costGold: 200000,
        costManpower: 300,
        duration: 3,
        successRate: 40,
        boostConditions: ['建立技术推广机制', '持续投入'],
        requiredRoles: ['器院官员', '工匠'],
      },
    ],
    prerequisites: [
      '朝廷有决心',
      '有得力官员主持',
      '有持续投入',
    ],
    challenges: [
      '保守派反对（认为奇技淫巧）',
      '技术保密困难',
      '核心技术人员去世或被调离',
    ],
    failureConditions: [
      '核心技术人员去世',
      '保守派弹劾主持官员',
      '朝廷财政困难中断经费',
    ],
    failureConsequences: [
      '器院流于形式',
      '技术未进步',
      '投入银两浪费',
    ],
    expectedBenefits: '技术进步，军器、农具质量提升',
  },
  {
    id: 'audit-system',
    name: '交叉验账',
    category: '监察',
    possibleYears: '崇祯五年-八年（1632-1635）',
    proposers: ['毕自严'],
    totalDuration: 3,
    summary: '建立交叉验账制度，不同衙门相互核对账目，防止贪腐。',
    steps: [
      {
        name: '建立核对制度',
        description: '建立多级账目核对制度，引入复式记账法。',
        costGold: 50000,
        costManpower: 100,
        duration: 1,
        successRate: 50,
        boostConditions: ['从西方学习复式记账', '培训审计人员'],
        requiredRoles: ['户部侍郎', '都察院御史'],
      },
      {
        name: '设立审计机构',
        description: '设立独立审计机构，实行交叉审计。',
        costGold: 100000,
        costManpower: 200,
        duration: 1,
        successRate: 40,
        boostConditions: ['给予审计人员独立地位', '建立举报机制'],
        requiredRoles: ['审计官员', '御史'],
      },
      {
        name: '推广至地方',
        description: '先在户部、兵部等关键部门试点，逐步推广至地方。',
        costGold: 150000,
        costManpower: 500,
        duration: 1,
        successRate: 30,
        boostConditions: ['对贪污者严厉惩处', '建立标准化账目格式'],
        requiredRoles: ['各省巡按御史', '地方官'],
      },
    ],
    prerequisites: [
      '朝廷有决心',
      '有清廉御史主持',
      '有惩罚制度',
    ],
    challenges: [
      '官员相互包庇',
      '御史可能被收买',
      '地方执行层面崩溃',
    ],
    failureConditions: [
      '主持官员去职',
      '地方官集体抵制',
      '御史被收买',
    ],
    failureConsequences: [
      '账目依旧混乱',
      '贪腐不止',
      '朝廷财政继续流失',
    ],
    expectedBenefits: '减少贪腐，提高财政透明度',
  },
]

/** 改革类别元数据 */
export const REFORM_CATEGORY_META = {
  财政: { name: '财政', icon: '💰', color: '#d4a574' },
  军事: { name: '军事', icon: '⚔️', color: '#8b4513' },
  人事: { name: '人事', icon: '👥', color: '#6b8e23' },
  农业: { name: '农业', icon: '🌾', color: '#228b22' },
  工业: { name: '工业', icon: '🔧', color: '#708090' },
  监察: { name: '监察', icon: '📋', color: '#4682b4' },
} as const

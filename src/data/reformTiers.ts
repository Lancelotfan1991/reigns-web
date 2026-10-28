import type { Reform } from './reformBrowse'

/** 改革按政治威望分阶，不是按年份分阶。 */
export type ReformTierKey = 'basic' | 'middle' | 'advanced' | 'legendary'

export interface ReformTierMeta {
  key: ReformTierKey
  name: string
  prestige: number
  color: string
  description: string
}

export const REFORM_TIERS: ReformTierMeta[] = [
  {
    key: 'basic',
    name: '初阶',
    prestige: 20,
    color: '#ab8430',
    description: '日常政务与恢复性改革。阻力较小，先让国家重新运转。',
  },
  {
    key: 'middle',
    name: '中阶',
    prestige: 40,
    color: '#3a5f83',
    description: '触动商人、地方和财政结构的改革。需要皇帝已经证明自己能压住场面。',
  },
  {
    key: 'advanced',
    name: '高阶',
    prestige: 80,
    color: '#a8322a',
    description: '动摇士绅、宗室与科举根基的改革。没有足够威望，连提出都会引发政潮。',
  },
  {
    key: 'legendary',
    name: '改制',
    prestige: 100,
    color: '#6b2f26',
    description: '不再是一项政策，而是决定明朝以后谁说了算。只能走一条国体路线。',
  },
]

export interface ReformAgendaItem {
  id: string
  name: string
  tier: ReformTierKey
  prestige: number
  category: Reform['category']
  summary: string
  effect: string
  prerequisite: string
  /** 卡片展开时显示的三步；已有详细卡组时可由卡组自动取。 */
  steps?: string[]
  /** 卡片展开时显示的两个挑战。 */
  challenges?: string[]
  /** 主要风险；也用于卡片底部的提示。 */
  risk?: string
  /** 已有详细卡组的改革；没有则为待展开的新方案。 */
  reformId?: string
}

/**
 * 改革总议程。
 *
 * 已有详细卡组的改革只在这里挂 id 和分级，不再复制一份卡牌数据；
 * 新方案先写清目标、效果与前置，后续再补卡组。
 */
export const REFORM_AGENDA: ReformAgendaItem[] = [
  // 初阶：先恢复国家的基本运转
  {
    id: 'postal-cuts',
    name: '裁撤驿站',
    tier: 'basic',
    prestige: 20,
    category: '财政',
    summary: '裁并冗站、裁减驿卒，省下驿银与人力。',
    effect: '短期节省财政；若安置不当，驿卒可能流入流寇。',
    prerequisite: '先备好驿卒转业与安置钱粮',
    reformId: 'postal-cuts',
  },
  {
    id: 'calendar-bureau',
    name: '历局修历',
    tier: 'basic',
    prestige: 20,
    category: '工业',
    summary: '开局修历，引入西法，恢复朝廷的颁朔与天文能力。',
    effect: '提高朝廷技术声望，为火器、测量和农时打底。',
    prerequisite: '徐光启、汤若望等人在朝',
    reformId: 'calendar-bureau',
  },
  {
    id: 'agriculture',
    name: '分地试种',
    tier: 'basic',
    prestige: 20,
    category: '农业',
    summary: '在灾区和边镇试行分地、代种与高产作物。',
    effect: '提高粮食产出，安置流民；短期要花国力。',
    prerequisite: '有可试点的州县与农官',
    reformId: 'agriculture',
  },
  {
    id: 'abolish-artisan-registry',
    name: '废除匠籍',
    tier: 'basic',
    prestige: 20,
    category: '工业',
    summary: '取消匠户世代承役的旧籍，改为雇募与轮班。',
    effect: '释放工匠流动，提升手工业与军器生产；短期损失部分无偿匠役。',
    prerequisite: '先建立工匠雇募与工价制度',
    steps: ['清理匠籍', '改雇募制', '定工价与考核'],
    challenges: ['内廷反对：A. 先裁内廷匠役 / B. 保留旧役', '工匠流失：A. 给工价与户籍 / B. 强制留役'],
    risk: '短期匠役成本上升，工匠可能流向民间或海外。',
  },
  {
    id: 'dismiss-palace-staff',
    name: '清退宫人',
    tier: 'basic',
    prestige: 20,
    category: '财政',
    summary: '裁减内廷冗员、清退无职宫人，公开内廷用度。',
    effect: '节省宫廷开支，向天下示以节俭；会得罪内廷。',
    prerequisite: '皇帝愿意先动自己的内廷',
    steps: ['核内廷员额', '裁撤冗员', '安置与公开账目'],
    challenges: ['宦官反扑：A. 只裁冗员 / B. 连司礼监一起裁', '宫人失业：A. 发遣散银 / B. 直接逐出'],
    risk: '内廷消极抵制，宫中消息外泄，皇帝身边无人可用。',
  },
  {
    id: 'road-water',
    name: '修路兴水',
    tier: 'basic',
    prestige: 20,
    category: '农业',
    summary: '修驿道、疏河道、兴修水利，以工代赈。',
    effect: '降低粮运成本，吸收流民，提升国力恢复。',
    prerequisite: '有可调度的粮银与地方配合',
    steps: ['勘测规划', '以工代赈', '验收与维护'],
    challenges: ['工程贪腐：A. 严查承办官 / B. 睁一只眼闭一只眼', '征发民夫：A. 给工钱 / B. 无偿征役'],
    risk: '工期拖延、贪腐和征发民夫，都会把好事变成民怨。',
  },

  // 中阶：动财政、商业与军制
  {
    id: 'open-maritime',
    name: '开海禁',
    tier: 'middle',
    prestige: 40,
    category: '财政',
    summary: '开放海禁，设海关，征海税，允许民间商船出海。',
    effect: '开辟海税与商路；会触动沿海走私集团和保守派。',
    prerequisite: '有可信的水师与海关官员',
    reformId: 'open-maritime',
  },
  {
    id: 'salt-reform',
    name: '整顿盐政',
    tier: 'middle',
    prestige: 40,
    category: '财政',
    summary: '清理盐引壅积，整顿盐商与盐运司，增加盐税。',
    effect: '增加财政收入；会得罪盐商和盐官。',
    prerequisite: '先掌握盐引与盐运账目',
    reformId: 'salt-reform',
  },
  {
    id: 'verify-troops',
    name: '实兵实饷',
    tier: 'middle',
    prestige: 40,
    category: '军事',
    summary: '核实兵籍、裁汰空饷，把军饷发到真正在营的士兵手里。',
    effect: '提高军心与战力；会得罪吃空饷的将领。',
    prerequisite: '有可靠的兵部与巡按',
    reformId: 'verify-troops',
  },
  {
    id: 'firearms',
    name: '火器精进',
    tier: 'middle',
    prestige: 40,
    category: '军事',
    summary: '设火器局，仿制红夷炮，训练炮队与工兵。',
    effect: '提高守城与攻坚能力；耗费国力，技术要求高。',
    prerequisite: '徐光启、汤若望或澳门炮匠参与',
    reformId: 'firearms',
  },
  {
    id: 'audit-system',
    name: '交叉验账',
    tier: 'middle',
    prestige: 40,
    category: '监察',
    summary: '户部、兵部、都察院交叉验账，堵住截留与冒报。',
    effect: '提高财政效率，减少贪墨；会得罪整个中间层。',
    prerequisite: '皇帝愿意让言官查内廷和部院',
    reformId: 'audit-system',
  },
  {
    id: 'merchant-status',
    name: '改善商人地位',
    tier: 'middle',
    prestige: 40,
    category: '财政',
    summary: '允许商人子弟应试、减轻商税歧视，承认商人的社会地位。',
    effect: '促进商品流通与商税；会触动士绅的身份秩序。',
    prerequisite: '先有商税与商业保护制度',
    steps: ['商籍登记', '商税则例', '商人子弟应试'],
    challenges: ['士绅反对：A. 只给杂途出身 / B. 开正式科举', '商人观望：A. 先减商税 / B. 强制捐款'],
    risk: '士绅抵制、商人仍不信任，政策容易变成新的摊派。',
  },
  {
    id: 'commodity-economy',
    name: '鼓励商品经济',
    tier: 'middle',
    prestige: 40,
    category: '财政',
    summary: '减少关卡、统一度量、保护长途贩运，鼓励市镇手工业。',
    effect: '扩大税基，增加就业；短期会冲击官营与地方垄断。',
    prerequisite: '有统一的商税与路引制度',
    steps: ['裁并关卡', '统一度量', '保护商路'],
    challenges: ['地方截留商税：A. 收归中央 / B. 地方分成', '盗匪劫商：A. 派兵清剿 / B. 商团自保'],
    risk: '地方失去灰色收入，可能阳奉阴违甚至煽动商民。',
  },
  {
    id: 'land-survey',
    name: '清查隐田',
    tier: 'middle',
    prestige: 60,
    category: '财政',
    summary: '清丈士绅隐田，重新登记鱼鳞图册，按亩征赋。',
    effect: '大幅增加长期税基；会引发士绅集体抵抗。',
    prerequisite: '皇帝已有足够的政治威望与地方支持',
    reformId: 'land-survey',
  },
  {
    id: 'tech-institute',
    name: '开设器院',
    tier: 'middle',
    prestige: 60,
    category: '工业',
    summary: '设工学院、器院，培养工匠与技术官员，译介西学。',
    effect: '长期提升军工、水利、测量与农业技术；短期投入大。',
    prerequisite: '有稳定的技术官僚与经费',
    reformId: 'tech-institute',
  },
  {
    id: 'paper-money',
    name: '推行纸币',
    tier: 'middle',
    prestige: 60,
    category: '财政',
    summary: '以金、银或盐税为准备金，发行可兑换纸币，减少运银成本。',
    effect: '极大提高财政调度能力；若超发或失信用，会引发恶性通胀。',
    prerequisite: '先建立准备金、审计与兑换制度',
    steps: ['建准备金', '小范围发行', '全国兑换'],
    challenges: ['超发诱惑：A. 严守准备金 / B. 超发补军费', '伪钞：A. 严刑峻法 / B. 设兑换所'],
    risk: '纸币一旦失信，民心与国力会一起崩，且很难挽回。',
  },

  // 高阶：动士绅、宗室与科举根基
  {
    id: 'reduce-clan',
    name: '裁减宗室俸禄',
    tier: 'advanced',
    prestige: 80,
    category: '财政',
    summary: '削减宗室禄米，允许宗室自谋职业，把宗禄从财政里拆出来。',
    effect: '大幅减轻财政负担；会遭到宗室与保守派强烈反对。',
    prerequisite: '皇帝已压住宗室与礼部',
    reformId: 'reduce-clan',
  },
  {
    id: 'exam-reform',
    name: '实学科考',
    tier: 'advanced',
    prestige: 80,
    category: '人事',
    summary: '改革科举内容，加入实务、算学、舆地、水利与兵事。',
    effect: '长期改善官员能力；会触动整个士大夫晋升秩序。',
    prerequisite: '有稳定的取士替代方案与皇帝强力支持',
    reformId: 'exam-reform',
  },
  {
    id: 'abolish-eight-legged',
    name: '废除八股',
    tier: 'advanced',
    prestige: 80,
    category: '人事',
    summary: '废八股取士，改考经义、策论与实务，重定人才标准。',
    effect: '打破士绅对科举的垄断，长期提升行政能力；短期会引发士林大反弹。',
    prerequisite: '先建立新考试标准与地方学校',
    steps: ['废制义', '新考试', '新学推广'],
    challenges: ['士林大反弹：A. 皇帝亲自主持新考 / B. 保留八股、另设别科', '地方学校抵制：A. 裁撤旧学官 / B. 新旧并行'],
    risk: '士林长期敌视，地方教育失控，新考可能变成新的形式主义。',
  },
  {
    id: 'clan-employment',
    name: '允许宗室求职',
    tier: 'advanced',
    prestige: 80,
    category: '人事',
    summary: '允许宗室参加科举、从军、经商与做官，取消“只领禄、不做事”的旧制。',
    effect: '减少宗禄，释放宗室人才；会引发宗室内部与礼法争议。',
    prerequisite: '先改宗室禄制与宗人府',
    steps: ['开宗室科举', '宗室从军', '宗室经商'],
    challenges: ['宗人府反对：A. 改宗人府 / B. 另设新署', '宗室内部争夺：A. 按才能授职 / B. 按房支分配'],
    risk: '宗室内部争权，礼法之争演变成宗室叛乱或政潮。',
  },

  // 改制：威望 100，只决定国体路线
  {
    id: 'chongzhen-covenant',
    name: '崇祯约法',
    tier: 'legendary',
    prestige: 100,
    category: '人事',
    summary: '公开限制皇帝随意杀人、加派和派太监监军的权力，设预算会议。',
    effect: '把皇帝的个人信用变成制度承诺；解锁改制路线。',
    prerequisite: '威望 100；至少两位核心大臣支持',
    steps: ['公开自限', '设预算会议', '君臣共同署名'],
    challenges: ['保守派骂“自弃乾纲”：A. 公开辩论 / B. 删减条款', '皇帝日后反悔：A. 立誓告庙 / B. 保留最终否决'],
    risk: '一旦皇帝反悔，政治威望会一次性崩塌。',
  },
  {
    id: 'cabinet-monarchy',
    name: '虚君内阁',
    tier: 'legendary',
    prestige: 100,
    category: '人事',
    summary: '内阁对士绅议会负责，皇帝保留否决权、外交权和最终仲裁权。',
    effect: '政策连续、税收稳定；皇权被制度性限制。',
    prerequisite: '完成崇祯约法；有议会与核心班底',
    steps: ['组建议会', '内阁负责', '军队归国家'],
    challenges: ['皇权派反扑：A. 保留否决权 / B. 彻底虚君', '议会失控：A. 解散议会 / B. 接受问责'],
    risk: '皇帝可能变成傀儡；保守派可能发动政变。',
  },
  {
    id: 'equal-field-tax',
    name: '均田清税',
    tier: 'legendary',
    prestige: 100,
    category: '财政',
    summary: '全国清丈土地，按田亩与财产征税，取消士绅宗室的大部分优免。',
    effect: '长期税基大幅扩大，财政从加派转向结构税。',
    prerequisite: '完成清查隐田、鱼鳞图册与一省试点',
    steps: ['全国清丈', '改税制', '推广到士绅宗室'],
    challenges: ['士绅集体抗税：A. 铁腕推行 / B. 保留部分优免', '地方官造假：A. 派人复测 / B. 默认结果'],
    risk: '士绅可能煽动民变、闭城抗税，甚至拥立宗室。',
  },
  {
    id: 'new-army',
    name: '新军国',
    tier: 'legendary',
    prestige: 100,
    category: '军事',
    summary: '废卫所，建常备军；中央发饷，设军官学校与参谋制度。',
    effect: '军心、战力、指挥效率大幅提升；军费暴涨。',
    prerequisite: '完成实兵实饷、火器精进；卢象升或孙传庭支持',
    steps: ['废卫所', '编练新军', '设军官学校'],
    challenges: ['旧军头叛乱：A. 先补后裁 / B. 强行裁撤', '军费失控：A. 加税 / B. 授田养军'],
    risk: '新军可能变成新的军阀；中央财政撑不住就会反噬。',
  },
  {
    id: 'national-bank',
    name: '国家银行',
    tier: 'legendary',
    prestige: 100,
    category: '财政',
    summary: '统一银钱、纸币、汇兑；以海关税和盐税为准备金，发行国债。',
    effect: '获得长期低息融资能力，财政调度从实物转向金融。',
    prerequisite: '完成推行纸币、交叉验账、开海禁',
    steps: ['建准备金', '发国债', '设兑换网'],
    challenges: ['超发诱惑：A. 严守准备金 / B. 超发补军费', '商人挤兑：A. 限制兑换 / B. 国家兜底'],
    risk: '金融危机一旦爆发，会比财政危机更快摧毁民心。',
  },
  {
    id: 'sea-power',
    name: '海权国家',
    tier: 'legendary',
    prestige: 100,
    category: '财政',
    summary: '海关税成为财政主轴，海军保护商路，经营海外据点。',
    effect: '海贸与海关税成为国家财政支柱；沿海集团崛起。',
    prerequisite: '完成开海禁的设海关、发船引、建水师三阶段',
    steps: ['海关制度化', '建远洋水师', '设海外据点'],
    challenges: ['内陆士绅反对：A. 转移支付内陆 / B. 强行推进', '沿海集团坐大：A. 收编 / B. 分权'],
    risk: '南北裂痕加深，海防与陆防争夺资源。',
  },
  {
    id: 'new-learning',
    name: '新学取士',
    tier: 'legendary',
    prestige: 100,
    category: '人事',
    summary: '中央大学堂与地方实学并行，技术官、军需官、外交官职业化。',
    effect: '长期人才结构改变，技术官僚进入中枢。',
    prerequisite: '完成实学科考与废除八股',
    steps: ['设中央大学堂', '地方实学', '技术官职业化'],
    challenges: ['士林长期敌视：A. 保留经学 / B. 彻底实学', '地方教育失控：A. 中央统管 / B. 地方自治'],
    risk: '文化断裂与士林长期不合作，新学可能变成新的门阀。',
  },
]

export const REFORM_TIER_BY_ID: Record<string, ReformTierMeta> = Object.fromEntries(
  REFORM_AGENDA.map((item) => [
    item.id,
    REFORM_TIERS.find((tier) => tier.key === item.tier) ?? REFORM_TIERS[0],
  ]),
)

export const REFORM_PRESTIGE_BY_ID: Record<string, number> = Object.fromEntries(
  REFORM_AGENDA.map((item) => [item.id, item.prestige]),
)

export function tierForReform(reformId: string): ReformTierMeta {
  return REFORM_TIER_BY_ID[reformId] ?? REFORM_TIERS[0]
}

/** 某项改革自己的威望门槛；同一阶内可以有更细的差别。 */
export function prestigeForReform(reformId: string): number {
  return REFORM_PRESTIGE_BY_ID[reformId] ?? tierForReform(reformId).prestige
}

export function agendaForTier(tier: ReformTierKey): ReformAgendaItem[] {
  return REFORM_AGENDA.filter((item) => item.tier === tier)
}

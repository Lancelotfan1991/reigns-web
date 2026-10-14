/** 四项治平之具：君威 / 法度 / 军心 / 国库（过高过低皆足致亡） */
export type AxisKey = 'court' | 'law' | 'army' | 'gold'

/** 全部国势指标：四象之上另有民心，作为单向的「国本」水位，只论倾覆不论过盈 */
export type ResourceKey = AxisKey | 'people'

/** 一次选择对指标的影响 */
export type Effects = Partial<Record<ResourceKey, number>>

/** 抉择方向：左印 / 右印 */
export enum Side {
  Left = '左',
  Right = '右',
}

/** 本局某张卡上做出的决策 */
export interface Decision {
  eventId: string
  side: Side
  /** 做出决策时的崇祯纪年（0=天启七年） */
  year: number
}

/** 终章分支键：终章落子后按哪一路结算结局 */
export enum FinaleBranch {
  South = '南渡',
  Meishan = '煤山',
  Battle = '决战',
  Hold = '固守',
  Reform = '革新',
  ReformRetreat = '革新退让',
  ReformHold = '革新固守',
  ReformBattle = '革新决战',
  Coup = '宫门之变',
}

/** 剧情旗标：记录某一抉择或事变已经发生，供后续卡牌条件、人物史轨与终章判定取用 */
export enum Flag {
  两京存账 = '两京存账',
  传庭释出 = '传庭释出',
  传庭练兵 = '传庭练兵',
  旧欠未偿 = '旧欠未偿',
  补发旧欠 = '补发旧欠',
  原额催解 = '原额催解',
  裁支守防 = '裁支守防',
  积弊复发 = '积弊复发',
  核减灾区 = '核减灾区',
  内侍欠情 = '内侍欠情',
  大臣刑狱 = '大臣刑狱',
  迎祥归籍 = '迎祥归籍',
  学徒脱籍 = '学徒脱籍',
  工匠立契 = '工匠立契',
  交叉验账 = '交叉验账',
  收支公开 = '收支公开',
  御令照章 = '御令照章',
  分区设医 = '分区设医',
  饷册另核 = '饷册另核',
  隔离补粮 = '隔离补粮',
  预算质询 = '预算质询',
  借券有期 = '借券有期',
  海税入公 = '海税入公',
  登莱保炮 = '登莱保炮',
  分站轮仓 = '分站轮仓',
  实学科考 = '实学科考',
  轮换粮站 = '轮换粮站',
  炼焦专款 = '炼焦专款',
  粮银两便 = '粮银两便',
  饷归公汇 = '饷归公汇',
  据实报病 = '据实报病',
  考成不饰 = '考成不饰',
  开设器院 = '开设器院',
  留维修金 = '留维修金',
  工艺刊行 = '工艺刊行',
  民坊外销 = '民坊外销',
  颁行尺秤 = '颁行尺秤',
  实兵实饷 = '实兵实饷',
  节余复业 = '节余复业',
  蒸汽试造 = '蒸汽试造',
  工赈常年 = '工赈常年',
  试造容错 = '试造容错',
  修险预疏 = '修险预疏',
  工学开班 = '工学开班',
  伤匠恤典 = '伤匠恤典',
  分地试种 = '分地试种',
  分户安置 = '分户安置',
  分批承运 = '分批承运',
  松锦缓守 = '松锦缓守',
  储君守章 = '储君守章',
  一体丈量 = '一体丈量',
  任期定制 = '任期定制',
  军器设局 = '军器设局',
  水功设局 = '水功设局',
  关中复业 = '关中复业',
  田械分查 = '田械分查',
  降兵入籍 = '降兵入籍',
  划营给粮 = '划营给粮',
  招抚流亡 = '招抚流亡',
  文龙下狱 = '文龙下狱',
  斩毛文龙 = '斩毛文龙',
  逆案尽列 = '逆案尽列',
  和议获准 = '和议获准',
  旧约照行 = '旧约照行',
  密议授权 = '密议授权',
  驿站得保 = '驿站得保',
  引河先迁 = '引河先迁',
  赐尚方剑 = '赐尚方剑',
  船引官给 = '船引官给',
  分段接济 = '分段接济',
  先核粮路 = '先核粮路',
  南渡留本 = '南渡留本',
  焚册责名 = '焚册责名',
  忠贤被逮 = '忠贤被逮',
  逮魏未成 = '逮魏未成',
  密换九门 = '密换九门',
  匠户获安 = '匠户获安',
  明发讨逆 = '明发讨逆',
  只诛首恶 = '只诛首恶',
  工师专载 = '工师专载',
  崇焕回辽 = '崇焕回辽',
  补粮留任 = '补粮留任',
}

/**
 * 旗标规则：用于卡牌的出现条件。
 * 单旗标表示该旗标 ≥1；对象形式可指定最小累计次数。
 */
export type FlagRule = Flag | { flag: Flag; min: number }

export interface Choice {
  /** 滑动时显示的决策印章文字 */
  label: string
  effects: Effects
  /** 本议批红：裁决后独立成页展示，不与下一问同屏 */
  response: string
  /** 标记此选择直接触发 1644 终章结算 */
  finale?: FinaleBranch
  /** 此选择写下的旗标：决定后续年份哪些分叉卡会登场 */
  sets?: Flag[]
}

export interface GameEvent {
  id: string
  /** 角色头像（emoji） */
  avatar: string
  /** 角色/事件名称 */
  name: string
  /** 事件描述 */
  text: string
  left: Choice
  right: Choice
  /** 全部满足才登场（改史分叉卡）；同槽位中条件优先于无条件的史实卡 */
  requires?: FlagRule[]
  excludes?: Flag[]
  resourceBounds?: Partial<Record<ResourceKey, { min?: number; max?: number }>>
  /** 牵涉的人物 id（单人或多人）；御卡的主人是皇帝本人，不入此表 */
  people?: string[]
}

/** 篇章时间：某年某议（编年键）；步骤自起始键逐位递进 */
export type ChapterTime = { year: number; order: number }

export interface StoryChapter {
  id: string
  name: string
  time: ChapterTime
  steps: GameEvent[][]
}

export interface ChapterProgress {
  id: string
  name: string
  step: number
  total: number
}

/** 一议对某项指标的净变化（已含岁耗与动乱） */
export interface VerdictLine {
  key: ResourceKey
  from: number
  to: number
}

/** 一议判了某人的生死：批红页据此换成生死版式 */
export interface LifeVerdict {
  charId: string
  name: string
  alias?: string
  role: string
  camp: Camp
  status: CharStatus
  /** 钤上的印文 */
  seal: string
  /** 此人此后的下落 */
  note: string
  /** 此议种下的后日结局：下落始于本议之后之年，此刻人尚在 */
  pending: boolean
  /** 不采那一侧本会留下的印 */
  other: { seal: string; status: CharStatus }
}

/** 一议的批红：属于刚裁决的那一议，独立成页，读完才见下一问 */
export interface Verdict {
  /** 所裁事件的题签 */
  cardName: string
  /** 玩家所选一侧的批红文字 */
  choiceLabel: string
  /** 所采之议的后果 */
  response: string
  /** 裁决时的纪年与议次 */
  when: string
  /** 所裁之议是某连续篇章的第几步；非篇章内为 null */
  chapter: { name: string; step: number; total: number } | null
  lines: VerdictLine[]
  /** 此议判了谁的生死；非生死之议为 null */
  life: LifeVerdict | null
  /** 此议已定国运：读完批红即入结局 */
  ended: boolean
}

/** 国运类型：即结局页的题头判词 */
export enum EndingKind {
  Doom = '国祚断送',
  Neutral = '宿命轮回',
  Glory = '续命中兴',
}

export interface Ending {
  avatar: string
  title: string
  description: string
  kind: EndingKind
  survived?: boolean
}

/** 人物状态：随史实轨迹与本局抉择改写而变 */
export enum CharStatus {
  Hidden = '尚未登场',
  Alive = '生',
  Ill = '病',
  Dead = '死',
}

/** 关系类型：以本人视角对对方的态度 */
export enum RelationType {
  Enemy = '敌对',
  Friend = '友善',
  Neutral = '中立',
  Loyal = '效忠',
  Kin = '宗亲',
  Rival = '政争',
  Suspicion = '猜忌',
}

/** 阵营：决定人物服色与人像形制 */
export enum Camp {
  InnerCourt = '内廷',
  Civil = '文官',
  Liaodong = '辽镇',
  Maritime = '海商',
  Rebels = '义军',
  Qing = '皇清',
  Steppe = '塞外',
  ImperialClan = '宗藩',
  Western = '西学',
}

export interface Relation {
  /** 对方人物 id */
  to: string
  type: RelationType
}

/** 史实轨迹条目：某年（崇祯纪年，0=天启七年）该人物的处境发生变化 */
export interface FateEntry {
  year: number
  status: CharStatus
  note: string
  /** 钤在此人头上的印文（斩、赦、囚、降、殁一类），缺省按状态取字 */
  seal?: string
  /** 这些卡中任一张被裁决（史实卡或其改史替身卡），则此条史实不再发生 */
  unlessEvent?: string[]
  unlessFlag?: Flag[]
}

/** 抉择改写：玩家在指定卡上选了指定一侧，其后果覆盖同年史实轨迹 */
export interface CharFate {
  event: string
  side: Side
  status: CharStatus
  note: string
  /** 同上：此议落下时钤的印文 */
  seal?: string
  /** 此判何年方见分晓；缺省即本议落下之年 */
  year?: number
}

export interface Character {
  id: string
  name: string
  /** 字/号/别称 */
  alias?: string
  avatar: string
  /** 身份一句话 */
  role: string
  /** 阵营 */
  camp: Camp
  /** 主要牵动的国势 */
  faction: ResourceKey
  /** 生年（公历），不详留空 */
  born?: number
  /** 强制登场年：开局即已知其人（不必等到卡面出现） */
  appearYear?: number
  /** 涉及的事件卡 id */
  events: string[]
  /** 史实轨迹 */
  track?: FateEntry[]
  /** 抉择改写 */
  fates?: CharFate[]
  relations: Relation[]
}

/** 人物已亲历的事件（未发生的不列入） */
export interface Deed {
  eventId: string
  title: string
  /** 崇祯纪年 */
  year: number
  /** null = 此卡尚未裁决 */
  side: Side | null
  label: string
}

/** 运行时派生的人物视图 */
export interface CharView {
  char: Character
  status: CharStatus
  /** 当前处境 */
  note: string
  /** 周岁；生年不详或未生为 null */
  age: number | null
  /** 登场年份（崇祯纪年） */
  appearYear: number | null
  deeds: Deed[]
  relations: { target: Character; label: string; color: string }[]
}

/** 四项治平之具：君威 / 法度 / 军心 / 国库（过高过低皆足致亡） */
export type AxisKey = 'court' | 'law' | 'army' | 'gold'

/** 全部国势指标：四象之上另有民心，作为单向的「国本」水位，只论倾覆不论过盈 */
export type ResourceKey = AxisKey | 'people'

/** 一次选择对指标的影响 */
export type Effects = Partial<Record<ResourceKey, number>>

export type Side = 'left' | 'right'

/** 本局某张卡上做出的决策 */
export interface Decision {
  eventId: string
  side: Side
  /** 做出决策时的崇祯纪年（0=天启七年） */
  year: number
}

export type FinaleBranch = 'south' | 'meishan' | 'battle' | 'hold'
  | 'reform' | 'reform-retreat' | 'reform-hold' | 'reform-battle'
  /** 宫门之变：即位未久即操切动手，败于禁门之内，当年即入结局 */
  | 'coup'

/**
 * 旗标规则：用于卡牌的出现条件。
 * 裸字符串表示该旗标 ≥1；对象形式可指定最小累计次数。
 */
export type FlagRule = string | { flag: string; min: number }

export interface Choice {
  /** 滑动时显示的决策印章文字 */
  label: string
  effects: Effects
  /** 本议批红：裁决后独立成页展示，不与下一问同屏 */
  response: string
  /** 标记此选择直接触发 1644 终章结算 */
  finale?: FinaleBranch
  /** 此选择写下的旗标：决定后续年份哪些分叉卡会登场 */
  sets?: string[]
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
  excludes?: string[]
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
  camp: string
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

export interface Ending {
  avatar: string
  title: string
  description: string
  /** doom=国祚断送 neutral=宿命轮回 glory=续命中兴 */
  kind: 'doom' | 'neutral' | 'glory'
  survived?: boolean
}

/** 人物状态：尚未登场 / 生 / 病 / 死 */
export type CharStatus = 'hidden' | 'alive' | 'ill' | 'dead'

/** 关系类型：敌对 / 友善 / 中立 / 效忠 / 宗亲 / 政争 / 猜忌 */
export type RelationType = 'enemy' | 'friend' | 'neutral' | 'loyal' | 'kin' | 'rival' | 'suspicion'

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
  unlessFlag?: string[]
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
  /** 阵营：内廷 / 文官 / 辽镇 / 义军 / 皇清 / 宗藩 / 西学 / 塞外 */
  camp: string
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
  /** 虚岁；生年不详或未生为 null */
  age: number | null
  /** 登场年份（崇祯纪年） */
  appearYear: number | null
  deeds: Deed[]
  relations: { target: Character; label: string; color: string }[]
}

/** 四项国势指标：皇权 / 民心 / 军心 / 国库 */
export type ResourceKey = 'court' | 'people' | 'army' | 'gold'

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

/** 终章分支标记 */
export type FinaleBranch = 'south' | 'meishan'

export interface Choice {
  /** 滑动时显示的决策印章文字 */
  label: string
  effects: Effects
  /** 做出选择后下一张卡牌顶部的回应文字 */
  response: string
  /** 标记此选择直接触发 1644 终章结算 */
  finale?: FinaleBranch
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
  /** 锁年剧本：崇祯纪年（0=天启七年，1..16=崇祯N年），随机卡无此字段 */
  year?: number
  /** 同一年内的剧本顺序 */
  order?: number
}

export interface Ending {
  avatar: string
  title: string
  description: string
  /** doom=国祚断送 neutral=宿命轮回 glory=续命中兴 */
  kind: 'doom' | 'neutral' | 'glory'
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
  /** 玩家在该事件卡上做过抉择，则此条史实不再发生 */
  unlessEvent?: string
}

/** 抉择改写：玩家在指定卡上选了指定一侧，其后果覆盖同年史实轨迹 */
export interface CharFate {
  event: string
  side: Side
  status: CharStatus
  note: string
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

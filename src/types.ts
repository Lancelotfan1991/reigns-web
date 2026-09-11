/** 四项国势指标：皇权 / 民心 / 军心 / 国库 */
export type ResourceKey = 'court' | 'people' | 'army' | 'gold'

/** 一次选择对指标的影响 */
export type Effects = Partial<Record<ResourceKey, number>>

export type Side = 'left' | 'right'

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

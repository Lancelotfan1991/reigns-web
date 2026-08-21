/** 四项王权资源 */
export type ResourceKey = 'church' | 'people' | 'army' | 'gold'

/** 一次选择对资源的影响 */
export type Effects = Partial<Record<ResourceKey, number>>

export type Side = 'left' | 'right'

export interface Choice {
  /** 滑动时显示的决印章文字 */
  label: string
  effects: Effects
  /** 做出选择后下一张卡牌顶部的回应文字 */
  response: string
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
}

export interface Ending {
  avatar: string
  title: string
  description: string
}

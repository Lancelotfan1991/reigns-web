/** 君主自身的三种政治资本，不与人物五维混用。 */
export type EmperorResourceKey = 'prestige' | 'strength' | 'support'

export interface EmperorThreshold {
  at: number
  label: string
}

export interface EmperorResourceMeta {
  key: EmperorResourceKey
  name: string
  icon: string
  color: string
  tag: string
  short: string
  description: string
  zero: string
  thresholds: EmperorThreshold[]
}

export const EMPEROR_RESOURCES: EmperorResourceMeta[] = [
  {
    key: 'prestige',
    name: '政治威望',
    icon: '👑',
    color: '#a8322a',
    tag: '官僚 · 士大夫',
    short: '能不能推得动',
    description:
      '官僚集团和士大夫还愿不愿意替你办事。它是改革卡的门槛，也是政令执行效率的修正。',
    zero: '改革全部锁死，政令不出宫；官僚开始架空皇帝。',
    thresholds: [
      { at: 60, label: '可推官制、军制等深层改革' },
      { at: 40, label: '可推清丈、整军等中等改革' },
      { at: 20, label: '只能维持日常政务' },
      { at: 0, label: '改革锁死，执行崩坏' },
    ],
  },
  {
    key: 'strength',
    name: '综合国力',
    icon: '🏛️',
    color: '#3a5f83',
    tag: '国家',
    short: '撑不撑得住',
    description:
      '国家还能调动的人力、物力、财力。战争、灾难、工程、赈灾都从这里扣；它不是分数，而是国家的血条。',
    zero: '国力耗尽，国家灭亡。',
    thresholds: [
      { at: 70, label: '尚有余力，可主动兴作' },
      { at: 40, label: '勉强支应，经不起两线作战' },
      { at: 20, label: '捉襟见肘，只能守不能攻' },
      { at: 0, label: '国家崩溃' },
    ],
  },
  {
    key: 'support',
    name: '民心',
    icon: '🌾',
    color: '#4b7a5c',
    tag: '百姓',
    short: '愿不愿意跟',
    description:
      '百姓还愿不愿意交税、当兵、运粮。它不是可花费的资源，而是国力消耗、恢复速度和民变风险的修正器。',
    zero: '民变总爆发，天下大乱。',
    thresholds: [
      { at: 60, label: '粮道稳，可征乡勇、得情报' },
      { at: 40, label: '尚可支撑，但加派开始伤民' },
      { at: 20, label: '民变风险上升，国力消耗加重' },
      { at: 0, label: '民变总爆发' },
    ],
  },
]

export const EMPEROR_INITIAL: Record<EmperorResourceKey, number> = {
  prestige: 50,
  strength: 60,
  support: 45,
}

/** 三者的关系，用于面板上的解释卡。 */
export const EMPEROR_RELATIONS = [
  {
    title: '威望',
    line: '决定“能不能做”',
    text: '没有威望，改革卡打不开，政令也出不了紫禁城。',
  },
  {
    title: '国力',
    line: '决定“做不做得起”',
    text: '战争、灾难、赈灾、工程都要从国力里扣，归零即亡国。',
  },
  {
    title: '民心',
    line: '决定“做完会不会反”',
    text: '民心低，同样的政策要花更多国力，还会把民变卡塞进牌库。',
  },
]

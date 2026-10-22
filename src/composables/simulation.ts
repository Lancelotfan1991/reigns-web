import { CHRONOLOGY, yearOf } from '../data/chapters'
import { FINALE_YEAR } from './era'
import { FinaleBranch, Flag, Side } from '../types'
import type { AxisKey, Effects, FlagRule, GameEvent, ResourceKey, StoryChapter } from '../types'
export { FINALE_YEAR, yearOf }

/** 四象：归零与满格同样致命 */
export const AXIS_KEYS: AxisKey[] = ['court', 'law', 'army', 'gold']
/** 结算与展示的统一顺序：四象在前，国本民心在后 */
export const RESOURCE_KEYS: ResourceKey[] = ['court', 'law', 'army', 'gold', 'people']

const YEARLY_TICKS = 3

/** 国本线：民心低于此值即为动乱，军心与法度随岁耗额外失血 */
export const UNREST_LINE = 30

const ERA_DRIFT: Partial<Record<ResourceKey, number>> = { army: -1, gold: -1 }
const UNREST_PENALTY: Partial<Record<AxisKey, number>> = { army: -1, law: -1 }

export function clamp(value: number): number {
  return Math.min(100, Math.max(0, value))
}

export function initialResources(): Record<ResourceKey, number> {
  return { court: 50, law: 40, army: 45, gold: 35, people: 45 }
}

export function ruleMet(rule: FlagRule, flags: Record<string, number>): boolean {
  if (typeof rule === 'string') return (flags[rule] ?? 0) >= 1
  return (flags[rule.flag] ?? 0) >= rule.min
}

export function eligible(card: GameEvent, flags: Record<string, number>, resources: Record<ResourceKey, number>): boolean {
  return (card.requires ?? []).every((rule) => ruleMet(rule, flags))
    && !(card.excludes ?? []).some((flag) => (flags[flag] ?? 0) > 0)
    && RESOURCE_KEYS.every((key) => {
      const bound = card.resourceBounds?.[key]
      return !bound || (resources[key] >= (bound.min ?? 0) && resources[key] <= (bound.max ?? 100))
    })
}

/** 直排牌堆的一条：篇章的某一步占定一个编年键，候选按数组顺序取首张符合条件者 */
export interface DeckEntry {
  key: number
  chapter: StoryChapter
  step: number
  cards: GameEvent[]
}

/**
 * 编年直排：篇章已按 (year, order) 排好，牌堆键是连续序号；
 * 每一步的年份由 CHRONOLOGY 显式携带，不再由键做乘除换算。
 */
export const DECK: DeckEntry[] = CHRONOLOGY

/** 牌堆总步数：推演的最大深度 */
export const TOTAL_STEPS = DECK.length

/** 发牌状态：牌堆中已走到的位置（含被跳过的步骤） */
export interface DealState {
  seq: number
}

export interface DealResult {
  card: GameEvent | undefined
  deal: DealState
  /** 所发之牌所属的篇章步骤；无牌可发时为 null */
  chapter: { story: StoryChapter; step: number } | null
  /** 所发之牌的编年键；无牌可发时为 null */
  key: number | null
}

/**
 * 从 deal.seq 起发下一张：步骤按直排序依次检查，取该步首张符合条件者；
 * 整步无合格候选即静默跳过——那几议没有事发生，纪年照常翻页。
 */
export function dealNext(
  flags: Record<string, number>,
  resources: Record<ResourceKey, number>,
  deal: DealState,
): DealResult {
  for (let seq = deal.seq; seq < DECK.length; seq++) {
    const entry = DECK[seq]
    const card = entry.cards.find((c) => eligible(c, flags, resources))
    if (card) return { card, deal: { seq: seq + 1 }, chapter: { story: entry.chapter, step: entry.step }, key: entry.key }
  }
  return { card: undefined, deal, chapter: null, key: null }
}

/** 跨年岁耗：同一年的首议一次性结算全年三刻；甲申之年不再计时 */
export function yearTick(year: number, lastYear: number): number {
  return year !== lastYear && year < FINALE_YEAR ? YEARLY_TICKS : 0
}

/** 结算一议的指标影响：抉择本身 + 岁耗，民心破线时四象另加失血 */
export function applyEffects(
  resources: Record<ResourceKey, number>,
  effects: Effects,
  tick: number,
  customsFunded: boolean,
  workshopsSupplied: boolean,
): Record<ResourceKey, number> {
  const next = { ...resources }
  const maintenance: Effects = {
    ...ERA_DRIFT,
    gold: customsFunded ? 0 : ERA_DRIFT.gold,
    army: workshopsSupplied ? 0 : ERA_DRIFT.army,
  }
  for (const key of RESOURCE_KEYS) {
    const delta = (effects[key] ?? 0) + tick * (maintenance[key] ?? 0)
    next[key] = clamp(next[key] + delta)
  }
  if (next.people < UNREST_LINE) {
    for (const key of AXIS_KEYS) {
      next[key] = clamp(next[key] + tick * (UNREST_PENALTY[key] ?? 0))
    }
  }
  return next
}

export function addFlags(flags: Record<string, number>, sets?: string[]): Record<string, number> {
  if (!sets?.length) return flags
  const after = { ...flags }
  for (const flag of sets) after[flag] = (after[flag] ?? 0) + 1
  return after
}

/** 推演中的局势快照：手上这张牌、其编年键、上一议年份、已议数、旗标、四象与牌堆位置 */
export interface SimState {
  card: GameEvent
  key: number
  /** 上一议所在年份；-1 = 尚未裁决，故首议即结算第一年的岁耗 */
  lastYear: number
  /** 已作出的决策数 */
  depth: number
  flags: Record<string, number>
  resources: Record<ResourceKey, number>
  deal: DealState
}

/** 推演一步的结果：获胜（格物中兴）/ 其它结局 / 还有下一议 */
export type SimStep =
  | { kind: 'win' }
  | { kind: 'end' }
  | { kind: 'next'; state: SimState }

function customsFunded(flags: Record<string, number>): boolean {
  return (flags[Flag.海税入公] ?? 0) > 0 && (flags[Flag.交叉验账] ?? 0) > 0
}

function workshopsSupplied(flags: Record<string, number>): boolean {
  return (flags[Flag.军器设局] ?? 0) > 0 && (flags[Flag.登莱保炮] ?? 0) > 0
}

/** 落下一子：把该侧的影响与旗标加到当局上，得到尚未翻下一张牌的局势 */
export function resolveChoice(state: SimState, side: Side): SimState {
  const choice = side === Side.Left ? state.card.left : state.card.right
  const year = yearOf(state.key)
  return {
    ...state,
    depth: state.depth + 1,
    lastYear: year,
    flags: addFlags(state.flags, choice.sets),
    resources: applyEffects(
      state.resources,
      choice.effects,
      yearTick(year, state.lastYear),
      customsFunded(state.flags),
      workshopsSupplied(state.flags),
    ),
  }
}

/** 照引擎规则推演一议；其它任何结局都归入 end，god 模式只求格物中兴 */
export function advanceSim(state: SimState, side: Side): SimStep {
  const card = state.card
  const choice = side === Side.Left ? card.left : card.right
  const after = resolveChoice(state, side)

  if (choice.finale) {
    if (choice.finale !== FinaleBranch.Reform) return { kind: 'end' }
    return eligible(card, after.flags, after.resources) ? { kind: 'win' } : { kind: 'end' }
  }
  for (const key of AXIS_KEYS) {
    if (after.resources[key] <= 0 || after.resources[key] >= 100) return { kind: 'end' }
  }
  if (after.resources.people <= 0) return { kind: 'end' }

  const dealt = dealNext(after.flags, after.resources, after.deal)
  if (!dealt.card || dealt.key === null) return { kind: 'end' }
  return { kind: 'next', state: { ...after, card: dealt.card, key: dealt.key, deal: dealt.deal } }
}

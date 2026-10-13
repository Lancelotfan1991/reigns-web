import { CHAPTERS } from '../data/chapters'
import { RANDOM_EVENTS } from '../data/events'
import { CARDS_PER_YEAR, SCRIPT_SLOTS, chapterEnd, chapterStart, turnOf } from './slots'
import type { AxisKey, Effects, FlagRule, GameEvent, ResourceKey, Side, StoryChapter } from '../types'
export { CARDS_PER_YEAR, SCRIPT_SLOTS, turnOf, yearOf, slotOfPosition } from './slots'

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

export function shuffle<T>(list: T[]): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 本局随机牌序：开局洗好一次，全程按序抽取且不重复 */
export function makePool(): GameEvent[] {
  return shuffle(RANDOM_EVENTS)
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

/** 定点槽位：哪个篇章的哪一步占定此槽，候选按字面顺序取首张符合条件者 */
interface PointSlot {
  story: StoryChapter
  step: number
  cards: GameEvent[]
}

const POINT_BY_SLOT = new Map<number, PointSlot>()
const WINDOW_CHAPTERS: StoryChapter[] = []
const WINDOW_BY_ID = new Map<string, StoryChapter>()
for (const chapter of CHAPTERS) {
  if ('order' in chapter.time) {
    const start = chapterStart(chapter.time)
    chapter.steps.forEach((cards, step) => POINT_BY_SLOT.set(start + step, { story: chapter, step, cards }))
  } else {
    WINDOW_CHAPTERS.push(chapter)
    WINDOW_BY_ID.set(chapter.id, chapter)
  }
}

/** 发牌状态：进行中的范围篇章窗口，以及本局已落下的范围篇章 */
export interface DealState {
  /** 多步范围篇章的进行中窗口：篇章 id 与起始槽位 */
  window?: { id: string; start: number }
  /** 已发过的范围篇章 id（同一篇章一局只发一次） */
  fired?: string[]
}

export interface DealResult {
  card: GameEvent | undefined
  cursor: number
  deal: DealState
  /** 所发之牌所属的篇章步骤；随机池为 null。单步分组也是篇章，展示层按步骤数过滤 */
  chapter: { story: StoryChapter; step: number } | null
}

/**
 * 发第 index 张牌，次序：
 * 0. 续接范围篇章窗口——窗口内每一步取该步首张符合条件者，全不符合则让位但保留窗口；
 * 1. 定点篇章——该槽候选按字面顺序取首张符合条件者，全不符合即让位；
 * 2. 范围篇章——仅在无进行中窗口、未发过、落在年期区间、整段无定点篇章且首步有牌可发时启动；
 * 3. 本局随机池；越过 SCRIPT_SLOTS 即无牌。
 */
export function dealAt(
  index: number,
  flags: Record<string, number>,
  resources: Record<ResourceKey, number>,
  pool: GameEvent[],
  cursor: number,
  deal: DealState,
): DealResult {
  let state = deal
  if (state.window) {
    const story = WINDOW_BY_ID.get(state.window.id)!
    const step = index - state.window.start
    if (step >= story.steps.length) {
      state = { fired: state.fired }
    } else {
      const card = story.steps[step].find((c) => eligible(c, flags, resources))
      if (card) return { card, cursor, deal: state, chapter: { story, step } }
    }
  }
  if (index > SCRIPT_SLOTS) return { card: undefined, cursor, deal: state, chapter: null }
  const point = POINT_BY_SLOT.get(index)
  if (point) {
    const card = point.cards.find((c) => eligible(c, flags, resources))
    if (card) return { card, cursor, deal: state, chapter: { story: point.story, step: point.step } }
  }
  if (!state.window) {
    for (const story of WINDOW_CHAPTERS) {
      if (state.fired?.includes(story.id)) continue
      if (index < chapterStart(story.time) || index > chapterEnd(story.time)) continue
      const end = index + story.steps.length - 1
      if (end > SCRIPT_SLOTS) continue
      let free = true
      for (let slot = index + 1; slot <= end; slot++) {
        if (POINT_BY_SLOT.has(slot)) {
          free = false
          break
        }
      }
      if (!free) continue
      const card = story.steps[0].find((c) => eligible(c, flags, resources))
      if (!card) continue
      const fired = [...(state.fired ?? []), story.id]
      if (story.steps.length === 1) return { card, cursor, deal: { fired }, chapter: { story, step: 0 } }
      return { card, cursor, deal: { fired, window: { id: story.id, start: index } }, chapter: { story, step: 0 } }
    }
  }
  return { card: pool[cursor], cursor: cursor + 1, deal: state, chapter: null }
}

/** 岁耗按年摊销为整数，增加抉择次数不增加年度耗损；终章不再计时 */
function yearlyTick(turn: number | null): number {
  if (turn === null) return 0
  return Math.floor(turn * YEARLY_TICKS / CARDS_PER_YEAR) - Math.floor((turn - 1) * YEARLY_TICKS / CARDS_PER_YEAR)
}

/** 结算一议的指标影响：抉择本身 + 岁耗，民心破线时四象另加失血 */
export function applyEffects(
  resources: Record<ResourceKey, number>,
  effects: Effects,
  turn: number | null,
  customsFunded: boolean,
  workshopsSupplied: boolean,
): Record<ResourceKey, number> {
  const next = { ...resources }
  const tick = yearlyTick(turn)
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

/** 推演中的局势快照：手上这张牌、旗标、四象、本局牌序游标与发牌状态 */
export interface SimState {
  index: number
  card: GameEvent
  cursor: number
  flags: Record<string, number>
  resources: Record<ResourceKey, number>
  deal: DealState
}

/** 推演一步的结果：获胜（格物中兴）/ 其它结局 / 还有下一议 */
export type SimStep =
  | { kind: 'win' }
  | { kind: 'end' }
  | { kind: 'next'; state: SimState }

/** 落下一子：把该侧的影响与旗标加到当局上，得到尚未翻下一张牌的局势 */
export function resolveChoice(state: SimState, side: Side): SimState {
  const choice = side === 'left' ? state.card.left : state.card.right
  return {
    index: state.index + 1,
    card: state.card,
    cursor: state.cursor,
    flags: addFlags(state.flags, choice.sets),
    resources: applyEffects(
      state.resources,
      choice.effects,
      turnOf(state.index),
      (state.flags['gewu-customs'] ?? 0) > 0 && (state.flags['gewu-audit'] ?? 0) > 0,
      (state.flags['gewu-tools'] ?? 0) > 0 && (state.flags['gewu-denglai'] ?? 0) > 0,
    ),
    deal: state.deal,
  }
}

/** 照引擎规则推演一议；其它任何结局都归入 end，god 模式只求格物中兴 */
export function advanceSim(state: SimState, side: Side, pool: GameEvent[]): SimStep {
  const card = state.card
  const choice = side === 'left' ? card.left : card.right
  const after = resolveChoice(state, side)

  if (choice.finale) {
    if (choice.finale !== 'reform') return { kind: 'end' }
    return eligible(card, after.flags, after.resources) ? { kind: 'win' } : { kind: 'end' }
  }
  for (const key of AXIS_KEYS) {
    if (after.resources[key] <= 0 || after.resources[key] >= 100) return { kind: 'end' }
  }
  if (after.resources.people <= 0) return { kind: 'end' }

  const dealt = dealAt(after.index, after.flags, after.resources, pool, after.cursor, after.deal)
  if (!dealt.card) return { kind: 'end' }
  return { kind: 'next', state: { ...after, card: dealt.card, cursor: dealt.cursor, deal: dealt.deal } }
}

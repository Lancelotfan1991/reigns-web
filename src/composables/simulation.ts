import { FINALE_EVENTS, RANDOM_EVENTS } from '../data/events'
import { REFORM_FINALES } from '../data/reforms'
import { STANDALONE_EVENTS, STORY_CHAPTERS } from '../data/chapters'
import type { AxisKey, Effects, FlagRule, GameEvent, ResourceKey, Side, StoryChapter } from '../types'

/** 四象：归零与满格同样致命 */
export const AXIS_KEYS: AxisKey[] = ['court', 'law', 'army', 'gold']
/** 结算与展示的统一顺序：四象在前，国本民心在后 */
export const RESOURCE_KEYS: ResourceKey[] = ['court', 'law', 'army', 'gold', 'people']

export const CARDS_PER_YEAR = 5
const YEARLY_TICKS = 3
const LAST_SCRIPT_YEAR = 16
/** 锁年剧本与史实卡的槽位总数；此后的第一张即甲申终章 */
export const SCRIPT_SLOTS = (LAST_SCRIPT_YEAR + 1) * CARDS_PER_YEAR

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

/** 0 = 天启七年，N = 崇祯N年，17 = 甲申终章当年 */
export function turnOf(index: number): number | null {
  return index < SCRIPT_SLOTS ? (index % CARDS_PER_YEAR) + 1 : null
}

export function yearOf(index: number): number {
  return Math.floor(index / CARDS_PER_YEAR)
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

const SLOT_CANDIDATES = new Map<string, GameEvent[]>()
for (const e of STANDALONE_EVENTS) {
  const key = `${e.year ?? 0}#${(e.order ?? 1) - 1}`
  const list = SLOT_CANDIDATES.get(key)
  if (list) list.push(e)
  else SLOT_CANDIDATES.set(key, [e])
}
for (const list of SLOT_CANDIDATES.values()) {
  list.sort((a, b) => (b.requires?.length ?? 0) - (a.requires?.length ?? 0))
}

const FINALE_CANDIDATES = [...REFORM_FINALES, ...FINALE_EVENTS].sort(
  (a, b) => (b.requires?.length ?? 0) - (a.requires?.length ?? 0),
)

/** 篇章连续且互不重叠，故某一步属于哪个篇章可由槽位直接推出 */
const CHAPTER_BY_SLOT: (StoryChapter | null)[] = Array.from({ length: SCRIPT_SLOTS }, () => null)
for (const story of STORY_CHAPTERS) {
  for (let step = 0; step < story.steps.length; step++) CHAPTER_BY_SLOT[story.start + step] = story
}

export function chapterAt(index: number): { story: StoryChapter; step: number } | null {
  if (index < 0 || index >= SCRIPT_SLOTS) return null
  const story = CHAPTER_BY_SLOT[index]
  return story ? { story, step: index - story.start } : null
}

/** 发第 index 张牌：篇章槽优先，其次同槽条件卡，最后按本局牌序抽取 */
export function dealAt(
  index: number,
  flags: Record<string, number>,
  resources: Record<ResourceKey, number>,
  pool: GameEvent[],
  cursor: number,
): { card: GameEvent | undefined; cursor: number } {
  if (index === SCRIPT_SLOTS) {
    return { card: FINALE_CANDIDATES.find((c) => eligible(c, flags, resources)), cursor }
  }
  if (index > SCRIPT_SLOTS) return { card: undefined, cursor }
  const active = chapterAt(index)
  if (active) {
    // 每一步都有本篇章的无条件收束分支，前置失败不退回随机池。
    return { card: active.story.steps[active.step].find((c) => eligible(c, flags, resources))!, cursor }
  }
  const key = `${yearOf(index)}#${index % CARDS_PER_YEAR}`
  const scripted = SLOT_CANDIDATES.get(key)?.find((c) => eligible(c, flags, resources))
  if (scripted) return { card: scripted, cursor }
  return { card: pool[cursor], cursor: cursor + 1 }
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

/** 推演中的局势快照：手上这张牌、旗标、四象与本局牌序游标 */
export interface SimState {
  index: number
  card: GameEvent
  cursor: number
  flags: Record<string, number>
  resources: Record<ResourceKey, number>
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

  const dealt = dealAt(after.index, after.flags, after.resources, pool, after.cursor)
  if (!dealt.card) return { kind: 'end' }
  return { kind: 'next', state: { ...after, card: dealt.card, cursor: dealt.cursor } }
}

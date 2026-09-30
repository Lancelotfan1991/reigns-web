import { computed, ref, watch } from 'vue'
import { REFORM_EVENTS, REFORM_FINALES, REFORM_REQUIREMENTS } from '../data/reforms'
import { FINALE_EVENTS, RANDOM_EVENTS } from '../data/events'
import { STANDALONE_EVENTS, STORY_CHAPTERS, STORY_EVENTS } from '../data/chapters'
import { AXIS_KEYS, SCRIPT_SLOTS, advanceSim, resolveChoice, type SimState } from './simulation'
import type { Game } from './useGame'
import type { FlagRule, GameEvent, ResourceKey, Side } from '../types'

/** 终章 g-finale-gewu 对四象的要求区间与民心水位，与卡上的 resourceBounds 一致 */
const BAND_MIN = 45
const BAND_MAX = 80
const PEOPLE_GOAL = 75
/** 必得的革新旗标若没有下游，估值不该被压到接近零 */
const FLAG_FLOOR = 15
/** 每议保留的推演分支数：越大越准，也越慢。128 宽下 30 个牌局有 22 局能算出必胜 */
const BEAM_WIDTH = 128
/** 已死的局面只按「死得多晚、旗标几何」分高下，一律排在存活局面之后 */
const DEAD = -2e12
/** 走到终章却未成格物中兴 */
const LOST = -1e12

const SIDES: Side[] = ['left', 'right']

const ALL_CARDS: GameEvent[] = [
  ...STORY_EVENTS,
  ...STANDALONE_EVENTS,
  ...STORY_CHAPTERS.flatMap((story) => story.steps.flat()),
  ...REFORM_EVENTS,
  ...RANDOM_EVENTS,
  ...REFORM_FINALES,
  ...FINALE_EVENTS,
]

function ruleFlag(rule: FlagRule): string {
  return typeof rule === 'string' ? rule : rule.flag
}

const REQUIRED = new Set(REFORM_REQUIREMENTS)

/** 前置旗标 → 由它放行的、可直接取得的旗标 */
const UNLOCKS = new Map<string, Set<string>>()
for (const card of ALL_CARDS) {
  for (const rule of card.requires ?? []) {
    const gate = ruleFlag(rule)
    let targets = UNLOCKS.get(gate)
    if (!targets) UNLOCKS.set(gate, (targets = new Set()))
    for (const side of SIDES) for (const flag of card[side].sets ?? []) targets.add(flag)
  }
}

/** 持有某面旗，最多能连带打开多少面终章所需的旗（含自身） */
const FLAG_VALUE = new Map<string, number>()
{
  const keys = new Set<string>()
  for (const card of ALL_CARDS) {
    for (const side of SIDES) for (const flag of card[side].sets ?? []) keys.add(flag)
    for (const rule of card.requires ?? []) keys.add(ruleFlag(rule))
  }
  const reach = new Map<string, Set<string>>()
  for (const key of keys) reach.set(key, REQUIRED.has(key) ? new Set([key]) : new Set())
  for (let iter = 0; iter < 40; iter++) {
    let changed = false
    for (const key of keys) {
      const own = reach.get(key)!
      const before = own.size
      for (const target of UNLOCKS.get(key) ?? []) {
        for (const flag of reach.get(target) ?? []) own.add(flag)
      }
      if (own.size !== before) changed = true
    }
    if (!changed) break
  }
  for (const [key, set] of reach) FLAG_VALUE.set(key, set.size)
}

/** 旗标进度：已成旗标的连带价值，必得旗标另有保底，免得无下游的那几面被永远排到最后 */
function flagProgress(flags: Record<string, number>): number {
  let total = 0
  for (const key of Object.keys(flags)) {
    if (!flags[key]) continue
    const value = FLAG_VALUE.get(key) ?? 0
    total += REQUIRED.has(key) ? Math.max(value, FLAG_FLOOR) : value
  }
  return total
}

/** 离终章所要求的指标区间还有多远 */
function bandScore(resources: Record<ResourceKey, number>): number {
  let score = 0
  for (const key of AXIS_KEYS) {
    const value = resources[key]
    score += value >= BAND_MIN && value <= BAND_MAX ? 220 : -22 * (value < BAND_MIN ? BAND_MIN - value : value - BAND_MAX)
  }
  score += resources.people >= PEOPLE_GOAL ? 120 : -12 * (PEOPLE_GOAL - resources.people)
  return score
}

function aliveScore(state: SimState): number {
  const progress = flagProgress(state.flags)
  const resources = state.resources
  for (const key of AXIS_KEYS) {
    if (resources[key] <= 0 || resources[key] >= 100) return DEAD + state.index * 1e5 + progress
  }
  if (resources.people <= 0) return DEAD + state.index * 1e5 + progress
  return progress * 1e5 + bandScore(resources) + state.index
}

function lostScore(state: SimState): number {
  return LOST + bandScore(state.resources) + flagProgress(state.flags) * 30
}

interface Branch {
  state: SimState
  first: Side
  score: number
}

/** 从当前局面出发定宽推演到底，给出首步，以及是否确已算出一条格物中兴之路 */
function searchFirstStep(state: SimState, pool: GameEvent[]): { side: Side; certain: boolean } {
  let best = -Infinity
  let bestFirst: Side | null = null
  let beam: Branch[] = []

  for (const side of SIDES) {
    const step = advanceSim(state, side, pool)
    if (step.kind === 'win') return { side, certain: true }
    if (step.kind === 'end') {
      const score = lostScore(resolveChoice(state, side))
      if (score > best) {
        best = score
        bestFirst = side
      }
    } else {
      beam.push({ state: step.state, first: side, score: aliveScore(step.state) })
    }
  }

  for (let depth = 0; depth <= SCRIPT_SLOTS && beam.length; depth++) {
    const next: Branch[] = []
    for (const branch of beam) {
      for (const side of SIDES) {
        const step = advanceSim(branch.state, side, pool)
        if (step.kind === 'win') return { side: branch.first, certain: true }
        if (step.kind === 'end') {
          const score = lostScore(resolveChoice(branch.state, side))
          if (score > best) {
            best = score
            bestFirst = branch.first
          }
        } else {
          next.push({ state: step.state, first: branch.first, score: aliveScore(step.state) })
        }
      }
    }
    next.sort((a, b) => b.score - a.score)
    beam = next.slice(0, BEAM_WIDTH)
  }

  for (const branch of beam) {
    if (branch.score > best) {
      best = branch.score
      bestFirst = branch.first
    }
  }
  return { side: bestFirst ?? 'left', certain: false }
}

export interface Advice {
  /** 建议的一侧 */
  side: Side
  /** 是否已确算出一条格物中兴之路；否则所标只是当前格局下的最优 */
  certain: boolean
}

/** 上帝视角：算出当前这一议走哪一侧最好 */
export function advise(state: SimState, pool: GameEvent[]): Advice {
  return searchFirstStep(state, pool)
}

/** god 模式（?god=1）的卡面提示：牌一换就重算，延后到飞牌动画之后以免卡顿 */
export function useHint(game: Game, enabled: boolean) {
  const advice = ref<Advice | null>(null)
  const pending = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const trigger = computed(() => {
    if (!enabled) return ''
    return `${game.currentCard.value?.id ?? ''}#${game.verdict.value ? 'verdict' : 'card'}`
  })

  function compute() {
    timer = null
    const snapshot = game.snapshot()
    advice.value = snapshot ? advise(snapshot.state, snapshot.pool) : null
    pending.value = false
  }

  watch(trigger, () => {
    if (timer) clearTimeout(timer)
    if (!trigger.value) {
      advice.value = null
      pending.value = false
      return
    }
    pending.value = true
    timer = setTimeout(compute, 340)
  }, { immediate: true })

  return { advice, pending }
}

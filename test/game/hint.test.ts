import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { advise } from '../../src/composables/useHint'
import { useGame } from '../../src/composables/useGame'
import { SCRIPT_SLOTS, type SimState } from '../../src/composables/simulation'
import { REFORM_FINALES, REFORM_REQUIREMENTS } from '../../src/data/reforms'
import { healthy, seedRandom } from './helpers'

const gewu = REFORM_FINALES.find((card) => card.id === 'g-finale-gewu')!

/** 终章前一刻的局势：手上是 g-finale-gewu，只差按下裁决 */
function finaleState(flags: string[], resources = healthy()): SimState {
  return {
    index: SCRIPT_SLOTS,
    card: gewu,
    cursor: 0,
    flags: Object.fromEntries(flags.map((flag) => [flag, 1])),
    resources,
  }
}

/** 让推演走完全局，返回结局与首步是否被标为必胜 */
function playByAdvice(seed: number) {
  seedRandom(seed)
  const game = useGame()
  game.startGame()
  let certain = false
  let steps = 0
  while (!game.isOver.value && steps < 90) {
    const snapshot = game.snapshot()
    if (!snapshot) break
    const step = advise(snapshot.state, snapshot.pool)
    if (steps === 0) certain = step.certain
    game.choose(step.side)
    game.dismissVerdict()
    steps++
  }
  return { certain, title: game.ending.value?.title ?? '(未结束)' }
}

const SEEDS = [1, 1644, 2026]

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('God 模式推演', () => {
  it('旗标已齐且四象在档时，终章给出必胜的左印', () => {
    expect(advise(finaleState(REFORM_REQUIREMENTS), [])).toEqual({ side: 'left', certain: true })
  })

  it('旗标未齐时不谎称必胜', () => {
    expect(advise(finaleState([]), []).certain).toBe(false)
  })

  it('四象出档时不谎称必胜', () => {
    expect(advise(finaleState(REFORM_REQUIREMENTS, { ...healthy(), gold: 10 }), []).certain).toBe(false)
  })

  it('凡标了必胜，照它走到底确实是格物中兴', () => {
    let claimed = 0
    for (const seed of SEEDS) {
      const result = playByAdvice(seed)
      if (!result.certain) continue
      claimed++
      expect(result.title, `seed=${seed}`).toBe('格物中兴')
    }
    expect(claimed, '样例里至少要有一局算得出必胜，否则这条断言是空的').toBeGreaterThan(0)
  }, 180000)
})

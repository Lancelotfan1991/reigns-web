import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REFORM_REQUIREMENTS } from '../../src/data/reforms'
import { ALL_EVENTS, EVENT_SLOT } from '../../src/data/chapters'
import { Flag, type GameEvent } from '../../src/types'
import { atFinale, seedRandom, slotOf } from './helpers'

beforeEach(() => {
  seedRandom(2026)
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const fullFlags = () => Object.fromEntries(REFORM_REQUIREMENTS.map((flag) => [flag, 1]))

describe('T0 国用积弊', () => {
  const slots = [18, 32, 36, 60]
  const crisisCards = ALL_EVENTS.filter(card => card.id.startsWith('k-'))

  it('当积弊候选接入时，十二张卡只占四议，不增加中兴条件或覆盖原有成果', () => {
    expect(crisisCards).toHaveLength(12)
    expect([...new Set(crisisCards.map(card => slotOf(card.id)))].sort((a, b) => a - b)).toEqual(slots)
    expect(REFORM_REQUIREMENTS).toHaveLength(42)
    // 积弊旗标只许留在积弊子系统内：非 k- 卡不得产、也不得消费
    const outside = new Set<string>()
    for (const card of ALL_EVENTS) {
      if (card.id.startsWith('k-')) continue
      for (const flag of [...(card.left.sets ?? []), ...(card.right.sets ?? [])]) outside.add(flag)
      for (const rule of card.requires ?? []) outside.add(typeof rule === 'string' ? rule : rule.flag)
    }
    for (const card of crisisCards) {
      for (const side of ['left', 'right'] as const) {
        expect(card[side].sets?.every(flag => !outside.has(flag)) ?? true).toBe(true)
        expect(card[side].finale).toBeUndefined()
      }
    }
  })
})

describe('T0 革新条件链', () => {

  it('当同一建设有互斥变体时，同一世界线内只能在同一个时点获得，不能延后补考', () => {
    const requiresOf = (card: GameEvent) =>
      new Set((card.requires ?? []).map((rule) => (typeof rule === 'string' ? rule : rule.flag)))
    const excludesOf = (card: GameEvent) => new Set(card.excludes ?? [])
    // 跨时点产出只许世界线互斥：一侧所需的旗标恰为另一侧所斥（如「东江易帅」有/无）
    const disjointWorldlines = (a: GameEvent, b: GameEvent) =>
      [...requiresOf(a)].some((flag) => excludesOf(b).has(flag)) ||
      [...requiresOf(b)].some((flag) => excludesOf(a).has(flag))
    for (const flag of REFORM_REQUIREMENTS) {
      const producers = ALL_EVENTS.filter((card) =>
        [...(card.left.sets ?? []), ...(card.right.sets ?? [])].includes(flag))
      expect(producers.length, flag).toBeGreaterThan(0)
      for (let i = 0; i < producers.length; i++) {
        for (let j = i + 1; j < producers.length; j++) {
          const a = producers[i]
          const b = producers[j]
          if (EVENT_SLOT[a.id] === EVENT_SLOT[b.id]) continue
          expect(disjointWorldlines(a, b), `${flag}: ${a.id} 与 ${b.id} 跨时点产出，且可同处一条世界线`).toBe(true)
        }
      }
    }
  })

  it.each(REFORM_REQUIREMENTS)('当缺少%s时，即使其余条件全部满足也不会触发完美终章', (flag) => {
    const flags = fullFlags()
    delete flags[flag]
    expect(atFinale(flags).currentCard.value?.id).not.toBe('g-finale-gewu')
  })

  it('当存在诛戮旗标时，不能用齐全技术与数值抵消政治失败', () => {
    expect(atFinale({ ...fullFlags(), [Flag.大臣刑狱]: 1 }).currentCard.value?.id).not.toBe('g-finale-gewu')
  })
})

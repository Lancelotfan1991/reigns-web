import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REFORM_REQUIREMENTS } from '../../src/data/reforms'
import { ALL_EVENTS, EVENT_SLOT } from '../../src/data/chapters'
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
  const slots = [12, 18, 21, 38]
  const crisisCards = ALL_EVENTS.filter(card => card.id.startsWith('k-'))

  it('当积弊候选接入时，十二张卡只占四议，不增加中兴条件或覆盖原有成果', () => {
    expect(crisisCards).toHaveLength(12)
    expect([...new Set(crisisCards.map(card => slotOf(card.id)))].sort((a, b) => a - b)).toEqual(slots)
    expect(REFORM_REQUIREMENTS).toHaveLength(42)
    for (const card of crisisCards) {
      for (const side of ['left', 'right'] as const) {
        expect(card[side].sets?.every(flag => flag.startsWith('crisis-')) ?? true).toBe(true)
        expect(card[side].finale).toBeUndefined()
      }
    }
  })
})

describe('T0 革新条件链', () => {

  it('当同一建设有互斥变体时，只能在同一个时点获得，不能延后补考', () => {
    for (const flag of REFORM_REQUIREMENTS) {
      const producers = ALL_EVENTS.filter((card) =>
        [...(card.left.sets ?? []), ...(card.right.sets ?? [])].includes(flag))
      expect(producers.length, flag).toBeGreaterThan(0)
      expect(new Set(producers.map((card) => EVENT_SLOT[card.id])).size, flag).toBe(1)
    }
  })

  it.each(REFORM_REQUIREMENTS)('当缺少%s时，即使其余条件全部满足也不会触发完美终章', (flag) => {
    const flags = fullFlags()
    delete flags[flag]
    expect(atFinale(flags).currentCard.value?.id).not.toBe('g-finale-gewu')
  })

  it('当存在诛戮旗标时，不能用齐全技术与数值抵消政治失败', () => {
    expect(atFinale({ ...fullFlags(), exec: 1 }).currentCard.value?.id).not.toBe('g-finale-gewu')
  })
})

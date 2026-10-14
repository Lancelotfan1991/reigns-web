import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHARACTERS, CHAR_MAP } from '../../src/data/characters'
import { ALL_EVENTS } from '../../src/data/chapters'
import { RANDOM_EVENTS } from '../../src/data/events'
import { seedRandom } from '../game/helpers'

const allCards = [...ALL_EVENTS, ...RANDOM_EVENTS]
const cards = new Map(allCards.map((card) => [card.id, card]))

beforeEach(() => {
  seedRandom(2026)
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

describe('T1 人物改革事迹与登场', () => {
  it('当加载人物谱时，所有引用均来自canonical注册表而非退役卡池', () => {
    expect(CHAR_MAP.emperor.events).toEqual(allCards.map((card) => card.id))
    expect(new Set(CHAR_MAP.emperor.events).size).toBe(allCards.length)
    for (const char of CHARACTERS) {
      const refs = [...char.events, ...(char.fates ?? []).map((fate) => fate.event),
        ...(char.track ?? []).flatMap((track) => track.unlessEvent ?? [])]
      for (const id of refs) expect(cards.has(id), `${char.id}: ${id}`).toBe(true)
      for (const fate of char.fates ?? []) expect(char.events).toContain(fate.event)
    }
  })
})

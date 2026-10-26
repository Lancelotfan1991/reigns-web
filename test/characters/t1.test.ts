import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ATTRIBUTE_META, CHARACTERS, CHAR_MAP } from '../../src/data/characters'
import { ALL_EVENTS } from '../../src/data/chapters'
import { seedRandom } from '../game/helpers'

const allCards = ALL_EVENTS
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

  it('当加载人物谱时，44 人五维才具齐备且都在五的倍数刻度上', () => {
    expect(ATTRIBUTE_META.map((a) => a.key)).toEqual([
      'military',
      'strategy',
      'politics',
      'economy',
      'culture',
    ])
    expect(CHARACTERS.length).toBe(44)

    for (const char of CHARACTERS) {
      for (const { key } of ATTRIBUTE_META) {
        const value = char.attributes[key]
        expect(Number.isInteger(value), `${char.id}.${key}`).toBe(true)
        expect(value, `${char.id}.${key}`).toBeGreaterThanOrEqual(0)
        expect(value, `${char.id}.${key}`).toBeLessThanOrEqual(100)
        expect(value % 5, `${char.id}.${key}=${value}`).toBe(0)
      }

      for (const [field, items] of [
        ['expertise', char.expertise],
        ['traits', char.traits],
      ] as const) {
        expect(items.length, `${char.id}.${field}`).toBeGreaterThanOrEqual(2)
        expect(items.length, `${char.id}.${field}`).toBeLessThanOrEqual(3)
        expect(new Set(items).size, `${char.id}.${field} 重复`).toBe(items.length)
        for (const item of items) expect(item.length, `${char.id}.${field}`).toBeGreaterThan(0)
      }
    }
  })

  it('当加载人物谱时，各人小传齐备且互不重复', () => {
    const bios = CHARACTERS.map((char) => char.bio)
    for (const char of CHARACTERS) {
      expect(char.bio.length, `${char.id} 小传过短`).toBeGreaterThanOrEqual(50)
      expect(char.bio.length, `${char.id} 小传过长`).toBeLessThanOrEqual(200)
    }
    expect(new Set(bios).size).toBe(CHARACTERS.length)
  })
})

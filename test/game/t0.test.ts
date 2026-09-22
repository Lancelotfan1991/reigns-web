import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARDS_PER_YEAR, RESOURCE_KEYS, useGame } from '../../src/composables/useGame'
import { SCRIPT_EVENTS, RANDOM_EVENTS, FINALE_EVENTS } from '../../src/data/events'
import { REFORM_EVENTS, REFORM_FINALES, REFORM_REQUIREMENTS } from '../../src/data/reforms'
import type { ResourceKey, Side } from '../../src/types'
import { atFinale, healthy, reach, seedRandom } from './helpers'

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
const stages = REFORM_EVENTS.filter((card) => (card.order ?? 0) >= 4)
const successfulSide = (id: string): Side => {
  const card = REFORM_EVENTS.find((event) => event.id === id)
  return card?.left.sets?.some((flag) => flag.startsWith('gewu-')) ? 'left' : 'right'
}

describe('T0 五次抉择和无放回发牌', () => {
  it('当走满一局时，会经历85次常规抉择后才进入甲申终章且事件不重复', () => {
    const game = useGame()
    game.startGame()
    const ids = new Set<string>()
    expect(CARDS_PER_YEAR).toBe(5)
    for (let index = 0; index < 85; index++) {
      const card = game.currentCard.value!
      expect(card).toBeTruthy()
      expect(ids.has(card.id)).toBe(false)
      ids.add(card.id)
      expect(game.year.value).toBe(Math.floor(index / 5))
      expect(game.turnInYear.value).toBe(index % 5 + 1)
      game.resources.value = healthy()
      game.choose(card.id === 'g-institute' ? (successfulSide(card.id) === 'left' ? 'right' : 'left') : 'right')
    }
    expect(game.currentCard.value?.id).toBe('s-finale')
    expect(game.yearText.value).toContain('1644')
    expect(game.turnInYear.value).toBeNull()
    expect(game.reachedFinale.value).toBe(false)
    game.choose('left')
    expect(game.decisions.value).toHaveLength(86)
    expect(game.reachedFinale.value).toBe(true)
    expect(game.reignedYears.value).toBe(18)
    expect(new Set(game.decisions.value.map((decision) => decision.eventId)).size).toBe(86)
  })

  it('当卡池最坏情况下全部走史实时，随机池仍覆盖每个空位', () => {
    const unconditional = new Set([...SCRIPT_EVENTS, ...REFORM_EVENTS]
      .filter((card) => !card.requires?.length && !card.excludes?.length && !card.resourceBounds)
      .map((card) => `${card.year}#${card.order}`))
    expect(RANDOM_EVENTS.length).toBeGreaterThanOrEqual(85 - unconditional.size)
    const all = [...SCRIPT_EVENTS, ...RANDOM_EVENTS, ...FINALE_EVENTS, ...REFORM_EVENTS, ...REFORM_FINALES]
    expect(new Set(all.map((card) => card.id)).size).toBe(all.length)
    expect(new Set(all.map((card) => card.name)).size).toBe(all.length)
    for (const card of all) {
      expect(card.text.length).toBeGreaterThan(0)
      for (const side of ['left', 'right'] as const) {
        expect(card[side].label.length).toBeGreaterThan(0)
        for (const [key, value] of Object.entries(card[side].effects)) {
          expect(RESOURCE_KEYS).toContain(key)
          expect(Number.isInteger(value)).toBe(true)
        }
      }
    }
    for (const card of [...SCRIPT_EVENTS, ...REFORM_EVENTS]) {
      expect(card.year).toBeGreaterThanOrEqual(0)
      expect(card.year).toBeLessThanOrEqual(16)
      expect(card.order).toBeGreaterThanOrEqual(1)
      expect(card.order).toBeLessThanOrEqual(5)
    }
  })

  it.each([1, 2, 17, 1631, 1644])('当随机序列为%s时，换年和重开仍不会在单局重复', (seed) => {
    vi.restoreAllMocks()
    seedRandom(seed)
    const game = useGame()
    for (let run = 0; run < 2; run++) {
      game.startGame()
      for (let index = 0; index < 85; index++) {
        const card = game.currentCard.value!
        expect(card).toBeTruthy()
        expect(game.seenEventIds.value.size).toBe(index + 1)
        game.resources.value = healthy()
        game.choose(index % 2 === 0 ? 'right' : 'left')
      }
      game.choose('left')
      expect(game.decisions.value).toHaveLength(86)
    }
  })
})

describe('T0 革新条件链', () => {
  it('当从初始资源逐项裁决时，存在不注入资源与旗标的完整中兴路径', () => {
    const path = 'LLRLRRRRLRLRRLRRLRLRLLLLRLLRLRLRRLRLRRLRRRLLRLRRLRRLLLRLRRLRRLLLRLRRLRLRLLRRLLLRLRLLRL'
    const game = useGame()
    game.startGame()
    for (const side of path.slice(0, -1)) {
      expect(game.isOver.value).toBe(false)
      game.choose(side === 'L' ? 'left' : 'right')
    }
    expect(game.currentCard.value?.id).toBe('g-finale-gewu')
    for (const flag of REFORM_REQUIREMENTS) expect(game.flags.value[flag]).toBeGreaterThan(0)
    expect(game.flags.value.exec).toBeUndefined()
    game.choose('left')
    expect(game.ending.value?.title).toBe('格物中兴')
    expect(game.decisions.value).toHaveLength(86)
    expect(game.resources.value).toEqual({ court: 57, law: 57, army: 59, gold: 73, people: 100 })
  })

  it('当关键阶段排定时，每年第四五议各有一个机会且所有前置可按时获得', () => {
    expect(stages).toHaveLength(34)
    const ordered = [...stages].sort((a, b) => a.year! - b.year! || a.order! - b.order!)
    for (let index = 0; index < ordered.length; index++) {
      const card = ordered[index]
      expect(card.year).toBe(Math.floor(index / 2))
      expect(card.order).toBe(4 + index % 2)
      if (index > 0) {
        const previous = ordered[index - 1]
        const sets = previous[successfulSide(previous.id)].sets!
        expect(card.requires).toEqual(expect.arrayContaining(sets))
      }
    }
    const sources = [...SCRIPT_EVENTS, ...REFORM_EVENTS].flatMap((card) => [
      ...(card.left.sets ?? []), ...(card.right.sets ?? []),
    ])
    for (const flag of REFORM_REQUIREMENTS) expect(sources).toContain(flag)
  })

  it.each(stages.map((card) => [card.id, card.year! * 5 + card.order! - 1] as const))(
    '当%s选错时，该阶段和完美路线不会补考', (id, index) => {
      const game = useGame()
      game.startGame()
      const choose = (cardId: string): Side => {
        if (cardId.startsWith('g-')) return successfulSide(cardId)
        if (['s-mihe', 's-mihe-leak'].includes(cardId)) return 'left'
        return 'right'
      }
      reach(game, index, choose)
      expect(game.currentCard.value?.id).toBe(id)
      game.resources.value = healthy()
      game.choose(successfulSide(id) === 'left' ? 'right' : 'left')
      const lostFlags = REFORM_EVENTS.find((card) => card.id === id)![successfulSide(id)].sets!
      reach(game, 85, choose)
      for (const flag of lostFlags) expect(game.flags.value[flag]).toBeUndefined()
      expect(game.currentCard.value?.id).not.toBe('g-finale-gewu')
      expect(new Set(game.decisions.value.map((decision) => decision.eventId)).size).toBe(85)
    },
  )

  it.each(REFORM_REQUIREMENTS)('当缺少%s时，即使其余条件全部满足也不会触发完美终章', (flag) => {
    const flags = fullFlags()
    delete flags[flag]
    expect(atFinale(flags).currentCard.value?.id).not.toBe('g-finale-gewu')
  })

  it('当存在诛戮旗标时，不能用齐全技术与数值抵消政治失败', () => {
    expect(atFinale({ ...fullFlags(), exec: 1 }).currentCard.value?.id).not.toBe('g-finale-gewu')
  })

  it.each(['court', 'law', 'army', 'gold'] as const)('当%s恰好达标时准入，低一分或高一分都拒绝', (key) => {
    for (const value of [45, 80]) {
      expect(atFinale(fullFlags(), { ...healthy(), [key]: value }).currentCard.value?.id).toBe('g-finale-gewu')
    }
    for (const value of [44, 81]) {
      expect(atFinale(fullFlags(), { ...healthy(), [key]: value }).currentCard.value?.id).not.toBe('g-finale-gewu')
    }
  })

  it('当民心75时准入，74时不准入；全部合格才能得到格物中兴', () => {
    expect(atFinale(fullFlags(), { ...healthy(), people: 74 }).currentCard.value?.id).not.toBe('g-finale-gewu')
    const game = atFinale(fullFlags(), { ...healthy(), people: 75 })
    expect(game.currentCard.value?.id).toBe('g-finale-gewu')
    const before = { ...game.resources.value }
    game.choose('left')
    expect(game.ending.value?.title).toBe('格物中兴')
    expect(game.resources.value).toEqual(before)
    expect(game.reachedFinale.value).toBe(true)
  })
})

describe('T0 年度损耗与改革收益', () => {
  it('当完成五次抉择时，自然损耗仍为军心与国库各三点', () => {
    const game = useGame()
    game.startGame()
    let army = 0
    let gold = 0
    for (let index = 0; index < 5; index++) {
      game.resources.value = healthy()
      const effect = game.currentCard.value!.right.effects
      game.choose('right')
      army += game.resources.value.army - 60 - (effect.army ?? 0)
      gold += game.resources.value.gold - 60 - (effect.gold ?? 0)
    }
    expect(army).toBe(-3)
    expect(gold).toBe(-3)
  })

  it.each([
    [{ 'gewu-customs': 1, 'gewu-audit': 1 }, 0, -3],
    [{ 'gewu-tools': 1, 'gewu-denglai': 1 }, -3, 0],
  ] as const)('当结构改革达成时，仅抵消对应的自然损耗', (flags, goldLoss, armyLoss) => {
    const game = useGame()
    game.startGame()
    game.flags.value = { ...flags }
    const total = { army: 0, gold: 0 }
    for (let index = 0; index < 5; index++) {
      game.resources.value = healthy()
      const effects = game.currentCard.value!.right.effects
      game.choose('right')
      for (const key of ['army', 'gold'] as const) total[key] += game.resources.value[key] - 60 - (effects[key] ?? 0)
    }
    expect(total).toEqual({ gold: goldLoss, army: armyLoss })
  })

  it('当改革完成但民心仍动乱时，法度和军心的动乱惩罚仍然存在', () => {
    const game = useGame()
    game.startGame()
    game.flags.value = fullFlags()
    const total: Partial<Record<ResourceKey, number>> = { army: 0, law: 0 }
    for (let index = 0; index < 5; index++) {
      game.resources.value = { ...healthy(), people: 15 }
      const effects = game.currentCard.value!.right.effects
      game.choose('right')
      for (const key of ['army', 'law'] as const) total[key]! += game.resources.value[key] - 60 - (effects[key] ?? 0)
    }
    expect(total).toEqual({ army: -3, law: -3 })
  })
})

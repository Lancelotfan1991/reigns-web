import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARDS_PER_YEAR, RESOURCE_KEYS, useGame } from '../../src/composables/useGame'
import { RANDOM_EVENTS, FINALE_EVENTS } from '../../src/data/events'
import { REFORM_FINALES, REFORM_REQUIREMENTS } from '../../src/data/reforms'
import { STANDALONE_EVENTS, STORY_CHAPTERS, STORY_EVENTS } from '../../src/data/chapters'
import type { ResourceKey } from '../../src/types'
import { atFinale, healthy, progressSide, reach, seedRandom } from './helpers'

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
const stages = REFORM_REQUIREMENTS.slice(0, 34).map((flag) => STORY_EVENTS.find((card) =>
  [...(card.left.sets ?? []), ...(card.right.sets ?? [])].includes(flag))!)
const successfulSide = progressSide

describe('T0 连续篇章', () => {
  it('当排入十四篇章时，49步不重叠，章内每一步都有无条件分支', () => {
    expect(STORY_CHAPTERS.map((story) => story.steps.length)).toEqual([4, 3, 4, 4, 4, 5, 3, 3, 3, 3, 3, 3, 3, 4])
    const occupied = new Set<number>()
    for (const story of STORY_CHAPTERS) {
      for (const [step, candidates] of story.steps.entries()) {
        const index = story.start + step
        expect(index).toBeLessThan(85)
        expect(occupied.has(index)).toBe(false)
        occupied.add(index)
        expect(candidates.some((card) => !card.requires?.length && !card.excludes?.length && !card.resourceBounds)).toBe(true)
        for (const card of candidates) {
          expect(card.year).toBe(Math.floor(index / 5))
          expect(card.order).toBe(index % 5 + 1)
          expect(card.left.finale).toBeUndefined()
          expect(card.right.finale).toBeUndefined()
        }
      }
    }
    expect(occupied.size).toBe(49)
    for (const card of STANDALONE_EVENTS) expect(occupied.has(card.year! * 5 + card.order! - 1)).toBe(false)
    expect(new Set(STANDALONE_EVENTS.map((card) => `${card.year}#${card.order}`)).size).toBe(28)
  })

  it.each(STORY_CHAPTERS)('当进入$name时，任意章内选法均连续走到收束，失败也不插随机卡', (story) => {
    for (const withReforms of [false, true]) {
      for (let mask = 0; mask < 2 ** story.steps.length; mask++) {
        const game = useGame()
        game.startGame()
        reach(game, story.start, withReforms ? successfulSide : () => 'right')
        for (let step = 0; step < story.steps.length; step++) {
          expect(game.chapter.value).toEqual({ id: story.id, name: story.name, step: step + 1, total: story.steps.length })
          expect(story.steps[step].map((card) => card.id)).toContain(game.currentCard.value?.id)
          expect(game.currentCard.value?.id.startsWith('r-')).toBe(false)
          expect(game.year.value).toBe(Math.floor((story.start + step) / 5))
          expect(game.turnInYear.value).toBe((story.start + step) % 5 + 1)
          game.resources.value = healthy()
          game.choose(mask & (1 << step) ? 'left' : 'right')
        }
        expect(game.chapter.value?.id).not.toBe(story.id)
        expect(game.decisions.value).toHaveLength(story.start + story.steps.length)
      }
    }
  })

  it('当器院立项不同意时，下一步即时改为本章旧制作法，不会偷发公账成果', () => {
    const accept = useGame()
    const reject = useGame()
    accept.startGame()
    reject.startGame()
    for (const game of [accept, reject]) reach(game, 3, successfulSide)
    accept.choose('left')
    reject.choose('right')
    expect(accept.currentCard.value?.id).toBe('g-budget')
    expect(reject.currentCard.value?.id).not.toBe('g-budget')
    expect(accept.chapter.value).toEqual(reject.chapter.value)
    expect(reject.chapter.value?.step).toBe(2)
    const card = reject.currentCard.value!
    for (const side of ['left', 'right'] as const) expect(card[side].sets ?? []).not.toContain('gewu-budget')
    expect(reject.seenEventIds.value.has('g-budget')).toBe(false)
  })

  it('当在篇章内重开或国势失衡时，不会残留旧篇章或继续发牌', () => {
    const game = useGame()
    game.startGame()
    reach(game, 5, successfulSide)
    expect(game.chapter.value?.step).toBe(3)
    game.startGame()
    expect(game.chapter.value).toBeNull()
    expect(game.currentCard.value?.id).toBe('s-tuogu')
    reach(game, 3, successfulSide)
    game.resources.value = { ...healthy(), gold: 1 }
    game.choose('left')
    expect(game.isOver.value).toBe(true)
    expect(game.chapter.value).toBeNull()
    const count = game.decisions.value.length
    game.choose('right')
    expect(game.decisions.value).toHaveLength(count)
    game.startGame()
    expect(game.chapter.value).toBeNull()
    expect(game.flags.value).toEqual({})
  })
})

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

  it('当卡池最坏情况下缺少改革前置时，随机池仍覆盖每个非篇章空位', () => {
    const unconditional = new Set(STORY_EVENTS
      .filter((card) => !card.requires?.length && !card.excludes?.length && !card.resourceBounds)
      .map((card) => `${card.year}#${card.order}`))
    expect(RANDOM_EVENTS.length).toBeGreaterThanOrEqual(85 - unconditional.size)
    const all = [...STORY_EVENTS, ...RANDOM_EVENTS, ...FINALE_EVENTS, ...REFORM_FINALES]
    expect(new Set(all.map((card) => card.id)).size).toBe(all.length)
    for (const card of all) {
      expect(card.name.length).toBeGreaterThan(0)
      expect(card.text.length).toBeGreaterThan(0)
      for (const side of ['left', 'right'] as const) {
        expect(card[side].label.length).toBeGreaterThan(0)
        for (const [key, value] of Object.entries(card[side].effects)) {
          expect(RESOURCE_KEYS).toContain(key)
          expect(Number.isInteger(value)).toBe(true)
        }
      }
    }
    for (const card of STORY_EVENTS) {
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
    const path = 'LLLLRLLLRRRRRLRLLRRRRRLLLLLLRLLRLLRLRLLRRRLLRRLLLLLRLLRLLRLRLLRRLLLLRLLLRRLLLRLLRLLRRL'
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
    expect(game.resources.value).toEqual({ court: 55, law: 67, army: 57, gold: 51, people: 100 })
  })

  it.each([1, 17, 2026, 1644])('当随机种子为%s时，34项建设和42项条件仍按时提供而不靠抽签', (seed) => {
    vi.restoreAllMocks()
    seedRandom(seed)
    expect(stages).toHaveLength(34)
    expect(REFORM_REQUIREMENTS).toHaveLength(42)
    const game = useGame()
    game.startGame()
    reach(game, 85, successfulSide)
    for (const flag of REFORM_REQUIREMENTS) expect(game.flags.value[flag], flag).toBeGreaterThan(0)
    expect(game.flags.value.exec).toBeUndefined()
    expect(game.currentCard.value?.id).toBe('g-finale-gewu')
  })

  it.each(stages.map((card) => [card.id, card.year! * 5 + card.order! - 1] as const))(
    '当%s选错时，该阶段和完美路线不会补考', (id, index) => {
      const game = useGame()
      game.startGame()
      reach(game, index, successfulSide)
      expect(game.currentCard.value?.id).toBe(id)
      game.resources.value = healthy()
      const lostFlags = game.currentCard.value![successfulSide(id)].sets!
        .filter((flag) => REFORM_REQUIREMENTS.includes(flag))
      game.choose(successfulSide(id) === 'left' ? 'right' : 'left')
      reach(game, 85, successfulSide)
      for (const flag of lostFlags) expect(game.flags.value[flag]).toBeUndefined()
      expect(game.currentCard.value?.id).not.toBe('g-finale-gewu')
      expect(new Set(game.decisions.value.map((decision) => decision.eventId)).size).toBe(85)
    },
  )

  it('当同一建设有互斥变体时，只能在同一个时点获得，不能延后补考', () => {
    for (const flag of REFORM_REQUIREMENTS) {
      const producers = STORY_EVENTS.filter((card) =>
        [...(card.left.sets ?? []), ...(card.right.sets ?? [])].includes(flag))
      expect(producers.length, flag).toBeGreaterThan(0)
      expect(new Set(producers.map((card) => `${card.year}#${card.order}`)).size, flag).toBe(1)
    }
  })

  it.each([
    ['s-wuqiao', 'gewu-denglai'],
    ['g-wuqiao-protect', 'gewu-denglai'],
    ['g-wuqiao-rations', 'gewu-denglai'],
    ['g-shipping-dispute', 'gewu-market'],
    ['s-jinzhou', 'gewu-inspection'],
    ['s-yuan-songjin', 'gewu-inspection'],
    ['s-chuangjiang', 'lz-absorbed'],
    ['g-tool-seals', 'gewu-pump'],
    ['s-xianzhong', 'gewu-settlement'],
    ['g-gucheng-households', 'gewu-settlement'],
    ['g-guanning', 'gewu-frontier'],
    ['g-river-survey', 'gewu-river'],
    ['s-chuanti', 'chuanting-wait'],
    ['g-guanzhong', 'chuanting-wait'],
    ['s-htj', 'gewu-inspection'],
    ['g-capital', 'gewu-succession'],
  ])('当篇章中间步骤%s选择失败时，后续不能补出%s', (id, lostFlag) => {
    const card = STORY_EVENTS.find((event) => event.id === id)!
    const game = useGame()
    game.startGame()
    reach(game, card.year! * 5 + card.order! - 1, successfulSide)
    expect(game.currentCard.value?.id).toBe(id)
    game.resources.value = healthy()
    game.choose(successfulSide(id) === 'left' ? 'right' : 'left')
    reach(game, 85, successfulSide)
    expect(game.flags.value[lostFlag]).toBeUndefined()
    expect(game.currentCard.value?.id).not.toBe('g-finale-gewu')
  })

  it.each(['left', 'right'] as const)('当松锦接济已成并选择%s收束时，有序撤军与轮防均能保军通过验收', (side) => {
    const game = useGame()
    game.startGame()
    const card = STORY_EVENTS.find((event) => event.id === 'g-songjin')!
    reach(game, card.year! * 5 + card.order! - 1, successfulSide)
    expect(game.currentCard.value?.id).toBe('g-songjin')
    game.resources.value = healthy()
    game.choose(side)
    expect(game.flags.value['gewu-songjin']).toBe(1)
    reach(game, 85, successfulSide)
    expect(game.flags.value['gewu-inspection']).toBe(1)
    expect(game.currentCard.value?.id).toBe('g-finale-gewu')
  })

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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCharacters } from '../../src/composables/useCharacters'
import { useGame } from '../../src/composables/useGame'
import { REFORM_EVENTS, REFORM_REQUIREMENTS } from '../../src/data/reforms'
import { CHARACTERS } from '../../src/data/characters'
import { SCRIPT_EVENTS, RANDOM_EVENTS, FINALE_EVENTS } from '../../src/data/events'
import { REFORM_FINALES } from '../../src/data/reforms'
import { atFinale, healthy, reach, seedRandom } from './helpers'

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

const fullFlags = () => Object.fromEntries(REFORM_REQUIREMENTS.map((flag) => [flag, 1]))

describe('T1 改史替换与人物', () => {
  const replacements = REFORM_EVENTS.filter((card) => (card.order ?? 0) <= 3)
  it.each(replacements.map((card) => [card.id, card.year! * 5 + card.order! - 1, card.requires ?? []] as const))(
    '当%s的局部条件成立时，会替换史实卡且不要求整条改革成功', (id, index, requirements) => {
      const game = useGame()
      game.startGame()
      reach(game, index - 1)
      game.flags.value = Object.fromEntries(requirements.map((rule) => typeof rule === 'string' ? [rule, 1] : [rule.flag, rule.min]))
      game.resources.value = healthy()
      game.choose('right')
      expect(game.currentCard.value?.id).toBe(id)
    },
  )

  it('当尚未翻到改革人物事迹时，面板不会显示未来卡片', () => {
    const game = useGame()
    game.startGame()
    const chars = useCharacters(game)
    for (const view of chars.views.value) {
      expect(view.deeds.every((deed) => game.seenEventIds.value.has(deed.eventId))).toBe(true)
      expect(view.deeds.some((deed) => deed.eventId.startsWith('g-'))).toBe(false)
    }
  })

  it('当人物登记事件时，所有引用必须存在且无重复', () => {
    const ids = new Set([...SCRIPT_EVENTS, ...RANDOM_EVENTS, ...FINALE_EVENTS, ...REFORM_EVENTS, ...REFORM_FINALES].map((event) => event.id))
    for (const character of CHARACTERS) {
      expect(new Set(character.events).size).toBe(character.events.length)
      for (const id of character.events) expect(ids.has(id), `${character.name}: ${id}`).toBe(true)
      for (const fate of character.fates ?? []) expect(ids.has(fate.event), `${character.name}: ${fate.event}`).toBe(true)
      for (const track of character.track ?? []) {
        for (const id of track.unlessEvent ?? []) expect(ids.has(id)).toBe(true)
      }
    }
  })

  it('当最后选择收回改革权力时，不会得到盛世，皇帝也不会被误记为死', () => {
    const game = atFinale(fullFlags())
    const chars = useCharacters(game)
    game.choose('right')
    expect(game.ending.value?.title).toBe('器成政退')
    expect(game.ending.value?.kind).toBe('neutral')
    expect(chars.views.value.find((view) => view.char.id === 'emperor')?.status).toBe('alive')
  })
})

describe('T1 旧终章和重开', () => {
  it.each(['left', 'right'] as const)('当仅有局部改革成果并选择%s时，保住朝廷但不能冒充盛世', (side) => {
    const flags = { 'gewu-settlement': 1, 'gewu-frontier': 1 }
    const game = atFinale(flags)
    expect(game.currentCard.value?.id).toBe('g-finale-incomplete')
    game.choose(side)
    expect(game.ending.value?.title).toBe('新政未竟')
    expect(game.ending.value?.survived).toBe(true)
    const weak = atFinale(flags, { ...healthy(), gold: 20 })
    weak.choose(side)
    expect(weak.ending.value?.title).toBe('新政失守')
    expect(weak.ending.value?.description).not.toContain('闯军')
  })

  it('当没有改革条件时，煤山结局仍然可选', () => {
    const game = atFinale({})
    expect(game.currentCard.value?.id).toBe('s-finale')
    game.choose('left')
    expect(game.ending.value?.title).toBe('煤山一棵歪脖树')
  })

  it('当选择南渡时，仍依照原有民心与国势结算', () => {
    const strong = atFinale({})
    strong.choose('right')
    expect(strong.ending.value?.title).toBe('南渡终成局')
    const weak = atFinale({}, { ...healthy(), people: 44 })
    weak.choose('right')
    expect(weak.ending.value?.title).toBe('无根之南')
  })

  it('当仅达成和议与练兵时，仍可进入原有勤王终章', () => {
    const game = atFinale({ 'peace-kept': 1, 'chuanting-wait': 1 })
    expect(game.currentCard.value?.id).toBe('s-finale-restore')
    game.choose('right')
    expect(game.ending.value?.title).toBe('中兴第一')
  })

  it('当重开时，会清除本局状态并保留最好年数', () => {
    const game = atFinale(fullFlags())
    game.choose('left')
    expect(game.bestYears.value).toBe(18)
    game.startGame()
    expect(game.decisions.value).toEqual([])
    expect(game.flags.value).toEqual({})
    expect(game.resources.value).toEqual({ court: 50, law: 50, army: 50, gold: 50, people: 50 })
    expect(game.customsFunded.value).toBe(false)
    expect(game.workshopsSupplied.value).toBe(false)
    expect(game.ending.value).toBeNull()
    expect(game.turnInYear.value).toBe(1)
    expect(game.currentCard.value?.id).toBe('s-tuogu')
    expect(game.bestYears.value).toBe(18)
    expect(game.seenEventIds.value.size).toBe(1)
  })

  it('当已结束后重复点击时，不会增加记录或改写结局', () => {
    const game = atFinale({})
    game.choose('left')
    const ending = game.ending.value
    game.choose('right')
    expect(game.decisions.value).toHaveLength(86)
    expect(game.ending.value).toBe(ending)
  })
})

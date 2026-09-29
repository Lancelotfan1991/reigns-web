import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCharacters } from '../../src/composables/useCharacters'
import { RESOURCE_KEYS, useGame, type Game } from '../../src/composables/useGame'
import { REFORM_REQUIREMENTS, REFORM_FINALES } from '../../src/data/reforms'
import { STORY_EVENTS } from '../../src/data/chapters'
import { CHARACTERS } from '../../src/data/characters'
import { RANDOM_EVENTS, FINALE_EVENTS } from '../../src/data/events'
import type { Side } from '../../src/types'
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

describe('T1 玩家文案', () => {
  it('当展示事件与人物近况时，不会混入旗标或发牌实现说明', () => {
    const cards = [...STORY_EVENTS, ...RANDOM_EVENTS, ...FINALE_EVENTS, ...REFORM_FINALES]
    for (const card of cards) {
      const prose = [card.name, card.text, card.left.label, card.left.response, card.right.label, card.right.response].join(' ')
      expect(prose, card.id).not.toMatch(/旗标|下一张卡|不授予|年度裁决|完整留练成果/)
    }
    for (const character of CHARACTERS) {
      for (const fate of character.fates ?? []) {
        expect(fate.note, `${character.id}: ${fate.event}`).not.toMatch(/旗标|下一张卡|不授予|完整留练成果|不因此倒补/)
      }
    }
  })

  it('当阅读伤兵抚恤事件时，两侧明确区分拨粮与关卡收费，原有代价不变', () => {
    const card = RANDOM_EVENTS.find((event) => event.id === 'r-shangbing')!
    expect(card.text).toContain('向过路商旅收费')
    expect(card.left.label).toBe('拨粮抚恤伤兵')
    expect(card.right.label).toBe('派往关卡收费')
    expect(card.left.effects).toEqual({ gold: -5, army: 5, court: -2 })
    expect(card.right.effects).toEqual({ gold: 3, army: -4, people: -2, law: 2 })
  })
})

describe('T1 改史替换与人物', () => {
  const replacements = STORY_EVENTS.filter((card) => [
    'g-wuqiao', 'g-revenue', 'g-recruit', 'g-gucheng', 'g-jinzhou', 'g-epidemic',
    'g-kaifeng', 'g-capital', 'g-songjin', 'g-guanning', 'g-guanzhong', 'g-peace', 'g-peace-ratify',
  ].includes(card.id))
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
    const ids = new Set([...STORY_EVENTS, ...RANDOM_EVENTS, ...FINALE_EVENTS, ...REFORM_FINALES].map((event) => event.id))
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
    expect(game.resources.value).toEqual({ court: 50, law: 40, army: 45, gold: 35, people: 45 })
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

describe('T1 批红单页', () => {
  it('当裁决一议时，批红记录该议的题签、批语、纪年与净变化', () => {
    const game = useGame()
    game.startGame()
    reach(game, 3)
    const card = game.currentCard.value!
    expect(card.id).toBe('g-institute')
    const before = { ...game.resources.value }
    game.choose('left')
    const verdict = game.verdict.value!
    expect(verdict.cardName).toBe(card.name)
    expect(verdict.choiceLabel).toBe(card.left.label)
    expect(verdict.response).toBe(card.left.response)
    expect(verdict.when).toBe('天启七年（1627） 第 4 / 5 议')
    expect(verdict.chapter).toEqual({ name: '器院立局', step: 1, total: 4 })
    expect(verdict.ended).toBe(false)
    expect(verdict.lines).toEqual(RESOURCE_KEYS
      .filter((key) => before[key] !== game.resources.value[key])
      .map((key) => ({ key, from: before[key], to: game.resources.value[key] })))
    expect(verdict.lines.length).toBeGreaterThan(0)
    expect(verdict.cardName).not.toBe(game.currentCard.value!.name)
  })

  it('当一议使国库归零时，批红标记国运已定并列出归零项', () => {
    const game = useGame()
    game.startGame()
    reach(game, 3)
    game.resources.value = { ...healthy(), gold: 1 }
    game.choose('left')
    const verdict = game.verdict.value!
    expect(game.isOver.value).toBe(true)
    expect(verdict.ended).toBe(true)
    expect(verdict.lines).toContainEqual({ key: 'gold', from: 1, to: 0 })
  })

  it('当读完批红时，只翻回决策页而不改写国势', () => {
    const game = useGame()
    game.startGame()
    reach(game, 3)
    game.choose('left')
    const settled = { ...game.resources.value }
    game.dismissVerdict()
    expect(game.verdict.value).toBeNull()
    expect(game.resources.value).toEqual(settled)
  })

  it('当史实终章没有批红文字时，不会留下上一议的批红', () => {
    const game = atFinale({})
    expect(game.currentCard.value?.id).toBe('s-finale')
    expect(game.verdict.value).not.toBeNull()
    game.choose('left')
    expect(game.verdict.value).toBeNull()
    expect(game.ending.value?.title).toBe('煤山一棵歪脖树')
  })

  it('当改史终章被裁决时，批红记为甲申终章且国势未动', () => {
    const game = atFinale({ 'gewu-settlement': 1, 'gewu-frontier': 1 })
    game.dismissVerdict()
    const card = game.currentCard.value!
    expect(card.id).toBe('g-finale-incomplete')
    game.choose('left')
    const verdict = game.verdict.value!
    expect(verdict.when).toContain('甲申终章')
    expect(verdict.response).toBe(card.left.response)
    expect(verdict.lines).toEqual([])
    expect(verdict.ended).toBe(true)
  })

  it('当重开新一局时，未读的批红被清除', () => {
    const game = useGame()
    game.startGame()
    reach(game, 3)
    game.choose('left')
    expect(game.verdict.value).not.toBeNull()
    game.startGame()
    expect(game.verdict.value).toBeNull()
  })
})

describe('T1 宫门定策四档', () => {
  /** 走完开篇前两步，停在拿人的第三步 */
  const toArrest = (first: Side, second: Side) => {
    const game = useGame()
    game.startGame()
    game.choose(first)
    game.choose(second)
    return game
  }
  const weiView = (game: Game) => {
    const view = useCharacters(game).views.value.find((item) => item.char.id === 'wei')
    return { status: view?.status, note: view?.note ?? '', deeds: view?.deeds.map((deed) => deed.eventId) ?? [] }
  }
  /** 只把逆案裁在“止坐首恶”，其余各议按需要选 */
  const narrowVerdict = (id: string): Side => id === 's-ni-an' ? 'left' : 'right'

  it.each([
    ['right', 'right', 's-wei', '换过九门钥匙再焚册警省：门内有人、名分已定，逮牌照章程出宫'],
    ['left', 'right', 's-wei-rash', '受玺即位仍让他掌厂卫：只能靠京营当值硬办，成算打折'],
    ['left', 'left', 's-wei-rash', '连辞爵都未慰留，军心尚在，仍可连夜逼他出京'],
    ['right', 'left', 's-wei-failed', '焚册折了京营当值：军心已溃，缇骑出不了城门'],
  ] as const)('当开局依次选%s、%s时，第三步发出%s（%s）', (first, second, id, why) => {
    const game = toArrest(first, second)
    expect(why.length).toBeGreaterThan(0)
    expect(game.chapter.value).toEqual({ id: 'wei', name: '宫门定策', step: 3, total: 3 })
    expect(game.currentCard.value?.id).toBe(id)
  })

  it('当凤阳与逮牌同名两档时，稳杀不欠人情、险胜必欠人情', () => {
    const steady = toArrest('right', 'right')
    const goldBefore = steady.resources.value.gold
    steady.choose('left')
    expect(steady.currentCard.value?.id).toBe('g-institute')
    expect(steady.flags.value).toEqual({ 'wei-watched': 2, 'wei-soothed': 1, 'wei-down': 1 })
    expect(steady.resources.value.gold - goldBefore).toBe(12)

    const rash = toArrest('left', 'right')
    rash.choose('left')
    expect(rash.flags.value['wei-down']).toBe(1)
    expect(rash.flags.value['eunuch-debt']).toBe(1)
  })

  it('当法度与军心都不足四十又未曾焚册时，第三步落到中止且仍以未遂收束', () => {
    const game = useGame()
    game.startGame()
    game.choose('left')
    game.resources.value = { ...healthy(), law: 41, army: 37 }
    game.choose('right')
    expect(game.flags.value.warned).toBeUndefined()
    expect(game.currentCard.value?.id).toBe('s-wei-stalled')
    const stalled = game.currentCard.value!
    for (const side of ['left', 'right'] as const) expect(stalled[side].sets).toContain('wei-failed')
    game.choose('left')
    expect(game.flags.value['wei-failed']).toBe(1)
    expect(game.flags.value['wei-down']).toBeUndefined()
  })

  it.each(['left', 'right'] as const)('当逮牌未遂并选择%s时，魏忠贤照旧在任，史实一节被改写', (side) => {
    const game = toArrest('right', 'left')
    expect(game.currentCard.value?.id).toBe('s-wei-failed')
    game.choose(side)
    expect(game.flags.value['wei-failed']).toBe(1)
    const wei = weiView(game)
    expect(wei.status).toBe('alive')
    expect(wei.note).not.toContain('阜城')
    expect(wei.deeds).toContain('s-wei-failed')
  })

  it('当逮牌未遂但军心未至绝境时，崇祯三年不发再举之请', () => {
    const game = toArrest('right', 'left')
    game.choose('left')
    reach(game, 18, narrowVerdict)
    game.resources.value = { ...healthy(), army: 50 }
    game.choose('right')
    expect(game.decisions.value).toHaveLength(19)
    expect(game.currentCard.value?.id).not.toBe('s-wei-coup')
  })

  it('当再举之请选夜合宫门时，当年即入宫门之变而不拖到甲申', () => {
    const game = toArrest('right', 'left')
    game.choose('left')
    reach(game, 18, narrowVerdict)
    game.resources.value = { ...healthy(), army: 30 }
    game.choose('right')
    expect(game.currentCard.value?.id).toBe('s-wei-coup')
    expect(game.year.value).toBe(3)
    expect(game.turnInYear.value).toBe(5)
    game.choose('left')
    expect(game.isOver.value).toBe(true)
    expect(game.ending.value?.title).toBe('宫门之变')
    expect(game.ending.value?.kind).toBe('doom')
    expect(game.ending.value?.survived).toBeUndefined()
    expect(game.decisions.value).toHaveLength(20)
    expect(game.reignedYears.value).toBe(4)
    expect(weiView(game).status).toBe('alive')
    expect(game.chapter.value).toBeNull()
    game.startGame()
    expect(game.flags.value).toEqual({})
    expect(game.currentCard.value?.id).toBe('s-tuogu')
  })

  it('当再举之请选收手时，欠下的人情在崇祯八年变成监军之请', () => {
    const game = toArrest('right', 'left')
    game.choose('left')
    reach(game, 18, narrowVerdict)
    game.resources.value = { ...healthy(), army: 30 }
    game.choose('right')
    game.choose('right')
    expect(game.flags.value['eunuch-debt']).toBe(1)
    expect(game.currentCard.value?.id).not.toBe('s-ni-an')
    reach(game, 40, narrowVerdict)
    game.resources.value = healthy()
    game.choose('right')
    expect(game.currentCard.value?.id).toBe('c-eunuch-marshal-owed')
    expect(game.currentCard.value?.text).toContain('落闸开门')
  })

  it('当魏忠贤已诛而逆案扩大时，监军之请以部院无人任事为由头', () => {
    const game = toArrest('right', 'right')
    game.choose('left')
    reach(game, 19, narrowVerdict)
    expect(game.currentCard.value?.id).toBe('s-ni-an')
    expect(game.flags.value['eunuch-debt']).toBeUndefined()
    game.resources.value = healthy()
    game.choose('right')
    expect(game.flags.value['ni-an-broad']).toBe(1)
    reach(game, 40, narrowVerdict)
    game.resources.value = healthy()
    game.choose('right')
    expect(game.currentCard.value?.id).toBe('c-eunuch-marshal-empty')
    expect(game.currentCard.value?.text).toContain('二百五十多人')
    expect(weiView(game).note).toContain('逆案定二百五十余人')
  })

  it('当两种由头同时存在时，只发欠人情的那一张', () => {
    const game = useGame()
    game.startGame()
    reach(game, 40, narrowVerdict)
    game.flags.value = { ...game.flags.value, 'eunuch-debt': 1, 'ni-an-broad': 1 }
    game.resources.value = healthy()
    game.choose('right')
    expect(game.currentCard.value?.id).toBe('c-eunuch-marshal-owed')
  })

  it('当逆案止坐首恶时，崇祯八年没有中官监军之请', () => {
    const game = toArrest('right', 'right')
    game.choose('left')
    reach(game, 19, narrowVerdict)
    game.resources.value = healthy()
    game.choose('left')
    expect(game.flags.value['ni-an-broad']).toBeUndefined()
    reach(game, 40, narrowVerdict)
    game.resources.value = healthy()
    game.choose('right')
    expect(game.currentCard.value?.id).not.toMatch(/^c-eunuch-marshal/)
  })

  it('当只换九门钥匙而慰留魏忠贤时，两步都记在旗标上而不靠人名说破', () => {
    const game = toArrest('right', 'right')
    expect(Object.keys(game.flags.value).sort()).toEqual(['wei-soothed', 'wei-watched'])
    expect(game.resources.value).toEqual({ court: 40, law: 44, army: 46, gold: 26, people: 47 })
  })
})

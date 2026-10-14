import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCharacters } from '../../src/composables/useCharacters'
import { useGame, type Game } from '../../src/composables/useGame'
import { ALL_EVENTS } from '../../src/data/chapters'
import { CHARACTERS } from '../../src/data/characters'
import { RANDOM_EVENTS } from '../../src/data/events'
import type { Side } from '../../src/types'
import { healthy, reach, seedRandom, slotOf } from './helpers'

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

describe('T1 玩家文案', () => {
  it('当展示事件与人物近况时，不会混入旗标或发牌实现说明', () => {
    const cards = [...ALL_EVENTS, ...RANDOM_EVENTS]
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
  const replacements = ALL_EVENTS.filter((card) => [
    'g-wuqiao', 'g-revenue', 'g-recruit', 'g-gucheng', 'g-jinzhou', 'g-epidemic',
    'g-kaifeng', 'g-capital', 'g-songjin', 'g-guanning', 'g-guanzhong', 'g-peace', 'g-peace-ratify',
  ].includes(card.id))

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
    const ids = new Set([...ALL_EVENTS, ...RANDOM_EVENTS].map((event) => event.id))
    for (const character of CHARACTERS) {
      expect(new Set(character.events).size).toBe(character.events.length)
      for (const id of character.events) expect(ids.has(id), `${character.name}: ${id}`).toBe(true)
      for (const fate of character.fates ?? []) expect(ids.has(fate.event), `${character.name}: ${fate.event}`).toBe(true)
      for (const track of character.track ?? []) {
        for (const id of track.unlessEvent ?? []) expect(ids.has(id)).toBe(true)
      }
    }
  })
})

describe('T1 批红单页', () => {

  it('当一议使国库归零时，批红标记国运已定并列出归零项', () => {
    const game = useGame()
    game.startGame()
    reach(game, slotOf('g-institute'))
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
    reach(game, slotOf('g-institute'))
    game.choose('left')
    const settled = { ...game.resources.value }
    game.dismissVerdict()
    expect(game.verdict.value).toBeNull()
    expect(game.resources.value).toEqual(settled)
  })

  it('当重开新一局时，未读的批红被清除', () => {
    const game = useGame()
    game.startGame()
    reach(game, slotOf('g-institute'))
    game.choose('left')
    expect(game.verdict.value).not.toBeNull()
    game.startGame()
    expect(game.verdict.value).toBeNull()
  })
})

describe('T1 宫门定策四档', () => {
  /** 走完魏忠贤篇章前七步（中段默认 RLLRL），第八步即「发落司礼监」 */
  const toArrest = (first: Side, second: Side, mid = 'RLLRL') => {
    const game = useGame()
    game.startGame()
    game.choose(first)  // Step 0: s-tuogu
    game.choose(second) // Step 1: s-dianjianglu
    for (const side of mid) game.choose(side === 'L' ? 'left' : 'right') // Step 2-6
    return game
  }
  const weiView = (game: Game) => {
    const view = useCharacters(game).views.value.find((item) => item.char.id === 'wei')
    return { status: view?.status, note: view?.note ?? '', deeds: view?.deeds.map((deed) => deed.eventId) ?? [] }
  }
  /** 只把逆案裁在“止坐首恶”，其余各议按需要选 */
  const narrowVerdict = (id: string): Side => id === 's-ni-an' ? 'left' : 'right'

  it.each([
    ['left', 'right', 'LRRLL', 's-wei-rash', '玉玺照接、钥匙未换：法度耗到四十以下送不进衙门，只靠京营连夜硬办'],
    ['left', 'left', 'RLLRL', 's-wei-failed', '受玺即放权、当众焚册也救不回军心：牌票没人肯领，京营当值称病'],
    ['right', 'left', 'RLLRL', 's-wei-failed', '钥匙虽换，焚册折了京营当值：军心只剩三十余，缇骑出不了城门'],
  ] as const)('当开局依次选%s、%s、中段%s 时，第八步发出%s（%s）', (first, second, mid, id, why) => {
    const game = toArrest(first, second, mid)
    expect(why.length).toBeGreaterThan(0)
    expect(game.chapter.value).toEqual({ id: 'wei', name: '宫门定策', step: 8, total: 8 })
    expect(game.currentCard.value?.id).toBe(id)
  })

  it('当九门钥匙未换、焚册未行而军心不足四十时，第八步落到中止且仍以未遂收束', () => {
    const game = useGame()
    game.startGame()
    game.choose('left')  // Step 0: s-tuogu left - no wei-watched
    game.choose('right') // Step 1: s-dianjianglu right - sets wei-soothed, wei-watched
    // 清除 wei-watched 以模拟九门钥匙未曾换过、名分却已定的情形
    game.flags.value = { ...game.flags.value, 'wei-watched': undefined }
    game.resources.value = { ...healthy(), law: 41, army: 37 }
    game.choose('right') // Step 2: s-gongnv
    game.choose('left')  // Step 3: s-kesi
    game.choose('left')  // Step 4: s-cui
    game.choose('right') // Step 5: s-wangtiqian
    game.choose('right') // Step 6: s-impeach-wei 留中不发，不落逮牌
    expect(game.flags.value.warned).toBeUndefined()
    expect(game.currentCard.value?.id).toBe('s-wei-stalled')
    const stalled = game.currentCard.value!
    for (const side of ['left', 'right'] as const) expect(stalled[side].sets).toContain('wei-failed')
    game.choose('left')
    expect(game.flags.value['wei-failed']).toBe(2)
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
    reach(game, slotOf('s-ni-an') - 1, narrowVerdict)
    game.resources.value = { ...healthy(), army: 50 }
    game.choose('right')
    expect(game.decisions.value).toHaveLength(slotOf('s-ni-an'))
    expect(game.currentCard.value?.id).not.toBe('s-wei-coup')
  })

  it('当逆案止坐首恶时，崇祯八年没有中官监军之请', () => {
    const game = toArrest('right', 'right')
    game.choose('left')
    reach(game, slotOf('s-ni-an'), narrowVerdict)
    game.resources.value = healthy()
    game.choose('left')
    expect(game.flags.value['ni-an-broad']).toBeUndefined()
    reach(game, slotOf('c-eunuch-marshal-owed') - 1, narrowVerdict)
    game.resources.value = healthy()
    game.choose('right')
    expect(game.currentCard.value?.id).not.toMatch(/^c-eunuch-marshal/)
  })

  it('当第三步发落司礼监时，崔呈秀与逮牌都已在前面交代过', () => {
    const byId = new Map(ALL_EVENTS.map((event) => [event.id, event]))
    expect(byId.get('s-dianjianglu')!.text).toContain('崔呈秀')
    for (const id of ['s-wei', 's-wei-rash', 's-wei-failed', 's-wei-stalled']) {
      expect(byId.get(id)!.text, id).toContain('逮牌')
      expect(byId.get(id)!.text, id).toContain('牌票')
    }
    for (const id of ['s-wei', 's-wei-rash']) {
      expect(byId.get(id)!.text, id).toContain('崔呈秀')
    }
  })

  it('当档名改为发落司礼监时，凤阳只作本朝成例而不冒充选项', () => {
    const byId = new Map(ALL_EVENTS.map((event) => [event.id, event]))
    for (const id of ['s-wei', 's-wei-rash']) expect(byId.get(id)!.name, id).toBe('发落司礼监')
    const steady = byId.get('s-wei')!
    expect(steady.text).toContain('凤阳')
    for (const side of ['left', 'right'] as const) expect(steady[side].label, side).not.toContain('凤阳')
  })
})

describe('T1 人物前情', () => {
  const byId = new Map(ALL_EVENTS.map((event) => [event.id, event]))
  const charById = new Map(CHARACTERS.map((char) => [char.id, char]))

  it('当孙传庭第一次出场时点名其人，并在入狱前交代与中枢的用兵之争', () => {
    expect(byId.get('s-chuangjiang')!.text).toContain('孙传庭')
    expect(byId.get('s-chuangjiang')!.text).toContain('秦兵')
  })

  it('当孙传庭在崇祯十五年仍在狱中时，正文须写明入援获罪、削籍下狱的原委', () => {
    const text = byId.get('s-chuanti')!.text
    expect(text).toContain('墙子岭')
    expect(text).toContain('下狱')
    expect(text).toContain('诏狱')
    const notes = (charById.get('sunchuanting')!.track ?? []).map((t) => t.note).join(' ')
    expect(notes).toContain('下诏狱')
    expect(notes).toContain('墙子岭')
  })

  it('当谷城受抚之局开场时，张献忠的起事与熊文灿的身份都已交代', () => {
    const text = byId.get('s-xianzhong')!.text
    expect(text).toContain('崇祯三年')
    expect(text).toContain('米脂')
    expect(text).toContain('熊文灿')
    expect(text).toContain('五省总督')
  })

  it('当杨嗣昌提出十面之网时，张献忠已先于谷城一局被点名', () => {
    expect(byId.get('s-annei')!.text).toContain('张献忠')
    const zhang = charById.get('zhangxianzhong')!
    expect((zhang.track ?? []).map((t) => t.note).join(' ')).toContain('米脂')
  })

  it('当崇祯十年以后查看人物面板时，熊文灿已因受命主抚而先期登场', () => {
    const xiong = charById.get('xiongwenchan')!
    expect(xiong.appearYear).toBe(10)
    expect((xiong.track ?? []).some((t) => t.year === 10 && t.note.includes('招抚'))).toBe(true)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCharacters } from '../../src/composables/useCharacters'
import { CARDS_PER_YEAR, useGame, type Game } from '../../src/composables/useGame'
import { CHARACTERS, CHAR_MAP } from '../../src/data/characters'
import { STORY_EVENTS } from '../../src/data/chapters'
import { FINALE_EVENTS, RANDOM_EVENTS } from '../../src/data/events'
import { REFORM_FINALES, REFORM_REQUIREMENTS } from '../../src/data/reforms'
import type { Side } from '../../src/types'
import { healthy, progressSide, reach, seedRandom } from '../game/helpers'

const sides: Side[] = ['left', 'right']
const allCards = [...STORY_EVENTS, ...RANDOM_EVENTS, ...FINALE_EVENTS, ...REFORM_FINALES]
const cards = new Map(allCards.map((card) => [card.id, card]))
type Overrides = Partial<Record<string, Side>>

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

function start() {
  const game = useGame()
  game.startGame()
  return game
}

function indexOf(id: string) {
  const card = cards.get(id)
  if (card?.year === undefined || card.order === undefined) throw new Error(`Missing canonical card: ${id}`)
  return card.year * CARDS_PER_YEAR + card.order - 1
}

function toCard(game: Game, id: string, overrides: Overrides = {}) {
  reach(game, indexOf(id), (event) => overrides[event] ?? progressSide(event))
  expect(game.currentCard.value?.id).toBe(id)
}

function toYear(game: Game, year: number, overrides: Overrides = {}) {
  reach(game, year * CARDS_PER_YEAR, (id) => overrides[id] ?? progressSide(id))
}

function pending(game: Game, id: string, event: string) {
  expect(character(game, id).deeds).toContainEqual(expect.objectContaining({
    eventId: event, year: cards.get(event)!.year, side: null, label: '待裁决',
  }))
}

function choose(game: Game, side: Side) {
  game.resources.value = healthy()
  game.choose(side)
}

function character(game: Game, id: string) {
  const view = useCharacters(game).views.value.find((item) => item.char.id === id)
  if (!view) throw new Error(`Unknown character: ${id}`)
  return view
}

function expectFate(game: Game, id: string, event: string, side: Side) {
  const fate = CHAR_MAP[id].fates?.find((item) => item.event === event && item.side === side)
  expect(fate, `${id}: ${event}/${side}`).toBeDefined()
  expect(character(game, id)).toMatchObject({ status: fate?.status, note: fate?.note })
}

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

  it('当改革卡尚未出现时不展示事迹，翻开后显示待裁决，选择后使用真实年与标签', () => {
    const game = start()
    const chars = useCharacters(game)
    expect(character(game, 'xuguangqi')).toMatchObject({ status: 'hidden', appearYear: null, deeds: [] })
    toCard(game, 'g-institute')
    expect(character(game, 'xuguangqi')).toMatchObject({ status: 'alive', appearYear: cards.get('g-institute')!.year })
    pending(game, 'xuguangqi', 'g-institute')
    expect(character(game, 'xuguangqi').deeds.some((deed) => deed.eventId === 'g-seeds')).toBe(false)
    choose(game, 'left')
    expect(character(game, 'xuguangqi').deeds[0]).toMatchObject({
      year: cards.get('g-institute')!.year, side: 'left', label: cards.get('g-institute')!.left.label,
    })
    expect(character(game, 'emperor').deeds.some((deed) => deed.eventId === 'g-institute')).toBe(true)
    for (const view of chars.views.value) {
      expect(view.deeds.every((deed) => game.seenEventIds.value.has(deed.eventId))).toBe(true)
    }
  })

  it.each(sides)('当徐光启遗稿卡选择%s时，1633自然病故不被事迹复生', (side) => {
    const game = start()
    toCard(game, 'g-audit')
    expect(character(game, 'xuguangqi').status).toBe('alive')
    toCard(game, 'g-manuals')
    expect(character(game, 'xuguangqi')).toMatchObject({ status: 'dead', age: 72 })
    pending(game, 'xuguangqi', 'g-manuals')
    choose(game, side)
    toYear(game, 17)
    const xu = character(game, 'xuguangqi')
    expect(xu).toMatchObject({ status: 'dead', age: 72 })
    expect(xu.note).toContain('崇祯六年卒于官')
    for (const event of ['g-institute', 'g-seeds', 'g-manuals']) {
      expect(xu.deeds).toContainEqual(expect.objectContaining({ eventId: event, year: cards.get(event)!.year }))
    }
  })

  it.each(sides)('当太子继承章程选择%s时，登记东宫1643事迹', (side) => {
    const game = start()
    toCard(game, 'g-succession')
    pending(game, 'taizi', 'g-succession')
    choose(game, side)
    expectFate(game, 'taizi', 'g-succession', side)
  })

  it.each(sides)('当1636擒获高迎祥待裁决并选择%s时，不提前记为1635已死', (side) => {
    const game = start()
    toCard(game, 's-chuangjiang')
    expect(character(game, 'gaoyingsiang').status).toBe('alive')
    pending(game, 'gaoyingsiang', 's-chuangjiang')
    expect(game.year.value).toBe(9)
    choose(game, side)
    expectFate(game, 'gaoyingsiang', 's-chuangjiang', side)
  })
})

describe('T1 失败候选的真实人物事迹', () => {
  const routes: { event: string; participants: string[]; overrides: Overrides }[] = [
    { event: 'c-yuan-rumour-outside', participants: ['yuanchonghuan'], overrides: { 's-jisi': 'right' } },
    { event: 'c-wuqiao-protect-scattered', participants: ['sunyuanhua', 'gongsha'], overrides: { 'g-artisans': 'right' } },
    { event: 'c-wuqiao-rations-emergency', participants: ['sunyuanhua', 'kongyoude'], overrides: { 's-wuqiao': 'right' } },
    { event: 'c-shipping-charterless', participants: ['zhengzhilong'], overrides: { 'g-review': 'left' } },
    { event: 'c-shipping-customs-port', participants: ['zhengzhilong'], overrides: { 'g-shipping': 'right' } },
    { event: 'c-shipping-audit-receipts', participants: ['zhengzhilong'], overrides: { 'g-customs': 'left' } },
    { event: 'c-shipping-dispute-private', participants: ['zhengzhilong'], overrides: { 'g-customs': 'left' } },
    { event: 'c-guanning-escort-only', participants: ['wusanggui', 'zadashou'], overrides: { 'g-command': 'left' } },
    { event: 'c-jinzhou-supply-broken', participants: ['hongchou', 'zadashou'], overrides: { 'g-guanning': 'right' } },
    { event: 'c-chaoxian-limited-fleet', participants: ['huangtaiji'], overrides: { 'g-wuqiao': 'right' } },
    { event: 'c-capital-partial-backup', participants: ['wangchengen'], overrides: { 'g-inspection': 'right' } },
    { event: 'c-succession-unfinished', participants: ['taizi'], overrides: { 'g-capital': 'left' } },
  ]
  it.each(routes)('当实际前置失败发出$event时，双方选择都登记参与者而不漏卡', ({ event, participants, overrides }) => {
    for (const side of sides) {
      const game = start()
      toCard(game, event, overrides)
      for (const id of participants) pending(game, id, event)
      choose(game, side)
      for (const id of participants) {
        expect(character(game, id).deeds).toContainEqual(expect.objectContaining({
          eventId: event, side, year: cards.get(event)!.year, label: cards.get(event)![side].label,
        }))
      }
    }
  })
})

describe('T1 保匠、海贸与军政局部成果', () => {
  it.each(sides)('当1631吴桥初报选择%s时，孙元化与公沙不当场死亡', (side) => {
    const game = start()
    toCard(game, 's-wuqiao')
    for (const id of ['sunyuanhua', 'gongsha', 'kongyoude']) {
      pending(game, id, 's-wuqiao')
      expect(character(game, id).status).toBe('alive')
    }
    choose(game, side)
    for (const id of ['sunyuanhua', 'gongsha', 'kongyoude']) expectFate(game, id, 's-wuqiao', side)
    expect(game.year.value).toBe(4)
  })

  it.each(sides)('当吴桥收束选择%s时，保匠成果不因后续改革失败而消失', (side) => {
    const game = start()
    toCard(game, 'g-wuqiao')
    expect(game.decisionByEvent.value['s-wuqiao']).toBeDefined()
    for (const id of ['sunyuanhua', 'gongsha', 'kongyoude']) pending(game, id, 'g-wuqiao')
    choose(game, side)
    expect(game.flags.value['gewu-denglai'] ?? 0).toBe(side === 'left' ? 1 : 0)
    toYear(game, 17, { 'g-shipping': 'right' })
    for (const id of ['sunyuanhua', 'gongsha', 'kongyoude']) {
      expectFate(game, id, 'g-wuqiao', side)
      expect(character(game, id).status).toBe('alive')
      expect(character(game, id).note).not.toMatch(/史实：浮海|炮匠随之北去|已死狱中/)
    }
  })

  it('当没有保匠改革时，孙元化1632、公沙与孔有德1633旧史仍保留', () => {
    const game = start()
    reach(game, indexOf('s-wuqiao'), () => 'right')
    expect(game.currentCard.value?.id).toBe('s-wuqiao')
    choose(game, 'left')
    expect(character(game, 'sunyuanhua').status).toBe('alive')
    expect(character(game, 'gongsha').status).toBe('alive')
    reach(game, indexOf('g-wuqiao') + 1, () => 'right')
    expect(game.year.value).toBe(5)
    expect(character(game, 'sunyuanhua').status).toBe('dead')
    expect(character(game, 'gongsha').status).toBe('alive')
    expect(character(game, 'kongyoude').note).not.toContain('史实：浮海')
    reach(game, 6 * CARDS_PER_YEAR, () => 'right')
    expect(character(game, 'gongsha').status).toBe('dead')
    expect(character(game, 'kongyoude').note).toMatch(/投后金|归建州/)
  })

  it.each(sides)('当1632补粮卡待决且保匠选择为%s时，不提前判孙元化死亡或安全结案', (side) => {
    const game = start()
    toCard(game, 'g-wuqiao-protect')
    choose(game, side)
    toCard(game, 'g-wuqiao-rations')
    expect(game.year.value).toBe(5)
    pending(game, 'sunyuanhua', 'g-wuqiao-rations')
    expectFate(game, 'sunyuanhua', 's-wuqiao', 'left')
    expect(character(game, 'sunyuanhua').status).toBe('alive')
    expect(game.flags.value['wuqiao-artisans-safe'] ?? 0).toBe(side === 'left' ? 1 : 0)
    expect(game.decisionByEvent.value['g-wuqiao']).toBeUndefined()
    expect(game.decisionByEvent.value['c-wuqiao-artisans']).toBeUndefined()
  })

  const artisanRoutes: { scattered: boolean; side: Side }[] = [false, true].flatMap((scattered) =>
    sides.map((side) => ({ scattered, side })))
  it.each(artisanRoutes)('当局部保匠（散匠=$scattered）收束选择$side时，保孙与公沙但不抹去孔投金', ({ scattered, side }) => {
    const game = start()
    const overrides: Overrides = scattered
      ? { 'g-artisans': 'right', 'c-wuqiao-protect-scattered': 'left' }
      : { 'g-wuqiao-rations': 'right' }
    toCard(game, 'c-wuqiao-artisans', overrides)
    expect(game.flags.value['wuqiao-artisans-safe']).toBe(1)
    expect(game.flags.value['gewu-denglai']).toBeUndefined()
    for (const id of ['sunyuanhua', 'gongsha', 'kongyoude']) pending(game, id, 'c-wuqiao-artisans')
    choose(game, side)
    for (const id of ['sunyuanhua', 'gongsha']) expectFate(game, id, 'c-wuqiao-artisans', side)
    toYear(game, 6)
    expect(character(game, 'kongyoude').note).toContain('投后金')
    toYear(game, 17)
    for (const id of ['sunyuanhua', 'gongsha']) {
      expectFate(game, id, 'c-wuqiao-artisans', side)
      expect(character(game, id).status).toBe('alive')
    }
    expect(game.flags.value['wuqiao-artisans-safe']).toBe(1)
    expect(game.flags.value['gewu-denglai']).toBeUndefined()
    expect(character(game, 'kongyoude').note).toContain('投后金')
  })

  it.each(sides)('当无保匠的损失收束选择%s时，孙依查损裁决生死而公沙与孔保留1633旧史', (side) => {
    const game = start()
    toCard(game, 'c-wuqiao-losses', { 'g-wuqiao-protect': 'right' })
    for (const id of ['sunyuanhua', 'gongsha', 'kongyoude']) pending(game, id, 'c-wuqiao-losses')
    expect(character(game, 'sunyuanhua').status).toBe('alive')
    choose(game, side)
    expectFate(game, 'sunyuanhua', 'c-wuqiao-losses', side)
    expect(character(game, 'sunyuanhua').status).toBe(side === 'left' ? 'alive' : 'dead')
    expect(character(game, 'gongsha').status).toBe('alive')
    expect(game.flags.value['wuqiao-artisans-safe']).toBeUndefined()
    toYear(game, 6)
    expect(character(game, 'gongsha')).toMatchObject({ status: 'dead', age: 54 })
    expect(character(game, 'kongyoude').note).toContain('投后金')
    toYear(game, 17)
    expectFate(game, 'sunyuanhua', 'c-wuqiao-losses', side)
    if (side === 'right') expect(character(game, 'sunyuanhua').age).toBe(52)
  })

  it.each(sides)('当海运选择%s时，区分契约与独占，料罗湾不推翻已定契约', (side) => {
    const game = start()
    toCard(game, 'g-shipping')
    choose(game, side)
    expectFate(game, 'zhengzhilong', 'g-shipping', side)
    expect(game.flags.value['gewu-shipping'] ?? 0).toBe(side === 'left' ? 1 : 0)
    expect(character(game, 'zhengzhilong').note).toContain(side === 'left' ? '无独占权' : '航路独占')
    toYear(game, 6)
    expect(character(game, 'zhengzhilong').note).toContain('料罗湾')
    expect(character(game, 'zhengzhilong').note).not.toMatch(/朝廷不能制|只能用他/)
    expect(CHAR_MAP.zhengzhilong.events).not.toContain('g-market')
  })

  it.each(sides)('当海税选择%s时，郑芝龙仍遵守非独占承运契约', (side) => {
    const game = start()
    toCard(game, 'g-customs')
    choose(game, side)
    expectFate(game, 'zhengzhilong', 'g-customs', side)
    expect(game.flags.value['gewu-shipping']).toBe(1)
    expect(character(game, 'zhengzhilong').note).toMatch(/别商承运|非独占契约/)
  })

  it('当契约成立后再遇漕粮海运时，单批运输不改既定航路契约', () => {
    // 两次洗牌后，第六个随机事件落在实际 R 槽 38，不篡改卡组或决策。
    seedRandom(3)
    const game = start()
    toCard(game, 'g-shipping')
    choose(game, 'left')
    reach(game, 38, progressSide)
    expect(game.chapter.value).toBeNull()
    expect(game.currentCard.value?.id).toBe('r-cao')
    choose(game, 'right')
    expectFate(game, 'zhengzhilong', 'r-cao', 'right')
    expect(game.flags.value['gewu-shipping']).toBe(1)
    expect(character(game, 'zhengzhilong').note).toContain('不改既定航路契约')
    expect(character(game, 'zhengzhilong').note).not.toContain('漕运的一半')
  })

  it.each(sides)('当收入缺口选择%s时，不杀高应登', (side) => {
    const game = start()
    toCard(game, 'g-revenue')
    choose(game, side)
    toYear(game, 17)
    expectFate(game, 'gaoyingdeng', 'g-revenue', side)
    expect(character(game, 'gaoyingdeng').status).toBe('alive')
  })

  it.each(sides)('当锦州选择%s时，洪承畴与祖大寿登记粮路或后撤事迹', (side) => {
    const game = start()
    toCard(game, 'g-jinzhou')
    choose(game, side)
    for (const id of ['hongchou', 'zadashou']) expectFate(game, id, 'g-jinzhou', side)
    expect(game.flags.value['gewu-frontier'] ?? 0).toBe(side === 'left' ? 1 : 0)
  })

  it.each(sides)('当松锦收束选择%s时，保住洪祖骨干而不记1642降清', (side) => {
    const game = start()
    toCard(game, 's-jinzhou')
    for (const id of ['hongchou', 'zadashou']) expect(character(game, id).note).not.toMatch(/遂降|残甲降/)
    toCard(game, 'g-songjin')
    expect(game.decisionByEvent.value['s-songjin'] ?? game.decisionByEvent.value['s-yuan-songjin']).toBeDefined()
    for (const id of ['hongchou', 'zadashou']) {
      pending(game, id, 'g-songjin')
      expect(character(game, id).note).not.toMatch(/遂降|残甲降/)
    }
    choose(game, side)
    toYear(game, 17)
    for (const id of ['hongchou', 'zadashou']) {
      expectFate(game, id, 'g-songjin', side)
      expect(character(game, id).note).not.toMatch(/遂降|残甲降|于清为佐命/)
    }
  })

  it('当松锦保军未成时，仅进退议事不能提前宣告降清或取消1642旧史', () => {
    const game = start()
    reach(game, indexOf('s-songjin'), () => 'right')
    const event = game.currentCard.value!.id
    expect(['s-songjin', 's-yuan-songjin']).toContain(event)
    choose(game, 'left')
    for (const id of ['hongchou', 'zadashou']) expect(character(game, id).note).not.toMatch(/遂降|残甲降/)
    if (event === 's-yuan-songjin') expect(character(game, 'yuanchonghuan').status).toBe('alive')
    reach(game, 15 * CARDS_PER_YEAR, () => 'right')
    expect(character(game, 'hongchou').note).toContain('遂降')
    expect(character(game, 'zadashou').note).toContain('残甲降')
  })

  it.each(sides)('当袁参与松锦军议选择%s时，只下行动令，未在1641先判其死', (side) => {
    const game = start()
    toCard(game, 's-yuan-songjin')
    for (const id of ['yuanchonghuan', 'hongchou', 'zadashou']) pending(game, id, 's-yuan-songjin')
    choose(game, side)
    expectFate(game, 'yuanchonghuan', 's-yuan-songjin', side)
    expect(character(game, 'yuanchonghuan').status).toBe('alive')
    toYear(game, 17)
    expect(character(game, 'yuanchonghuan').status).toBe('alive')
  })

  it.each(sides)('当松锦接济失败收束选择%s时，登记撤援损失并在1642保留洪祖降清', (side) => {
    const game = start()
    toCard(game, 'c-songjin-withdrawal', { 's-yuan-songjin': 'left' })
    for (const id of ['hongchou', 'zadashou']) pending(game, id, 'c-songjin-withdrawal')
    choose(game, side)
    for (const id of ['hongchou', 'zadashou']) {
      expect(CHAR_MAP[id].fates).toContainEqual(expect.objectContaining({ event: 'c-songjin-withdrawal', side, status: 'alive' }))
      expect(character(game, id).deeds).toContainEqual(expect.objectContaining({
        eventId: 'c-songjin-withdrawal', side, year: 14, label: cards.get('c-songjin-withdrawal')![side].label,
      }))
    }
    expect(character(game, 'yuanchonghuan').status).toBe('alive')
    expect(game.year.value).toBe(15)
    // 收束选择会直接翻到1642，故旧史此时优先于1641的撤援事迹。
    expect(character(game, 'hongchou').note).toContain('遂降')
    expect(character(game, 'zadashou').note).toContain('残甲降')
    toYear(game, 17)
    expect(character(game, 'yuanchonghuan').status).toBe('alive')
  })

  it.each(sides)('当关宁交接选择%s时，吴三桂不私占军籍军饷', (side) => {
    const game = start()
    toCard(game, 'g-guanning')
    choose(game, side)
    toYear(game, 17)
    expectFate(game, 'wusanggui', 'g-guanning', side)
    expect(character(game, 'wusanggui').note).toContain('公册')
    expect(character(game, 'wusanggui').note).not.toMatch(/尽得关宁之众|一军皆属/)
  })

  it('当袁崇焕1630被杀时，后来改革保军不能将他复生', () => {
    const game = start()
    toCard(game, 's-yuanshi', { 's-jisi2': 'left' })
    pending(game, 'yuanchonghuan', 's-yuanshi')
    expect(character(game, 'yuanchonghuan').status).toBe('alive')
    choose(game, 'left')
    toCard(game, 'g-songjin')
    choose(game, 'right')
    toYear(game, 17)
    expect(game.decisionByEvent.value['s-yuan-songjin']).toBeUndefined()
    expectFate(game, 'yuanchonghuan', 's-yuanshi', 'left')
  })
})

describe('T1 收编与谷城安置的有条件改史', () => {
  it.each(sides)('当驿路尚在但正式收编缺环而选择%s时，李仍候审而非隶延绥', (side) => {
    const game = start()
    toCard(game, 's-licheng-officer', { 's-chuangjiang': 'left' })
    pending(game, 'licheng', 's-licheng-officer')
    choose(game, side)
    expectFate(game, 'licheng', 's-licheng-officer', side)
    expect(character(game, 'licheng').note).not.toContain('隶延绥')
    expect(character(game, 'licheng').note).toMatch(/候审|待查审/)
    expect(game.flags.value['lz-absorbed']).toBeUndefined()
    toYear(game, 14)
    expect(character(game, 'fuwang').status).toBe('dead')
    toYear(game, 17)
    expect(character(game, 'licheng').note).toContain('国号大顺')
  })

  it.each(sides)('当驿路裁撤的招募善后选择%s时，不凭临时救济登记收编', (side) => {
    const game = start()
    toCard(game, 'c-recruit-no-post', { 's-yizhan': 'left' })
    pending(game, 'licheng', 'c-recruit-no-post')
    choose(game, side)
    expectFate(game, 'licheng', 'c-recruit-no-post', side)
    expect(game.flags.value['lz-absorbed']).toBeUndefined()
    expect(game.decisionByEvent.value['g-recruit']).toBeUndefined()
  })

  it('当逐户登记却缺统一田册时，谷城仍进入申诉善后而不倒补安置', () => {
    const game = start()
    toCard(game, 's-xianzhong', { 'g-taxroll': 'left' })
    choose(game, 'left')
    expect(game.flags.value['gucheng-register']).toBe(1)
    expect(game.flags.value['gewu-taxroll']).toBeUndefined()
    toCard(game, 'c-gucheng-households-claims')
    choose(game, 'left')
    toCard(game, 'c-gucheng-settlement-incomplete')
    choose(game, 'left')
    expect(game.flags.value['gewu-settlement']).toBeUndefined()
    toYear(game, 14)
    expect(character(game, 'xiongwenchan').status).toBe('dead')
    expect(character(game, 'yangsichang').status).toBe('dead')
  })

  it.each(sides)('当谷城粮册入口选择%s时，仅逐户支线能完成安置，旧头领支线留在本章善后', (side) => {
    const game = start()
    toCard(game, 's-xianzhong')
    choose(game, side)
    expectFate(game, 'zhangxianzhong', 's-xianzhong', side)
    expect(character(game, 'zhangxianzhong').note).not.toMatch(/半年之后|反旗复树|必反/)
    const households = side === 'left' ? 'g-gucheng-households' : 'c-gucheng-households-claims'
    const closing = side === 'left' ? 'g-gucheng' : 'c-gucheng-settlement-incomplete'
    toCard(game, households)
    expect(game.chapter.value?.id).toBe('gucheng')
    for (const id of ['zhangxianzhong', 'xiongwenchan']) pending(game, id, households)
    choose(game, 'left')
    toCard(game, closing)
    for (const id of ['zhangxianzhong', 'xiongwenchan', 'yangsichang']) pending(game, id, closing)
    choose(game, 'right')
    expect(game.flags.value['gewu-settlement'] ?? 0).toBe(side === 'left' ? 1 : 0)
    toYear(game, 14)
    if (side === 'left') {
      for (const id of ['zhangxianzhong', 'xiongwenchan', 'yangsichang']) expectFate(game, id, 'g-gucheng', 'right')
    } else {
      expect(game.decisionByEvent.value['g-gucheng-households']).toBeUndefined()
      expect(game.decisionByEvent.value['g-gucheng']).toBeUndefined()
      expect(character(game, 'xiongwenchan').status).toBe('dead')
      expect(character(game, 'yangsichang').status).toBe('dead')
      expect(character(game, 'zhangxianzhong').note).toContain('复叛，陷襄阳')
    }
  })

  it.each(sides)('当谷城善后选择%s时，仅成功取消复叛、熊1640与杨1641死因', (side) => {
    const game = start()
    toCard(game, 'g-gucheng')
    choose(game, side)
    const settled = side === 'right'
    expect(game.flags.value['gewu-settlement'] ?? 0).toBe(settled ? 1 : 0)
    for (const id of ['zhangxianzhong', 'xiongwenchan', 'yangsichang']) expectFate(game, id, 'g-gucheng', side)
    toYear(game, 13)
    expect(character(game, 'xiongwenchan').status).toBe(settled ? 'alive' : 'dead')
    expect(character(game, 'yangsichang').status).toBe('alive')
    toYear(game, 14)
    expect(character(game, 'zhangxianzhong').note.includes('复叛，陷襄阳')).toBe(!settled)
    expect(character(game, 'yangsichang').status).toBe(settled ? 'alive' : 'dead')
    if (settled) {
      for (const id of ['zhangxianzhong', 'xiongwenchan', 'yangsichang']) expectFate(game, id, 'g-gucheng', side)
    } else {
      expect(character(game, 'yangsichang').note).toContain('忧悸而卒')
      expect(character(game, 'xiongwenchan').note).toContain('弃市')
    }
  })

  it('当安置旗标为零时，不能把失败谷城当成成功免死', () => {
    const game = start()
    toCard(game, 'g-gucheng')
    choose(game, 'left')
    expect(game.flags.value['gewu-settlement'] ?? 0).toBe(0)
    toYear(game, 14)
    expect(character(game, 'yangsichang').status).toBe('dead')
    expect(character(game, 'xiongwenchan').status).toBe('dead')
  })

  it.each(sides)('当收编后关中复业选择%s时，李自成不再称王围城，福王不被闯杀', (side) => {
    const game = start()
    toCard(game, 'g-recruit')
    choose(game, 'left')
    expect(game.flags.value['lz-absorbed']).toBe(1)
    expectFate(game, 'licheng', 'g-recruit', 'left')
    toYear(game, 14)
    expectFate(game, 'licheng', 'g-recruit', 'left')
    expect(character(game, 'fuwang').status).toBe('alive')
    toCard(game, 'g-guanzhong')
    choose(game, side)
    expectFate(game, 'licheng', 'g-guanzhong', side)
    toYear(game, 17)
    expect(character(game, 'licheng').note).not.toMatch(/号「闯王」|围攻开封|国号大顺/)
    expect(character(game, 'licheng').note).toContain('公册军籍')
    expect(character(game, 'fuwang').status).toBe('alive')
  })

  it('当拒绝收编时，福王之死、1642开封与1644大顺仍保留但不独断决河责任', () => {
    const game = start()
    toCard(game, 'g-recruit')
    choose(game, 'right')
    expect(game.flags.value['lz-absorbed']).toBeUndefined()
    expectFate(game, 'licheng', 'g-recruit', 'right')
    expect(character(game, 'licheng').note).toContain('逃亡')
    toYear(game, 14, { 'g-gucheng': 'left' })
    expect(character(game, 'licheng').note).not.toContain('围攻开封')
    expect(character(game, 'fuwang').status).toBe('dead')
    toYear(game, 15)
    expect(character(game, 'licheng').note).toContain('围攻开封')
    expect(character(game, 'licheng').note).toContain('责任历来有争议')
    toYear(game, 16)
    expect(character(game, 'licheng').note).not.toContain('国号大顺')
    toYear(game, 17)
    expect(character(game, 'licheng').note).toContain('国号大顺')
  })

  it.each(sides)('当仅收编成功而谷城失败时，开封赈灾选择%s不把洪水记成李自成决河', (side) => {
    const game = start()
    toCard(game, 'c-peace-dividend-flood', { 'g-gucheng': 'left', 'g-kaifeng': 'right' })
    expect(game.flags.value['lz-absorbed']).toBe(1)
    expect(game.flags.value['gewu-settlement']).toBeUndefined()
    choose(game, side)
    expectFate(game, 'licheng', 'g-recruit', 'left')
    expect(character(game, 'licheng').note).not.toContain('决河')
    expect(character(game, 'fuwang').status).toBe('alive')
  })
})

describe('T1 公开议和与新终章', () => {
  it.each(sides)('当公开议和选择%s时，陈新甲不被记为奉密旨行事且皇太极尚生', (side) => {
    const game = start()
    toCard(game, 'g-peace')
    choose(game, side)
    expectFate(game, 'chenxinjia', 'g-peace', side)
    expectFate(game, 'huangtaiji', 'g-peace', side)
    expect(character(game, 'chenxinjia').note).not.toMatch(/受密旨于帷中|不入阁票/)
    expect(game.flags.value['peace-talks'] ?? 0).toBe(side === 'left' ? 1 : 0)
    toCard(game, side === 'left' ? 's-htj' : 'c-htj-no-treaty')
    expect(character(game, 'huangtaiji')).toMatchObject({ status: 'dead', age: 52 })
    expect(character(game, 'chenxinjia').status).toBe('alive')
  })

  it.each(sides)('当1642和约追认选择%s时，陈不冤死且皇太极只在1643自然死', (side) => {
    const game = start()
    toCard(game, 'g-peace-ratify')
    expect(character(game, 'huangtaiji').status).toBe('alive')
    pending(game, 'chenxinjia', 'g-peace-ratify')
    choose(game, side)
    expectFate(game, 'chenxinjia', 'g-peace-ratify', side)
    expectFate(game, 'huangtaiji', 'g-peace-ratify', side)
    expect(game.flags.value['peace-kept'] ?? 0).toBe(side === 'left' ? 1 : 0)
    expect(game.decisionByEvent.value['s-mihe-leak']).toBeUndefined()
    toCard(game, side === 'left' ? 's-htj' : 'c-htj-no-treaty')
    choose(game, 'right')
    expect(character(game, 'huangtaiji')).toMatchObject({ status: 'dead', age: 52 })
    expect(character(game, 'chenxinjia').status).toBe('alive')
  })

  it.each(sides)('当公开拒谈后撤使选择%s时，陈不冤死且无约易主仍记皇太极1643自然死', (side) => {
    const game = start()
    toCard(game, 'c-peace-withdraw-talks', { 'g-peace': 'right' })
    pending(game, 'chenxinjia', 'c-peace-withdraw-talks')
    pending(game, 'huangtaiji', 'c-peace-withdraw-talks')
    expect(character(game, 'huangtaiji').status).toBe('alive')
    choose(game, side)
    expectFate(game, 'chenxinjia', 'c-peace-withdraw-talks', side)
    toCard(game, 'c-htj-no-treaty')
    for (const id of ['huangtaiji', 'duoerhun', 'haoge']) pending(game, id, 'c-htj-no-treaty')
    expect(character(game, 'huangtaiji')).toMatchObject({ status: 'dead', age: 52 })
    choose(game, side)
    toYear(game, 17)
    expect(game.flags.value['peace-kept']).toBeUndefined()
    expectFate(game, 'chenxinjia', 'c-peace-withdraw-talks', side)
    expect(character(game, 'huangtaiji')).toMatchObject({ status: 'dead', age: 52 })
  })

  it.each(sides)('当旧密议事泄选择%s时，陈按选择生死且皇太极不提前死亡', (side) => {
    const game = start()
    toCard(game, 's-mihe-leak', { 'g-charter': 'left', 's-mihe': 'left' })
    expect(game.flags.value['gewu-charter']).toBeUndefined()
    choose(game, side)
    expect(character(game, 'huangtaiji').status).toBe('alive')
    expect(character(game, 'chenxinjia').status).toBe(side === 'left' ? 'alive' : 'dead')
    toYear(game, 17)
    expect(character(game, 'huangtaiji')).toMatchObject({ status: 'dead', age: 52 })
    expectFate(game, 'chenxinjia', 's-mihe-leak', side)
    choose(game, 'right')
    expectFate(game, 'chenxinjia', 's-mihe-leak', side)
  })

  it.each(sides)('当孙传庭释放后备战选择%s时，只在1643催战侧战死', (side) => {
    const game = start()
    toCard(game, 's-chuanti')
    choose(game, 'left')
    expect(game.flags.value['chuanting-released']).toBe(1)
    expectFate(game, 'sunchuanting', 's-chuanti', 'left')
    toCard(game, 's-chuanti-ready')
    expect(character(game, 'sunchuanting').status).toBe('alive')
    pending(game, 'sunchuanting', 's-chuanti-ready')
    choose(game, side)
    expect(game.flags.value['chuanting-wait'] ?? 0).toBe(side === 'right' ? 1 : 0)
    toYear(game, 17)
    expectFate(game, 'sunchuanting', 's-chuanti-ready', side)
    choose(game, 'right')
    expectFate(game, 'sunchuanting', 's-chuanti-ready', side)
  })

  it.each(sides)('当孙传庭未获释且两步善后均选择%s时，不出现人在狱中却练兵的事迹', (side) => {
    const game = start()
    toCard(game, 's-chuanti')
    choose(game, 'right')
    expect(game.flags.value['chuanting-released']).toBeUndefined()
    toCard(game, 'c-guanzhong-without-general')
    pending(game, 'sunchuanting', 'c-guanzhong-without-general')
    choose(game, side)
    expectFate(game, 'sunchuanting', 'c-guanzhong-without-general', side)
    toCard(game, 'c-chuanting-still-imprisoned')
    pending(game, 'sunchuanting', 'c-chuanting-still-imprisoned')
    expect(character(game, 'sunchuanting').note).toContain('诏狱')
    choose(game, side)
    expectFate(game, 'sunchuanting', 'c-chuanting-still-imprisoned', side)
    toYear(game, 17)
    expect(game.flags.value['chuanting-wait']).toBeUndefined()
    expect(character(game, 'sunchuanting').deeds.some((deed) => deed.eventId === 's-chuanti-ready')).toBe(false)
    expect(character(game, 'sunchuanting').status).toBe('alive')
    expect(character(game, 'sunchuanting').note).not.toMatch(/秦兵练|秦兵留|车营火器皆成/)
  })

  it.each(sides)('当未完成收编的关中募兵选择%s时，孙按真实募册整军而不倒补安置', (side) => {
    const game = start()
    toCard(game, 'c-guanzhong-recruit', { 'g-recruit': 'right' })
    expect(game.flags.value['chuanting-released']).toBe(1)
    pending(game, 'sunchuanting', 'c-guanzhong-recruit')
    pending(game, 'licheng', 'c-guanzhong-recruit')
    choose(game, side)
    expectFate(game, 'sunchuanting', 'c-guanzhong-recruit', side)
    expect(game.flags.value['lz-absorbed']).toBeUndefined()
    expect(game.flags.value['guanzhong-recovery'] ?? 0).toBe(side === 'left' ? 1 : 0)
    toCard(game, side === 'left' ? 's-chuanti-ready' : 'c-chuanting-short-pay')
    expect(character(game, 'sunchuanting').status).toBe('alive')
  })

  it.each(sides)('当停战预算未成的欠饷收束选择%s时，孙尚生但不能领取完整留练成果', (side) => {
    const game = start()
    toCard(game, 'c-chuanting-short-pay', { 'g-peace': 'right' })
    expect(game.flags.value['chuanting-released']).toBe(1)
    pending(game, 'sunchuanting', 'c-chuanting-short-pay')
    choose(game, side)
    expectFate(game, 'sunchuanting', 'c-chuanting-short-pay', side)
    expect(game.flags.value['chuanting-wait']).toBeUndefined()
    toYear(game, 17)
    choose(game, 'right')
    expectFate(game, 'sunchuanting', 'c-chuanting-short-pay', side)
    expect(character(game, 'sunchuanting').status).toBe('alive')
  })

  it('当两京备份尚待裁决时，王承恩只登记1643事迹而不煤山从死', () => {
    const game = start()
    toCard(game, 'g-capital')
    pending(game, 'wangchengen', 'g-capital')
    expect(character(game, 'wangchengen')).toMatchObject({ status: 'alive', appearYear: cards.get('g-capital')!.year })
    expect(character(game, 'wangchengen').note).not.toContain('煤山')
  })

  const finaleCases = REFORM_FINALES.flatMap((card) => sides.map((side) => ({ id: card.id, side })))
  it.each(finaleCases)('当新终章$id选择$side时，王承恩不被预判或强制记为煤山从死', ({ id, side }) => {
    const game = start()
    toYear(game, 17, id === 'g-finale-gewu' ? {} : { 'g-succession': 'left' })
    expect(game.currentCard.value?.id).toBe(id)
    if (id === 'g-finale-gewu') {
      for (const flag of REFORM_REQUIREMENTS) expect(game.flags.value[flag], flag).toBeGreaterThan(0)
    }
    expect(character(game, 'wangchengen')).toMatchObject({ status: 'alive', appearYear: cards.get('g-capital')!.year })
    expect(character(game, 'wangchengen').deeds).toContainEqual(expect.objectContaining({
      eventId: id, year: 17, side: null,
    }))
    choose(game, side)
    expectFate(game, 'wangchengen', id, side)
    expect(character(game, 'wangchengen').status).toBe('alive')
    expect(character(game, 'wangchengen').note).not.toContain('煤山')
    expect(character(game, 'emperor').deeds).toContainEqual(expect.objectContaining({
      eventId: id, year: 17, side,
    }))
  })

  it('当仍选旧煤山结局时，王承恩按抉择从死', () => {
    const game = start()
    toYear(game, 17, { 'g-gucheng': 'left', 's-chuanti': 'right' })
    expect(game.currentCard.value?.id).toBe('s-finale')
    choose(game, 'left')
    expect(character(game, 'wangchengen').status).toBe('dead')
    expect(character(game, 'wangchengen').note).toContain('煤山')
  })
})

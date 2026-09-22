import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCharacters } from '../../src/composables/useCharacters'
import { CARDS_PER_YEAR, useGame, type Game } from '../../src/composables/useGame'
import { CHAR_MAP } from '../../src/data/characters'
import { FINALE_EVENTS, RANDOM_EVENTS, SCRIPT_EVENTS } from '../../src/data/events'
import { REFORM_EVENTS, REFORM_FINALES, REFORM_REQUIREMENTS } from '../../src/data/reforms'
import type { Side } from '../../src/types'
import { atFinale, healthy, reach, seedRandom } from '../game/helpers'

const sides: Side[] = ['left', 'right']
const reformCards = new Map(REFORM_EVENTS.map((card) => [card.id, card]))

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

// 沿实际牌序写入 decisions / flags，只用健康国势隔离资源失衡结局。
function reformSide(id: string): Side {
  const card = reformCards.get(id)
  if (card?.left.sets?.some((flag) => flag !== 'exec')) return 'left'
  return 'right'
}

function toSlot(game: Game, year: number, order = 1, overrides: Partial<Record<string, Side>> = {}) {
  reach(game, year * CARDS_PER_YEAR + order - 1, (id) => overrides[id] ?? reformSide(id))
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
  it('当改革卡尚未出现时不展示事迹，翻开后显示待裁决，选择后使用真实年与标签', () => {
    const game = start()
    const chars = useCharacters(game)
    const xu = () => chars.views.value.find((view) => view.char.id === 'xuguangqi')!
    expect(xu()).toMatchObject({ status: 'hidden', appearYear: null, deeds: [] })
    expect(CHAR_MAP.emperor.events).toEqual(
      [...SCRIPT_EVENTS, ...RANDOM_EVENTS, ...FINALE_EVENTS, ...REFORM_EVENTS, ...REFORM_FINALES].map((card) => card.id),
    )

    toSlot(game, 0, 4)
    expect(game.currentCard.value?.id).toBe('g-institute')
    expect(xu()).toMatchObject({ status: 'alive', appearYear: 0 })
    expect(xu().deeds).toEqual([
      expect.objectContaining({ eventId: 'g-institute', year: 0, side: null, label: '待裁决' }),
    ])
    expect(xu().deeds.some((deed) => deed.eventId === 'g-seeds')).toBe(false)

    choose(game, 'left')
    expect(xu().deeds[0]).toMatchObject({
      year: 0, side: 'left', label: reformCards.get('g-institute')!.left.label,
    })
    expect(character(game, 'emperor').deeds.some((deed) => deed.eventId === 'g-institute')).toBe(true)
    for (const view of chars.views.value) {
      expect(view.deeds.every((deed) => game.seenEventIds.value.has(deed.eventId))).toBe(true)
    }
  })

  it.each(sides)('当徐光启遗稿卡选择%s时，六年自然病故不被事迹复生', (side) => {
    const game = start()
    toSlot(game, 5, 5)
    expect(character(game, 'xuguangqi').status).toBe('alive')
    toSlot(game, 6, 4)
    expect(game.currentCard.value?.id).toBe('g-manuals')
    expect(character(game, 'xuguangqi')).toMatchObject({ status: 'dead', age: 72 })
    choose(game, side)
    toSlot(game, 16, 5)
    const xu = character(game, 'xuguangqi')
    expect(xu).toMatchObject({ status: 'dead', age: 72 })
    expect(xu.note).toContain('崇祯六年卒于官')
    expect(xu.deeds).toEqual(expect.arrayContaining([
      expect.objectContaining({ eventId: 'g-institute', year: 0 }),
      expect.objectContaining({ eventId: 'g-seeds', year: 1 }),
      expect.objectContaining({ eventId: 'g-manuals', year: 6, side }),
    ]))
  })

  it.each(sides)('当太子继承章程选择%s时，登记东宫十六年事迹', (side) => {
    const game = start()
    toSlot(game, 16, 5)
    expect(game.currentCard.value?.id).toBe('g-succession')
    expect(character(game, 'taizi').deeds).toContainEqual(expect.objectContaining({
      eventId: 'g-succession', year: 16, side: null,
    }))
    choose(game, side)
    expectFate(game, 'taizi', 'g-succession', side)
  })
})

describe('T1 保匠、海贸与军政局部成果', () => {
  it.each(sides)('当吴桥选择%s时，孙元化与公沙存活且孔有德不能带走炮匠', (side) => {
    const game = start()
    toSlot(game, 4)
    expect(game.currentCard.value?.id).toBe('g-wuqiao')
    for (const id of ['sunyuanhua', 'gongsha', 'kongyoude']) {
      expect(character(game, id).deeds).toContainEqual(expect.objectContaining({
        eventId: 'g-wuqiao', year: 4, side: null,
      }))
    }
    choose(game, side)
    expect(game.flags.value['gewu-denglai'] ?? 0).toBe(side === 'left' ? 1 : 0)
    expect(game.decisionByEvent.value['s-wuqiao']).toBeUndefined()
    if (side === 'right') {
      expect(character(game, 'sunyuanhua').note).toContain('候查')
      expect(character(game, 'kongyoude').note).toContain('乱兵之患未平')
    }
    // 越过公沙六年、孙元化八年旧死期，并让后续主链失败。
    toSlot(game, 16, 5, { 'g-shipping': 'right' })
    for (const id of ['sunyuanhua', 'gongsha', 'kongyoude']) {
      expectFate(game, id, 'g-wuqiao', side)
      expect(character(game, id).status).toBe('alive')
      expect(character(game, id).note).not.toMatch(/史实：浮海归建州|炮匠随之北去|已死狱中/)
    }
  })

  it('当没有保匠改革时，旧吴桥处死与阵亡仍保留', () => {
    const game = start()
    reach(game, 4 * CARDS_PER_YEAR, () => 'right')
    expect(game.currentCard.value?.id).toBe('s-wuqiao')
    choose(game, 'left')
    reach(game, 9 * CARDS_PER_YEAR, () => 'right')
    expect(character(game, 'sunyuanhua').status).toBe('dead')
    expect(character(game, 'gongsha').status).toBe('dead')
    expect(character(game, 'kongyoude').note).toContain('炮匠随之北去')
  })

  it.each(sides)('当海运选择%s时，区分契约与独占，料罗湾不推翻已定契约', (side) => {
    const game = start()
    toSlot(game, 4, 4)
    expect(game.currentCard.value?.id).toBe('g-shipping')
    choose(game, side)
    expectFate(game, 'zhengzhilong', 'g-shipping', side)
    expect(game.flags.value['gewu-shipping'] ?? 0).toBe(side === 'left' ? 1 : 0)
    expect(character(game, 'zhengzhilong').note).toContain(side === 'left' ? '无独占权' : '航路独占')
    toSlot(game, 6)
    expect(character(game, 'zhengzhilong').note).toContain('料罗湾')
    expect(character(game, 'zhengzhilong').note).not.toMatch(/朝廷不能制|只能用他/)
    expect(CHAR_MAP.zhengzhilong.events).not.toContain('g-market')
  })

  it.each(sides)('当海税选择%s时，郑芝龙仍遵守非独占承运契约', (side) => {
    const game = start()
    toSlot(game, 4, 5)
    expect(game.currentCard.value?.id).toBe('g-customs')
    choose(game, side)
    expectFate(game, 'zhengzhilong', 'g-customs', side)
    expect(game.flags.value['gewu-shipping']).toBe(1)
    expect(character(game, 'zhengzhilong').note).toMatch(/别商承运|非独占契约/)
  })

  it('当契约成立后再遇漕粮海运时，单批运输不改既定航路契约', () => {
    const game = start()
    toSlot(game, 5, 4)
    choose(game, 'right')
    while (!game.isOver.value && game.year.value < 17 && game.currentCard.value?.id !== 'r-cao') {
      choose(game, 'right')
    }
    expect(game.currentCard.value?.id).toBe('r-cao')
    choose(game, 'right')
    expectFate(game, 'zhengzhilong', 'r-cao', 'right')
    expect(game.flags.value['gewu-shipping']).toBe(1)
    expect(character(game, 'zhengzhilong').note).toContain('不改既定航路契约')
    expect(character(game, 'zhengzhilong').note).not.toContain('漕运的一半')
  })

  it.each(sides)('当收入缺口选择%s时，不杀高应登', (side) => {
    const game = start()
    toSlot(game, 7)
    expect(game.currentCard.value?.id).toBe('g-revenue')
    choose(game, side)
    toSlot(game, 16, 5)
    expectFate(game, 'gaoyingdeng', 'g-revenue', side)
    expect(character(game, 'gaoyingdeng').status).toBe('alive')
  })

  it.each(sides)('当锦州选择%s时，洪承畴与祖大寿登记粮路或后撤事迹', (side) => {
    const game = start()
    toSlot(game, 13)
    expect(game.currentCard.value?.id).toBe('g-jinzhou')
    choose(game, side)
    for (const id of ['hongchou', 'zadashou']) expectFate(game, id, 'g-jinzhou', side)
    expect(game.flags.value['gewu-frontier'] ?? 0).toBe(side === 'left' ? 1 : 0)
  })

  it.each(sides)('当松锦选择%s时，保住洪祖骨干而不记十五年降清', (side) => {
    const game = start()
    toSlot(game, 15)
    expect(game.currentCard.value?.id).toBe('g-songjin')
    choose(game, side)
    toSlot(game, 16, 5)
    expect(game.decisionByEvent.value['s-songjin']).toBeUndefined()
    for (const id of ['hongchou', 'zadashou']) {
      expectFate(game, id, 'g-songjin', side)
      expect(character(game, id).status).toBe('alive')
      expect(character(game, id).note).not.toMatch(/遂降|残甲降|于清为佐命/)
    }
  })

  it.each(sides)('当关宁交接选择%s时，吴三桂不私占军籍军饷', (side) => {
    const game = start()
    toSlot(game, 15, 3)
    expect(game.currentCard.value?.id).toBe('g-guanning')
    choose(game, side)
    toSlot(game, 16, 5)
    expectFate(game, 'wusanggui', 'g-guanning', side)
    expect(character(game, 'wusanggui').note).toContain('公册')
    expect(character(game, 'wusanggui').note).not.toMatch(/尽得关宁之众|一军皆属/)
  })
})

describe('T1 收编与谷城安置的有条件改史', () => {
  it.each(sides)('当谷城选择%s时，仅逐户安置成功取消复叛与相关死因', (side) => {
    const game = start()
    toSlot(game, 12)
    expect(game.currentCard.value?.id).toBe('g-gucheng')
    choose(game, side)
    const settled = side === 'right'
    expect(game.flags.value['gewu-settlement'] ?? 0).toBe(settled ? 1 : 0)
    for (const id of ['zhangxianzhong', 'xiongwenchan', 'yangsichang']) {
      expectFate(game, id, 'g-gucheng', side)
    }
    // 同一张卡的失败侧仍留下旧史，不能用 unlessEvent 一并免死。
    toSlot(game, 14)
    expect(character(game, 'zhangxianzhong').note.includes('复叛，陷襄阳')).toBe(!settled)
    expect(character(game, 'yangsichang').status).toBe(settled ? 'alive' : 'dead')
    toSlot(game, 16)
    expect(character(game, 'xiongwenchan').status).toBe(settled ? 'alive' : 'dead')
    if (settled) {
      for (const id of ['zhangxianzhong', 'xiongwenchan', 'yangsichang']) {
        expectFate(game, id, 'g-gucheng', side)
      }
    } else {
      expect(character(game, 'yangsichang').note).toContain('忧悸而卒')
      expect(character(game, 'xiongwenchan').note).toContain('弃市')
    }
  })

  it('当安置旗标为零时，不能把失败谷城当成成功免死', () => {
    const game = start()
    toSlot(game, 12)
    choose(game, 'left')
    game.flags.value['gewu-settlement'] = 0
    toSlot(game, 16)
    expect(character(game, 'yangsichang').status).toBe('dead')
    expect(character(game, 'xiongwenchan').status).toBe('dead')
  })

  it.each(sides)('当收编后关中复业选择%s时，李自成不再称王决河，福王不被闯杀', (side) => {
    const game = start()
    toSlot(game, 8, 3)
    expect(game.currentCard.value?.id).toBe('g-recruit')
    choose(game, 'left')
    expect(game.flags.value['lz-absorbed']).toBe(1)
    expectFate(game, 'licheng', 'g-recruit', 'left')
    toSlot(game, 14)
    expectFate(game, 'licheng', 'g-recruit', 'left')
    expect(character(game, 'fuwang').status).toBe('alive')
    toSlot(game, 16, 3)
    expect(game.currentCard.value?.id).toBe('g-guanzhong')
    expectFate(game, 'licheng', 'g-recruit', 'left')
    choose(game, side)
    expectFate(game, 'licheng', 'g-guanzhong', side)
    expect(character(game, 'licheng').note).not.toMatch(/号「闯王」|决河灌城|国号大顺/)
    expect(character(game, 'licheng').note).toContain('公册军籍')
  })

  it('当拒绝收编时，捕逃不等于收编，后续决河称帝与福王之死仍保留', () => {
    const game = start()
    toSlot(game, 8, 3)
    choose(game, 'right')
    expect(game.flags.value['lz-absorbed']).toBeUndefined()
    expectFate(game, 'licheng', 'g-recruit', 'right')
    expect(character(game, 'licheng').note).toContain('逃亡')
    toSlot(game, 14, 1, { 'g-gucheng': 'left' })
    expect(game.currentCard.value?.id).toBe('s-kaifeng')
    expect(character(game, 'licheng').note).toContain('决河灌城')
    expect(character(game, 'fuwang').status).toBe('dead')
    toSlot(game, 16, 3)
    expect(game.currentCard.value?.id).toBe('s-dashun')
    expect(character(game, 'licheng').note).toContain('国号大顺')
  })

  it.each(sides)('当仅收编成功而谷城失败时，开封赈灾选择%s也不会把洪水记成李自成决河', (side) => {
    const game = start()
    toSlot(game, 14, 1, { 'g-gucheng': 'left' })
    expect(game.flags.value['lz-absorbed']).toBe(1)
    expect(game.flags.value['gewu-settlement']).toBeUndefined()
    expect(game.currentCard.value?.id).toBe('g-kaifeng-relief')
    choose(game, side)
    expectFate(game, 'licheng', 'g-recruit', 'left')
    expect(character(game, 'licheng').note).not.toContain('决河')
    expect(character(game, 'fuwang').status).toBe('alive')
  })
})

describe('T1 公开议和与新终章', () => {
  it.each(sides)('当公开议和选择%s时，陈新甲不被记为奉密旨行事', (side) => {
    const game = start()
    toSlot(game, 15, 2)
    expect(game.currentCard.value?.id).toBe('g-peace')
    choose(game, side)
    expectFate(game, 'chenxinjia', 'g-peace', side)
    expectFate(game, 'huangtaiji', 'g-peace', side)
    expect(character(game, 'chenxinjia').status).toBe('alive')
    expect(character(game, 'chenxinjia').note).not.toMatch(/受密旨于帷中|不入阁票/)
    expect(game.flags.value['peace-talks'] ?? 0).toBe(side === 'left' ? 1 : 0)
    toSlot(game, 16)
    expect(character(game, 'huangtaiji').status).toBe('dead')
  })

  it.each(sides)('当和约追认选择%s时，陈新甲不被杀且皇太极死讯不会复生', (side) => {
    const game = start()
    toSlot(game, 16)
    expect(game.currentCard.value?.id).toBe('g-peace-ratify')
    expect(character(game, 'huangtaiji').status).toBe('dead')
    choose(game, side)
    toSlot(game, 16, 5)
    expectFate(game, 'chenxinjia', 'g-peace-ratify', side)
    expectFate(game, 'huangtaiji', 'g-peace-ratify', side)
    expect(character(game, 'chenxinjia').status).toBe('alive')
    expect(character(game, 'huangtaiji')).toMatchObject({ status: 'dead', age: 52 })
    expect(game.flags.value['peace-kept'] ?? 0).toBe(side === 'left' ? 1 : 0)
    expect(game.decisionByEvent.value['s-mihe-leak']).toBeUndefined()
  })

  it.each(sides)('当未立章程回落旧和议且事泄选择%s时，皇太极仍不能自然死亡后复生', (side) => {
    const game = start()
    toSlot(game, 16, 1, { 'g-charter': 'left', 's-mihe': 'left' })
    expect(game.flags.value['gewu-charter']).toBeUndefined()
    expect(game.currentCard.value?.id).toBe('s-mihe-leak')
    choose(game, side)
    expect(character(game, 'huangtaiji')).toMatchObject({ status: 'dead', age: 52 })
    expect(character(game, 'chenxinjia').status).toBe(side === 'left' ? 'alive' : 'dead')
  })

  const finaleCases = REFORM_FINALES.flatMap((card) => sides.map((side) => ({ id: card.id, side })))
  it.each(finaleCases)('当新终章$id选择$side时，王承恩不被预判或强制记为煤山从死', ({ id, side }) => {
    const flags = id === 'g-finale-gewu'
      ? Object.fromEntries(REFORM_REQUIREMENTS.map((flag) => [flag, 1]))
      : { 'gewu-settlement': 1, 'gewu-frontier': 1 }
    const game = atFinale(flags)
    expect(game.currentCard.value?.id).toBe(id)
    expect(character(game, 'wangchengen')).toMatchObject({ status: 'alive', appearYear: 17 })
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
    const game = atFinale({})
    expect(game.currentCard.value?.id).toBe('s-finale')
    choose(game, 'left')
    expect(character(game, 'wangchengen').status).toBe('dead')
    expect(character(game, 'wangchengen').note).toContain('煤山')
  })
})

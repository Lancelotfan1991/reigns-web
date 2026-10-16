import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCharacters } from '../../src/composables/useCharacters'
import { useGame, type Game } from '../../src/composables/useGame'
import { ALL_EVENTS } from '../../src/data/chapters'
import { CHARACTERS } from '../../src/data/characters'
import { cardPortrait } from '../../src/data/portraits'
import { CharStatus, Flag, Side, type GameEvent } from '../../src/types'
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
    const cards = ALL_EVENTS
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
})

describe('T1 改史替换与人物', () => {
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
    const ids = new Set(ALL_EVENTS.map((event) => event.id))
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
    game.choose(Side.Left)
    const verdict = game.verdict.value!
    expect(game.isOver.value).toBe(true)
    expect(verdict.ended).toBe(true)
    expect(verdict.lines).toContainEqual({ key: 'gold', from: 1, to: 0 })
  })

  it('当读完批红时，只翻回决策页而不改写国势', () => {
    const game = useGame()
    game.startGame()
    reach(game, slotOf('g-institute'))
    game.choose(Side.Left)
    const settled = { ...game.resources.value }
    game.dismissVerdict()
    expect(game.verdict.value).toBeNull()
    expect(game.resources.value).toEqual(settled)
  })

  it('当重开新一局时，未读的批红被清除', () => {
    const game = useGame()
    game.startGame()
    reach(game, slotOf('g-institute'))
    game.choose(Side.Left)
    expect(game.verdict.value).not.toBeNull()
    game.startGame()
    expect(game.verdict.value).toBeNull()
  })
})

describe('T1 宫门定策四档', () => {
  /** 走完魏忠贤篇章前六步（中段默认 RLLL），第七步即「发落司礼监」 */
  const toArrest = (first: Side, second: Side, mid = 'RLLL') => {
    const game = useGame()
    game.startGame()
    game.choose(first)  // Step 0: s-tuogu
    game.choose(second) // Step 1: s-dianjianglu
    for (const side of mid) game.choose(side === 'L' ? Side.Left : Side.Right) // Step 2-5
    return game
  }
  const weiView = (game: Game) => {
    const view = useCharacters(game).views.value.find((item) => item.char.id === 'wei')
    return { status: view?.status, note: view?.note ?? '', deeds: view?.deeds.map((deed) => deed.eventId) ?? [] }
  }
  /** 只把逆案裁在“止坐首恶”，其余各议按需要选 */
  const narrowVerdict = (id: string): Side => id === 's-ni-an' ? Side.Left : Side.Right

  it.each([
    [Side.Left, Side.Right, 'LRRL', 's-wei-rash', '玉玺照接、钥匙未换：法度耗到四十以下送不进衙门，只靠京营连夜硬办'],
    [Side.Left, Side.Left, 'RLLL', 's-wei-failed', '受玺即放权、当众焚册也救不回军心：牌票没人肯领，京营当值称病'],
    [Side.Right, Side.Left, 'RLLL', 's-wei-failed', '钥匙虽换，焚册折了京营当值：军心只剩三十余，缇骑出不了城门'],
  ] as const)('当开局依次选%s、%s、中段%s 时，第七步发出%s（%s）', (first, second, mid, id, why) => {
    const game = toArrest(first, second, mid)
    expect(why.length).toBeGreaterThan(0)
    expect(game.chapter.value).toEqual({ id: 'wei', name: '宫门定策', step: 7, total: 7 })
    expect(game.currentCard.value?.id).toBe(id)
  })

  it('当九门钥匙未换、焚册未行而军心不足四十时，第七步落到中止且仍以未遂收束', () => {
    const game = useGame()
    game.startGame()
    game.choose(Side.Left)  // Step 0: s-tuogu left - no wei-watched
    game.choose(Side.Right) // Step 1: s-dianjianglu right - sets wei-watched
    // 清除 wei-watched 以模拟九门钥匙未曾换过、名分却已定的情形
    game.flags.value = { ...game.flags.value, [Flag.密换九门]: undefined }
    game.resources.value = { ...healthy(), law: 41, army: 37 }
    game.choose(Side.Right) // Step 2: s-gongnv
    game.choose(Side.Left)  // Step 3: s-kesi
    game.choose(Side.Left)  // Step 4: s-cui
    game.choose(Side.Right) // Step 5: s-impeach-wei 留中不发，不落逮牌
    expect(game.flags.value.warned).toBeUndefined()
    expect(game.currentCard.value?.id).toBe('s-wei-stalled')
    const stalled = game.currentCard.value!
    for (const side of ['left', 'right'] as const) expect(stalled[side].sets).toContain(Flag.逮魏未成)
    game.choose(Side.Left)
    expect(game.flags.value[Flag.逮魏未成]).toBe(2)
    expect(game.flags.value[Flag.忠贤被逮]).toBeUndefined()
  })

  it.each([Side.Left, Side.Right] as const)('当逮牌未遂并选择%s时，魏忠贤照旧在任，史实一节被改写', (side) => {
    const game = toArrest(Side.Right, Side.Left)
    expect(game.currentCard.value?.id).toBe('s-wei-failed')
    game.choose(side)
    expect(game.flags.value[Flag.逮魏未成]).toBe(1)
    const wei = weiView(game)
    expect(wei.status).toBe(CharStatus.Alive)
    expect(wei.note).not.toContain('阜城')
    expect(wei.deeds).toContain('s-wei-failed')
  })

  it('当逮牌未遂但军心未至绝境时，崇祯三年不发再举之请', () => {
    const game = toArrest(Side.Right, Side.Left)
    game.choose(Side.Left)
    reach(game, slotOf('s-ni-an') - 1, narrowVerdict)
    game.resources.value = { ...healthy(), army: 50 }
    game.choose(Side.Right)
    expect(game.decisions.value).toHaveLength(slotOf('s-ni-an'))
    expect(game.currentCard.value?.id).not.toBe('s-wei-coup')
  })

  it('当逆案止坐首恶时，崇祯八年没有中官监军之请', () => {
    const game = toArrest(Side.Right, Side.Right)
    // 收束选右：不落「内侍欠情」，中官监军之请才该整步不入池
    game.choose(Side.Right)
    reach(game, slotOf('s-ni-an'), narrowVerdict)
    game.resources.value = healthy()
    game.choose(Side.Left)
    expect(game.flags.value[Flag.逆案尽列]).toBeUndefined()
    reach(game, slotOf('c-eunuch-marshal-owed') - 1, narrowVerdict)
    game.resources.value = healthy()
    game.choose(Side.Right)
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

describe('T1 洛阳之围分支', () => {
  const byId = new Map(ALL_EVENTS.map((event) => [event.id, event]))

  /** 从开局直走到指定卡牌；沿途补满国势避免中途失衡，可先在开局带上某旗标 */
  function toCard(id: string, opts: { preflag?: Flag; decide?: (card: GameEvent) => Side } = {}) {
    const game = useGame()
    game.startGame()
    if (opts.preflag !== undefined) game.flags.value = { ...game.flags.value, [opts.preflag]: 1 }
    for (let guard = 0; guard < 300; guard++) {
      const card = game.currentCard.value
      if (!card || game.isOver.value) break
      if (card.id === id) return game
      game.resources.value = healthy()
      game.choose(opts.decide?.(card) ?? Side.Right)
    }
    throw new Error(`未走到 ${id}`)
  }

  it('当正月洛阳被围时，史实一线把福王送上生死页，后接福王之丧', () => {
    const game = toCard('s-luoyang')
    expect(game.flags.value[Flag.招抚流亡]).toBeUndefined()
    expect(game.flags.value[Flag.福王散财]).toBeUndefined()
    game.choose(Side.Right)
    expect(game.verdict.value?.life?.charId).toBe('fuwang')
    // 开封河患的次步与洛阳并键，两拍之间只隔一议
    expect(game.currentCard.value?.id).toBe('c-river-survey-landmarks')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('s-fuwang-mourning')
    game.choose(Side.Left)
    expect(game.currentCard.value?.id).toBe('c-kaifeng-emergency-plan')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('s-xiangyang-fall')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('s-luoyang-blame')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('s-jinzhou')
  })

  it('当十三年大饥与洛西告陷先后落议时，洛阳孤悬之报才到御前', () => {
    const game = toCard('s-henan-famine')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('s-luoxi-fall')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('c-river-maintenance-patches')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('s-luoyang')
  })

  it('当诏福王散财时，洛阳得全，后接诸藩助饷之议与不带洛阳回指的襄阳', () => {
    const game = toCard('s-luoyang', { decide: (card) => (card.id === 's-luoyang' ? Side.Left : Side.Right) })
    game.choose(Side.Left)
    expect(game.flags.value[Flag.福王散财]).toBe(1)
    expect(game.verdict.value?.life?.charId).toBe('fuwang')
    expect(game.currentCard.value?.id).toBe('c-river-survey-landmarks')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('g-luoyang-precedent')
    game.choose(Side.Left)
    expect(game.currentCard.value?.id).toBe('c-kaifeng-emergency-plan')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('c-xiangyang-fall')
    game.choose(Side.Right)
    // 追责一议随陷藩而设，洛阳得全的一线不设此问
    expect(game.currentCard.value?.id).toBe('s-jinzhou')
  })

  it('当招抚流亡已成时，洛阳只剩粮仓之议，丧典与追责整步跳过', () => {
    const game = toCard('c-luoyang-famine', { preflag: Flag.招抚流亡 })
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('c-river-survey-landmarks')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('c-kaifeng-emergency-plan')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('c-xiangyang-fall')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('s-jinzhou')
  })

  it('当招抚流亡已成时，洛西告陷之议不登场', () => {
    const game = toCard('s-henan-famine', { preflag: Flag.招抚流亡 })
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('c-river-maintenance-patches')
  })

  it('当两题襄阳并存时，只有洛阳未破的变体谈襄阳而不谈福王之死', () => {
    expect(byId.get('s-xiangyang-fall')!.text).toContain('洛阳')
    expect(byId.get('c-xiangyang-fall')!.text).not.toContain('洛阳')
    expect(byId.get('c-xiangyang-fall')!.text).not.toContain('福王')
    expect(byId.get('s-fuwang-mourning')!.text).toContain('吕维祺')
    expect(byId.get('c-luoyang-famine')!.text).toContain('福王')
  })

  it('洛阳一线四拍在卡面内互相回指：大饥、告陷、陷藩、追责', () => {
    expect(byId.get('s-luoxi-fall')!.text).toContain('商洛')
    expect(byId.get('s-luoyang')!.text).toContain('大饥')
    expect(byId.get('s-luoyang')!.text).toContain('积欠未清')
    expect(byId.get('s-luoyang')!.right.response).toContain('开北门')
    expect(byId.get('s-luoyang')!.right.response).not.toContain('援兵未集')
    expect(byId.get('s-luoyang')!.left.response).toContain('无异志')
    const blame = byId.get('s-luoyang-blame')!
    expect(blame.text).toContain('王绍禹')
    expect(blame.text).toContain('李仙风')
    expect(blame.left.response).toContain('洛藏')
    expect(blame.excludes).toContain(Flag.福王散财)
    expect(blame.excludes).toContain(Flag.招抚流亡)
  })

  it('人物数据与改写的陷落机制同步：李自成补十三年轨迹，福王判词不再说援兵未集', () => {
    const licheng = CHARACTERS.find((char) => char.id === 'licheng')!
    expect((licheng.track ?? []).find((t) => t.year === 13)?.note).toContain('商洛')
    const fuwang = CHARACTERS.find((char) => char.id === 'fuwang')!
    const fate = (fuwang.fates ?? []).find((f) => f.event === 's-luoyang' && f.side === Side.Right)!
    expect(fate.note).not.toContain('援兵未集')
    expect(fate.note).toContain('兵心不固')
  })
})

describe('T1 商洛山中分支', () => {
  const byId = new Map(ALL_EVENTS.map((event) => [event.id, event]))

  /** 从当前进度继续走到指定卡；沿途补满国势，可按卡逐个决定走向 */
  function walk(game: Game, id: string, decide?: (card: GameEvent) => Side) {
    for (let guard = 0; guard < 300; guard++) {
      const card = game.currentCard.value
      if (!card || game.isOver.value) break
      if (card.id === id) return
      game.resources.value = healthy()
      game.choose(decide?.(card) ?? Side.Right)
    }
    throw new Error(`未走到 ${id}`)
  }

  /** 从开局直走到指定卡；可先在开局带上某旗标 */
  function toCard(id: string, opts: { preflag?: Flag; decide?: (card: GameEvent) => Side } = {}) {
    const game = useGame()
    game.startGame()
    if (opts.preflag !== undefined) game.flags.value = { ...game.flags.value, [opts.preflag]: 1 }
    walk(game, id, opts.decide)
    return game
  }

  it('当秦兵照诏入卫时，商洛搜山之议不登场，洛阳一线的史实链不受扰', () => {
    const game = toCard('s-tongguanyuan')
    game.choose(Side.Right)
    expect(game.currentCard.value?.id).toBe('s-qinbing-ruwei')
    game.choose(Side.Right)
    expect(game.flags.value[Flag.留秦兵毕剿]).toBeUndefined()
    expect(game.verdict.value?.life ?? null).toBeNull()
    walk(game, 's-luoxi-fall')
    expect(game.seenEventIds.value.has('s-shangluo-hunt')).toBe(false)
  })

  it('当留秦兵毕剿且挥军合围时，李自成殁于商洛，闯军一线整组让位于洛阳变体', () => {
    const game = toCard('s-qinbing-ruwei')
    game.choose(Side.Left)
    expect(game.flags.value[Flag.留秦兵毕剿]).toBe(1)
    expect(game.currentCard.value?.id).toBe('s-shangluo-hunt')
    game.choose(Side.Left)
    expect(game.flags.value[Flag.闯殁商洛]).toBe(1)
    expect(game.verdict.value?.life?.charId).toBe('licheng')
    expect(game.verdict.value?.life?.status).toBe(CharStatus.Dead)
    expect(game.verdict.value?.life?.seal).toBe('殁')
    walk(game, 's-jinzhou')
    const seen = game.seenEventIds.value
    expect(seen.has('c-luoyang-famine')).toBe(true)
    expect(seen.has('c-xiangyang-fall')).toBe(true)
    for (const id of ['s-luoxi-fall', 's-luoyang', 's-fuwang-mourning', 's-xiangyang-fall', 's-luoyang-blame']) {
      expect(seen.has(id), id).toBe(false)
    }
  })

  it('当搜山撤围时，洛阳五卡照旧登场，李自成仍在山中', () => {
    const game = toCard('s-shangluo-hunt', { decide: (card) => (card.id === 's-qinbing-ruwei' ? Side.Left : Side.Right) })
    game.choose(Side.Right)
    expect(game.flags.value[Flag.闯殁商洛]).toBeUndefined()
    expect(game.verdict.value?.life?.charId).toBe('licheng')
    expect(game.verdict.value?.life?.status).toBe(CharStatus.Alive)
    walk(game, 's-luoxi-fall')
    walk(game, 's-luoyang')
    walk(game, 's-fuwang-mourning')
    walk(game, 's-luoyang-blame')
    expect(game.seenEventIds.value.has('s-xiangyang-fall')).toBe(true)
  })

  it('当招抚流亡已成时，商洛三卡整组不登场', () => {
    const game = toCard('s-sunchengzong-martyr', { preflag: Flag.招抚流亡 })
    for (const id of ['s-tongguanyuan', 's-qinbing-ruwei', 's-shangluo-hunt']) {
      expect(game.seenEventIds.value.has(id), id).toBe(false)
    }
  })

  it('三卡数据自洽：潼关原写十八骑遁商洛，搜山须先留兵，闯殁与招抚互斥', () => {
    const tong = byId.get('s-tongguanyuan')!
    expect(tong.text).toContain('十八骑')
    expect(tong.text).toContain('商洛')
    const qin = byId.get('s-qinbing-ruwei')!
    expect(qin.left.sets).toContain(Flag.留秦兵毕剿)
    expect(qin.right.sets ?? []).toHaveLength(0)
    const hunt = byId.get('s-shangluo-hunt')!
    expect(hunt.requires?.some((rule) => (typeof rule === 'string' ? rule : rule.flag) === Flag.留秦兵毕剿)).toBe(true)
    expect(hunt.left.sets).toContain(Flag.闯殁商洛)
    expect(hunt.right.sets ?? []).toHaveLength(0)
    for (const id of ['s-tongguanyuan', 's-qinbing-ruwei', 's-shangluo-hunt']) {
      expect(byId.get(id)!.excludes, id).toContain(Flag.招抚流亡)
    }
    for (const id of ['s-luoxi-fall', 's-luoyang', 's-fuwang-mourning', 's-luoyang-blame', 's-xiangyang-fall']) {
      expect(byId.get(id)!.excludes, id).toContain(Flag.闯殁商洛)
    }
  })

  it('人物数据与改史同步：李自成补潼关败迹与商洛殁之判词，孙传庭留兵一线另有判词', () => {
    const licheng = CHARACTERS.find((char) => char.id === 'licheng')!
    for (const id of ['s-tongguanyuan', 's-qinbing-ruwei', 's-shangluo-hunt']) {
      expect(licheng.events).toContain(id)
    }
    expect((licheng.track ?? []).find((t) => t.year === 11)?.note).toContain('十八骑')
    const hunt = (licheng.fates ?? []).filter((f) => f.event === 's-shangluo-hunt')
    const dead = hunt.find((f) => f.side === Side.Left)!
    expect(dead.status).toBe(CharStatus.Dead)
    expect(dead.seal).toBe('殁')
    expect(hunt.find((f) => f.side === Side.Right)!.status).toBe(CharStatus.Alive)
    expect((licheng.track ?? []).find((t) => t.year === 18)!.unlessEvent).toContain('s-shangluo-hunt')
    const sunchuan = CHARACTERS.find((char) => char.id === 'sunchuanting')!
    expect((sunchuan.fates ?? []).some((f) => f.event === 's-qinbing-ruwei' && f.side === Side.Left)).toBe(true)
  })
})

describe('T1 本兵虚悬分支', () => {
  const byId = new Map(ALL_EVENTS.map((event) => [event.id, event]))

  /** 从开局直走到指定卡；沿途补满国势，可按卡逐个决定走向 */
  function toCard(id: string, decide?: (card: GameEvent) => Side) {
    const game = useGame()
    game.startGame()
    for (let guard = 0; guard < 300; guard++) {
      const card = game.currentCard.value
      if (!card || game.isOver.value) break
      if (card.id === id) return game
      game.resources.value = healthy()
      game.choose(decide?.(card) ?? Side.Right)
    }
    throw new Error(`未走到 ${id}`)
  }

  it('当杨鹤逮问谪戍时，起复以夺情入，出卡即接卢象升请战', () => {
    const game = toCard('s-duoqing', (card) => (card.id === 's-yanghe-fuju' ? Side.Left : Side.Right))
    expect(game.flags.value[Flag.杨鹤谪戍]).toBe(1)
    game.choose(Side.Right)
    expect(game.verdict.value?.life ?? null).toBeNull()
    expect(game.currentCard.value?.id).toBe('s-luxiangsheng-war')
  })

  it('当杨鹤姑留原任时，换成本兵授任一卡，卡面不设夺情之问', () => {
    const game = toCard('c-bingbu-xuren')
    expect(game.flags.value[Flag.杨鹤谪戍]).toBeUndefined()
    const card = game.currentCard.value!
    expect(card.text).not.toContain('夺情')
    expect(card.text).not.toContain('居丧')
    game.choose(Side.Left)
    expect(game.currentCard.value?.id).toBe('s-luxiangsheng-war')
  })

  it('两卡各自点名杨嗣昌且只挂他一张脸，其后卢象升请战不再提居丧', () => {
    for (const id of ['s-duoqing', 'c-bingbu-xuren']) {
      const card = byId.get(id)!
      expect(card.text).toContain('杨嗣昌')
      expect(card.text).not.toContain('杨鹤')
      expect(card.people).toEqual(['杨嗣昌'])
      expect(cardPortrait(card)?.char.id).toBe('yangsichang')
    }
    expect(byId.get('s-luxiangsheng-war')!.text).not.toContain('居丧')
  })

  it('两面各留一条判词，出议不见生死', () => {
    const yang = CHARACTERS.find((char) => char.id === 'yangsichang')!
    for (const id of ['s-duoqing', 'c-bingbu-xuren']) {
      expect(yang.events).toContain(id)
      for (const side of [Side.Left, Side.Right]) {
        const fate = (yang.fates ?? []).find((f) => f.event === id && f.side === side)
        expect(fate, `${id} ${side}`).toBeDefined()
        expect(fate!.status).toBe(CharStatus.Alive)
      }
    }
  })
})

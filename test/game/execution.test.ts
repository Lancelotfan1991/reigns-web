import { afterEach, describe, expect, it, vi } from 'vitest'
import { executionChance, executionModifier, resolveExecution } from '../../src/composables/execution'
import { useGame, type Game } from '../../src/composables/useGame'
import { ALL_EVENTS } from '../../src/data/chapters'
import { Flag, Side } from '../../src/types'
import { healthy } from './helpers'

function cardOf(id: string) {
  const card = ALL_EVENTS.find((event) => event.id === id)
  if (!card) throw new Error(`未找到事件 ${id}`)
  return card
}

/** 沿全右路线走到指定卡；分支卡未必落在 slotOf 的计数上，故按卡名找 */
function reachCard(game: Game, id: string) {
  for (let step = 0; step < 300; step++) {
    const card = game.currentCard.value
    if (!card) break
    if (card.id === id) return
    game.resources.value = healthy()
    game.choose(Side.Right)
  }
  throw new Error(`未能走到 ${id}，当前为 ${game.currentCard.value?.id ?? '已终局'}`)
}

const DONGJIANG = cardOf('s-dongjiang').left.check!
const FISCAL = cardOf('k-fiscal-gap').left.check!
const HANZAI = cardOf('s-hanzai').left.check!

afterEach(() => {
  vi.restoreAllMocks()
})

describe('执行判定：成功率', () => {
  it('常规国势下，承办官员的才具与政令类型都会计入修正', () => {
    expect(executionModifier(DONGJIANG, healthy())).toBe(1)
    expect(executionChance(DONGJIANG, healthy())).toBe(58)
    expect(executionChance(FISCAL, healthy())).toBe(72)
    expect(executionChance(HANZAI, healthy())).toBe(42)
  })

  it('国势变好会提高成功率，君威和法度低落会压低成功率', () => {
    expect(executionChance(DONGJIANG, { ...healthy(), court: 75, law: 75 })).toBe(83)
    expect(executionChance(DONGJIANG, { ...healthy(), court: 25, law: 25 })).toBe(28)
  })
})

describe('执行判定：结果', () => {
  it('骰子只够过第二道线时，按部分办成结算并采用部分办成的影响', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(2 / 6).mockReturnValueOnce(2 / 6)
    const resolution = resolveExecution(DONGJIANG, cardOf('s-dongjiang').left, healthy())
    expect(resolution.result.dice).toEqual([3, 3])
    expect(resolution.result.tier).toBe('partial')
    expect(resolution.result.label).toBe('只办成一部分')
    expect(resolution.effects).toEqual(DONGJIANG.partial.effects)
  })

  it('骰子越过完全办成的线时，沿用该选项原本的国势影响', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.99).mockReturnValueOnce(0.99)
    const choice = cardOf('s-dongjiang').left
    const resolution = resolveExecution(DONGJIANG, choice, healthy())
    expect(resolution.result.tier).toBe('success')
    expect(resolution.effects).toBe(choice.effects)
  })

  it('骰子低于部分办成的线时，结果正文写明政令没有落地', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0)
    const resolution = resolveExecution(DONGJIANG, cardOf('s-dongjiang').left, healthy())
    expect(resolution.result.dice).toEqual([1, 1])
    expect(resolution.result.tier).toBe('fail')
    expect(resolution.result.report).toContain('没有办成')
  })
})

describe('执行判定：接入牌局', () => {
  it('未开判定时，关键政令仍走原定结果，不显示执行结果', () => {
    const game = useGame()
    game.startGame()
    reachCard(game, 's-dongjiang')
    game.choose(Side.Left)
    expect(game.previewCheck(Side.Left)).toBeNull()
    expect(game.verdict.value?.execution).toBeUndefined()
    expect(game.verdict.value?.response).toBe(cardOf('s-dongjiang').left.response)
  })

  it('判定模式下，成功率可以提前看到，失败的后果按结果正文改写国势', () => {
    const plain = useGame()
    plain.startGame()
    reachCard(plain, 's-dongjiang')

    const checked = useGame({ executionChecks: true })
    checked.startGame()
    reachCard(checked, 's-dongjiang')

    plain.resources.value = healthy()
    checked.resources.value = healthy()
    expect(checked.previewCheck(Side.Left)).toEqual({
      kind: '整顿',
      obstacle: '东江镇',
      difficulty: 2,
      chance: 58,
    })
    expect(checked.previewCheck(Side.Right)).toBeNull()

    vi.spyOn(Math, 'random').mockReturnValue(0)
    checked.choose(Side.Left)
    plain.choose(Side.Left)

    expect(checked.verdict.value?.execution).toMatchObject({
      tier: 'fail',
      label: '没能办成',
      dice: [1, 1],
    })
    expect(checked.verdict.value?.response).toBe(DONGJIANG.decision)
    expect(checked.verdict.value?.response).not.toBe(cardOf('s-dongjiang').left.response)

    expect(checked.resources.value.court - plain.resources.value.court).toBe(-5)
    expect(checked.resources.value.law - plain.resources.value.law).toBe(-6)
    expect(checked.resources.value.army - plain.resources.value.army).toBe(6)
    expect(checked.resources.value.gold - plain.resources.value.gold).toBe(-12)
  })

  it('即便判定失败，政令本身写下的旗标仍然保留', () => {
    const game = useGame({ executionChecks: true })
    game.startGame()
    reachCard(game, 'k-fiscal-gap')
    expect(game.currentCard.value?.id).toBe('k-fiscal-gap')
    game.resources.value = healthy()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    game.choose(Side.Left)
    expect(game.verdict.value?.execution?.tier).toBe('fail')
    expect(game.flags.value[Flag.原额催解]).toBe(1)
  })
})

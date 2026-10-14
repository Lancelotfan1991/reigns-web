import { vi } from 'vitest'
import { useGame, type Game } from '../../src/composables/useGame'
import { RESOURCE_KEYS, UNREST_LINE, dealNext, yearOf, yearTick } from '../../src/composables/simulation'
import { EVENT_SLOT } from '../../src/data/chapters'
import { Side } from '../../src/types'
import type { GameEvent, ResourceKey } from '../../src/types'

/** 按事件 ID 反查当前槽位；找不到时抛错，提醒更新测试 */
export function slotOf(eventId: string): number {
  const slot = EVENT_SLOT[eventId]
  if (slot === undefined) throw new Error(`slotOf: 未找到事件 ${eventId}，请检查 ID 或数据`)
  return slot
}

export const healthy = (): Record<ResourceKey, number> => ({ court: 60, law: 60, army: 60, gold: 60, people: 80 })

export function seedRandom(seed: number) {
  let value = seed >>> 0
  return vi.spyOn(Math, 'random').mockImplementation(() => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 4294967296
  })
}

export function reach(game: Game, index: number, decide: (id: string) => Side = () => Side.Right) {
  while (game.decisions.value.length < index) {
    const card = game.currentCard.value
    if (!card || game.isOver.value) throw new Error('Test setup ended before target slot')
    game.resources.value = healthy()
    game.choose(decide(card.id))
  }
  // 推进装置不替页面读批复：留到断言前会挡住下一问
  game.dismissVerdict()
}

/** 终章候选：两侧任一带 finale 字段 */
const isFinaleCard = (card: GameEvent) => !!(card.left.finale || card.right.finale)

/**
 * 走到终章前一张，覆盖旗标与资源后落一子：翻开的第一张即按旗标与国势出的终章候选。
 * 资源补偿本议效果与岁耗，使终章翻开时恰为 target；走空或终章未按期翻开即抛错，防断言空转。
 */
export function atFinale(flags: Record<string, number>, target = healthy()) {
  const game = useGame()
  game.startGame()
  while (!game.isOver.value && game.currentCard.value && !isFinaleCard(game.currentCard.value)) {
    const snap = game.snapshot()
    if (!snap) break
    const peek = dealNext(snap.flags, snap.resources, snap.deal)
    if (!peek.card || isFinaleCard(peek.card)) break
    game.resources.value = healthy()
    game.choose(Side.Right)
  }
  const card = game.currentCard.value
  if (!card || game.isOver.value) throw new Error('atFinale: 未能走到终章前一张')
  game.flags.value = { ...flags }
  const before = { ...target }
  for (const key of RESOURCE_KEYS) before[key] -= card.right.effects[key] ?? 0
  const tick = yearTick(yearOf(game.cardKey.value), game.decisions.value.at(-1)?.year ?? -1)
  if (!game.customsFunded.value) before.gold += tick
  if (!game.workshopsSupplied.value) before.army += tick
  if (target.people < UNREST_LINE) {
    before.army += tick
    before.law += tick
  }
  game.resources.value = before
  game.choose(Side.Right)
  const landed = game.currentCard.value
  if (!landed || !isFinaleCard(landed)) throw new Error('atFinale: 终章未在下一议翻开')
  return game
}

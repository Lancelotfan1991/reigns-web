import { vi } from 'vitest'
import { useGame, type Game } from '../../src/composables/useGame'
import { ALL_EVENTS, EVENT_SLOT } from '../../src/data/chapters'
import { REFORM_REQUIREMENTS } from '../../src/data/reforms'
import { CARDS_PER_YEAR, SCRIPT_SLOTS } from '../../src/composables/slots'
import type { ResourceKey, Side } from '../../types'

export { CARDS_PER_YEAR, SCRIPT_SLOTS }

/** 按事件 ID 反查当前槽位；找不到时抛错，提醒更新测试 */
export function slotOf(eventId: string): number {
  const slot = EVENT_SLOT[eventId]
  if (slot === undefined) throw new Error(`slotOf: 未找到事件 ${eventId}，请检查 ID 或数据`)
  return slot
}

const storyCards = new Map(ALL_EVENTS.map((card) => [card.id, card]))
const prerequisites = new Set(ALL_EVENTS.flatMap((card) =>
  (card.requires ?? []).map((rule) => typeof rule === 'string' ? rule : rule.flag)))

export function progressSide(id: string): Side {
  const card = storyCards.get(id)
  if (!card) return 'right'
  const sides = (['left', 'right'] as const).filter((side) => !card[side].sets?.includes('exec'))
  return sides.find((side) => card[side].sets?.some((flag) => REFORM_REQUIREMENTS.includes(flag)))
    ?? sides.find((side) => card[side].sets?.some((flag) => prerequisites.has(flag)))
    ?? 'right'
}

export const healthy = (): Record<ResourceKey, number> => ({ court: 60, law: 60, army: 60, gold: 60, people: 80 })

export function seedRandom(seed: number) {
  let value = seed >>> 0
  return vi.spyOn(Math, 'random').mockImplementation(() => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 4294967296
  })
}

export function reach(game: Game, index: number, decide: (id: string) => Side = () => 'right') {
  while (game.decisions.value.length < index) {
    const card = game.currentCard.value
    if (!card || game.isOver.value) throw new Error('Test setup ended before target slot')
    game.resources.value = healthy()
    game.choose(decide(card.id))
  }
  // 推进装置不替页面读批复：留到断言前会挡住下一问
  game.dismissVerdict()
}

export function atFinale(flags: Record<string, number>, target = healthy()) {
  const game = useGame()
  game.startGame()
  reach(game, SCRIPT_SLOTS - 1)
  const card = game.currentCard.value!
  game.flags.value = { ...flags }
  const before = { ...target }
  for (const key of Object.keys(before) as ResourceKey[]) before[key] -= card.right.effects[key] ?? 0
  if (!game.customsFunded.value) before.gold += 1
  if (!game.workshopsSupplied.value) before.army += 1
  if (target.people < 30) {
    before.army += 1
    before.law += 1
  }
  game.resources.value = before
  game.choose('right')
  return game
}

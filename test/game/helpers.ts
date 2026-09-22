import { vi } from 'vitest'
import { useGame, type Game } from '../../src/composables/useGame'
import type { ResourceKey, Side } from '../../src/types'

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
}

export function atFinale(flags: Record<string, number>, target = healthy()) {
  const game = useGame()
  game.startGame()
  reach(game, 84)
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

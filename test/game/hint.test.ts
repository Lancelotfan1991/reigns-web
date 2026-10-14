import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { advise } from '../../src/composables/useHint'
import type { SimState } from '../../src/composables/simulation'
import { ALL_EVENTS } from '../../src/data/chapters'
import { REFORM_REQUIREMENTS } from '../../src/data/reforms'
import { healthy } from './helpers'

const gewu = ALL_EVENTS.find((card) => card.id === 'g-finale-gewu')!

/** 终章前一刻的局势：手上是 g-finale-gewu，只差按下裁决 */
function finaleState(flags: string[], resources = healthy()): SimState {
  return {
    card: gewu,
    flags: Object.fromEntries(flags.map((flag) => [flag, 1])),
    resources,
    deal: {},
  }
}

beforeEach(() => {
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

describe('God 模式推演', () => {
  it('旗标已齐且四象在档时，终章给出必胜的左印', () => {
    expect(advise(finaleState(REFORM_REQUIREMENTS), [])).toEqual({ side: 'left', certain: true })
  })

  it('旗标未齐时不谎称必胜', () => {
    expect(advise(finaleState([]), []).certain).toBe(false)
  })

  it('四象出档时不谎称必胜', () => {
    expect(advise(finaleState(REFORM_REQUIREMENTS, { ...healthy(), gold: 10 }), []).certain).toBe(false)
  })
})

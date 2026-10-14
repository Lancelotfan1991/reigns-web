import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAR_MAP } from '../../src/data/characters'
import { ALL_EVENTS, EVENT_SLOT } from '../../src/data/chapters'
import { findLifeVerdict, resolveFate } from '../../src/composables/fates'
import { addFlags } from '../../src/composables/simulation'
import { useGame } from '../../src/composables/useGame'
import { yearOf } from '../../src/composables/slots'
import type { FateCtx } from '../../src/composables/fates'
import { CharStatus, Side } from '../../src/types'
import type { Decision, GameEvent } from '../../src/types'
import { seedRandom } from '../game/helpers'

/** 运行时真正会发出的卡（篇章直排牌堆） */
const pool = new Map<string, GameEvent>()
for (const card of ALL_EVENTS) {
  pool.set(card.id, card)
}
const cards = [...pool.values()]

/** 卡所属槽位的崇祯纪年 */
function yearOfCard(card: GameEvent): number {
  return yearOf(EVENT_SLOT[card.id])
}

function ctxOf(card: GameEvent, side: Side, flags: Record<string, number> = {}): FateCtx {
  const year = yearOfCard(card)
  const decided: Record<string, Decision> = { [card.id]: { eventId: card.id, side, year } }
  return { now: year, decided, flags: addFlags(flags, (side === Side.Left ? card.left : card.right).sets) }
}

function lifeOf(id: string, side: Side): ReturnType<typeof findLifeVerdict> {
  const card = pool.get(id)
  if (!card) throw new Error(`Missing canonical card: ${id}`)
  return findLifeVerdict(card, ctxOf(card, side))
}

/** 会出生死页的议：一杀一活才算抉择，缺一条就说明改史断线 */
const LIFE_CARDS = [
  's-wei',
  's-wei-rash',
  's-yuanshi',
  's-yingdi',
  's-chuangjiang',
  'c-wuqiao-losses',
  's-mihe-leak',
  's-chuanti-ready',
  's-finale',
  'g-gucheng',
]

describe('生死之判', () => {
  describe('命运解析', () => {
    it('同年撞车时，抉择改写压过史实轨迹', () => {
      const card = pool.get('s-chuangjiang')!
      const fate = resolveFate(CHAR_MAP.gaoyingsiang, ctxOf(card, Side.Left))
      expect(fate.status).toBe(CharStatus.Dead)
      expect(fate.note).toContain('献俘')
    })

    it('安置查到户，抚局败露之罪便追不到督臣头上', () => {
      const base: FateCtx = { now: 17, decided: {}, flags: { 'gewu-settlement': 1 } }
      expect(resolveFate(CHAR_MAP.xiongwenchan, base).status).toBe(CharStatus.Alive)
      expect(resolveFate(CHAR_MAP.xiongwenchan, { ...base, flags: {} }).status).toBe(CharStatus.Dead)
    })
  })

  describe('反事实试算', () => {
    it('一杀一活的议各自认出被判的人，并给出另一侧的印', () => {
      for (const id of LIFE_CARDS) {
        const here = lifeOf(id, Side.Left)
        const there = lifeOf(id, Side.Right)
        expect(here, `${id} 左侧应有一页`).not.toBeNull()
        expect(there, `${id} 右侧应有一页`).not.toBeNull()
        expect(there!.charId).toBe(here!.charId)
        expect(here!.status).not.toBe(here!.other.status)
      }
    })

    it('印文钤得下：一人一印，不过两字', () => {
      for (const id of LIFE_CARDS) {
        for (const side of [Side.Left, Side.Right]) {
          const life = lifeOf(id, side)!
          expect(life.seal.length, `${id} 的印文`).toBeGreaterThanOrEqual(1)
          expect(life.seal.length, `${id} 的印文过长`).toBeLessThanOrEqual(2)
          expect(life.other.seal.length, `${id} 对侧印文`).toBeLessThanOrEqual(2)
        }
      }
    })

    it('皇帝本人的下落只归结局页，不占生死一页', () => {
      for (const card of cards) {
        for (const side of [Side.Left, Side.Right]) {
          expect(findLifeVerdict(card, ctxOf(card, side))?.charId, card.id).not.toBe('emperor')
        }
      }
    })

    it('两侧一样活（或一样死）的议不占页', () => {
      expect(lifeOf('s-jisi', Side.Left)).toBeNull()
      expect(lifeOf('s-xianzhong', Side.Left)).toBeNull()
      expect(lifeOf('s-songjin', Side.Right)).toBeNull()
    })
  })

  describe('覆盖面', () => {
    it('锁年诸议里至少十议能出生死页，掉了就是改史断线', () => {
      const firing = cards
        .filter((c) => EVENT_SLOT[c.id] !== undefined)
        .filter((c) => lifeOf(c.id, Side.Left) || lifeOf(c.id, Side.Right))
        .map((c) => c.id)
      expect(firing.length).toBeGreaterThanOrEqual(LIFE_CARDS.length)
      for (const id of LIFE_CARDS) expect(firing).toContain(id)
    })
  })

  describe('批红页与人物面板同源', () => {
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

    it('当这一议与生死无关时，批红仍是通用一页', () => {
      const game = useGame()
      game.startGame()
      game.choose(Side.Right)
      expect(game.verdict.value).not.toBeNull()
      expect(game.verdict.value!.life).toBeNull()
    })
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAR_MAP } from '../../src/data/characters'
import { STORY_EVENTS } from '../../src/data/chapters'
import { FINALE_EVENTS, RANDOM_EVENTS } from '../../src/data/events'
import { REFORM_EVENTS, REFORM_FINALES } from '../../src/data/reforms'
import { findLifeVerdict, resolveFate } from '../../src/composables/fates'
import { addFlags } from '../../src/composables/simulation'
import { useCharacters } from '../../src/composables/useCharacters'
import { CARDS_PER_YEAR, useGame } from '../../src/composables/useGame'
import type { FateCtx } from '../../src/composables/fates'
import type { Decision, GameEvent, Side } from '../../src/types'
import { healthy, progressSide, reach, seedRandom } from '../game/helpers'

/** 只取运行时真正会发出的卡：SCRIPT_EVENTS 是篇章克隆的模板，混进来会用旧文案盖掉篇章版 */
const pool = new Map<string, GameEvent>()
for (const card of [...RANDOM_EVENTS, ...FINALE_EVENTS, ...REFORM_EVENTS, ...REFORM_FINALES, ...STORY_EVENTS]) {
  pool.set(card.id, card)
}
const cards = [...pool.values()]

function ctxOf(card: GameEvent, side: Side, flags: Record<string, number> = {}): FateCtx {
  const year = card.year ?? 0
  const decided: Record<string, Decision> = { [card.id]: { eventId: card.id, side, year } }
  return { now: year, decided, flags: addFlags(flags, (side === 'left' ? card.left : card.right).sets) }
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
      const fate = resolveFate(CHAR_MAP.gaoyingsiang, ctxOf(card, 'left'))
      expect(fate.status).toBe('dead')
      expect(fate.note).toContain('献俘')
    })

    it('后日之判不到那年就不显形，面板不得提前报死', () => {
      const card = pool.get('g-gucheng')!
      const ctx = ctxOf(card, 'left')
      expect(resolveFate(CHAR_MAP.xiongwenchan, ctx).status).toBe('alive')
      const later = resolveFate(CHAR_MAP.xiongwenchan, { ...ctx, now: 13 })
      expect(later.status).toBe('dead')
      expect(later.seal).toBe('弃市')
    })

    it('安置查到户，抚局败露之罪便追不到督臣头上', () => {
      const base: FateCtx = { now: 17, decided: {}, flags: { 'gewu-settlement': 1 } }
      expect(resolveFate(CHAR_MAP.xiongwenchan, base).status).toBe('alive')
      expect(resolveFate(CHAR_MAP.xiongwenchan, { ...base, flags: {} }).status).toBe('dead')
    })
  })

  describe('反事实试算', () => {
    it('一杀一活的议各自认出被判的人，并给出另一侧的印', () => {
      for (const id of LIFE_CARDS) {
        const here = lifeOf(id, 'left')
        const there = lifeOf(id, 'right')
        expect(here, `${id} 左侧应有一页`).not.toBeNull()
        expect(there, `${id} 右侧应有一页`).not.toBeNull()
        expect(there!.charId).toBe(here!.charId)
        expect(here!.status).not.toBe(here!.other.status)
      }
    })

    it('印文钤得下：一人一印，不过两字', () => {
      for (const id of LIFE_CARDS) {
        for (const side of ['left', 'right'] as Side[]) {
          const life = lifeOf(id, side)!
          expect(life.seal.length, `${id} 的印文`).toBeGreaterThanOrEqual(1)
          expect(life.seal.length, `${id} 的印文过长`).toBeLessThanOrEqual(2)
          expect(life.other.seal.length, `${id} 对侧印文`).toBeLessThanOrEqual(2)
        }
      }
    })

    it('皇帝本人的下落只归结局页，不占生死一页', () => {
      for (const card of cards) {
        for (const side of ['left', 'right'] as Side[]) {
          expect(findLifeVerdict(card, ctxOf(card, side))?.charId, card.id).not.toBe('emperor')
        }
      }
    })

    it('两侧一样活（或一样死）的议不占页', () => {
      expect(lifeOf('s-jisi', 'left')).toBeNull()
      expect(lifeOf('s-xianzhong', 'left')).toBeNull()
      expect(lifeOf('s-songjin', 'right')).toBeNull()
    })

    it('后日方见的判词标作 pending，此刻人尚在', () => {
      expect(lifeOf('g-gucheng', 'left')!.pending).toBe(true)
      expect(lifeOf('g-gucheng', 'right')!.pending).toBe(false)
      expect(lifeOf('s-yuanshi', 'left')!.pending).toBe(false)
    })
  })

  describe('覆盖面', () => {
    it('锁年诸议里至少十议能出生死页，掉了就是改史断线', () => {
      const firing = cards
        .filter((c) => c.year !== undefined)
        .filter((c) => lifeOf(c.id, 'left') || lifeOf(c.id, 'right'))
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

    /** 开局两步照稳杀之路铺垫，第三步即御前一议「发落司礼监」 */
    function toArrest() {
      const game = useGame()
      game.startGame()
      game.choose('right')
      game.choose('right')
      expect(game.currentCard.value?.id).toBe('s-wei')
      return game
    }

    function viewOf(game: ReturnType<typeof useGame>, id: string) {
      const view = useCharacters(game).views.value.find((item) => item.char.id === id)
      if (!view) throw new Error(`Unknown character: ${id}`)
      return view
    }

    it.each(['left', 'right'] as Side[])('当发落司礼监选%s时，生死页与面板写的是同一人的同一档', (side) => {
      const game = toArrest()
      game.choose(side)
      const life = game.verdict.value!.life
      expect(life).not.toBeNull()
      expect(life!.charId).toBe('wei')
      expect(life!.pending).toBe(false)
      const view = viewOf(game, 'wei')
      expect(view.status).toBe(life!.status)
      expect(view.note).toBe(life!.note)
      game.dismissVerdict()
      expect(game.verdict.value).toBeNull()
    })

    it('当这一议与生死无关时，批红仍是通用一页', () => {
      const game = useGame()
      game.startGame()
      game.choose('right')
      expect(game.verdict.value).not.toBeNull()
      expect(game.verdict.value!.life).toBeNull()
    })

    it('当谷城安置只稳住头领时，生死页报后日之判，面板此刻仍写活档', () => {
      const game = useGame()
      game.startGame()
      const card = pool.get('g-gucheng')!
      reach(game, card.year! * CARDS_PER_YEAR + card.order! - 1, progressSide)
      expect(game.currentCard.value?.id).toBe('g-gucheng')
      game.resources.value = healthy()
      game.choose('left')
      const life = game.verdict.value!.life!
      expect(life.charId).toBe('xiongwenchan')
      expect(life.pending).toBe(true)
      expect(life.status).toBe('dead')
      expect(life.seal).toBe('弃市')
      const view = viewOf(game, 'xiongwenchan')
      expect(view.status).toBe('alive')
      expect(view.note).toContain('按原营')
    })
  })
})

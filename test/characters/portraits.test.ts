import { describe, expect, it } from 'vitest'
import { CHARACTERS, CHAR_MAP } from '../../src/data/characters'
import { STORY_EVENTS } from '../../src/data/chapters'
import { FINALE_EVENTS, RANDOM_EVENTS } from '../../src/data/events'
import { PORTRAIT_IDS, cardPortrait } from '../../src/data/portraits'
import { REFORM_EVENTS, REFORM_FINALES } from '../../src/data/reforms'
import type { GameEvent } from '../../src/types'

const IMPERIAL = '👑'

/** 只取运行时真正会发出的卡：SCRIPT_EVENTS 是篇章克隆的模板，混进来会用旧文案盖掉篇章版 */
const pool = new Map<string, GameEvent>()
for (const card of [...RANDOM_EVENTS, ...FINALE_EVENTS, ...REFORM_EVENTS, ...REFORM_FINALES, ...STORY_EVENTS]) {
  pool.set(card.id, card)
}
const cards = [...pool.values()]

function namesOf(id: string): string[] {
  const char = CHAR_MAP[id]
  return [char.name, char.name.slice(1), ...(char.alias ?? '').split('·').map((s) => s.trim())]
    .filter((n) => n.length >= 2)
}

describe('人物头像', () => {
  it('每个人像文件都对应一个真实人物', () => {
    expect(PORTRAIT_IDS.length).toBeGreaterThan(0)
    for (const id of PORTRAIT_IDS) expect(CHAR_MAP[id], `多余的人像 ${id}`).toBeDefined()
  })

  it('每个人物都有像，缺像就补 assets/portraits 下的文件', () => {
    for (const c of CHARACTERS) expect(PORTRAIT_IDS, `${c.id}「${c.name}」无人像`).toContain(c.id)
  })

  it('卡面只挂被点名或被他自己的 emoji 标出的人，宁可不上像也不上错脸', () => {
    const faced = cards
      .map((card) => ({ card, face: cardPortrait(card) }))
      .filter((x): x is { card: GameEvent; face: NonNullable<typeof x.face> } => !!x.face)
    // 36 人全员有像后实测 44/213 张上像；掉到 40 以下说明点名规则大面积失效
    expect(faced.length).toBeGreaterThanOrEqual(40)
    for (const { card, face } of faced) {
      if (card.avatar === IMPERIAL) {
        expect(face.char.id, `${card.id} 只应有皇帝本人`).toBe('emperor')
        continue
      }
      const named = PORTRAIT_IDS.filter(
        (id) => id !== 'emperor' && namesOf(id).some((n) => card.name.includes(n) || card.text.includes(n))
      )
      const claimed = named.includes(face.char.id) || card.avatar === face.char.avatar
      expect(claimed, `${card.id}「${card.name}」未点名 ${face.char.name}，不该挂他的像`).toBe(true)
      expect(named.length, `${card.id}「${card.name}」是 ${named.join('与')} 的对手戏，不该只挂一张脸`).toBeLessThanOrEqual(1)
    }
  })

  it('皇帝不会靠点名规则抢到普通卡', () => {
    for (const card of cards) {
      if (card.avatar === IMPERIAL) continue
      expect(cardPortrait(card)?.char.id, `${card.id} 不该挂皇帝的像`).not.toBe('emperor')
    }
  })
})

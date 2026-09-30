import type { Character, GameEvent } from '../types'
import { CHARACTERS } from './characters'

const smRaw = import.meta.glob('../assets/portraits/*-sm.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const lgRaw = import.meta.glob('../assets/portraits/*-lg.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function byCharId(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(map).map(([p, url]) => [p.slice(p.lastIndexOf('/') + 1).replace(/-(?:sm|lg)\.webp$/, ''), url])
  )
}

const SM = byCharId(smRaw)
const LG = byCharId(lgRaw)

/** 已有人像的人物 id；新增人像只需往 assets 里丢文件 */
export const PORTRAIT_IDS = Object.keys(SM)

export function portraitOf(charId: string): { sm: string; lg: string } | undefined {
  const sm = SM[charId]
  if (!sm) return undefined
  return { sm, lg: LG[charId] ?? sm }
}

/** 御卡的主人是皇帝本人，而皇帝 events 登记了整张卡池，不能进下面的索引 */
const IMPERIAL_AVATAR = '👑'

const portraitCast = CHARACTERS.filter((c) => c.id !== 'emperor' && !!SM[c.id])

const castByEvent = new Map<string, Character[]>()
for (const c of portraitCast) {
  for (const eventId of c.events) {
    const list = castByEvent.get(eventId)
    if (list) list.push(c)
    else castByEvent.set(eventId, [c])
  }
}

function mentions(c: Character, card: GameEvent): boolean {
  const alias = (c.alias ?? '').split('·').map((s) => s.trim())
  const keys = [c.name, c.name.slice(1), ...alias].filter((n) => n.length >= 2)
  return keys.some((n) => card.name.includes(n) || card.text.includes(n))
}

/**
 * 卡面该挂谁的脸。宁可不上像，也不能上错脸：
 * 卡名或卡文点到两位有人像的人物即视作对手戏，一张都不挂；
 * 只点到一位时，还须此人确实登记了这张卡才认；无人被点到时退回卡面 emoji。
 */
export function cardPortrait(card: GameEvent): { char: Character; lg: string } | undefined {
  if (card.avatar === IMPERIAL_AVATAR) {
    const self = CHARACTERS.find((c) => c.id === 'emperor')
    const art = self && portraitOf(self.id)
    return self && art ? { char: self, lg: art.lg } : undefined
  }
  const named = portraitCast.filter((c) => mentions(c, card))
  if (named.length > 1) return undefined
  const cast = castByEvent.get(card.id) ?? []
  const solo = cast.filter((c) => c.avatar === card.avatar)
  const hit =
    named.length === 1 && cast.includes(named[0])
      ? named[0]
      : !named.length && solo.length === 1
        ? solo[0]
        : undefined
  const art = hit && portraitOf(hit.id)
  return hit && art ? { char: hit, lg: art.lg } : undefined
}

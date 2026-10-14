import { CharStatus, Side } from '../types'
import type { Character, Decision, GameEvent, LifeVerdict } from '../types'
import { CHARACTERS } from '../data/characters'

export interface FateCtx {
  /** 当前崇祯纪年（0 = 天启七年） */
  now: number
  /** 事件 id → 本局已落下的决策 */
  decided: Record<string, Decision>
  flags: Record<string, number>
}

export interface Fate {
  status: CharStatus
  note: string
  /** 此处境始于何年 */
  at: number
  /** 一汉字印文，供生死页钤在人名上 */
  seal: string
}

const SEAL_BY_STATUS: Record<CharStatus, string> = {
  [CharStatus.Hidden]: '',
  [CharStatus.Alive]: '生',
  [CharStatus.Ill]: '病',
  [CharStatus.Dead]: '死',
}

/** 生死有大小：比两侧落子之差、挑一页之主都按此序 */
export const STATUS_RANK: Record<CharStatus, number> = {
  [CharStatus.Hidden]: -1,
  [CharStatus.Alive]: 0,
  [CharStatus.Ill]: 1,
  [CharStatus.Dead]: 2,
}

interface Node {
  year: number
  status: CharStatus
  note: string
  seal?: string
  /** 同年撞车时抉择改写压过史实轨迹 */
  rank: number
}

/** 史实轨迹为底，已做的抉择在其发生年份覆盖轨迹；取时间线上最后一条 */
export function resolveFate(ch: Character, ctx: FateCtx, appear?: number): Fate {
  const nodes: Node[] = []
  for (const t of ch.track ?? []) {
    if (t.year > ctx.now) continue
    if (t.unlessEvent?.some((e) => ctx.decided[e])) continue
    if (t.unlessFlag?.some((flag) => (ctx.flags[flag] ?? 0) > 0)) continue
    nodes.push({ ...t, rank: 0 })
  }
  for (const f of ch.fates ?? []) {
    const d = ctx.decided[f.event]
    if (!d || d.side !== f.side) continue
    const year = f.year ?? d.year
    if (year > ctx.now) continue
    nodes.push({ year, status: f.status, note: f.note, seal: f.seal, rank: 1 })
  }
  nodes.sort((a, b) => a.year - b.year || a.rank - b.rank)

  const last = nodes[nodes.length - 1]
  if (!last) {
    return { status: CharStatus.Alive, note: ch.role, at: appear ?? ctx.now, seal: SEAL_BY_STATUS[CharStatus.Alive] }
  }
  return {
    status: last.status,
    note: last.note,
    at: last.year,
    seal: last.seal ?? SEAL_BY_STATUS[last.status],
  }
}

/** 假定此议改按另一侧落，此人是何处境。本议所设旗标一并换边，否则 unlessFlag 会替人说情 */
function fateAsIf(
  ch: Character,
  ctx: FateCtx,
  card: GameEvent,
  side: Side,
  year: number
): Fate {
  const flags = { ...ctx.flags }
  for (const f of (side === Side.Left ? card.right : card.left).sets ?? []) flags[f] = Math.max(0, (flags[f] ?? 0) - 1)
  for (const f of (side === Side.Left ? card.left : card.right).sets ?? []) flags[f] = (flags[f] ?? 0) + 1
  return resolveFate(ch, {
    now: ctx.now,
    decided: { ...ctx.decided, [card.id]: { eventId: card.id, side, year } },
    flags,
  })
}

/** 命运试算看到的尽头：史实轨迹与抉择改写里最晚的一年 */
const LIFE_HORIZON = CHARACTERS.reduce(
  (max, ch) => Math.max(max, ...(ch.track ?? []).map((t) => t.year), ...(ch.fates ?? []).map((f) => f.year ?? 0)),
  0
)

/**
 * 一议落下之后，找出被这一议判了生死的人。
 * 判据是反事实：照这一侧与照另一侧，此人到头的落点不同才算——
 * 两侧一样死的（如催战必殁）不是抉择，不该占一页。
 * 落点比的是国祚尽头，因为有的判词要过几方才见分晓；晚于本议的记作 pending。
 * 皇帝本人不在此列，他的下落归结局页交代。
 */
export function findLifeVerdict(card: GameEvent, ctx: FateCtx): LifeVerdict | null {
  const real = ctx.decided[card.id]
  if (!real) return null
  const flip: Side = real.side === Side.Left ? Side.Right : Side.Left
  const then = { ...ctx, now: LIFE_HORIZON }
  let best: { ch: Character; here: Fate; there: Fate; gap: number } | null = null

  for (const ch of CHARACTERS) {
    if (ch.id === 'emperor' || !ch.events.includes(card.id)) continue
    const here = resolveFate(ch, then)
    const there = fateAsIf(ch, then, card, flip, real.year)
    const gap = Math.abs(STATUS_RANK[here.status] - STATUS_RANK[there.status])
    if (gap < 1) continue
    if (!best || gap > best.gap || (gap === best.gap && here.at < best.here.at)) {
      best = { ch, here, there, gap }
    }
  }
  if (!best) return null
  const { ch, here, there } = best
  return {
    charId: ch.id,
    name: ch.name,
    alias: ch.alias,
    role: ch.role,
    camp: ch.camp,
    status: here.status,
    seal: here.seal,
    note: here.note,
    pending: here.at > real.year,
    other: { seal: there.seal, status: there.status },
  }
}

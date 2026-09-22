import { computed } from 'vue'
import { FINALE_EVENTS, RANDOM_EVENTS, SCRIPT_EVENTS } from '../data/events'
import { CHARACTERS, CHAR_MAP, RELATION_META } from '../data/characters'
import type { CharStatus, CharView, Deed } from '../types'
import type { Game } from './useGame'
import { REFORM_EVENTS, REFORM_FINALES } from '../data/reforms'

const ALL_EVENTS = [...SCRIPT_EVENTS, ...RANDOM_EVENTS, ...FINALE_EVENTS, ...REFORM_EVENTS, ...REFORM_FINALES]

interface EventMeta {
  title: string
  /** 剧本卡的锁年；随机卡为 null */
  year: number | null
  labels: { left: string; right: string }
}

const EVENT_META: Record<string, EventMeta> = Object.fromEntries(
  ALL_EVENTS.map((e) => [
    e.id,
    { title: e.name, year: e.year ?? null, labels: { left: e.left.label, right: e.right.label } },
  ])
)

/** 崇祯纪年 → 公历年 */
function adOf(year: number): number {
  return 1627 + year
}

/**
 * 人物状态派生：史实轨迹为底，玩家已做的抉择在其发生年份覆盖轨迹，
 * 同年冲突时以抉择为准；未登场的只保留姓名与阵营。
 */
export function useCharacters(game: Game) {
  const now = game.year
  const decided = game.decisionByEvent
  const seen = game.seenEventIds

  function appearYearOf(id: string): number | null {
    const ch = CHAR_MAP[id]
    let year: number | null = null
    if (ch.appearYear !== undefined && now.value >= ch.appearYear) year = ch.appearYear
    for (const eventId of ch.events) {
      if (!seen.value.has(eventId)) continue
      const hit = EVENT_META[eventId]
      const at = decided.value[eventId]?.year ?? hit?.year ?? now.value
      if (year === null || at < year) year = at
    }
    return year
  }

  function fateOf(id: string, appear: number): { status: CharStatus; note: string; at: number } {
    const ch = CHAR_MAP[id]
    type Node = { year: number; status: CharStatus; note: string; rank: number }
    const nodes: Node[] = []

    for (const t of ch.track ?? []) {
      if (t.year > now.value) continue
      if (t.unlessEvent?.some((e) => decided.value[e])) continue
      if (t.unlessFlag?.some((flag) => (game.flags.value[flag] ?? 0) > 0)) continue
      nodes.push({ year: t.year, status: t.status, note: t.note, rank: 0 })
    }
    for (const f of ch.fates ?? []) {
      const d = decided.value[f.event]
      if (!d || d.side !== f.side) continue
      nodes.push({ year: d.year, status: f.status, note: f.note, rank: 1 })
    }
    nodes.sort((a, b) => a.year - b.year || a.rank - b.rank)

    // 终章或中途横死：皇帝本人即交代于此结局
    if (id === 'emperor' && game.isOver.value) {
      const result = game.ending.value
      const survived = result?.survived ?? result?.kind === 'glory'
      return { status: survived ? 'alive' : 'dead', note: result?.title ?? '', at: now.value }
    }
    const last = nodes[nodes.length - 1]
    if (!last) return { status: 'alive', note: ch.role, at: appear }
    return { status: last.status, note: last.note, at: last.year }
  }

  function deedsOf(id: string): Deed[] {
    const ch = CHAR_MAP[id]
    const list: Deed[] = []
    for (const eventId of ch.events) {
      if (!seen.value.has(eventId)) continue
      const meta = EVENT_META[eventId]
      if (!meta) continue
      const d = decided.value[eventId]
      list.push({
        eventId,
        title: meta.title,
        year: d?.year ?? meta.year ?? now.value,
        side: d?.side ?? null,
        label: d ? meta.labels[d.side] : '待裁决',
      })
    }
    return list.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title, 'zh'))
  }

  const views = computed<CharView[]>(() => {
    const list = CHARACTERS.map<CharView>((ch) => {
      const appear = appearYearOf(ch.id)
      if (appear === null) {
        return {
          char: ch,
          status: 'hidden',
          note: '',
          age: null,
          appearYear: null,
          deeds: [],
          relations: [],
        }
      }
      const { status, note, at } = fateOf(ch.id, appear)
      const baseYear = status === 'dead' ? at : now.value
      const age = ch.born === undefined ? null : Math.max(0, adOf(baseYear) - ch.born + 1)
      const relations = [
        ...ch.relations.map((r) => {
          const meta = RELATION_META[r.type]
          return { target: CHAR_MAP[r.to], label: meta.label, color: meta.color }
        }),
        ...CHARACTERS.filter((other) => other !== ch).flatMap((other) =>
          other.relations
            .filter((r) => r.to === ch.id)
            .map((r) => {
              const meta = RELATION_META[r.type]
              return { target: other, label: meta.inverse, color: meta.color }
            })
        ),
      ].filter((r) => r.target !== undefined)
      return { char: ch, status, note, age, appearYear: appear, deeds: deedsOf(ch.id), relations }
    })

    return list.sort((a, b) => {
      const rank = (v: CharView) => (v.appearYear === null ? 1 : 0)
      if (rank(a) !== rank(b)) return rank(a) - rank(b)
      if (a.appearYear !== b.appearYear) return (a.appearYear ?? 0) - (b.appearYear ?? 0)
      return a.char.name.localeCompare(b.char.name, 'zh')
    })
  })

  /** 已登场人数 */
  const appearedCount = computed(() => views.value.filter((v) => v.appearYear !== null).length)

  /** 各势力人物数（含未登场，用于筛选器计数） */
  const factionCount = computed(() => {
    const acc: Record<string, number> = { all: views.value.length }
    for (const v of views.value) acc[v.char.faction] = (acc[v.char.faction] ?? 0) + 1
    return acc
  })

  return { views, appearedCount, factionCount }
}

export type Characters = ReturnType<typeof useCharacters>

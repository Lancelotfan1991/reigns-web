import { computed } from 'vue'
import { CHARACTERS, CHAR_BY_NAME, CHAR_MAP, RELATION_META } from '../data/characters'
import { ALL_EVENTS, EVENT_SLOT } from '../data/chapters'
import { CharStatus, EndingKind, Side } from '../types'
import type { CharView, Deed } from '../types'
import { resolveFate } from './fates'
import type { Fate } from './fates'
import type { Game } from './useGame'
import { yearOf } from '../data/chapters'

interface EventMeta {
  title: string
  /** 卡所属牌序的崇祯纪年 */
  year: number
  labels: Record<Side, string>
}

const EVENT_META: Record<string, EventMeta> = Object.fromEntries(
  ALL_EVENTS.map((e) => [
    e.id,
    { title: e.name, year: yearOf(EVENT_SLOT[e.id]), labels: { [Side.Left]: e.left.label, [Side.Right]: e.right.label } },
  ])
)

/** 崇祯纪年 → 公历年 */
function adOf(year: number): number {
  return 1627 + year
}

interface CharacterViewOptions {
  /** 人物志全览：未到登场年的人物也按史实最早登场年解锁，不写入本局进度 */
  revealAll?: boolean
}

/**
 * 人物状态派生：史实轨迹为底，玩家已做的抉择在其发生年份覆盖轨迹，
 * 同年冲突时以抉择为准；未登场的只保留姓名与阵营。
 */
export function useCharacters(game: Game, options: CharacterViewOptions = {}) {
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

  /** 人物志用：取史实轨迹里的最早登场年，不看本局是否已翻到 */
  function historicalAppearYearOf(id: string): number {
    const ch = CHAR_MAP[id]
    let year = ch.appearYear ?? Number.POSITIVE_INFINITY
    for (const eventId of ch.events) {
      const at = EVENT_META[eventId]?.year
      if (at !== undefined && at < year) year = at
    }
    return Number.isFinite(year) ? year : 0
  }

  function fateOf(id: string, appear: number): Fate {
    const ch = CHAR_MAP[id]
    // 终章或中途横死：皇帝本人即交代于此结局
    if (id === 'emperor' && game.isOver.value) {
      const result = game.ending.value
      const survived = result?.survived ?? result?.kind === EndingKind.Glory
      return {
        status: survived ? CharStatus.Alive : CharStatus.Dead,
        note: result?.title ?? '',
        at: now.value,
        seal: survived ? '生' : '崩',
      }
    }
    return resolveFate(ch, { now: now.value, decided: decided.value, flags: game.flags.value }, appear)
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
        year: d?.year ?? meta.year,
        side: d?.side ?? null,
        label: d ? meta.labels[d.side] : '待裁决',
      })
    }
    return list.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title, 'zh'))
  }

  const views = computed<CharView[]>(() => {
    const list = CHARACTERS.map<CharView>((ch) => {
      const appear = options.revealAll ? historicalAppearYearOf(ch.id) : appearYearOf(ch.id)
      if (appear === null) {
        return {
          char: ch,
          status: CharStatus.Hidden,
          note: '',
          age: null,
          appearYear: null,
          deeds: [],
          relations: [],
        }
      }
      const { status, note, at } = fateOf(ch.id, appear)
      const baseYear = status === CharStatus.Dead ? at : now.value
      const years = ch.born === undefined ? null : adOf(baseYear) - ch.born
      const age = years !== null && years >= 0 ? years : null
      const relations = [
        ...ch.relations.map((r) => {
          const meta = RELATION_META[r.type]
          return { target: CHAR_BY_NAME[r.to], label: meta.label, color: meta.color }
        }),
        ...CHARACTERS.filter((other) => other !== ch).flatMap((other) =>
          other.relations
            .filter((r) => r.to === ch.name)
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

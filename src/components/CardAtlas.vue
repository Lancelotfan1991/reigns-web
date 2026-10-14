<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ALL_EVENTS, CHAPTERS } from '../data/chapters'
import { CHAR_MAP } from '../data/characters'
import { REFORM_REQUIREMENTS } from '../data/reforms'
import { DECK } from '../composables/simulation'
import { yearOf } from '../composables/slots'
import { RESOURCE_KEYS, RESOURCE_META, yearLabel } from '../composables/useGame'
import { Side } from '../types'
import type { DeckEntry } from '../composables/simulation'
import type { Effects, FlagRule, GameEvent, ResourceKey } from '../types'

/** 旗标在一张卡上的三种角色：产（sets）/ 需（requires）/ 斥（excludes） */
interface FlagHit {
  key: number
  card: GameEvent
  /** 产 = 侧别（左/右/左右）；需 = 门槛（≥1、≥2）；斥 = 空 */
  detail: string
}

interface FlagUse {
  name: string
  /** 首次出现在牌堆中的键：旗标列表按此排序，与编年同向 */
  firstKey: number
  produce: FlagHit[]
  require: FlagHit[]
  exclude: FlagHit[]
}

const REFORM_SET = new Set<string>(REFORM_REQUIREMENTS)

const FLAG_USES: FlagUse[] = (() => {
  const uses = new Map<string, FlagUse>()
  const ensure = (name: string): FlagUse => {
    let use = uses.get(name)
    if (!use) {
      use = { name, firstKey: Number.POSITIVE_INFINITY, produce: [], require: [], exclude: [] }
      uses.set(name, use)
    }
    return use
  }
  for (const entry of DECK) {
    for (const card of entry.cards) {
      const produced = new Map<string, string[]>()
      for (const side of [Side.Left, Side.Right]) {
        const choice = side === Side.Left ? card.left : card.right
        for (const flag of choice.sets ?? []) {
          const sides = produced.get(flag) ?? []
          sides.push(side)
          produced.set(flag, sides)
        }
      }
      for (const [flag, sides] of produced) {
        const use = ensure(flag)
        use.produce.push({ key: entry.key, card, detail: sides.join('') })
        use.firstKey = Math.min(use.firstKey, entry.key)
      }
      for (const rule of card.requires ?? []) {
        const name = typeof rule === 'string' ? rule : rule.flag
        const use = ensure(name)
        use.require.push({ key: entry.key, card, detail: typeof rule === 'string' ? '' : `≥${rule.min}` })
        use.firstKey = Math.min(use.firstKey, entry.key)
      }
      for (const flag of card.excludes ?? []) {
        const use = ensure(flag)
        use.exclude.push({ key: entry.key, card, detail: '' })
        use.firstKey = Math.min(use.firstKey, entry.key)
      }
    }
  }
  return [...uses.values()].sort((a, b) => a.firstKey - b.firstKey || a.name.localeCompare(b.name, 'zh'))
})()

const FLAG_USE_MAP = new Map<string, FlagUse>(FLAG_USES.map((use) => [use.name, use]))

interface YearGroup {
  year: number
  label: string
  ad: number
  entries: DeckEntry[]
}

const YEARS: YearGroup[] = (() => {
  const groups: YearGroup[] = []
  for (const entry of DECK) {
    const year = yearOf(entry.key)
    let group = groups[groups.length - 1]
    if (!group || group.year !== year) {
      group = { year, label: yearLabel(year), ad: 1627 + Math.min(Math.max(year, 0), 17), entries: [] }
      groups.push(group)
    }
    group.entries.push(entry)
  }
  return groups
})()

interface DetailTarget {
  card: GameEvent
  entry: DeckEntry
  index: number
}

const SIDES = [
  { key: 'left', label: '左印' },
  { key: 'right', label: '右印' },
] as const

const flagSel = ref<string | null>(null)
const flagQuery = ref('')
const onlyReform = ref(false)
const cardQuery = ref('')
const detail = ref<DetailTarget | null>(null)
const flashKey = ref<number | null>(null)
const root = ref<HTMLElement | null>(null)
let flashTimer: number | undefined

const filteredFlags = computed(() => {
  const query = flagQuery.value.trim().toLowerCase()
  return FLAG_USES.filter(
    (use) => (!onlyReform.value || REFORM_SET.has(use.name)) && (!query || use.name.toLowerCase().includes(query)),
  )
})

const flagUse = computed(() => (flagSel.value ? FLAG_USE_MAP.get(flagSel.value) ?? null : null))

/** 所选旗标在各卡上的角色索引；未选旗标时无高亮 */
const flagIndex = computed(() => {
  const use = flagUse.value
  if (!use) return null
  return {
    produce: new Map(use.produce.map((hit) => [hit.card.id, hit.detail])),
    require: new Map(use.require.map((hit) => [hit.card.id, hit.detail])),
    exclude: new Map(use.exclude.map((hit) => [hit.card.id, hit.detail])),
  }
})

const query = computed(() => cardQuery.value.trim().toLowerCase())

function matches(card: GameEvent): boolean {
  const q = query.value
  return !q || card.id.toLowerCase().includes(q) || card.name.includes(q)
}

const visibleYears = computed(() => {
  if (!query.value) return YEARS
  return YEARS.map((group) => ({ ...group, entries: group.entries.filter((entry) => entry.cards.some(matches)) })).filter(
    (group) => group.entries.length > 0,
  )
})

const visibleCount = computed(() => visibleYears.value.reduce((sum, group) => sum + group.entries.length, 0))

function markOf(card: GameEvent) {
  const index = flagIndex.value
  if (!index) return null
  const produce = index.produce.has(card.id)
  const require = index.require.has(card.id)
  const exclude = index.exclude.has(card.id)
  return {
    produce,
    require,
    exclude,
    detail: {
      produce: index.produce.get(card.id) ?? '',
      require: index.require.get(card.id) ?? '',
    },
    dim: !produce && !require && !exclude,
  }
}

function entryHit(entry: DeckEntry): boolean {
  const index = flagIndex.value
  if (!index) return false
  return entry.cards.some((card) => index.produce.has(card.id) || index.require.has(card.id) || index.exclude.has(card.id))
}

const bannerRows = computed(() => {
  const use = flagUse.value
  if (!use) return []
  const rows: { kind: string; keys: number[] }[] = []
  for (const [kind, hits] of [
    ['产', use.produce],
    ['需', use.require],
    ['斥', use.exclude],
  ] as const) {
    const keys = [...new Set(hits.map((hit) => hit.key))].sort((a, b) => a - b)
    if (keys.length) rows.push({ kind, keys })
  }
  return rows
})

function selectFlag(name: string, scroll = true) {
  if (flagSel.value === name) {
    flagSel.value = null
    return
  }
  flagSel.value = name
  const use = FLAG_USE_MAP.get(name)
  if (scroll && use) {
    const first = use.produce[0]?.key ?? use.require[0]?.key ?? use.exclude[0]?.key
    if (first !== undefined) scrollTo(first)
  }
}

function scrollTo(key: number) {
  root.value?.querySelector(`[data-key="${key}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  flashKey.value = key
  window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => (flashKey.value = null), 1400)
}

function open(card: GameEvent, entry: DeckEntry, index: number) {
  detail.value = { card, entry, index }
}

function chapterHue(id: string): number {
  let hue = 0
  for (const ch of id) hue = (hue * 31 + ch.charCodeAt(0)) % 360
  return hue
}

function ruleText(rule: FlagRule): string {
  return typeof rule === 'string' ? rule : `${rule.flag} ≥ ${rule.min}`
}

function boundsOf(card: GameEvent): string[] {
  const bounds = card.resourceBounds
  if (!bounds) return []
  return RESOURCE_KEYS.flatMap((key) => {
    const bound = bounds[key]
    if (!bound) return []
    return [`${RESOURCE_META[key].name} ${bound.min ?? 0}–${bound.max ?? 100}`]
  })
}

function effectLines(effects: Effects): string[] {
  return RESOURCE_KEYS.flatMap((key: ResourceKey) => {
    const value = effects[key]
    if (!value) return []
    return [`${RESOURCE_META[key].icon}${RESOURCE_META[key].name} ${value > 0 ? '+' : ''}${value}`]
  })
}

function peopleNames(card: GameEvent): string[] {
  return (card.people ?? []).map((id) => CHAR_MAP[id]?.name ?? id)
}

function backToGame() {
  const url = new URL(window.location.href)
  url.searchParams.delete('atlas')
  window.location.href = url.toString()
}

function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (detail.value) {
    detail.value = null
  } else if (flagSel.value) {
    flagSel.value = null
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.clearTimeout(flashTimer)
})
</script>

<template>
  <div ref="root" class="atlas">
    <header class="bar">
      <h1>塘报图谱</h1>
      <p class="stats">
        {{ CHAPTERS.length }} 篇章 · {{ DECK.length }} 步 · {{ ALL_EVENTS.length }} 张候选卡 · {{ FLAG_USES.length }} 面旗标
      </p>
      <input v-model="cardQuery" class="search" type="search" placeholder="搜卡：id 或名字" />
      <button class="back" @click="backToGame">返回游戏</button>
    </header>

    <div class="body">
      <aside class="flags">
        <div class="flag-head">
          <input v-model="flagQuery" class="search" type="search" placeholder="搜旗标" />
          <div class="seg">
            <button :class="{ on: !onlyReform }" @click="onlyReform = false">全部</button>
            <button :class="{ on: onlyReform }" @click="onlyReform = true">格物所需</button>
          </div>
        </div>
        <ul class="flag-list">
          <li v-for="use in filteredFlags" :key="use.name">
            <button class="flag-row" :class="{ on: flagSel === use.name }" @click="selectFlag(use.name)">
              <span class="fname">
                {{ use.name }}
                <i v-if="REFORM_SET.has(use.name)" class="reform-mark">格</i>
              </span>
              <span class="cnt">
                <i v-if="use.produce.length" class="prod">产{{ use.produce.length }}</i>
                <i v-if="use.require.length" class="need">需{{ use.require.length }}</i>
                <i v-if="use.exclude.length" class="excl">斥{{ use.exclude.length }}</i>
              </span>
            </button>
          </li>
        </ul>
        <p class="legend">
          <i class="prod">产</i>= 选项写下该旗标 ·
          <i class="need">需</i>= 登场前提 ·
          <i class="excl">斥</i>= 有此即不登场
        </p>
      </aside>

      <main class="timeline">
        <div v-if="flagUse" class="sel-banner">
          <b>旗标「{{ flagUse.name }}」</b>
          <template v-for="row in bannerRows" :key="row.kind">
            <span class="sel-kind" :class="{ prod: row.kind === '产', need: row.kind === '需', excl: row.kind === '斥' }">{{ row.kind }}</span>
            <button v-for="key in row.keys" :key="`${row.kind}-${key}`" class="kchip" @click="scrollTo(key)">键 {{ key }}</button>
          </template>
          <button class="kclear" @click="flagSel = null">清空</button>
        </div>

        <section v-for="group in visibleYears" :key="group.year" class="year">
          <h2>{{ group.label }}（{{ group.ad }}）<small>{{ group.entries.length }} 步</small></h2>
          <article
            v-for="entry in group.entries"
            :key="`${entry.key}-${entry.chapter.id}-${entry.step}`"
            class="entry"
            :class="{ chaptered: entry.chapter.steps.length > 1, faded: flagIndex && !entryHit(entry), flash: flashKey === entry.key }"
            :data-key="entry.key"
            :style="entry.chapter.steps.length > 1 ? { borderLeftColor: `hsl(${chapterHue(entry.chapter.id)} 42% 45%)` } : undefined"
          >
            <header class="ehead">
              <b class="ekey">键 {{ entry.key }}</b>
              <span class="echap" :style="entry.chapter.steps.length > 1 ? { color: `hsl(${chapterHue(entry.chapter.id)} 42% 38%)` } : undefined">
                {{ entry.chapter.name }}
                <template v-if="entry.chapter.steps.length > 1">· 第 {{ entry.step + 1 }}/{{ entry.chapter.steps.length }} 步</template>
              </span>
              <span v-if="entry.cards.length > 1" class="ecand">候选 {{ entry.cards.length }}</span>
            </header>
            <ol class="plist">
              <li v-for="(card, index) in entry.cards" :key="card.id">
                <button
                  class="tile"
                  :class="[{ prod: markOf(card)?.produce, need: markOf(card)?.require, excl: markOf(card)?.exclude, dim: markOf(card)?.dim, hit: query && matches(card) }]"
                  @click="open(card, entry, index)"
                >
                  <span v-if="entry.cards.length > 1" class="order">{{ index + 1 }}</span>
                  <span class="ava">{{ card.avatar }}</span>
                  <span class="nm">{{ card.name }}</span>
                  <span class="cid">{{ card.id }}</span>
                  <span class="marks">
                    <i v-if="card.requires?.length" class="cmark">条</i>
                    <i v-if="card.excludes?.length" class="cmark excl">斥</i>
                    <i v-if="card.resourceBounds" class="cmark">界</i>
                    <i v-if="card.left.finale || card.right.finale" class="cmark fin">终</i>
                  </span>
                  <span v-if="markOf(card)" class="hits">
                    <i v-if="markOf(card)?.produce" class="prod">产{{ markOf(card)?.detail.produce }}</i>
                    <i v-if="markOf(card)?.require" class="need">需{{ markOf(card)?.detail.require }}</i>
                    <i v-if="markOf(card)?.exclude" class="excl">斥</i>
                  </span>
                </button>
              </li>
            </ol>
          </article>
        </section>
        <p v-if="!visibleYears.length" class="empty">没有匹配的卡。</p>
        <p class="foot">
          {{ query ? `筛出 ${visibleCount} / ${DECK.length} 步 · ` : '' }}候选按数组顺序取首张符合条件者，整步无合格候选即静默跳过
        </p>
      </main>
    </div>

    <aside v-if="detail" class="detail">
      <header class="dhead">
        <span class="ava">{{ detail.card.avatar }}</span>
        <div>
          <b>{{ detail.card.name }}</b>
          <span class="cid">{{ detail.card.id }}</span>
        </div>
        <button class="dclose" aria-label="关闭" @click="detail = null">✕</button>
      </header>
      <p class="dmeta">
        {{ yearLabel(yearOf(detail.entry.key)) }} · 键 {{ detail.entry.key }} ·
        {{ detail.entry.chapter.name }}<template v-if="detail.entry.chapter.steps.length > 1"> 第 {{ detail.entry.step + 1 }}/{{ detail.entry.chapter.steps.length }} 步</template>
        <template v-if="detail.entry.cards.length > 1"> · 候选第 {{ detail.index + 1 }}/{{ detail.entry.cards.length }}</template>
      </p>

      <section v-if="peopleNames(detail.card).length" class="dsec people">
        牵涉：{{ peopleNames(detail.card).join('、') }}
      </section>

      <section v-if="detail.card.requires?.length || detail.card.excludes?.length || detail.card.resourceBounds" class="dsec cond">
        <h3>出现条件</h3>
        <p v-if="detail.card.requires?.length">
          <span class="ctag need">需</span>
          <button v-for="(rule, i) in detail.card.requires" :key="`r${i}`" class="fchip" :class="{ on: flagSel === ruleText(rule).split(' ')[0] }" @click="selectFlag(typeof rule === 'string' ? rule : rule.flag, false)">
            {{ ruleText(rule) }}
          </button>
        </p>
        <p v-if="detail.card.excludes?.length">
          <span class="ctag excl">斥</span>
          <button v-for="flag in detail.card.excludes" :key="flag" class="fchip" :class="{ on: flagSel === flag }" @click="selectFlag(flag, false)">{{ flag }}</button>
        </p>
        <p v-if="boundsOf(detail.card).length">
          <span class="ctag">界</span>
          <span class="bounds">{{ boundsOf(detail.card).join(' · ') }}</span>
        </p>
      </section>

      <p class="dtext">{{ detail.card.text }}</p>

      <section v-for="s in SIDES" :key="s.key" class="dsec side">
        <h3>{{ s.label }} · {{ detail.card[s.key].label }}</h3>
        <p v-if="detail.card[s.key].finale" class="finale">→ 终章分支：{{ detail.card[s.key].finale }}</p>
        <p class="eff">
          <span v-for="line in effectLines(detail.card[s.key].effects)" :key="line" class="echip">{{ line }}</span>
          <span v-if="!effectLines(detail.card[s.key].effects).length" class="echip">国势未动</span>
        </p>
        <p v-if="detail.card[s.key].sets?.length" class="sets">
          <span class="ctag prod">产</span>
          <button v-for="flag in detail.card[s.key].sets" :key="flag" class="fchip" :class="{ on: flagSel === flag }" @click="selectFlag(flag, false)">{{ flag }}</button>
        </p>
        <p class="resp">{{ detail.card[s.key].response || '（无批红：终章收束于结局页）' }}</p>
      </section>
    </aside>
  </div>
</template>

<style scoped>
.atlas {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  color: var(--ink);
  background:
    var(--grain),
    linear-gradient(176deg, var(--paper-hi) 0%, var(--paper) 48%, var(--paper-lo) 100%);
  font-size: 12.5px;
}

/* ---------- 顶栏 ---------- */
.bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1.5px solid var(--line);
  background: rgba(255, 251, 242, 0.72);
}

.bar h1 {
  font-family: var(--font-kai);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 3px;
  white-space: nowrap;
}

.stats {
  color: var(--ink-3);
  white-space: nowrap;
}

.search {
  padding: 5px 9px;
  font-family: inherit;
  font-size: 12.5px;
  color: var(--ink);
  background: rgba(255, 253, 248, 0.85);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  outline: none;
}

.search:focus {
  border-color: var(--cinnabar);
}

.bar .search {
  flex: 1;
  max-width: 240px;
  margin-left: auto;
}

.back {
  flex: none;
  padding: 5px 12px;
  font-size: 12.5px;
  letter-spacing: 1px;
  color: var(--ink-3);
  background: rgba(255, 253, 248, 0.7);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.back:active {
  color: var(--cinnabar);
  border-color: var(--cinnabar);
}

/* ---------- 主体：旗标栏 + 时间轴 ---------- */
.body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.flags {
  flex: none;
  width: 232px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--line);
  background: rgba(251, 244, 230, 0.6);
}

.flag-head {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-bottom: 1px solid var(--line-soft);
}

.seg {
  display: flex;
  gap: 0;
}

.seg button {
  flex: 1;
  padding: 4px 0;
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--ink-3);
  background: rgba(255, 253, 248, 0.7);
  border: 1px solid var(--line-soft);
  cursor: pointer;
}

.seg button:first-child {
  border-radius: 3px 0 0 3px;
}

.seg button:last-child {
  border-radius: 0 3px 3px 0;
  border-left: none;
}

.seg button.on {
  color: var(--paper-hi);
  background: var(--ink-2);
  border-color: var(--ink-2);
}

.flag-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  list-style: none;
  padding: 6px;
}

.flag-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 8px;
  font-size: 12.5px;
  text-align: left;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
}

.flag-row:hover {
  background: rgba(255, 253, 248, 0.8);
}

.flag-row.on {
  color: var(--cinnabar);
  font-weight: 700;
  background: rgba(168, 50, 42, 0.1);
  border-color: var(--cinnabar);
}

.reform-mark {
  margin-left: 4px;
  padding: 0 3px;
  font-size: 10px;
  font-style: normal;
  color: var(--ochre);
  border: 1px solid var(--ochre);
  border-radius: 2px;
}

.cnt {
  flex: none;
  display: flex;
  gap: 4px;
}

.cnt i,
.hits i,
.echip {
  font-style: normal;
}

.cnt i {
  font-size: 10.5px;
  padding: 0 3px;
  border: 1px solid currentColor;
  border-radius: 2px;
  opacity: 0.9;
}

/* 因果三色：产=青（写下的痕）、需=蓝（入场券）、斥=朱（见即逐） */
.prod {
  color: var(--jade);
}

.need {
  color: var(--azure);
}

.excl {
  color: var(--cinnabar);
}

.legend {
  flex: none;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.7;
  color: var(--ink-3);
  border-top: 1px solid var(--line-soft);
}

/* ---------- 时间轴 ---------- */
.timeline {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 0 16px 24px;
}

.sel-banner {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 6px;
  margin: 0 -16px;
  padding: 8px 16px;
  background: rgba(255, 251, 242, 0.95);
  border-bottom: 1px solid var(--line-soft);
  backdrop-filter: blur(2px);
}

.sel-banner b {
  font-family: var(--font-kai);
  letter-spacing: 1px;
  color: var(--cinnabar);
}

.sel-kind {
  font-size: 10.5px;
  padding: 0 3px;
  border: 1px solid currentColor;
  border-radius: 2px;
}

.kchip {
  padding: 1px 7px;
  font-size: 11.5px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.85);
  border: 1px solid var(--line-soft);
  border-radius: 9px;
  cursor: pointer;
}

.kchip:hover {
  color: var(--cinnabar);
  border-color: var(--cinnabar);
}

.kclear {
  margin-left: auto;
  padding: 1px 8px;
  font-size: 11.5px;
  color: var(--ink-3);
  background: transparent;
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.year h2 {
  position: sticky;
  top: 0;
  z-index: 2;
  margin: 0 -16px;
  padding: 7px 16px 5px;
  font-family: var(--font-kai);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--ink);
  background: rgba(255, 251, 242, 0.95);
  border-bottom: 1px dashed var(--line-soft);
}

.year h2 small {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--ink-3);
}

/* 有并键旗标条时，年份标题让位 */
.sel-banner + .year h2 {
  top: 0;
}

.entry {
  margin-top: 8px;
  padding: 7px 9px 8px;
  border: 1px solid var(--line-soft);
  border-left: 3px solid var(--line-soft);
  border-radius: 3px;
  background: rgba(255, 253, 248, 0.62);
}

.entry.chaptered {
  background: rgba(255, 253, 248, 0.86);
}

.entry.faded {
  opacity: 0.45;
}

.entry.flash {
  animation: flash 1.3s ease;
}

@keyframes flash {
  0%,
  60% {
    box-shadow: 0 0 0 3px rgba(168, 50, 42, 0.35);
  }
  100% {
    box-shadow: none;
  }
}

.ehead {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.ekey {
  flex: none;
  font-family: var(--font-kai);
  font-size: 12px;
  color: var(--ink-2);
}

.echap {
  font-family: var(--font-kai);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}

.ecand {
  margin-left: auto;
  font-size: 11px;
  color: var(--ink-3);
}

.plist {
  list-style: none;
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tile {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 8px;
  font-size: 12.5px;
  text-align: left;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.tile:hover {
  border-color: var(--line);
  background: rgba(255, 255, 255, 0.9);
}

.tile.order-first {
  border-left-width: 1px;
}

.order {
  flex: none;
  width: 15px;
  height: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--ink-3);
  border: 1px solid var(--line-soft);
  border-radius: 50%;
}

.ava {
  flex: none;
  font-size: 14px;
}

.nm {
  font-family: var(--font-kai);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.cid {
  font-size: 11px;
  color: var(--ink-3);
}

.marks {
  display: flex;
  gap: 3px;
}

.cmark {
  font-size: 10px;
  font-style: normal;
  padding: 0 3px;
  color: var(--ochre);
  border: 1px solid var(--ochre);
  border-radius: 2px;
}

.cmark.excl {
  color: var(--cinnabar);
  border-color: var(--cinnabar);
}

.cmark.fin {
  color: var(--azure);
  border-color: var(--azure);
}

.hits {
  margin-left: auto;
  flex: none;
  display: flex;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
}

.hits i {
  padding: 0 4px;
  border: 1px solid currentColor;
  border-radius: 2px;
}

/* 高亮即因果：有角色时描色加重，无角色时压低 */
.tile.dim {
  opacity: 0.34;
  filter: grayscale(0.7);
}

.tile.prod {
  border-color: var(--jade);
  box-shadow: inset 3px 0 0 var(--jade);
}

.tile.need {
  border-color: var(--azure);
  box-shadow: inset 3px 0 0 var(--azure);
}

.tile.excl {
  border-color: var(--cinnabar);
  box-shadow: inset 3px 0 0 var(--cinnabar);
}

.tile.prod.need,
.tile.prod.excl,
.tile.need.excl {
  box-shadow: inset 3px 0 0 var(--line);
}

.tile.hit {
  background: rgba(171, 132, 48, 0.16);
  border-color: var(--ochre);
}

.empty,
.foot {
  margin-top: 16px;
  font-size: 11.5px;
  color: var(--ink-3);
  text-align: center;
}

/* ---------- 单卡详情抽屉 ---------- */
.detail {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 70;
  width: min(460px, 94vw);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 14px 16px 22px;
  border-left: 1.5px solid var(--line);
  background:
    var(--grain),
    linear-gradient(168deg, var(--paper-hi) 0%, #f3e8d5 46%, #e7d6b6 100%);
  box-shadow: -10px 0 28px rgba(41, 33, 26, 0.24);
}

.dhead {
  flex: none;
  display: flex;
  align-items: center;
  gap: 9px;
}

.dhead .ava {
  font-size: 26px;
}

.dhead b {
  font-family: var(--font-kai);
  font-size: 18px;
  letter-spacing: 1px;
}

.dhead .cid {
  display: block;
  font-size: 11px;
  color: var(--ink-3);
}

.dclose {
  margin-left: auto;
  width: 26px;
  height: 26px;
  font-size: 12px;
  color: var(--cinnabar);
  background: rgba(255, 253, 248, 0.7);
  border: 1.5px solid var(--cinnabar);
  border-radius: 50%;
  cursor: pointer;
}

.dmeta {
  flex: none;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--ink-3);
}

.dsec {
  flex: none;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--line-soft);
}

.dsec h3 {
  font-family: var(--font-kai);
  font-size: 13.5px;
  letter-spacing: 1px;
}

.dsec.people {
  font-size: 12.5px;
  color: var(--ink-2);
}

.cond p,
.sets {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}

.ctag {
  flex: none;
  font-size: 10.5px;
  padding: 0 4px;
  color: var(--ink-3);
  border: 1px solid currentColor;
  border-radius: 2px;
}

.fchip {
  padding: 1px 7px;
  font-size: 11.5px;
  font-family: inherit;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.8);
  border: 1px solid var(--line-soft);
  border-radius: 9px;
  cursor: pointer;
}

.fchip:hover {
  color: var(--cinnabar);
  border-color: var(--cinnabar);
}

.fchip.on {
  font-weight: 700;
  color: var(--cinnabar);
  border-color: var(--cinnabar);
  background: rgba(168, 50, 42, 0.1);
}

.bounds {
  font-size: 12px;
  color: var(--ink-2);
}

.dtext {
  flex: none;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--line-soft);
  font-size: 13px;
  line-height: 1.9;
  text-align: justify;
  color: var(--ink-2);
}

.finale {
  margin-top: 4px;
  font-size: 12px;
  color: var(--azure);
}

.eff {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}

.echip {
  font-size: 11.5px;
  padding: 0 5px;
  color: var(--ink-2);
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--line-soft);
  border-radius: 2px;
}

.resp {
  margin-top: 6px;
  font-size: 12.5px;
  line-height: 1.9;
  text-align: justify;
  color: var(--ink-2);
}

/* ---------- 窄屏 ---------- */
@media (max-width: 760px) {
  .bar {
    flex-wrap: wrap;
  }

  /* 统计条最占宽，窄屏退到单独一行，搜索与返回留在首行 */
  .stats {
    order: 9;
    flex-basis: 100%;
  }

  .bar .search {
    flex: 1 1 120px;
    max-width: none;
  }

  .body {
    flex-direction: column;
  }

  .flags {
    width: 100%;
    max-height: 168px;
    border-right: none;
    border-bottom: 1px solid var(--line);
  }

  .flag-list {
    display: flex;
    gap: 4px;
    overflow-x: auto;
    padding: 6px 8px;
  }

  .flag-list li {
    flex: none;
  }

  .flag-row {
    width: auto;
    white-space: nowrap;
  }

  .legend {
    display: none;
  }
}
</style>

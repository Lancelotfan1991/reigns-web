<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  DISASTERS,
  DISASTER_KIND_META,
  DISASTER_KIND_ORDER,
  disasterYearAd,
  disasterYearLabel,
} from '../data/disasters'
import type { Disaster, DisasterKind } from '../data/disasters'
import { navigate } from '../router'

const selectedKind = ref<DisasterKind | 'all'>('all')
const selectedYear = ref<number | 'all'>('all')
const query = ref('')
const selectedId = ref<string | null>(null)
const previousTitle = typeof document === 'undefined' ? '' : document.title
const previousBodyOverflow = typeof document === 'undefined' ? '' : document.body.style.overflow

const CN = ['〇', '元', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七']

function shortYearLabel(year: number): string {
  if (year === 0) return '天启七'
  if (year === 1) return '崇祯元'
  return `崇祯${CN[year] ?? year}`
}

function kindMeta(kind: DisasterKind) {
  return DISASTER_KIND_META[kind]
}

function primaryKind(disaster: Disaster) {
  return kindMeta(disaster.kinds[0])
}

const years = computed(() => {
  const counts = new Map<number, number>()
  for (const disaster of DISASTERS) counts.set(disaster.year, (counts.get(disaster.year) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ year, count }))
})

const kindCounts = computed(() => {
  const counts = new Map<DisasterKind, number>()
  for (const disaster of DISASTERS) {
    for (const kind of disaster.kinds) counts.set(kind, (counts.get(kind) ?? 0) + 1)
  }
  return counts
})

const majorCount = computed(() => DISASTERS.filter((disaster) => disaster.severity === 3).length)

const normalizedQuery = computed(() => query.value.trim().toLowerCase())

const filtered = computed(() => {
  const q = normalizedQuery.value
  return DISASTERS.filter((disaster) => {
    if (selectedKind.value !== 'all' && !disaster.kinds.includes(selectedKind.value)) return false
    if (selectedYear.value !== 'all' && disaster.year !== selectedYear.value) return false
    if (!q) return true
    const haystack = [
      disaster.title,
      disaster.date,
      disaster.places.join(' '),
      disaster.summary,
      disaster.impact.join(' '),
      disaster.response.join(' '),
      disaster.consequence.join(' '),
      disaster.source.join(' '),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

const groups = computed(() => {
  const byYear = new Map<number, Disaster[]>()
  for (const disaster of filtered.value) {
    const group = byYear.get(disaster.year) ?? []
    group.push(disaster)
    byYear.set(disaster.year, group)
  }
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, items]) => ({ year, items }))
})

const selected = computed(() => DISASTERS.find((disaster) => disaster.id === selectedId.value) ?? null)
const selectedIndex = computed(() => filtered.value.findIndex((disaster) => disaster.id === selectedId.value))
const hasPrevious = computed(() => selectedIndex.value > 0)
const hasNext = computed(() => selectedIndex.value >= 0 && selectedIndex.value < filtered.value.length - 1)

const hasFilter = computed(
  () => selectedKind.value !== 'all' || selectedYear.value !== 'all' || query.value.trim().length > 0,
)

function select(disaster: Disaster) {
  selectedId.value = disaster.id
}

function selectRelative(delta: number) {
  if (selectedIndex.value < 0) return
  const next = filtered.value[selectedIndex.value + delta]
  if (next) selectedId.value = next.id
}

function close() {
  selectedId.value = null
}

function clearFilters() {
  selectedKind.value = 'all'
  selectedYear.value = 'all'
  query.value = ''
}

function exportCsv() {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`
  const header = ['年份', '西元', '时间', '灾种', '地点', '灾情', '朝廷应对', '结果', '史料', '备注']
  const rows = DISASTERS.map((disaster) =>
    [
      disasterYearLabel(disaster.year),
      String(disasterYearAd(disaster.year)),
      disaster.date,
      disaster.kinds.map((kind) => DISASTER_KIND_META[kind].name).join('、'),
      disaster.places.join('、'),
      disaster.impact.join('；'),
      disaster.response.join('；'),
      disaster.consequence.join('；'),
      disaster.source.join('；'),
      disaster.note ?? '',
    ]
      .map(quote)
      .join(','),
  )
  const csv = `\ufeff${[header.map(quote).join(','), ...rows].join('\r\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '崇祯灾难卡.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function back() {
  navigate('/')
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && selectedId.value) {
    selectedId.value = null
    return
  }
  if (selectedId.value && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    event.preventDefault()
    selectRelative(event.key === 'ArrowLeft' ? -1 : 1)
  }
}

onMounted(() => {
  document.title = '灾难卡 · 天启七年至崇祯十七年'
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  document.title = previousTitle
  document.body.style.overflow = previousBodyOverflow
  window.removeEventListener('keydown', onKey)
})

watch(selectedId, (id) => {
  document.body.style.overflow = id ? 'hidden' : previousBodyOverflow
})
</script>

<template>
  <div class="disaster-page">
    <header class="masthead">
      <button class="back" aria-label="返回游戏" @click="back">‹ 回宫</button>
      <div class="masthead-text">
        <p class="kicker">大明 · 天启七年至崇祯十七年</p>
        <h1>灾难卡</h1>
        <p class="sub">旱 · 蝗 · 疫 · 水 · 饥 · 震 · 雹 · 雪 · 风 · 潮</p>
      </div>
      <div class="era-seal seal inked" aria-hidden="true">
        <span>灾</span>
        <span>异</span>
      </div>
    </header>

    <section class="intro">
      <p>
        本表以《明史》卷二十八《五行一》、卷三十《五行三》为骨架，参以《国榷》、马懋才《备陈大饥疏》及近人鼠疫研究。明人记灾多记异象、少记县份与人口，故同年、同类、同区域的零散记载合并为一张卡；县一级的每条灾异未逐条拆分。
      </p>
      <ul class="stats">
        <li><b>{{ DISASTERS.length }}</b><span>张灾难卡</span></li>
        <li><b>{{ years.length }}</b><span>个年份</span></li>
        <li><b>{{ DISASTER_KIND_ORDER.length }}</b><span>类灾种</span></li>
        <li><b>{{ majorCount }}</b><span>巨灾</span></li>
      </ul>
    </section>

    <section class="toolbar" aria-label="灾难卡筛选">
      <div class="year-strip" role="group" aria-label="按年份筛选">
        <button
          class="year-chip"
          :class="{ on: selectedYear === 'all' }"
          :aria-pressed="selectedYear === 'all'"
          @click="selectedYear = 'all'"
        >
          全部 <i>{{ DISASTERS.length }}</i>
        </button>
        <button
          v-for="item in years"
          :key="item.year"
          class="year-chip"
          :class="{ on: selectedYear === item.year }"
          :aria-pressed="selectedYear === item.year"
          @click="selectedYear = selectedYear === item.year ? 'all' : item.year"
        >
          {{ shortYearLabel(item.year) }} <i>{{ item.count }}</i>
        </button>
      </div>

      <div class="kind-row" role="group" aria-label="按灾种筛选">
        <button
          class="kind-chip"
          :class="{ on: selectedKind === 'all' }"
          :aria-pressed="selectedKind === 'all'"
          @click="selectedKind = 'all'"
        >
          全部灾种
        </button>
        <button
          v-for="kind in DISASTER_KIND_ORDER"
          :key="kind"
          class="kind-chip"
          :class="{ on: selectedKind === kind }"
          :aria-pressed="selectedKind === kind"
          :style="{ '--kind': kindMeta(kind).color }"
          @click="selectedKind = selectedKind === kind ? 'all' : kind"
        >
          <i class="chip-mark">{{ kindMeta(kind).mark }}</i>
          {{ kindMeta(kind).name }}
          <em>{{ kindCounts.get(kind) ?? 0 }}</em>
        </button>
      </div>

      <div class="search-row">
        <input
          v-model="query"
          type="search"
          class="search"
          aria-label="搜索灾难卡"
          placeholder="搜时间、地点、灾情、后果……"
        />
        <button v-if="hasFilter" class="reset" @click="clearFilters">重置</button>
        <button class="export" @click="exportCsv">导出 CSV</button>
        <span class="result-count">{{ filtered.length }} / {{ DISASTERS.length }} 张</span>
      </div>
    </section>

    <main class="catalog">
      <section v-for="group in groups" :key="group.year" class="year-group">
        <header class="year-head">
          <h2>{{ disasterYearLabel(group.year) }}</h2>
          <span>西元 {{ disasterYearAd(group.year) }} · {{ group.items.length }} 张</span>
        </header>
        <div class="cards">
          <article
            v-for="disaster in group.items"
            :key="disaster.id"
            class="disaster-card"
            :class="{ major: disaster.severity === 3 }"
            :style="{ '--kind': primaryKind(disaster).color }"
            role="button"
            tabindex="0"
            :aria-label="`${disaster.date} ${disaster.title}`"
            @click="select(disaster)"
            @keydown.enter.prevent="select(disaster)"
            @keydown.space.prevent="select(disaster)"
          >
            <header class="card-head">
              <span class="card-date">{{ disaster.date }}</span>
              <span class="card-seals">
                <i
                  v-for="kind in disaster.kinds"
                  :key="kind"
                  :style="{ background: kindMeta(kind).color }"
                  :title="kindMeta(kind).name"
                >
                  {{ kindMeta(kind).mark }}
                </i>
              </span>
            </header>
            <h3>{{ disaster.title }}</h3>
            <p class="card-place">{{ disaster.places.join(' · ') }}</p>
            <p class="card-summary">{{ disaster.summary }}</p>
            <footer class="card-foot">
              <span class="card-kinds">
                {{ disaster.kinds.map((kind) => kindMeta(kind).name).join(' / ') }}
              </span>
              <span v-if="disaster.severity === 3" class="major-tag">巨灾</span>
              <span class="card-source">{{ disaster.source[0] }}</span>
            </footer>
          </article>
        </div>
      </section>

      <p v-if="!groups.length" class="empty">
        没有匹配的灾难卡。试试更换年份、灾种，或清空搜索。
      </p>
    </main>

    <footer class="page-foot">
      <p>史料以《明史·五行志》为主，参以《国榷》、马懋才《备陈大饥疏》、曹树基与李玉尚《鼠疫：战争与和平》。</p>
      <p>灾情数字皆照当时奏报；明人记灾多略，本表只求见其大势，不作现代灾害统计。</p>
    </footer>

    <Transition name="fade">
      <div v-if="selected" class="detail-backdrop" @click="close" />
    </Transition>

    <aside
      v-if="selected"
      class="detail"
      role="dialog"
      aria-modal="true"
      :aria-label="selected.title"
    >
      <header class="detail-head">
        <p class="detail-kicker">
          {{ selected.date }} · 西元 {{ disasterYearAd(selected.year) }}
        </p>
        <h2>{{ selected.title }}</h2>
        <p class="detail-place">{{ selected.places.join(' · ') }}</p>
        <div class="detail-seals">
          <span
            v-for="kind in selected.kinds"
            :key="kind"
            :style="{ background: kindMeta(kind).color }"
          >
            {{ kindMeta(kind).mark }} {{ kindMeta(kind).name }}
          </span>
          <span v-if="selected.severity === 3" class="detail-major">巨灾</span>
        </div>
        <button class="detail-close" aria-label="关闭详情" @click="close">✕</button>
      </header>

      <div class="detail-body">
        <p class="detail-summary">{{ selected.summary }}</p>

        <section class="detail-section">
          <h3>灾情</h3>
          <ul>
            <li v-for="line in selected.impact" :key="line">{{ line }}</li>
          </ul>
        </section>

        <section class="detail-section">
          <h3>朝廷应对</h3>
          <ul>
            <li v-for="line in selected.response" :key="line">{{ line }}</li>
          </ul>
        </section>

        <section class="detail-section">
          <h3>结果</h3>
          <ul>
            <li v-for="line in selected.consequence" :key="line">{{ line }}</li>
          </ul>
        </section>

        <section class="detail-section source">
          <h3>史料</h3>
          <p v-for="line in selected.source" :key="line">{{ line }}</p>
          <p v-if="selected.note" class="note">按：{{ selected.note }}</p>
        </section>
      </div>

      <footer class="detail-foot">
        <button :disabled="!hasPrevious" @click="selectRelative(-1)">← 上一条</button>
        <span>{{ selectedIndex + 1 }} / {{ filtered.length }}</span>
        <button :disabled="!hasNext" @click="selectRelative(1)">下一条 →</button>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.disaster-page {
  min-height: 100dvh;
  max-width: 1180px;
  margin: 0 auto;
  padding: 22px clamp(12px, 3vw, 36px) 40px;
}

/* ---------- 页头 ---------- */

.masthead {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 16px;
  border-bottom: 1.5px solid var(--line);
}

.back {
  flex: none;
  align-self: flex-start;
  margin-top: 6px;
  padding: 6px 12px;
  font-size: 12.5px;
  letter-spacing: 1.5px;
  color: var(--ink-3);
  background: rgba(255, 253, 248, 0.6);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.back:hover,
.back:focus-visible {
  color: var(--cinnabar);
  border-color: var(--cinnabar);
}

.masthead-text {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.kicker {
  font-family: var(--font-kai);
  font-size: 12px;
  letter-spacing: 4px;
  color: var(--cinnabar);
}

h1 {
  margin-top: 2px;
  font-family: var(--font-kai);
  font-size: clamp(30px, 5vw, 42px);
  font-weight: 700;
  letter-spacing: 14px;
  text-indent: 14px;
  color: var(--ink);
  line-height: 1.2;
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  letter-spacing: 3px;
  color: var(--ink-3);
}

.era-seal {
  flex: none;
  width: 62px;
  height: 62px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 0;
  font-size: 15px;
  line-height: 1.05;
  letter-spacing: 1px;
}

/* ---------- 引言 ---------- */

.intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  margin: 16px 0;
  padding: 14px 16px;
  border: 1px solid var(--line-soft);
  border-radius: 4px;
  background: rgba(255, 251, 242, 0.6);
}

.intro p {
  font-size: 12.5px;
  line-height: 1.9;
  text-align: justify;
  color: var(--ink-2);
}

.stats {
  display: flex;
  gap: 18px;
  list-style: none;
}

.stats li {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 54px;
}

.stats b {
  font-family: var(--font-kai);
  font-size: 26px;
  line-height: 1;
  color: var(--cinnabar);
}

.stats span {
  margin-top: 4px;
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--ink-3);
}

/* ---------- 筛选 ---------- */

.toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 10px 0 8px;
  background: rgba(244, 235, 218, 0.96);
  border-bottom: 1px solid var(--line-soft);
  backdrop-filter: blur(3px);
}

.year-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-bottom: 4px;
}

.year-chip {
  flex: none;
  padding: 4px 8px;
  font-size: 11px;
  letter-spacing: 0.5px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.7);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.year-chip i {
  margin-left: 2px;
  font-style: normal;
  font-size: 9.5px;
  color: var(--ink-3);
}

.year-chip:hover {
  border-color: var(--line);
}

.year-chip.on {
  color: var(--paper-hi);
  background: var(--ink-2);
  border-color: var(--ink-2);
}

.year-chip.on i {
  color: rgba(255, 248, 231, 0.7);
}

.kind-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.kind-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 11px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.7);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.kind-chip em {
  font-style: normal;
  font-size: 9.5px;
  color: var(--ink-3);
}

.kind-chip:hover {
  border-color: var(--kind, var(--line));
}

.kind-chip.on {
  color: var(--paper-hi);
  background: var(--ink-2);
  border-color: var(--ink-2);
}

.kind-chip.on em {
  color: rgba(255, 248, 231, 0.7);
}

.chip-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-style: normal;
  font-size: 9px;
  color: var(--paper-hi);
  background: var(--kind, var(--cinnabar));
  border-radius: 2px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.search {
  flex: 1;
  max-width: 320px;
  padding: 5px 9px;
  font-family: inherit;
  font-size: 12px;
  color: var(--ink);
  background: rgba(255, 253, 248, 0.85);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  outline: none;
}

.search:focus {
  border-color: var(--cinnabar);
}

.reset {
  padding: 4px 9px;
  font-size: 11px;
  color: var(--ink-3);
  background: none;
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.reset:hover {
  color: var(--cinnabar);
  border-color: var(--cinnabar);
}

.export {
  padding: 4px 9px;
  font-size: 11px;
  color: var(--cinnabar);
  background: rgba(255, 253, 248, 0.7);
  border: 1px solid rgba(168, 50, 42, 0.45);
  border-radius: 3px;
  cursor: pointer;
}

.export:hover {
  background: rgba(168, 50, 42, 0.08);
}

.result-count {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--ink-3);
  white-space: nowrap;
}

/* ---------- 卡阵 ---------- */

.catalog {
  padding-top: 18px;
}

.year-group + .year-group {
  margin-top: 26px;
}

.year-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding-bottom: 7px;
  margin-bottom: 10px;
  border-bottom: 1px dashed var(--line);
}

.year-head h2 {
  font-family: var(--font-kai);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--ink);
}

.year-head span {
  font-size: 10.5px;
  letter-spacing: 0.5px;
  color: var(--ink-3);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(292px, 1fr));
  gap: 12px;
}

.disaster-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 196px;
  padding: 11px 13px 10px;
  font-family: inherit;
  text-align: left;
  color: var(--ink-2);
  background:
    var(--grain),
    linear-gradient(165deg, rgba(255, 253, 248, 0.78), rgba(242, 230, 207, 0.72));
  border: 1px solid var(--line-soft);
  border-top: 3px solid var(--kind);
  border-radius: 3px;
  box-shadow: 0 4px 12px rgba(41, 33, 26, 0.08);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.disaster-card:hover,
.disaster-card:focus-visible {
  transform: translateY(-2px);
  border-color: var(--kind);
  box-shadow: 0 9px 20px rgba(41, 33, 26, 0.16);
  outline: none;
}

.disaster-card.major {
  border-color: rgba(168, 50, 42, 0.35);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-date {
  font-family: var(--font-kai);
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--cinnabar);
}

.card-seals {
  display: flex;
  gap: 3px;
}

.card-seals i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  font-style: normal;
  font-size: 9.5px;
  color: var(--paper-hi);
  border-radius: 2px;
}

.disaster-card h3 {
  margin-top: 7px;
  font-family: var(--font-kai);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1.35;
  color: var(--ink);
}

.card-place {
  margin-top: 3px;
  font-size: 10px;
  letter-spacing: 0.3px;
  color: var(--ink-3);
}

.card-summary {
  flex: 1;
  margin-top: 7px;
  font-size: 12px;
  line-height: 1.75;
  text-align: justify;
  color: var(--ink-2);
}

.card-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 7px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dotted rgba(171, 142, 95, 0.4);
}

.card-kinds {
  padding: 1px 5px;
  font-size: 9.5px;
  letter-spacing: 0.5px;
  color: var(--kind);
  border: 1px solid currentColor;
  border-radius: 2px;
}

.major-tag {
  padding: 1px 5px;
  font-size: 9px;
  color: var(--paper-hi);
  background: var(--cinnabar);
  border-radius: 2px;
}

.card-source {
  margin-left: auto;
  max-width: 62%;
  overflow: hidden;
  font-size: 9px;
  color: var(--ink-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  padding: 36px 0;
  font-size: 13px;
  text-align: center;
  color: var(--ink-3);
}

.page-foot {
  margin-top: 30px;
  padding-top: 12px;
  border-top: 1px solid var(--line-soft);
  font-size: 10.5px;
  line-height: 1.8;
  color: var(--ink-3);
}

.page-foot p + p {
  margin-top: 3px;
}

/* ---------- 详情 ---------- */

.detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
  background: rgba(66, 52, 34, 0.32);
  backdrop-filter: blur(1.5px);
}

.detail {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 60;
  width: min(460px, 94vw);
  display: flex;
  flex-direction: column;
  background:
    var(--grain),
    linear-gradient(168deg, var(--paper-hi) 0%, #f3e8d5 46%, #e7d6b6 100%);
  border-left: 1.5px solid var(--line);
  box-shadow: -12px 0 34px rgba(41, 33, 26, 0.28);
}

.detail-head {
  position: relative;
  flex: none;
  padding: 20px 20px 14px;
  border-bottom: 1px solid var(--line-soft);
}

.detail-kicker {
  font-family: var(--font-kai);
  font-size: 11.5px;
  letter-spacing: 1.5px;
  color: var(--cinnabar);
}

.detail-head h2 {
  margin-top: 4px;
  padding-right: 28px;
  font-family: var(--font-kai);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1.3;
  color: var(--ink);
}

.detail-place {
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--ink-3);
}

.detail-seals {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.detail-seals span {
  padding: 2px 6px;
  font-size: 10px;
  color: var(--paper-hi);
  border-radius: 2px;
}

.detail-seals .detail-major {
  color: var(--paper-hi);
  background: var(--cinnabar);
}

.detail-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 27px;
  height: 27px;
  font-size: 12px;
  color: var(--cinnabar);
  background: rgba(255, 253, 248, 0.75);
  border: 1.5px solid var(--cinnabar);
  border-radius: 50%;
  cursor: pointer;
}

.detail-close:hover {
  background: rgba(168, 50, 42, 0.1);
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 20px;
}

.detail-summary {
  font-size: 13px;
  line-height: 1.95;
  text-align: justify;
  color: var(--ink-2);
}

.detail-section {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed var(--line-soft);
}

.detail-section h3 {
  font-family: var(--font-kai);
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--ink);
}

.detail-section ul {
  margin-top: 5px;
  padding-left: 15px;
  list-style: square;
}

.detail-section li {
  margin-top: 4px;
  font-size: 12.5px;
  line-height: 1.8;
  text-align: justify;
  color: var(--ink-2);
}

.detail-section.source p {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.7;
  color: var(--ink-3);
}

.detail-section.source .note {
  margin-top: 8px;
  padding: 7px 8px;
  font-size: 11px;
  line-height: 1.7;
  color: var(--ink-2);
  background: rgba(171, 132, 48, 0.1);
  border-left: 2px solid var(--ochre);
}

.detail-foot {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--line-soft);
  background: rgba(255, 251, 242, 0.7);
}

.detail-foot button {
  padding: 4px 8px;
  font-size: 11px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.7);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.detail-foot button:disabled {
  opacity: 0.35;
  cursor: default;
}

.detail-foot span {
  font-size: 10.5px;
  color: var(--ink-3);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ---------- 窄屏 ---------- */

@media (max-width: 760px) {
  .disaster-page {
    padding: 14px 10px 28px;
  }

  .masthead {
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 12px;
  }

  .back {
    order: 1;
    margin-top: 0;
  }

  .era-seal {
    order: 2;
    width: 48px;
    height: 48px;
    margin-left: auto;
    font-size: 12px;
  }

  .masthead-text {
    order: 3;
    flex-basis: 100%;
    margin-top: 4px;
  }

  h1 {
    font-size: 32px;
    letter-spacing: 10px;
    text-indent: 10px;
  }

  .sub {
    letter-spacing: 1.5px;
  }

  .intro {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    padding: 11px 12px;
  }

  .stats {
    justify-content: space-between;
    gap: 6px;
  }

  .toolbar {
    position: static;
    padding-top: 8px;
  }

  .search {
    max-width: none;
  }

  .year-strip {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .year-strip::-webkit-scrollbar {
    height: 5px;
  }

  .result-count {
    display: none;
  }

  .cards {
    grid-template-columns: minmax(0, 1fr);
  }

  .disaster-card {
    min-height: 0;
  }

  .detail {
    top: auto;
    left: 0;
    right: 0;
    width: auto;
    max-height: 88dvh;
    border-left: none;
    border-top: 1.5px solid var(--line);
    border-radius: 8px 8px 0 0;
    box-shadow: 0 -12px 34px rgba(41, 33, 26, 0.3);
    animation: sheet-up 0.22s ease;
  }

  @keyframes sheet-up {
    from {
      transform: translateY(28px);
      opacity: 0.35;
    }
  }

  .detail-head {
    padding: 16px 16px 12px;
  }

  .detail-body {
    padding: 14px 16px 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .disaster-card,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>

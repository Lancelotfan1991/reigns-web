<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import HistoricalMap from './HistoricalMap.vue'
import { CHRONICLE, findRegion, NEIGHBORS } from '../data/atlas'
import type { Region } from '../data/atlas'
import { navigate } from '../router'

const selectedId = ref<string | null>(null)
const activeEventId = ref<string | null>(null)
const showMinor = ref(false)
const showFrontier = ref(true)
const showEvents = ref(true)
const showRivers = ref(true)
const frameRef = ref<HTMLElement | null>(null)
const previousTitle = typeof document === 'undefined' ? '' : document.title

const selectedRegion = computed<Region | null>(() =>
  selectedId.value ? findRegion(selectedId.value) : null,
)

const activeEvent = computed(() => CHRONICLE.find((entry) => entry.id === activeEventId.value) ?? null)

const regionEvents = computed(() => {
  const region = selectedRegion.value
  if (!region) return []
  return CHRONICLE.filter((entry) => entry.region === region.id)
})

/** 图上落印的编年，编号与朱印一致 */
const pinnedEvents = computed(() => CHRONICLE.filter((entry) => entry.pin))

const eventCount = CHRONICLE.length

function openProvince(id: string) {
  selectedId.value = id
  activeEventId.value = null
}

function openEvent(id: string) {
  const entry = CHRONICLE.find((item) => item.id === id)
  if (!entry) return
  activeEventId.value = id
  if (entry.region) selectedId.value = entry.region
  void nextTick(() => scrollToEvent(id))
}

/** 窄屏舆图可横向拖动：把朱印带到视口中央 */
function scrollToEvent(id: string) {
  const frame = frameRef.value
  if (!frame || frame.scrollWidth <= frame.clientWidth) return
  const target = frame.querySelector<SVGGraphicsElement>(`[data-event="${id}"]`)
  if (!target) return
  const box = target.getBoundingClientRect()
  const frameBox = frame.getBoundingClientRect()
  frame.scrollTo({
    left: frame.scrollLeft + box.left - frameBox.left - frameBox.width / 2 + box.width / 2,
    behavior: 'smooth',
  })
}

/** 首次进入窄屏时，先看京师与关宁一线，而不是地图最西端 */
let centered = false
function centerFrame() {
  const frame = frameRef.value
  if (centered || !frame || frame.scrollWidth <= frame.clientWidth) return
  frame.scrollLeft = (frame.scrollWidth - frame.clientWidth) * 0.58
  centered = true
}

function focusRegion(id: string) {
  openProvince(id)
}

function clearAll() {
  activeEventId.value = null
  selectedId.value = null
}

function regionName(id: string): string {
  return findRegion(id)?.name ?? ''
}

function regionKindLabel(region: Region): string {
  if (region.id === 'beizhili' || region.id === 'nanzhili') return '直隶'
  if (region.kind === 'dependency') return '都司'
  if (region.kind === 'neighbor') return region.id === 'houjin' ? '敌国' : '藩部'
  return '布政使司'
}

function back() {
  navigate('/')
}

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (activeEventId.value) {
    activeEventId.value = null
    return
  }
  if (selectedId.value) selectedId.value = null
}

let centerTimer: number | undefined

onMounted(() => {
  document.title = '崇祯皇舆图 · 大明'
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', centerFrame)
  requestAnimationFrame(() => requestAnimationFrame(centerFrame))
  centerTimer = window.setTimeout(centerFrame, 320)
})
onUnmounted(() => {
  document.title = previousTitle
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', centerFrame)
  window.clearTimeout(centerTimer)
})
</script>

<template>
  <div class="map-page">
    <header class="masthead">
      <button class="back" aria-label="返回游戏" @click="back">‹ 回宫</button>
      <div class="masthead-text">
        <p class="kicker">大明 · 崇祯即位年间</p>
        <h1>皇舆图</h1>
        <p class="sub">天启七年八月，信王入继大统；明年改元崇祯。</p>
      </div>
      <div class="era-seal seal inked" aria-hidden="true">
        <span>崇祯</span>
        <span>元年</span>
      </div>
    </header>

    <div class="layout">
      <section class="map-card" aria-label="崇祯元年疆域图">
        <header class="map-tools">
          <div class="map-heading">
            <h2>两京十三布政使司</h2>
            <p>关宁锦孤悬于东，秦晋旱饥于西</p>
          </div>
          <div class="layers" role="group" aria-label="图层开关">
            <button class="layer" :class="{ on: showMinor }" :aria-pressed="showMinor" @click="showMinor = !showMinor">
              府州
            </button>
            <button class="layer" :class="{ on: showFrontier }" :aria-pressed="showFrontier" @click="showFrontier = !showFrontier">
              九边
            </button>
            <button class="layer" :class="{ on: showEvents }" :aria-pressed="showEvents" @click="showEvents = !showEvents">
              兵事
            </button>
            <button class="layer" :class="{ on: showRivers }" :aria-pressed="showRivers" @click="showRivers = !showRivers">
              河渠
            </button>
          </div>
        </header>

        <div ref="frameRef" class="map-frame">
          <HistoricalMap
            :selected="selectedId"
            :active-event="activeEventId"
            :show-minor="showMinor"
            :show-frontier="showFrontier"
            :show-events="showEvents"
            :show-rivers="showRivers"
            @select="openProvince"
            @event="openEvent"
            @clear="clearAll"
          />
        </div>

        <footer class="map-foot">
          <span>点按省、藩或朱印查看形势；窄屏可左右拖动</span>
          <span>海岸与省界为示意，非测绘</span>
        </footer>
      </section>

      <aside class="side">
        <section class="panel" :class="{ floating: selectedRegion || activeEvent }" aria-live="polite">
          <button
            v-if="selectedRegion || activeEvent"
            class="panel-close"
            aria-label="关闭详情"
            @click="clearAll"
          >
            ✕
          </button>
          <template v-if="activeEvent">
            <p class="panel-kicker">{{ activeEvent.date }} · {{ activeEvent.place }}</p>
            <h2 class="panel-title">{{ activeEvent.title }}</h2>
            <p class="panel-text">{{ activeEvent.text }}</p>
            <button v-if="activeEvent.region" class="panel-link" @click="focusRegion(activeEvent.region)">
              查看{{ regionName(activeEvent.region) }}形势 →
            </button>
          </template>

          <template v-else-if="selectedRegion">
            <p class="panel-kicker">
              {{ regionKindLabel(selectedRegion) }}
              <template v-if="selectedRegion.capital"> · 治 {{ selectedRegion.capital }}</template>
            </p>
            <h2 class="panel-title">{{ selectedRegion.name }}</h2>
            <p class="panel-meta">{{ selectedRegion.meta }}</p>
            <p class="panel-text">{{ selectedRegion.note }}</p>
            <ul class="facts">
              <li v-for="fact in selectedRegion.facts" :key="fact">{{ fact }}</li>
            </ul>
            <div v-if="regionEvents.length" class="region-events">
              <h3>本省大事</h3>
              <button v-for="entry in regionEvents" :key="entry.id" @click="openEvent(entry.id)">
                <span>{{ entry.date }}</span>{{ entry.title }}
              </button>
            </div>
          </template>

          <template v-else>
            <p class="panel-kicker">天启七年八月 — 崇祯元年</p>
            <h2 class="panel-title">天下形势</h2>
            <p class="panel-text">
              新君自信邸入宫，接手的是一个外有建州、内有旱饥的天下。辽东仅存关宁锦一线，朝鲜新败于后金；陕西连岁不雨，流民已聚于山谷。太仓无银，九边欠饷，而朝中门户之争未已。
            </p>
            <ul class="urgent">
              <li><b>辽东</b><span>关宁锦孤悬，后金新汗东征朝鲜</span></li>
              <li><b>陕西</b><span>连岁大旱，澄城、府谷民变已起</span></li>
              <li><b>财赋</b><span>辽饷加派，太仓空虚，九边欠饷</span></li>
              <li><b>朝局</b><span>阉党初除，门户之争未已</span></li>
            </ul>
            <div class="pin-index">
              <h3>图上朱印</h3>
              <ol>
                <li v-for="(entry, index) in pinnedEvents" :key="entry.id">
                  <button @click="openEvent(entry.id)">
                    <i>{{ index + 1 }}</i>{{ entry.title }}
                  </button>
                </li>
              </ol>
            </div>
            <ul class="legend">
              <li><i class="sym sym-capital"></i>京师 / 留都</li>
              <li><i class="sym sym-seat"></i>省治</li>
              <li><i class="sym sym-fort"></i>九边重镇</li>
              <li><i class="sym sym-pin">1</i>兵事 / 民变</li>
              <li><i class="sym sym-river"></i>河渠</li>
            </ul>
            <p class="source">
              两京十三布政使司 · {{ NEIGHBORS.length }} 邻部 · {{ eventCount }} 条编年。疆域轮廓据 Natural Earth 1:50m 边界合并简化，史事据《明史》《国榷》。
            </p>
          </template>
        </section>

        <section class="chronicle" aria-label="编年">
          <header>
            <h2>编年</h2>
            <span>即位前后 · {{ eventCount }} 条</span>
          </header>
          <ol>
            <li v-for="entry in CHRONICLE" :key="entry.id">
              <button :class="{ on: activeEventId === entry.id }" @click="openEvent(entry.id)">
                <span class="c-date">{{ entry.date }}</span>
                <span class="c-title">{{ entry.title }}</span>
                <span class="c-place">{{ entry.place }}</span>
              </button>
            </li>
          </ol>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.map-page {
  min-height: 100dvh;
  max-width: 1240px;
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
  margin-bottom: 18px;
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
  letter-spacing: 1px;
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

/* ---------- 主体 ---------- */

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 336px;
  gap: 20px;
  align-items: start;
}

.map-card {
  position: relative;
  padding: 12px 12px 10px;
  border: 1.5px solid var(--line);
  border-radius: 4px;
  background:
    var(--grain),
    linear-gradient(168deg, var(--paper-hi) 0%, #f3e8d5 52%, #e8d7b8 100%);
  box-shadow: 0 12px 32px rgba(41, 33, 26, 0.16);
}

.map-card::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid rgba(171, 142, 95, 0.35);
  pointer-events: none;
}

.map-tools {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  padding: 2px 4px 9px;
}

.map-heading h2 {
  font-family: var(--font-kai);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--ink);
}

.map-heading p {
  margin-top: 2px;
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--ink-3);
}

.layers {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.layer {
  padding: 4px 9px;
  font-size: 11.5px;
  letter-spacing: 1px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.6);
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  cursor: pointer;
}

.layer:hover {
  border-color: var(--line);
}

.layer.on {
  color: var(--paper-hi);
  background: var(--ink-2);
  border-color: var(--ink-2);
}

.map-frame {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--line-soft);
  background: #dde3d8;
  scrollbar-width: thin;
}

.map-frame::-webkit-scrollbar {
  height: 6px;
}

.map-foot {
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 4px 0;
  font-size: 10.5px;
  letter-spacing: 0.5px;
  color: var(--ink-3);
}

/* ---------- 右栏 ---------- */

.side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.panel,
.chronicle {
  border: 1.5px solid var(--line);
  border-radius: 4px;
  background:
    var(--grain),
    linear-gradient(168deg, var(--paper-hi) 0%, #f4e9d6 50%, #e9d9ba 100%);
  box-shadow: 0 8px 22px rgba(41, 33, 26, 0.13);
}

.panel {
  position: relative;
  min-height: 280px;
  padding: 18px 18px 20px;
}

.panel-close {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 26px;
  height: 26px;
  font-size: 11px;
  color: var(--cinnabar);
  background: rgba(255, 253, 248, 0.72);
  border: 1.5px solid var(--cinnabar);
  border-radius: 50%;
  cursor: pointer;
}

.panel-close:hover,
.panel-close:focus-visible {
  background: rgba(168, 50, 42, 0.1);
}

.panel-kicker {
  font-family: var(--font-kai);
  font-size: 11.5px;
  letter-spacing: 2px;
  color: var(--cinnabar);
}

.panel-title {
  margin-top: 3px;
  font-family: var(--font-kai);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 4px;
  color: var(--ink);
}

.panel-meta {
  margin-top: 1px;
  font-size: 11.5px;
  letter-spacing: 0.5px;
  color: var(--ink-3);
}

.panel-text {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.95;
  text-align: justify;
  color: var(--ink-2);
}

.panel-link {
  margin-top: 14px;
  padding: 0;
  font-family: var(--font-kai);
  font-size: 12.5px;
  letter-spacing: 1px;
  color: var(--cinnabar);
  background: none;
  border: none;
  cursor: pointer;
}

.panel-link:hover {
  text-decoration: underline;
}

.facts {
  margin-top: 13px;
  padding-top: 9px;
  list-style: none;
  border-top: 1px dashed var(--line-soft);
}

.facts li {
  position: relative;
  margin-top: 6px;
  padding-left: 13px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ink-2);
}

.facts li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 8px;
  width: 4px;
  height: 4px;
  background: var(--cinnabar);
  transform: rotate(45deg);
}

.region-events {
  margin-top: 13px;
  padding-top: 9px;
  border-top: 1px dashed var(--line-soft);
}

.region-events h3 {
  font-family: var(--font-kai);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--ink);
}

.region-events button {
  display: block;
  width: 100%;
  padding: 6px 2px;
  font-size: 12px;
  text-align: left;
  color: var(--ink-2);
  background: none;
  border: none;
  border-bottom: 1px dotted rgba(171, 142, 95, 0.4);
  cursor: pointer;
}

.region-events button:hover {
  color: var(--cinnabar);
}

.region-events span {
  display: inline-block;
  min-width: 74px;
  font-size: 10.5px;
  color: var(--ink-3);
}

.urgent {
  margin-top: 12px;
  list-style: none;
  display: grid;
  gap: 6px;
}

.urgent li {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 8px;
  padding-left: 8px;
  border-left: 2px solid rgba(168, 50, 42, 0.6);
  font-size: 12px;
  line-height: 1.65;
}

.urgent b {
  font-family: var(--font-kai);
  letter-spacing: 2px;
  color: var(--ink);
}

.urgent span {
  color: var(--ink-3);
}

.pin-index {
  margin-top: 12px;
  padding-top: 9px;
  border-top: 1px dashed var(--line-soft);
}

.pin-index h3 {
  font-family: var(--font-kai);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--ink);
}

.pin-index ol {
  list-style: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 2px 8px;
  margin-top: 4px;
}

.pin-index button {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  padding: 3px 0;
  font-size: 11px;
  text-align: left;
  color: var(--ink-2);
  background: none;
  border: none;
  cursor: pointer;
}

.pin-index button:hover {
  color: var(--cinnabar);
}

.pin-index i {
  flex: none;
  width: 13px;
  height: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  font-size: 8px;
  line-height: 1;
  color: var(--paper-hi);
  background: var(--cinnabar);
  border-radius: 2px;
}

.legend {
  margin-top: 13px;
  padding-top: 10px;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 13px;
  border-top: 1px dashed var(--line-soft);
  font-size: 11px;
  color: var(--ink-3);
}

.legend li {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sym {
  display: inline-block;
  flex: none;
}

.sym-capital {
  width: 7px;
  height: 7px;
  background: var(--cinnabar);
  transform: rotate(45deg);
}

.sym-seat {
  width: 7px;
  height: 7px;
  background: var(--ink-2);
  border-radius: 50%;
}

.sym-fort {
  width: 7px;
  height: 7px;
  background: var(--paper-hi);
  border: 1.5px solid #6d5636;
}

.sym-pin {
  width: 13px;
  height: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  line-height: 1;
  color: var(--paper-hi);
  background: var(--cinnabar);
  border-radius: 2px;
}

.sym-river {
  width: 12px;
  height: 0;
  border-top: 2px solid #5f7f8c;
}

.source {
  margin-top: 10px;
  font-size: 10.5px;
  line-height: 1.65;
  color: var(--ink-3);
}

/* ---------- 编年 ---------- */

.chronicle {
  padding: 14px 16px 8px;
}

.chronicle header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line-soft);
}

.chronicle h2 {
  font-family: var(--font-kai);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--ink);
}

.chronicle header span {
  font-size: 10.5px;
  color: var(--ink-3);
}

.chronicle ol {
  list-style: none;
}

.chronicle button {
  display: grid;
  grid-template-columns: 76px 1fr;
  grid-template-areas:
    'date title'
    'date place';
  column-gap: 8px;
  width: 100%;
  padding: 7px 5px;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px dotted rgba(171, 142, 95, 0.38);
  cursor: pointer;
}

.chronicle li:last-child button {
  border-bottom: none;
}

.chronicle button:hover {
  background: rgba(255, 253, 248, 0.6);
}

.chronicle button.on {
  background: rgba(168, 50, 42, 0.08);
  box-shadow: inset 2px 0 0 var(--cinnabar);
}

.c-date {
  grid-area: date;
  padding-top: 1px;
  font-size: 10.5px;
  letter-spacing: 0.5px;
  color: var(--ink-3);
}

.c-title {
  grid-area: title;
  font-family: var(--font-kai);
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--ink);
}

.chronicle button.on .c-title {
  color: var(--cinnabar);
}

.c-place {
  grid-area: place;
  font-size: 10.5px;
  color: var(--ink-3);
}

/* ---------- 窄屏 ---------- */

@media (max-width: 980px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .side {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }

  /* 窄屏点图后，详情从底部浮起，免得读者越过整张图去找面板 */
  .panel.floating {
    position: fixed;
    left: 8px;
    right: 8px;
    bottom: calc(8px + env(safe-area-inset-bottom));
    z-index: 50;
    max-height: 62dvh;
    overflow-y: auto;
    min-height: 0;
    box-shadow: 0 -12px 34px rgba(41, 33, 26, 0.28);
    animation: sheet-up 0.22s ease;
  }

  @keyframes sheet-up {
    from {
      transform: translateY(26px);
      opacity: 0.35;
    }
  }
}

@media (max-width: 700px) {
  .map-page {
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

  .map-tools {
    flex-direction: column;
    align-items: stretch;
  }

  .layers {
    justify-content: flex-start;
  }

  .map-foot {
    flex-direction: column;
    gap: 3px;
  }

  .side {
    grid-template-columns: minmax(0, 1fr);
  }

  .panel {
    min-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .layer,
  .back {
    transition: none;
  }
}
</style>

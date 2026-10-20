<script setup lang="ts">
import { computed } from 'vue'
import {
  ALL_REGIONS,
  CHRONICLE,
  CITIES,
  FRONTIERS,
  RIVERS,
  WALL,
} from '../data/atlas'
import type { ChronicleEntry, City, LonLat, Region } from '../data/atlas'

const props = defineProps<{
  selected: string | null
  activeEvent: string | null
  showMinor: boolean
  showFrontier: boolean
  showEvents: boolean
  showRivers: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'event', id: string): void
  (e: 'clear'): void
}>()

/* ---------- 经纬到画布：等距圆柱 + 中纬度经度压缩 ---------- */

const VIEW_W = 800
const VIEW_H = 650
const PAD = 10
const LON0 = 94.8
const LAT1 = 44.8
/** 经度缩放：约取 cos(32°)，让华北不至于被拉宽 */
const SCALE_X = 22.285
const SCALE_Y = 23.5

type Pt = [number, number]

function px(lon: number) {
  return PAD + (lon - LON0) * SCALE_X
}

function py(lat: number) {
  return PAD + (LAT1 - lat) * SCALE_Y
}

function project([lon, lat]: LonLat): Pt {
  return [px(lon), py(lat)]
}

/** Chaikin 切角：把方折的示意边界磨成手绘的圆转笔意 */
function chaikin(points: Pt[], closed: boolean, rounds = 2): Pt[] {
  let pts = points
  for (let round = 0; round < rounds; round += 1) {
    const next: Pt[] = []
    const n = pts.length
    const edges = closed ? n : n - 1
    if (!closed) next.push(pts[0])
    for (let i = 0; i < edges; i += 1) {
      const a = pts[i]
      const b = pts[(i + 1) % n]
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25])
      next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75])
    }
    if (!closed) next.push(pts[n - 1])
    pts = next
  }
  return pts
}

function ringPath(points: LonLat[], closed = true): string {
  const deduped =
    closed && points.length > 1 &&
    points[0][0] === points[points.length - 1][0] &&
    points[0][1] === points[points.length - 1][1]
      ? points.slice(0, -1)
      : points
  const projected = chaikin(deduped.map(project), closed)
  const body = projected
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join('')
  return closed ? `${body}Z` : body
}

function regionPath(region: Region): string {
  const rings = [region.outline, ...(region.extra ?? [])]
  return rings.map((ring) => ringPath(ring)).join('')
}

/** 河道：向心 Catmull-Rom 折成三次贝塞尔，水脉才不至于像折尺 */
function smoothPath(points: LonLat[]): string {
  const pts = points.map(project)
  if (pts.length < 2) return ''
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

/** 长城垛口：沿折线等距生成短垂线 */
function wallTicks(points: LonLat[], step = 13, length = 4): string {
  const pts = points.map(project)
  let d = ''
  let walked = 0
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const dx = x2 - x1
    const dy = y2 - y1
    const segment = Math.hypot(dx, dy)
    if (!segment) continue
    const ux = dx / segment
    const uy = dy / segment
    const first = step - (walked % step)
    for (let offset = first; offset < segment; offset += step) {
      const x = x1 + ux * offset
      const y = y1 + uy * offset
      d += `M${(x - uy * length).toFixed(1)} ${(y + ux * length).toFixed(1)}L${(x + uy * length).toFixed(1)} ${(y - ux * length).toFixed(1)}`
    }
    walked += segment
  }
  return d
}

/* ---------- 静态图元 ---------- */

const regions = ALL_REGIONS.map((region) => ({
  ...region,
  d: regionPath(region),
  hatchId: region.hatch === 'jin' ? 'hatch-jin' : region.hatch === 'stipple' ? 'hatch-stipple' : null,
}))

const cities = CITIES.map((city) => {
  const anchor = city.anchor ?? (px(city.lon) > 645 ? 'end' : 'start')
  return {
    ...city,
    x: px(city.lon),
    y: py(city.lat),
    anchor,
    labelX: px(city.lon) + (city.dx ?? (anchor === 'middle' ? 0 : anchor === 'end' ? -7 : 7)),
    labelY: py(city.lat) + (city.dy ?? (anchor === 'middle' ? 12 : 3)),
  }
})

const visibleCities = computed(() => cities.filter((city) => city.rank === 1 || props.showMinor))

const frontiers = FRONTIERS.map((frontier) => {
  const x = px(frontier.lon)
  const y = py(frontier.lat)
  const anchor = frontier.anchor ?? 'start'
  return {
    ...frontier,
    x,
    y,
    labelX: x + (frontier.dx ?? (anchor === 'end' ? -6 : 6)),
    labelY: y + (frontier.dy ?? -4),
    labelAnchor: anchor,
  }
})

const rivers = RIVERS.map((river) => ({ ...river, d: smoothPath(river.points) }))

/** 登州—皮岛海道：东江镇的饷道与牵制之路 */
const seaRoute = smoothPath([
  [120.9, 38.0],
  [121.9, 38.45],
  [123.1, 39.0],
  [123.5, 39.45],
])

const mapNotes = [
  { text: '河套', lon: 108.4, lat: 40.55, size: 9 },
  { text: '察哈尔', lon: 114.6, lat: 42.15, size: 9 },
  { text: '东江饷道', lon: 122.55, lat: 38.25, size: 8.5 },
]

const wallPath = smoothPath(WALL)
const wallTickPath = wallTicks(WALL)

const pinned = CHRONICLE.filter((entry) => entry.pin).map((entry) => {
  const offset = entry.pinOffset ?? [0, 0]
  return {
    entry,
    x: px(entry.lon) + offset[0],
    y: py(entry.lat) + offset[1],
    label: entry.place.split(' · ').pop() ?? entry.place,
  }
})

const pinNumber = new Map(pinned.map((pin, index) => [pin.entry.id, index + 1]))

const seaNames = [
  { name: '渤海', lon: 119.4, lat: 38.35, size: 10 },
  { name: '黄海', lon: 123.4, lat: 34.5, size: 12 },
  { name: '东海', lon: 125.1, lat: 28.8, size: 13 },
  { name: '南海', lon: 114.6, lat: 18.75, size: 13 },
]

function cityClass(city: City) {
  return `city-${city.kind}`
}

function selectRegion(id: string) {
  emit('select', id)
}

function openEvent(id: string) {
  emit('event', id)
}

function eventLabel(entry: ChronicleEntry) {
  return pinNumber.get(entry.id) ?? 0
}
</script>

<template>
  <svg
    class="historical-map"
    :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
    role="img"
    aria-label="崇祯即位年间大明皇舆图：两京十三布政使司、辽东、九边与后金、蒙古、朝鲜"
  >
    <defs>
      <pattern id="sea-waves" width="48" height="16" patternUnits="userSpaceOnUse">
        <path
          d="M0 12q6-5 12 0t12 0t12 0t12 0"
          fill="none"
          stroke="#a9b8a8"
          stroke-width="0.9"
          opacity="0.5"
        />
      </pattern>
      <pattern id="hatch-jin" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <line x1="0" y1="0" x2="0" y2="7" stroke="#a8322a" stroke-width="1" opacity="0.24" />
      </pattern>
      <pattern id="hatch-stipple" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="3" r="0.9" fill="#7a6a55" opacity="0.35" />
        <circle cx="6.5" cy="7" r="0.7" fill="#7a6a55" opacity="0.28" />
      </pattern>
      <filter id="pin-shadow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" flood-color="#29211a" flood-opacity="0.3" />
      </filter>
    </defs>

    <!-- 海 -->
    <rect x="0" y="0" width="800" height="650" class="sea" @click="emit('clear')" />
    <rect x="0" y="0" width="800" height="650" fill="url(#sea-waves)" pointer-events="none" />

    <text
      v-for="sea in seaNames"
      :key="sea.name"
      :x="px(sea.lon)"
      :y="py(sea.lat)"
      :font-size="sea.size"
      class="sea-name"
    >
      {{ sea.name }}
    </text>

    <!-- 长城（先画，压在省界之下更自然） -->
    <g v-if="showFrontier" class="wall" pointer-events="none">
      <path :d="wallPath" class="wall-shadow" />
      <path :d="wallPath" class="wall-line" />
      <path :d="wallTickPath" class="wall-ticks" />
    </g>

    <!-- 行政区与藩部 -->
    <g class="regions">
      <g
        v-for="region in regions"
        :key="region.id"
        class="region"
        :class="[{ on: selected === region.id, neighbor: region.kind === 'neighbor' }]"
        role="button"
        tabindex="0"
        :aria-label="`查看${region.name}形势`"
        @click.stop="selectRegion(region.id)"
        @keydown.enter.prevent="selectRegion(region.id)"
        @keydown.space.prevent="selectRegion(region.id)"
      >
        <path :d="region.d" :fill="region.fill" class="base" />
        <path v-if="region.hatchId" :d="region.d" :fill="`url(#${region.hatchId})`" class="hatch" />
        <path :d="region.d" class="edge" />
        <title>点按查看{{ region.name }}形势</title>
      </g>
    </g>

    <!-- 河渠 -->
    <g v-if="showRivers" class="rivers" pointer-events="none">
      <path
        v-for="river in rivers"
        :key="river.id"
        :d="river.d"
        :class="`river river-${river.kind}`"
      >
        <title>{{ river.name }}</title>
      </path>
      <path :d="seaRoute" class="river river-sea" />
    </g>

    <!-- 图上小注：河套、察哈尔与东江饷道 -->
    <g class="map-notes" pointer-events="none">
      <template v-for="note in mapNotes" :key="note.text">
        <text
          v-if="note.text !== '东江饷道' || showRivers"
          :x="px(note.lon)"
          :y="py(note.lat)"
          :font-size="note.size"
          class="map-note"
        >
          {{ note.text }}
        </text>
      </template>
    </g>

    <!-- 省名 -->
    <g class="region-labels" pointer-events="none">
      <text
        v-for="region in regions"
        :key="`label-${region.id}`"
        :x="px(region.label[0])"
        :y="py(region.label[1])"
        :font-size="region.labelSize ?? 14.5"
        :class="['region-name', { neighbor: region.kind === 'neighbor' }]"
      >
        {{ region.labelText ?? region.name }}
      </text>
    </g>

    <!-- 九边 -->
    <g v-if="showFrontier" class="frontiers">
      <g v-for="frontier in frontiers" :key="frontier.id" :transform="`translate(${frontier.x} ${frontier.y})`">
        <rect x="-2.7" y="-2.7" width="5.4" height="5.4" class="frontier-mark" />
        <text
          v-if="!frontier.hideLabel"
          :x="frontier.labelX - frontier.x"
          :y="frontier.labelY - frontier.y"
          :text-anchor="frontier.labelAnchor"
          class="frontier-name"
        >
          {{ frontier.name }}
        </text>
        <title>{{ frontier.name }}</title>
      </g>
    </g>

    <!-- 城邑 -->
    <g class="cities">
      <g
        v-for="city in visibleCities"
        :key="city.id"
        :class="['city', cityClass(city)]"
        :transform="`translate(${city.x} ${city.y})`"
      >
        <path v-if="city.kind === 'capital'" d="M0 -4.6L4.6 0L0 4.6L-4.6 0Z" class="city-mark" />
        <circle v-else-if="city.kind === 'auxiliary'" r="3.2" class="city-mark halo" />
        <rect v-else-if="city.kind === 'fort'" x="-2.6" y="-2.6" width="5.2" height="5.2" class="city-mark" />
        <path v-else-if="city.kind === 'port'" d="M0 -3.6L3.2 2.6L-3.2 2.6Z" class="city-mark" />
        <circle v-else r="2.1" class="city-mark" />
        <circle v-if="city.kind === 'capital' || city.kind === 'auxiliary'" r="1.1" class="city-core" />
        <text
          v-if="!city.hideLabel"
          :x="city.labelX - city.x"
          :y="city.labelY - city.y"
          :text-anchor="city.anchor"
          class="city-name"
        >
          {{ city.name }}
        </text>
      </g>
    </g>

    <!-- 兵事 / 民变 -->
    <g v-if="showEvents" class="events">
      <g
        v-for="pin in pinned"
        :key="pin.entry.id"
        class="event-pin"
        :class="{ on: activeEvent === pin.entry.id }"
        :transform="`translate(${pin.x} ${pin.y})`"
        role="button"
        tabindex="0"
        :data-event="pin.entry.id"
        :aria-label="`${pin.entry.date} ${pin.entry.title}`"
        @click.stop="openEvent(pin.entry.id)"
        @keydown.enter.prevent="openEvent(pin.entry.id)"
        @keydown.space.prevent="openEvent(pin.entry.id)"
      >
        <circle r="13" class="pulse" />
        <rect x="-8.6" y="-8.6" width="17.2" height="17.2" rx="3" class="pin-body" filter="url(#pin-shadow)" />
        <text y="0.6" text-anchor="middle" class="pin-number">{{ eventLabel(pin.entry) }}</text>
        <text :y="17.5" text-anchor="middle" class="pin-name">{{ pin.label }}</text>
        <title>{{ pin.entry.date }} · {{ pin.entry.title }}</title>
      </g>
    </g>

    <!-- 图廓 -->
    <rect x="3.5" y="3.5" width="793" height="643" class="frame-outer" pointer-events="none" />
    <rect x="8.5" y="8.5" width="783" height="633" class="frame-inner" pointer-events="none" />

    <!-- 指北与步里 -->
    <g class="compass" transform="translate(735 576)" pointer-events="none">
      <circle r="23" class="compass-ring" />
      <path d="M0 -17L5.2 7L0 3.2L-5.2 7Z" class="compass-needle" />
      <text y="-27" text-anchor="middle" class="compass-text">北</text>
    </g>

    <g class="scale" transform="translate(42 611)" pointer-events="none">
      <path d="M0 0H56M0 -4V4M28 -3V3M56 -4V4" class="scale-line" />
      <text x="0" y="-9" class="scale-text">五百里（约）</text>
    </g>
  </svg>
</template>

<style scoped>
.historical-map {
  display: block;
  width: 100%;
  min-width: 680px;
  height: auto;
  font-family: var(--font-serif);
}

.sea {
  fill: #dde3d8;
  cursor: default;
}

.sea-name {
  fill: #7f958a;
  font-family: var(--font-kai);
  letter-spacing: 5px;
  opacity: 0.75;
  user-select: none;
  pointer-events: none;
}

/* 地名、边镇、河渠只作注记，点按应落到其下的省界上 */
.cities,
.frontiers,
.rivers,
.map-notes {
  pointer-events: none;
}

/* ---------- 省界 ---------- */

.region {
  cursor: pointer;
  outline: none;
}

.region:focus-visible .edge {
  stroke: var(--cinnabar);
  stroke-width: 2.1;
}

.region .base {
  transition: fill 0.18s ease;
}

.region .edge {
  fill: none;
  stroke: #9c7f52;
  stroke-width: 1.05;
  stroke-linejoin: round;
  opacity: 0.85;
  transition: stroke 0.18s ease, stroke-width 0.18s ease;
}

.region .hatch {
  pointer-events: none;
}

.region:hover .base {
  fill: #e6d2ab;
}

.region:hover .edge {
  stroke: var(--cinnabar);
  stroke-width: 1.7;
}

.region.on .base {
  fill: #ecd7ae;
}

.region.on .edge {
  stroke: var(--cinnabar);
  stroke-width: 2.1;
}

.region.neighbor .edge {
  stroke: #8d7150;
  stroke-dasharray: 5 3;
  stroke-width: 1;
}

.region.neighbor.on .edge,
.region.neighbor:hover .edge {
  stroke-dasharray: none;
}

.region-name {
  fill: #54422f;
  font-family: var(--font-kai);
  font-weight: 700;
  letter-spacing: 3px;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #f4ead6;
  stroke-width: 3.2;
  stroke-linejoin: round;
  opacity: 0.95;
}

.region-name.neighbor {
  fill: #6f5c46;
  font-weight: 400;
  letter-spacing: 4px;
  opacity: 0.85;
}

/* ---------- 河渠与长城 ---------- */

.river {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.river-yellow {
  stroke: #a98551;
  stroke-width: 1.7;
  opacity: 0.75;
}

.river-yangtze {
  stroke: #5f7f8c;
  stroke-width: 1.8;
  opacity: 0.78;
}

.river-canal {
  stroke: #78897b;
  stroke-width: 1.35;
  stroke-dasharray: 4 3.2;
  opacity: 0.85;
}

.river-sea {
  stroke: #5f7f8c;
  stroke-width: 1.3;
  stroke-dasharray: 2 4;
  opacity: 0.62;
}

.map-note {
  fill: #7a6a55;
  font-family: var(--font-kai);
  letter-spacing: 2px;
  opacity: 0.72;
  paint-order: stroke;
  stroke: #eef1e8;
  stroke-width: 2.4;
  stroke-linejoin: round;
}

.wall-shadow {
  fill: none;
  stroke: #7e6a4c;
  stroke-width: 3.4;
  opacity: 0.12;
}

.wall-line {
  fill: none;
  stroke: #8b6f47;
  stroke-width: 1.2;
  stroke-linejoin: round;
  opacity: 0.8;
}

.wall-ticks {
  fill: none;
  stroke: #8b6f47;
  stroke-width: 0.9;
  opacity: 0.55;
}

/* ---------- 城邑 ---------- */

.city-mark {
  fill: #4e4234;
  stroke: #f4ead6;
  stroke-width: 0.8;
}

.city-core {
  fill: #f4ead6;
}

.city-capital .city-mark {
  fill: var(--cinnabar);
}

.city-auxiliary .city-mark {
  fill: var(--azure);
}

.city-fort .city-mark {
  fill: #6d5636;
}

.city-port .city-mark {
  fill: #4b7a6e;
}

.city-name {
  fill: #3f3327;
  font-size: 9.4px;
  letter-spacing: 0.6px;
  paint-order: stroke;
  stroke: #f4ead6;
  stroke-width: 2.6;
  stroke-linejoin: round;
  user-select: none;
}

.city-capital .city-name,
.city-auxiliary .city-name {
  font-family: var(--font-kai);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 1.5px;
}

/* ---------- 九边 ---------- */

.frontier-mark {
  fill: #f4ead6;
  stroke: #6d5636;
  stroke-width: 1.2;
}

.frontier-name {
  fill: #6d5636;
  font-family: var(--font-kai);
  font-size: 8.2px;
  letter-spacing: 0.5px;
  paint-order: stroke;
  stroke: #f4ead6;
  stroke-width: 2.2;
  stroke-linejoin: round;
}

/* ---------- 兵事印 ---------- */

.event-pin {
  cursor: pointer;
  outline: none;
}

.event-pin .pin-body {
  fill: var(--cinnabar);
  stroke: #f8eeda;
  stroke-width: 1.2;
}

.event-pin .pin-number {
  fill: #fff6e4;
  font-family: var(--font-kai);
  font-size: 10.5px;
  font-weight: 700;
}

.event-pin .pin-name {
  fill: #8d2620;
  font-family: var(--font-kai);
  font-size: 9px;
  letter-spacing: 1px;
  paint-order: stroke;
  stroke: #f4ead6;
  stroke-width: 2.6;
  stroke-linejoin: round;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.event-pin:hover .pin-name,
.event-pin.on .pin-name,
.event-pin:focus-visible .pin-name {
  opacity: 1;
}

.event-pin .pulse {
  fill: rgba(168, 50, 42, 0.16);
  opacity: 0;
}

.event-pin:hover .pulse,
.event-pin.on .pulse,
.event-pin:focus-visible .pulse {
  opacity: 1;
  animation: pin-pulse 2.2s ease-out infinite;
}

.event-pin.on .pin-body {
  fill: #7f1f19;
}

@keyframes pin-pulse {
  0% {
    transform: scale(0.55);
    opacity: 0.75;
  }
  70% {
    transform: scale(1.45);
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}

/* ---------- 图廓与指北 ---------- */

.frame-outer {
  fill: none;
  stroke: #8f744c;
  stroke-width: 2;
}

.frame-inner {
  fill: none;
  stroke: #b49a72;
  stroke-width: 0.7;
  opacity: 0.8;
}

.compass-ring {
  fill: rgba(251, 244, 230, 0.55);
  stroke: #8f744c;
  stroke-width: 1.2;
}

.compass-needle {
  fill: var(--cinnabar);
  stroke: #7f1f19;
  stroke-width: 0.6;
}

.compass-text {
  fill: #6d5636;
  font-family: var(--font-kai);
  font-size: 10px;
  letter-spacing: 2px;
}

.scale-line {
  fill: none;
  stroke: #7a6a55;
  stroke-width: 1.1;
}

.scale-text {
  fill: #7a6a55;
  font-family: var(--font-kai);
  font-size: 9px;
  letter-spacing: 1.5px;
}

@media (prefers-reduced-motion: reduce) {
  .event-pin .pulse {
    animation: none;
  }
}
</style>

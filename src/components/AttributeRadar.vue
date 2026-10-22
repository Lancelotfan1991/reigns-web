<script setup lang="ts">
import { computed, useId } from 'vue'
import { ATTRIBUTE_META } from '../data/characters'
import type { CharacterAttributeKey, CharacterAttributes } from '../types'

const props = withDefaults(
  defineProps<{
    attributes: CharacterAttributes
    variant?: 'card' | 'sheet'
  }>(),
  { variant: 'sheet' }
)

const GEOMETRY = {
  card: { w: 200, h: 180, cx: 100, cy: 86, r: 50, labelGap: 17, labelSize: 12, valueSize: 8.5, stroke: 1.2, dot: 1.8 },
  sheet: { w: 240, h: 240, cx: 120, cy: 116, r: 72, labelGap: 22, labelSize: 12, valueSize: 10.5, stroke: 1.6, dot: 2.3 },
} as const

const geo = computed(() => GEOMETRY[props.variant])
const showValues = computed(() => props.variant === 'sheet')
const washId = `radar-wash-${useId().replace(/:/g, '')}`
const TAU = Math.PI * 2

interface Axis {
  key: CharacterAttributeKey
  label: string
  value: number
  x: number
  y: number
  edgeX: number
  edgeY: number
  labelX: number
  labelY: number
  valueY: number
  anchor: 'start' | 'middle' | 'end'
}

function pointAt(index: number, radius: number) {
  const angle = -Math.PI / 2 + (TAU * index) / ATTRIBUTE_META.length
  return {
    x: geo.value.cx + Math.cos(angle) * radius,
    y: geo.value.cy + Math.sin(angle) * radius,
    angle,
  }
}

const axes = computed<Axis[]>(() =>
  ATTRIBUTE_META.map((meta, i) => {
    const value = props.attributes[meta.key]
    const edge = pointAt(i, geo.value.r)
    const label = pointAt(i, geo.value.r + geo.value.labelGap)
    const placed = pointAt(i, (geo.value.r * value) / 100)
    const sin = Math.sin(label.angle)
    const cos = Math.cos(label.angle)
    const labelY = label.y + (sin < -0.7 ? -4 : sin > 0.7 ? 10 : 4)
    return {
      key: meta.key,
      label: meta.label,
      value,
      x: placed.x,
      y: placed.y,
      edgeX: edge.x,
      edgeY: edge.y,
      labelX: label.x,
      labelY,
      valueY: labelY + (showValues.value ? 13 : 11),
      anchor: cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle',
    }
  })
)

const rings = computed(() =>
  [20, 40, 60, 80, 100].map((percent) =>
    ATTRIBUTE_META.map((_, i) => {
      const p = pointAt(i, (geo.value.r * percent) / 100)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    }).join(' ')
  )
)

const shape = computed(() =>
  axes.value.map((a) => `${a.x.toFixed(1)},${a.y.toFixed(1)}`).join(' ')
)

const summary = computed(() =>
  ATTRIBUTE_META.map((a) => `${a.label}${props.attributes[a.key]}`).join('，')
)
</script>

<template>
  <svg
    class="radar"
    :class="`radar--${variant}`"
    :viewBox="`0 0 ${geo.w} ${geo.h}`"
    role="img"
    :aria-label="`才具：${summary}`"
  >
    <defs>
      <radialGradient :id="washId" cx="50%" cy="50%" r="62%">
        <stop offset="0%" stop-color="#c1483d" stop-opacity="0.27" />
        <stop offset="100%" stop-color="#c1483d" stop-opacity="0.08" />
      </radialGradient>
    </defs>

    <polygon
      v-for="(ring, i) in rings"
      :key="i"
      :points="ring"
      class="ring"
      :class="{ outer: i === rings.length - 1 }"
    />
    <line
      v-for="a in axes"
      :key="a.key"
      :x1="geo.cx"
      :y1="geo.cy"
      :x2="a.edgeX"
      :y2="a.edgeY"
      class="axis"
    />

    <polygon :points="shape" class="shape" :fill="`url(#${washId})`" :stroke-width="geo.stroke" />
    <circle
      v-for="a in axes"
      :key="a.key"
      :cx="a.x"
      :cy="a.y"
      :r="geo.dot"
      class="dot"
    />

    <g v-for="a in axes" :key="a.key" class="labels">
      <text
        :x="a.labelX"
        :y="a.labelY"
        :text-anchor="a.anchor"
        :font-size="geo.labelSize"
        class="label"
      >
        {{ a.label }}
      </text>
      <text
        v-if="showValues"
        :x="a.labelX"
        :y="a.valueY"
        :text-anchor="a.anchor"
        :font-size="geo.valueSize"
        class="value"
      >
        {{ a.value }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.radar {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.ring {
  fill: none;
  stroke: rgba(171, 142, 95, 0.36);
  stroke-width: 1;
}

.ring.outer {
  stroke: rgba(171, 142, 95, 0.58);
}

.axis {
  stroke: rgba(171, 142, 95, 0.4);
  stroke-width: 1;
}

.shape {
  stroke: var(--cinnabar);
  stroke-linejoin: round;
}

.dot {
  fill: var(--cinnabar);
}

.label {
  font-family: var(--font-kai);
  fill: var(--ink-2);
  letter-spacing: 1px;
}

.value {
  font-family: var(--font-kai);
  fill: var(--cinnabar);
  font-variant-numeric: tabular-nums;
}

.radar--card .label {
  letter-spacing: 0;
}
</style>

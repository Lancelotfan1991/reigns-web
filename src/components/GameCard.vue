<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameEvent, Side } from '../types'

const props = defineProps<{
  event: GameEvent
  /** 是否允许拖动（飞牌动画期间禁用） */
  interactive: boolean
}>()

const emit = defineEmits<{
  choose: [side: Side]
  drag: [dx: number]
}>()

/** 超过该位移松手即视为做出选择 */
const THRESHOLD = 88

const dx = ref(0)
const dragging = ref(false)
const animated = ref(false)
const flying = ref<Side | null>(null)

let startX = 0

function onPointerDown(e: PointerEvent) {
  if (!props.interactive || flying.value) return
  dragging.value = true
  animated.value = false
  startX = e.clientX
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || flying.value) return
  dx.value = e.clientX - startX
  emit('drag', dx.value)
}

function onPointerUp() {
  if (!dragging.value || flying.value) return
  dragging.value = false
  animated.value = true
  if (Math.abs(dx.value) >= THRESHOLD) {
    fly(dx.value > 0 ? 'right' : 'left')
  } else {
    dx.value = 0
    emit('drag', 0)
  }
}

/** 向指定方向飞出（拖动松手或按钮/键盘触发） */
function fly(side: Side) {
  if (flying.value) return
  flying.value = side
  animated.value = true
  dx.value = (side === 'right' ? 1 : -1) * window.innerWidth * 1.2
  emit('drag', 0)
  window.setTimeout(() => emit('choose', side), 280)
}

const cardStyle = computed(() => ({
  transform: `translateX(${dx.value}px) translateY(${Math.abs(dx.value) * 0.06}px) rotate(${dx.value / 16}deg)`,
  transition: animated.value ? 'transform 0.32s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.32s ease' : 'none',
  opacity: flying.value ? 0 : 1,
}))

const leftOpacity = computed(() => (dx.value < 0 ? Math.min(1, -dx.value / 80) : 0))
const rightOpacity = computed(() => (dx.value > 0 ? Math.min(1, dx.value / 80) : 0))

defineExpose({ fly })
</script>

<template>
  <div
    class="game-card"
    :style="cardStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="stamp stamp-left" :style="{ opacity: leftOpacity }">{{ event.left.label }}</div>
    <div class="stamp stamp-right" :style="{ opacity: rightOpacity }">{{ event.right.label }}</div>

    <div class="avatar">{{ event.avatar }}</div>
    <h2 class="name">{{ event.name }}</h2>
    <div class="divider"><span>❦</span></div>
    <p class="text">{{ event.text }}</p>
    <div class="swipe-hint">◀ 左滑 · 右滑 ▶</div>
  </div>
</template>

<style scoped>
.game-card {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.25), transparent 60%),
    linear-gradient(160deg, #f2e7c9 0%, #e6d5ab 55%, #d9c290 100%);
  border: 1px solid #b49b6c;
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.55),
    inset 0 0 0 6px rgba(120, 90, 45, 0.08);
  padding: 26px 22px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #3a2c1c;
  touch-action: none;
  cursor: grab;
  will-change: transform;
  animation: deal-in 0.35s cubic-bezier(0.2, 0.8, 0.3, 1);
}

.game-card:active {
  cursor: grabbing;
}

@keyframes deal-in {
  from {
    transform: translateY(36px) scale(0.94) rotate(2deg);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1) rotate(0);
    opacity: 1;
  }
}

.avatar {
  font-size: 64px;
  line-height: 1;
  margin-top: 10px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
}

.name {
  margin-top: 12px;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 6px;
  text-indent: 6px;
}

.divider {
  margin: 10px 0 6px;
  width: 70%;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #8a6d3f;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #8a6d3f, transparent);
}

.text {
  font-size: 16px;
  line-height: 1.9;
  flex: 1;
  display: flex;
  align-items: center;
}

.swipe-hint {
  font-size: 12px;
  color: #8a6d3f;
  letter-spacing: 3px;
}

/* 决策印章：拖动时浮现 */
.stamp {
  position: absolute;
  top: 18px;
  padding: 6px 10px;
  border: 3px solid;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  opacity: 0;
  pointer-events: none;
}

.stamp-left {
  left: 16px;
  color: #b03a2e;
  border-color: #b03a2e;
  transform: rotate(-12deg);
}

.stamp-right {
  right: 16px;
  color: #1e7a46;
  border-color: #1e7a46;
  transform: rotate(12deg);
}
</style>

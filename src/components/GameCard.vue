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
let startY = 0

function onPointerDown(e: PointerEvent) {
  if (!props.interactive || flying.value) return
  dragging.value = true
  animated.value = false
  startX = e.clientX
  startY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function cancelDrag() {
  if (flying.value) return
  dragging.value = false
  animated.value = true
  dx.value = 0
  emit('drag', 0)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || flying.value) return
  const horizontal = e.clientX - startX
  const vertical = e.clientY - startY
  if (Math.abs(vertical) > 8 && Math.abs(vertical) > Math.abs(horizontal)) {
    cancelDrag()
    return
  }
  dx.value = horizontal
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

/** 正文首字作朱印下沉；以引号等标点起手的塘报不强做 */
const lead = computed(() => (/[\u4e00-\u9fff]/.test(props.event.text[0]) ? props.event.text[0] : ''))
const body = computed(() => (lead.value ? props.event.text.slice(1) : props.event.text))

defineExpose({ fly })
</script>

<template>
  <div
    class="game-card"
    :style="cardStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="cancelDrag"
  >
    <span class="band"></span>
    <span class="slip">提塘官敬述</span>

    <div class="stamp stamp-left inked" :style="{ opacity: leftOpacity }">{{ event.left.label }}</div>
    <div class="stamp stamp-right" :style="{ opacity: rightOpacity }">{{ event.right.label }}</div>

    <div class="ring-light">{{ event.avatar }}</div>
    <h2 class="name">{{ event.name }}</h2>
    <div class="rule"><span class="fleuron"></span></div>
    <p class="text" tabindex="0" aria-label="塘报正文，可上下滚动"><span class="body"><span v-if="lead" class="lead-char">{{ lead }}</span>{{ body }}</span></p>
    <div class="swipe-hint">◀ 左滑 ・ 右滑 ▶</div>
  </div>
</template>

<style scoped>
.game-card {
  position: absolute;
  inset: 0;
  padding: 30px 24px 46px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: safe center;
  text-align: center;
  color: var(--ink);
  border: 1.5px solid var(--line);
  border-radius: 4px;
  background:
    var(--grain),
    linear-gradient(168deg, var(--paper-hi) 0%, #f3e8d5 46%, #e7d6b6 100%);
  box-shadow:
    0 16px 34px rgba(41, 33, 26, 0.26),
    0 2px 0 rgba(255, 255, 255, 0.5) inset,
    0 0 0 1px rgba(171, 142, 95, 0.35) inset;
  overflow: hidden;
  touch-action: pan-y;
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

/* 版心：上沿回纹带 */
.band {
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  height: 12px;
  background: var(--meander) repeat-x;
  opacity: 0.42;
}

/* 右上题签 */
.slip {
  position: absolute;
  top: 22px;
  right: 14px;
  padding: 3px 6px;
  font-family: var(--font-kai);
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--ink-3);
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  background: rgba(255, 250, 240, 0.5);
}

.ring-light {
  margin-top: 16px;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  line-height: 1;
  border-radius: 50%;
  border: 1.5px solid var(--line);
  background:
    radial-gradient(circle at 50% 38%, rgba(168, 50, 42, 0.13), transparent 68%),
    rgba(255, 252, 244, 0.72);
  box-shadow: 0 0 0 4px rgba(171, 142, 95, 0.14), 0 3px 8px rgba(41, 33, 26, 0.12);
}

.name {
  margin-top: 14px;
  font-family: var(--font-kai);
  font-size: 27px;
  font-weight: 700;
  letter-spacing: 8px;
  text-indent: 8px;
  color: var(--ink);
}

/* 朱砂界行 */
.rule {
  margin: 9px 0 12px;
  width: 62%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule::before,
.rule::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
}

.fleuron {
  width: 7px;
  height: 7px;
  background: var(--cinnabar);
  transform: rotate(45deg);
  opacity: 0.85;
}

.text {
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  width: 100%;
  margin-top: 4px;
  padding: 16px 14px;
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  background: rgba(255, 251, 242, 0.42);
  box-shadow: inset 0 0 0 1px rgba(171, 142, 95, 0.16);
  font-size: 16px;
  line-height: 2.05;
  color: var(--ink-2);
}

.body {
  display: block;
  text-align: justify;
}

/* 首字朱印 */
.lead-char {
  float: left;
  margin: 5px 9px 0 0;
  padding: 3px 5px 4px;
  font-family: var(--font-kai);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--paper-hi);
  background: linear-gradient(150deg, var(--cinnabar-hi), #8d2620);
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(141, 38, 32, 0.35);
}

.swipe-hint {
  position: absolute;
  bottom: 18px;
  left: 0;
  right: 0;
  font-size: 11.5px;
  letter-spacing: 4px;
  color: var(--ink-3);
}

/* 批红双印：左用白文（朱底白字），右用朱文（白底朱字） */
.stamp {
  position: absolute;
  top: 26px;
  padding: 7px 9px;
  max-width: 128px;
  font-family: var(--font-kai);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.35;
  color: var(--cinnabar);
  background:
    var(--grain),
    linear-gradient(150deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.16));
  border: 2.5px solid var(--cinnabar);
  border-radius: 5px;
  opacity: 0;
  pointer-events: none;
}

.stamp.inked {
  color: var(--paper-hi);
  background:
    var(--grain),
    linear-gradient(150deg, var(--cinnabar-hi), var(--cinnabar) 62%, #8d2620);
  border-color: #8d2620;
}

.stamp-left {
  left: 14px;
  transform: rotate(-7deg);
}

.stamp-right {
  right: 14px;
  transform: rotate(7deg);
}

/* 矮屏压缩纵向节奏，保证最长塘报也落在版框内 */
@media (max-height: 720px) {
  .game-card {
    padding: 22px 20px 38px;
  }

  .ring-light {
    margin-top: 6px;
    width: 62px;
    height: 62px;
    font-size: 32px;
  }

  .name {
    margin-top: 10px;
    font-size: 23px;
  }

  .rule {
    margin: 6px 0 8px;
  }

  .text {
    padding: 11px 12px;
    font-size: 14.5px;
    line-height: 1.85;
  }

  .lead-char {
    margin-top: 3px;
    font-size: 20px;
  }

  .swipe-hint {
    bottom: 12px;
  }
}

.ring-light,
.name,
.rule {
  flex: none;
}

@media (max-height: 620px) {
  .game-card {
    padding: 28px 14px 32px;
  }

  .ring-light,
  .slip {
    display: none;
  }

  .name {
    margin-top: 0;
    font-size: 20px;
    letter-spacing: 3px;
    text-indent: 3px;
  }

  .rule {
    margin: 5px 0;
  }

  .text {
    padding: 8px 10px;
    font-size: 14px;
    line-height: 1.75;
  }
}
</style>

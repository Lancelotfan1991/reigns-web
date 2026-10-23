<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{ (e: 'enter'): void }>()

let timer: number | undefined
let entered = false

function enter() {
  if (entered) return
  entered = true
  if (timer !== undefined) window.clearTimeout(timer)
  emit('enter')
}

onMounted(() => {
  timer = window.setTimeout(enter, 3200)
})

onUnmounted(() => {
  if (timer !== undefined) window.clearTimeout(timer)
})
</script>

<template>
  <div
    class="epigraph"
    role="button"
    tabindex="0"
    aria-label="进入"
    @click="enter"
    @keydown.enter.prevent="enter"
    @keydown.space.prevent="enter"
  >
    <p>皇帝，是历史的囚徒。</p>
    <span class="cue" aria-hidden="true" />
  </div>
</template>

<style scoped>
.epigraph {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
  padding: 24px;
  background:
    var(--grain),
    radial-gradient(ellipse at 50% 46%, rgba(255, 252, 242, 0.94), rgba(236, 223, 198, 0.86) 58%, rgba(211, 189, 152, 0.6) 100%);
  cursor: pointer;
  outline: none;
}

.epigraph p {
  max-width: 760px;
  font-family: var(--font-kai);
  font-size: clamp(26px, 5vw, 44px);
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.9;
  text-align: center;
  color: var(--ink);
  text-wrap: balance;
  animation: ink-in 0.9s ease both;
}

.cue {
  width: 1px;
  height: 38px;
  background: var(--cinnabar);
  opacity: 0.7;
  animation: cue-pulse 2.4s ease-in-out infinite;
}

.epigraph:focus-visible .cue {
  height: 48px;
  opacity: 1;
}

@keyframes ink-in {
  from {
    opacity: 0;
    transform: translateY(8px);
    filter: blur(1.5px);
  }
}

@keyframes cue-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scaleY(0.8);
  }
  50% {
    opacity: 0.8;
    transform: scaleY(1);
  }
}

@media (max-width: 560px) {
  .epigraph {
    gap: 22px;
    padding: 20px;
  }

  .epigraph p {
    font-size: 28px;
    line-height: 2;
    letter-spacing: 0.06em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .epigraph p,
  .cue {
    animation: none;
  }
}
</style>

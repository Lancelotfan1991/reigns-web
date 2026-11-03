<script setup lang="ts">
import ReformTree from './ReformTree.vue'
import { navigate } from '../router'

function back() {
  navigate('/reforms')
}
</script>

<template>
  <div class="plan-page">
    <header class="plan-head">
      <button class="back" @click="back">← 改革页</button>
      <h1>改革树</h1>
    </header>

    <ReformTree />
  </div>
</template>

<style scoped>
.plan-page {
  min-height: 100dvh;
  max-width: 1240px;
  margin: 0 auto;
  padding: 18px clamp(10px, 2.5vw, 28px) 32px;
}

.plan-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.back {
  padding: 5px 10px;
  font: inherit;
  font-size: 12px;
  color: var(--ink-3);
  background: transparent;
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.back:hover,
.back:focus-visible {
  color: var(--cinnabar);
  border-color: var(--cinnabar);
}

h1 {
  font-family: var(--font-kai);
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 8px;
  color: var(--ink);
}
</style>

<script setup lang="ts">
import ReformTree from './ReformTree.vue'
import { navigate } from '../router'

function back() {
  navigate('/')
}
</script>

<template>
  <div class="reforms-page">
    <header class="reforms-header">
      <button class="back-btn" @click="back">← 回宫</button>
      <h1>改革</h1>
    </header>

    <ReformTree />
  </div>
</template>

<style scoped>
.reforms-page {
  min-height: 100dvh;
  max-width: 1240px;
  margin: 0 auto;
  padding: 18px clamp(10px, 2.5vw, 28px) 32px;
}

.reforms-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.back-btn {
  padding: 5px 10px;
  font-family: inherit;
  font-size: 12px;
  color: var(--ink-3);
  background: transparent;
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.back-btn:hover,
.back-btn:focus-visible {
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

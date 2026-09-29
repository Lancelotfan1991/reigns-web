<script setup lang="ts">
import { RESOURCE_META } from '../composables/useGame'
import type { Verdict } from '../types'

const props = defineProps<{ verdict: Verdict }>()

defineEmits<{ continue: [] }>()

function net(line: { from: number; to: number }) {
  const delta = line.to - line.from
  return delta > 0 ? `净 +${delta}` : `净 ${delta}`
}
</script>

<template>
  <section class="verdict-sheet" aria-label="本议批红">
    <span class="band"></span>
    <div class="head">
      <span class="tag">批红</span>
      <span class="when">{{ props.verdict.when }}</span>
    </div>
    <p v-if="props.verdict.chapter" class="chapter">
      连续篇章 · {{ props.verdict.chapter.name }} 第 {{ props.verdict.chapter.step }} / {{ props.verdict.chapter.total }} 步已定
    </p>

    <h2 class="name">{{ props.verdict.cardName }}</h2>
    <p class="seal inked chosen">{{ props.verdict.choiceLabel }}</p>
    <p class="response" tabindex="0" aria-label="批红正文，可上下滚动">{{ props.verdict.response }}</p>

    <ul v-if="props.verdict.lines.length" class="ledger">
      <li v-for="line in props.verdict.lines" :key="line.key">
        {{ RESOURCE_META[line.key].icon }} {{ RESOURCE_META[line.key].name }} {{ line.from }} → {{ line.to }}（{{ net(line) }}）
      </li>
    </ul>
    <p v-else-if="!props.verdict.ended" class="steady">本议国势未动。</p>

    <button class="continue" @click="$emit('continue')">{{ props.verdict.ended ? '看结局' : '知道了' }}</button>
  </section>
</template>

<style scoped>
/* 批红单页：与塘报同纸，但只读，不可滑动裁决 */
.verdict-sheet {
  position: absolute;
  inset: 0;
  padding: 26px 22px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  animation: verdict-in 0.26s ease;
}

@keyframes verdict-in {
  from {
    transform: translateY(14px);
    opacity: 0.4;
  }
}

.band {
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  height: 12px;
  background: var(--meander) repeat-x;
  opacity: 0.42;
}

.head {
  flex: none;
  margin-top: 8px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-kai);
  font-size: 13px;
  color: var(--ink-3);
}

.tag {
  flex: none;
  white-space: nowrap;
  padding: 2px 7px;
  font-size: 11.5px;
  letter-spacing: 2px;
  color: var(--cinnabar);
  border: 1px solid var(--cinnabar);
  border-radius: 2px;
}

.chapter {
  flex: none;
  margin-top: 6px;
  font-size: 12px;
  letter-spacing: 0.5px;
  color: var(--ink-3);
}

.name {
  flex: none;
  margin-top: 10px;
  font-family: var(--font-kai);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 5px;
  text-indent: 5px;
  color: var(--ink);
}

.chosen {
  flex: none;
  margin-top: 10px;
  padding: 6px 12px;
  max-width: 90%;
  font-size: 14.5px;
  line-height: 1.4;
}

.response {
  flex: 0 1 auto;
  min-height: 3.6em;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  width: 100%;
  margin-top: 12px;
  padding: 13px 13px;
  font-size: 15.5px;
  line-height: 2;
  text-align: justify;
  color: var(--ink-2);
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
}

.ledger {
  flex: none;
  width: 100%;
  margin-top: 12px;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(196px, 1fr));
  gap: 4px 10px;
}

.ledger li {
  padding: 3px 8px;
  font-size: 12.5px;
  text-align: left;
  color: var(--cinnabar);
  background: rgba(255, 251, 242, 0.5);
  border: 1px solid var(--line-soft);
  border-radius: 2px;
}

.steady {
  flex: none;
  margin-top: 12px;
  font-size: 12.5px;
  color: var(--ink-3);
}

.continue {
  flex: none;
  margin-top: auto;
  padding: 12px 26px;
  font-family: var(--font-kai);
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--paper-hi);
  background:
    var(--grain),
    linear-gradient(150deg, var(--cinnabar-hi), var(--cinnabar) 62%, #8d2620);
  border: 2px solid #8d2620;
  border-radius: 5px;
  cursor: pointer;
}

.continue:active {
  transform: translateY(1px);
}

@media (max-height: 720px) {
  .verdict-sheet {
    padding: 20px 18px 14px;
  }

  .head {
    margin-top: 2px;
  }

  .name {
    margin-top: 8px;
    font-size: 19px;
  }

  .chosen {
    margin-top: 8px;
    font-size: 13.5px;
  }

  .response {
    margin-top: 9px;
    padding: 10px 11px;
    font-size: 14.5px;
    line-height: 1.85;
  }

  .ledger {
    margin-top: 9px;
  }

  .ledger li {
    padding: 2px 6px;
    font-size: 12px;
  }

  .continue {
    padding: 10px 22px;
    font-size: 14.5px;
  }
}

@media (max-width: 360px) {
  .head {
    gap: 6px;
    font-size: 12px;
  }

  .tag {
    letter-spacing: 1px;
  }
}
</style>

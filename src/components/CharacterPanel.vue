<script setup lang="ts">
import { computed, ref } from 'vue'
import { RESOURCE_META, yearLabel } from '../composables/useGame'
import { STATUS_META } from '../data/characters'
import type { CharView, ResourceKey } from '../types'

const props = defineProps<{
  characters: CharView[]
  yearText: string
}>()

defineEmits<{ (e: 'close'): void }>()

type Filter = 'all' | ResourceKey

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'court', label: '皇权' },
  { key: 'people', label: '民心' },
  { key: 'army', label: '军心' },
  { key: 'gold', label: '国库' },
]

const filter = ref<Filter>('all')
const openId = ref<string | null>(null)

const byFilter = computed(() =>
  props.characters.filter((v) => filter.value === 'all' || v.char.faction === filter.value)
)
const appeared = computed(() => byFilter.value.filter((v) => v.appearYear !== null))
const pending = computed(() => byFilter.value.filter((v) => v.appearYear === null))

function countOf(key: Filter) {
  if (key === 'all') return props.characters.length
  return props.characters.filter((v) => v.char.faction === key).length
}

function toggle(id: string) {
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <section class="panel">
      <header class="ph">
        <div class="ph-titles">
          <h2>朝中人物</h2>
          <p>{{ yearText }} ・ 已登场 {{ appeared.length }} 人，未知 {{ pending.length }} 人</p>
        </div>
        <button class="close" aria-label="关闭" @click="$emit('close')">✕</button>
      </header>

      <nav class="filters">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          class="chip"
          :class="{ on: filter === f.key }"
          @click="filter = f.key"
        >
          {{ f.label }}<i>{{ countOf(f.key) }}</i>
        </button>
      </nav>

      <div class="list">
        <article
          v-for="v in appeared"
          :key="v.char.id"
          class="row"
          :class="{ open: openId === v.char.id }"
        >
          <button class="head" @click="toggle(v.char.id)">
            <span class="ava" :class="v.status">{{ v.char.avatar }}</span>
            <span class="who">
              <span class="nm">{{ v.char.name }}</span>
              <span v-if="v.char.alias" class="al">{{ v.char.alias }}</span>
            </span>
            <span class="meta">
              <span class="st" :style="{ color: STATUS_META[v.status].color }">
                {{ STATUS_META[v.status].label }}
              </span>
              <span v-if="v.age !== null" class="age">{{ v.age }} 岁</span>
            </span>
          </button>

          <p class="brief">
            <span class="camp">{{ v.char.camp }}</span>
            <span class="fac">
              {{ RESOURCE_META[v.char.faction].icon }} {{ RESOURCE_META[v.char.faction].name }}
            </span>
            <span class="role">{{ v.char.role }}</span>
          </p>

          <div v-if="openId === v.char.id" class="detail">
            <p v-if="v.note" class="note">{{ v.note }}</p>

            <div v-if="v.relations.length" class="block">
              <h3>关系</h3>
              <ul class="rels">
                <li v-for="(r, i) in v.relations" :key="i">
                  <span class="rl" :style="{ color: r.color }">{{ r.label }}</span>
                  <span class="rn">{{ r.target.name }}</span>
                </li>
              </ul>
            </div>

            <div v-if="v.deeds.length" class="block">
              <h3>已亲历之事</h3>
              <ul class="deeds">
                <li v-for="d in v.deeds" :key="d.eventId">
                  <span class="dy">{{ yearLabel(d.year) }}</span>
                  <span class="dt">{{ d.title }}</span>
                  <span class="dl" :class="d.side ?? 'todo'">{{ d.label }}</span>
                </li>
              </ul>
            </div>
          </div>
        </article>

        <div v-if="pending.length" class="sep">尚未登场</div>
        <article v-for="v in pending" :key="v.char.id" class="row dim">
          <div class="head">
            <span class="ava">❔</span>
            <span class="who">
              <span class="nm">{{ v.char.name }}</span>
              <span v-if="v.char.alias" class="al">{{ v.char.alias }}</span>
            </span>
            <span class="meta">
              <span class="st" :style="{ color: STATUS_META.hidden.color }">
                {{ STATUS_META.hidden.label }}
              </span>
            </span>
          </div>
          <p class="brief">
            <span class="camp">{{ v.char.camp }}</span>
            <span class="fac">
              {{ RESOURCE_META[v.char.faction].icon }} {{ RESOURCE_META[v.char.faction].name }}
            </span>
          </p>
        </article>

        <p class="foot">未发生之事不入此册。人事如何收场，取决于你每一次滑动。</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(66, 52, 34, 0.42);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
}

/* 一部名册：册页底色与装裱边 */
.panel {
  width: 100%;
  max-width: 460px;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top);
  background-color: #f4ead8;
  background-image: var(--grain);
  border-left: 1px solid var(--line);
  border-right: 1px solid var(--line);
  box-shadow: 0 0 34px rgba(41, 33, 26, 0.3);
  animation: rise 0.22s ease;
}

@keyframes rise {
  from {
    transform: translateY(18px);
    opacity: 0.4;
  }
}

.ph {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 10px;
  border-bottom: 1px solid var(--line-soft);
}

.ph-titles h2 {
  font-family: var(--font-kai);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 6px;
  color: var(--ink);
}

.ph-titles p {
  margin-top: 4px;
  font-size: 11.5px;
  color: var(--ink-3);
}

.close {
  flex: none;
  width: 32px;
  height: 32px;
  border: 1.5px solid var(--cinnabar);
  border-radius: 50%;
  background: rgba(255, 253, 248, 0.7);
  color: var(--cinnabar);
  font-size: 14px;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  overflow-x: auto;
  border-bottom: 1px solid var(--line-soft);
}

.chip {
  flex: none;
  padding: 4px 11px;
  font-family: var(--font-kai);
  font-size: 12.5px;
  letter-spacing: 1px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.7);
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  cursor: pointer;
}

.chip i {
  margin-left: 4px;
  font-style: normal;
  color: var(--ink-3);
}

.chip.on {
  color: var(--paper-hi);
  background: linear-gradient(150deg, var(--cinnabar-hi), #8d2620);
  border-color: #8d2620;
  font-weight: 700;
}

.chip.on i {
  color: rgba(251, 244, 230, 0.75);
}

.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 4px 18px calc(18px + env(safe-area-inset-bottom));
}

.row {
  border-bottom: 1px solid rgba(171, 142, 95, 0.28);
  padding: 10px 0;
}

.row.dim {
  opacity: 0.52;
}

.head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
}

.ava {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 252, 244, 0.8);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
}

.ava.dead {
  filter: grayscale(1);
  opacity: 0.66;
}

.ava.ill {
  border-color: var(--ochre);
}

.who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.nm {
  font-family: var(--font-kai);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--ink);
}

.al {
  font-size: 11.5px;
  color: var(--ink-3);
}

.meta {
  flex: none;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
}

.st {
  font-family: var(--font-kai);
  font-size: 13px;
  font-weight: 700;
}

.age {
  font-size: 11.5px;
  color: var(--ink-3);
}

.brief {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-top: 6px;
  padding-left: 44px;
  font-size: 12px;
  color: var(--ink-3);
}

.camp,
.fac {
  padding: 1px 7px;
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  background: rgba(255, 253, 248, 0.6);
  white-space: nowrap;
}

.role {
  flex: 1;
  min-width: 120px;
}

.detail {
  margin: 9px 0 2px 44px;
  padding: 10px 12px;
  background: rgba(168, 50, 42, 0.05);
  border: 1px dashed rgba(168, 50, 42, 0.3);
  border-radius: 3px;
}

.note {
  font-family: var(--font-kai);
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--ink-2);
}

.block + .block {
  margin-top: 12px;
}

.note + .block {
  margin-top: 12px;
}

.block h3 {
  font-size: 10.5px;
  letter-spacing: 4px;
  color: var(--cinnabar);
  margin-bottom: 6px;
}

.rels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
}

.rels li {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  background: rgba(255, 253, 248, 0.75);
  font-size: 12px;
}

.rl {
  font-family: var(--font-kai);
  font-weight: 700;
}

.rn {
  color: var(--ink-2);
}

.deeds {
  list-style: none;
}

.deeds li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  font-size: 12.5px;
  border-top: 1px dotted rgba(171, 142, 95, 0.5);
}

.deeds li:first-child {
  border-top: none;
}

.dy {
  flex: none;
  font-family: var(--font-kai);
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--cinnabar);
}

.dt {
  flex: none;
  color: var(--ink);
  font-weight: 700;
}

.dl {
  flex: 1;
  text-align: right;
  color: var(--ink-3);
}

.dl.left {
  color: var(--cinnabar);
}

.dl.right {
  color: var(--jade);
}

.dl.todo {
  color: var(--ink-3);
  font-style: italic;
}

.sep {
  margin: 18px 0 4px;
  font-family: var(--font-kai);
  font-size: 11.5px;
  letter-spacing: 5px;
  color: var(--ink-3);
  text-align: center;
}

.foot {
  margin: 18px 6px 0;
  font-size: 11.5px;
  line-height: 1.8;
  color: var(--ink-3);
  text-align: center;
}

/* 窄屏让五档筛选正好一行放平，避免末位被切 */
@media (max-width: 400px) {
  .filters {
    gap: 5px;
    padding: 10px 12px;
  }

  .chip {
    padding: 4px 9px;
    font-size: 12px;
  }
}
</style>

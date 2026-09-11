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
          <p>{{ yearText }} · 已登场 {{ appeared.length }} 人，未知 {{ pending.length }} 人</p>
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
  background: rgba(6, 4, 3, 0.72);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
}

.panel {
  width: 100%;
  max-width: 480px;
  height: 100dvh;
  background: #1b1613;
  border-left: 1px solid #3d2f20;
  border-right: 1px solid #3d2f20;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top);
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
  border-bottom: 1px solid #3d2f20;
}

.ph-titles h2 {
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 4px;
  color: #f0d9a0;
}

.ph-titles p {
  margin-top: 4px;
  font-size: 12px;
  color: #9a8465;
}

.close {
  flex: none;
  width: 34px;
  height: 34px;
  border: 1px solid #6b5436;
  border-radius: 50%;
  background: rgba(240, 217, 160, 0.06);
  color: #e3cf9f;
  font-size: 15px;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 7px;
  padding: 10px 18px;
  overflow-x: auto;
  border-bottom: 1px solid #2e2419;
}

.chip {
  flex: none;
  padding: 5px 11px;
  font-size: 12.5px;
  color: #b8a382;
  background: rgba(107, 84, 54, 0.16);
  border: 1px solid #4a3925;
  border-radius: 16px;
  cursor: pointer;
}

.chip i {
  margin-left: 4px;
  font-style: normal;
  opacity: 0.6;
}

.chip.on {
  color: #2a1f12;
  background: linear-gradient(160deg, #f0d9a0, #d3b26a);
  border-color: #d3b26a;
  font-weight: 700;
}

.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 6px 18px calc(18px + env(safe-area-inset-bottom));
}

.row {
  border-bottom: 1px solid #2e2419;
  padding: 10px 0;
}

.row.dim {
  opacity: 0.55;
}

.head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.ava {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(240, 217, 160, 0.07);
  border: 1px solid #4a3925;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
}

.ava.dead {
  filter: grayscale(1);
  opacity: 0.7;
}

.ava.ill {
  filter: saturate(0.6);
}

.who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.nm {
  font-size: 16px;
  font-weight: 700;
  color: #f0d9a0;
}

.al {
  font-size: 11.5px;
  color: #9a8465;
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
  font-size: 12.5px;
  font-weight: 700;
}

.age {
  font-size: 11.5px;
  color: #9a8465;
}

.brief {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-left: 46px;
  font-size: 12px;
  color: #a8916f;
}

.camp,
.fac {
  padding: 1px 7px;
  border: 1px solid #43331f;
  border-radius: 10px;
  background: rgba(107, 84, 54, 0.12);
  white-space: nowrap;
}

.role {
  flex: 1;
  min-width: 120px;
}

.detail {
  margin: 8px 0 2px 46px;
  padding: 10px 12px;
  background: rgba(240, 217, 160, 0.05);
  border: 1px dashed rgba(240, 217, 160, 0.22);
  border-radius: 10px;
}

.note {
  font-size: 13px;
  line-height: 1.8;
  color: #dcc79c;
}

.block + .block {
  margin-top: 12px;
}

.block h3 {
  font-size: 11px;
  letter-spacing: 3px;
  color: #8a755a;
  margin-bottom: 6px;
}

.rels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rels li {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  font-size: 12px;
}

.rl {
  font-weight: 700;
}

.rn {
  color: #cbb794;
}

.deeds li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  font-size: 12.5px;
  border-top: 1px dotted #34291c;
}

.deeds li:first-child {
  border-top: none;
}

.dy {
  flex: none;
  color: #8a755a;
  font-size: 11px;
}

.dt {
  flex: none;
  color: #e3cf9f;
  font-weight: 700;
}

.dl {
  flex: 1;
  text-align: right;
  color: #a8916f;
}

.dl.left {
  color: #e8a090;
}

.dl.right {
  color: #9fd8ae;
}

.dl.todo {
  color: #8a755a;
  font-style: italic;
}

.sep {
  margin: 16px 0 4px;
  font-size: 11px;
  letter-spacing: 4px;
  color: #7c6a52;
  text-align: center;
}

.foot {
  margin: 18px 6px 0;
  font-size: 11.5px;
  line-height: 1.8;
  color: #7c6a52;
  text-align: center;
}
</style>

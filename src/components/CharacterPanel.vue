<script setup lang="ts">
import { computed, ref } from 'vue'
import { RESOURCE_KEYS, RESOURCE_META } from '../composables/useGame'
import { ATTRIBUTE_META, STATUS_META } from '../data/characters'
import { portraitOf } from '../data/portraits'
import type { CharView, ResourceKey } from '../types'

const props = defineProps<{
  characters: CharView[]
  yearText: string
}>()

defineEmits<{ (e: 'select', view: CharView): void }>()

type Filter = 'all' | ResourceKey

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  ...RESOURCE_KEYS.map((key) => ({ key: key as Filter, label: RESOURCE_META[key].name })),
]

const filter = ref<Filter>('all')

const byFilter = computed(() =>
  props.characters.filter((v) => filter.value === 'all' || v.char.faction === filter.value)
)
const appeared = computed(() => byFilter.value.filter((v) => v.appearYear !== null))
const pending = computed(() => byFilter.value.filter((v) => v.appearYear === null))

function countOf(key: Filter) {
  if (key === 'all') return props.characters.length
  return props.characters.filter((v) => v.char.faction === key).length
}

function faceOf(id: string) {
  return portraitOf(id)?.sm
}
</script>

<template>
  <section class="panel">
    <header class="ph">
      <p class="ph-meta">
        {{ yearText }} ・ 共 {{ characters.length }} 人
      </p>
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
    </header>

    <div v-if="appeared.length" class="grid">
      <button
        v-for="v in appeared"
        :key="v.char.id"
        class="char-card"
        :aria-label="`查看${v.char.name}`"
        @click="$emit('select', v)"
      >
        <span class="portrait" :class="v.status">
          <img
            v-if="faceOf(v.char.id)"
            :src="faceOf(v.char.id)"
            :alt="v.char.name"
            loading="lazy"
          />
          <span v-else class="glyph">{{ v.char.avatar }}</span>
          <span
            class="stamp"
            :style="{ color: STATUS_META[v.status].color, borderColor: STATUS_META[v.status].color }"
          >
            {{ STATUS_META[v.status].label }}
          </span>
        </span>

        <span class="who">
          <span class="nm-line">
            <span class="nm">{{ v.char.name }}</span>
            <span v-if="v.age !== null" class="age">{{ v.age }} 岁</span>
          </span>
          <span v-if="v.char.alias" class="al">{{ v.char.alias }}</span>
        </span>

        <span class="meta">
          <span class="tag">{{ v.char.camp }}</span>
          <span class="tag fac">
            {{ RESOURCE_META[v.char.faction].icon }} {{ RESOURCE_META[v.char.faction].name }}
          </span>
        </span>

        <span class="stats">
          <span v-for="a in ATTRIBUTE_META" :key="a.key" class="stat" :title="a.hint">
            <span class="sl">{{ a.label }}</span>
            <span class="bar"><i :style="{ width: `${v.char.attributes[a.key]}%` }"></i></span>
            <span class="sv">{{ v.char.attributes[a.key] }}</span>
          </span>
        </span>
      </button>
    </div>

    <div v-if="pending.length" class="sep">尚未登场</div>
    <div v-if="pending.length" class="grid">
      <article v-for="v in pending" :key="v.char.id" class="char-card dim">
        <span class="portrait locked">
          <span class="glyph">❔</span>
        </span>
        <span class="who">
          <span class="nm-line">
            <span class="nm">{{ v.char.name }}</span>
          </span>
          <span v-if="v.char.alias" class="al">{{ v.char.alias }}</span>
        </span>
        <span class="meta">
          <span class="tag">{{ v.char.camp }}</span>
        </span>
        <span class="locked-note">尚未登场</span>
      </article>
    </div>

    <p class="foot">处境随编年与本局抉择推演，人事如何收场，取决于你每一次滑动。</p>
  </section>
</template>

<style scoped>
.panel {
  width: 100%;
}

.ph {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line-soft);
}

.ph-meta {
  font-size: 11.5px;
  color: var(--ink-3);
}

.filters {
  display: flex;
  gap: 6px;
  margin-top: 9px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding-top: 14px;
}

.char-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  padding: 7px 7px 9px;
  font: inherit;
  text-align: left;
  color: inherit;
  background: rgba(255, 252, 244, 0.74);
  border: 1px solid var(--line-soft);
  border-radius: 4px;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.char-card:hover,
.char-card:focus-visible {
  border-color: var(--cinnabar);
  box-shadow: 0 8px 18px rgba(41, 33, 26, 0.12);
  transform: translateY(-1px);
}

.portrait {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: rgba(255, 252, 244, 0.8);
}

.portrait img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portrait.死 img {
  filter: grayscale(1);
  opacity: 0.7;
}

.portrait.病 {
  border-color: var(--ochre);
}

.glyph {
  font-size: clamp(30px, 6vw, 44px);
}

.stamp {
  position: absolute;
  top: 5px;
  right: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 21px;
  height: 21px;
  padding: 0 4px;
  font-family: var(--font-kai);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  background: rgba(251, 246, 236, 0.9);
  border: 1px solid;
  border-radius: 2px;
}

.who {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-height: 35px;
  margin-top: 7px;
}

.nm-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.nm {
  font-family: var(--font-kai);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.25;
  color: var(--ink);
}

.age {
  flex: none;
  font-size: 10.5px;
  color: var(--ink-3);
}

.al {
  overflow: hidden;
  font-size: 11px;
  line-height: 1.35;
  color: var(--ink-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.tag {
  padding: 1px 6px;
  font-size: 10.5px;
  color: var(--ink-3);
  white-space: nowrap;
  background: rgba(255, 253, 248, 0.6);
  border: 1px solid var(--line-soft);
  border-radius: 2px;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 8px;
}

.stat {
  display: grid;
  grid-template-columns: 2.1em minmax(0, 1fr) 1.9em;
  align-items: center;
  gap: 5px;
}

.sl {
  font-family: var(--font-kai);
  font-size: 11px;
  color: var(--ink-3);
}

.bar {
  height: 5px;
  overflow: hidden;
  background: rgba(171, 142, 95, 0.22);
  border-radius: 1px;
}

.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #c1483d, var(--cinnabar));
  border-radius: 1px;
}

.sv {
  font-family: var(--font-kai);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
  text-align: right;
}

.char-card.dim {
  cursor: default;
  opacity: 0.55;
}

.char-card.dim:hover {
  border-color: var(--line-soft);
  box-shadow: none;
  transform: none;
}

/* 未登场者作卡背：压成 5:3，免得几十张空牌把名册拖成一条长卷 */
.portrait.locked {
  aspect-ratio: 5 / 3;
  border-style: dashed;
  background:
    repeating-linear-gradient(
      -45deg,
      rgba(171, 142, 95, 0.08) 0 6px,
      rgba(171, 142, 95, 0.02) 6px 12px
    ),
    rgba(255, 252, 244, 0.6);
}

.portrait.locked .glyph {
  font-size: clamp(24px, 4vw, 32px);
}

.locked-note {
  margin-top: 8px;
  padding-top: 8px;
  font-family: var(--font-kai);
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--ink-3);
  text-align: center;
  border-top: 1px dashed var(--line-soft);
}

.sep {
  margin: 24px 0 2px;
  font-family: var(--font-kai);
  font-size: 11.5px;
  letter-spacing: 5px;
  color: var(--ink-3);
  text-align: center;
}

.foot {
  margin: 22px 6px 0;
  font-size: 11.5px;
  line-height: 1.8;
  color: var(--ink-3);
  text-align: center;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
    padding-top: 12px;
  }

  .nm {
    font-size: 16px;
  }
}

/* 窄屏让五档筛选正好一行放平，避免末位被切 */
@media (max-width: 400px) {
  .filters {
    gap: 4px;
  }

  .chip {
    padding: 4px 7px;
    font-size: 11.5px;
    letter-spacing: 0;
  }
}
</style>

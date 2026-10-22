<script setup lang="ts">
import { RESOURCE_META, yearLabel } from '../composables/useGame'
import { STATUS_META } from '../data/characters'
import { portraitOf } from '../data/portraits'
import type { CharView } from '../types'
import AttributeRadar from './AttributeRadar.vue'

defineProps<{ view: CharView }>()

defineEmits<{ close: [] }>()

function faceOf(id: string) {
  return portraitOf(id)?.lg
}
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <section class="sheet">
      <button class="close" aria-label="关闭" @click="$emit('close')">✕</button>

      <div class="head-row">
        <span class="ava" :class="view.status">
          <img v-if="faceOf(view.char.id)" :src="faceOf(view.char.id)" :alt="view.char.name" />
          <template v-else>{{ view.char.avatar }}</template>
        </span>
        <div class="who">
          <h2>{{ view.char.name }}</h2>
          <p v-if="view.char.alias">{{ view.char.alias }}</p>
        </div>
        <span class="st" :style="{ color: STATUS_META[view.status].color }">
          {{ STATUS_META[view.status].label }}
        </span>
      </div>

      <div class="tags">
        <span class="camp">{{ view.char.camp }}</span>
        <span class="fac">
          {{ RESOURCE_META[view.char.faction].icon }} {{ RESOURCE_META[view.char.faction].name }}
        </span>
        <span v-if="view.age !== null" class="age">{{ view.age }} 岁</span>
      </div>

      <p class="role">{{ view.char.role }}</p>

      <div class="block">
        <h3>才具</h3>
        <AttributeRadar :attributes="view.char.attributes" variant="sheet" />
        <p class="stat-note">只作品鉴，不参与发牌与成败判定</p>
      </div>

      <div class="block duo">
        <div>
          <h3>所长</h3>
          <ul class="chips">
            <li v-for="item in view.char.expertise" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div>
          <h3>性情</h3>
          <ul class="chips">
            <li v-for="item in view.char.traits" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>

      <div class="block">
        <h3>小传</h3>
        <p class="bio">{{ view.char.bio }}</p>
      </div>

      <p v-if="view.note" class="note">{{ view.note }}</p>

      <div v-if="view.relations.length" class="block">
        <h3>关系</h3>
        <ul class="rels">
          <li v-for="(r, i) in view.relations" :key="i">
            <span class="rl" :style="{ color: r.color }">{{ r.label }}</span>
            <span class="rn">{{ r.target.name }}</span>
          </li>
        </ul>
      </div>

      <div v-if="view.deeds.length" class="block">
        <h3>已亲历之事</h3>
        <ul class="deeds">
          <li v-for="d in view.deeds" :key="d.eventId">
            <span class="dy">{{ yearLabel(d.year) }}</span>
            <span class="dt">{{ d.title }}</span>
            <span class="dl" :class="d.side ?? 'todo'">{{ d.label }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(66, 52, 34, 0.48);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  animation: fade-in 0.18s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
}

.sheet {
  position: relative;
  width: 100%;
  max-width: 360px;
  max-height: 80dvh;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 22px 20px 18px;
  border: 1.5px solid var(--line);
  border-radius: 4px;
  background:
    var(--grain),
    linear-gradient(168deg, var(--paper-hi) 0%, #f3e8d5 46%, #e7d6b6 100%);
  box-shadow:
    0 16px 34px rgba(41, 33, 26, 0.3),
    0 2px 0 rgba(255, 255, 255, 0.5) inset,
    0 0 0 1px rgba(171, 142, 95, 0.35) inset;
  animation: rise 0.22s ease;
}

@keyframes rise {
  from { transform: translateY(14px); opacity: 0.5; }
}

.close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--cinnabar);
  border-radius: 50%;
  background: rgba(255, 253, 248, 0.7);
  color: var(--cinnabar);
  font-size: 13px;
  cursor: pointer;
}

.head-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ava {
  flex: none;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 252, 244, 0.8);
  border: 1.5px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.ava img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ava.死 { filter: grayscale(1); opacity: 0.66; }
.ava.病 { border-color: var(--ochre); }

.who {
  flex: 1;
  min-width: 0;
}

.who h2 {
  font-family: var(--font-kai);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--ink);
}

.who p {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ink-3);
}

.st {
  flex: none;
  font-family: var(--font-kai);
  font-size: 15px;
  font-weight: 700;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--ink-3);
}

.camp, .fac {
  padding: 1px 7px;
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  background: rgba(255, 253, 248, 0.6);
  white-space: nowrap;
}

.age { white-space: nowrap; }

.role {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-2);
}

.note {
  margin-top: 10px;
  padding: 9px 11px;
  font-family: var(--font-kai);
  font-size: 14px;
  line-height: 1.85;
  color: var(--ink);
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
}

.bio {
  font-family: var(--font-kai);
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--ink-2);
}

.block {
  margin-top: 12px;
}

.block h3 {
  font-size: 10.5px;
  letter-spacing: 4px;
  color: var(--cinnabar);
  margin-bottom: 6px;
}

.stat-note {
  margin-top: 2px;
  font-size: 10.5px;
  color: var(--ink-3);
  text-align: right;
}

.duo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  list-style: none;
}

.chips li {
  padding: 2px 8px;
  font-family: var(--font-kai);
  font-size: 12px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.7);
  border: 1px solid var(--line-soft);
  border-radius: 2px;
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

.rl { font-family: var(--font-kai); font-weight: 700; }
.rn { color: var(--ink-2); }

.deeds { list-style: none; }

.deeds li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  font-size: 12.5px;
  border-top: 1px dotted rgba(171, 142, 95, 0.5);
}

.deeds li:first-child { border-top: none; }

.dy {
  flex: none;
  font-family: var(--font-kai);
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--cinnabar);
}

.dt { flex: none; color: var(--ink); font-weight: 700; }

.dl { flex: 1; text-align: right; color: var(--ink-3); }
.dl.左 { color: var(--cinnabar); }
.dl.右 { color: var(--jade); }
.dl.todo { color: var(--ink-3); font-style: italic; }
</style>

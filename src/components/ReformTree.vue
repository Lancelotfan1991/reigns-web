<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { REFORM_BROWSE_DATA, REFORM_CATEGORY_META } from '../data/reformBrowse'
import {
  REFORM_AGENDA,
  REFORM_BRANCHES,
  REFORM_ICONS,
  REFORM_LAYOUT,
  REFORM_TREE_PARENTS,
  requiresOf,
  type ReformAgendaItem,
} from '../data/reformTiers'
import { useEmperor } from '../composables/useEmperor'

interface StepView {
  title: string
  body?: string
  cost?: string
}

interface ChallengeView {
  title: string
  body?: string
  optionA?: string
  optionB?: string
}

interface Point {
  x: number
  y: number
}

const COMPLETED_KEY = 'reform-tree-completed'
const COL_WIDTH = 112
const ROW_HEIGHT = 94
const NODE_SIZE = 58
const NODE_RADIUS = NODE_SIZE / 2 + 1
const ROOT_RADIUS = 31
const CENTER_X = 500
const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 8 * ROW_HEIGHT + 80
const ROOT_POINT: Point = { x: CENTER_X, y: 30 }

const ROOT_IDS = new Set([
  'postal-cuts',
  'road-water',
  'agriculture',
  'abolish-artisan-registry',
  'calendar-bureau',
  'dismiss-palace-staff',
])

const emperor = useEmperor()
const prestige = computed(() => emperor.resources.prestige)
const selected = ref<ReformAgendaItem | null>(null)
const completed = ref<Set<string>>(new Set())
const existingById = new Map(REFORM_BROWSE_DATA.map((reform) => [reform.id, reform]))

const nodes = computed(() =>
  REFORM_AGENDA.map((item) => ({
    item,
    layout: REFORM_LAYOUT[item.id],
  })).filter((entry): entry is { item: ReformAgendaItem; layout: NonNullable<typeof entry.layout> } =>
    Boolean(entry.layout),
  ),
)

const branchColor = computed<Record<string, string>>(() =>
  Object.fromEntries(REFORM_BRANCHES.map((branch) => [branch.id, branch.color])),
)

function loadCompleted() {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(COMPLETED_KEY)
    if (raw) completed.value = new Set(JSON.parse(raw) as string[])
  } catch {
    completed.value = new Set()
  }
}

function saveCompleted() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed.value]))
  } catch {
    // 本地存储不可用时，只保留本次页面内的推演状态。
  }
}

function isDone(item: ReformAgendaItem): boolean {
  return completed.value.has(item.id)
}

function requiresDone(item: ReformAgendaItem): boolean {
  return requiresOf(item.id).every((id) => completed.value.has(id))
}

function available(item: ReformAgendaItem): boolean {
  return !isDone(item) && prestige.value >= item.prestige && requiresDone(item)
}

function statusOf(item: ReformAgendaItem): string {
  if (isDone(item)) return '已完成'
  if (prestige.value < item.prestige) return `需威望 ${item.prestige}`
  if (!requiresDone(item)) return '前置未完成'
  return '可推行'
}

function centerOf(item: ReformAgendaItem): Point {
  const layout = REFORM_LAYOUT[item.id]
  return {
    x: CENTER_X + layout.col * COL_WIDTH,
    y: layout.row * ROW_HEIGHT + NODE_SIZE / 2,
  }
}

function nodeStyle(item: ReformAgendaItem) {
  const layout = REFORM_LAYOUT[item.id]
  return {
    left: `${CENTER_X + layout.col * COL_WIDTH - NODE_SIZE / 2}px`,
    top: `${layout.row * ROW_HEIGHT}px`,
    width: `${NODE_SIZE}px`,
    height: `${NODE_SIZE}px`,
  }
}

function edgePath(from: Point, to: Point, fromRadius = NODE_RADIUS, toRadius = NODE_RADIUS): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy)
  if (distance === 0) return ''
  const ux = dx / distance
  const uy = dy / distance
  const startX = from.x + ux * fromRadius
  const startY = from.y + uy * fromRadius
  const endX = to.x - ux * toRadius
  const endY = to.y - uy * toRadius
  return `M ${startX} ${startY} L ${endX} ${endY}`
}

function iconOf(item: ReformAgendaItem): string {
  return REFORM_ICONS[item.id] ?? '📜'
}

const edges = computed(() => {
  const list: { id: string; d: string; state: string }[] = []
  const stateOf = (item: ReformAgendaItem) =>
    isDone(item) ? 'done' : available(item) ? 'open' : 'locked'

  for (const { item } of nodes.value) {
    if (!REFORM_LAYOUT[item.id]) continue
    const layout = REFORM_LAYOUT[item.id]
    const parents = REFORM_TREE_PARENTS[item.id] ?? []

    if (layout.row === 1 && ROOT_IDS.has(item.id)) {
      if (isDone(item) || available(item)) {
        list.push({
          id: `root-${item.id}`,
          d: edgePath(ROOT_POINT, centerOf(item), ROOT_RADIUS, NODE_RADIUS),
          state: stateOf(item),
        })
      }
    }

    for (const parentId of parents) {
      const parent = REFORM_AGENDA.find((entry) => entry.id === parentId)
      if (!parent || !REFORM_LAYOUT[parentId]) continue
      const parentLayout = REFORM_LAYOUT[parentId]
      // 所有前置路径都保留，让人能看出整棵树；
      // 锁定段用虚线，完成后再变成实线。
      // 只画相邻两格之间的短线；跨层前置改由节点上的“前置”文字说明。
      if (Math.abs(layout.col - parentLayout.col) > 1 || Math.abs(layout.row - parentLayout.row) > 1) {
        continue
      }
      list.push({
        id: `${parentId}-${item.id}`,
        d: edgePath(centerOf(parent), centerOf(item)),
        state: stateOf(item),
      })
    }
  }

  return list
})

function stepsOf(item: ReformAgendaItem): StepView[] {
  const reform = item.reformId ? existingById.get(item.reformId) : undefined
  if (reform) {
    return reform.cards
      .filter((card) => card.kind === 'step')
      .map((card) => ({
        title: card.title,
        body: card.body,
        cost: [
          card.costGold ? `${(card.costGold / 10000).toFixed(1)}万两` : '',
          card.costManpower ? `${card.costManpower}人` : '',
          card.duration ? `${card.duration}年` : '',
          card.successRate ? `成功率${card.successRate}%` : '',
        ].filter(Boolean).join(' · '),
      }))
  }
  return (item.steps ?? []).map((title) => ({ title }))
}

function challengesOf(item: ReformAgendaItem): ChallengeView[] {
  const reform = item.reformId ? existingById.get(item.reformId) : undefined
  if (reform) {
    return reform.cards
      .filter((card) => card.kind === 'challenge')
      .map((card) => ({
        title: card.title,
        body: card.body,
        optionA: card.optionA ? `${card.optionA.label}：${card.optionA.effect}` : undefined,
        optionB: card.optionB ? `${card.optionB.label}：${card.optionB.effect}` : undefined,
      }))
  }
  return (item.challenges ?? []).map((challenge) => {
    const [title, ...rest] = challenge.split('：')
    return { title, body: rest.join('：') }
  })
}

function open(item: ReformAgendaItem) {
  selected.value = item
}

function close() {
  selected.value = null
}

function completeSelected() {
  if (!selected.value || !available(selected.value)) return
  completed.value = new Set([...completed.value, selected.value.id])
  saveCompleted()
  selected.value = null
}

onMounted(loadCompleted)

const completedCount = computed(() => REFORM_AGENDA.filter((item) => isDone(item)).length)
</script>

<template>
  <div class="reform-tree">
    <div class="tree-status">
      <div>
        <span class="status-label">当前政治威望</span>
        <b>{{ prestige }}</b>
        <span class="status-sub">已完成 {{ completedCount }} / {{ REFORM_AGENDA.length }}</span>
      </div>
    </div>

    <div class="tree-scroll">
      <div class="tree-canvas" :style="{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }">
        <svg class="tree-edges" :viewBox="`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`" aria-hidden="true">
          <path v-for="edge in edges" :key="edge.id" :d="edge.d" :class="`edge-${edge.state}`" />
        </svg>

        <div class="root-node" title="崇祯新政：从中心点分出六条路线">
          <span class="root-mark">新</span>
          <span class="root-label">崇祯新政</span>
        </div>

        <button
          v-for="{ item, layout } in nodes"
          :key="item.id"
          :class="[
            'tree-node',
            {
              done: isDone(item),
              open: available(item),
              locked: !isDone(item) && !available(item),
              selected: selected?.id === item.id,
              merge: layout.row >= 6,
            },
          ]"
          :style="{
            ...nodeStyle(item),
            '--branch-color': branchColor[layout.branch] ?? '#8b7355',
          }"
          :title="`${item.name} · ${statusOf(item)}`"
          :aria-label="`${item.name}：${statusOf(item)}`"
          @click="open(item)"
        >
          <span class="node-icon" aria-hidden="true">{{ iconOf(item) }}</span>
          <span class="node-label">{{ item.name }}</span>
        </button>
      </div>
    </div>

    <div v-if="selected" class="detail-overlay" @click.self="close">
      <article class="detail-sheet">
        <header class="detail-head">
          <div>
            <span class="detail-category">
              {{ REFORM_CATEGORY_META[selected.category].icon }} {{ selected.category }} · 威望 {{ selected.prestige }}
            </span>
            <h2>{{ selected.name }}</h2>
          </div>
          <button class="detail-close" aria-label="关闭" @click="close">×</button>
        </header>

        <p class="detail-summary">{{ selected.summary }}</p>

        <section class="detail-section">
          <h3>三步</h3>
          <ol class="detail-steps">
            <li v-for="step in stepsOf(selected)" :key="step.title">
              <b>{{ step.title }}</b>
              <span v-if="step.cost" class="step-cost">{{ step.cost }}</span>
              <p v-if="step.body">{{ step.body }}</p>
            </li>
          </ol>
        </section>

        <section class="detail-section">
          <h3>挑战</h3>
          <div v-for="challenge in challengesOf(selected)" :key="challenge.title" class="challenge">
            <h4>{{ challenge.title }}</h4>
            <p v-if="challenge.body">{{ challenge.body }}</p>
            <p v-if="challenge.optionA" class="option">A · {{ challenge.optionA }}</p>
            <p v-if="challenge.optionB" class="option">B · {{ challenge.optionB }}</p>
          </div>
        </section>

        <div class="detail-meta">
          <p><b>预期效果</b>{{ selected.effect }}</p>
          <p><b>前置</b>{{ selected.prerequisite }}</p>
          <p v-if="selected.risk"><b>风险</b>{{ selected.risk }}</p>
        </div>

        <footer class="detail-actions">
          <span v-if="!available(selected)" class="detail-locked">{{ statusOf(selected) }}</span>
          <button v-else class="complete-btn" @click="completeSelected">推演：标记完成</button>
        </footer>
      </article>
    </div>
  </div>
</template>

<style scoped>
.reform-tree {
  min-width: 0;
}

.tree-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 14px;
  background: rgba(255, 253, 248, 0.6);
  border: 1px solid var(--line-soft);
  border-left: 3px solid var(--cinnabar);
  border-radius: 4px;
}

.status-label {
  font-size: 12px;
  color: var(--ink-3);
}

.tree-status b {
  margin-left: 8px;
  font-family: var(--font-kai);
  font-size: 23px;
  color: var(--cinnabar);
}

.status-sub {
  margin-left: 12px;
  font-size: 10px;
  color: var(--ink-3);
}

.legend {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  color: var(--ink-3);
}

.legend-item::before {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 4px;
  border-radius: 50%;
  background: currentColor;
}

.legend-item.done {
  color: var(--jade);
}

.legend-item.open {
  color: var(--cinnabar);
}

.legend-item.locked {
  color: #a3937b;
}

.reset {
  padding: 3px 7px;
  font-size: 10px;
  color: var(--ink-3);
  background: transparent;
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  cursor: pointer;
}

.tree-hint {
  margin: 8px 0 8px;
  font-size: 11px;
  color: var(--ink-3);
}

.branch-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-bottom: 10px;
  padding: 6px 10px;
  font-family: var(--font-kai);
  font-size: 12px;
  letter-spacing: 1px;
  background: rgba(255, 253, 248, 0.45);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
}

.tree-scroll {
  overflow-x: auto;
  padding: 4px 0 14px;
}

.merge-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 5px 7px;
  margin: 2px auto 4px;
  padding: 8px 10px;
  font-size: 10px;
  color: var(--ink-3);
  background: rgba(255, 253, 248, 0.55);
  border: 1px dashed var(--line-soft);
  border-radius: 3px;
}

.merge-label {
  font-family: var(--font-kai);
  font-size: 13px;
  color: var(--cinnabar);
}

.merge-source {
  padding: 2px 6px;
  background: rgba(168, 50, 42, 0.06);
  border: 1px solid rgba(168, 50, 42, 0.28);
  border-radius: 99px;
}

.merge-target {
  font-family: var(--font-kai);
  font-size: 12px;
  color: var(--ink-2);
}

.tree-canvas {
  position: relative;
  margin: 0 auto;
}

.tree-edges {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.tree-edges path {
  fill: none;
  stroke-width: 1.8;
  stroke-dasharray: none;
  stroke-linecap: round;
}

.tree-edges .edge-done {
  stroke: rgba(75, 122, 92, 0.8);
}

.tree-edges .edge-open {
  stroke: rgba(168, 50, 42, 0.66);
}

.tree-edges .edge-locked {
  stroke: rgba(122, 106, 85, 0.5);
  stroke-dasharray: 3 4;
}

.root-node {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  color: var(--paper-hi);
  background: var(--ink);
  border: 3px solid var(--ochre);
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 3px 10px rgba(41, 33, 26, 0.24);
}

.root-mark {
  font-family: var(--font-kai);
  font-size: 25px;
  line-height: 1;
}

.root-label {
  position: absolute;
  top: 64px;
  left: 50%;
  padding: 2px 6px;
  font-family: var(--font-kai);
  font-size: 11px;
  line-height: 1.4;
  color: var(--ink);
  white-space: nowrap;
  background: var(--paper-hi);
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  transform: translateX(-50%);
}

.tree-node {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--ink);
  background:
    var(--grain),
    var(--paper-hi);
  border: 2px solid var(--branch-color);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.tree-node:hover,
.tree-node:focus-visible,
.tree-node.selected {
  z-index: 8;
  transform: scale(1.1);
  box-shadow: 0 0 0 4px rgba(255, 253, 248, 0.7), 0 5px 14px rgba(41, 33, 26, 0.2);
  outline: none;
}

.tree-node.done {
  border-color: var(--jade);
  box-shadow: 0 0 0 3px rgba(75, 122, 92, 0.18);
}

.tree-node.open {
  border-color: var(--cinnabar);
  box-shadow: 0 0 0 3px rgba(168, 50, 42, 0.14);
}

.tree-node.locked {
  opacity: 0.48;
  filter: grayscale(0.75);
}

.tree-node.merge {
  border-color: var(--cinnabar);
  border-width: 3px;
}

.node-icon {
  font-size: 25px;
  line-height: 1;
  filter: saturate(0.9);
}

.node-label {
  position: absolute;
  top: calc(100% + 5px);
  left: 50%;
  z-index: 10;
  padding: 2px 6px;
  font-family: var(--font-kai);
  font-size: 11px;
  line-height: 1.4;
  color: var(--ink);
  white-space: nowrap;
  pointer-events: none;
  background: var(--paper-hi);
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  opacity: 0;
  transform: translateX(-50%);
  transition: opacity 0.12s ease;
}

.tree-node:hover .node-label,
.tree-node:focus-visible .node-label,
.tree-node.selected .node-label {
  opacity: 1;
}

.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(25, 20, 15, 0.58);
}

.detail-sheet {
  width: min(580px, 100%);
  max-height: min(86vh, 900px);
  overflow-y: auto;
  padding: 20px;
  background:
    var(--grain),
    var(--paper-hi);
  border: 1px solid var(--line);
  border-radius: 5px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line-soft);
}

.detail-category {
  font-size: 10px;
  color: var(--ink-3);
}

.detail-head h2 {
  margin-top: 5px;
  font-family: var(--font-kai);
  font-size: 27px;
  letter-spacing: 2px;
  color: var(--ink);
}

.detail-close {
  flex: none;
  width: 30px;
  height: 30px;
  font-size: 22px;
  line-height: 1;
  color: var(--ink-3);
  background: transparent;
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.detail-summary {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--ink-2);
}

.detail-section {
  margin-top: 16px;
}

.detail-section h3 {
  font-family: var(--font-kai);
  font-size: 18px;
  letter-spacing: 2px;
  color: var(--ink);
}

.detail-steps {
  margin-top: 6px;
  padding-left: 1.3em;
}

.detail-steps li {
  margin: 7px 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ink-2);
}

.detail-steps b {
  color: var(--ink);
}

.detail-steps p {
  margin-top: 2px;
  color: var(--ink-3);
}

.step-cost {
  margin-left: 7px;
  font-size: 10px;
  color: var(--cinnabar);
}

.challenge {
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(168, 50, 42, 0.05);
  border-left: 2px solid var(--cinnabar);
}

.challenge h4 {
  font-size: 13px;
  color: var(--ink);
}

.challenge p {
  margin-top: 3px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-3);
}

.challenge .option {
  color: var(--ink-2);
}

.detail-meta {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px dashed var(--line-soft);
}

.detail-meta p {
  margin: 5px 0;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--ink-3);
}

.detail-meta b {
  margin-right: 7px;
  color: var(--cinnabar);
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--line-soft);
}

.detail-locked {
  font-size: 11px;
  color: var(--ink-3);
}

.complete-btn {
  padding: 7px 14px;
  font-family: var(--font-kai);
  font-size: 13px;
  color: var(--paper-hi);
  background: var(--cinnabar);
  border: 1px solid var(--cinnabar);
  border-radius: 3px;
  cursor: pointer;
}

.complete-btn:hover {
  background: var(--cinnabar-hi);
}

@media (max-width: 760px) {
  .tree-status {
    align-items: flex-start;
    flex-direction: column;
  }

  .legend {
    flex-wrap: wrap;
  }

  .tree-scroll {
    margin: 0 -10px;
    padding: 4px 10px 14px;
  }

  .detail-overlay {
    padding: 10px;
  }

  .detail-sheet {
    padding: 15px;
  }
}
</style>

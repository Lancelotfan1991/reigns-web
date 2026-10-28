<script setup lang="ts">
import { computed, ref } from 'vue'
import { REFORM_BROWSE_DATA, REFORM_CATEGORY_META } from '../data/reformBrowse'
import {
  REFORM_AGENDA,
  REFORM_TIERS,
  agendaForTier,
  type ReformAgendaItem,
  type ReformTierKey,
  type ReformTierMeta,
} from '../data/reformTiers'
import { useEmperor } from '../composables/useEmperor'
import { navigate } from '../router'

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

const emperor = useEmperor()
const prestige = computed(() => emperor.resources.prestige)
const selectedTier = ref<'all' | ReformTierKey>('all')
const query = ref('')
const selected = ref<ReformAgendaItem | null>(null)

const existingById = new Map(REFORM_BROWSE_DATA.map((reform) => [reform.id, reform]))

const tierTabs = computed(() => [
  { key: 'all' as const, name: '全部', count: REFORM_AGENDA.length, color: '#7a6a55' },
  ...REFORM_TIERS.map((tier) => ({
    key: tier.key,
    name: tier.name,
    count: agendaForTier(tier.key).length,
    color: tier.color,
  })),
])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  let items = selectedTier.value === 'all'
    ? REFORM_AGENDA
    : agendaForTier(selectedTier.value)
  if (q) {
    items = items.filter((item) =>
      [item.name, item.summary, item.category, item.effect].join(' ').toLowerCase().includes(q),
    )
  }
  return items
})

const unlockedCount = computed(
  () => REFORM_AGENDA.filter((item) => prestige.value >= item.prestige).length,
)

function tierOf(item: ReformAgendaItem): ReformTierMeta {
  return REFORM_TIERS.find((tier) => tier.key === item.tier) ?? REFORM_TIERS[0]
}

function canOpen(item: ReformAgendaItem): boolean {
  return prestige.value >= item.prestige
}

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
    return {
      title,
      body: rest.join('：'),
    }
  })
}

function open(item: ReformAgendaItem) {
  if (!canOpen(item)) return
  selected.value = item
}

function close() {
  selected.value = null
}

function back() {
  navigate('/reforms')
}
</script>

<template>
  <div class="plan-page">
    <header class="plan-head">
      <button class="back" aria-label="返回改革页" @click="back">← 改革页</button>
      <div class="head-copy">
        <p class="kicker">崇祯十七年 · 御前会议</p>
        <h1>改革总案</h1>
        <p class="sub">威望解锁 · 步骤 · 挑战 · 后果</p>
      </div>
      <div class="seal inked" aria-hidden="true">
        <span>改</span>
        <span>革</span>
      </div>
    </header>

    <div class="status-line">
      <span>当前政治威望 <b>{{ prestige }}</b></span>
      <span>已解锁 {{ unlockedCount }} / {{ REFORM_AGENDA.length }} 项</span>
      <span class="status-hint">点开卡片，查看三步与挑战</span>
    </div>

    <div class="tier-tabs" role="tablist" aria-label="改革阶级">
      <button
        v-for="tab in tierTabs"
        :key="tab.key"
        :class="['tier-tab', { active: selectedTier === tab.key }]"
        :style="{ '--tier-color': tab.color }"
        @click="selectedTier = tab.key"
      >
        {{ tab.name }} <small>{{ tab.count }}</small>
      </button>
    </div>

    <div class="toolbar">
      <p v-if="selectedTier === 'all'" class="toolbar-note">
        从恢复国家运转，到改写国体。每一项都有成本、阻力和失败后果。
      </p>
      <p v-else class="toolbar-note">
        {{ REFORM_TIERS.find((tier) => tier.key === selectedTier)?.description }}
      </p>
      <input v-model="query" type="search" class="search" placeholder="搜索改革..." />
    </div>

    <div class="card-grid">
      <article
        v-for="item in filtered"
        :key="item.id"
        :class="['plan-card', { locked: !canOpen(item) }]"
        :style="{ '--accent': tierOf(item).color }"
        :title="canOpen(item) ? item.name : `需政治威望 ${item.prestige}`"
        @click="open(item)"
      >
        <header class="card-top">
          <span class="tier-badge">{{ tierOf(item).name }}</span>
          <span class="card-category">{{ REFORM_CATEGORY_META[item.category].icon }} {{ item.category }}</span>
          <span class="card-gate">{{ canOpen(item) ? '已解锁' : `需威望 ${item.prestige}` }}</span>
        </header>

        <h2>{{ item.name }}</h2>
        <p class="card-summary">{{ item.summary }}</p>

        <div class="step-chips">
          <span v-for="(step, index) in stepsOf(item).slice(0, 3)" :key="step.title">
            {{ index + 1 }}. {{ step.title }}
          </span>
        </div>

        <div class="card-bottom">
          <p class="card-effect">预期：{{ item.effect }}</p>
          <p v-if="item.risk" class="card-risk">风险：{{ item.risk }}</p>
        </div>

        <footer class="card-foot">
          <span>{{ canOpen(item) ? '打开卡片' : '威望不足' }}</span>
          <span class="arrow">→</span>
        </footer>
      </article>
    </div>

    <p v-if="filtered.length === 0" class="empty">没有找到匹配的改革。</p>

    <footer class="page-foot">
      <button class="back-reforms" @click="back">回到改革页</button>
    </footer>

    <div v-if="selected" class="detail-overlay" @click.self="close">
      <article class="detail-sheet">
        <header class="detail-head">
          <div>
            <span class="tier-badge" :style="{ color: tierOf(selected).color, borderColor: tierOf(selected).color }">
              {{ tierOf(selected).name }}
            </span>
            <span class="card-category">{{ REFORM_CATEGORY_META[selected.category].icon }} {{ selected.category }}</span>
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
      </article>
    </div>
  </div>
</template>

<style scoped>
.plan-page {
  min-height: 100dvh;
  max-width: 1180px;
  margin: 0 auto;
  padding: 22px clamp(12px, 3vw, 36px) 40px;
}

.plan-head {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-bottom: 16px;
  border-bottom: 1.5px solid var(--line);
}

.back {
  flex: none;
  align-self: flex-start;
  margin-top: 6px;
  padding: 6px 12px;
  font-size: 12.5px;
  letter-spacing: 1.5px;
  color: var(--ink-3);
  background: rgba(255, 253, 248, 0.6);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.back:hover,
.back:focus-visible {
  color: var(--cinnabar);
  border-color: var(--cinnabar);
}

.head-copy {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.kicker {
  font-family: var(--font-kai);
  font-size: 12px;
  letter-spacing: 4px;
  color: var(--cinnabar);
}

h1 {
  margin-top: 2px;
  font-family: var(--font-kai);
  font-size: clamp(30px, 5vw, 42px);
  font-weight: 700;
  letter-spacing: 12px;
  text-indent: 12px;
  color: var(--ink);
  line-height: 1.2;
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--ink-3);
}

.seal {
  flex: none;
  width: 62px;
  height: 62px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 0;
  font-size: 15px;
  line-height: 1.05;
  letter-spacing: 1px;
}

.status-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 18px;
  margin: 14px 0 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.55);
  border: 1px solid var(--line-soft);
  border-left: 3px solid var(--cinnabar);
  border-radius: 3px;
}

.status-line b {
  font-family: var(--font-kai);
  font-size: 22px;
  color: var(--cinnabar);
}

.status-hint {
  margin-left: auto;
  font-size: 11px;
  color: var(--ink-3);
}

.tier-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tier-tab {
  padding: 6px 12px;
  font-family: var(--font-kai);
  font-size: 14px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.55);
  border: 1px solid var(--line-soft);
  border-bottom: 3px solid transparent;
  border-radius: 3px;
  cursor: pointer;
}

.tier-tab small {
  margin-left: 3px;
  font-family: var(--font-serif);
  font-size: 10px;
  color: var(--ink-3);
}

.tier-tab.active {
  color: var(--tier-color);
  border-color: var(--tier-color);
  background: rgba(255, 253, 248, 0.92);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.toolbar-note {
  flex: 1;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
}

.search {
  flex: none;
  width: min(220px, 42vw);
  padding: 7px 10px;
  font-family: inherit;
  font-size: 12px;
  color: var(--ink);
  background: rgba(255, 253, 248, 0.7);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  outline: none;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 12px;
}

.plan-card {
  --accent: var(--cinnabar);
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 14px;
  background:
    var(--grain),
    rgba(255, 253, 248, 0.66);
  border: 1px solid var(--line-soft);
  border-top: 3px solid var(--accent);
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.plan-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(41, 33, 26, 0.12);
}

.plan-card.locked {
  opacity: 0.52;
  filter: grayscale(0.5);
  cursor: not-allowed;
}

.plan-card.locked:hover {
  transform: none;
  box-shadow: none;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  color: var(--ink-3);
}

.tier-badge {
  padding: 1px 6px;
  font-family: var(--font-kai);
  font-size: 11px;
  line-height: 1.5;
  color: var(--accent);
  border: 1px solid currentColor;
  border-radius: 3px;
}

.card-category {
  white-space: nowrap;
}

.card-gate {
  margin-left: auto;
  color: var(--ink-3);
  white-space: nowrap;
}

.plan-card h2 {
  margin-top: 7px;
  font-family: var(--font-kai);
  font-size: 21px;
  letter-spacing: 1px;
  color: var(--ink);
}

.card-summary {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ink-2);
}

.step-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 9px;
}

.step-chips span {
  padding: 2px 6px;
  font-size: 10px;
  color: var(--ink-3);
  background: rgba(41, 33, 26, 0.05);
  border-radius: 2px;
}

.card-bottom {
  flex: 1;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--line-soft);
}

.card-effect,
.card-risk {
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--ink-3);
}

.card-risk {
  margin-top: 3px;
  color: #8a5a43;
}

.card-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 9px;
  padding-top: 7px;
  font-size: 10px;
  color: var(--accent);
  border-top: 1px solid rgba(203, 175, 131, 0.45);
}

.arrow {
  font-size: 13px;
}

.empty {
  padding: 30px 10px;
  text-align: center;
  font-size: 13px;
  color: var(--ink-3);
}

.page-foot {
  margin-top: 28px;
  padding-top: 14px;
  text-align: center;
  border-top: 1px dashed var(--line-soft);
}

.back-reforms {
  padding: 7px 16px;
  font-family: var(--font-kai);
  font-size: 13px;
  color: var(--paper-hi);
  background: var(--cinnabar);
  border: 1px solid var(--cinnabar);
  border-radius: 3px;
  cursor: pointer;
}

.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
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

.detail-head h2 {
  margin-top: 6px;
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

@media (max-width: 760px) {
  .plan-page {
    padding: 14px 10px 28px;
  }

  .plan-head {
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 12px;
  }

  .back {
    order: 1;
    margin-top: 0;
  }

  .seal {
    order: 2;
    width: 48px;
    height: 48px;
    margin-left: auto;
    font-size: 12px;
  }

  .head-copy {
    order: 3;
    flex-basis: 100%;
    margin-top: 4px;
  }

  h1 {
    font-size: 32px;
    letter-spacing: 8px;
    text-indent: 8px;
  }

  .sub {
    letter-spacing: 1px;
  }

  .status-hint {
    margin-left: 0;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search {
    width: 100%;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .detail-overlay {
    padding: 10px;
  }

  .detail-sheet {
    padding: 15px;
  }
}
</style>

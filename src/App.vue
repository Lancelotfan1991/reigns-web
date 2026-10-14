<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import CharacterPanel from './components/CharacterPanel.vue'
import CharSheet from './components/CharSheet.vue'
import GameCard from './components/GameCard.vue'
import ResourceBadge from './components/ResourceBadge.vue'
import VerdictSheet from './components/VerdictSheet.vue'
import { useCharacters } from './composables/useCharacters'
import { useHint } from './composables/useHint'
import {
  AXIS_KEYS,
  RESOURCE_META,
  SOUTH_PEOPLE_LINE,
  UNREST_LINE,
  yearLabel,
  useGame,
} from './composables/useGame'
import { CharStatus, EndingKind, Side } from './types'
import type { ResourceKey } from './types'

type Screen = 'start' | 'play' | 'over'

const game = useGame()
const chars = useCharacters(game)
/** 上帝模式：只在本地加 ?god=1 时打开，正式玩家看不到任何痕迹 */
const GOD = new URLSearchParams(window.location.search).get('god') === '1'
/**
 * 卡牌图谱：本地加 ?atlas=1 时打开。DEV 常量在构建期折叠为 false，
 * 整个组件与动态 import 一并被摇树剥离，生产包不留任何入口。
 */
const CardAtlas = import.meta.env.DEV && new URLSearchParams(window.location.search).has('atlas')
  ? defineAsyncComponent(() => import('./components/CardAtlas.vue'))
  : null
const { advice, pending: advicePending } = useHint(game, GOD)
const screen = ref<Screen>('start')
const cardRef = ref<InstanceType<typeof GameCard> | null>(null)
const panelOpen = ref(false)
const sheetCharId = ref<string | null>(null)
const tipOpen = ref(false)

/** 已识别人物名：卡面正文中匹配到的名字高亮可点 */
const knownNames = computed(() =>
  chars.views.value
    .filter((v) => v.status !== CharStatus.Hidden)
    .map((v) => v.char.name),
)

const sheetView = computed(() => {
  if (!sheetCharId.value) return null
  return chars.views.value.find((v) => v.char.id === sheetCharId.value) ?? null
})

function onCharClick(name: string) {
  const view = chars.views.value.find(
    (v) => v.char.name === name && v.status !== CharStatus.Hidden,
  )
  if (view) sheetCharId.value = view.char.id
}

/** 当前拖拽位移，用于顶部资源图标联动提示 */
const dragDx = ref(0)
const dragSide = computed<Side | null>(() => {
  if (Math.abs(dragDx.value) < 12) return null
  return dragDx.value > 0 ? Side.Right : Side.Left
})
const hoverEffects = computed(() => (dragSide.value ? game.previewEffects(dragSide.value) : {}))

/** 宝玺印文：纪年分作两行钤刻 */
const sealLines = computed(() => {
  const label = yearLabel(game.year.value)
  return [label.slice(0, 2), label.slice(2)]
})
const adYear = computed(() => 1627 + Math.min(Math.max(game.year.value, 0), 17))

/** 国本民心：四象之外，唯一只看下限的轴 */
const PEOPLE_META = RESOURCE_META.people

function isActive(key: ResourceKey) {
  return key in hoverEffects.value
}

function start() {
  game.startGame()
  dragDx.value = 0
  panelOpen.value = false
  screen.value = 'play'
}

/** 刚裁决那一议的批红；非空时屏上只有这一页可看 */
const verdict = computed(() => game.verdict.value)

function onChoose(side: Side) {
  game.choose(side)
  dragDx.value = 0
  if (!verdict.value && game.isOver.value) screen.value = 'over'
}

/** 读完批红：国运已定就入结局，否则翻到下一问 */
function continueVerdict() {
  const ended = verdict.value?.ended ?? false
  game.dismissVerdict()
  if (ended) screen.value = 'over'
}

function onKey(e: KeyboardEvent) {
  if (tipOpen.value) {
    if (e.key === 'Escape') tipOpen.value = false
    return
  }
  if (sheetCharId.value) {
    if (e.key === 'Escape') sheetCharId.value = null
    return
  }
  if (panelOpen.value) {
    if (e.key === 'Escape') panelOpen.value = false
    return
  }
  if (screen.value !== 'play') return
  if (verdict.value) {
    if (['Enter', ' ', 'Spacebar', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      continueVerdict()
    }
    return
  }
  if (e.key === 'ArrowLeft') cardRef.value?.fly(Side.Left)
  if (e.key === 'ArrowRight') cardRef.value?.fly(Side.Right)
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="app">
    <!-- 卡牌图谱：?atlas=1 的本地开发页，占满全屏，不叠游戏三屏 -->
    <CardAtlas v-if="CardAtlas" />

    <!-- 开始界面 -->
    <section v-else-if="screen === 'start'" class="screen start-screen">
      <div class="brief">
        <div class="halo">👑</div>
        <h1 class="title">崇祯十七年</h1>
        <p class="subtitle">穿越明末 ・ 塘报挽天倾</p>
      </div>

      <div class="entry">
        <button class="btn seal inked" @click="start">入宫即位</button>
        <p v-if="game.bestYears.value > 0" class="best">前世最多撑了 {{ game.bestYears.value }} 年</p>
        <div class="entry-row">
          <button class="btn-ghost" @click="tipOpen = true">玩法说明</button>
          <button class="btn-ghost" @click="panelOpen = true">本朝人物</button>
        </div>
      </div>

      <!-- 玩法提示弹窗 -->
      <div v-if="tipOpen" class="overlay" @click.self="tipOpen = false">
        <div class="tip-card">
          <header class="tip-head">
            <h2>玩法说明</h2>
            <button class="tip-close" aria-label="关闭" @click="tipOpen = false">✕</button>
          </header>
          <div class="tip-body">
            <p>你是刚登基的崇祯帝朱由检。塘报按年递来：大事之年多议，平年略少，全依史事缓急。左右滑动或点击下方按钮定夺。</p>
            <p>朝局由四象撑着，过高与过低一样亡国：</p>
            <dl class="axis-list">
              <template v-for="key in AXIS_KEYS" :key="key">
                <dt :style="{ borderColor: RESOURCE_META[key].color }">
                  {{ RESOURCE_META[key].icon }} {{ RESOURCE_META[key].name }}
                </dt>
                <dd>{{ RESOURCE_META[key].hint }}</dd>
              </template>
            </dl>
            <p class="root-line">
              <b :style="{ color: PEOPLE_META.color }">{{ PEOPLE_META.icon }} 民心</b>
              越高越稳；低于 {{ UNREST_LINE }} 生动乱，归零亡国。
            </p>
            <p class="tip-warn">撑到崇祯十七年可图南渡，民心通常至少需 {{ SOUTH_PEOPLE_LINE }}。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 游戏界面 -->
    <section v-else-if="screen === 'play'" class="screen play-screen">
      <header class="hud">
        <ResourceBadge
          v-for="key in AXIS_KEYS.slice(0, 2)"
          :key="key"
          :icon="RESOURCE_META[key].icon"
          :name="RESOURCE_META[key].name"
          :color="RESOURCE_META[key].color"
          :value="game.resources.value[key]"
          :active="isActive(key)"
        />
        <div class="year">
          <div class="seal inked">
            <span>{{ sealLines[0] }}</span>
            <span>{{ sealLines[1] }}</span>
          </div>
          <span class="ad">西元 {{ adYear }}</span>
        </div>
        <ResourceBadge
          v-for="key in AXIS_KEYS.slice(2)"
          :key="key"
          :icon="RESOURCE_META[key].icon"
          :name="RESOURCE_META[key].name"
          :color="RESOURCE_META[key].color"
          :value="game.resources.value[key]"
          :active="isActive(key)"
        />
      </header>

      <p v-if="game.customsFunded.value || game.workshopsSupplied.value" class="ad">
        <span v-if="game.customsFunded.value">海税入公库：抵消国库岁耗</span>
        <span v-if="game.customsFunded.value && game.workshopsSupplied.value"> · </span>
        <span v-if="game.workshopsSupplied.value">工坊供械：抵消军心岁耗</span>
      </p>

      <div class="card-zone">
        <div class="stack-back back-2"></div>
        <div class="stack-back back-1"></div>
        <VerdictSheet v-if="verdict" :verdict="verdict" @continue="continueVerdict" />
        <GameCard
          v-else-if="game.currentCard.value"
          :key="game.currentCard.value.id"
          ref="cardRef"
          :event="game.currentCard.value"
          :interactive="true"
          :advice="advice"
          :advice-pending="advicePending"
          :known-names="knownNames"
          :chapter="game.chapter.value"
          @choose="onChoose"
          @drag="(v: number) => (dragDx = v)"
          @char-click="onCharClick"
        />
      </div>

      <footer v-if="game.currentCard.value && !verdict" class="actions">
        <button class="verdict-btn" :class="{ hinted: advice?.side === Side.Left }" @click="cardRef?.fly(Side.Left)">
          <span class="arrow">◀</span>{{ game.currentCard.value.left.label }}
        </button>
        <button class="verdict-btn" :class="{ hinted: advice?.side === Side.Right }" @click="cardRef?.fly(Side.Right)">
          {{ game.currentCard.value.right.label }}<span class="arrow">▶</span>
        </button>
      </footer>
    </section>

    <!-- 结局界面 -->
    <section v-else class="screen over-screen">
      <div class="halo">{{ game.ending.value?.avatar }}</div>
      <p class="verdict" :class="`verdict-${game.ending.value?.kind ?? EndingKind.Doom}`">
        {{ game.ending.value?.survived && game.ending.value.kind === EndingKind.Neutral ? '国运未定' : game.ending.value?.kind ?? EndingKind.Doom }}
      </p>
      <h2 class="over-title">{{ game.ending.value?.title }}</h2>
      <p class="over-desc">{{ game.ending.value?.description }}</p>

      <div class="over-stats">
        <div class="stat">
          <span class="stat-value">{{ game.reignedYears.value }}</span>
          <span class="stat-label">在位年数</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ game.bestYears.value }}</span>
          <span class="stat-label">最多撑过年数</span>
        </div>
      </div>

      <p v-if="game.reachedFinale.value" class="finale-badge">你走到了甲申终章</p>
      <p v-else-if="game.isNewRecord.value" class="new-record">比前世撑得更久！</p>

      <button class="btn seal inked" @click="start">再着龙袍</button>
      <button class="btn-ghost" @click="panelOpen = true">回看本朝人物</button>
    </section>

    <!-- 人物弹窗卡片：从卡面人名点入 -->
    <CharSheet
      v-if="sheetView"
      :view="sheetView"
      @close="sheetCharId = null"
    />

    <!-- 人物抽屉：三屏共用一个入口 -->
    <CharacterPanel
      v-if="panelOpen"
      :characters="chars.views.value"
      :year-text="game.yearText.value"
      @close="panelOpen = false"
    />
  </div>
</template>

<style scoped>
.app {
  position: relative;
  height: 100dvh;
  max-width: 460px;
  margin: 0 auto;
  padding: 0 20px calc(16px + env(safe-area-inset-bottom));
  padding-top: env(safe-area-inset-top);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 上下回纹装裱 */
.app::before,
.app::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 12px;
  background: var(--meander) repeat-x;
  opacity: 0.3;
  pointer-events: none;
}

.app::before {
  top: env(safe-area-inset-top);
}

.app::after {
  bottom: 4px;
  transform: scaleY(-1);
}

.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* ---------- 开始界面 ---------- */
.start-screen {
  align-items: center;
  justify-content: safe center;
}

/* 简介按内容取高，矮屏才自身滚动；印信常驻底部不被卷走 */
.brief {
  flex: 0 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  overflow-y: auto;
  text-align: center;
  padding-top: 10px;
}

.entry {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
}

.halo {
  width: 92px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 46px;
  border-radius: 50%;
  border: 1.5px solid var(--line);
  background:
    radial-gradient(circle at 50% 36%, rgba(168, 50, 42, 0.14), transparent 68%),
    rgba(255, 252, 244, 0.7);
  box-shadow: 0 0 0 5px rgba(171, 142, 95, 0.13), 0 4px 12px rgba(41, 33, 26, 0.12);
  animation: float 3.4s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.title {
  margin-top: 14px;
  font-family: var(--font-kai);
  font-size: clamp(32px, 11vw, 46px);
  font-weight: 700;
  letter-spacing: clamp(6px, 3vw, 16px);
  text-indent: clamp(6px, 3vw, 16px);
  color: var(--ink);
}

.subtitle {
  margin-top: 2px;
  font-family: var(--font-kai);
  color: var(--ink-3);
  letter-spacing: 4px;
  font-size: 13px;
}

.entry-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

/* ---------- 玩法提示弹窗 ---------- */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(66, 52, 34, 0.42);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tip-card {
  width: calc(100% - 40px);
  max-width: 380px;
  max-height: 80dvh;
  display: flex;
  flex-direction: column;
  border: 1.5px solid var(--line);
  border-radius: 4px;
  background:
    var(--grain),
    linear-gradient(168deg, var(--paper-hi) 0%, #f3e8d5 46%, #e7d6b6 100%);
  box-shadow: 0 16px 34px rgba(41, 33, 26, 0.26);
  animation: rise 0.22s ease;
}

@keyframes rise {
  from { transform: translateY(18px); opacity: 0.4; }
}

.tip-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--line-soft);
}

.tip-head h2 {
  font-family: var(--font-kai);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 5px;
  color: var(--ink);
}

.tip-close {
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--cinnabar);
  border-radius: 50%;
  background: rgba(255, 253, 248, 0.7);
  color: var(--cinnabar);
  font-size: 13px;
  cursor: pointer;
}

.tip-body {
  padding: 14px 16px 18px;
  overflow-y: auto;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--ink-2);
  text-align: justify;
}

.tip-body p + p {
  margin-top: 8px;
}

.tip-warn {
  color: var(--cinnabar);
  text-align: center;
}

.axis-list {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 4px 9px;
  margin: 10px 0 8px;
  text-align: left;
}

.axis-list dt {
  padding: 2px 0 2px 7px;
  font-family: var(--font-kai);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  white-space: nowrap;
  color: var(--ink);
  border-left: 3px solid;
  background: rgba(255, 253, 248, 0.72);
}

.axis-list dd {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--ink-3);
}

.root-line {
  margin-top: 2px;
  padding-top: 7px;
  border-top: 1px dashed var(--line-soft);
  font-size: 12.5px;
  text-align: left;
}

.root-line b {
  font-weight: 700;
  letter-spacing: 1px;
}

.best {
  margin-top: 12px;
  color: var(--ink-3);
  font-size: 13px;
}

.btn {
  margin-top: 8px;
  padding: 13px 40px;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 8px;
  text-indent: 8px;
  border-radius: 6px;
  box-shadow: 0 5px 16px rgba(141, 38, 32, 0.3);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.btn:active {
  transform: scale(0.96);
}

/* 次级入口：不与主批红印争视觉重心 */
.btn-ghost {
  margin-top: 12px;
  padding: 8px 20px;
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--ink-3);
  background: rgba(255, 253, 248, 0.55);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
}

.btn-ghost:active {
  color: var(--cinnabar);
  border-color: var(--cinnabar);
}

/* 矮屏（≤700px 高）：收冕缩印 */
@media (max-height: 700px) {
  .halo {
    width: 64px;
    height: 64px;
    font-size: 32px;
  }

  .title {
    margin-top: 8px;
  }

  .entry {
    padding-top: 6px;
  }

  .btn {
    margin-top: 4px;
    padding: 10px 40px;
  }

  .entry-row {
    margin-top: 8px;
  }
}

/* ---------- 游戏界面 ---------- */
.play-screen {
  gap: 8px;
  padding-top: 16px;
}

.hud,
.subhud,
.actions {
  flex: none;
}

/* 篇章常驻，不随塘报正文滚走；批红单页属于上一议，此时不显示 */

.hud {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  padding: 0 2px;
}

/* 纪年宝玺 */
.year {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-top: 2px;
}

.year .seal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  font-size: 15px;
  line-height: 1.25;
  letter-spacing: 1px;
}

.ad {
  font-size: 10.5px;
  letter-spacing: 1px;
  color: var(--ink-3);
}

.card-zone {
  position: relative;
  flex: 1;
  min-height: 0;
  margin: 4px 6px;
}

.stack-back {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  border: 1px solid var(--line-soft);
  background: linear-gradient(168deg, #f6ecd9, #e8d7b8);
  box-shadow: 0 8px 18px rgba(41, 33, 26, 0.14);
}

.back-1 {
  transform: translateY(7px) scale(0.968) rotate(1.3deg);
}

.back-2 {
  transform: translateY(13px) scale(0.938) rotate(-1.5deg);
}

.actions {
  display: flex;
  gap: 12px;
  padding: 4px 2px 2px;
}

/* 批红双印：左右同权重 */
.verdict-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 8px;
  font-family: var(--font-kai);
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--cinnabar);
  background:
    var(--grain),
    linear-gradient(150deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.15));
  border: 2px solid var(--cinnabar);
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.verdict-btn:active {
  transform: scale(0.97);
  background: rgba(168, 50, 42, 0.12);
}

/* god 模式推演所标的一侧（?god=1 才有） */
.verdict-btn.hinted {
  border-color: var(--ochre);
  box-shadow: 0 0 0 3px rgba(171, 132, 48, 0.16);
}

.verdict-btn.hinted::before {
  content: '宜';
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  font-size: 11px;
  text-indent: 0;
  color: var(--paper-hi);
  background: var(--ochre);
  border-radius: 3px;
}

.arrow {
  font-size: 11px;
  opacity: 0.7;
}

/* ---------- 结局界面 ---------- */
.over-screen {
  align-items: center;
  justify-content: safe center;
  overflow-y: auto;
  text-align: center;
  padding-top: 18px;
  animation: fade-in 0.5s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.over-screen .halo {
  flex: none;
  width: 84px;
  height: 84px;
  font-size: 42px;
  animation: none;
}

.verdict {
  margin-top: 16px;
  font-family: var(--font-kai);
  font-size: 14px;
  letter-spacing: 5px;
}

.verdict-国祚断送 {
  color: var(--cinnabar);
}

.verdict-宿命轮回 {
  color: var(--azure);
}

.verdict-续命中兴 {
  color: var(--ochre);
}

.finale-badge {
  margin-top: 10px;
  font-family: var(--font-kai);
  color: var(--ink-2);
  font-size: 13.5px;
  letter-spacing: 2px;
}

.new-record {
  margin-top: 10px;
  font-family: var(--font-kai);
  color: var(--cinnabar);
  font-size: 13.5px;
  letter-spacing: 2px;
  animation: pulse-text 1.1s ease infinite;
}

@keyframes pulse-text {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.over-title {
  margin-top: 10px;
  font-family: var(--font-kai);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 8px;
  text-indent: 8px;
  color: var(--ink);
}

.over-desc {
  margin: 16px 0 18px;
  padding: 14px 16px;
  width: 100%;
  max-width: 360px;
  font-size: 14.5px;
  line-height: 2;
  text-align: justify;
  color: var(--ink-2);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  background: rgba(255, 251, 242, 0.6);
  box-shadow: inset 0 0 0 1px rgba(171, 142, 95, 0.18);
}

.over-stats {
  display: flex;
  gap: 34px;
  margin: 0 0 6px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-family: var(--font-kai);
  font-size: 34px;
  font-weight: 700;
  color: var(--cinnabar);
}

.stat-label {
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 2px;
}

@media (max-height: 620px) {
  .play-screen {
    gap: 6px;
  }

  .chapter-tag {
    padding: 3px 8px;
    font-size: 11px;
  }

  .verdict-btn {
    font-size: 13px;
    padding: 8px 6px;
  }
}
</style>

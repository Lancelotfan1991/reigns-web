<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import CharacterPanel from './components/CharacterPanel.vue'
import GameCard from './components/GameCard.vue'
import ResourceBadge from './components/ResourceBadge.vue'
import { useCharacters } from './composables/useCharacters'
import { RESOURCE_KEYS, RESOURCE_META, yearLabel, useGame } from './composables/useGame'
import type { ResourceKey, Side } from './types'

type Screen = 'start' | 'play' | 'over'

const VERDICT_LABEL: Record<'doom' | 'neutral' | 'glory', string> = {
  doom: '国祚断送',
  neutral: '宿命轮回',
  glory: '续命中兴',
}

const game = useGame()
const chars = useCharacters(game)
const screen = ref<Screen>('start')
const cardRef = ref<InstanceType<typeof GameCard> | null>(null)
const panelOpen = ref(false)

/** 当前拖拽位移，用于顶部资源图标联动提示 */
const dragDx = ref(0)
const dragSide = computed<Side | null>(() => {
  if (Math.abs(dragDx.value) < 12) return null
  return dragDx.value > 0 ? 'right' : 'left'
})
const hoverEffects = computed(() => (dragSide.value ? game.previewEffects(dragSide.value) : {}))

/** 宝玺印文：纪年分作两行钤刻 */
const sealLines = computed(() => {
  const label = yearLabel(game.year.value)
  return [label.slice(0, 2), label.slice(2)]
})
const adYear = computed(() => 1627 + Math.min(Math.max(game.year.value, 0), 17))

function isActive(key: ResourceKey) {
  return key in hoverEffects.value
}

function start() {
  game.startGame()
  dragDx.value = 0
  panelOpen.value = false
  screen.value = 'play'
}

function onChoose(side: Side) {
  game.choose(side)
  dragDx.value = 0
  if (game.isOver.value) {
    screen.value = 'over'
  }
}

function onKey(e: KeyboardEvent) {
  if (panelOpen.value) {
    if (e.key === 'Escape') panelOpen.value = false
    return
  }
  if (screen.value !== 'play') return
  if (e.key === 'ArrowLeft') cardRef.value?.fly('left')
  if (e.key === 'ArrowRight') cardRef.value?.fly('right')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="app">
    <!-- 开始界面 -->
    <section v-if="screen === 'start'" class="screen start-screen">
      <div class="halo">👑</div>
      <h1 class="title">崇祯十七年</h1>
      <p class="subtitle">穿越明末 ・ 塘报挽天倾</p>

      <div class="memo">
        <p>你一觉醒来，成了刚刚登基的大明皇帝朱由检。</p>
        <p>内有党争、大旱、瘟疫、空虚的国库；外有建州铁骑、流亡驿卒。</p>
        <p>每一纸塘报递到御前，左右滑出批红，守这四大国势：</p>
        <div class="factions">
          <span v-for="key in RESOURCE_KEYS" :key="key" class="faction" :style="{ borderColor: RESOURCE_META[key].color }">
            {{ RESOURCE_META[key].icon }} {{ RESOURCE_META[key].name }}
          </span>
        </div>
        <p class="warning">任何一项归零或过极，国祚立崩；撑到崇祯十七年，甲申抉择终将由你亲手落下。</p>
      </div>

      <button class="btn seal inked" @click="start">入宫即位</button>
      <p v-if="game.bestYears.value > 0" class="best">前世最多撑了 {{ game.bestYears.value }} 年</p>
      <button class="btn-ghost" @click="panelOpen = true">先看看本朝人物</button>
    </section>

    <!-- 游戏界面 -->
    <section v-else-if="screen === 'play'" class="screen play-screen">
      <header class="hud">
        <ResourceBadge
          v-for="key in RESOURCE_KEYS.slice(0, 2)"
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
          v-for="key in RESOURCE_KEYS.slice(2)"
          :key="key"
          :icon="RESOURCE_META[key].icon"
          :name="RESOURCE_META[key].name"
          :color="RESOURCE_META[key].color"
          :value="game.resources.value[key]"
          :active="isActive(key)"
        />
      </header>

      <div class="subhud">
        <button class="people-btn" @click="panelOpen = true">
          朝中人物 <i>已识 {{ chars.appearedCount.value }} / {{ chars.views.value.length }}</i>
        </button>
      </div>

      <Transition name="toast">
        <div v-if="game.lastResponse.value" :key="game.currentCard.value?.id" class="toast">
          {{ game.lastResponse.value }}
        </div>
      </Transition>

      <div class="card-zone">
        <div class="stack-back back-2"></div>
        <div class="stack-back back-1"></div>
        <GameCard
          v-if="game.currentCard.value"
          :key="game.currentCard.value.id"
          ref="cardRef"
          :event="game.currentCard.value"
          :interactive="true"
          @choose="onChoose"
          @drag="(v: number) => (dragDx = v)"
        />
      </div>

      <footer v-if="game.currentCard.value" class="actions">
        <button class="verdict-btn" @click="cardRef?.fly('left')">
          <span class="arrow">◀</span>{{ game.currentCard.value.left.label }}
        </button>
        <button class="verdict-btn" @click="cardRef?.fly('right')">
          {{ game.currentCard.value.right.label }}<span class="arrow">▶</span>
        </button>
      </footer>
    </section>

    <!-- 结局界面 -->
    <section v-else class="screen over-screen">
      <div class="halo">{{ game.ending.value?.avatar }}</div>
      <p class="verdict" :class="`verdict-${game.ending.value?.kind ?? 'doom'}`">
        {{ VERDICT_LABEL[game.ending.value?.kind ?? 'doom'] }}
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
  overflow-y: auto;
  text-align: center;
  gap: 6px;
  padding-top: 18px;
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
  margin-top: 18px;
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

.memo {
  margin: 24px 0 20px;
  padding: 16px 18px;
  width: 100%;
  max-width: 380px;
  line-height: 2;
  text-align: justify;
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  background: rgba(255, 251, 242, 0.55);
  box-shadow: inset 0 0 0 1px rgba(171, 142, 95, 0.18);
}

.memo p {
  color: var(--ink-2);
  font-size: 14.5px;
}

.factions {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 14px 0 10px;
  flex-wrap: wrap;
}

.faction {
  padding: 3px 7px;
  border: 1px solid;
  border-radius: 2px;
  font-size: 12.5px;
  letter-spacing: 1px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.7);
}

.memo .warning {
  color: var(--cinnabar);
  font-size: 13px;
  text-align: center;
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
  margin-top: 16px;
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

/* ---------- 游戏界面 ---------- */
.play-screen {
  gap: 8px;
  padding-top: 16px;
}

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

.subhud {
  display: flex;
  justify-content: center;
}

.people-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 13px;
  font-family: var(--font-kai);
  font-size: 12.5px;
  letter-spacing: 1px;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.6);
  border: 1px solid var(--line-soft);
  border-radius: 2px;
  cursor: pointer;
}

.people-btn::before {
  content: '';
  width: 5px;
  height: 5px;
  background: var(--cinnabar);
  transform: rotate(45deg);
}

.people-btn i {
  font-style: normal;
  color: var(--ink-3);
}

.people-btn:active {
  border-color: var(--cinnabar);
}

/* 批红：上一手的结果 */
.toast {
  min-height: 42px;
  margin: 0 6px;
  padding: 7px 12px 7px 14px;
  font-family: var(--font-kai);
  font-size: 13px;
  line-height: 1.7;
  text-align: justify;
  color: var(--ink-2);
  background: rgba(168, 50, 42, 0.07);
  border-left: 3px solid var(--cinnabar);
}

.toast-enter-active {
  transition: all 0.4s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-8px);
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

.verdict-doom {
  color: var(--cinnabar);
}

.verdict-neutral {
  color: var(--azure);
}

.verdict-glory {
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
</style>

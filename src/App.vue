<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import GameCard from './components/GameCard.vue'
import ResourceBadge from './components/ResourceBadge.vue'
import { RESOURCE_KEYS, RESOURCE_META, useGame } from './composables/useGame'
import type { ResourceKey, Side } from './types'

type Screen = 'start' | 'play' | 'over'

const game = useGame()
const screen = ref<Screen>('start')
const cardRef = ref<InstanceType<typeof GameCard> | null>(null)

/** 当前拖拽位移，用于顶部资源图标联动提示 */
const dragDx = ref(0)
const dragSide = computed<Side | null>(() => {
  if (Math.abs(dragDx.value) < 12) return null
  return dragDx.value > 0 ? 'right' : 'left'
})
const hoverEffects = computed(() => (dragSide.value ? game.previewEffects(dragSide.value) : {}))

function isActive(key: ResourceKey) {
  return key in hoverEffects.value
}

function start() {
  game.startGame()
  dragDx.value = 0
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
      <div class="crown">👑</div>
      <h1 class="title">王权</h1>
      <p class="subtitle">REIGNS · 移动版</p>

      <div class="intro">
        <p>你是新登基的君主。</p>
        <p>左右滑动卡牌做出抉择，平衡四方势力：</p>
        <div class="factions">
          <span v-for="key in RESOURCE_KEYS" :key="key" class="faction">
            {{ RESOURCE_META[key].icon }} {{ RESOURCE_META[key].name }}
          </span>
        </div>
        <p class="warning">任何一项归零或拉满，你的统治都将终结。</p>
      </div>

      <button class="btn" @click="start">登基执政</button>
      <p v-if="game.bestYears.value > 0" class="best">最长统治：{{ game.bestYears.value }} 年</p>
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
          <span class="year-label">王历</span>
          <span class="year-value">第 {{ game.year.value }} 年</span>
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

      <Transition name="toast">
        <div v-if="game.lastResponse.value" :key="game.year.value" class="toast">
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
        <button class="action-btn left" @click="cardRef?.fly('left')">
          ← {{ game.currentCard.value.left.label }}
        </button>
        <button class="action-btn right" @click="cardRef?.fly('right')">
          {{ game.currentCard.value.right.label }} →
        </button>
      </footer>
    </section>

    <!-- 结局界面 -->
    <section v-else class="screen over-screen">
      <div class="skull">{{ game.ending.value?.avatar }}</div>
      <h2 class="over-title">{{ game.ending.value?.title }}</h2>
      <p class="over-desc">{{ game.ending.value?.description }}</p>

      <div class="over-stats">
        <div class="stat">
          <span class="stat-value">{{ game.year.value }}</span>
          <span class="stat-label">在位年数</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ game.bestYears.value }}</span>
          <span class="stat-label">最长纪录</span>
        </div>
      </div>

      <p v-if="game.isNewRecord.value" class="new-record">🎉 新纪录！</p>

      <button class="btn" @click="start">再登王位</button>
    </section>
  </div>
</template>

<style scoped>
.app {
  height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 20px calc(16px + env(safe-area-inset-bottom));
  padding-top: env(safe-area-inset-top);
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  justify-content: center;
  text-align: center;
  gap: 6px;
}

.crown {
  font-size: 72px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.title {
  font-size: 56px;
  font-weight: 900;
  letter-spacing: 20px;
  text-indent: 20px;
  color: #f0d9a0;
  text-shadow: 0 4px 18px rgba(240, 217, 160, 0.35);
}

.subtitle {
  color: #9a8465;
  letter-spacing: 4px;
  font-size: 13px;
}

.intro {
  margin: 26px 0;
  line-height: 2;
}

.intro p {
  color: #cbb794;
  font-size: 15px;
}

.factions {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin: 10px 0;
  flex-wrap: wrap;
}

.faction {
  padding: 4px 12px;
  border: 1px solid #6b5436;
  border-radius: 20px;
  font-size: 13px;
  color: #e3cf9f;
  background: rgba(107, 84, 54, 0.2);
}

.warning {
  color: #e08573;
  font-size: 13px;
}

.best {
  margin-top: 14px;
  color: #9a8465;
  font-size: 13px;
}

.btn {
  margin-top: 10px;
  padding: 14px 46px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 6px;
  text-indent: 6px;
  color: #2a1f12;
  background: linear-gradient(160deg, #f0d9a0, #d3b26a);
  border: none;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(211, 178, 106, 0.35);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.btn:active {
  transform: scale(0.96);
}

/* ---------- 游戏界面 ---------- */
.play-screen {
  gap: 10px;
}

.hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 4px 4px;
}

.year {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.3;
}

.year-label {
  font-size: 11px;
  color: #9a8465;
  letter-spacing: 4px;
}

.year-value {
  font-size: 17px;
  font-weight: 700;
  color: #f0d9a0;
}

.toast {
  min-height: 44px;
  margin: 0 8px;
  padding: 8px 14px;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
  color: #d9c49a;
  background: rgba(240, 217, 160, 0.08);
  border: 1px dashed rgba(240, 217, 160, 0.25);
  border-radius: 10px;
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
  border-radius: 18px;
  background: linear-gradient(160deg, #5c4a30, #453522);
  border: 1px solid #6b5436;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

.back-1 {
  transform: translateY(8px) scale(0.965) rotate(1.6deg);
}

.back-2 {
  transform: translateY(15px) scale(0.93) rotate(-1.8deg);
}

.actions {
  display: flex;
  gap: 12px;
  padding: 4px 4px 6px;
}

.action-btn {
  flex: 1;
  padding: 12px 8px;
  font-size: 14px;
  letter-spacing: 1px;
  color: #e3cf9f;
  background: rgba(240, 217, 160, 0.08);
  border: 1px solid #6b5436;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.action-btn:active {
  transform: scale(0.97);
  background: rgba(240, 217, 160, 0.16);
}

.action-btn.left {
  color: #e8a090;
}

.action-btn.right {
  color: #9fd8ae;
}

/* ---------- 结局界面 ---------- */
.over-screen {
  align-items: center;
  justify-content: center;
  text-align: center;
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

.skull {
  font-size: 64px;
}

.over-title {
  margin-top: 14px;
  font-size: 30px;
  font-weight: 900;
  letter-spacing: 6px;
  text-indent: 6px;
  color: #f0d9a0;
}

.over-desc {
  margin: 18px 12px;
  font-size: 15px;
  line-height: 2;
  color: #cbb794;
}

.over-stats {
  display: flex;
  gap: 44px;
  margin: 8px 0 4px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 34px;
  font-weight: 900;
  color: #f0d9a0;
}

.stat-label {
  font-size: 12px;
  color: #9a8465;
  letter-spacing: 2px;
}

.new-record {
  margin-top: 8px;
  color: #ffd66e;
  font-size: 14px;
  animation: pulse-text 1s ease infinite;
}

@keyframes pulse-text {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}
</style>

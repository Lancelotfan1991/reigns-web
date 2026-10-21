<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Reform } from '../data/reformBrowse'
import { REFORM_CATEGORY_META } from '../data/reformBrowse'

const props = defineProps<{
  reform: Reform
}>()

const emit = defineEmits<{
  close: []
}>()

const currentCardIndex = ref(0)

const currentCard = computed(() => props.reform.cards[currentCardIndex.value])

const hasPrevious = computed(() => currentCardIndex.value > 0)
const hasNext = computed(() => currentCardIndex.value < props.reform.cards.length - 1)

function previousCard() {
  if (hasPrevious.value) {
    currentCardIndex.value--
  }
}

function nextCard() {
  if (hasNext.value) {
    currentCardIndex.value++
  }
}

function close() {
  emit('close')
}

function formatGold(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  return value.toLocaleString()
}
</script>

<template>
  <div class="reform-detail-overlay" @click.self="close">
    <div class="reform-detail">
      <!-- 顶部标题栏 -->
      <header class="detail-header">
        <div class="header-left">
          <span class="detail-icon">{{ REFORM_CATEGORY_META[reform.category].icon }}</span>
          <div class="header-info">
            <h1 class="detail-title">{{ reform.name }}</h1>
            <div class="detail-meta">
              <span class="meta-tag">{{ reform.category }}</span>
              <span class="meta-tag">{{ reform.totalDuration }}年</span>
              <span class="meta-tag">{{ reform.cards.length }}张卡</span>
            </div>
          </div>
        </div>
        <button class="close-btn" @click="close" title="关闭">×</button>
      </header>

      <!-- 卡片滑动区域 -->
      <div class="card-container">
        <div class="card-wrapper">
          <!-- 步骤卡 -->
          <div v-if="currentCard.kind === 'step'" class="reform-card step-card">
            <div class="card-header">
              <div class="card-badge">步骤 {{ currentCardIndex + 1 }}</div>
              <h2 class="card-title">{{ currentCard.title }}</h2>
            </div>
            <p class="card-body">{{ currentCard.body }}</p>
            
            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-label">财力</span>
                <span class="stat-value">{{ formatGold(currentCard.costGold ?? 0) }}两</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">人力</span>
                <span class="stat-value">{{ (currentCard.costManpower ?? 0).toLocaleString() }}人</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">时间</span>
                <span class="stat-value">{{ currentCard.duration }}年</span>
              </div>
              <div class="stat-item highlight">
                <span class="stat-label">成功率</span>
                <span class="stat-value">{{ currentCard.successRate }}%</span>
              </div>
            </div>

            <div v-if="currentCard.boostConditions?.length" class="card-section">
              <h3 class="section-title">提升成功率</h3>
              <ul class="condition-list">
                <li v-for="condition in currentCard.boostConditions" :key="condition">
                  ✓ {{ condition }}
                </li>
              </ul>
            </div>

            <div v-if="currentCard.requiredRoles?.length" class="card-section">
              <h3 class="section-title">所需人员</h3>
              <div class="roles-list">
                <span v-for="role in currentCard.requiredRoles" :key="role" class="role-tag">
                  {{ role }}
                </span>
              </div>
            </div>
          </div>

          <!-- 挑战卡 -->
          <div v-else class="reform-card challenge-card">
            <div class="card-header">
              <div class="card-badge challenge">危机 {{ currentCardIndex + 1 }}</div>
              <h2 class="card-title">{{ currentCard.title }}</h2>
              <div class="severity-indicator">
                <span v-for="i in (currentCard.severity ?? 1)" :key="i" class="severity-dot"></span>
              </div>
            </div>
            <p class="card-body">{{ currentCard.body }}</p>

            <div v-if="currentCard.optionA || currentCard.optionB" class="card-section options">
              <div v-if="currentCard.optionA" class="option">
                <div class="option-header">
                  <span class="option-badge">甲</span>
                  <span class="option-label">{{ currentCard.optionA.label }}</span>
                </div>
                <p class="option-effect">{{ currentCard.optionA.effect }}</p>
              </div>
              <div v-if="currentCard.optionB" class="option">
                <div class="option-header">
                  <span class="option-badge">乙</span>
                  <span class="option-label">{{ currentCard.optionB.label }}</span>
                </div>
                <p class="option-effect">{{ currentCard.optionB.effect }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 导航按钮 -->
        <div class="card-navigation">
          <button
            class="nav-btn prev"
            :disabled="!hasPrevious"
            @click="previousCard"
          >
            ← 上一张
          </button>
          <div class="card-indicator">
            {{ currentCardIndex + 1 }} / {{ reform.cards.length }}
          </div>
          <button
            class="nav-btn next"
            :disabled="!hasNext"
            @click="nextCard"
          >
            下一张 →
          </button>
        </div>
      </div>

      <!-- 底部信息栏 -->
      <div class="detail-footer">
        <div class="footer-section">
          <h3 class="footer-title">前置条件</h3>
          <ul class="footer-list">
            <li v-for="prereq in reform.prerequisites" :key="prereq">• {{ prereq }}</li>
          </ul>
        </div>
        <div class="footer-section highlight">
          <h3 class="footer-title">预期收益</h3>
          <p class="footer-benefit">{{ reform.expectedBenefits }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reform-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(41, 33, 26, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

.reform-detail {
  width: 100%;
  max-width: 420px;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  background:
    var(--grain),
    linear-gradient(168deg, var(--paper-hi) 0%, #f3e8d5 46%, #e7d6b6 100%);
  border: 1.5px solid var(--line);
  border-radius: 6px;
  box-shadow: 0 16px 34px rgba(41, 33, 26, 0.4);
  overflow: hidden;
  animation: slide-up 0.25s ease;
}

@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0.6;
  }
}

/* 顶部标题栏 */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--line-soft);
  background: rgba(255, 253, 248, 0.5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.detail-icon {
  flex: none;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: var(--paper-hi);
  border: 1.5px solid var(--line);
  border-radius: 4px;
}

.header-info {
  min-width: 0;
  flex: 1;
}

.detail-title {
  margin: 0;
  font-family: var(--font-kai);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-meta {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.meta-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(171, 142, 95, 0.15);
  border-radius: 3px;
  color: var(--ink-3);
  letter-spacing: 0.5px;
}

.close-btn {
  flex: none;
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--cinnabar);
  border-radius: 50%;
  background: rgba(255, 253, 248, 0.7);
  color: var(--cinnabar);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--cinnabar);
  color: var(--paper-hi);
}

/* 卡片滑动区域 */
.card-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
}

.card-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

/* 改革卡片 */
.reform-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 253, 248, 0.7);
  border: 1.5px solid var(--line-soft);
  border-radius: 5px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(41, 33, 26, 0.1);
  animation: card-slide 0.3s ease;
  overflow-y: auto;
}

@keyframes card-slide {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.card-badge {
  flex: none;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--paper-hi);
  background: var(--ochre);
  border-radius: 3px;
}

.card-badge.challenge {
  background: var(--cinnabar);
}

.card-title {
  margin: 0;
  flex: 1;
  font-family: var(--font-kai);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--ink);
}

.severity-indicator {
  display: flex;
  gap: 3px;
}

.severity-dot {
  width: 6px;
  height: 6px;
  background: var(--cinnabar);
  border-radius: 50%;
}

.card-body {
  margin: 0 0 14px;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--ink-2);
  text-align: justify;
}

/* 步骤卡统计 */
.card-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: rgba(255, 253, 248, 0.6);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
}

.stat-item.highlight {
  background: rgba(171, 132, 48, 0.1);
  border-color: var(--ochre);
}

.stat-label {
  font-size: 10px;
  color: var(--ink-3);
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: var(--font-kai);
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.stat-item.highlight .stat-value {
  color: var(--ochre);
}

/* 卡片段落 */
.card-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-soft);
}

.section-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--ink-3);
}

.condition-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.condition-list li {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
}

.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-tag {
  padding: 4px 8px;
  font-size: 11px;
  background: rgba(171, 142, 95, 0.15);
  border-radius: 3px;
  color: var(--ink-2);
}

/* 挑战卡选项 */
.card-section.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option {
  padding: 10px;
  background: rgba(255, 253, 248, 0.6);
  border: 1px solid var(--line-soft);
  border-radius: 4px;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.option-badge {
  flex: none;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--paper-hi);
  background: var(--cinnabar);
  border-radius: 3px;
}

.option-label {
  font-family: var(--font-kai);
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.option-effect {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-2);
}

/* 导航按钮 */
.card-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--line-soft);
}

.nav-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--ink-3);
  background: rgba(255, 253, 248, 0.6);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-btn:hover:not(:disabled) {
  color: var(--cinnabar);
  border-color: var(--cinnabar);
  background: rgba(255, 253, 248, 0.9);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.card-indicator {
  flex: none;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 1px;
}

/* 底部信息栏 */
.detail-footer {
  padding: 14px 16px;
  border-top: 1px solid var(--line-soft);
  background: rgba(255, 253, 248, 0.5);
  display: flex;
  gap: 16px;
}

.footer-section {
  flex: 1;
  min-width: 0;
}

.footer-section.highlight {
  flex: none;
  width: 120px;
}

.footer-title {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--ink-3);
}

.footer-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.footer-list li {
  font-size: 11px;
  line-height: 1.4;
  color: var(--ink-2);
}

.footer-benefit {
  margin: 0;
  font-family: var(--font-kai);
  font-size: 13px;
  font-weight: 700;
  color: var(--ochre);
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 480px) {
  .reform-detail {
    max-width: 100%;
    max-height: 100dvh;
    border-radius: 0;
  }

  .reform-detail-overlay {
    padding: 0;
  }
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Reform, ReformStep } from '../data/reformBrowse'
import { REFORM_CATEGORY_META } from '../data/reformBrowse'

const props = defineProps<{
  reform: Reform
}>()

const emit = defineEmits<{
  close: []
}>()

const selectedStep = ref<number>(0)
const selectedPersonnel = ref<Map<string, string[]>>(new Map())

const currentStep = computed(() => props.reform.steps[selectedStep.value])

const totalCostGold = computed(() =>
  props.reform.steps.reduce((sum, step) => sum + step.costGold, 0),
)

const totalCostManpower = computed(() =>
  props.reform.steps.reduce((sum, step) => sum + step.costManpower, 0),
)

const avgSuccessRate = computed(() => {
  const sum = props.reform.steps.reduce((sum, step) => sum + step.successRate, 0)
  return Math.round(sum / props.reform.steps.length)
})

function selectStep(index: number) {
  selectedStep.value = index
}

function togglePersonnel(step: ReformStep, person: string) {
  const key = step.name
  const current = selectedPersonnel.value.get(key) ?? []
  if (current.includes(person)) {
    selectedPersonnel.value.set(key, current.filter((p) => p !== person))
  } else {
    selectedPersonnel.value.set(key, [...current, person])
  }
}

function isPersonnelSelected(step: ReformStep, person: string): boolean {
  const key = step.name
  return (selectedPersonnel.value.get(key) ?? []).includes(person)
}

function close() {
  emit('close')
}
</script>

<template>
  <div class="reform-detail-overlay" @click.self="close">
    <div class="reform-detail">
      <header class="detail-header">
        <div class="header-left">
          <span class="detail-icon">{{ REFORM_CATEGORY_META[reform.category].icon }}</span>
          <div>
            <h1 class="detail-title">{{ reform.name }}</h1>
            <div class="detail-meta">
              <span class="meta-tag">{{ reform.category }}</span>
              <span class="meta-tag">{{ reform.totalDuration }}年</span>
              <span class="meta-tag">成功率 {{ avgSuccessRate }}%</span>
            </div>
          </div>
        </div>
        <button class="close-btn" @click="close" title="关闭">×</button>
      </header>

      <div class="detail-content">
        <section class="detail-section">
          <h2>改革概述</h2>
          <p class="summary">{{ reform.summary }}</p>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">可能时间</span>
              <span class="info-value">{{ reform.possibleYears }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">提出人</span>
              <span class="info-value">{{ reform.proposers.join('、') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">总耗费</span>
              <span class="info-value">
                {{ totalCostGold.toLocaleString() }}两 / {{ totalCostManpower.toLocaleString() }}人
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">预期收益</span>
              <span class="info-value highlight">{{ reform.expectedBenefits }}</span>
            </div>
          </div>
        </section>

        <section class="detail-section">
          <h2>实施步骤</h2>
          <div class="steps-nav">
            <button
              v-for="(step, index) in reform.steps"
              :key="index"
              :class="['step-btn', { active: selectedStep === index }]"
              @click="selectStep(index)"
            >
              {{ index + 1 }}. {{ step.name }}
            </button>
          </div>

          <div v-if="currentStep" class="step-detail">
            <h3>{{ currentStep.name }}</h3>
            <p class="step-description">{{ currentStep.description }}</p>

            <div class="step-info">
              <div class="step-info-item">
                <span class="step-label">财力耗费</span>
                <span class="step-value">{{ currentStep.costGold.toLocaleString() }}两</span>
              </div>
              <div class="step-info-item">
                <span class="step-label">人力需求</span>
                <span class="step-value">{{ currentStep.costManpower.toLocaleString() }}人</span>
              </div>
              <div class="step-info-item">
                <span class="step-label">所需时间</span>
                <span class="step-value">{{ currentStep.duration }}年</span>
              </div>
              <div class="step-info-item">
                <span class="step-label">基础成功率</span>
                <span class="step-value success-rate">{{ currentStep.successRate }}%</span>
              </div>
            </div>

            <div class="step-section">
              <h4>提升成功率的条件</h4>
              <ul class="condition-list">
                <li v-for="(condition, index) in currentStep.boostConditions" :key="index">
                  ✓ {{ condition }}
                </li>
              </ul>
            </div>

            <div class="step-section">
              <h4>实施人员选择</h4>
              <p class="personnel-hint">点击选择负责此步骤的人员：</p>
              <div class="personnel-options">
                <button
                  v-for="role in currentStep.requiredRoles"
                  :key="role"
                  :class="['personnel-btn', { selected: isPersonnelSelected(currentStep, role) }]"
                  @click="togglePersonnel(currentStep, role)"
                >
                  {{ role }}
                </button>
              </div>
              <div v-if="selectedPersonnel.get(currentStep.name)?.length" class="selected-personnel">
                <span class="selected-label">已选择：</span>
                <span>{{ selectedPersonnel.get(currentStep.name)?.join('、') }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="detail-section">
          <h2>前置条件</h2>
          <ul class="prerequisite-list">
            <li v-for="(prereq, index) in reform.prerequisites" :key="index">
              • {{ prereq }}
            </li>
          </ul>
        </section>

        <section class="detail-section">
          <h2>深层挑战</h2>
          <ul class="challenge-list">
            <li v-for="(challenge, index) in reform.challenges" :key="index">
              ⚠ {{ challenge }}
            </li>
          </ul>
        </section>

        <section class="detail-section">
          <h2>失败风险</h2>
          <div class="failure-section">
            <div class="failure-item">
              <h4>失败触发条件</h4>
              <ul>
                <li v-for="(condition, index) in reform.failureConditions" :key="index">
                  ✗ {{ condition }}
                </li>
              </ul>
            </div>
            <div class="failure-item">
              <h4>失败后果</h4>
              <ul>
                <li v-for="(consequence, index) in reform.failureConsequences" :key="index">
                  → {{ consequence }}
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reform-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.reform-detail {
  background: #f5f1e8;
  border: 3px solid #8b7355;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 2px solid #8b7355;
  background: #e8dcc8;
  border-radius: 9px 9px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-icon {
  font-size: 48px;
}

.detail-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #3a2f23;
  font-weight: 600;
  font-family: 'Noto Serif SC', serif;
}

.detail-meta {
  display: flex;
  gap: 8px;
}

.meta-tag {
  padding: 4px 12px;
  background: #8b7355;
  color: #f5f1e8;
  border-radius: 4px;
  font-size: 13px;
}

.close-btn {
  width: 40px;
  height: 40px;
  background: #8b7355;
  color: #f5f1e8;
  border: none;
  border-radius: 50%;
  font-size: 28px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #6b5545;
}

.detail-content {
  padding: 24px;
}

.detail-section {
  margin-bottom: 32px;
}

.detail-section h2 {
  margin: 0 0 16px 0;
  font-size: 20px;
  color: #3a2f23;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #8b7355;
  font-family: 'Noto Serif SC', serif;
}

.summary {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: #5a4f43;
  line-height: 1.8;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  background: #e8dcc8;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #8b7355;
}

.info-label {
  display: block;
  font-size: 12px;
  color: #8b7355;
  margin-bottom: 4px;
  font-weight: 600;
}

.info-value {
  display: block;
  font-size: 14px;
  color: #3a2f23;
}

.info-value.highlight {
  color: #6b8e23;
  font-weight: 600;
}

.steps-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.step-btn {
  padding: 12px 16px;
  background: #e8dcc8;
  color: #3a2f23;
  border: 2px solid #8b7355;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  text-align: left;
  transition: all 0.2s;
}

.step-btn:hover {
  background: #d4c4a8;
}

.step-btn.active {
  background: #8b7355;
  color: #f5f1e8;
  border-color: #6b5545;
}

.step-detail {
  background: #e8dcc8;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #8b7355;
}

.step-detail h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #3a2f23;
  font-weight: 600;
}

.step-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #5a4f43;
  line-height: 1.6;
}

.step-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.step-info-item {
  background: #f5f1e8;
  padding: 10px;
  border-radius: 4px;
}

.step-label {
  display: block;
  font-size: 11px;
  color: #8b7355;
  margin-bottom: 4px;
  font-weight: 600;
}

.step-value {
  display: block;
  font-size: 14px;
  color: #3a2f23;
  font-weight: 600;
}

.step-value.success-rate {
  color: #6b8e23;
}

.step-section {
  margin-bottom: 20px;
}

.step-section h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #3a2f23;
  font-weight: 600;
}

.condition-list,
.prerequisite-list,
.challenge-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.condition-list li,
.prerequisite-list li,
.challenge-list li {
  margin-bottom: 8px;
  font-size: 14px;
  color: #5a4f43;
  line-height: 1.6;
}

.personnel-hint {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #8b7355;
}

.personnel-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.personnel-btn {
  padding: 8px 16px;
  background: #f5f1e8;
  color: #3a2f23;
  border: 2px solid #8b7355;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
}

.personnel-btn:hover {
  background: #e8dcc8;
}

.personnel-btn.selected {
  background: #6b8e23;
  color: #f5f1e8;
  border-color: #5a7d1a;
}

.selected-personnel {
  padding: 10px;
  background: #f5f1e8;
  border-radius: 4px;
  font-size: 13px;
}

.selected-label {
  font-weight: 600;
  color: #3a2f23;
  margin-right: 8px;
}

.failure-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.failure-item {
  background: #e8dcc8;
  padding: 16px;
  border-radius: 6px;
  border-left: 3px solid #8b4513;
}

.failure-item h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #3a2f23;
  font-weight: 600;
}

.failure-item ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.failure-item li {
  margin-bottom: 8px;
  font-size: 14px;
  color: #5a4f43;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .reform-detail-overlay {
    padding: 10px;
  }

  .detail-header {
    padding: 16px;
  }

  .detail-icon {
    font-size: 36px;
  }

  .detail-title {
    font-size: 22px;
  }

  .detail-content {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .step-info {
    grid-template-columns: repeat(2, 1fr);
  }

  .failure-section {
    grid-template-columns: 1fr;
  }
}
</style>

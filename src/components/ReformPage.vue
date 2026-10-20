<script setup lang="ts">
import { computed, ref } from 'vue'
import { REFORM_BROWSE_DATA, REFORM_CATEGORY_META, type Reform } from '../data/reformBrowse'
import { navigate } from '../router'
import ReformDetail from './ReformDetail.vue'

const selectedCategory = ref<string>('all')
const query = ref('')
const selectedReform = ref<Reform | null>(null)

const normalizedQuery = computed(() => query.value.trim().toLowerCase())

const categories = computed(() => {
  const counts = new Map<string, number>()
  for (const reform of REFORM_BROWSE_DATA) {
    counts.set(reform.category, (counts.get(reform.category) ?? 0) + 1)
  }
  return [...counts.entries()].map(([category, count]) => ({
    category,
    count,
    meta: REFORM_CATEGORY_META[category as keyof typeof REFORM_CATEGORY_META],
  }))
})

const filtered = computed(() => {
  const q = normalizedQuery.value
  return REFORM_BROWSE_DATA.filter((reform) => {
    if (selectedCategory.value !== 'all' && reform.category !== selectedCategory.value) return false
    if (!q) return true
    const haystack = [
      reform.name,
      reform.summary,
      reform.proposers.join(' '),
      reform.possibleYears,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

function select(reform: Reform) {
  selectedReform.value = reform
}

function close() {
  selectedReform.value = null
}

function back() {
  navigate('/')
}
</script>

<template>
  <div class="reforms-page">
    <header class="reforms-header">
      <button class="back-btn" @click="back" title="返回首页">← 回宫</button>
      <h1>崇祯朝改革方案</h1>
      <div class="header-spacer" />
    </header>

    <div class="filters">
      <div class="category-filters">
        <button
          :class="['category-btn', { active: selectedCategory === 'all' }]"
          @click="selectedCategory = 'all'"
        >
          全部 ({{ REFORM_BROWSE_DATA.length }})
        </button>
        <button
          v-for="cat in categories"
          :key="cat.category"
          :class="['category-btn', { active: selectedCategory === cat.category }]"
          @click="selectedCategory = cat.category"
        >
          {{ cat.meta.icon }} {{ cat.meta.name }} ({{ cat.count }})
        </button>
      </div>
      <input
        v-model="query"
        type="search"
        class="search-input"
        placeholder="搜索改革名称、内容、人物..."
      />
    </div>

    <div class="reforms-grid">
      <div
        v-for="reform in filtered"
        :key="reform.id"
        class="reform-card"
        @click="select(reform)"
      >
        <div class="reform-header">
          <span class="reform-icon">{{ REFORM_CATEGORY_META[reform.category].icon }}</span>
          <h2 class="reform-name">{{ reform.name }}</h2>
        </div>
        <div class="reform-meta">
          <span class="reform-category">{{ reform.category }}</span>
          <span class="reform-duration">{{ reform.totalDuration }}年</span>
        </div>
        <p class="reform-summary">{{ reform.summary }}</p>
        <div class="reform-proposers">
          <span class="label">提出人：</span>
          <span>{{ reform.proposers.join('、') }}</span>
        </div>
        <div class="reform-years">
          <span class="label">可能时间：</span>
          <span>{{ reform.possibleYears }}</span>
        </div>
        <div class="reform-benefits">
          <span class="label">预期收益：</span>
          <span>{{ reform.expectedBenefits }}</span>
        </div>
      </div>
    </div>

    <div v-if="filtered.length === 0" class="empty-state">
      <p>未找到符合条件的改革方案</p>
    </div>

    <ReformDetail v-if="selectedReform" :reform="selectedReform" @close="close" />
  </div>
</template>

<style scoped>
.reforms-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f1e8 0%, #e8dcc8 100%);
  padding: 20px;
  font-family: 'Noto Serif SC', serif;
}

.reforms-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #8b7355;
}

.back-btn {
  padding: 8px 16px;
  background: #8b7355;
  color: #f5f1e8;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #6b5545;
}

.reforms-header h1 {
  margin: 0;
  font-size: 28px;
  color: #3a2f23;
  font-weight: 600;
}

.header-spacer {
  flex: 1;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-btn {
  padding: 8px 16px;
  background: #e8dcc8;
  color: #3a2f23;
  border: 2px solid #8b7355;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.category-btn:hover {
  background: #d4c4a8;
}

.category-btn.active {
  background: #8b7355;
  color: #f5f1e8;
}

.search-input {
  padding: 10px 16px;
  border: 2px solid #8b7355;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  background: #f5f1e8;
  color: #3a2f23;
}

.search-input::placeholder {
  color: #8b7355;
}

.reforms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.reform-card {
  background: #f5f1e8;
  border: 2px solid #8b7355;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reform-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #6b5545;
}

.reform-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.reform-icon {
  font-size: 32px;
}

.reform-name {
  margin: 0;
  font-size: 20px;
  color: #3a2f23;
  font-weight: 600;
}

.reform-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
}

.reform-category {
  padding: 2px 8px;
  background: #8b7355;
  color: #f5f1e8;
  border-radius: 3px;
}

.reform-duration {
  padding: 2px 8px;
  background: #6b8e23;
  color: #f5f1e8;
  border-radius: 3px;
}

.reform-summary {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #5a4f43;
  line-height: 1.6;
}

.reform-proposers,
.reform-years,
.reform-benefits {
  margin-bottom: 8px;
  font-size: 13px;
  color: #6b5545;
}

.reform-proposers .label,
.reform-years .label,
.reform-benefits .label {
  font-weight: 600;
  color: #3a2f23;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8b7355;
  font-size: 16px;
}

@media (max-width: 768px) {
  .reforms-page {
    padding: 12px;
  }

  .reforms-header h1 {
    font-size: 22px;
  }

  .reforms-grid {
    grid-template-columns: 1fr;
  }

  .category-filters {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 8px;
  }

  .category-btn {
    white-space: nowrap;
  }
}
</style>

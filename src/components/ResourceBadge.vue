<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  icon: string
  name: string
  color: string
  value: number
  /** 拖动卡牌时，该资源受当前方向影响 */
  active?: boolean
}>()

const danger = computed(() => props.value <= 15 || props.value >= 85)

const ringStyle = computed(() => ({
  background: `conic-gradient(${props.color} ${props.value}%, rgba(255, 255, 255, 0.14) ${props.value}%)`,
}))
</script>

<template>
  <div class="badge" :class="{ danger, active }" :title="name">
    <div class="ring" :style="ringStyle">
      <div class="core">{{ icon }}</div>
    </div>
  </div>
</template>

<style scoped>
.badge {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  padding: 4px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.core {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #241c15;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6);
}

/* 拖动中该侧选择会波及此资源：放大 + 抖动提示 */
.badge.active .ring {
  transform: scale(1.18);
  animation: shake 0.5s ease infinite;
  box-shadow: 0 0 14px rgba(255, 220, 150, 0.35);
}

/* 资源濒临极值：红色警示脉冲 */
.badge.danger .ring {
  animation: pulse 0.9s ease infinite;
}

@keyframes shake {
  0%,
  100% {
    rotate: 0deg;
  }
  25% {
    rotate: -8deg;
  }
  75% {
    rotate: 8deg;
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.55);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(248, 113, 113, 0);
  }
}
</style>

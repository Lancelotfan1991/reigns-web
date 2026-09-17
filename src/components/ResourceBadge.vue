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

/** 牌内液位：高度即数值，色带与上沿同用该势本名 */
const fillStyle = computed(() => ({
  height: `${props.value}%`,
  background: `${props.color}2e`,
  borderColor: props.color,
}))
</script>

<template>
  <div class="badge" :class="{ danger, active }" :title="`${name} ${value}`">
    <div class="tablet">
      <span class="fill" :style="fillStyle" />
      <span class="icon">{{ icon }}</span>
      <span class="num">{{ value }}</span>
    </div>
    <span class="cap">{{ name }}</span>
  </div>
</template>

<style scoped>
.badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

/* 水牌：牌身即液位，涨落一眼可辨 */
.tablet {
  position: relative;
  width: 40px;
  height: 56px;
  overflow: hidden;
  border: 1.5px solid var(--line);
  border-radius: 19px 19px 5px 5px;
  background:
    var(--grain),
    linear-gradient(170deg, var(--paper-hi), #efe2c8);
  box-shadow: inset 0 1px 3px rgba(41, 33, 26, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.fill {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  border-top: 1.5px solid;
  transition: height 0.4s cubic-bezier(0.2, 0.8, 0.3, 1);
}

.icon {
  position: absolute;
  top: 5px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 16px;
  line-height: 1;
}

.num {
  position: absolute;
  bottom: 3px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--font-kai);
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  text-shadow: 0 0 4px var(--paper-hi), 0 0 4px var(--paper-hi);
}

.cap {
  font-size: 10.5px;
  letter-spacing: 1px;
  color: var(--ink-3);
}

/* 拖动中：该侧选择波及此牌 */
.active .tablet {
  transform: translateY(-3px) scale(1.06);
  border-color: var(--cinnabar);
  box-shadow: 0 4px 10px rgba(168, 50, 42, 0.22);
}

/* 濒临极值：朱框示警 */
.danger .tablet {
  border-color: var(--cinnabar);
  animation: warn 1s ease-in-out infinite;
}

.danger .cap {
  color: var(--cinnabar);
}

@keyframes warn {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(168, 50, 42, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(168, 50, 42, 0);
  }
}
</style>

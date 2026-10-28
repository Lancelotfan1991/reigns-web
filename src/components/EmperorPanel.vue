<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { EMPEROR_RELATIONS, EMPEROR_RESOURCES } from '../data/emperor'
import { useEmperor } from '../composables/useEmperor'
import { navigate } from '../router'

const { resources } = useEmperor()
const previousTitle = typeof document === 'undefined' ? '' : document.title

function back() {
  navigate('/')
}

onMounted(() => {
  document.title = '御前 · 崇祯十七年'
})
onUnmounted(() => {
  document.title = previousTitle
})
</script>

<template>
  <div class="emperor-page">
    <header class="masthead">
      <button class="back" aria-label="返回游戏" @click="back">← 回宫</button>
      <div class="masthead-text">
        <p class="kicker">崇祯十七年 · 御前</p>
        <h1>御前</h1>
        <p class="sub">皇帝自身的政治资本 · 不与人物五维混同</p>
      </div>
      <div class="era-seal seal inked" aria-hidden="true">
        <span>御</span>
        <span>前</span>
      </div>
    </header>

    <p class="lede">
      这里不是人物志。人物五维看的是“这个人能不能办事”；这三项看的是
      “皇帝能不能让天下人愿意替他办事”。
    </p>

    <section class="resource-grid" aria-label="皇帝资源">
      <article
        v-for="resource in EMPEROR_RESOURCES"
        :key="resource.key"
        class="resource-card"
        :style="{ '--accent': resource.color }"
      >
        <header class="resource-head">
          <span class="resource-icon" aria-hidden="true">{{ resource.icon }}</span>
          <div class="resource-title">
            <h2>{{ resource.name }}</h2>
            <p>{{ resource.tag }} · {{ resource.short }}</p>
          </div>
          <strong class="resource-value">{{ resources[resource.key] }}</strong>
        </header>

        <div
          class="resource-bar"
          role="progressbar"
          :aria-label="resource.name"
          :aria-valuenow="resources[resource.key]"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span class="resource-fill" :style="{ width: `${resources[resource.key]}%` }"></span>
          <i
            v-for="threshold in resource.thresholds"
            :key="threshold.at"
            class="threshold-mark"
            :style="{ left: `${threshold.at}%` }"
            :title="`${threshold.at}：${threshold.label}`"
          ></i>
        </div>

        <p class="resource-desc">{{ resource.description }}</p>

        <dl class="threshold-list">
          <div v-for="threshold in resource.thresholds" :key="threshold.at" class="threshold-row">
            <dt>{{ threshold.at }}</dt>
            <dd>{{ threshold.label }}</dd>
          </div>
        </dl>

        <p class="zero-line"><b>归零</b>{{ resource.zero }}</p>
      </article>
    </section>

    <section class="relations" aria-label="三者关系">
      <header class="section-head">
        <p class="kicker">三角关系</p>
        <h2>威望、国力、民心</h2>
      </header>
      <div class="relation-grid">
        <article v-for="relation in EMPEROR_RELATIONS" :key="relation.title" class="relation-card">
          <h3>{{ relation.title }}</h3>
          <p class="relation-line">{{ relation.line }}</p>
          <p class="relation-text">{{ relation.text }}</p>
        </article>
      </div>
      <p class="relation-note">
        威望决定“能不能做”，国力决定“做不做得起”，民心决定“做完之后会不会反”。
      </p>
    </section>

    <footer class="panel-foot">
      <p>此面板只属于皇帝一人。人物、边将、流寇仍由各自的人物志管理。</p>
      <button class="back-game" @click="back">回到游戏</button>
    </footer>
  </div>
</template>

<style scoped>
.emperor-page {
  min-height: 100dvh;
  max-width: 1020px;
  margin: 0 auto;
  padding: 22px clamp(12px, 3vw, 36px) 40px;
}

.masthead {
  display: flex;
  align-items: center;
  gap: 20px;
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

.masthead-text {
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
  letter-spacing: 14px;
  text-indent: 14px;
  color: var(--ink);
  line-height: 1.2;
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--ink-3);
}

.era-seal {
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

.lede {
  margin: 14px 0 18px;
  font-size: 13px;
  line-height: 1.9;
  color: var(--ink-3);
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.resource-card {
  --accent: var(--cinnabar);
  min-width: 0;
  padding: 16px;
  background:
    var(--grain),
    rgba(255, 253, 248, 0.68);
  border: 1px solid var(--line-soft);
  border-top: 3px solid var(--accent);
  border-radius: 5px;
}

.resource-head {
  display: flex;
  align-items: flex-start;
  gap: 9px;
}

.resource-icon {
  flex: none;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-radius: 50%;
}

.resource-title {
  flex: 1;
  min-width: 0;
}

.resource-title h2 {
  font-family: var(--font-kai);
  font-size: 18px;
  letter-spacing: 2px;
  color: var(--ink);
}

.resource-title p {
  margin-top: 3px;
  font-size: 10px;
  letter-spacing: 0.5px;
  color: var(--ink-3);
}

.resource-value {
  flex: none;
  font-family: var(--font-kai);
  font-size: 35px;
  line-height: 1;
  color: var(--accent);
}

.resource-bar {
  position: relative;
  height: 9px;
  margin-top: 15px;
  overflow: visible;
  background: rgba(41, 33, 26, 0.1);
  border-radius: 99px;
}

.resource-fill {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
  transition: width 0.4s ease;
}

.threshold-mark {
  position: absolute;
  top: -3px;
  width: 1px;
  height: 15px;
  background: rgba(41, 33, 26, 0.45);
}

.resource-desc {
  min-height: 66px;
  margin-top: 13px;
  font-size: 12px;
  line-height: 1.75;
  color: var(--ink-2);
}

.threshold-list {
  margin-top: 12px;
  border-top: 1px dashed var(--line-soft);
}

.threshold-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px dashed rgba(203, 175, 131, 0.45);
}

.threshold-row dt {
  flex: none;
  width: 22px;
  font-family: var(--font-kai);
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  text-align: right;
}

.threshold-row dd {
  font-size: 11px;
  line-height: 1.5;
  color: var(--ink-3);
}

.zero-line {
  margin-top: 11px;
  font-size: 11px;
  line-height: 1.65;
  color: var(--ink-3);
}

.zero-line b {
  margin-right: 6px;
  color: var(--accent);
}

.relations {
  margin-top: 26px;
  padding-top: 20px;
  border-top: 1.5px solid var(--line);
}

.section-head h2 {
  margin-top: 3px;
  font-family: var(--font-kai);
  font-size: 24px;
  letter-spacing: 7px;
  color: var(--ink);
}

.relation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 13px;
}

.relation-card {
  padding: 13px 14px;
  background: rgba(255, 253, 248, 0.48);
  border: 1px solid var(--line-soft);
  border-radius: 4px;
}

.relation-card h3 {
  font-family: var(--font-kai);
  font-size: 17px;
  letter-spacing: 2px;
  color: var(--ink);
}

.relation-line {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--cinnabar);
}

.relation-text {
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.7;
  color: var(--ink-3);
}

.relation-note {
  margin-top: 13px;
  padding: 11px 14px;
  font-family: var(--font-kai);
  font-size: 13px;
  line-height: 1.8;
  color: var(--ink-2);
  background: rgba(168, 50, 42, 0.06);
  border-left: 3px solid var(--cinnabar);
}

.panel-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 26px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-soft);
}

.panel-foot p {
  font-size: 11px;
  line-height: 1.6;
  color: var(--ink-3);
}

.back-game {
  flex: none;
  padding: 7px 14px;
  font-family: var(--font-kai);
  font-size: 13px;
  letter-spacing: 1px;
  color: var(--paper-hi);
  background: var(--cinnabar);
  border: 1px solid var(--cinnabar);
  border-radius: 3px;
  cursor: pointer;
}

.back-game:hover,
.back-game:focus-visible {
  background: var(--cinnabar-hi);
  border-color: var(--cinnabar-hi);
}

@media (max-width: 760px) {
  .emperor-page {
    padding: 14px 10px 28px;
  }

  .masthead {
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 12px;
  }

  .back {
    order: 1;
    margin-top: 0;
  }

  .era-seal {
    order: 2;
    width: 48px;
    height: 48px;
    margin-left: auto;
    font-size: 12px;
  }

  .masthead-text {
    order: 3;
    flex-basis: 100%;
    margin-top: 4px;
  }

  h1 {
    font-size: 32px;
    letter-spacing: 10px;
    text-indent: 10px;
  }

  .sub {
    letter-spacing: 1px;
  }

  .resource-grid,
  .relation-grid {
    grid-template-columns: 1fr;
  }

  .resource-desc {
    min-height: 0;
  }

  .panel-foot {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

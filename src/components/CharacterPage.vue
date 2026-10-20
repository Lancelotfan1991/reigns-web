<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import CharacterPanel from './CharacterPanel.vue'
import { useCharacters } from '../composables/useCharacters'
import { useGame } from '../composables/useGame'
import { navigate } from '../router'

const game = useGame()
const chars = useCharacters(game)
const previousTitle = typeof document === 'undefined' ? '' : document.title

function back() {
  navigate('/')
}

onMounted(() => {
  document.title = '人物志 · 崇祯十七年'
})
onUnmounted(() => {
  document.title = previousTitle
})
</script>

<template>
  <div class="characters-page">
    <header class="masthead">
      <button class="back" aria-label="返回游戏" @click="back">‹ 回宫</button>
      <div class="masthead-text">
        <p class="kicker">大明 · 天启七年至崇祯十七年</p>
        <h1>人物志</h1>
        <p class="sub">朝臣 · 边将 · 流营 · 海商 · 宗藩</p>
      </div>
      <div class="era-seal seal inked" aria-hidden="true">
        <span>人</span>
        <span>物</span>
      </div>
    </header>

    <p class="lede">
      人物状态随本局纪年与抉择变化：已登场者列其小传、关系与亲历之事，未登场者只存名册。
    </p>

    <CharacterPanel
      :characters="chars.views.value"
      :year-text="game.yearText.value"
      embedded
    />
  </div>
</template>

<style scoped>
.characters-page {
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
  letter-spacing: 3px;
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
  margin: 14px 0 12px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--ink-3);
}

@media (max-width: 760px) {
  .characters-page {
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
    letter-spacing: 1.5px;
  }
}
</style>

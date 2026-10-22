<script setup lang="ts">
import { computed, ref } from 'vue'
import { Side } from '../types'
import type { Effects } from '../types'

interface PreludeChoice {
  label: string
  effects: Effects
  response: string
}

interface PreludeStep {
  id: string
  name: string
  avatar: string
  text: string
  left: PreludeChoice
  right: PreludeChoice
}

const STEPS: PreludeStep[] = [
  {
    id: 'prelude-bingta',
    name: '病榻托孤',
    avatar: '🛏️',
    text: '天启七年八月，皇兄朱由校病重，召你入乾清宫。他无子，按兄终弟及，你是唯一在世的皇弟。榻前他说：「吾弟当为尧舜。」又嘱你善事中宫、忠贤宜委用。应得太快，像早有觊觎；应得太慢，又怕皇兄疑心。',
    left: {
      label: '涕泣固辞，只求皇兄静养',
      effects: { court: -2, people: 3 },
      response: '你伏地涕泣，再三推辞，说不敢当尧舜之誉，只愿皇兄静养。朱由校看着你，没再逼问；帘外的魏忠贤却把「再三推辞」四个字记在心里。',
    },
    right: {
      label: '顿首受命，请皇兄安心',
      effects: { court: 4, people: -2 },
      response: '你顿首受命，说愿承祖宗基业。朱由校点头，命你善事中宫、委用忠贤；你应下了，心里却把「委用」二字掂了又掂。',
    },
  },
  {
    id: 'prelude-yizhao',
    name: '遗诏迎立',
    avatar: '📜',
    text: '八月二十二日申时，朱由校驾崩。遗诏迎立信王。内阁辅臣施凤来、张立极与英国公张惟贤等具笺劝进；魏忠贤也通过信王府旧监徐应元，自请迎你入宫。谁先来迎、从哪道门入，就是名分。',
    left: {
      label: '随魏忠贤即刻入宫，先定名分',
      effects: { court: 5, people: -2 },
      response: '你随魏忠贤入宫，名分当夜而定。宫门、司礼监仍是他的人；你坐在乾清宫，听见外面锁钥响，知道今夜不会太平。',
    },
    right: {
      label: '先受内阁劝进笺，再入宫',
      effects: { court: 2, people: 3 },
      response: '你先在信府受了内阁劝进笺，才从东华门入宫。名分迟了半日，却让百官看见：迎立你的是祖制与内阁，不只是魏忠贤。',
    },
  },
  {
    id: 'prelude-quanjin',
    name: '三辞三让',
    avatar: '🏛️',
    text: '按本朝故事，新君受劝进笺，要三辞三让，才算名正言顺。内阁已把第一道劝进笺递到信府；魏忠贤的人盯着你何时点头，百官看着你会不会推辞。',
    left: {
      label: '依例三辞三让，再受天命',
      effects: { court: 3, people: 3 },
      response: '你把劝进笺退回三次，第三次才允。礼部官员松了口气，说这才像祖宗旧制；魏忠贤却嫌你拖，暗里催了几回。',
    },
    right: {
      label: '不再辞让，即日受命',
      effects: { court: -3, people: -3 },
      response: '你没有再辞，当日受命。名分早定了半日，礼部却低声议论：新君急于正位，连三辞的旧例都省了。',
    },
  },
  {
    id: 'prelude-maibing',
    name: '袖饼入宫',
    avatar: '🫓',
    text: '入宫前，皇嫂张嫣（懿安皇后）告诫你：宫里的饮食未必干净，不要随便吃。你让信王府的人做了几张麦饼，藏在袖中。宫门在望，魏忠贤的人已在门内等候。',
    left: {
      label: '袖麦饼入宫，不食宫膳',
      effects: { court: 2, people: 3 },
      response: '你把麦饼藏在袖中，进了乾清宫。内侍端来膳食，你只说国丧未除、不进荤酒；夜里饿了，就掰一块麦饼。左右看见，知道新君连一口水都不肯轻信。',
    },
    right: {
      label: '照常入宫，接受宫膳',
      effects: { court: -2, people: -4 },
      response: '你照常入宫，内侍端上膳食。你动了筷子，却吃得极少；每道菜经谁的手，你并不知道。当夜你听见门外脚步声，几次坐起，终究没有睡稳。',
    },
  },
]

const emit = defineEmits<{ (e: 'done', effects: Effects): void }>()

const stepIndex = ref(0)
const chosen = ref<Side | null>(null)
const effects = ref<Effects>({})

const step = computed(() => STEPS[stepIndex.value])
const isLast = computed(() => stepIndex.value === STEPS.length - 1)
const chosenChoice = computed(() => {
  if (!chosen.value) return null
  return chosen.value === Side.Left ? step.value.left : step.value.right
})

function addEffects(next: Effects) {
  for (const key of Object.keys(next) as Array<keyof Effects>) {
    effects.value[key] = (effects.value[key] ?? 0) + (next[key] ?? 0)
  }
}

function choose(side: Side) {
  if (chosen.value) return
  chosen.value = side
  addEffects(side === Side.Left ? step.value.left.effects : step.value.right.effects)
}

function next() {
  if (!chosen.value) return
  if (isLast.value) {
    emit('done', { ...effects.value })
    return
  }
  stepIndex.value += 1
  chosen.value = null
}
</script>

<template>
  <div class="prelude">
    <header class="prelude-head">
      <p class="kicker">天启七年八月 · 信邸</p>
      <h1>信邸承统</h1>
      <div class="progress" aria-label="序幕进度">
        <span
          v-for="(item, index) in STEPS"
          :key="item.id"
          class="dot"
          :class="{ on: index <= stepIndex }"
        />
        <span class="count">{{ stepIndex + 1 }} / {{ STEPS.length }}</span>
      </div>
    </header>

    <article class="prelude-card" :aria-label="step.name">
      <div class="card-top">
        <span class="card-avatar" aria-hidden="true">{{ step.avatar }}</span>
        <span class="card-name">{{ step.name }}</span>
        <span class="card-seal">信邸</span>
      </div>
      <p class="card-text">{{ step.text }}</p>

      <div v-if="!chosen" class="choices">
        <button class="prologue-choice left" @click="choose(Side.Left)">
          {{ step.left.label }}
        </button>
        <button class="prologue-choice right" @click="choose(Side.Right)">
          {{ step.right.label }}
        </button>
      </div>

      <div v-else class="after">
        <p class="picked">你选择了：{{ chosenChoice?.label }}</p>
        <p class="response">{{ chosenChoice?.response }}</p>
        <button class="prologue-next" @click="next">
          {{ isLast ? '入宫' : '继续' }}
        </button>
      </div>
    </article>

    <p class="prelude-foot">
      这四页只是入宫前的铺垫；真正的考验，从你踏进乾清宫那一刻才开始。
    </p>
  </div>
</template>

<style scoped>
.prelude {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 14px calc(24px + env(safe-area-inset-bottom));
  background:
    var(--grain),
    radial-gradient(ellipse at 50% 42%, rgba(255, 252, 242, 0.9), rgba(236, 223, 198, 0.8) 58%, rgba(211, 189, 152, 0.55) 100%);
}

.prelude-head {
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
  font-size: clamp(28px, 4.5vw, 38px);
  font-weight: 700;
  letter-spacing: 9px;
  text-indent: 9px;
  color: var(--ink);
}

.progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 8px;
}

.dot {
  width: 18px;
  height: 3px;
  background: rgba(171, 142, 95, 0.32);
  border-radius: 2px;
}

.dot.on {
  background: var(--cinnabar);
}

.count {
  margin-left: 6px;
  font-size: 10px;
  color: var(--ink-3);
}

.prelude-card {
  width: min(590px, 100%);
  margin-top: 18px;
  padding: 16px 18px 18px;
  background:
    var(--grain),
    linear-gradient(165deg, rgba(255, 253, 248, 0.94), rgba(242, 230, 207, 0.9));
  border: 1px solid var(--line);
  border-top: 3px solid var(--cinnabar);
  border-radius: 3px;
  box-shadow: 0 12px 30px rgba(41, 33, 26, 0.16);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--line-soft);
}

.card-avatar {
  font-size: 18px;
}

.card-name {
  font-family: var(--font-kai);
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--cinnabar);
}

.card-seal {
  margin-left: auto;
  padding: 1px 5px;
  font-family: var(--font-kai);
  font-size: 9.5px;
  letter-spacing: 1px;
  color: var(--paper-hi);
  background: var(--ink-2);
  border-radius: 2px;
}

.card-text {
  margin-top: 11px;
  font-family: var(--font-kai);
  font-size: 15px;
  line-height: 2;
  text-align: justify;
  color: var(--ink);
}

.choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.prologue-choice {
  min-height: 52px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-2);
  background: rgba(255, 253, 248, 0.76);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.prologue-choice:hover,
.prologue-choice:focus-visible {
  transform: translateY(-1px);
  color: var(--cinnabar);
  border-color: var(--cinnabar);
  outline: none;
}

.prologue-choice.left {
  border-left: 3px solid var(--cinnabar);
}

.prologue-choice.right {
  border-right: 3px solid var(--ink-2);
}

.after {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed var(--line-soft);
}

.picked {
  font-size: 10.5px;
  color: var(--ink-3);
}

.response {
  margin-top: 5px;
  font-family: var(--font-kai);
  font-size: 13.5px;
  line-height: 1.95;
  text-align: justify;
  color: var(--ink-2);
}

.prologue-next {
  display: block;
  margin: 14px auto 0;
  padding: 7px 26px;
  font-family: var(--font-kai);
  font-size: 13px;
  letter-spacing: 5px;
  text-indent: 5px;
  color: var(--paper-hi);
  background: var(--cinnabar);
  border: 1px solid var(--cinnabar);
  border-radius: 3px;
  cursor: pointer;
}

.prologue-next:hover,
.prologue-next:focus-visible {
  background: #8f2a22;
  outline: none;
}

.prelude-foot {
  margin-top: 14px;
  font-size: 10.5px;
  line-height: 1.8;
  text-align: center;
  color: var(--ink-3);
}

@media (max-width: 560px) {
  .prelude {
    justify-content: flex-start;
    padding: 16px 10px 24px;
  }

  .prelude-card {
    margin-top: 12px;
    padding: 13px 13px 15px;
  }

  .card-text {
    font-size: 14px;
    line-height: 1.95;
  }

  .choices {
    grid-template-columns: minmax(0, 1fr);
  }

  .prologue-choice {
    min-height: 44px;
  }

  h1 {
    font-size: 28px;
    letter-spacing: 6px;
    text-indent: 6px;
  }
}
</style>

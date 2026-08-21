import { computed, ref } from 'vue'
import { EVENTS } from '../data/events'
import type { Ending, Effects, GameEvent, ResourceKey, Side } from '../types'

export const RESOURCE_KEYS: ResourceKey[] = ['church', 'people', 'army', 'gold']

export const RESOURCE_META: Record<ResourceKey, { icon: string; name: string; color: string }> = {
  church: { icon: '⛪', name: '教会', color: '#c084fc' },
  people: { icon: '👥', name: '民众', color: '#4ade80' },
  army: { icon: '⚔️', name: '军队', color: '#f87171' },
  gold: { icon: '💰', name: '国库', color: '#fbbf24' },
}

const START_VALUE = 50
const BEST_KEY = 'reigns-web-best-years'

/** 每项资源归零 / 拉满时的专属结局 */
const ENDINGS: Record<ResourceKey, { empty: Ending; full: Ending }> = {
  church: {
    empty: {
      avatar: '⚡',
      title: '绝罚之王',
      description: '教会宣布将你逐出教门，信徒们视你为异端。失去神权庇护的王冠，很快在宗教狂热中坠地。',
    },
    full: {
      avatar: '🕯️',
      title: '教会的傀儡',
      description: '教会权倾朝野，主教的手伸进了每一个决策。你只是圣座下的一个盖章工具——很快，他们连章也不需要了。',
    },
  },
  people: {
    empty: {
      avatar: '🔥',
      title: '愤怒的起义',
      description: '忍无可忍的民众揭竿而起，火把照亮了王宫的高墙。你在暴动声中被拖下王座，王冠滚落在血泊里。',
    },
    full: {
      avatar: '🗡️',
      title: '软弱的昏君',
      description: '你对民众百依百顺，贵族与权贵却认为你软弱可欺。一场宫廷政变中，他们换上了更「强硬」的君主。',
    },
  },
  army: {
    empty: {
      avatar: '🏴',
      title: '国破城陷',
      description: '军队涣散，边关告破。敌军铁骑长驱直入，王城陷落的那一夜，你成了阶下之囚。',
    },
    full: {
      avatar: '⚔️',
      title: '军事政变',
      description: '将军们的权势已经超越了王权。在一次「例行阅兵」中，军队包围了王宫——他们拥立了一位更听话的国王。',
    },
  },
  gold: {
    empty: {
      avatar: '🪙',
      title: '破产的王国',
      description: '国库空空如也，债主堵住了宫门。发不出俸禄的朝廷作鸟兽散，你在债务与嘲笑中黯然退位。',
    },
    full: {
      avatar: '👑',
      title: '黄金的囚徒',
      description: '你坐拥金山却众叛亲离。觊觎财富的权贵们联手发难——毕竟，一个守不住秘密的金库，本身就是最大的危险。',
    },
  },
}

function shuffle<T>(list: T[]): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

export function useGame() {
  const resources = ref<Record<ResourceKey, number>>({
    church: START_VALUE,
    people: START_VALUE,
    army: START_VALUE,
    gold: START_VALUE,
  })
  const deck = ref<GameEvent[]>([])
  const cardIndex = ref(0)
  const ending = ref<Ending | null>(null)
  const lastResponse = ref('')
  const bestYears = ref(loadBest())

  const year = computed(() => cardIndex.value + 1)
  const currentCard = computed<GameEvent | null>(() => deck.value[cardIndex.value] ?? null)
  const isOver = computed(() => ending.value !== null)
  const isNewRecord = computed(() => isOver.value && cardIndex.value > 0 && cardIndex.value >= bestYears.value)

  function refillDeck() {
    const fresh = shuffle(EVENTS)
    // 避免与上一张卡重复
    const lastId = deck.value[cardIndex.value - 1]?.id
    if (lastId && fresh[0]?.id === lastId) {
      fresh.push(fresh.shift()!)
    }
    deck.value.push(...fresh)
  }

  function startGame() {
    resources.value = { church: START_VALUE, people: START_VALUE, army: START_VALUE, gold: START_VALUE }
    deck.value = shuffle(EVENTS)
    cardIndex.value = 0
    ending.value = null
    lastResponse.value = ''
  }

  /** 预览某侧选择影响的资源（拖动时用于顶部图标提示） */
  function previewEffects(side: Side): Effects {
    const card = currentCard.value
    if (!card) return {}
    return side === 'left' ? card.left.effects : card.right.effects
  }

  /** 做出选择：结算资源、判定结局、翻开下一张卡 */
  function choose(side: Side) {
    const card = currentCard.value
    if (!card || isOver.value) return

    const choice = side === 'left' ? card.left : card.right
    lastResponse.value = choice.response

    const next = { ...resources.value }
    for (const key of RESOURCE_KEYS) {
      const delta = choice.effects[key] ?? 0
      next[key] = Math.min(100, Math.max(0, next[key] + delta))
    }
    resources.value = next

    // 判定死亡：任一资源归零或拉满即王权终结
    for (const key of RESOURCE_KEYS) {
      const value = next[key]
      if (value <= 0) {
        return gameOver(ENDINGS[key].empty)
      }
      if (value >= 100) {
        return gameOver(ENDINGS[key].full)
      }
    }

    cardIndex.value += 1
    // 牌库快耗尽时补充（保留少量余量让下一张卡存在）
    if (cardIndex.value >= deck.value.length - 2) {
      refillDeck()
    }
  }

  function gameOver(result: Ending) {
    ending.value = result
    const reign = year.value
    if (reign > bestYears.value) {
      bestYears.value = reign
      try {
        localStorage.setItem(BEST_KEY, String(reign))
      } catch {
        /* 忽略存储失败 */
      }
    }
  }

  return {
    resources,
    currentCard,
    year,
    ending,
    lastResponse,
    bestYears,
    isOver,
    isNewRecord,
    startGame,
    choose,
    previewEffects,
  }
}

export type Game = ReturnType<typeof useGame>

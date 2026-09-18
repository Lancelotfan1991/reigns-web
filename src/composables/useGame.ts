import { computed, ref } from 'vue'
import { FINALE_EVENT, RANDOM_EVENTS, SCRIPT_EVENTS } from '../data/events'
import type { AxisKey, Decision, Ending, Effects, GameEvent, ResourceKey, Side } from '../types'

/** 四象：归零与满格同样致命 */
export const AXIS_KEYS: AxisKey[] = ['court', 'law', 'army', 'gold']
/** 结算与展示的统一顺序：四象在前，国本民心在后 */
export const RESOURCE_KEYS: ResourceKey[] = ['court', 'law', 'army', 'gold', 'people']

export const RESOURCE_META: Record<ResourceKey, { icon: string; name: string; color: string; hint: string }> = {
  court: { icon: '🏛️', name: '君威', color: '#a8322a', hint: '谁的话还算数' },
  law: { icon: '⚖️', name: '法度', color: '#6b4f86', hint: '章程还管不管用' },
  army: { icon: '⚔️', name: '军心', color: '#3a5f83', hint: '兵还肯不肯战' },
  gold: { icon: '💰', name: '国库', color: '#ab8430', hint: '饷银周转得开吗' },
  people: { icon: '🌾', name: '民心', color: '#4b7a5c', hint: '国本水位：只跌不盈' },
}

/** 国本线：民心低于此值即为动乱，此后每做一次决策，军心与法度各再失血 */
export const UNREST_LINE = 30
/** 南渡硬门槛：终章时民心不及此数，南渡必败 */
export const SOUTH_PEOPLE_LINE = 45
/** 民心厚到此处，终章可赦免一象之不足 */
export const SOUTH_WAIVER_LINE = 70
const UNREST_PENALTY: Partial<Record<AxisKey, number>> = { army: -1, law: -1 }

/** 每张卡约一个季度，3 张牌推进一年；天启七年 + 崇祯 1-16 年 + 1644 终章 */
export const CARDS_PER_YEAR = 3
const LAST_SCRIPT_YEAR = 16
const START_VALUE = 50
const BEST_KEY = 'chongzhen-best-years'

const CN_YEAR = ['〇', '元', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七']

/** 崇祯纪年短格式：0 及以前为天启七年，N 为崇祯N年，上限崇祯十七年 */
export function yearLabel(y: number): string {
  if (y <= 0) return '天启七年'
  return `崇祯${CN_YEAR[Math.min(y, CN_YEAR.length - 1)]}年`
}

/** 时代重力：每做出一项决策，辽饷与武备都在缓慢失血 */
const ERA_DRIFT: Partial<Record<ResourceKey, number>> = { army: -1, gold: -1 }

/** 四象失衡结局（1644 之前） */
const AXIS_ENDINGS: Record<AxisKey, { empty: Ending; full: Ending }> = {
  court: {
    empty: {
      avatar: '🎭',
      kind: 'doom',
      title: '虚君',
      description:
        '票拟批红都还走你的手续，只是没人把你的话当数：除授之命阁臣封还，催饷之旨督抚宕缓，用人、调兵、催科，处处有人替你「斟酌」。你不曾被废，只是渐渐成了一个名字。城破之日你才看清，这朝廷早已不姓朱。',
    },
    full: {
      avatar: '🩸',
      kind: 'doom',
      title: '猜忌喋血',
      description:
        '你要把君威立到人头上：诛戮过当，督抚相继就逮，「朝衣殿上」成了每日的戏。人人自危、事皆推诿，最后连贴身的干伴儿也在帘外低语：「皇上，该换个年号了。」',
    },
  },
  law: {
    empty: {
      avatar: '🏛️',
      kind: 'doom',
      title: '庙堂无人',
      description:
        '法度一弛，赏罚全出于上意，便再没人肯守章程。奏章尽是套话，政令不出西直门，守令以推诿为老成，将帅以养寇为功。流贼入城之日，百官列队投降，拔刀抵抗的竟只剩守门的内侍。',
    },
    full: {
      avatar: '📜',
      kind: 'doom',
      title: '束湿之政',
      description:
        '你把天下做成了一部细密的机器：考成愈急，追赃愈峻，告讪起于骨肉之间，文吏舞于簿书之上。百姓苦胥吏甚于苦流贼，而州县一律呈报「境内晏然」。法愈密则奸愈生，及至大崩，竟无一人肯为这制度说一句话。',
    },
  },
  army: {
    empty: {
      avatar: '🏴',
      kind: 'doom',
      title: '边防空废',
      description:
        '伍籍空虚、逃兵如流，千里边墙长满荒草。建州铁骑三度破口而入，游骑已至黄河渡口——这一回，他们不打算走了。',
    },
    full: {
      avatar: '⚔️',
      kind: 'doom',
      title: '黄袍加身',
      description:
        '边镇骄将各拥精锐，听诏不听宣。诸军「索饷」的旗号越扎越高，终于一日包围行在，请「清君侧」——你想起赵匡胤，已嫌太迟。',
    },
  },
  gold: {
    empty: {
      avatar: '🪙',
      kind: 'doom',
      title: '饷竭国空',
      description:
        '太仓放尽、内库成壳，九边饷银粒米无着。城头守军传下的口号是「给银子才上阵」——而你的帑藏已连一分赏功银也拿不出。',
    },
    full: {
      avatar: '👑',
      kind: 'doom',
      title: '聚敛速亡',
      description:
        '你把「富国」变成了富私库：加派、榷酤、籍没，白银层层流入大内。城破之日，新朝从你库中括银数千万两——知者私语：「总家底都在这儿了。」',
    },
  },
}

/** 民心：唯一的单向底线——倾覆即亡，厚则无咎 */
const PEOPLE_ENDING: Ending = {
  avatar: '🔥',
  kind: 'doom',
  title: '万民倒戈',
  description:
    '不是百姓不忠君——你给了他们荒年、加派与瘟疫，却连活路也收走了。城门从内部打开，香烛「迎闯王」，闯王的兵未放一箭。国本一倾，宗庙、府库、边军随之而去：你失去的从来不是一项指标，是天命本身。',
}

/** 南渡所需的四象底线 */
const AXIS_GATE: Record<AxisKey, number> = { court: 40, law: 35, army: 40, gold: 25 }

/** 1644 终章结局 */
const FINALE_ENDINGS: { meishan: Ending; southOk: Ending; southNoRoot: Ending; southFail: Ending } = {
  meishan: {
    avatar: '🪢',
    kind: 'neutral',
    title: '煤山一棵歪脖树',
    description:
      '你在寿皇亭东的歪脖树上留下衣带诏：「朕凉德藐躬，上干天咎，然皆诸臣误朕。任贼分裂朕尸，勿伤百姓一人。」三百年后读史者仍在树下长叹——你终究走回了历史的轨道。',
  },
  southOk: {
    avatar: '🏯',
    kind: 'glory',
    title: '南渡终成局',
    description:
      '你雪夜出正阳门，一路村堡献牛酒、输舟楫，南京百官迎于江东门。江淮固守、漕海畅通，虽失西北，社稷之血因你而续——后世史笔：「定鼎金陵，中兴之业，基于此举。」',
  },
  southNoRoot: {
    avatar: '🚣',
    kind: 'doom',
    title: '无根之南',
    description:
      '你逃出了京师，却没有逃出人心的旧账。渡淮之后村堡闭门、粮户藏册、舟子索直，南京的百官另寻了更「有福分」的宗室，江淮寸土不肯为你而守。史臣不肯为你立本纪，只于传末记一句：「民思乱矣。」',
  },
  southFail: {
    avatar: '🩸',
    kind: 'doom',
    title: '南辕北辙',
    description:
      '仓皇出逃，禁旅溃散、护驾失控，追骑在保定田野间赶上你的车架。君弃宗庙社稷而走，名分已坠地——就算逃到秦淮河，也无颜再登任何一座金銮殿。',
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

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function initialResources(): Record<ResourceKey, number> {
  return { court: START_VALUE, law: START_VALUE, army: START_VALUE, gold: START_VALUE, people: START_VALUE }
}

/** 构建本局牌堆：剧本卡锁入所属年份槽位，随机卡补足空槽，终章压轴 */
function buildDeck(): GameEvent[] {
  const pool = shuffle(RANDOM_EVENTS)
  let cursor = 0
  const takeRandom = (): GameEvent => {
    if (cursor >= pool.length) {
      const fresh = shuffle(RANDOM_EVENTS)
      if (fresh[0]?.id === pool[pool.length - 1]?.id) fresh.push(fresh.shift()!)
      pool.push(...fresh)
    }
    return pool[cursor++]
  }

  const deck: GameEvent[] = []
  for (let year = 0; year <= LAST_SCRIPT_YEAR; year++) {
    const scripts = SCRIPT_EVENTS.filter((e) => e.year === year).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    for (let slot = 0; slot < CARDS_PER_YEAR; slot++) {
      deck.push(scripts[slot] ?? takeRandom())
    }
  }
  deck.push(FINALE_EVENT)
  return deck
}

export function useGame() {
  const resources = ref<Record<ResourceKey, number>>(initialResources())
  const deck = ref<GameEvent[]>([])
  const cardIndex = ref(0)
  const ending = ref<Ending | null>(null)
  const lastResponse = ref('')
  const bestYears = ref(loadBest())
  /** 本局已做出的决策，供人物系统推导 */
  const decisions = ref<Decision[]>([])

  /** 0 = 天启七年，N = 崇祯N年，17 = 甲申终章当年 */
  const year = computed(() => Math.floor(cardIndex.value / CARDS_PER_YEAR))
  const yearText = computed(() => {
    const y = year.value
    return `${yearLabel(y)}（${1627 + Math.min(Math.max(y, 0), 17)}）`
  })
  const currentCard = computed<GameEvent | null>(() => deck.value[cardIndex.value] ?? null)
  const isOver = computed(() => ending.value !== null)
  /** 在位年数（天启七年为第 1 年，终章年为第 18 年） */
  const reignedYears = computed(() => year.value + 1)
  const isNewRecord = computed(() => isOver.value && reignedYears.value > bestYears.value)
  /** 终章是否被触发（区别于中途失衡而亡） */
  const reachedFinale = computed(() => isOver.value && cardIndex.value >= deck.value.length)
  /** 国本已倾：民心跌破动乱线，此后每次决策都在同时耗尽军心与法度 */
  const unrest = computed(() => resources.value.people < UNREST_LINE)

  /** 事件 id → 该事件上做出的决策 */
  const decisionByEvent = computed(() => {
    const map: Record<string, Decision> = {}
    for (const d of decisions.value) map[d.eventId] = d
    return map
  })

  /** 本局已翻开过的卡（含手上这张），人物登场与事迹回顾以此为准 */
  const seenEventIds = computed(() => {
    const set = new Set(decisions.value.map((d) => d.eventId))
    if (currentCard.value) set.add(currentCard.value.id)
    return set
  })

  function startGame() {
    resources.value = initialResources()
    deck.value = buildDeck()
    cardIndex.value = 0
    ending.value = null
    lastResponse.value = ''
    decisions.value = []
  }

  /** 预览某侧选择影响的指标（拖动时用于顶部图标提示） */
  function previewEffects(side: Side): Effects {
    const card = currentCard.value
    if (!card) return {}
    return side === 'left' ? card.left.effects : card.right.effects
  }

  /** 结算一次决策：时代重力常年失血；国本已倾（民心低于动乱线）时，军心与法度每判再耗一分 */
  function applyEffects(effects: Effects): Record<ResourceKey, number> {
    const next = { ...resources.value }
    for (const key of RESOURCE_KEYS) {
      const delta = (effects[key] ?? 0) + (ERA_DRIFT[key] ?? 0)
      next[key] = clamp(next[key] + delta)
    }
    if (next.people < UNREST_LINE) {
      for (const key of AXIS_KEYS) {
        next[key] = clamp(next[key] + (UNREST_PENALTY[key] ?? 0))
      }
    }
    resources.value = next
    return next
  }

  /** 终章结算：民心权重最高——不及国本线则南渡必败，四象有亏需民心 ≥70 方赦其一 */
  function finaleEnding(next: Record<ResourceKey, number>): Ending {
    if (next.people < SOUTH_PEOPLE_LINE) return FINALE_ENDINGS.southNoRoot
    const shortfalls = AXIS_KEYS.filter((key) => next[key] < AXIS_GATE[key]).length
    if (shortfalls === 0 || (next.people >= SOUTH_WAIVER_LINE && shortfalls === 1)) {
      return FINALE_ENDINGS.southOk
    }
    return FINALE_ENDINGS.southFail
  }

  /** 做出选择：结算指标、判定失衡/终章、翻开下一张卡 */
  function choose(side: Side) {
    const card = currentCard.value
    if (!card || isOver.value) return

    const choice = side === 'left' ? card.left : card.right
    decisions.value.push({ eventId: card.id, side, year: year.value })
    lastResponse.value = choice.response
    const next = applyEffects(choice.effects)

    // 终章分支：按国势数值决定南渡成败
    if (choice.finale === 'meishan') {
      advance()
      return gameOver(FINALE_ENDINGS.meishan)
    }
    if (choice.finale === 'south') {
      advance()
      return gameOver(finaleEnding(next))
    }

    // 失衡判定：四象任一归零或满格，国势崩解
    for (const key of AXIS_KEYS) {
      const value = next[key]
      if (value <= 0) return gameOver(AXIS_ENDINGS[key].empty)
      if (value >= 100) return gameOver(AXIS_ENDINGS[key].full)
    }
    // 民心只问下限：国本倾覆，社稷无根
    if (next.people <= 0) return gameOver(PEOPLE_ENDING)

    advance()
  }

  function advance() {
    cardIndex.value += 1
  }

  function gameOver(result: Ending) {
    ending.value = result
    const reached = reignedYears.value
    if (reached > bestYears.value) {
      bestYears.value = reached
      try {
        localStorage.setItem(BEST_KEY, String(reached))
      } catch {
        /* 忽略存储失败 */
      }
    }
  }

  return {
    resources,
    currentCard,
    year,
    yearText,
    ending,
    lastResponse,
    bestYears,
    reignedYears,
    reachedFinale,
    isOver,
    isNewRecord,
    unrest,
    decisions,
    decisionByEvent,
    seenEventIds,
    startGame,
    choose,
    previewEffects,
  }
}

export type Game = ReturnType<typeof useGame>

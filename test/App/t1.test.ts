// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../../src/App.vue'
import * as gameModule from '../../src/composables/useGame'
import { healthy, progressSide, reach, seedRandom } from '../game/helpers'
import { CARDS_PER_YEAR } from '../../src/composables/slots'

type AppWrapper = ReturnType<typeof mount<typeof App>>
const chapterProgressSelector = '.chapter-progress'
const verdictSelector = '[aria-label="本议批红"]'
const cardBodySelector = '[aria-label="塘报正文，可上下滚动"]'

/** 宫门定策八步的卡名；WEI_SIDES 走到第八步时军心已损，落到「逮牌不出宫门」一档 */
const WEI_TITLES = ['捧玺入宫', '东林点将录', '献宫女试探', '客氏出宫', '处置崔呈秀', '王体乾去留', '文官连章弹魏', '逮牌不出宫门'] as const
const WEI_SIDES = [0, 0, 1, 0, 1, 1, 0, 0] as const

/** 飞牌裁决：停在属于这一议的批红页 */
async function flyChoice(wrapper: AppWrapper, side: 0 | 1) {
  await wrapper.get('footer').findAll('button')[side].trigger('click')
  await vi.advanceTimersByTimeAsync(300)
  await nextTick()
}

/** 读完批红，翻回决策页；国运已定时进入结局页 */
async function readVerdict(wrapper: AppWrapper) {
  const sheet = wrapper.get(verdictSelector)
  const btn = sheet.get('button')
  await btn.trigger('click')
  await nextTick()
  // 生死页有两屏：人物退场 → 批红正文；若按钮仍在说明还在第一屏
  if (wrapper.find(verdictSelector).exists()) {
    const btn2 = wrapper.get(verdictSelector).get('button')
    if (btn2.text().includes('批红') || btn2.text().includes('知道了') || btn2.text().includes('看结局')) {
      await btn2.trigger('click')
      await nextTick()
    }
  }
}

async function clickChoice(wrapper: AppWrapper, side: 0 | 1) {
  await flyChoice(wrapper, side)
  await readVerdict(wrapper)
}

/** 卡面篇章进度中已完成的步块数（当前步即末块，与卡面一致） */
function completedSteps(wrapper: AppWrapper) {
  return wrapper.get(chapterProgressSelector).findAll('.step-block.completed').length
}

/** 走完天启七年八步「宫门定策」，停在器院立局第 1 步 */
async function enterChapter(wrapper: AppWrapper) {
  await wrapper.findAll('button').find((button) => button.text() === '入宫即位')!.trigger('click')
  for (const [index, side] of WEI_SIDES.entries()) {
    expect(wrapper.get('h2').text()).toBe(WEI_TITLES[index])
    expect(wrapper.get(chapterProgressSelector).get('.chapter-name').text()).toBe('宫门定策')
    expect(wrapper.get(chapterProgressSelector).findAll('.step-block')).toHaveLength(8)
    expect(completedSteps(wrapper)).toBe(index + 1)
    await clickChoice(wrapper, side)
  }
  expect(wrapper.get('h2').text()).toBe('给器物一个衙门')
  expect(wrapper.get(chapterProgressSelector).get('.chapter-name').text()).toBe('器院立局')
}

beforeEach(() => {
  seedRandom(2026)
  vi.useFakeTimers()
  localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

it('当点击入宫并走完八步宫门定策时，页面跨年进入器院立局且出现过革新入口', async () => {
  const wrapper = mount(App)
  try {
    expect(wrapper.text()).toContain('崇祯十七年')
    expect(wrapper.text()).toContain('入宫即位')
    await wrapper.findAll('button').find((button) => button.text() === '入宫即位')!.trigger('click')
    for (const title of ['君威 50', '法度 40', '军心 45', '国库 35']) {
      expect(wrapper.find(`[title="${title}"]`).exists()).toBe(true)
    }
    const seen = new Set<string>()
    for (const [index, side] of WEI_SIDES.entries()) {
      seen.add(wrapper.get('h2').text())
      await flyChoice(wrapper, side)
      // 议次不再在决策页顶栏，而随批红页给出：前五议在天启七年，后三议跨入崇祯元年
      const [year, turn] = index < CARDS_PER_YEAR
        ? ['天启七年（1627）', index + 1]
        : ['崇祯元年（1628）', index + 1 - CARDS_PER_YEAR]
      expect(wrapper.get(verdictSelector).text()).toContain(`${year} 第 ${turn} / ${CARDS_PER_YEAR} 议`)
      await readVerdict(wrapper)
    }
    expect(seen.size).toBe(8)
    expect(wrapper.get('h2').text()).toBe('给器物一个衙门')
    expect(wrapper.get('header').text()).toContain('西元 1628')
    expect(wrapper.get(chapterProgressSelector).get('.chapter-name').text()).toBe('器院立局')
  } finally {
    wrapper.unmount()
  }
})

it('当打开人物弹窗时，方向键不会裁决卡片，关闭后仍可继续', async () => {
  const wrapper = mount(App)
  try {
    await wrapper.findAll('button').find((button) => button.text() === '入宫即位')!.trigger('click')
    const title = wrapper.get('h2').text()
    await wrapper.findAll('.char-link').find((el) => el.text() === '魏忠贤')!.trigger('click')
    expect(wrapper.get('button[aria-label="关闭"]').isVisible()).toBe(true)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.get('h2').text()).toBe(title)
    expect(wrapper.find(verdictSelector).exists()).toBe(false)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('button[aria-label="关闭"]').exists()).toBe(false)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.find(verdictSelector).exists()).toBe(true)
    await readVerdict(wrapper)
    expect(wrapper.get('h2').text()).not.toBe(title)
  } finally {
    wrapper.unmount()
  }
})

it('当点击进入器院立局时，卡面常驻显示篇章名称与步数且不提供退出', async () => {
  const wrapper = mount(App)
  try {
    expect(wrapper.find(chapterProgressSelector).exists()).toBe(false)
    await enterChapter(wrapper)
    const progress = wrapper.get(chapterProgressSelector)
    expect(progress.isVisible()).toBe(true)
    expect(progress.get('.chapter-name').text()).toBe('器院立局')
    expect(progress.findAll('.step-block')).toHaveLength(4)
    expect(completedSteps(wrapper)).toBe(1)
    expect(progress.find('button').exists()).toBe(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(2)
    expect(wrapper.get('h2').text()).toBe('给器物一个衙门')
    expect(wrapper.get('header').text()).toContain('西元 1628')
    expect(wrapper.get(cardBodySelector).text().length).toBeGreaterThan(0)
    expect(wrapper.get('footer').findAll('button')).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(5000)
    expect(completedSteps(wrapper)).toBe(1)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.get(chapterProgressSelector).isVisible()).toBe(true)
    expect(wrapper.get('h2').text()).toBe('给器物一个衙门')
  } finally {
    wrapper.unmount()
  }
})

it('当连续篇章跨年时，每次点击占一议且篇章步数不会重置', async () => {
  const wrapper = mount(App)
  try {
    await enterChapter(wrapper)
    for (const { side, step, when, ad } of [
      { side: 0, step: 2, when: '崇祯元年（1628） 第 4 / 5 议', ad: 1628 },
      { side: 1, step: 3, when: '崇祯元年（1628） 第 5 / 5 议', ad: 1629 },
      { side: 0, step: 4, when: '崇祯二年（1629） 第 1 / 5 议', ad: 1629 },
    ] as const) {
      const previousTitle = wrapper.get('h2').text()
      await flyChoice(wrapper, side)
      expect(wrapper.get(verdictSelector).text()).toContain(when)
      await readVerdict(wrapper)
      expect(wrapper.get(chapterProgressSelector).get('.chapter-name').text()).toBe('器院立局')
      expect(completedSteps(wrapper)).toBe(step)
      expect(wrapper.get('header').text()).toContain(`西元 ${ad}`)
      expect(wrapper.get('h2').text()).not.toBe(previousTitle)
    }
  } finally {
    wrapper.unmount()
  }
})

it.each([0, 1] as const)('当器院首步选择第 %s 侧时，四步收束不残留旧篇章，返回日常时卡面进度消失', async (firstSide) => {
  const game = gameModule.useGame()
  vi.spyOn(gameModule, 'useGame').mockReturnValue(game)
  const wrapper = mount(App)
  try {
    await enterChapter(wrapper)
    for (const [index, side] of ([firstSide, 1, 0, 1] as const).entries()) {
      expect(completedSteps(wrapper)).toBe(index + 1)
      await clickChoice(wrapper, side)
    }
    expect(wrapper.get('header').text()).toContain('西元 1629')
    expect(game.isOver.value).toBe(false)
    expect(game.chapter.value).toBeNull()
    expect(wrapper.find(chapterProgressSelector).exists()).toBe(false)
    expect(wrapper.get('h2').text()).not.toBe('给器物一个衙门')
    expect(wrapper.get('footer').findAll('button')).toHaveLength(2)
  } finally {
    wrapper.unmount()
  }
})

it('当篇章内飞牌期间连续点击或按键时，只提交当前一步', async () => {
  const game = gameModule.useGame()
  vi.spyOn(gameModule, 'useGame').mockReturnValue(game)
  const wrapper = mount(App)
  try {
    await enterChapter(wrapper)
    const buttons = wrapper.get('footer').findAll('button')
    await buttons[0].trigger('click')
    await vi.advanceTimersByTimeAsync(100)
    await buttons[1].trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    expect(game.decisions.value).toHaveLength(9)
    expect(wrapper.get(verdictSelector).text()).toContain('给器物一个衙门')
    await readVerdict(wrapper)
    expect(completedSteps(wrapper)).toBe(2)
    expect(wrapper.get('header').text()).toContain('西元 1628')
    expect(wrapper.get('h2').text()).toBe('器院的钱给谁看')
  } finally {
    wrapper.unmount()
  }
})

it('当篇章中死亡后点击重开时，会清空篇章且再次进入从第一步开始', async () => {
  // 复用真实引擎，仅把国库置于死亡边界，死亡与重开仍由页面点击触发。
  const game = gameModule.useGame()
  vi.spyOn(gameModule, 'useGame').mockReturnValue(game)
  const wrapper = mount(App)
  try {
    await enterChapter(wrapper)
    expect(completedSteps(wrapper)).toBe(1)
    game.resources.value.gold = 1
    await clickChoice(wrapper, 0)
    expect(wrapper.get('h2').text()).toBe('饷竭国空')
    expect(wrapper.find(chapterProgressSelector).exists()).toBe(false)
    expect(game.chapter.value).toBeNull()
    await wrapper.findAll('button').find((button) => button.text() === '再着龙袍')!.trigger('click')
    expect(wrapper.get(chapterProgressSelector).get('.chapter-name').text()).toBe('宫门定策')
    expect(completedSteps(wrapper)).toBe(1)
    expect(game.chapter.value).toEqual({ id: 'wei', name: '宫门定策', step: 1, total: 8 })
    expect(wrapper.get('h2').text()).toBe('捧玺入宫')
    expect(wrapper.get('header').text()).toContain('西元 1627')
    for (const title of ['君威 50', '法度 40', '军心 45', '国库 35']) {
      expect(wrapper.find(`[title="${title}"]`).exists()).toBe(true)
    }
    for (const side of [0, 0, 1] as const) await clickChoice(wrapper, side)
    expect(wrapper.get(chapterProgressSelector).get('.chapter-name').text()).toBe('宫门定策')
    expect(completedSteps(wrapper)).toBe(4)
    expect(wrapper.get('h2').text()).toBe('客氏出宫')
    expect(wrapper.get('header').text()).toContain('西元 1627')
  } finally {
    wrapper.unmount()
  }
})

it('当篇章中查看人物并按方向键时，不推进卡片、年度议次或篇章，关闭后仍可继续', async () => {
  const wrapper = mount(App)
  try {
    await enterChapter(wrapper)
    const title = wrapper.get('h2').text()
    const hud = wrapper.get('header').text()
    const progress = wrapper.get(chapterProgressSelector).text()
    await wrapper.findAll('.char-link').find((el) => el.text() === '徐光启')!.trigger('click')
    expect(wrapper.get('button[aria-label="关闭"]').isVisible()).toBe(true)
    expect(wrapper.text()).toContain('已亲历之事')
    for (const key of ['ArrowLeft', 'ArrowRight']) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key }))
      await vi.advanceTimersByTimeAsync(300)
      expect(wrapper.get('h2').text()).toBe(title)
      expect(wrapper.get('header').text()).toBe(hud)
      expect(wrapper.get(chapterProgressSelector).text()).toBe(progress)
    }
    await wrapper.get('button[aria-label="关闭"]').trigger('click')
    expect(wrapper.find('button[aria-label="关闭"]').exists()).toBe(false)
    expect(wrapper.get(chapterProgressSelector).text()).toBe(progress)
    expect(wrapper.get('h2').text()).toBe(title)
    await clickChoice(wrapper, 0)
    expect(completedSteps(wrapper)).toBe(2)
    expect(wrapper.get('header').text()).toContain('西元 1628')
    expect(wrapper.get('h2').text()).toBe('器院的钱给谁看')
  } finally {
    wrapper.unmount()
  }
})

it.each([
  {
    label: '反复催征',
    sides: [0, 1, 1, 1],
    names: ['国用积弊·旧欠与新饷', '国用积弊·逃户的税给谁', '国用积弊·旧额压在荒田上', '国用积弊·饷逼税，税逼民'],
  },
  {
    label: '偿欠止损',
    sides: [1, 0, 0, 0],
    names: ['国用积弊·旧欠与新饷', '国用积弊·欠饷滚进新年', '国用积弊·补欠不等于足饷', '国用积弊·公账接续，才有余地'],
  },
] as const)('当点击走过$label路线时，页面跨年显示对应积弊后果与批复，不冒充连续篇章', async ({ sides, names }) => {
  const game = gameModule.useGame()
  vi.spyOn(gameModule, 'useGame').mockReturnValue(game)
  const wrapper = mount(App)
  try {
    await wrapper.findAll('button').find(button => button.text() === '入宫即位')!.trigger('click')
    for (const [step, slot] of [12, 18, 21, 38].entries()) {
      reach(game, slot, progressSide)
      game.resources.value = healthy()
      await nextTick()
      expect(wrapper.get('h2').text()).toBe(names[step])
      expect(wrapper.get('header').text()).toContain(`西元 ${1627 + Math.floor(slot / CARDS_PER_YEAR)}`)
      expect(wrapper.find(chapterProgressSelector).exists()).toBe(false)
      const card = game.currentCard.value!
      expect(wrapper.get(cardBodySelector).text()).toBe(card.text)
      const side = sides[step] === 0 ? 'left' : 'right'
      expect(wrapper.get('footer').findAll('button')[sides[step]].text()).toContain(card[side].label)
      await flyChoice(wrapper, sides[step])
      expect(game.decisions.value).toHaveLength(slot + 1)
      const sheet = wrapper.get(verdictSelector)
      expect(sheet.text()).toContain(names[step])
      expect(sheet.text()).toContain(card[side].response)
      expect(sheet.find(cardBodySelector).exists()).toBe(false)
      // 民心不设水牌也不进批红账目：只验其水位已按抉择结算；四象净变化见批红页账目
      expect(game.resources.value.people).toBe(80 + (card[side].effects.people ?? 0))
      await readVerdict(wrapper)
    }
  } finally {
    wrapper.unmount()
  }
})

it('当批红独立成页时，本议批复与国势净变化同页显示，下一问要读完才出现', async () => {
  const game = gameModule.useGame()
  vi.spyOn(gameModule, 'useGame').mockReturnValue(game)
  const wrapper = mount(App)
  try {
    await enterChapter(wrapper)
    const card = game.currentCard.value!
    expect(card.name).toBe('给器物一个衙门')
    const before = { ...game.resources.value }
    await flyChoice(wrapper, 0)
    const sheet = wrapper.get(verdictSelector)
    const view = game.verdict.value!
    expect(sheet.text()).toContain('批红')
    expect(sheet.text()).toContain(card.name)
    expect(sheet.text()).toContain(card.left.label)
    expect(sheet.text()).toContain(card.left.response)
    expect(sheet.text()).toContain(`崇祯元年（1628） 第 4 / ${CARDS_PER_YEAR} 议`)
    expect(sheet.text()).toContain('器院立局 第 1 / 4 步已定')
    expect(sheet.findAll('li')).toHaveLength(view.lines.length)
    for (const line of view.lines) {
      expect(line.from).toBe(before[line.key])
      expect(sheet.text()).toContain(`${line.from} → ${line.to}`)
    }
    expect(wrapper.find(cardBodySelector).exists()).toBe(false)
    expect(wrapper.find(chapterProgressSelector).exists()).toBe(false)
    expect(wrapper.find('footer').exists()).toBe(false)
    await readVerdict(wrapper)
    expect(wrapper.find(verdictSelector).exists()).toBe(false)
    expect(wrapper.get(cardBodySelector).text()).toBe(game.currentCard.value!.text)
    expect(completedSteps(wrapper)).toBe(2)
  } finally {
    wrapper.unmount()
  }
})

it('当批红页上按方向键或回车时，只翻回决策页不裁决下一问', async () => {
  const game = gameModule.useGame()
  vi.spyOn(gameModule, 'useGame').mockReturnValue(game)
  const wrapper = mount(App)
  try {
    await wrapper.findAll('button').find((button) => button.text() === '入宫即位')!.trigger('click')
    await flyChoice(wrapper, 0)
    expect(game.decisions.value).toHaveLength(1)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await nextTick()
    expect(game.decisions.value).toHaveLength(1)
    expect(wrapper.find(verdictSelector).exists()).toBe(false)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await vi.advanceTimersByTimeAsync(300)
    expect(game.decisions.value).toHaveLength(2)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await nextTick()
    expect(wrapper.find(verdictSelector).exists()).toBe(false)
    expect(game.decisions.value).toHaveLength(2)
  } finally {
    wrapper.unmount()
  }
})

it('当这一议致死时，批红页先给出后果与归零国势，读完才见结局', async () => {
  const game = gameModule.useGame()
  vi.spyOn(gameModule, 'useGame').mockReturnValue(game)
  const wrapper = mount(App)
  try {
    await enterChapter(wrapper)
    game.resources.value.gold = 1
    await nextTick()
    const card = game.currentCard.value!
    await flyChoice(wrapper, 0)
    expect(game.isOver.value).toBe(true)
    const sheet = wrapper.get(verdictSelector)
    expect(sheet.text()).toContain(card.left.response)
    expect(sheet.text()).toContain('国库 1 → 0')
    expect(sheet.get('button').text()).toBe('看结局')
    expect(wrapper.text()).not.toContain('再着龙袍')
    await readVerdict(wrapper)
    expect(wrapper.get('h2').text()).toBe('饷竭国空')
    expect(wrapper.text()).toContain('再着龙袍')
  } finally {
    wrapper.unmount()
  }
})

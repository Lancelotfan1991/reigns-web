// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../../src/App.vue'
import * as gameModule from '../../src/composables/useGame'
import { seedRandom } from '../game/helpers'

type AppWrapper = ReturnType<typeof mount<typeof App>>
const chapterSelector = '[role="status"][aria-label="连续篇章进度"]'

async function clickChoice(wrapper: AppWrapper, side: 0 | 1) {
  await wrapper.get('footer').findAll('button')[side].trigger('click')
  await vi.advanceTimersByTimeAsync(300)
  await nextTick()
}

async function enterChapter(wrapper: AppWrapper) {
  await wrapper.findAll('button').find((button) => button.text() === '入宫即位')!.trigger('click')
  for (const side of [0, 0, 1] as const) {
    expect(wrapper.find(chapterSelector).exists()).toBe(false)
    await clickChoice(wrapper, side)
  }
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

it('当点击入宫并裁决五次时，页面显示下一年第一议且出现过革新入口', async () => {
  const wrapper = mount(App)
  try {
    expect(wrapper.text()).toContain('每年 5 次抉择')
    expect(wrapper.text()).toContain('本局事件绝不重复')
    expect(wrapper.text()).toContain('越高越稳，满格不会亡国')
    expect(wrapper.text()).toContain('南渡通常需要民心至少 45')
    expect(wrapper.text()).toContain('提前准备可降低门槛')
    await wrapper.findAll('button').find((button) => button.text() === '入宫即位')!.trigger('click')
    const seen = new Set<string>()
    for (const [index, side] of [0, 0, 1, 0, 1].entries()) {
      expect(wrapper.text()).toContain(`第 ${index + 1} / 5 议`)
      seen.add(wrapper.find('h2').text())
      const buttons = wrapper.find('footer').findAll('button')
      await buttons[side].trigger('click')
      await vi.advanceTimersByTimeAsync(300)
      await nextTick()
    }
    expect(seen.size).toBe(5)
    expect(seen.has('给器物一个衙门')).toBe(true)
    expect(wrapper.text()).toContain('西元 1628')
    expect(wrapper.text()).toContain('第 1 / 5 议')
  } finally {
    wrapper.unmount()
  }
})

it('当打开人物面板时，方向键不会裁决卡片，关闭后仍可继续', async () => {
  const wrapper = mount(App)
  try {
    await wrapper.findAll('button').find((button) => button.text() === '入宫即位')!.trigger('click')
    const title = wrapper.find('h2').text()
    await wrapper.findAll('button').find((button) => button.text().includes('朝中人物'))!.trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.find('h2').text()).toBe(title)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.find('h2').text()).not.toBe(title)
  } finally {
    wrapper.unmount()
  }
})

it('当点击进入器院立局时，会常驻显示连续篇章名称、步数和完成要求且不提供退出', async () => {
  const wrapper = mount(App)
  try {
    expect(wrapper.find(chapterSelector).exists()).toBe(false)
    await enterChapter(wrapper)
    const banner = wrapper.get(chapterSelector)
    expect(banner.isVisible()).toBe(true)
    expect(banner.text()).toContain('连续篇章')
    expect(banner.text()).toContain('器院立局')
    expect(banner.text()).toContain('第 1 / 4 步')
    expect(banner.text()).toContain('须完成本篇章全部抉择，方可返回日常政务。')
    expect(banner.find('button').exists()).toBe(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(3)
    expect(wrapper.get('h2').text()).toBe('给器物一个衙门')
    expect(wrapper.get('header').text()).toContain('西元 1627')
    expect(wrapper.get('header').text()).toContain('第 4 / 5 议')
    expect(wrapper.get('[aria-label="塘报正文，可上下滚动"]').text().length).toBeGreaterThan(0)
    expect(wrapper.get('footer').findAll('button')).toHaveLength(2)
    const progress = banner.text()
    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.get(chapterSelector).text()).toBe(progress)
    expect(wrapper.get(chapterSelector).text()).toContain('第 1 / 4 步')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.get(chapterSelector).isVisible()).toBe(true)
  } finally {
    wrapper.unmount()
  }
})

it('当连续篇章跨年时，每次点击占一议且篇章步数不会重置', async () => {
  const wrapper = mount(App)
  try {
    await enterChapter(wrapper)
    for (const { side, step, year, turn } of [
      { side: 0, step: 2, year: 1627, turn: 5 },
      { side: 1, step: 3, year: 1628, turn: 1 },
      { side: 0, step: 4, year: 1628, turn: 2 },
    ] as const) {
      const previousTitle = wrapper.get('h2').text()
      await clickChoice(wrapper, side)
      expect(wrapper.get(chapterSelector).text()).toContain('器院立局')
      expect(wrapper.get(chapterSelector).text()).toContain(`第 ${step} / 4 步`)
      expect(wrapper.get('header').text()).toContain(`西元 ${year}`)
      expect(wrapper.get('header').text()).toContain(`第 ${turn} / 5 议`)
      expect(wrapper.get('h2').text()).not.toBe(previousTitle)
    }
  } finally {
    wrapper.unmount()
  }
})

it.each([0, 1] as const)('当首步选择第 %s 侧时，四步收束不残留旧篇章，返回日常时横条消失', async (firstSide) => {
  const game = gameModule.useGame()
  vi.spyOn(gameModule, 'useGame').mockReturnValue(game)
  const wrapper = mount(App)
  try {
    await enterChapter(wrapper)
    for (const [index, side] of ([firstSide, 1, 0, 1] as const).entries()) {
      expect(wrapper.get(chapterSelector).text()).toContain(`第 ${index + 1} / 4 步`)
      await clickChoice(wrapper, side)
    }
    expect(wrapper.get('header').text()).toContain('西元 1628')
    expect(wrapper.get('header').text()).toContain('第 3 / 5 议')
    expect(game.isOver.value).toBe(false)
    expect(game.chapter.value).toBeNull()
    expect(wrapper.find(chapterSelector).exists()).toBe(false)
    expect(wrapper.text()).not.toContain('须完成本篇章全部抉择，方可返回日常政务。')
    expect(wrapper.get('h2').text()).not.toBe('给器物一个衙门')
    expect(wrapper.get('footer').findAll('button')).toHaveLength(2)
  } finally {
    wrapper.unmount()
  }
})

it('当篇章内飞牌期间连续点击或按键时，只提交当前一步', async () => {
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
    expect(wrapper.get(chapterSelector).text()).toContain('第 2 / 4 步')
    expect(wrapper.get('header').text()).toContain('第 5 / 5 议')
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
    expect(wrapper.get(chapterSelector).text()).toContain('第 1 / 4 步')
    game.resources.value.gold = 1
    await clickChoice(wrapper, 0)
    expect(wrapper.get('h2').text()).toBe('饷竭国空')
    expect(wrapper.find(chapterSelector).exists()).toBe(false)
    expect(game.chapter.value).toBeNull()
    await wrapper.findAll('button').find((button) => button.text() === '再着龙袍')!.trigger('click')
    expect(wrapper.find(chapterSelector).exists()).toBe(false)
    expect(game.chapter.value).toBeNull()
    expect(wrapper.get('h2').text()).toBe('天启帝托孤')
    expect(wrapper.get('header').text()).toContain('西元 1627')
    expect(wrapper.get('header').text()).toContain('第 1 / 5 议')
    for (const side of [0, 0, 1] as const) await clickChoice(wrapper, side)
    expect(wrapper.get(chapterSelector).text()).toContain('器院立局')
    expect(wrapper.get(chapterSelector).text()).toContain('第 1 / 4 步')
    expect(wrapper.get('header').text()).toContain('第 4 / 5 议')
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
    const progress = wrapper.get(chapterSelector).text()
    await wrapper.findAll('button').find((button) => button.text().includes('朝中人物'))!.trigger('click')
    expect(wrapper.get('button[aria-label="关闭"]').isVisible()).toBe(true)
    const emperor = wrapper.findAll('article').find((row) => row.text().includes('朱由检'))!
    await emperor.get('button').trigger('click')
    expect(emperor.text()).toContain('已亲历之事')
    for (const key of ['ArrowLeft', 'ArrowRight']) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key }))
      await vi.advanceTimersByTimeAsync(300)
      expect(wrapper.get('h2').text()).toBe(title)
      expect(wrapper.get('header').text()).toBe(hud)
      expect(wrapper.get(chapterSelector).text()).toBe(progress)
    }
    await wrapper.get('button[aria-label="关闭"]').trigger('click')
    expect(wrapper.find('button[aria-label="关闭"]').exists()).toBe(false)
    expect(wrapper.get(chapterSelector).text()).toBe(progress)
    expect(wrapper.get('h2').text()).toBe(title)
    await clickChoice(wrapper, 0)
    expect(wrapper.get(chapterSelector).text()).toContain('第 2 / 4 步')
    expect(wrapper.get('header').text()).toContain('第 5 / 5 议')
  } finally {
    wrapper.unmount()
  }
})

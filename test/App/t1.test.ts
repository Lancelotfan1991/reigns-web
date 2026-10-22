// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../../src/App.vue'
import * as gameModule from '../../src/composables/useGame'
import { seedRandom } from '../game/helpers'

type AppWrapper = ReturnType<typeof mount<typeof App>>
const verdictSelector = '[aria-label="本议批红"]'

/** 从首页入宫：读完信邸序幕四页，进入宫门定策第一牌 */
async function enterGame(wrapper: AppWrapper) {
  await wrapper.findAll('button').find((button) => button.text() === '入宫即位')!.trigger('click')
  for (let index = 0; index < 4; index += 1) {
    await wrapper.get('.prologue-choice.left').trigger('click')
    await wrapper.get('.prologue-next').trigger('click')
    await nextTick()
  }
}

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

it('当打开人物弹窗时，方向键不会裁决卡片，关闭后仍可继续', async () => {
  const wrapper = mount(App)
  try {
    await enterGame(wrapper)
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

it('当批红页上按方向键或回车时，只翻回决策页不裁决下一问', async () => {
  const game = gameModule.useGame()
  vi.spyOn(gameModule, 'useGame').mockReturnValue(game)
  const wrapper = mount(App)
  try {
    await enterGame(wrapper)
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

// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../../src/App.vue'
import { seedRandom } from '../game/helpers'

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

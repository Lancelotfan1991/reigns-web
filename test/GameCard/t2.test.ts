// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GameCard from '../../src/components/GameCard.vue'
import { REFORM_EVENTS } from '../../src/data/reforms'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'setPointerCapture').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('当水平拖动越过阈值时，会裁决一次而非重复提交', async () => {
  const wrapper = mount(GameCard, { props: { event: REFORM_EVENTS[0], interactive: true } })
  try {
    await wrapper.trigger('pointerdown', { clientX: 160, clientY: 200, pointerId: 1 })
    await wrapper.trigger('pointermove', { clientX: 40, clientY: 205, pointerId: 1 })
    await wrapper.trigger('pointerup')
    await wrapper.trigger('pointerup')
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.emitted('choose')).toEqual([['left']])
  } finally {
    wrapper.unmount()
  }
})

it.each(['pointercancel', 'vertical'] as const)('当手势为%s时，不会误把阅读操作作为裁决', async (gesture) => {
  const wrapper = mount(GameCard, { props: { event: REFORM_EVENTS[0], interactive: true } })
  try {
    await wrapper.trigger('pointerdown', { clientX: 160, clientY: 300, pointerId: 1 })
    await wrapper.trigger('pointermove', { clientX: 260, clientY: gesture === 'vertical' ? 100 : 300, pointerId: 1 })
    await wrapper.trigger(gesture === 'pointercancel' ? 'pointercancel' : 'pointerup')
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.emitted('choose')).toBeUndefined()
  } finally {
    wrapper.unmount()
  }
})

it('当拖动未达到阈值时，会留在当前卡片', async () => {
  const wrapper = mount(GameCard, { props: { event: REFORM_EVENTS[0], interactive: true } })
  try {
    await wrapper.trigger('pointerdown', { clientX: 160, clientY: 200, pointerId: 1 })
    await wrapper.trigger('pointermove', { clientX: 200, clientY: 200, pointerId: 1 })
    await wrapper.trigger('pointerup')
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.emitted('choose')).toBeUndefined()
  } finally {
    wrapper.unmount()
  }
})

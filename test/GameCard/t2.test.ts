// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GameCard from '../../src/components/GameCard.vue'
import { ALL_EVENTS } from '../../src/data/chapters'
import { Side } from '../../src/types'

const card = ALL_EVENTS.find((event) => event.id === 'g-institute')!

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'setPointerCapture').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('当水平拖动越过阈值时，会裁决一次而非重复提交', async () => {
  const wrapper = mount(GameCard, { props: { event: card, interactive: true } })
  try {
    await wrapper.trigger('pointerdown', { clientX: 160, clientY: 200, pointerId: 1 })
    await wrapper.trigger('pointermove', { clientX: 40, clientY: 205, pointerId: 1 })
    await wrapper.trigger('pointerup')
    await wrapper.trigger('pointerup')
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.emitted('choose')).toEqual([[Side.Left]])
  } finally {
    wrapper.unmount()
  }
})

it.each(['pointercancel', 'vertical'] as const)('当手势为%s时，不会误把阅读操作作为裁决', async (gesture) => {
  const wrapper = mount(GameCard, { props: { event: card, interactive: true } })
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
  const wrapper = mount(GameCard, { props: { event: card, interactive: true } })
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

it('判定卡在卡面写明两侧的阻力来源与成功率，不用判定的例行选项明确标出', () => {
  const wrapper = mount(GameCard, {
    props: {
      event: card,
      interactive: true,
      checkPreviews: {
        left: { kind: '整顿', obstacle: '东江镇', difficulty: 2, chance: 58 },
        right: null,
      },
    },
  })
  try {
    const chips = wrapper.findAll('.check-chip')
    expect(chips).toHaveLength(2)
    expect(chips[0].text()).toContain('整顿')
    expect(chips[0].text()).toContain('阻力：东江镇')
    expect(chips[0].text()).toContain('顺利办成 58%')
    expect(chips[1].text()).toContain('不用判定')
    expect(chips[1].classes()).toContain('muted')
  } finally {
    wrapper.unmount()
  }
})

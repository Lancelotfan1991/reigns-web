// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../../src/App.vue'

afterEach(() => {
  vi.useRealTimers()
})

it('从头开局时，先出扉页，数秒后进入苏醒页，再推门入宫', async () => {
  vi.useFakeTimers()
  const wrapper = mount(App)
  try {
    await wrapper.findAll('button').find((button) => button.text() === '入宫即位')!.trigger('click')
    expect(wrapper.get('.epigraph p').text()).toBe('皇帝，是历史的囚徒。')
    expect(wrapper.findAll('.epigraph p')).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(3300)
    await nextTick()
    expect(wrapper.find('.awakening').exists()).toBe(true)
    expect(wrapper.get('.awakening').text()).toContain('一切都结束了吗')
    expect(wrapper.get('.awakening').text()).toContain('藩王常服')

    await wrapper.get('.awakening .enter').trigger('click')
    await nextTick()
    expect(wrapper.get('h2').text()).toBe('病榻托孤')
  } finally {
    wrapper.unmount()
  }
})

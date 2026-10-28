// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EmperorPanel from '../../src/components/EmperorPanel.vue'
import { EMPEROR_INITIAL, EMPEROR_RESOURCES } from '../../src/data/emperor'

it('御前面板单独显示威望、国力、民心，不混入人物卡', () => {
  const wrapper = mount(EmperorPanel)
  try {
    expect(wrapper.get('h1').text()).toBe('御前')
    expect(wrapper.findAll('.resource-card')).toHaveLength(3)
    expect(wrapper.findAll('.resource-title h2').map((node) => node.text())).toEqual([
      '政治威望',
      '综合国力',
      '民心',
    ])
    expect(wrapper.findAll('.resource-value').map((node) => node.text())).toEqual([
      String(EMPEROR_INITIAL.prestige),
      String(EMPEROR_INITIAL.strength),
      String(EMPEROR_INITIAL.support),
    ])
    expect(wrapper.findAll('.char-card')).toHaveLength(0)
    expect(wrapper.text()).toContain(EMPEROR_RESOURCES[0].zero)
  } finally {
    wrapper.unmount()
  }
})

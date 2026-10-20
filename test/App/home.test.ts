// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'

it('首页提供皇舆图、战事与民变、灾难卡、人物志、改革方案五个路由入口', () => {
  const wrapper = mount(App)
  try {
    const cards = wrapper.findAll('.route-card')
    expect(cards.map((card) => card.get('b').text())).toEqual([
      '皇舆图',
      '战事与民变',
      '灾难卡',
      '人物志',
      '改革方案',
    ])
    expect(wrapper.findAll('.route-mark').map((mark) => mark.text())).toEqual(['舆', '兵', '灾', '人', '政'])
  } finally {
    wrapper.unmount()
  }
})

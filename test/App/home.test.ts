// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'

it('首页提供皇舆图、灾难卡、人物志三个路由入口', () => {
  const wrapper = mount(App)
  try {
    const cards = wrapper.findAll('.route-card')
    expect(cards.map((card) => card.get('b').text())).toEqual(['皇舆图', '灾难卡', '人物志'])
    expect(wrapper.findAll('.route-mark').map((mark) => mark.text())).toEqual(['舆', '灾', '人'])
  } finally {
    wrapper.unmount()
  }
})

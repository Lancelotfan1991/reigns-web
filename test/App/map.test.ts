// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MapPage from '../../src/components/MapPage.vue'

it('当点按省份与编年时，舆图面板显示对应形势，九边可隐藏', async () => {
  const wrapper = mount(MapPage)
  try {
    expect(wrapper.get('.masthead h1').text()).toBe('皇舆图')

    await wrapper.get('[aria-label="查看陕西形势"]').trigger('click')
    expect(wrapper.get('.panel-title').text()).toBe('陕西')
    expect(wrapper.get('.panel-kicker').text()).toContain('西安府')
    expect(wrapper.findAll('.facts li')).toHaveLength(3)
    expect(wrapper.find('.panel').classes()).toContain('floating')

    const ningjin = wrapper
      .findAll('.chronicle button')
      .find((button) => button.text().includes('宁锦之战'))
    expect(ningjin).toBeTruthy()
    await ningjin!.trigger('click')
    expect(wrapper.get('.panel-title').text()).toBe('宁锦之战')
    expect(wrapper.get('.event-pin.on .pin-name').text()).toBe('锦州')

    await wrapper.get('.panel-close').trigger('click')
    expect(wrapper.find('.panel-title').text()).toBe('天下形势')

    await wrapper.get('.layers button:nth-child(2)').trigger('click')
    expect(wrapper.find('.wall').exists()).toBe(false)
    expect(wrapper.find('.frontiers').exists()).toBe(false)
  } finally {
    wrapper.unmount()
  }
})

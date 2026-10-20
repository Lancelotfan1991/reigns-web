// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CharacterPage from '../../src/components/CharacterPage.vue'

it('当打开人物志时，显示人物筛选、名册，并可展开小传', async () => {
  const wrapper = mount(CharacterPage)
  try {
    expect(wrapper.get('.masthead h1').text()).toBe('人物志')
    expect(wrapper.findAll('.filters button').length).toBeGreaterThan(1)
    expect(wrapper.findAll('.row').length).toBeGreaterThan(10)

    const first = wrapper.get('.head')
    await first.trigger('click')
    expect(wrapper.find('.detail').exists()).toBe(true)
    expect(wrapper.get('.detail .bio').text().length).toBeGreaterThan(0)
  } finally {
    wrapper.unmount()
  }
})

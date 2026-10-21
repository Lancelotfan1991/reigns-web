// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CharacterPage from '../../src/components/CharacterPage.vue'

it('当打开人物志时，卡墙按登场与否分列，未登场卡不露才具', () => {
  const wrapper = mount(CharacterPage)
  try {
    expect(wrapper.get('.masthead h1').text()).toBe('人物志')
    expect(wrapper.findAll('.filters button').length).toBeGreaterThan(1)

    const cards = wrapper.findAll('.char-card')
    expect(cards.length).toBeGreaterThan(10)

    const appeared = wrapper.findAll('.char-card:not(.dim)')
    expect(appeared.length).toBeGreaterThan(0)
    for (const card of appeared) expect(card.findAll('.stat').length).toBe(5)

    expect(wrapper.findAll('.char-card.dim').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.char-card.dim .stat').length).toBe(0)
  } finally {
    wrapper.unmount()
  }
})

it('当点开人物卡时，详情显示五维才具、所长与性情', async () => {
  const wrapper = mount(CharacterPage)
  try {
    await wrapper.get('.char-card:not(.dim)').trigger('click')

    expect(wrapper.find('.sheet').exists()).toBe(true)
    expect(wrapper.findAll('.sheet .stats li').length).toBe(5)
    expect(wrapper.get('.sheet .stats').text()).toContain('军事')
    expect(wrapper.get('.sheet .duo').text()).toContain('所长')
    expect(wrapper.get('.sheet .duo').text()).toContain('性情')

    await wrapper.get('.sheet .close').trigger('click')
    expect(wrapper.find('.sheet').exists()).toBe(false)
  } finally {
    wrapper.unmount()
  }
})

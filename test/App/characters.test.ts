// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CharacterPage from '../../src/components/CharacterPage.vue'
import { CHARACTERS } from '../../src/data/characters'

it('当从人物路由进入时，全部人物直接解锁并登场', () => {
  const wrapper = mount(CharacterPage)
  try {
    expect(wrapper.get('.masthead h1').text()).toBe('人物志')
    expect(wrapper.findAll('.filters button').length).toBe(6)

    const cards = wrapper.findAll('.char-card')
    expect(cards.length).toBe(CHARACTERS.length)
    expect(wrapper.findAll('.char-card.dim').length).toBe(0)
    expect(wrapper.findAll('.char-card .radar').length).toBe(CHARACTERS.length)
    expect(wrapper.find('.sep').exists()).toBe(false)
    expect(wrapper.get('.ph-meta').text()).toContain(`共 ${CHARACTERS.length} 人`)
    expect(wrapper.get('.lede').text()).toContain('人物尽数在册')

    const unborn = cards.find((card) => card.get('.nm').text() === '朱慈烺')
    expect(unborn).toBeDefined()
    expect(unborn!.find('.age').exists()).toBe(false)
  } finally {
    wrapper.unmount()
  }
})

it('当点开人物卡时，详情显示五维才具、所长与性情', async () => {
  const wrapper = mount(CharacterPage)
  try {
    await wrapper.get('.char-card').trigger('click')

    expect(wrapper.find('.sheet').exists()).toBe(true)
    expect(wrapper.findAll('.sheet .radar').length).toBe(1)
    expect(wrapper.get('.sheet .radar').attributes('aria-label')).toContain('军事')
    expect(wrapper.get('.sheet .duo').text()).toContain('所长')
    expect(wrapper.get('.sheet .duo').text()).toContain('性情')

    await wrapper.get('.sheet .close').trigger('click')
    expect(wrapper.find('.sheet').exists()).toBe(false)
  } finally {
    wrapper.unmount()
  }
})

// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ReformPage from '../../src/components/ReformPage.vue'
import { REFORM_BROWSE_DATA } from '../../src/data/reformBrowse'

it('打开改革后按卡轮播：编号、翻页、圆点跳转与触摸滑动均正确', async () => {
  const wrapper = mount(ReformPage)
  try {
    const reform = REFORM_BROWSE_DATA[0]
    await wrapper.findAll('.reform-card')[0].trigger('click')

    const slides = wrapper.findAll('.carousel-slide')
    expect(slides).toHaveLength(reform.cards.length)
    expect(wrapper.get('.card-indicator').text()).toBe(`1 / ${reform.cards.length}`)

    const badges = wrapper.findAll('.carousel-slide .card-badge').map((badge) => badge.text())
    expect(badges).toEqual(['步骤 1', '危机 1', '步骤 2', '危机 2', '步骤 3', '危机 3'])

    await wrapper.get('.nav-btn.next').trigger('click')
    expect(wrapper.get('.card-indicator').text()).toBe(`2 / ${reform.cards.length}`)
    expect(wrapper.get('.dot.challenge').classes()).toContain('active')

    await wrapper.findAll('.dot')[5].trigger('click')
    expect(wrapper.get('.card-indicator').text()).toBe(`6 / ${reform.cards.length}`)
    expect(wrapper.get('.nav-btn.next').attributes('disabled')).toBeDefined()

    const viewport = wrapper.get('.carousel-viewport')

    await viewport.trigger('pointerdown', { pointerId: 1, pointerType: 'mouse', clientX: 180, clientY: 300 })
    await viewport.trigger('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 300, clientY: 302 })
    await viewport.trigger('pointerup', { pointerId: 1, pointerType: 'mouse', clientX: 300, clientY: 302 })
    expect(wrapper.get('.card-indicator').text()).toBe(`5 / ${reform.cards.length}`)

    await viewport.trigger('touchstart', { touches: [{ clientX: 300, clientY: 300 }] })
    await viewport.trigger('touchmove', { touches: [{ clientX: 160, clientY: 302 }] })
    await viewport.trigger('touchend')
    expect(wrapper.get('.card-indicator').text()).toBe(`6 / ${reform.cards.length}`)

    await viewport.trigger('touchstart', { touches: [{ clientX: 300, clientY: 300 }] })
    await viewport.trigger('touchmove', { touches: [{ clientX: 280, clientY: 302 }] })
    await viewport.trigger('touchend')
    expect(wrapper.get('.card-indicator').text()).toBe(`6 / ${reform.cards.length}`)

    await wrapper.get('.close-btn').trigger('click')
    await wrapper.findAll('.reform-card')[1].trigger('click')
    expect(wrapper.get('.card-indicator').text()).toBe(`1 / ${reform.cards.length}`)
  } finally {
    wrapper.unmount()
  }
})

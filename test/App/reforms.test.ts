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

it('裁驿与历局两项改革：卡片字段完整，可检索并打开', async () => {
  const expected = [
    { id: 'postal-cuts', name: '裁撤驿站', firstTitle: '清理冒滥驿递', keyword: '驿站' },
    { id: 'calendar-bureau', name: '历局修历', firstTitle: '设立历局', keyword: '历局' },
  ]

  for (const item of expected) {
    const reform = REFORM_BROWSE_DATA.find((entry) => entry.id === item.id)
    expect(reform).toBeTruthy()
    expect(reform!.name).toBe(item.name)
    expect(reform!.cards).toHaveLength(6)
    expect(reform!.cards.map((card) => card.kind)).toEqual([
      'step',
      'challenge',
      'step',
      'challenge',
      'step',
      'challenge',
    ])

    for (const card of reform!.cards) {
      expect(card.title.length).toBeGreaterThan(0)
      expect(card.body.length).toBeGreaterThan(0)
      if (card.kind === 'step') {
        expect(card.costGold).toBeTypeOf('number')
        expect(card.costManpower).toBeTypeOf('number')
        expect(card.duration).toBeTypeOf('number')
        expect(card.successRate).toBeTypeOf('number')
        expect(card.boostConditions!.length).toBeGreaterThan(0)
        expect(card.requiredRoles!.length).toBeGreaterThan(0)
      } else {
        expect(card.severity).toBeGreaterThanOrEqual(1)
        expect(card.optionA!.label.length).toBeGreaterThan(0)
        expect(card.optionA!.effect.length).toBeGreaterThan(0)
        expect(card.optionB!.label.length).toBeGreaterThan(0)
        expect(card.optionB!.effect.length).toBeGreaterThan(0)
      }
    }

    const wrapper = mount(ReformPage)
    try {
      await wrapper.get('.search-input').setValue(item.keyword)
      const results = wrapper.findAll('.reform-card')
      expect(results).toHaveLength(1)
      expect(results[0].text()).toContain(item.name)

      await results[0].trigger('click')
      expect(wrapper.get('.detail-title').text()).toBe(item.name)
      expect(wrapper.get('.carousel-slide .card-title').text()).toBe(item.firstTitle)
      expect(wrapper.get('.card-indicator').text()).toBe('1 / 6')
    } finally {
      wrapper.unmount()
    }
  }
})

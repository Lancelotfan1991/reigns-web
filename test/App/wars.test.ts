// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WarPage from '../../src/components/WarPage.vue'
import { WAR_EVENTS, WAR_KIND_META, WAR_KIND_ORDER } from '../../src/data/wars'

it('战事数据覆盖 1627—1644，时间、地点、人物、规模齐全', () => {
  const ids = new Set(WAR_EVENTS.map((event) => event.id))
  expect(ids.size).toBe(WAR_EVENTS.length)
  expect(WAR_EVENTS.length).toBeGreaterThanOrEqual(38)

  for (let year = 0; year <= 17; year += 1) {
    expect(WAR_EVENTS.some((event) => event.year === year)).toBe(true)
  }

  for (const event of WAR_EVENTS) {
    expect(event.title.length).toBeGreaterThan(0)
    expect(event.date.length).toBeGreaterThan(0)
    expect(event.places.length).toBeGreaterThan(0)
    expect(event.sides.length).toBeGreaterThan(1)
    expect(event.scale.length).toBeGreaterThan(0)
    expect(event.process.length).toBeGreaterThan(0)
    expect(event.outcome.length).toBeGreaterThan(0)
    expect(event.aftermath.length).toBeGreaterThan(0)
    expect(event.source.length).toBeGreaterThan(0)
    for (const kind of event.kinds) expect(WAR_KIND_ORDER).toContain(kind)
    for (const side of event.sides) {
      expect(side.name.length).toBeGreaterThan(0)
      expect(side.people.length).toBeGreaterThan(0)
    }
  }

  for (const kind of WAR_KIND_ORDER) {
    expect(WAR_KIND_META[kind].name.length).toBeGreaterThan(0)
  }
})

it('当筛选、搜索与打开战事详情时，页面正确响应', async () => {
  const wrapper = mount(WarPage)
  try {
    expect(wrapper.get('.masthead h1').text()).toBe('战事与民变')
    expect(wrapper.findAll('.war-card')).toHaveLength(WAR_EVENTS.length)
    expect(wrapper.get('.export').text()).toContain('CSV')

    const featured = wrapper
      .findAll('.featured button')
      .find((button) => button.text().includes('车厢峡'))
    expect(featured).toBeTruthy()
    await featured!.trigger('click')
    expect(wrapper.get('.detail h2').text()).toContain('车厢峡')
    await wrapper.get('.detail-close').trigger('click')

    const majorChip = wrapper
      .findAll('.kind-chip')
      .find((button) => button.text().includes('只看大战'))
    expect(majorChip).toBeTruthy()
    await majorChip!.trigger('click')
    const majorCards = wrapper.findAll('.war-card')
    expect(majorCards).toHaveLength(WAR_EVENTS.filter((event) => event.severity === 3).length)
    for (const card of majorCards) expect(card.classes()).toContain('major')
    await majorChip!.trigger('click')

    const rebellion = wrapper
      .findAll('.kind-chip')
      .find((button) => button.text().includes('民变'))
    expect(rebellion).toBeTruthy()
    await rebellion!.trigger('click')

    const cards = wrapper.findAll('.war-card')
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) expect(card.get('.card-kinds').text()).toContain('民变')

    await cards[0].trigger('click')
    expect(wrapper.get('.detail').exists()).toBe(true)
    expect(wrapper.get('.detail h2').text().length).toBeGreaterThan(0)
    expect(wrapper.get('.detail-section .sides').exists()).toBe(true)
    expect(wrapper.text()).toContain('规模')

    await wrapper.get('.detail-close').trigger('click')
    expect(wrapper.find('.detail').exists()).toBe(false)

    await wrapper.get('.reset').trigger('click')
    await wrapper.get('input[type="search"]').setValue('宁远')
    const searched = wrapper.findAll('.war-card')
    expect(searched.length).toBeGreaterThan(0)
    expect(searched.some((card) => card.text().includes('宁远'))).toBe(true)

    await wrapper.get('.reset').trigger('click')
    expect(wrapper.findAll('.war-card')).toHaveLength(WAR_EVENTS.length)
  } finally {
    wrapper.unmount()
  }
})

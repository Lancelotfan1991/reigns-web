// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DisasterPage from '../../src/components/DisasterPage.vue'
import {
  DISASTERS,
  DISASTER_KIND_META,
  DISASTER_KIND_ORDER,
} from '../../src/data/disasters'

it('灾难卡数据覆盖 1627—1644，字段完整且 id 唯一', () => {
  const ids = new Set(DISASTERS.map((disaster) => disaster.id))
  expect(ids.size).toBe(DISASTERS.length)
  expect(DISASTERS.length).toBeGreaterThanOrEqual(60)

  const years = new Set(DISASTERS.map((disaster) => disaster.year))
  for (let year = 0; year <= 17; year += 1) expect(years.has(year)).toBe(true)

  for (const disaster of DISASTERS) {
    expect(disaster.year).toBeGreaterThanOrEqual(0)
    expect(disaster.year).toBeLessThanOrEqual(17)
    expect(disaster.title.length).toBeGreaterThan(0)
    expect(disaster.date.length).toBeGreaterThan(0)
    expect(disaster.kinds.length).toBeGreaterThan(0)
    for (const kind of disaster.kinds) expect(DISASTER_KIND_ORDER).toContain(kind)
    expect(disaster.impact.length).toBeGreaterThan(0)
    expect(disaster.response.length).toBeGreaterThan(0)
    expect(disaster.consequence.length).toBeGreaterThan(0)
    expect(disaster.source.length).toBeGreaterThan(0)
  }

  for (const kind of DISASTER_KIND_ORDER) {
    expect(DISASTER_KIND_META[kind].name.length).toBeGreaterThan(0)
  }
})

it('当按灾种筛选、搜索与打开详情时，灾难卡正确响应', async () => {
  const wrapper = mount(DisasterPage)
  try {
    expect(wrapper.get('.masthead h1').text()).toBe('灾难卡')
    expect(wrapper.findAll('.disaster-card')).toHaveLength(DISASTERS.length)
    expect(wrapper.get('.export').text()).toContain('CSV')

    const plagueChip = wrapper
      .findAll('.kind-chip')
      .find((button) => button.text().includes('瘟疫'))
    expect(plagueChip).toBeTruthy()
    await plagueChip!.trigger('click')

    const plagueCards = wrapper.findAll('.disaster-card')
    expect(plagueCards.length).toBeGreaterThan(0)
    for (const card of plagueCards) expect(card.get('.card-kinds').text()).toContain('瘟疫')

    await plagueCards[0].trigger('click')
    expect(wrapper.get('.detail').exists()).toBe(true)
    expect(wrapper.get('.detail h2').text().length).toBeGreaterThan(0)
    expect(wrapper.get('.detail-section.source').exists()).toBe(true)

    await wrapper.get('.detail-close').trigger('click')
    expect(wrapper.find('.detail').exists()).toBe(false)

    await wrapper.get('.reset').trigger('click')
    await wrapper.get('input[type="search"]').setValue('开封')
    const searched = wrapper.findAll('.disaster-card')
    expect(searched.length).toBeGreaterThan(0)
    expect(searched.some((card) => card.text().includes('开封'))).toBe(true)

    await wrapper.get('.reset').trigger('click')
    expect(wrapper.findAll('.disaster-card')).toHaveLength(DISASTERS.length)
  } finally {
    wrapper.unmount()
  }
})

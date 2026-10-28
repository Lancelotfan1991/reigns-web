// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ReformPlanPage from '../../src/components/ReformPlanPage.vue'
import { REFORM_AGENDA, REFORM_TIERS } from '../../src/data/reformTiers'

it('改革总案是卡片页：分阶、锁定、步骤与挑战都能展开', async () => {
  const wrapper = mount(ReformPlanPage)
  try {
    expect(wrapper.get('h1').text()).toBe('改革总案')
    expect(wrapper.findAll('.tier-tab')).toHaveLength(REFORM_TIERS.length + 1)
    expect(wrapper.findAll('.plan-card')).toHaveLength(REFORM_AGENDA.length)
    expect(wrapper.findAll('.plan-card.locked').length).toBeGreaterThan(0)

    const postal = wrapper.findAll('.plan-card').find((card) => card.text().includes('裁撤驿站'))
    expect(postal).toBeTruthy()
    expect(postal!.classes()).not.toContain('locked')

    await postal!.trigger('click')
    expect(wrapper.find('.detail-sheet').exists()).toBe(true)
    expect(wrapper.get('.detail-sheet').text()).toContain('三步')
    expect(wrapper.get('.detail-sheet').text()).toContain('挑战')
    expect(wrapper.get('.detail-sheet').text()).toContain('清理冒滥驿递')

    await wrapper.get('.detail-close').trigger('click')
    expect(wrapper.find('.detail-sheet').exists()).toBe(false)

    const top = wrapper.findAll('.plan-card').find((card) => card.text().includes('虚君内阁'))
    expect(top).toBeTruthy()
    expect(top!.classes()).toContain('locked')
  } finally {
    wrapper.unmount()
  }
})

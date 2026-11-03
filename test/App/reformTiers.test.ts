// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ReformPage from '../../src/components/ReformPage.vue'
import { REFORM_AGENDA, REFORM_TIERS, tierForReform } from '../../src/data/reformTiers'

it('改革按政治威望分阶，高阶方案在威望不足时锁定', () => {
  expect(REFORM_TIERS.map((tier) => tier.key)).toEqual(['basic', 'middle', 'advanced', 'legendary'])
  expect(REFORM_TIERS.map((tier) => tier.prestige)).toEqual([20, 40, 80, 100])
  expect(tierForReform('postal-cuts').key).toBe('basic')
  expect(tierForReform('open-maritime').key).toBe('middle')
  expect(tierForReform('reduce-clan').key).toBe('advanced')

  expect(REFORM_AGENDA.some((item) => item.name === '废除匠籍')).toBe(true)
  expect(REFORM_AGENDA.some((item) => item.name === '废除八股')).toBe(true)

  const wrapper = mount(ReformPage)
  try {
    const nodes = wrapper.findAll('.tree-node')
    const advanced = nodes.find((node) => node.text().includes('裁减宗室俸禄'))
    const basic = nodes.find((node) => node.text().includes('裁撤驿站'))
    const landSurvey = nodes.find((node) => node.text().includes('清查隐田'))
    expect(advanced).toBeTruthy()
    expect(advanced!.classes()).toContain('locked')
    expect(advanced!.attributes('title')).toContain('需威望 80')
    expect(landSurvey).toBeTruthy()
    expect(landSurvey!.classes()).toContain('locked')
    expect(landSurvey!.attributes('title')).toContain('需威望 60')
    expect(basic).toBeTruthy()
    expect(basic!.classes()).not.toContain('locked')
    expect(wrapper.text()).toContain('已完成 0 / 39')
    expect(wrapper.text()).toContain('废除匠籍')
  } finally {
    wrapper.unmount()
  }
})

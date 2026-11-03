// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ReformPlanPage from '../../src/components/ReformPlanPage.vue'
import { REFORM_AGENDA } from '../../src/data/reformTiers'

it('改革树按分支纵向展示节点，前置未完成与威望不足的节点锁定', async () => {
  const wrapper = mount(ReformPlanPage)
  try {
    expect(wrapper.get('h1').text()).toBe('改革树')
    expect(wrapper.findAll('.tree-canvas')).toHaveLength(1)
    expect(wrapper.findAll('.tree-node').length + wrapper.findAll('.merge-node').length).toBe(
      REFORM_AGENDA.length,
    )
    expect(wrapper.findAll('.tree-node.locked').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.tree-node.open').length).toBeGreaterThan(0)

    const postal = wrapper.findAll('.tree-node').find((node) => node.text().includes('裁撤驿站'))
    expect(postal).toBeTruthy()
    expect(postal!.classes()).toContain('open')

    await postal!.trigger('click')
    expect(wrapper.find('.detail-sheet').exists()).toBe(true)
    expect(wrapper.get('.detail-sheet').text()).toContain('三步')
    expect(wrapper.get('.detail-sheet').text()).toContain('清理冒滥驿递')

    await wrapper.get('.detail-close').trigger('click')
    expect(wrapper.find('.detail-sheet').exists()).toBe(false)

    const top = wrapper.findAll('.tree-node').find((node) => node.text().includes('虚君内阁'))
    expect(top).toBeTruthy()
    expect(top!.classes()).toContain('locked')
  } finally {
    wrapper.unmount()
  }
})

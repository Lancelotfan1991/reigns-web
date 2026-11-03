// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ReformPage from '../../src/components/ReformPage.vue'
import { REFORM_AGENDA } from '../../src/data/reformTiers'

it('改革页只展示改革树，不再堆叠解释性卡片', async () => {
  const wrapper = mount(ReformPage)
  try {
    expect(wrapper.get('.reforms-header h1').text()).toBe('改革')
    expect(wrapper.find('.tree-canvas').exists()).toBe(true)
    expect(wrapper.findAll('.tree-node')).toHaveLength(REFORM_AGENDA.length)
    expect(wrapper.find('.reform-card').exists()).toBe(false)
    expect(wrapper.find('.all-cards').exists()).toBe(false)
    expect(wrapper.find('.tree-hint').exists()).toBe(false)
    expect(wrapper.find('.branch-legend').exists()).toBe(false)

    const postal = wrapper.findAll('.tree-node').find((node) => node.text().includes('裁撤驿站'))
    expect(postal).toBeTruthy()
    await postal!.trigger('click')
    expect(wrapper.find('.detail-sheet').exists()).toBe(true)
    expect(wrapper.get('.detail-sheet').text()).toContain('清理冒滥驿递')
  } finally {
    wrapper.unmount()
  }
})

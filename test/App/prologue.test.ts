// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Prologue from '../../src/components/Prologue.vue'

it('信邸序幕按四页展开，并把四次抉择的影响带入宫中', async () => {
  const wrapper = mount(Prologue)
  try {
    expect(wrapper.get('h1').text()).toBe('信邸承统')
    expect(wrapper.get('.card-name').text()).toBe('病榻托孤')
    expect(wrapper.get('.card-text').text()).toContain('吾弟当为尧舜')
    expect(wrapper.get('.card-text').text()).toContain('善事中宫')

    const names: string[] = []
    for (let index = 0; index < 4; index += 1) {
      names.push(wrapper.get('.card-name').text())
      await wrapper.get('.prologue-choice.left').trigger('click')
      expect(wrapper.get('.response').text().length).toBeGreaterThan(0)
      await wrapper.get('.prologue-next').trigger('click')
    }

    expect(names).toEqual(['病榻托孤', '遗诏迎立', '三辞三让', '袖饼入宫'])
    expect(wrapper.emitted('done')?.[0]?.[0]).toMatchObject({
      court: 8,
      people: 7,
    })
  } finally {
    wrapper.unmount()
  }
})

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import VerdictSheet from '../../src/components/VerdictSheet.vue'
import type { LifeVerdict, Verdict } from '../../src/types'

const WEI: LifeVerdict = {
  charId: 'wei',
  name: '魏忠贤',
  alias: '九千岁',
  role: '司礼监秉笔太监、提督东厂。生祠遍天下',
  camp: '内廷',
  status: 'dead',
  seal: '缢',
  note: '宫门有己人、文书照章程：你先免崔呈秀，逮牌出宫，他夜缢于阜城旅邸',
  pending: false,
  other: { seal: '留', status: 'alive' },
}

const XIONG: LifeVerdict = {
  ...WEI,
  charId: 'xiongwenchan',
  name: '熊文灿',
  alias: '五省总督',
  role: '主抚之人。以「抚局大好」入告',
  seal: '弃市',
  note: '抚局败露，谷城复叛之罪尽归督臣：逮至京师，诏狱鞫治，弃市',
  pending: true,
}

function sheet(life: LifeVerdict | null) {
  const verdict: Verdict = {
    cardName: '谷城安置要查到户',
    choiceLabel: '按原营交粮，先稳住头领',
    response: '官府把粮集中交给旧头领，省了分送各户和逐户查验的费用。',
    when: '崇祯十二年 第 2 / 5 议',
    chapter: null,
    lines: [{ key: 'gold', from: 52, to: 58 }],
    life,
    ended: false,
  }
  return mount(VerdictSheet, { props: { verdict } })
}

describe('生死页版式', () => {
  it('判了生死的议换下题签，只以人名、印文与下落当页', () => {
    const wrapper = sheet(WEI)
    expect(wrapper.get('.tag').text()).toBe('生死')
    expect(wrapper.find('.life').exists()).toBe(true)
    expect(wrapper.find('.name').exists()).toBe(false)
    expect(wrapper.get('.who').text()).toContain('魏忠贤')
    expect(wrapper.get('.seal-word').text()).toBe('缢')
    expect(wrapper.get('.fate').text()).toContain('夜缢于阜城旅邸')
    expect(wrapper.get('.not-taken').text()).toBe('不采 · 留（生）')
    expect(wrapper.find('.later').exists()).toBe(false)
  })

  it('双字印文收小以免溢出方印', () => {
    const wrapper = sheet(XIONG)
    const seal = wrapper.get('.seal-word')
    expect(seal.classes()).toContain('two')
    expect(seal.text()).toBe('弃市')
  })

  it('后日之判要点明此刻人尚在，免得读成已死', () => {
    const wrapper = sheet(XIONG)
    expect(wrapper.get('.later').text()).toContain('此刻人尚在')
  })

  it('未判生死的议仍是通用批红一页', () => {
    const wrapper = sheet(null)
    expect(wrapper.get('.tag').text()).toBe('批红')
    expect(wrapper.find('.life').exists()).toBe(false)
    expect(wrapper.get('.name').text()).toBe('谷城安置要查到户')
    expect(wrapper.get('.chosen').text()).toBe('按原营交粮，先稳住头领')
  })
})

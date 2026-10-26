import { describe, expect, it } from 'vitest'
import { CHARACTERS } from '../../src/data/characters'

const byId = (id: string) => CHARACTERS.find((character) => character.id === id)

describe('人物生平轨迹', () => {
  it('新补录的明末人物都写有至少一条生平', () => {
    const ids = [
      'caowenzhao',
      'caobianjiao',
      'zhouyuji',
      'huangdegong',
      'zhuxieyuan',
      'chenqiyu',
      'fuzonglong',
      'wangqiaonian',
      'yangwenyue',
      'wentiren',
      'qianqianyi',
      'liuzongzhou',
      'niyuanlu',
      'libanghua',
      'fanjingwen',
      'chenzilong',
      'shangkexi',
      'fanwencheng',
      'luorucai',
      'lidingguo',
      'shikefa',
    ]
    for (const id of ids) {
      expect(byId(id), id).toBeTruthy()
      expect(byId(id)?.track?.length, id).toBeGreaterThan(0)
    }
  })

  it('满桂、吴三桂与赵率教都有完整的生平节点', () => {
    const mangui = byId('mangui')
    const wusangui = byId('wusanggui')
    const zhaoshuajiao = byId('zhaoshuajiao')
    expect(mangui?.track?.length).toBeGreaterThanOrEqual(3)
    expect(wusangui?.track?.length).toBeGreaterThanOrEqual(6)
    expect(zhaoshuajiao?.track?.length).toBeGreaterThanOrEqual(2)

    expect(mangui?.track?.some((entry) => entry.note.includes('宁锦'))).toBe(true)
    expect(mangui?.track?.some((entry) => entry.note.includes('永定门'))).toBe(true)
    expect(wusangui?.track?.some((entry) => entry.note.includes('山海关'))).toBe(true)
    expect(wusangui?.track?.some((entry) => entry.note.includes('永历'))).toBe(true)
    expect(zhaoshuajiao?.track?.some((entry) => entry.note.includes('锦州'))).toBe(true)
    expect(zhaoshuajiao?.track?.some((entry) => entry.note.includes('遵化'))).toBe(true)
  })
})

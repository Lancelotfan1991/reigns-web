import { describe, expect, it } from 'vitest'
import { CORE_CHARACTERS, CORE_CHARACTER_IDS, CORE_ROSTER } from '../../src/data/characters'

describe('核心人物速查', () => {
  it('核心人物都来自正式人物表，且没有重复', () => {
    expect(new Set(CORE_CHARACTER_IDS).size).toBe(CORE_CHARACTER_IDS.length)
    expect(CORE_CHARACTERS).toHaveLength(CORE_ROSTER.length)
    for (const character of CORE_CHARACTERS) {
      expect(character.name.length).toBeGreaterThan(0)
      expect(CORE_ROSTER.some((ref) => ref.id === character.id)).toBe(true)
    }
    for (const name of ['李自成', '孙承宗', '袁崇焕', '张献忠', '徐光启', '温体仁', '杨嗣昌', '卢象升']) {
      expect(CORE_CHARACTERS.some((character) => character.name === name), name).toBe(true)
    }
  })
})

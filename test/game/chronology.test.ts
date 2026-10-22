import { describe, expect, it } from 'vitest'
import { CHAPTERS, CHRONOLOGY, EVENT_SLOT, KEY_YEARS, yearOf } from '../../src/data/chapters'

describe('真实纪年牌序', () => {
  it('当序幕与宫门定策接入时，所有步骤按年与年内次序连续排列，不设每年步数上限', () => {
    const xinwang = CHAPTERS.find((chapter) => chapter.id === 'xinwang')
    const wei = CHAPTERS.find((chapter) => chapter.id === 'wei')
    expect(xinwang?.steps).toHaveLength(4)
    expect(wei?.steps).toHaveLength(7)

    const preludeKeys = ['prelude-bingta', 'prelude-yizhao', 'prelude-quanjin', 'prelude-maibing'].map(
      (id) => EVENT_SLOT[id],
    )
    const weiKey = EVENT_SLOT['s-tuogu']
    expect(Math.min(...preludeKeys)).toBeLessThan(weiKey)
    expect(Math.max(...preludeKeys)).toBeLessThan(weiKey)

    const yearZero = CHRONOLOGY.filter((entry) => entry.year === 0)
    expect(yearZero).toHaveLength(11)
    expect(yearZero.map((entry) => entry.key)).toEqual([...Array(11).keys()])
    expect(yearOf(0)).toBe(0)
    expect(yearOf(10)).toBe(0)
    expect(yearOf(11)).toBe(1)
    expect(KEY_YEARS).toHaveLength(CHRONOLOGY.length)
  })

  it('多步篇章逐步写明纪年，不靠起始年份加步骤推算', () => {
    for (const chapter of CHAPTERS.filter((item) => item.steps.length > 1)) {
      expect(chapter.stepTimes, chapter.name).toHaveLength(chapter.steps.length)
    }
  })
})

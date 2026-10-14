import type { ChapterTime } from '../types'

/** 每年五个编年槽位：篇章时间 (year, order) 的刻度。议数不定额，由篇章直排决定 */
export const YEAR_SLOTS = 5

/** 甲申年：终章所在之年；此前每跨一年结算一次岁耗 */
export const FINALE_YEAR = 17

/** 编年键 → 年份编号（0 = 天启七年，N = 崇祯N年） */
export function yearOf(key: number): number {
  return Math.floor(key / YEAR_SLOTS)
}

/** 年份 + 年内序号 → 编年键 */
export function slotOfPosition(year: number, order: number): number {
  return year * YEAR_SLOTS + (order - 1)
}

/** 篇章时间 → 起始编年键；步骤逐键递进 */
export function chapterStart(time: ChapterTime): number {
  return slotOfPosition(time.year, time.order)
}
